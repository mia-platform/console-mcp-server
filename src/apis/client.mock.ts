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

import { IAPIClient } from './client'
import { ICompany } from './tenantClient.types'
import { Template } from './types/governance'
import { CatalogItemRelease, CatalogItemTypeDefinition, CatalogVersionedItem, IProject, ITenant } from '@mia-platform/console-types'
import { CompareForDeployResponse, DeployType, PipelineStatus, TriggerDeployResponse } from './types/deploy'
import { ConfigurationRefType, CreatedVersion, ProjectVersion, ResourcesToCreate, RetrievedConfiguration, SaveConfigurationOptions, SaveResponse } from './types/configuration'


export interface APIClientMockFunctions {
  // #region Utility Methods
  isAiFeaturesEnabledForTenantMockFn?: (tenantId: string) => Promise<boolean>
  // #endregion

  // #region Governance Methods
  listCompaniesMockFn?: () => Promise<ITenant[] | ICompany[]>
  companyTemplatesMockFn?: (tenantId: string) => Promise<Template[]>
  companyIAMIdentitiesMockFn?: (tenantId: string, type?: string) => Promise<unknown[]>
  getPrincipalsMockFn?: (tenantId: string, continueToken?: string, limit?: number) => Promise<unknown[]>
  companyAuditLogsMockFn?: (tenantId: string, from?: string, to?: string) => Promise<unknown[]>

  listProjectsMockFn?: (tenantIds: string[], search?: string) => Promise<Record<string, unknown>[]>
  getProjectInfoMockFn?: (projectId: string) => Promise<IProject>
  createProjectFromTemplateMockFn?: (
    tenantId: string,
    projectName: string,
    templateID: string,
    description?: string,
  ) => Promise<Record<string, unknown>>
  // #endregion

  // #region Configuration Methods
  getConfigurationRevisionsMockFn?: (projectId: string) => Promise<Record<string, unknown>>
  getConfigurationMockFn?: (projectId: string, refId: string, refType?: ConfigurationRefType) => Promise<RetrievedConfiguration>
  saveConfigurationMockFn?: (projectId: string) => Promise<SaveResponse>
  createServiceFromMarketplaceItemMockFn?: (projectID: string) => Promise<SaveResponse>
  createEndpointsMockFn?: (projectID: string) => Promise<SaveResponse>
  createVersionMockFn?: (
    projectID: string,
    versionName: string,
    revisionName: string,
    message?: string,
    releaseDescription?: string,
  ) => Promise<CreatedVersion>
  getVersionMockFn?: (projectID: string, versionName: string) => Promise<ProjectVersion>
  deleteVersionMockFn?: (projectID: string, versionName: string) => Promise<void>
  // #endregion

