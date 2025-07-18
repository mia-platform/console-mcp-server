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

import { APIClient } from '../../apis/client'
import { paramsDescriptions, toolNames, toolsDescriptions } from '../descriptions'

export function addGovernanceCapabilities (server: McpServer, client: APIClient) {
  // Project tools
  server.tool(
    toolNames.LIST_PROJECTS,
    toolNames.LIST_PROJECTS_DESCRIPTION,
    {
      tenantIds: z.string().array().nonempty().describe(paramsDescriptions.MULTIPLE_TENANT_IDS),
      search: z.string().optional().describe(paramsDescriptions.SEARCH_STRING_PROJECT),
    },
    async ({ tenantIds, search }): Promise<CallToolResult> => {
      try {
        const data = await client.listProjects(tenantIds, search)
        const mappedData = data.map((item) => {
          const { _id, name, tenantId, tenantName, description, flavor, info } = item
          return {
            _id,
            name,
            tenantId,
            tenantName,
            description,
            flavor,
            info,
          }
        })
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(mappedData),
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
        const data = await client.projectInfo(projectId)
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
        const project = await client.createProjectFromTemplate(tenantId, projectName, templateId, projectDescription)
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

  // Tenant tools
  server.tool(
    toolNames.LIST_TENANTS,
    toolsDescriptions.LIST_TENANTS,
    {},
    async (): Promise<CallToolResult> => {
      try {
        const data = await client.listCompanies()
        const tenants = data.map((tenant) => {
          return {
            tenantId: tenant.tenantId,
            name: tenant.name,
            defaultTemplateId: tenant.defaultTemplateId,
          }
        })
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(tenants),
            },
          ],
        }
      } catch (error) {
        const err = error as Error
        return {
          content: [
            {
              type: 'text',
              text: `Error fetching companies: ${err.message}`,
            },
          ],
        }
      }
    },
  )

  server.tool(
    toolNames.LIST_TENANT_TEMPLATES,
    toolsDescriptions.LIST_TENANTS_TEMPLATES,
    {
      tenantId: z.string().describe(paramsDescriptions.TENANT_ID),
    },
    async ({ tenantId }): Promise<CallToolResult> => {
      try {
        const templates = await client.companyTemplates(tenantId)
        const mappedBlueprint = (templates || []).map((item) => {
          const { templateId, name, tenantId, deploy } = item
          return {
            templateId,
            name,
            tenantId,
            deploy,
          }
        })
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(mappedBlueprint),
            },
          ],
        }
      } catch (error) {
        const err = error as Error
        return {
          content: [
            {
              type: 'text',
              text: `Error fetching templates for company ${tenantId}: ${err.message}`,
            },
          ],
        }
      }
    },
  )

  server.tool(
    toolNames.LIST_TENANT_IAM,
    toolsDescriptions.LIST_TENANTS_IAM,
    {
      tenantId: z.string().describe(paramsDescriptions.TENANT_ID),
      identityType: z.enum([ 'user', 'group', 'serviceAccount' ]).optional().describe(paramsDescriptions.IAM_IDENTITY_TYPE),
    },
    async ({ tenantId, identityType }): Promise<CallToolResult> => {
      try {
        const data = await client.companyIAMIdentities(tenantId, identityType)
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
              text: `Error fetching IAM for company ${tenantId}: ${err.message}`,
            },
          ],
        }
      }
    },
  )

  server.tool(
    toolNames.VIEW_TENANT_AUDIT_LOGS,
    toolsDescriptions.VIEW_TENANTS_AUDIT_LOGS,
    {
      tenantId: z.string().describe(paramsDescriptions.TENANT_ID),
      from: z.string().optional().describe(paramsDescriptions.AUDIT_LOG_FROM),
      to: z.string().optional().describe(paramsDescriptions.AUDIT_LOG_TO),
    },
    async ({ tenantId, from, to }): Promise<CallToolResult> => {
      try {
        const data = await client.companyAuditLogs(tenantId, from, to)
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
              text: `Error fetching audit logs for company ${tenantId}: ${err.message}`,
            },
          ],
        }
      }
    },
  )
}
