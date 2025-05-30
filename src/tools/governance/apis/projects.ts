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

import { APIClient } from '../../../lib/client'
import { PostProject, ProjectDraft } from '../types'

const projectsPath = '/api/backend/projects/'
const getProjectPath = (projectId: string) => `/api/backend/projects/${projectId}/`
const getProjectDraft = '/api/backend/projects/draft'
const getProjectGitProviderSubgroups = (projectId: string, group: string) => {
  return `/api/backend/projects/${projectId}/groups/${group}/subgroups`
}
export async function listProjects (client: APIClient, tenantIds: string[], search?: string) {
  const params = new URLSearchParams()
  if (tenantIds.length > 0) {
    params.set('tenantIds', tenantIds.join(','))
  }
  if (search) {
    params.set('search', search)
  }

  return await client.getPaginated<Record<string, unknown>>(projectsPath, params)
}

export async function getProjectInfo (client: APIClient, projectId: string) {
  return await client.get<IProject>(getProjectPath(projectId))
}

export async function createProjectFromTemplate (
  client: APIClient,
  tenantId: string,
  projectName: string,
  templateId: string,
  description?: string,
) {
  const projectId = projectName.replace(/\s+/g, '-').toLowerCase()
  const params = new URLSearchParams({
    tenantId,
    projectId,
    templateId,
    projectName,
  })

  const draftResponse = await client.get<ProjectDraft>(getProjectDraft, params)

  const projectBody: PostProject = {
    name: projectName,
    description,
    tenantId,
    environments: draftResponse.environments || [],
    configurationGitPath: draftResponse.repository?.gitPath || '',
    projectId,
    templateId,
    visibility: draftResponse.repository?.visibility || '',
    providerId: draftResponse.repository?.providerId || '',
    pipelines: draftResponse.pipelines,
    enableConfGenerationOnDeploy: true,
  }

  return await client.post(projectsPath, projectBody)
}

export async function getGitProviderProjectGroups (client: APIClient, projectId: string, gitConfigPath: string) {
  const params = new URLSearchParams({
    includeSelf: 'true',
  })

  const escapedPath = encodeURIComponent(gitConfigPath)
  return await client.getPaginated<Record<string, unknown>>(
    getProjectGitProviderSubgroups(projectId, escapedPath),
    params,
  )
}