  // #region Deploy Methods
  deployProjectEnvironmentFromRevisionMockFn?: (
    projectID: string,
    environment: string,
    revision: string,
    revisionType: string,
    deployType?: DeployType,
    forceDeployWhenNoSemver?: boolean,
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
  restartPodMockFn?: (projectID: string, environmentID: string, podName: string) => Promise<void>
  // #endregion

  // #region Marketplace Methods
  listMarketplaceItemsMockFn?: (tenantId?: string, type?: string, search?: string) => Promise<Record<string, unknown>[]>
  marketplaceItemVersionsMockFn?: (tenantId: string, itemID: string) => Promise<CatalogItemRelease[]>
  marketplaceItemInfoMockFn?: (tenantId: string, itemID: string, version?: string) => Promise<CatalogVersionedItem>
  listMarketplaceItemTypeDefinitionsMockFn?: (namespace?: string, name?: string, displayName?: string) => Promise<CatalogItemTypeDefinition[]>
  marketplaceItemTypeDefinitionInfoMockFn?: (tenantId: string, name: string) => Promise<CatalogItemTypeDefinition>
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

  async listCompanies (): Promise<ITenant[] | ICompany[]> {
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

  async companyIAMIdentities (tenantId: string, type?: string): Promise<unknown[]> {
    if (!this.mocks.companyIAMIdentitiesMockFn) {
      throw new Error('companyIAMIdentitiesMockFn not mocked')
    }

    return this.mocks.companyIAMIdentitiesMockFn(tenantId, type)
  }

  async getPrincipals (tenantId: string, continueToken?: string, limit?: number): Promise<unknown[]> {
    if (!this.mocks.getPrincipalsMockFn) {
      throw new Error('getPrincipalsMockFn not mocked')
    }

    return this.mocks.getPrincipalsMockFn(tenantId, continueToken, limit)
  }

  async companyAuditLogs (tenantId: string, from?: string, to?: string): Promise<unknown[]> {
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


  async getConfiguration (projectId: string, refId: string, refType?: ConfigurationRefType): Promise<RetrievedConfiguration> {
    if (!this.mocks.getConfigurationMockFn) {
      throw new Error('getConfigurationMockFn not mocked')
    }

    return this.mocks.getConfigurationMockFn(projectId, refId, refType)
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

  async createVersion (
    projectID: string,
    versionName: string,
    revisionName: string,
    message?: string,
    releaseDescription?: string,
  ): Promise<CreatedVersion> {
    if (!this.mocks.createVersionMockFn) {
      throw new Error('createVersionMockFn not mocked')
    }

    return this.mocks.createVersionMockFn(projectID, versionName, revisionName, message, releaseDescription)
  }

  async getVersion (projectID: string, versionName: string): Promise<ProjectVersion> {
    if (!this.mocks.getVersionMockFn) {
      throw new Error('getVersionMockFn not mocked')
    }

    return this.mocks.getVersionMockFn(projectID, versionName)
  }

  async deleteVersion (projectID: string, versionName: string): Promise<void> {
    if (!this.mocks.deleteVersionMockFn) {
      throw new Error('deleteVersionMockFn not mocked')
    }

    return this.mocks.deleteVersionMockFn(projectID, versionName)
  }

  // #endregion

  // #region Deploy Methods

  async deployProjectEnvironmentFromRevision (
    projectID: string,
    environment: string,
    revision: string,
    revisionType: string,
    deployType?: DeployType,
    forceDeployWhenNoSemver?: boolean,
  ): Promise<TriggerDeployResponse> {
    if (!this.mocks.deployProjectEnvironmentFromRevisionMockFn) {
      throw new Error('deployProjectEnvironmentFromRevisionMockFn not mocked')
    }

    return this.mocks.deployProjectEnvironmentFromRevisionMockFn(projectID, environment, revision, revisionType, deployType, forceDeployWhenNoSemver)
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

  async restartPod (projectID: string, environmentID: string, podName: string): Promise<void> {
    if (!this.mocks.restartPodMockFn) {
      throw new Error('restartPodMockFn not mocked')
    }

    return this.mocks.restartPodMockFn(projectID, environmentID, podName)
  }

  // #endregion

  // #region Marketplace Methods

  async listMarketplaceItems (tenantId?: string, type?: string, search?: string): Promise<Record<string, unknown>[]> {
    if (!this.mocks.listMarketplaceItemsMockFn) {
      throw new Error('listMarketplaceItemsMockFn not mocked')
    }

    return this.mocks.listMarketplaceItemsMockFn(tenantId, type, search)
  }

  async marketplaceItemVersions (tenantId: string, itemID: string): Promise<CatalogItemRelease[]> {
    if (!this.mocks.marketplaceItemVersionsMockFn) {
      throw new Error('marketplaceItemVersionsMockFn not mocked')
    }

    return this.mocks.marketplaceItemVersionsMockFn(tenantId, itemID)
  }

  async marketplaceItemInfo (tenantId: string, itemID: string, version?: string): Promise<CatalogVersionedItem> {
    if (!this.mocks.marketplaceItemInfoMockFn) {
      throw new Error('marketplaceItemInfoMockFn not mocked')
    }

    return this.mocks.marketplaceItemInfoMockFn(tenantId, itemID, version)
  }

  async listMarketplaceItemTypeDefinitions (namespace?: string, name?: string, displayName?: string): Promise<CatalogItemTypeDefinition[]> {
    if (!this.mocks.listMarketplaceItemTypeDefinitionsMockFn) {
      throw new Error('listMarketplaceItemTypeDefinitionsMockFn not mocked')
    }

    return this.mocks.listMarketplaceItemTypeDefinitionsMockFn(namespace, name, displayName)
  }

  async marketplaceItemTypeDefinitionInfo (tenantId: string, name: string): Promise<CatalogItemTypeDefinition> {
    if (!this.mocks.marketplaceItemTypeDefinitionInfoMockFn) {
      throw new Error('marketplaceItemTypeDefinitionInfoMockFn not mocked')
    }

    return this.mocks.marketplaceItemTypeDefinitionInfoMockFn(tenantId, name)
  }

  // #endregion
}
