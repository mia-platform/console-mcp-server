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
  CatalogItemTypeDefinition,
  CatalogVersionedItem,
  ConfigMaps,
  ConfigServiceSecrets,
  constants,
  CrudEndpoint,
  CustomEndpoint,
  CustomService,
  EnvironmentVariablesTypes,
  ICatalogExample,
  ICatalogPlugin,
  ICatalogTemplate,
  IProject,
  ITenant,
  Listeners,
} from '@mia-platform/console-types'

import { HTTPClient } from './http-client'
import { BackendClient, BackendClientInternal } from './backendClient'
import { CompareForDeployResponse, PipelineStatus, TriggerDeployResponse } from './types/deploy'
import { DeployClient, DeployClientInternal } from './deployClient'
import { FeatureToggleClient, FeatureToggleClientInternal } from './featureToggleClient'
import { IAMClient, IAMClientInternal } from './iamClient'
import { KubernetesClient, KubernetesClientInternal } from './kubernetesClient'
import { MarketplaceClient, MarketplaceClientInternal } from './marketplaceClient'
import { PostProject, Template } from './types/governance'

import {
  MarketplaceApplyItemsRequest,
  MarketplaceApplyItemsResponse,
  MarketplaceUploadFileResponse,
  SoftwareCatalogCategory,
} from './types/marketplace'

import {
  Config,
  ConfigToSave,
  DockerSuggestionPrefix,
  ResourcesToCreate,
  RetrievedConfiguration,
  SaveConfigurationOptions,
  SaveResponse,
} from './types/configuration'

export const DEFAULT_DOCUMENTATION_PATH = '/documentation/json'
const ENABLE_ENVIRONMENT_BASED_CONFIGURATION_MANAGEMENT = 'ENABLE_ENVIRONMENT_BASED_CONFIGURATION_MANAGEMENT'
const { DOCKER_IMAGE_NAME_SUGGESTION_TYPES, ServiceTypes, EndpointTypes, Verbs } = constants

interface AISettings {
  enableAgenticFeatures?: boolean
}

interface TenantRules {
  aiSettings?: AISettings
}

export interface IAPIClient {
  // #region Utility Methods
  isAiFeaturesEnabledForTenant(tenantId: string): Promise<boolean>
  // #endregion

  // #region Governance Methods
  listCompanies(): Promise<ITenant[]>
  companyTemplates(tenantID: string): Promise<Template[]>
  companyIAMIdentities(tenantID: string, type?: string): Promise<Record<string, unknown>[]>
  companyAuditLogs(tenantID: string, from?: string, to?: string): Promise<Record<string, unknown>[]>

  listProjects(tenantIDs: string[], search?: string): Promise<Record<string, unknown>[]>
  projectInfo(projectID: string): Promise<IProject>
  createProjectFromTemplate(
    tenantID: string,
    projectName: string,
    templateID: string,
    description?: string,
  ): Promise<Record<string, unknown>>
  // #endregion

  // #region Configuration Methods
  getConfigurationRevisions(projectId: string): Promise<Record<string, unknown>>
  getConfiguration(projectId: string, refId: string): Promise<RetrievedConfiguration>
  saveConfiguration(
    projectId: string,
    refId: string,
    resourcesToCreate: ResourcesToCreate,
    options?: SaveConfigurationOptions,
  ): Promise<SaveResponse>
  createServiceFromMarketplaceItem(
    projectID: string,
    name: string,
    refID: string,
    marketplaceItemID: string,
    marketplaceItemTenantID: string,
    marketplaceItemVersion?: string,
    description?: string,
  ): Promise<SaveResponse>
  createEndpoints(
    projectID: string,
    refID: string,
    endpointType: 'custom' | 'crud',
    endpointName: string,
    endpointTarget: string,
  ): Promise<SaveResponse>
  // #endregion

  // #region Deploy Methods
  deployProjectEnvironmentFromRevision(
    projectID: string,
    environment: string,
    revision: string,
    revisionType: string,
  ): Promise<TriggerDeployResponse>
  compareProjectEnvironmentFromRevisionForDeploy(
    projectID: string,
    environment: string,
    revision: string,
    revisionType: string,
  ): Promise<CompareForDeployResponse>
  waitProjectDeployForCompletion(
    projectID: string,
    pipelineID: string,
    timeout?: number,
    interval?: number,
  ): Promise<PipelineStatus>
  // #endregion

