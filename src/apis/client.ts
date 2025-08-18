// Copyright Mia srl
// SPDX-License-Identifier: Apache-2.0
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import path from 'node:path'

import { UndiciHeaders } from 'undici/types/dispatcher'
import {
  CatalogItemRelease,
  CatalogVersionedItem,
  ConfigMaps,
  ConfigServiceSecrets,
  constants,
  CustomService,
  EnvironmentVariablesTypes,
  ICatalogExample,
  ICatalogPlugin,
  ICatalogTemplate,
  IProject,
  Listeners,
} from '@mia-platform/console-types'

import { HTTPClient } from './http-client'
import { BackendClient, BackendClientInternal } from './backendClient'
import { CompareForDeployResponse, PipelineStatus, TriggerDeployResponse } from './types/deploy'
import {
  Config,
  ConfigToSave,
  DockerSuggestionPrefix,
  ResourcesToCreate,
  RetrievedConfiguration,
  SaveConfigurationOptions,
  SaveResponse,
} from './types/configuration'
import { DeployClient, DeployClientInternal } from './deployClient'
import { FeatureToggleClient, FeatureToggleClientInternal } from './featureToggleClient'
import { IAMClient, IAMClientInternal } from './iamClient'
import { KubernetesClient, KubernetesClientInternal } from './kubernetesClient'
import { MarketplaceClient, MarketplaceClientInternal } from './marketplaceClient'
import { PostProject, Template } from './types/governance'

export const DEFAULT_DOCUMENTATION_PATH = '/documentation/json'
const ENABLE_ENVIRONMENT_BASED_CONFIGURATION_MANAGEMENT = 'ENABLE_ENVIRONMENT_BASED_CONFIGURATION_MANAGEMENT'
const { DOCKER_IMAGE_NAME_SUGGESTION_TYPES, ServiceTypes } = constants

export class APIClient {
  #backendClient: BackendClient
  #deployClient: DeployClient
  #featureFlagsClient: FeatureToggleClient
  #kubernetesClient: KubernetesClient
  #iamClient: IAMClient
  #marketplaceClient: MarketplaceClient

  constructor (
    baseURL: string,
    clientID?: string,
    clientSecret?: string,
    additionalHeaders: UndiciHeaders = {},
  ) {
    if (baseURL) {
      const client = new HTTPClient(baseURL, clientID, clientSecret, additionalHeaders)
      this.#backendClient = new BackendClient(client)
      this.#deployClient = new DeployClient(client)
      this.#featureFlagsClient = new FeatureToggleClient(client)
      this.#iamClient = new IAMClient(client)
      this.#kubernetesClient = new KubernetesClient(client)
      this.#marketplaceClient = new MarketplaceClient(client)
      return
    }

    this.#backendClient = BackendClientInternal(clientID, clientSecret, additionalHeaders)
    this.#deployClient = DeployClientInternal(clientID, clientSecret, additionalHeaders)
    this.#featureFlagsClient = FeatureToggleClientInternal(clientID, clientSecret, additionalHeaders)
    this.#kubernetesClient = KubernetesClientInternal(clientID, clientSecret, additionalHeaders)
    this.#iamClient = IAMClientInternal(clientID, clientSecret, additionalHeaders)
    this.#marketplaceClient = MarketplaceClientInternal(clientID, clientSecret, additionalHeaders)
  }

  async isAiFeaturesEnabledForTenant (tenantId: string): Promise<boolean> {
    const tenantRules = await this.#backendClient.getCompanyRules(tenantId)
    if (!tenantRules || !tenantRules['aiFeaturesEnabled']) {
      return false
    }

    return Boolean(tenantRules['aiFeaturesEnabled'])
  }

  async listCompanies (): Promise<Record<string, unknown>[]> {
    return await this.#backendClient.listCompanies()
  }

  async companyTemplates (tenantID: string): Promise<Template[]> {
    return await this.#backendClient.companyTemplates(tenantID)
  }

  async companyIAMIdentities (tenantID: string, type?: string): Promise<Record<string, unknown>[]> {
    return await this.#iamClient.companyIAMIdentities(tenantID, type)
  }

  async companyAuditLogs (tenantID: string, from?: string, to?: string): Promise<Record<string, unknown>[]> {
    return await this.#iamClient.companyAuditLogs(tenantID, from, to)
  }

  async listProjects (tenantIDs: string[], search?: string): Promise<Record<string, unknown>[]> {
    return await this.#backendClient.listProjects(tenantIDs, search)
  }

