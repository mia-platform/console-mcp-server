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

import { AuditLogsClient } from './auditLogsClient'
import { ConsoleMCPServerOptions } from '../server/types'
import { HTTPClient } from './http-client'
import { ICompany } from './tenantClient.types'
import { RBACClient } from './rbacClient'
import { TenantClient } from './tenantClient'
import { BackendClient, BackendClientInternal } from './backendClient'
import { CompareForDeployResponse, DeployType, PipelineStatus, TriggerDeployResponse } from './types/deploy'
import {
  Config,
  ConfigToSave,
  ConfigurationRefType,
  CreatedVersion,
  DockerSuggestionPrefix,
  ProjectVersion,
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
  listCompanies(): Promise<ITenant[] | ICompany[]>
  companyTemplates(tenantID: string): Promise<Template[]>
  companyIAMIdentities(tenantID: string, type?: string): Promise<unknown[]>
  getPrincipals (tenantId: string, continueToken?: string, limit?: number): Promise<unknown[]>
  companyAuditLogs(tenantID: string, from?: string, to?: string): Promise<unknown[]>

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
  getConfiguration(projectId: string, refId: string, refType?: ConfigurationRefType): Promise<RetrievedConfiguration>
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
  createVersion(
    projectID: string,
    versionName: string,
    revisionName: string,
    message?: string,
    releaseDescription?: string,
  ): Promise<CreatedVersion>
  getVersion(projectID: string, versionName: string): Promise<ProjectVersion>
  deleteVersion(projectID: string, versionName: string): Promise<void>
  // #endregion

  // #region Deploy Methods
  deployProjectEnvironmentFromRevision(
    projectID: string,
    environment: string,
    revision: string,
    revisionType: string,
    deployType?: DeployType,
    forceDeployWhenNoSemver?: boolean,
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
  restartPod(projectID: string, environmentID: string, podName: string): Promise<void>
  // #endregion

  // #region Marketplace Methods
  listMarketplaceItems(tenantID?: string, type?: string, search?: string): Promise<Record<string, unknown>[]>
  marketplaceItemVersions(tenantID: string, itemID: string): Promise<CatalogItemRelease[]>
  marketplaceItemInfo(tenantID: string, itemID: string, version?: string): Promise<CatalogVersionedItem>
  listMarketplaceItemTypeDefinitions(namespace?: string, name?: string, displayName?: string): Promise<CatalogItemTypeDefinition[]>
  marketplaceItemTypeDefinitionInfo (tenantID: string, name: string): Promise<CatalogItemTypeDefinition>
  // #endregion
}

export class APIClient implements IAPIClient {
  // Default clients
  #backendClient: BackendClient
  #deployClient: DeployClient
  #featureFlagsClient: FeatureToggleClient
  #kubernetesClient: KubernetesClient
  #marketplaceClient: MarketplaceClient
  // Clients included only without the centralized user management
  #iamClient: IAMClient | undefined
  // Clients included only with the centralized user management
  #auditLogClient: AuditLogsClient | undefined
  #rbacClient: RBACClient | undefined
  #tenantClient: TenantClient | undefined

  constructor (
    baseURL: string,
    opts: ConsoleMCPServerOptions,
  ) {
    const { additionalHeaders = {}, clientId, clientSecret, enableCentralizedUserManagement = false } = opts

    if (baseURL) {
      const client = new HTTPClient(baseURL, clientId, clientSecret, additionalHeaders)
      this.#backendClient = new BackendClient(client)
      this.#deployClient = new DeployClient(client)
      this.#featureFlagsClient = new FeatureToggleClient(client)
      this.#kubernetesClient = new KubernetesClient(client)
      this.#marketplaceClient = new MarketplaceClient(client)

      if (enableCentralizedUserManagement) {
        this.#auditLogClient = new AuditLogsClient(client)
        this.#rbacClient = new RBACClient(client)
        this.#tenantClient = new TenantClient(client)
      } else {
        this.#iamClient = new IAMClient(client)
      }

      return
    }

    this.#backendClient = BackendClientInternal(clientId, clientSecret, additionalHeaders)
    this.#deployClient = DeployClientInternal(clientId, clientSecret, additionalHeaders)
    this.#featureFlagsClient = FeatureToggleClientInternal(clientId, clientSecret, additionalHeaders)
    this.#kubernetesClient = KubernetesClientInternal(clientId, clientSecret, additionalHeaders)
    this.#iamClient = IAMClientInternal(clientId, clientSecret, additionalHeaders)
    this.#marketplaceClient = MarketplaceClientInternal(clientId, clientSecret, additionalHeaders)
  }

  async isAiFeaturesEnabledForTenant (tenantId: string): Promise<boolean> {
    const tenantRules: TenantRules = await this.#backendClient.getCompanyRules(tenantId)
    return tenantRules?.aiSettings?.enableAgenticFeatures || false
  }

  async listCompanies (): Promise<ITenant[] | ICompany[]> {
    if (this.#tenantClient) {
      return await this.#tenantClient.listCompanies()
    } else {
      return await this.#backendClient.listCompanies()
    }
  }

  async companyTemplates (tenantId: string): Promise<Template[]> {
    return await this.#backendClient.companyTemplates(tenantId)
  }

  async companyIAMIdentities (tenantId: string, type?: string): Promise<unknown[]> {
    if (!this.#iamClient) {
      throw new Error('Impossible to get IAM identities: MCP Server started with centralized user management mode active')
    }

    return await this.#iamClient.companyIAMIdentities(tenantId, type)
  }

  async getPrincipals (tenantId: string, continueToken?: string, limit?: number): Promise<unknown[]> {
    if (!this.#rbacClient) {
      throw new Error('Impossible to get principals: MCP Server started without centralized user management mode active')
    }

    return await this.#rbacClient.listPrincipals('user', { tenantId, limit, continueToken })
  }

  async companyAuditLogs (tenantId: string, from?: string, to?: string): Promise<unknown[]> {
    if (this.#iamClient) {
      return await this.#iamClient.companyAuditLogs(tenantId, from, to)
    } else if (this.#auditLogClient) {
      return await this.#auditLogClient?.companyAuditLogs(tenantId, from, to)
    } else {
      throw new Error('Internal error. Impossible to connect to any Audit Logs client.')
    }
  }

  async listProjects (tenantIds: string[], search?: string): Promise<Record<string, unknown>[]> {
    return await this.#backendClient.listProjects(tenantIds, search)
  }

  async projectInfo (projectId: string): Promise<IProject> {
    return await this.#backendClient.projectInfo(projectId)
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

  async getConfiguration (
    prjID: string,
    refID: string,
    refType: ConfigurationRefType = 'revisions',
  ): Promise<RetrievedConfiguration> {
    const ft = await this.#featureFlagsClient.getToggles(prjID, [ ENABLE_ENVIRONMENT_BASED_CONFIGURATION_MANAGEMENT ])
    if (ft[ENABLE_ENVIRONMENT_BASED_CONFIGURATION_MANAGEMENT] || false) {
      return this.#backendClient.getEnvironmentBasedConfiguration(prjID, refID)
    }

    return this.#backendClient.getRevisionBasedConfiguration(prjID, refID, refType)
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

  async createVersion (
    projectID: string,
    versionName: string,
    revisionName: string,
    message?: string,
    releaseDescription?: string,
  ): Promise<CreatedVersion> {
    return await this.#backendClient.createProjectVersion(projectID, {
      tagName: versionName,
      ref: revisionName,
      ...message && { message },
      ...releaseDescription && { releaseDescription },
    })
  }

  async getVersion (projectID: string, versionName: string): Promise<ProjectVersion> {
    return await this.#backendClient.getProjectVersion(projectID, versionName)
  }

  async deleteVersion (projectID: string, versionName: string): Promise<void> {
    return await this.#backendClient.deleteProjectVersion(projectID, versionName)
  }

  async deployProjectEnvironmentFromRevision (
    projectID: string,
    environment: string,
    revision: string,
    revisionType: string,
    deployType?: DeployType,
    forceDeployWhenNoSemver?: boolean,
  ): Promise<TriggerDeployResponse> {
    return await this.#deployClient.triggerDeploy(projectID, environment, revision, revisionType, deployType, forceDeployWhenNoSemver)
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

  async restartPod (projectID: string, environmentID: string, podName: string): Promise<void> {
    return await this.#kubernetesClient.restartPod(projectID, environmentID, podName)
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
