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
const compareUpdatePath = (projectId: string) => `/api/deploy/projects/${projectId}/compare/raw`
const pipelineStatusPath = (projectId: string, pipelineId: string) => `/api/deploy/projects/${projectId}/pipelines/${pipelineId}/status/`

interface TriggerDeployResponse {
  id: number
  url: string
}

interface PipelineStatus {
  id: number
  status: string
}

interface Manifest {
  content: string
  name: string
  resourceName: string
  type: string
}

interface CompareForDeployResponse {
  lastDeployedManifests: Manifest[]
  revisionManifests: Manifest[]
}

async function waitForPipelineCompletion (
  client: APIClient,
  projectId: string,
  pipelineId: string,
  timeout = 5 * 60 * 1000,
  interval = 5000,
): Promise<PipelineStatus> {
  const startTime = Date.now()

  while (true) {
    const status = await client.get<PipelineStatus>(pipelineStatusPath(projectId, pipelineId))

    if ([ 'success', 'failed', 'canceled', 'abandoned', 'skipped', 'succededWithIssues' ].includes(status.status)) {
      return status
    }

    if (Date.now() - startTime > timeout) {
      throw new Error(`Pipeline execution timed out after ${timeout}ms`)
    }

    // Wait before polling again
    if (process.env.NODE_ENV === 'test') {
      interval = 0
    }
    await new Promise((resolve) => setTimeout(resolve, interval))
  }
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

  server.tool(
    'compare_update_for_deploy',
    toolsDescriptions.COMPARE_UPDATE_FOR_DEPLOY,
    {
      projectId: z.string().describe(paramsDescriptions.PROJECT_ID),
      environment: z.string().describe(paramsDescriptions.PROJECT_ENVIRONMENT_ID),
      refType: z.enum([ 'revision', 'version' ]).describe(paramsDescriptions.REF_TYPE),
      revision: z.string().describe(paramsDescriptions.REVISION),
    },
    async ({ projectId, environment, revision, refType }): Promise<CallToolResult> => {
      try {
        const data = await client.get<CompareForDeployResponse>(compareUpdatePath(projectId), {}, new URLSearchParams({
          fromEnvironment: environment,
          toRef: revision,
          refType,
        }))
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
              text: `Error retrieving configuration updates: ${err.message}`,
            },
          ],
        }
      }
    },
  )

  server.tool(
    'deploy_pipeline_status',
    toolsDescriptions.PIPELINE_STATUS,
    {
      projectId: z.string().describe(paramsDescriptions.PROJECT_ID),
      pipelineId: z.union([ z.string(), z.number() ]).describe(paramsDescriptions.PIPELINE_ID),
    },
    async ({ projectId, pipelineId }): Promise<CallToolResult> => {
      try {
        const pipelineIdString = typeof pipelineId === 'number'
          ? pipelineId.toString()
          : pipelineId
        const status = await waitForPipelineCompletion(client, projectId, pipelineIdString)

        return {
          content: [
            {
              type: 'text',
              text: `Pipeline status: ${status.status}`,
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
