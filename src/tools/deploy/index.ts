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
import { compareForDeploy, triggerDeploy, waitForPipelineCompletion } from './api'
import { paramsDescriptions, toolNames, toolsDescriptions } from '../../lib/descriptions'

export function addDeployCapabilities (server: McpServer, client:APIClient) {
  server.tool(
    toolNames.DEPLOY_PROJECT,
    toolsDescriptions.DEPLOY_PROJECT,
    {
      projectId: z.string().describe(paramsDescriptions.PROJECT_ID),
      revision: z.string().describe(paramsDescriptions.REF_ID),
      refType: z.enum([ 'revision', 'version' ]).describe(paramsDescriptions.REF_TYPE),
      environment: z.string().describe(paramsDescriptions.PROJECT_ENVIRONMENT_ID),
    },
    async ({ projectId, environment, revision, refType }): Promise<CallToolResult> => {
      try {
        const data = await triggerDeploy(client, projectId, { environment, revision, refType })
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
    toolNames.COMPARE_UPDATE_FOR_DEPLOY,
    toolsDescriptions.COMPARE_UPDATE_FOR_DEPLOY,
    {
      projectId: z.string().describe(paramsDescriptions.PROJECT_ID),
      environment: z.string().describe(paramsDescriptions.PROJECT_ENVIRONMENT_ID),
      refType: z.enum([ 'revision', 'version' ]).describe(paramsDescriptions.REF_TYPE),
      revision: z.string().describe(paramsDescriptions.REF_ID),
    },
    async ({ projectId, environment, revision, refType }): Promise<CallToolResult> => {
      try {
        const data = await compareForDeploy(client, projectId, { environment, revision, refType })
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
    toolNames.PIPELINE_STATUS,
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
