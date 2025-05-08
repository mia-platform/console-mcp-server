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

import { CallToolResult } from '@modelcontextprotocol/sdk/types'
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp'
import { z } from 'zod'

import { APIClient } from '../../lib/client'
import { paramsDescriptions, toolNames, toolsDescriptions } from '../../lib/descriptions'

const revisionsPath = (projectId: string) => `/api/backend/projects/${projectId}/revisions`
const tagsPath = (projectId: string) => `/api/backend/projects/${projectId}/versions`

export function addConfigurationCapabilities (server: McpServer, client:APIClient) {
  server.tool(
    toolNames.LIST_CONFIGURATION_REVISIONS,
    toolsDescriptions.LIST_CONFIGURATION_REVISIONS,
    {
      projectId: z.string().describe(paramsDescriptions.PROJECT_ID),
    },
    async ({ projectId }): Promise<CallToolResult> => {
      try {
        const revisions = await client.get(revisionsPath(projectId))
        const tags = await client.get(tagsPath(projectId))
        return {
          content: [
            {
              type: 'text',
              text: `Revisions: ${JSON.stringify(revisions)}\nVersion: ${JSON.stringify(tags)}`,
            },
          ],
        }
      } catch (error) {
        const err = error as Error
        return {
          content: [
            {
              type: 'text',
              text: `Error fetching revisions or versions: ${err.message}`,
            },
          ],
        }
      }
    },
  )
}
