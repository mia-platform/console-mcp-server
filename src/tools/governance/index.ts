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

import { AppContext } from '../../server/server'
import { createProjectFromTemplate, getProjectInfo, listProjects } from './apis/projects'
import { paramsDescriptions, toolNames, toolsDescriptions } from '../../lib/descriptions'

export function addGovernanceCapabilities (server: McpServer, appContext: AppContext) {
  const { client } = appContext
  server.tool(
    toolNames.LIST_PROJECTS,
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
    toolNames.GET_PROJECT_INFO,
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
    toolNames.CREATE_PROJECT_FROM_TEMPLATE,
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
