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

// API Paths
const auditLogsPath = '/api/audit-logs'

/**
 * Register audit log tools with the MCP server
 * 
 * @param server - The MCP Server instance
 * @param client - The API client
 * @returns void
 */
export function auditLogTools(server: McpServer, client: APIClient) {
  // Tool: Get Audit Logs
  server.tool(
    'd94_get-audit-logs',
    'Get audit logs for various actions in the console',
    {
      tenantId: z.string().optional().describe('Filter logs for a specific tenant'),
      projectId: z.string().optional().describe('Filter logs for a specific project'),
      limit: z.number().optional().describe('Limit the number of logs returned'),
      skip: z.number().optional().describe('Skip a number of logs (for pagination)'),
      fromDate: z.string().optional().describe('Start date (ISO format)'),
      toDate: z.string().optional().describe('End date (ISO format)')
    },
    async ({ tenantId, projectId, limit, skip, fromDate, toDate }): Promise<CallToolResult> => {
      try {
        const params = new URLSearchParams()
        
        if (tenantId) params.set('tenantId', tenantId)
        if (projectId) params.set('projectId', projectId)
        if (limit !== undefined) params.set('_l', limit.toString())
        if (skip !== undefined) params.set('_sk', skip.toString())
        if (fromDate) params.set('fromDate', fromDate)
        if (toDate) params.set('toDate', toDate)
        
        const data = await client.get(auditLogsPath, {}, params)
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
              text: `Error fetching audit logs: ${err.message}`,
            },
          ],
        }
      }
    }
  )
}
