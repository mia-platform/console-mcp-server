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

import { IProject } from '@mia-platform/console-types'
import { UndiciHeaders } from 'undici/types/dispatcher'

import { HTTPClient } from './http-client'
import { ConfigToSave, RetrievedConfiguration, SaveResponse } from './types/configuration'
import { PostProject, ProjectDraft, Template } from './types/governance'

export const internalEndpoint = 'http://internal.local:3000'

export function BackendClientInternal (
  clientID?: string,
  clientSecret?: string,
  additionalHeaders: UndiciHeaders = {},
): BackendClient {
  const client = new HTTPClient(internalEndpoint, clientID, clientSecret, additionalHeaders)
  return new BackendClient(client, true)
}

export class BackendClient {
  #client: HTTPClient
  #internal: boolean

  constructor (client: HTTPClient, internal = false) {
    this.#client = client
    this.#internal = internal
  }

  listCompanies (): Promise<Record<string, unknown>[]> {
    return this.#client.getPaginated<Record<string, unknown>>(this.#companiesPath())
  }

  companyTemplates (tenantID: string): Promise<Template[]> {
    const params = new URLSearchParams({ tenantId: tenantID })
    return this.#client.getPaginated<Template>(this.#companyTemplatesPath(), params)
  }

  companyIAMIdentities (tenantID: string, type?: string): Promise<Record<string, unknown>[]> {
    const params = new URLSearchParams({
      ...type && { identityType: type },
    })

    return this.#client.getPaginated<Record<string, unknown>>(this.#companyIAMPath(tenantID), params)
  }

  companyAuditLogs (tenantID: string, from?: string, to?: string): Promise<Record<string, unknown>[]> {
    const params = new URLSearchParams({
      ...from && { from },
      ...to && { to },
    })

    return this.#client.getPaginated<Record<string, unknown>>(this.#companyAuditLogsPath(tenantID), params)
  }

  listProjects (tenantIDs: string[], search?: string): Promise<Record<string, unknown>[]> {
    const params = new URLSearchParams({
      ...tenantIDs.length > 0 && { tenantIds: tenantIDs.join(',') },
      ...search && { search },
    })
    return this.#client.getPaginated<Record<string, unknown>>(this.#projectsPath(), params)
  }

  projectInfo (projectID: string): Promise<IProject> {
    return this.#client.get<IProject>(this.#projectInfoPath(projectID))
  }

  projectDraft (tenantID: string, projectID: string, templateID: string, projectName: string, description?: string): Promise<ProjectDraft> {
    const params = new URLSearchParams({
      tenantId: tenantID,
      projectId: projectID,
      templateId: templateID,
      projectName,
      ...description && { description },
    })

    return this.#client.get<ProjectDraft>(this.#projectsDraftPath(), params)
  }

  createProject (body: PostProject): Promise<Record<string, unknown>> {
    return this.#client.post<Record<string, unknown>>(this.#projectsPath(), body)
  }