  // #region Runtime Methods
  listPods(projectID: string, environmentID: string): Promise<Record<string, unknown>[]>
  podLogs(
    projectID: string,
    environmentID: string,
    podName: string,
    containerName: string,
    lines?: number,
  ): Promise<string>
  // #endregion

  // #region Marketplace Methods
  listMarketplaceItems(tenantID?: string, type?: string, search?: string): Promise<Record<string, unknown>[]>
  marketplaceItemVersions(tenantID: string, itemID: string): Promise<CatalogItemRelease[]>
  marketplaceItemInfo(tenantID: string, itemID: string, version?: string): Promise<CatalogVersionedItem>
  listMarketplaceItemTypeDefinitions(namespace?: string, name?: string, displayName?: string): Promise<CatalogItemTypeDefinition[]>
  marketplaceItemTypeDefinitionInfo (tenantID: string, name: string): Promise<CatalogItemTypeDefinition>
  getMarketplaceCategories(): Promise<SoftwareCatalogCategory[]>
  applyMarketplaceItems(tenantID: string, items: MarketplaceApplyItemsRequest): Promise<MarketplaceApplyItemsResponse>
  upsertItemTypeDefinition(tenantID: string, definition: CatalogItemTypeDefinition): Promise<CatalogItemTypeDefinition>
  uploadMarketplaceFile(tenantID: string, formData: FormData): Promise<MarketplaceUploadFileResponse>
  // #endregion
}

