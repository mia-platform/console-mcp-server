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
import { AppContext } from '../server/server'
import { paramsDescriptions, toolNames, toolsDescriptions } from '../lib/descriptions'

const companiesPath = '/api/backend/tenants/'
const companyBlueprint = (tenantId: string) => `/api/backend/tenants/${tenantId}/project-blueprint/`
const listCompanyIAMPathTemplate = (tenantId: string) => `/api/companies/${tenantId}/identities`
const companyAuditLogsPathTemplate = (tenantId: string) => `/api/tenants/${tenantId}/audit-logs`

export function addCompaniesCapabilities (server: McpServer, appContext: AppContext) {
  const { client } = appContext

  server.tool(
    toolNames.LIST_TENANTS,
    toolsDescriptions.LIST_TENANTS,
    {},
    async (): Promise<CallToolResult> => {
      try {
        const data = await listCompanies(client)
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
        const blueprint = await listCompanyTemplates(client, tenantId)
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(blueprint['templates'] || []),
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
        const data = await listCompanyIAMIdentities(client, tenantId, identityType)
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
        const data = await getCompanyAuditLogs(client, tenantId, from, to)
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

export async function listCompanies (client: APIClient) {
  return await client.getPaginated<Record<string, unknown>>(companiesPath)
}

export async function listCompanyTemplates (client: APIClient, tenantId: string) {
  return await client.get<Record<string, unknown>>(companyBlueprint(tenantId))
}

export async function listCompanyIAMIdentities (client: APIClient, tenantId: string, type?: string) {
  const params = new URLSearchParams()
  if (type) {
    params.set('identityType', type)
  }

  return await client.getPaginated<Record<string, unknown>>(listCompanyIAMPathTemplate(tenantId), {}, params, 0)
}

export async function getCompanyAuditLogs (client: APIClient, tenantId: string, from?: string, to?: string) {
  const params = new URLSearchParams()
  if (from) {
    params.set('from', from)
  }
  if (to) {
    params.set('to', to)
  }

  return await client.getPaginated<Record<string, unknown>>(companyAuditLogsPathTemplate(tenantId), {}, params, 0)
}
