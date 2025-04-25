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
const extensionsPath = '/api/extensibility/extensions'
const rolesPath = '/v2/api/roles/'
const permissionsPath = '/v2/api/permissions/'
const chatCommandsPath = '/api/assistant/chat/commands'

/**
 * Register console system tools with the MCP server
 * 
 * @param server - The MCP Server instance
 * @param client - The API client
 * @returns void
 */
export function consoleSystemTools(server: McpServer, client: APIClient) {
  // Tool 4: Get Console Extensions
  server.tool(
    'd94_get-extensions',
    'Get list of active UI extensions for the console',
    {
      tenantId: z.string().uuid().optional().describe('Filters extensions for a specific tenant')
    },
    async ({ tenantId }): Promise<CallToolResult> => {
      try {
        const params = new URLSearchParams()
        if (tenantId) {
          params.set('tenantId', tenantId)
        }
        
        const data = await client.get(extensionsPath, {}, params)
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
              text: `Error fetching extensions${tenantId ? ` for tenant ${tenantId}` : ''}: ${err.message}`,
            },
          ],
        }
      }
    }
  )

  // Tool 5: List Roles
  server.tool(
    'd94_get-roles',
    'Get definitions of all available user roles',
    {},
    async (): Promise<CallToolResult> => {
      try {
        const data = await client.get(rolesPath)
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
              text: `Error fetching roles: ${err.message}`,
            },
          ],
        }
      }
    }
  )

  // Tool 6: List Permissions
  server.tool(
    'd94_get-permissions',
    'Get definitions of all available permissions',
    {
      limit: z.number().optional().describe('Limit for the number of results')
    },
    async ({ limit }): Promise<CallToolResult> => {
      try {
        const params = new URLSearchParams()
        if (limit !== undefined) {
          params.set('_l', limit.toString())
        } else {
          // Default to a larger value to get all permissions
          params.set('_l', '200')
        }
        
        const data = await client.get(permissionsPath, {}, params)
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
              text: `Error fetching permissions: ${err.message}`,
            },
          ],
        }
      }
    }
  )

  // Tool 7: Get Assistant Chat Commands
  server.tool(
    'd94_get-assistant-chat-commands',
    'Get available chat commands for Mia-Assistant',
    {
      tenant_id: z.string().uuid().describe('The ID of the tenant for which to fetch commands')
    },
    async ({ tenant_id }): Promise<CallToolResult> => {
      try {
        const params = new URLSearchParams({
          tenant_id
        })
        
        const data = await client.get(chatCommandsPath, {}, params)
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
              text: `Error fetching chat commands for tenant ${tenant_id}: ${err.message}`,
            },
          ],
        }
      }
    }
  )
}
