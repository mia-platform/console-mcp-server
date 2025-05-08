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
import { Config, IProject } from '@mia-platform/console-types'

import { APIClient } from '../lib/client'
import { NewServicePayload } from '../types/new_service_payload'
import { ConfigToSave, RetrievedConfiguration, SaveResponse } from '../types/save_configuration'
import { paramsDescriptions, toolsDescriptions } from '../lib/descriptions'

const configurationPath = (projectId: string, refId: string) => `/api/backend/projects/${projectId}/revisions/${encodeURIComponent(refId)}/configuration`
const revisionsPath = (projectId: string) => `/api/backend/projects/${projectId}/revisions`
const tagsPath = (projectId: string) => `/api/backend/projects/${projectId}/versions`

export function addConfigurationCapabilities (server: McpServer, client:APIClient) {
  server.tool(
    'list_configuration_revisions',
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

export async function saveConfiguration (client: APIClient, project: IProject, resourcesToCreate: NewServicePayload, refId: string): Promise<SaveResponse> {
  const previousCommit = await client.get<RetrievedConfiguration>(configurationPath(project._id, refId))
  console.error('previousCommit', previousCommit)

  const mergedConfigWithResourceToCreate: Config = mergeConfigWithResources(previousCommit, resourcesToCreate)

  const newConfig: ConfigToSave = {
    title: '[mcp] created resources',
    fastDataConfig: previousCommit.fastDataConfig,
    microfrontendPluginsConfig: previousCommit.microfrontendPluginsConfig || {},
    extensionsConfig: previousCommit.extensionsConfig || { files: {} },
    config: mergedConfigWithResourceToCreate,
    previousSave: previousCommit.commitId,
    deletedElements: {},
  }

  return await client.post<SaveResponse>(configurationPath(project._id, refId), newConfig)
}

function mergeConfigWithResources (previousConfig: Config, resourcesToCreate: NewServicePayload): Config {
  const { services, serviceAccounts, configMaps } = resourcesToCreate
  const { services: previousServices, configMaps: previousConfigMaps, serviceAccounts: previousServiceAccounts } = previousConfig

  // throw an error if a service already exists with the same name
  Object.keys(services).forEach((serviceName) => {
    if (previousServices[serviceName]) {
      throw new Error(`Service ${serviceName} already exists`)
    }
  })

  return {
    ...previousConfig,
    services: {
      ...previousServices,
      ...services,
    },
    configMaps: {
      ...previousConfigMaps,
      ...configMaps,
    },
    serviceAccounts: {
      ...previousServiceAccounts,
      ...serviceAccounts,
    },
  }
}
