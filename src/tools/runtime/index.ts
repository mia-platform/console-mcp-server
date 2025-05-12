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

import { AppContext } from '../../server/server'
import { getPodLogs, listPods } from './api'
import { paramsDescriptions, toolNames, toolsDescriptions } from '../../lib/descriptions'

export function addRuntimeCapabilities (server: McpServer, appContext: AppContext) {
  const { client } = appContext
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

  server.tool(
    toolNames.GET_POD_LOGS,
    toolsDescriptions.GET_POD_LOGS,
    {
      projectId: z.string().describe(paramsDescriptions.PROJECT_ID),
      environmentId: z.string().describe(paramsDescriptions.PROJECT_ENVIRONMENT_ID),
      podName: z.string().describe(paramsDescriptions.POD_NAME),
      containerName: z.string().describe(paramsDescriptions.CONTAINER_NAME),
    },
    async ({ projectId, environmentId, podName, containerName }): Promise<CallToolResult> => {
      try {
        const logs = await getPodLogs(client, projectId, environmentId, podName, containerName)
        return {
          content: [
            {
              type: 'text',
              text: `Logs for container ${containerName} in pod ${podName}: ${logs}`,
            },
          ],
        }
      } catch (error) {
        const err = error as Error
        return {
          content: [
            {
              type: 'text',
              text: `Error fetching logs for container ${containerName} in pod ${podName}: ${err.message}`,
            },
          ],
        }
      }
    },
  )
}
