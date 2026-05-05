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

import { assertAiFeaturesEnabledForProject } from '../utils/validations'
import { IAPIClient } from '../../apis/client'
import { paramsDescriptions, toolNames, toolsDescriptions } from '../descriptions'

export function addDeployCapabilities (server: McpServer, client: IAPIClient) {
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
        const project = await client.projectInfo(projectId)
        await assertAiFeaturesEnabledForProject(client, project)

        const data = await client.deployProjectEnvironmentFromRevision(projectId, environment, revision, refType)
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
          isError: true,
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
        const project = await client.projectInfo(projectId)
        await assertAiFeaturesEnabledForProject(client, project)

        const data = await client.compareProjectEnvironmentFromRevisionForDeploy(projectId, environment, revision, refType)
        return {
          structuredContent: {
            lastDeployedManifests: data.lastDeployedManifests,
            revisionManifests: data.revisionManifests,
          },
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
          isError: true,
        }
      }
    },
  )

  server.tool(
    toolNames.PIPELINE_STATUS,
    toolsDescriptions.PIPELINE_STATUS,
    {
      projectId: z.string().describe(paramsDescriptions.PROJECT_ID),
      pipelineId: z.string().describe(paramsDescriptions.PIPELINE_ID),
    },
    async ({ projectId, pipelineId }): Promise<CallToolResult> => {
      try {
        const project = await client.projectInfo(projectId)
        await assertAiFeaturesEnabledForProject(client, project)

        const status = await client.waitProjectDeployForCompletion(projectId, pipelineId)

        return {

          structuredContent: {
            id: status.id,
            status: status.status,
          },
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
          isError: true,
        }
      }
    },
  )
}