  async projectInfo (projectID: string): Promise<IProject> {
    return await this.#backendClient.projectInfo(projectID)
  }

  async createProjectFromTemplate (
    tenantID: string,
    projectName: string,
    templateID: string,
    description?: string,
  ): Promise<Record<string, unknown>> {
    const projectID = projectName.replace(/\s+/g, '-').toLowerCase()
    const draftResponse = await this.#backendClient.projectDraft(tenantID, projectID, templateID, projectName, description)

    const body: PostProject = {
      name: projectName,
      ...description && { description },
      tenantId: tenantID,
      environments: draftResponse.environments || [],
      configurationGitPath: draftResponse.repository?.gitPath || '',
      projectId: projectID,
      templateId: templateID,
      visibility: draftResponse.repository?.visibility || '',
      providerId: draftResponse.repository?.providerId || '',
      pipelines: draftResponse.pipelines,
      enableConfGenerationOnDeploy: true,
    }

    return await this.#backendClient.createProject(body)
  }

  async createServiceFromMarketplaceItem (
    projectID: string,
    name: string,
    refID: string,
    marketplaceItemID: string,
    marketplaceItemTenantID: string,
    marketplaceItemVersion?: string,
    description?: string,
  ): Promise<SaveResponse> {
    const project = await this.#backendClient.projectInfo(projectID)
    const marketplaceItem = await this.marketplaceItemInfo(
      marketplaceItemTenantID,
      marketplaceItemID,
      marketplaceItemVersion,
    )

    const supportedTypes = [ 'plugin', 'template', 'example' ]
    if (!supportedTypes.includes(marketplaceItem.type)) {
      throw new Error(`Cannot create a new service from marketplace item ${marketplaceItemID}: ${marketplaceItem.type} is invalid`)
    }

    const resourcesToCreate = await this.#resourceToCreateFromMarketplaceItem(
      project,
      marketplaceItem,
      name,
      description,
    )