export class APIClient implements IAPIClient {
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
    const tenantRules: TenantRules = await this.#backendClient.getCompanyRules(tenantId)
    return tenantRules?.aiSettings?.enableAgenticFeatures || false
  }

  async listCompanies (): Promise<ITenant[]> {
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

  async createEndpoints (
    projectID: string,
    refID: string,
    endpointType: 'custom' | 'crud',
    endpointName: string,
    endpointTarget: string,
  ): Promise<SaveResponse> {
    const endpointStructure = this.#buildEndpointStructure(endpointType, endpointName, endpointTarget)

    const resourcesToCreate: ResourcesToCreate = {
      endpoints: {
        [endpointName]: endpointStructure,
      },
    }

    return await this.saveConfiguration(projectID, refID, resourcesToCreate)
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

  async listMarketplaceItemTypeDefinitions (namespace?: string, name?: string, displayName?: string): Promise<CatalogItemTypeDefinition[]> {
    return this.#marketplaceClient.listMarketplaceItemTypeDefinitions(namespace, name, displayName)
  }

  async marketplaceItemTypeDefinitionInfo (tenantID: string, name: string): Promise<CatalogItemTypeDefinition> {
    return this.#marketplaceClient.marketplaceItemTypeDefinitionInfo(tenantID, name)
  }

  async getMarketplaceCategories (): Promise<SoftwareCatalogCategory[]> {
    return this.#marketplaceClient.getMarketplaceCategories()
  }

  async applyMarketplaceItems (tenantID: string, items: MarketplaceApplyItemsRequest): Promise<MarketplaceApplyItemsResponse> {
    return this.#marketplaceClient.applyMarketplaceItems(tenantID, items)
  }

  async upsertItemTypeDefinition (tenantID: string, definition: CatalogItemTypeDefinition): Promise<CatalogItemTypeDefinition> {
    return this.#marketplaceClient.upsertItemTypeDefinition(tenantID, definition)
  }

  async uploadMarketplaceFile (tenantID: string, formData: FormData): Promise<MarketplaceUploadFileResponse> {
    return this.#marketplaceClient.uploadMarketplaceFile(tenantID, formData)
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

  #buildEndpointStructure (
    endpointType: 'custom' | 'crud',
    endpointName: string,
    endpointTarget: string,
  ): CrudEndpoint | CustomEndpoint {
    if (endpointType === 'custom') {
      return {
        basePath: `/${endpointName}`,
        type: EndpointTypes.CUSTOM,
        public: false,
        showInDocumentation: true,
        secreted: false,
        acl: 'true',
        service: endpointTarget,
        port: '80',
        pathRewrite: '/',
        description: `Endpoint /${endpointName}`,
        tags: [ endpointTarget ],
        backofficeAcl: {
          inherited: true,
        },
        allowUnknownRequestContentType: false,
        allowUnknownResponseContentType: false,
        forceMicroserviceGatewayProxy: false,
        listeners: {
          frontend: true,
        },
        useDownstreamProtocol: true,
      }
    } else {
      // CRUD endpoint
      return {
        basePath: `/${endpointName}`,
        pathName: '/',
        pathRewrite: `/${endpointName}`,
        type: EndpointTypes.CRUD,
        tags: [ 'crud' ],
        description: `Endpoint /${endpointTarget}`,
        collectionId: endpointTarget,
        public: true,
        secreted: false,
        showInDocumentation: true,
        acl: 'true',
        backofficeAcl: {
          inherited: true,
        },
        allowUnknownRequestContentType: false,
        allowUnknownResponseContentType: false,
        forceMicroserviceGatewayProxy: false,
        routes: {
          'GET/': {
            id: 'GET/',
            verb: Verbs.METHOD_GET,
            path: '/',
            public: { inherited: true },
            secreted: { inherited: true },
            showInDocumentation: { inherited: true },
            acl: { inherited: true },
            backofficeAcl: { inherited: true },
            rateLimit: { inherited: true },
            allowUnknownRequestContentType: { inherited: true },
            allowUnknownResponseContentType: { inherited: true },
            preDecorators: [],
            postDecorators: [],
          },
          'POST/': {
            id: 'POST/',
            verb: Verbs.METHOD_POST,
            path: '/',
            public: { inherited: true },
            secreted: { inherited: true },
            showInDocumentation: { inherited: true },
            acl: { inherited: true },
            backofficeAcl: { inherited: true },
            rateLimit: { inherited: true },
            allowUnknownRequestContentType: { inherited: true },
            allowUnknownResponseContentType: { inherited: true },
            preDecorators: [],
            postDecorators: [],
          },
          'GET/export': {
            id: 'GET/export',
            verb: Verbs.METHOD_GET,
            path: '/export',
            public: { inherited: true },
            secreted: { inherited: true },
            showInDocumentation: { inherited: true },
            acl: { inherited: true },
            backofficeAcl: { inherited: true },
            rateLimit: { inherited: true },
            allowUnknownRequestContentType: { inherited: true },
            allowUnknownResponseContentType: { inherited: false, value: true },
            preDecorators: [],
            postDecorators: [],
          },
          'GET/:id': {
            id: 'GET/:id',
            verb: Verbs.METHOD_GET,
            path: '/:id',
            public: { inherited: true },
            secreted: { inherited: true },
            showInDocumentation: { inherited: true },
            acl: { inherited: true },
            backofficeAcl: { inherited: true },
            rateLimit: { inherited: true },
            allowUnknownRequestContentType: { inherited: true },
            allowUnknownResponseContentType: { inherited: true },
            preDecorators: [],
            postDecorators: [],
          },
          'DELETE/:id': {
            id: 'DELETE/:id',
            verb: Verbs.METHOD_DELETE,
            path: '/:id',
            public: { inherited: true },
            secreted: { inherited: true },
            showInDocumentation: { inherited: true },
            acl: { inherited: true },
            backofficeAcl: { inherited: true },
            rateLimit: { inherited: true },
            allowUnknownRequestContentType: { inherited: true },
            allowUnknownResponseContentType: { inherited: true },
            preDecorators: [],
            postDecorators: [],
          },
          'DELETE/': {
            id: 'DELETE/',
            verb: Verbs.METHOD_DELETE,
            path: '/',
            public: { inherited: true },
            secreted: { inherited: true },
            showInDocumentation: { inherited: true },
            acl: { inherited: true },
            backofficeAcl: { inherited: true },
            rateLimit: { inherited: true },
            allowUnknownRequestContentType: { inherited: true },
            allowUnknownResponseContentType: { inherited: true },
            preDecorators: [],
            postDecorators: [],
          },
          'PATCH/:id': {
            id: 'PATCH/:id',
            verb: Verbs.METHOD_PATCH,
            path: '/:id',
            public: { inherited: true },
            secreted: { inherited: true },
            showInDocumentation: { inherited: true },
            acl: { inherited: true },
            backofficeAcl: { inherited: true },
            rateLimit: { inherited: true },
            allowUnknownRequestContentType: { inherited: true },
            allowUnknownResponseContentType: { inherited: true },
            preDecorators: [],
            postDecorators: [],
          },
          'PATCH/': {
            id: 'PATCH/',
            verb: Verbs.METHOD_PATCH,
            path: '/',
            public: { inherited: true },
            secreted: { inherited: true },
            showInDocumentation: { inherited: true },
            acl: { inherited: true },
            backofficeAcl: { inherited: true },
            rateLimit: { inherited: true },
            allowUnknownRequestContentType: { inherited: true },
            allowUnknownResponseContentType: { inherited: true },
            preDecorators: [],
            postDecorators: [],
          },
          'GET/count': {
            id: 'GET/count',
            verb: Verbs.METHOD_GET,
            path: '/count',
            public: { inherited: true },
            secreted: { inherited: true },
            showInDocumentation: { inherited: true },
            acl: { inherited: true },
            backofficeAcl: { inherited: true },
            rateLimit: { inherited: true },
            allowUnknownRequestContentType: { inherited: true },
            allowUnknownResponseContentType: { inherited: true },
            preDecorators: [],
            postDecorators: [],
          },
          'POST/bulk': {
            id: 'POST/bulk',
            verb: Verbs.METHOD_POST,
            path: '/bulk',
            public: { inherited: true },
            secreted: { inherited: true },
            showInDocumentation: { inherited: true },
            acl: { inherited: true },
            backofficeAcl: { inherited: true },
            rateLimit: { inherited: true },
            allowUnknownRequestContentType: { inherited: true },
            allowUnknownResponseContentType: { inherited: true },
            preDecorators: [],
            postDecorators: [],
          },
          'POST/upsert-one': {
            id: 'POST/upsert-one',
            verb: Verbs.METHOD_POST,
            path: '/upsert-one',
            public: { inherited: true },
            secreted: { inherited: true },
            showInDocumentation: { inherited: true },
            acl: { inherited: true },
            backofficeAcl: { inherited: true },
            rateLimit: { inherited: true },
            allowUnknownRequestContentType: { inherited: true },
            allowUnknownResponseContentType: { inherited: true },
            preDecorators: [],
            postDecorators: [],
          },
          'PATCH/bulk': {
            id: 'PATCH/bulk',
            verb: Verbs.METHOD_PATCH,
            path: '/bulk',
            public: { inherited: true },
            secreted: { inherited: true },
            showInDocumentation: { inherited: true },
            acl: { inherited: true },
            backofficeAcl: { inherited: true },
            rateLimit: { inherited: true },
            allowUnknownRequestContentType: { inherited: true },
            allowUnknownResponseContentType: { inherited: true },
            preDecorators: [],
            postDecorators: [],
          },
          'POST/:id/state': {
            id: 'POST/:id/state',
            verb: Verbs.METHOD_POST,
            path: '/:id/state',
            public: { inherited: true },
            secreted: { inherited: true },
            showInDocumentation: { inherited: true },
            acl: { inherited: true },
            backofficeAcl: { inherited: true },
            rateLimit: { inherited: true },
            allowUnknownRequestContentType: { inherited: true },
            allowUnknownResponseContentType: { inherited: true },
            preDecorators: [],
            postDecorators: [],
          },
          'POST/state': {
            id: 'POST/state',
            verb: Verbs.METHOD_POST,
            path: '/state',
            public: { inherited: true },
            secreted: { inherited: true },
            showInDocumentation: { inherited: true },
            acl: { inherited: true },
            backofficeAcl: { inherited: true },
            rateLimit: { inherited: true },
            allowUnknownRequestContentType: { inherited: true },
            allowUnknownResponseContentType: { inherited: true },
            preDecorators: [],
            postDecorators: [],
          },
        },
        listeners: {
          frontend: true,
        },
      }
    }
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

export interface APIClientMockFunctions {
  // #region Utility Methods
  isAiFeaturesEnabledForTenantMockFn?: (tenantId: string) => Promise<boolean>
  // #endregion

  // #region Governance Methods
  listCompaniesMockFn?: () => Promise<ITenant[]>
  companyTemplatesMockFn?: (tenantID: string) => Promise<Template[]>
  companyIAMIdentitiesMockFn?: (tenantID: string, type?: string) => Promise<Record<string, unknown>[]>
  companyAuditLogsMockFn?: (tenantID: string, from?: string, to?: string) => Promise<Record<string, unknown>[]>

  listProjectsMockFn?: (tenantIDs: string[], search?: string) => Promise<Record<string, unknown>[]>
  getProjectInfoMockFn?: (projectId: string) => Promise<IProject>
  createProjectFromTemplateMockFn?: (
    tenantID: string,
    projectName: string,
    templateID: string,
    description?: string,
  ) => Promise<Record<string, unknown>>
  // #endregion

  // #region Configuration Methods
  getConfigurationRevisionsMockFn?: (projectId: string) => Promise<Record<string, unknown>>
  getConfigurationMockFn?: (projectId: string, refId: string) => Promise<RetrievedConfiguration>
  saveConfigurationMockFn?: (projectId: string) => Promise<SaveResponse>
  createServiceFromMarketplaceItemMockFn?: (projectID: string) => Promise<SaveResponse>
  createEndpointsMockFn?: (projectID: string) => Promise<SaveResponse>
  // #endregion

  // #region Deploy Methods
  deployProjectEnvironmentFromRevisionMockFn?: (
    projectID: string,
    environment: string,
    revision: string,
    revisionType: string,
  ) => Promise<TriggerDeployResponse>
  compareProjectEnvironmentFromRevisionForDeployMockFn?: (
    projectID: string,
    environment: string,
    revision: string,
    revisionType: string,
  ) => Promise<CompareForDeployResponse>
  waitProjectDeployForCompletionMockFn?: (
    projectID: string,
    pipelineID: string,
    timeout?: number,
    interval?: number,
  ) => Promise<PipelineStatus>
  // #endregion

  // #region Runtime Methods
  listPodsMockFn?: (projectID: string, environmentID: string) => Promise<Record<string, unknown>[]>
  podLogsMockFn?: (
    projectID: string,
    environmentID: string,
    podName: string,
    containerName: string,
    lines?: number,
  ) => Promise<string>
  // #endregion

  // #region Marketplace Methods
  listMarketplaceItemsMockFn?: (tenantID?: string, type?: string, search?: string) => Promise<Record<string, unknown>[]>
  marketplaceItemVersionsMockFn?: (tenantID: string, itemID: string) => Promise<CatalogItemRelease[]>
  marketplaceItemInfoMockFn?: (tenantID: string, itemID: string, version?: string) => Promise<CatalogVersionedItem>
  listMarketplaceItemTypeDefinitionsMockFn?: (namespace?: string, name?: string, displayName?: string) => Promise<CatalogItemTypeDefinition[]>
  marketplaceItemTypeDefinitionInfoMockFn?: (tenantID: string, name: string) => Promise<CatalogItemTypeDefinition>
  getMarketplaceCategoriesMockFn?: () => Promise<SoftwareCatalogCategory[]>
  applyMarketplaceItemsMockFn?: (tenantID: string, items: MarketplaceApplyItemsRequest) => Promise<MarketplaceApplyItemsResponse>
  upsertItemTypeDefinitionMockFn?: (tenantID: string, definition: CatalogItemTypeDefinition) => Promise<CatalogItemTypeDefinition>
  uploadMarketplaceFileMockFn?: (tenantID: string, formData: FormData) => Promise<MarketplaceUploadFileResponse>
  // #endregion
}

export class APIClientMock implements IAPIClient {
  private mocks: APIClientMockFunctions

  constructor (mocks: APIClientMockFunctions) {
    this.mocks = mocks
  }

  // #region Utility Methods

  async isAiFeaturesEnabledForTenant (tenantId: string): Promise<boolean> {
    if (!this.mocks.isAiFeaturesEnabledForTenantMockFn) {
      throw new Error('isAiFeaturesEnabledForTenantMockFn not mocked')
    }

    return this.mocks.isAiFeaturesEnabledForTenantMockFn(tenantId)
  }

  // #endregion

  // #region Governance Methods

  async listCompanies (): Promise<ITenant[]> {
    if (!this.mocks.listCompaniesMockFn) {
      throw new Error('listCompaniesMockFn not mocked')
    }

    return this.mocks.listCompaniesMockFn()
  }

  async companyTemplates (tenantId: string): Promise<Template[]> {
    if (!this.mocks.companyTemplatesMockFn) {
      throw new Error('companyTemplatesMockFn not mocked')
    }

    return this.mocks.companyTemplatesMockFn(tenantId)
  }

  async companyIAMIdentities (tenantId: string, type?: string): Promise<Record<string, unknown>[]> {
    if (!this.mocks.companyIAMIdentitiesMockFn) {
      throw new Error('companyIAMIdentitiesMockFn not mocked')
    }

    return this.mocks.companyIAMIdentitiesMockFn(tenantId, type)
  }

  async companyAuditLogs (tenantId: string, from?: string, to?: string): Promise<Record<string, unknown>[]> {
    if (!this.mocks.companyAuditLogsMockFn) {
      throw new Error('companyAuditLogsMockFn not mocked')
    }

    return this.mocks.companyAuditLogsMockFn(tenantId, from, to)
  }

  async listProjects (tenantIds: string[], search?: string): Promise<Record<string, unknown>[]> {
    if (!this.mocks.listProjectsMockFn) {
      throw new Error('listProjectsMockFn not mocked')
    }

    return this.mocks.listProjectsMockFn(tenantIds, search)
  }

  async projectInfo (projectId: string): Promise<IProject> {
    if (!this.mocks.getProjectInfoMockFn) {
      throw new Error('getProjectInfoMockFn not mocked')
    }

    return this.mocks.getProjectInfoMockFn(projectId)
  }

  async createProjectFromTemplate (tenantId: string, projectName: string, templateId: string, description?: string): Promise<Record<string, unknown>> {
    if (!this.mocks.createProjectFromTemplateMockFn) {
      throw new Error('createProjectFromTemplateMockFn not mocked')
    }

    return this.mocks.createProjectFromTemplateMockFn(tenantId, projectName, templateId, description)
  }

  // #endregion

  // #region Configuration Methods

  async getConfigurationRevisions (projectId: string): Promise<Record<string, unknown>> {
    if (!this.mocks.getConfigurationRevisionsMockFn) {
      throw new Error('getConfigurationRevisionsMockFn not mocked')
    }

    return this.mocks.getConfigurationRevisionsMockFn(projectId)
  }


  async getConfiguration (projectId: string, refId: string): Promise<RetrievedConfiguration> {
    if (!this.mocks.getConfigurationMockFn) {
      throw new Error('getConfigurationMockFn not mocked')
    }

    return this.mocks.getConfigurationMockFn(projectId, refId)
  }

  async saveConfiguration (
    projectId: string,
    _refId: string,
    _resourcesToCreate: ResourcesToCreate,
    _options?: SaveConfigurationOptions,
  ): Promise<SaveResponse> {
    if (!this.mocks.saveConfigurationMockFn) {
      throw new Error('saveConfigurationMockFn not mocked')
    }

    return this.mocks.saveConfigurationMockFn(projectId)
  }

  async createServiceFromMarketplaceItem (
    projectID: string,
    _name: string,
    _refID: string,
    _marketplaceItemID: string,
    _marketplaceItemTenantID: string,
    _marketplaceItemVersion?: string,
    _description?: string,
  ): Promise<SaveResponse> {
    if (!this.mocks.createServiceFromMarketplaceItemMockFn) {
      throw new Error('createServiceFromMarketplaceItemMockFn not mocked')
    }

    return this.mocks.createServiceFromMarketplaceItemMockFn(projectID)
  }

  async createEndpoints (
    projectID: string,
    _refID: string,
    _endpointType: 'custom' | 'crud',
    _endpointName: string,
    _endpointTarget: string,
  ): Promise<SaveResponse> {
    if (!this.mocks.createEndpointsMockFn) {
      throw new Error('createEndpointsMockFn not mocked')
    }

    return this.mocks.createEndpointsMockFn(projectID)
  }

  // #endregion

  // #region Deploy Methods

  async deployProjectEnvironmentFromRevision (
    projectID: string,
    environment: string,
    revision: string,
    revisionType: string,
  ): Promise<TriggerDeployResponse> {
    if (!this.mocks.deployProjectEnvironmentFromRevisionMockFn) {
      throw new Error('deployProjectEnvironmentFromRevisionMockFn not mocked')
    }

    return this.mocks.deployProjectEnvironmentFromRevisionMockFn(projectID, environment, revision, revisionType)
  }

  async compareProjectEnvironmentFromRevisionForDeploy (
    projectID: string,
    environment: string,
    revision: string,
    revisionType: string,
  ): Promise<CompareForDeployResponse> {
    if (!this.mocks.compareProjectEnvironmentFromRevisionForDeployMockFn) {
      throw new Error('compareProjectEnvironmentFromRevisionForDeployMockFn not mocked')
    }

    return this.mocks.compareProjectEnvironmentFromRevisionForDeployMockFn(projectID, environment, revision, revisionType)
  }

  async waitProjectDeployForCompletion (
    projectID: string,
    pipelineID: string,
    timeout = 5 * 60 * 1000,
    interval = 5000,
  ): Promise<PipelineStatus> {
    if (!this.mocks.waitProjectDeployForCompletionMockFn) {
      throw new Error('waitProjectDeployForCompletionMockFn not mocked')
    }

    return this.mocks.waitProjectDeployForCompletionMockFn(projectID, pipelineID, timeout, interval)
  }

  // #endregion

  // #region Runtime Methods

  async listPods (projectID: string, environmentID: string): Promise<Record<string, unknown>[]> {
    if (!this.mocks.listPodsMockFn) {
      throw new Error('listPodsMockFn not mocked')
    }

    return this.mocks.listPodsMockFn(projectID, environmentID)
  }

  async podLogs (
    projectID: string,
    environmentID: string,
    podName: string,
    containerName: string,
    lines?: number,
  ): Promise<string> {
    if (!this.mocks.podLogsMockFn) {
      throw new Error('podLogsMockFn not mocked')
    }

    return this.mocks.podLogsMockFn(projectID, environmentID, podName, containerName, lines)
  }

  // #endregion

  // #region Marketplace Methods

  async listMarketplaceItems (tenantID?: string, type?: string, search?: string): Promise<Record<string, unknown>[]> {
    if (!this.mocks.listMarketplaceItemsMockFn) {
      throw new Error('listMarketplaceItemsMockFn not mocked')
    }

    return this.mocks.listMarketplaceItemsMockFn(tenantID, type, search)
  }

  async marketplaceItemVersions (tenantID: string, itemID: string): Promise<CatalogItemRelease[]> {
    if (!this.mocks.marketplaceItemVersionsMockFn) {
      throw new Error('marketplaceItemVersionsMockFn not mocked')
    }

    return this.mocks.marketplaceItemVersionsMockFn(tenantID, itemID)
  }

  async marketplaceItemInfo (tenantID: string, itemID: string, version?: string): Promise<CatalogVersionedItem> {
    if (!this.mocks.marketplaceItemInfoMockFn) {
      throw new Error('marketplaceItemInfoMockFn not mocked')
    }

    return this.mocks.marketplaceItemInfoMockFn(tenantID, itemID, version)
  }

  async listMarketplaceItemTypeDefinitions (namespace?: string, name?: string, displayName?: string): Promise<CatalogItemTypeDefinition[]> {
    if (!this.mocks.listMarketplaceItemTypeDefinitionsMockFn) {
      throw new Error('listMarketplaceItemTypeDefinitionsMockFn not mocked')
    }

    return this.mocks.listMarketplaceItemTypeDefinitionsMockFn(namespace, name, displayName)
  }

  async marketplaceItemTypeDefinitionInfo (tenantID: string, name: string): Promise<CatalogItemTypeDefinition> {
    if (!this.mocks.marketplaceItemTypeDefinitionInfoMockFn) {
      throw new Error('marketplaceItemTypeDefinitionInfoMockFn not mocked')
    }

    return this.mocks.marketplaceItemTypeDefinitionInfoMockFn(tenantID, name)
  }

  async getMarketplaceCategories (): Promise<SoftwareCatalogCategory[]> {
    if (!this.mocks.getMarketplaceCategoriesMockFn) {
      throw new Error('getMarketplaceCategoriesMockFn not mocked')
    }

    return this.mocks.getMarketplaceCategoriesMockFn()
  }

  async applyMarketplaceItems (tenantID: string, items: MarketplaceApplyItemsRequest): Promise<MarketplaceApplyItemsResponse> {
    if (!this.mocks.applyMarketplaceItemsMockFn) {
      throw new Error('applyMarketplaceItemsMockFn not mocked')
    }

    return this.mocks.applyMarketplaceItemsMockFn(tenantID, items)
  }

  async upsertItemTypeDefinition (tenantID: string, definition: CatalogItemTypeDefinition): Promise<CatalogItemTypeDefinition> {
    if (!this.mocks.upsertItemTypeDefinitionMockFn) {
      throw new Error('upsertItemTypeDefinitionMockFn not mocked')
    }

    return this.mocks.upsertItemTypeDefinitionMockFn(tenantID, definition)
  }

  async uploadMarketplaceFile (tenantID: string, formData: FormData): Promise<MarketplaceUploadFileResponse> {
    if (!this.mocks.uploadMarketplaceFileMockFn) {
      throw new Error('uploadMarketplaceFileMockFn not mocked')
    }

    return this.mocks.uploadMarketplaceFileMockFn(tenantID, formData)
  }

  // #endregion
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
