// Copyright Mia srl
// SPDX-License-Identifier: Apache-2.0

// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at

//     http://www.apache.org/licenses/LICENSE-2.0

// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import { CallToolResult } from '@modelcontextprotocol/sdk/types.js'
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'

import { APIClient } from '../lib/client'
import { paramDescriptions, toolsDescriptions } from '../lib/descriptions'

const companiesPath = '/api/backend/tenants/'
const companyBlueprint = (tenantId: string) => `/api/backend/tenants/${tenantId}/project-blueprint/`
const listCompanyIAMPathTemplate = (tenantId: string) => `/api/companies/${tenantId}/identities`
const companyAuditLogsPathTemplate = (tenantId: string) => `/api/tenants/${tenantId}/audit-logs`

export function addCompaniesCapabilities (server: McpServer, client:APIClient) {
  server.tool(
    'list_tenants',
    toolsDescriptions.LIST_TENANTS,
    {},
    async (): Promise<CallToolResult> => {
      try {
        const data = await client.getPaginated(companiesPath)
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
    'list_tenant_templates',
    toolsDescriptions.LIST_TENANTS_TEMPLATES,
    {
      tenantId: z.string().describe(paramDescriptions.TENANT_ID),
    },
    async ({ tenantId }): Promise<CallToolResult> => {
      try {
        const blueprint = await client.get<Record<string, unknown>>(companyBlueprint(tenantId))
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
    'list_tenant_iam',
    toolsDescriptions.LIST_TENANTS_IAM,
    {
      tenantId: z.string().describe(paramDescriptions.TENANT_ID),
      identityType: z.enum([ 'user', 'group', 'serviceAccount' ]).optional().describe(paramDescriptions.IAM_IDENTITY_TYPE),
    },
    async ({ tenantId, identityType }): Promise<CallToolResult> => {
      const params = new URLSearchParams()
      if (identityType) {
        params.set('identityType', identityType)
      }

      try {
        const data = await client.getPaginated(listCompanyIAMPathTemplate(tenantId), {}, params, 0)
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
    'view_audit_logs',
    toolsDescriptions.VIEW_TENANTS_AUDIT_LOGS,
    {
      tenantId: z.string().describe(paramDescriptions.TENANT_ID),
      from: z.string().optional().describe(paramDescriptions.AUDIT_LOG_FROM),
      to: z.string().optional().describe(paramDescriptions.AUDIT_LOG_TO),
    },
    async ({ tenantId, from, to }): Promise<CallToolResult> => {
      const params = new URLSearchParams()
      if (from) {
        params.set('from', from)
      }
      if (to) {
        params.set('to', to)
      }

      try {
        const data = await client.getPaginated(companyAuditLogsPathTemplate(tenantId), {}, params, 0)
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