    return await this.saveConfiguration(projectID, refID, resourcesToCreate, {
      throwIfServiceAlreadyExists: true,
    })
  }

  async getConfiguration (prjID: string, refID: string): Promise<RetrievedConfiguration> {
    const ft = await this.#featureFlagsClient.getToggles(prjID, [ ENABLE_ENVIRONMENT_BASED_CONFIGURATION_MANAGEMENT ])
    if (ft[ENABLE_ENVIRONMENT_BASED_CONFIGURATION_MANAGEMENT] || false) {
      return this.#backendClient.getEnvironmentBasedConfiguration(prjID, refID)
    }

    return this.#backendClient.getRevisionBasedConfiguration(prjID, refID)
  }

  async saveConfiguration (
    prjID: string,
    refID: string,
    resourcesToCreate: ResourcesToCreate,
    options?: SaveConfigurationOptions,
  ): Promise<SaveResponse> {
    const tf = await this.#featureFlagsClient.getToggles(prjID, [ ENABLE_ENVIRONMENT_BASED_CONFIGURATION_MANAGEMENT ])
    let currentConfig: RetrievedConfiguration
    if (tf[ENABLE_ENVIRONMENT_BASED_CONFIGURATION_MANAGEMENT] || false) {
      currentConfig = await this.#backendClient.getEnvironmentBasedConfiguration(prjID, refID)
    } else {
      currentConfig = await this.#backendClient.getRevisionBasedConfiguration(prjID, refID)
    }

    const mergedConfigWithResourceToCreate = mergeConfigWithResources(currentConfig, resourcesToCreate, options)
    const newConfig: ConfigToSave = {
      title: '[mcp] created resources',
      fastDataConfig: currentConfig.fastDataConfig,
      microfrontendPluginsConfig: currentConfig.microfrontendPluginsConfig || {},
      extensionsConfig: currentConfig.extensionsConfig || { files: {} },
      config: mergedConfigWithResourceToCreate,
      previousSave: currentConfig.commitId,
      deletedElements: {},
    }

    if (tf[ENABLE_ENVIRONMENT_BASED_CONFIGURATION_MANAGEMENT] || false) {
      return this.#backendClient.saveEnvironmentBasedConfiguration(prjID, refID, newConfig)
    }

    return this.#backendClient.saveRevisionBasedConfiguration(prjID, refID, newConfig)
  }

  async getConfigurationRevisions (projectID: string): Promise<Record<string, unknown>> {
    const revisions = await this.#backendClient.getProjectRevisions(projectID)
    const versions = await this.#backendClient.getProjectVersions(projectID)
    return {
      revisions,
      versions,
    }
  }

  async deployProjectEnvironmentFromRevision (
    projectID: string,
    environment: string,
    revision: string,
    revisionType: string,
  ): Promise<TriggerDeployResponse> {
    return await this.#deployClient.triggerDeploy(projectID, environment, revision, revisionType)
  }

  async compareProjectEnvironmentFromRevisionForDeploy (
    projectID: string,
    environment: string,
    revision: string,
    revisionType: string,
  ): Promise<CompareForDeployResponse> {
    return await this.#deployClient.compareForDeploy(projectID, environment, revision, revisionType)
  }

  async waitProjectDeployForCompletion (
    projectID: string,
    pipelineID: string,
    timeout = 5 * 60 * 1000,
    interval = 5000,
  ): Promise<PipelineStatus> {
    return await this.#deployClient.waitForPipelineCompletion(projectID, pipelineID, timeout, interval)
  }

  async listPods (projectID: string, environmentID: string): Promise<Record<string, unknown>[]> {
    return await this.#kubernetesClient.listPods(projectID, environmentID)
  }

  async podLogs (
    projectID: string,
    environmentID: string,
    podName: string,
    containerName: string,
    lines?: number,
  ): Promise<string> {
    return await this.#kubernetesClient.podLogs(projectID, environmentID, podName, containerName, lines)
  }

  async listMarketplaceItems (tenantID?: string, type?: string, search?: string): Promise<Record<string, unknown>[]> {
    return this.#marketplaceClient.listMarketplaceItems(tenantID, type, search)
  }

  async marketplaceItemVersions (tenantID: string, itemID: string): Promise<CatalogItemRelease[]> {
    return this.#marketplaceClient.marketplaceItemVersions(tenantID, itemID)
  }

  async marketplaceItemInfo (tenantID: string, itemID: string, version?: string): Promise<CatalogVersionedItem> {
    return this.#marketplaceClient.marketplaceItemInfo(tenantID, itemID, version)
  }

  async #resourceToCreateFromMarketplaceItem (
    project: IProject,
    marketplaceItem: CatalogVersionedItem,
    name: string,
    description?: string,
  ): Promise<ResourcesToCreate> {
    let resourcesToCreate: ResourcesToCreate
    switch (marketplaceItem.type) {
      case 'plugin':
        resourcesToCreate = servicePayloadFromMarketplaceItem(marketplaceItem as ICatalogPlugin.Item, name, description)
        break
      case 'template':
      case 'example': {
        const projectGroup = await this.#serviceGitGroupPath(project._id, project.configurationGitPath)
        const imageName = generateImageName(name, project, projectGroup)
        const item = marketplaceItem as ICatalogTemplate.Item | ICatalogExample.Item
        const repositoryInfos = await this.#createRepositoryForMarketplaceItem(
          item,
          project,
          name,
          imageName,
          projectGroup,
          description,
        )
        resourcesToCreate = await servicePayloadFromMarketplaceItem(
          item,
          name,
          description,
          repositoryInfos['dockerImage'] as string,
          repositoryInfos['webUrl'] as string,
          repositoryInfos['sshUrl'] as string,
        )
        break
      }

      default:
        throw new Error(`Not supported marketplace item type: ${marketplaceItem.type}`)
    }

    return resourcesToCreate
  }

  async #serviceGitGroupPath (projectID: string, projectGitPath: string): Promise<string> {
    const projectGroups = await this.#backendClient.projectGitProviderGroups(projectID, path.dirname(projectGitPath))
    let groupName: string | undefined
    if (projectGroups.length > 1) {
      for (const projectGroup of projectGroups) {
        if ((projectGroup['full_path'] as string).endsWith('/services')) {
          groupName = projectGroup['full_path'] as string
          break
        }
      }
    }
    if (!groupName) {
      groupName = projectGroups[0]['full_path'] as string
    }

    if (!groupName) {
      throw new Error('No group found for the project')
    }

    return groupName
  }

  #createRepositoryForMarketplaceItem (
    item: ICatalogTemplate.Item | ICatalogExample.Item,
    project: IProject,
    name: string,
    imageName: string,
    projectGroup: string,
    description?: string,
  ): Promise<Record<string, unknown>> {
    const serviceToCreateItemKey = Object.keys(item.resources?.services || {})?.[0]
    if (!serviceToCreateItemKey) {
      throw new Error('No service found in the marketplace item')
    }

    const serviceToCreate = item.resources?.services?.[serviceToCreateItemKey]
    if (!serviceToCreate) {
      throw new Error('No service found in the marketplace item')
    }

    const projectProviderType = project.pipelines?.type
    if (!projectProviderType) {
      throw new Error('No provider type found for the project')
    }

    let pipeline: string | undefined
    if (serviceToCreate.pipelines) {
      if (projectProviderType in serviceToCreate.pipelines) {
        pipeline = projectProviderType
      }
    }

    const containerRegistryId = project.containerRegistries?.filter((registry) => registry.isDefault)[0]?.id

    return this.#backendClient.createRepository(
      project._id,
      item._id,
      name,
      serviceToCreateItemKey,
      projectGroup,
      imageName,
      containerRegistryId,
      pipeline,
      serviceToCreate.defaultConfigMaps,
      serviceToCreate.defaultSecrets,
      description,
    )
  }
}

