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

import { APIClient } from '../lib/client'
import { CallToolResult } from '@modelcontextprotocol/sdk/types'
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp'
import { z } from 'zod'
import { paramsDescriptions, toolsDescriptions } from '../lib/descriptions'

const deployPath = (projectId: string) => `/api/deploy/projects/${projectId}/trigger/pipeline/`

interface TriggerDeployResponse {
  id: number
  url: string
}

export function addDeployCapabilities (server: McpServer, client:APIClient) {
  server.tool(
    'deploy',
    toolsDescriptions.DEPLOY_PROJECT,
    {
      projectId: z.string().describe(paramsDescriptions.PROJECT_ID),
      revision: z.string().describe(paramsDescriptions.REVISION),
      refType: z.enum([ 'revision', 'version' ]).describe(paramsDescriptions.REF_TYPE),
      environment: z.string().describe(paramsDescriptions.PROJECT_ENVIRONMENT_ID),
    },
    async ({ projectId, environment, revision, refType }): Promise<CallToolResult> => {
      try {
        const data = await client.post<TriggerDeployResponse>(deployPath(projectId), {
          environment,
          revision,
          refType,
        })
        return {
          content: [
            {
              type: 'text',
              text: `URL to check the deployment status: ${data.url} for pipeline with id ${data.id}`,
            },
          ],
        }
      } catch (error) {
        const err = error as Error
        return {
          content: [
            {
              type: 'text',
              text: `Error deploying project: ${err.message}`,
            },
          ],
        }
      }
    },
  )
}
