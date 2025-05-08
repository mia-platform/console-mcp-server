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

import { CallToolResult } from '@modelcontextprotocol/sdk/types.js'
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'

import { APIClient } from '../lib/client'
import { PostProject } from '../types/post_project'
import { ProjectDraft } from '../types/project_draft'
import { paramsDescriptions, toolsDescriptions } from '../lib/descriptions'

const projectsPath = '/api/backend/projects/'
const getProjectPath = (projectId: string) => `/api/backend/projects/${projectId}/`
const getProjectDraft = '/api/backend/projects/draft'

export function addProjectsCapabilities (server: McpServer, client:APIClient) {
  server.tool(
    'list_projects',
    toolsDescriptions.LIST_PROJECTS,
    {
      tenantIds: z.string().array().nonempty().describe(paramsDescriptions.MULTIPLE_TENANT_IDS),
    },
    async ({ tenantIds }): Promise<CallToolResult> => {
      try {
        const data = await listProjects(client, tenantIds)
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(data),
            },
          ],
        }
      } catch (error) {
        const err = error as Error
        return {
          content: [
            {
              type: 'text',
              text: `Error fetching projects for ${tenantIds.join(', ')}: ${err.message}`,
            },
          ],
        }
      }
    },
  )

  server.tool(
    'get_project_info',
    toolsDescriptions.GET_PROJECT_INFO,
    {
      projectId: z.string().describe(paramsDescriptions.PROJECT_ID),
    },
    async ({ projectId }): Promise<CallToolResult> => {
      try {
        const data = await getProjectInfo(client, projectId)
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(data),
            },
          ],
        }
      } catch (error) {
        const err = error as Error
        return {
          content: [
            {
              type: 'text',
              text: `Error fetching project ${projectId}: ${err.message}`,
            },
          ],
        }
      }
    },
  )

  server.tool(
    'create_project_from_template',
    toolsDescriptions.CREATE_PROJECT_FROM_TEMPLATE,
    {
      tenantId: z.string().describe(paramsDescriptions.TENANT_ID),
      projectName: z.string().describe(paramsDescriptions.PROJECT_NAME),
      projectDescription: z.string().optional().describe(paramsDescriptions.PROJECT_DESCRIPTION),
      templateId: z.string().describe(paramsDescriptions.TEMPLATE_ID),
    },
    async ({ tenantId, projectName, projectDescription, templateId }): Promise<CallToolResult> => {
      try {
        const project = await createProjectFromTemplate(client, tenantId, projectName, templateId, projectDescription)
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(project),
            },
          ],
        }
      } catch (error) {
        const err = error as Error
        return {
          content: [
            {
              type: 'text',
              text: `Error creating project from template ${templateId}: ${err.message}`,
            },
          ],
        }
      }
    },
  )
}

export async function listProjects (client: APIClient, tenantIds: string[]) {
  const params = new URLSearchParams()
  if (tenantIds.length > 0) {
    params.set('tenantIds', tenantIds.join(','))
  }

  return await client.getPaginated<Record<string, unknown>>(projectsPath, {}, params)
}

export async function getProjectInfo (client: APIClient, projectId: string) {
  return await client.get<Record<string, unknown>>(getProjectPath(projectId))
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

  const draftResponse = await client.get<ProjectDraft>(getProjectDraft, {}, params)

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
    ...draftResponse.staticSecret && { secrets: [ draftResponse.staticSecret ] },
    enableConfGenerationOnDeploy: true,
  }

  return await client.post(projectsPath, projectBody)
}