function mergeConfigWithResources (previousConfig: Config, resourcesToCreate: ResourcesToCreate, options?: SaveConfigurationOptions): Config {
  const { services, serviceAccounts, configMaps, serviceSecrets } = resourcesToCreate
  const {
    services: previousServices,
    configMaps: previousConfigMaps,
    serviceAccounts: previousServiceAccounts,
    serviceSecrets: previousServiceSecrets,
  } = previousConfig

  if (options?.throwIfServiceAlreadyExists) {
    // throw an error if a service already exists with the same name
    Object.keys(services || {}).forEach((serviceName) => {
      if (previousServices[serviceName]) {
        throw new Error(`Service ${serviceName} already exists`)
      }
    })
  }

  return {
    ...previousConfig,
    services: {
      ...previousServices,
      ...services,
    },
    configMaps: {
      ...previousConfigMaps,
      ...configMaps,
    },
    serviceSecrets: {
      ...previousServiceSecrets,
      ...serviceSecrets,
    },
    serviceAccounts: {
      ...previousServiceAccounts,
      ...serviceAccounts,
    },
    listeners: {
      ...previousConfig.listeners,
      ...resourcesToCreate.listeners,
    },
    endpoints: {
      ...previousConfig.endpoints,
      ...resourcesToCreate.endpoints,
    },
    collections: {
      ...previousConfig.collections,
      ...resourcesToCreate.collections,
    },
  }
}

