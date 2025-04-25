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
const environmentStatusPath = '/api/projects/{projectId}/environments/{envId}/status'

/**
 * Register environment-related tools with the MCP server
 * 
 * @param server - The MCP Server instance
 * @param client - The API client
 * @returns void
 */
export function environmentTools(server: McpServer, client: APIClient) {
  // Tool: Get Environment Status
  server.tool(
    'd94_environment-status',
    'Get detailed status for a specific project environment',
    {
      projectId: z.string().describe('The ID of the project'),
      envId: z.string().describe('The environment ID (e.g., "DEV", "PROD")')
    },
    async ({ projectId, envId }): Promise<CallToolResult> => {
      try {
        const apiPath = environmentStatusPath
          .replace('{projectId}', projectId)
          .replace('{envId}', envId)
        
        const data = await client.get(apiPath)
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
              text: `Error fetching environment status for project ${projectId} in environment ${envId}: ${err.message}`,
            },
          ],
        }
      }
    }
  )
}