  projectGitProviderGroups (projectId: string, gitConfigPath: string) {
    const params = new URLSearchParams({
      includeSelf: 'true',
    })

    const escapedPath = encodeURIComponent(gitConfigPath)
    return this.#client.getPaginated<Record<string, unknown>>(
      this.#projectGitProviderSubgroupsPath(projectId, escapedPath),
      params,
    )
  }

  getRevisionBasedConfiguration (prjID: string, refID: string): Promise<RetrievedConfiguration> {
    return this.#client.get<RetrievedConfiguration>(this.#revisionConfigurationPath(prjID, refID))
  }

  getEnvironmentBasedConfiguration (prjID: string, refID: string): Promise<RetrievedConfiguration> {
    return this.#client.get<RetrievedConfiguration>(this.#environmentConfigurationPath(prjID, refID))
  }

  getProjectRevisions (projectID: string): Promise<Record<string, unknown>> {
    return this.#client.get<Record<string, unknown>>(this.#projectRevisionsPath(projectID))
  }

  getProjectVersions (projectID: string): Promise<Record<string, unknown>> {
    return this.#client.get<Record<string, unknown>>(this.#projectVersionsPath(projectID))
  }

  saveRevisionBasedConfiguration (prjID: string, refID: string, configuration: ConfigToSave): Promise<SaveResponse> {
    return this.#client.post<SaveResponse>(this.#revisionConfigurationPath(prjID, refID), configuration)
  }

  saveEnvironmentBasedConfiguration (prjID: string, refID: string, configuration: ConfigToSave): Promise<SaveResponse> {
    return this.#client.post<SaveResponse>(this.#environmentConfigurationPath(prjID, refID), configuration)
  }

  createRepository (
    projectID: string,
    templateID: string,
    name: string,
    resourceName: string,
    projectGroupPath: string,
    imageName: string,
    containerRegistryID?: string,
    pipeline?: string,
    defaultConfigMaps?: Record<string, unknown>[],
    defaultSecrets?: Record<string, unknown>[],
    description?: string,
  ): Promise<Record<string, unknown>> {
    const createServiceRepositoryBody = {
      serviceName: name,
      resourceName: resourceName,
      projectGroupPath,
      ...description && { serviceDescription: description },
      templateId: templateID,
      ...defaultConfigMaps && { defaultConfigMaps },
      ...defaultSecrets && { defaultSecrets },
      repoName: name,
      ...pipeline && { pipeline },
      imageName,
      containerRegistryId: containerRegistryID,
    }

    return this.#client.post<Record<string, unknown>>(this.#createRepositoryPath(projectID), createServiceRepositoryBody)
  }

  #revisionConfigurationPath (prjID: string, refID: string): string {
    if (this.#internal) {
      return `/projects/${prjID}/revisions/${encodeURIComponent(refID)}/configuration`
    }
    return `/api/backend/projects/${prjID}/revisions/${encodeURIComponent(refID)}/configuration`
  }

  #environmentConfigurationPath (prjID: string, refID: string): string {
    if (this.#internal) {
      return `/projects/${prjID}/environments/${encodeURIComponent(refID)}/configuration`
    }
    return `/api/projects/${prjID}/environments/${encodeURIComponent(refID)}/configuration`
  }

  #companiesPath (): string {
    if (this.#internal) {
      return '/tenants/'
    }
    return '/api/backend/tenants/'
  }

  #companyTemplatesPath (): string {
    if (this.#internal) {
      return `/templates/`
    }
    return `/api/backend/templates/`
  }

  #companyIAMPath (tenantID: string): string {
    if (this.#internal) {
      return `/companies/${tenantID}/identities`
    }
    return `/api/companies/${tenantID}/identities`
  }

  #companyAuditLogsPath (tenantID: string): string {
    if (this.#internal) {
      return `/tenants/${tenantID}/audit-logs`
    }
    return `/api/tenants/${tenantID}/audit-logs`
  }

  #projectsPath (): string {
    if (this.#internal) {
      return '/projects/'
    }
    return '/api/backend/projects/'
  }

  #projectsDraftPath (): string {
    if (this.#internal) {
      return '/projects/draft'
    }
    return '/api/backend/projects/draft'
  }

  #projectInfoPath (projectID: string): string {
    if (this.#internal) {
      return `/projects/${projectID}/`
    }
    return `/api/backend/projects/${projectID}/`
  }

  #projectRevisionsPath (projectID: string): string {
    if (this.#internal) {
      return `/projects/${projectID}/revisions`
    }
    return `/api/backend/projects/${projectID}/revisions`
  }

  #projectVersionsPath (projectID: string): string {
    if (this.#internal) {
      return `/projects/${projectID}/versions`
    }
    return `/api/backend/projects/${projectID}/versions`
  }

  #projectGitProviderSubgroupsPath (projectID: string, group: string): string {
    if (this.#internal) {
      return `/projects/${projectID}/groups/${group}/subgroups`
    }
    return `/api/backend/projects/${projectID}/groups/${group}/subgroups`
  }

  #createRepositoryPath (projectID: string): string {
    if (this.#internal) {
      return `/projects/${projectID}/service`
    }
    return `/api/backend/projects/${projectID}/service`
  }
}