export function servicePayloadFromMarketplaceItem (
  item: ICatalogPlugin.Item | ICatalogTemplate.Item | ICatalogExample.Item,
  name: string,
  description?: string,
  dockerImageName?: string,
  repoUrl?: string,
  sshUrl?: string,
): ResourcesToCreate {
  const serviceToCreateItemKey = Object.keys(item.resources?.services || {})?.[0]
  if (!serviceToCreateItemKey) {
    throw new Error('No service found in the marketplace item')
  }

  const serviceToCreate = item.resources?.services?.[serviceToCreateItemKey]
  if (!serviceToCreate) {
    throw new Error('No service found in the marketplace item')
  }

  const {
    defaultEnvironmentVariables = [],
    defaultResources,
    dockerImage,
    defaultProbes,
    defaultTerminationGracePeriodSeconds,
    defaultMonitoring,
    defaultConfigMaps = [],
    defaultSecrets = [],
    defaultDocumentationPath,
    mapEnvVarToMountPath,
    componentId,
    containerPorts = [],
    defaultArgs,
    defaultLogParser = constants.MIA_LOG_PARSER_JSON,
  } = serviceToCreate
  const serviceAccountName = name
  let listenersToCreate: Listeners | undefined

  let service: CustomService = {
    name,
    type: ServiceTypes.CUSTOM,
    tags: [ ServiceTypes.CUSTOM ],
    ...description && { description },
    advanced: false,
    ...componentId && { sourceComponentId: componentId },
    dockerImage: dockerImageName || dockerImage || '',
    ...repoUrl && { repoUrl },
    ...sshUrl && { sshUrl },
    sourceMarketplaceItem: {
      itemId: item.itemId,
      tenantId: item.tenantId,
      version: item.version?.name || 'NA',
    },
    ...mapEnvVarToMountPath && { mapEnvVarToMountPath },
    environment: defaultEnvironmentVariables.map((env) => {
      switch (env.valueType) {
        case 'plain':
          return {
            ...env,
            value: env.value || '',
            valueType: EnvironmentVariablesTypes.PLAIN_TEXT,
          }
        case 'secret':
          return {
            ...env,
            valueType: EnvironmentVariablesTypes.FROM_SECRET,
          }
        case 'downwardAPI':
          return {
            ...env,
            valueType: EnvironmentVariablesTypes.DOWNWARD_API,
          }
      }
    }),
    logParser: defaultLogParser,
    ...defaultResources && { resources: defaultResources },
    ...defaultProbes && { probes: defaultProbes },
    serviceAccountName,
    ...defaultMonitoring && { monitoring: defaultMonitoring },
    ...defaultTerminationGracePeriodSeconds && { terminationGracePeriodSeconds: defaultTerminationGracePeriodSeconds },
    replicas: 1,
    swaggerPath: defaultDocumentationPath !== ''
      ? defaultDocumentationPath || DEFAULT_DOCUMENTATION_PATH
      : '',
    ...defaultConfigMaps.length > 0
      ? { configMaps: defaultConfigMaps.map((configMap) => {
        const { name, usePreserve, mountPath, viewAsReadOnly, link, files } = configMap
        if (!usePreserve) {
          return {
            name,
            mountPath,
            viewAsReadOnly: !!viewAsReadOnly,
            ...link && { link },
          }
        }

        const subPaths = files.
          filter((file) => !file.deleted).
          map((file) => file.name)

        return { name, mountPath, viewAsReadOnly, link, subPaths }
      }) }
      : {},
    ...defaultSecrets.length > 0
      ? { secrets: defaultSecrets.map((config) => {
        const { name, mountPath } = config
        return { name, mountPath }
      }) }
      : {},
    ...containerPorts && { containerPorts },
  }

  if (item.type === 'plugin') {
    const {
      links,
      tags,
      execPreStop,
      args,
      additionalContainers,
    } = serviceToCreate as ICatalogPlugin.Resources['services'][string]
    listenersToCreate = item.resources?.listeners

    service = {
      ...service,
      links,
      ...tags && { tags },
      ...execPreStop && { execPreStop },
      ...args && { args },
      ...additionalContainers && { additionalContainers: additionalContainers.map((container) => {
        const {
          args,
          containerPorts,
          defaultArgs,
          defaultEnvironmentVariables,
          defaultProbes,
          defaultResources,
          description,
          dockerImage,
          name,
        } = container
        return {
          name,
          dockerImage,
          ...description && { description },
          ...args && { args },
          ...defaultArgs && { args: defaultArgs },
          ...containerPorts && { containerPorts },
          ...defaultResources && { resources: defaultResources },
          ...defaultProbes && { probes: defaultProbes },
          environment: defaultEnvironmentVariables?.map((env) => ({
            ...env,
            value: env.value || '',
            valueType: EnvironmentVariablesTypes.PLAIN_TEXT,
          })),
        }
      }) },
    }
  }

  service = {
    ...service,
    ...defaultArgs && { args: defaultArgs },
  }

  const createdConfigMaps: ConfigMaps = defaultConfigMaps.reduce((acc, configMap) => {
    return {
      ...acc,
      [configMap.name]: {
        name: configMap.name,
        files: configMap.files.map((file) => ({
          name: file.name,
          content: file.content,
        })),
      },
    }
  }, {} as ConfigMaps)

  const createdSecrets = defaultSecrets.reduce((acc, secret) => {
    return {
      ...acc,
      [secret.name]: {
        name: secret.name,
      },
    }
  }, {} as ConfigServiceSecrets)

  return {
    services: {
      [name]: service,
    },
    serviceAccounts: {
      [serviceAccountName]: { name: serviceAccountName },
    },
    configMaps: createdConfigMaps,
    serviceSecrets: createdSecrets,
    listeners: listenersToCreate,
  }
}

export function generateImageName (name: string, project: IProject, groupName: string): string {
  if (project.dockerImageNameSuggestion) {
    switch (project.dockerImageNameSuggestion.type) {
      case DOCKER_IMAGE_NAME_SUGGESTION_TYPES.PROJECT_ID:
        return `${project.projectId}/${name}`
      case DOCKER_IMAGE_NAME_SUGGESTION_TYPES.REPOSITORY:
        return `${groupName}/${name}`
      case DOCKER_IMAGE_NAME_SUGGESTION_TYPES.CONSTANT_PREFIX:
        return `${(project.dockerImageNameSuggestion as DockerSuggestionPrefix).prefix}/${name}`
    }
  }

  return name
}
