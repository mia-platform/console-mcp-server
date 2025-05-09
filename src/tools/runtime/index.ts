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
import { listPods } from './api'
import { paramsDescriptions, toolNames, toolsDescriptions } from '../../lib/descriptions'

export function addRuntimeCapabilities (server: McpServer, client: APIClient) {
  server.tool(
    toolNames.LIST_PODS,
    toolsDescriptions.LIST_PODS,
    {
      projectId: z.string().describe(paramsDescriptions.PROJECT_ID),
      environmentId: z.string().describe(paramsDescriptions.PROJECT_ENVIRONMENT_ID),
    },
    async ({ projectId, environmentId }): Promise<CallToolResult> => {
      try {
        const pods = await listPods(client, projectId, environmentId)
        return {
          content: [
            {
              type: 'text',
              text: `Pods: ${JSON.stringify(pods)}`,
            },
          ],
        }
      } catch (error) {
        const err = error as Error
        return {
          content: [
            {
              type: 'text',
              text: `Error fetching pods: ${err.message}`,
            },
          ],
        }
      }
    },
  )
}
