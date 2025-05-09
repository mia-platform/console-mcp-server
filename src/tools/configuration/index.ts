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
import type { EndpointTypes } from '@mia-platform/console-types/build/constants'
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp'
import { z } from 'zod'
import { constants, Endpoints } from '@mia-platform/console-types'

import { APIClient } from '../../lib/client'
import { ObjectValues } from '../../lib/types'
import { ResourcesToCreate } from './types'
import { getConfiguration, saveConfiguration } from './api'
import { paramsDescriptions, toolNames, toolsDescriptions } from '../../lib/descriptions'

type Endpoint = ObjectValues<Endpoints>

const revisionsPath = (projectId: string) => `/api/backend/projects/${projectId}/revisions`
const tagsPath = (projectId: string) => `/api/backend/projects/${projectId}/versions`

export function addConfigurationCapabilities (server: McpServer, client: APIClient) {
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

  server.tool(
    toolNames.CREATE_OR_UPDATE_ENDPOINT,
    toolsDescriptions.CREATE_OR_UPDATE_ENDPOINT,
    {
      refId: z.string().describe(paramsDescriptions.REF_ID),
      projectId: z.string().describe(paramsDescriptions.PROJECT_ID),
      path: z.string().describe(paramsDescriptions.ENDPOINT_PATH),
      type: z.enum([ constants.EndpointTypes.CUSTOM ]).default(constants.EndpointTypes.CUSTOM).describe(paramsDescriptions.ENDPOINT_TYPE),
      isPublic: z.boolean().default(false).describe(paramsDescriptions.ENDPOINT_IS_PUBLIC),
      acl: z.string().default('true').describe(paramsDescriptions.ENDPOINT_ACL),
      targetService: z.string().describe(paramsDescriptions.ENDPOINT_SERVICE),
      port: z.number().optional().describe(paramsDescriptions.ENDPOINT_PORT),
      pathRewrite: z.string().default('/').describe(paramsDescriptions.ENDPOINT_PATH_REWRITE),
      description: z.string().describe(paramsDescriptions.ENDPOINT_DESCRIPTION),
      listeners: z.array(z.string()).optional().describe(paramsDescriptions.ENDPOINT_LISTENERS),
      showInDocumentation: z.boolean().default(true).describe(paramsDescriptions.ENDPOINT_SHOW_IN_DOCUMENTATION),
    },
    async ({ path, type, isPublic, acl, targetService, port, pathRewrite, description, listeners, refId, projectId }): Promise<CallToolResult> => {
      try {
        const config = await getConfiguration(client, projectId, refId)

        const services = Object.values(config.services || {})
        if (!services.find((s) => s.type === 'custom' && s.advanced === false && [ 'api-gateway', 'api-gateway-envoy' ].includes(s.sourceComponentId || ''))) {
          return {
            content: [
              {
                type: 'text',
                text: `Endpoint needs 'api-gateway' service to be created`,
              },
            ],
          }
        }

        if (!listeners) {
          const defaultListeners = Object.values(config.listeners || {}).find((l) => l.selectedByDefault)
          listeners = defaultListeners
            ? [ defaultListeners.name ]
            : []
        }

        const baseEndpoint = {
          basePath: path,
          public: isPublic,
          acl,
          service: targetService,
          port,
          pathRewrite,
          description,
          listeners: listeners.reduce((acc, listener) => ({ ...acc, [listener]: true }), {}),
          secreted: false,
          showInDocumentation: true,
        }
        let endpointToCreate: Endpoint | undefined = undefined
        switch (type) {
        case constants.EndpointTypes.CUSTOM: {
          endpointToCreate = {
            ...baseEndpoint,
            type: type as EndpointTypes.CUSTOM,
          }
          break
        }
        }

        if (!endpointToCreate) {
          return {
            content: [
              {
                type: 'text',
                text: `Endpoint type ${type} not supported`,
              },
            ],
          }
        }
        return {
          content: [
            {
              type: 'text',
              text: `Endpoint to create: ${JSON.stringify(endpointToCreate)} with base path ${path}`,
            },
          ],
        }
      } catch (error) {
        const err = error as Error
        return {
          content: [
            {
              type: 'text',
              text: `Error creating endpoint: ${err.message}`,
            },
          ],
        }
      }
    },
  )

  server.tool(
    toolNames.CONFIGURATION_TO_SAVE,
    toolsDescriptions.CONFIGURATION_TO_SAVE,
    {
      projectId: z.string().describe(paramsDescriptions.PROJECT_ID),
      refId: z.string().describe(paramsDescriptions.REF_ID),
      endpoints: z.record(z.string(), z.unknown()).optional().describe(paramsDescriptions.ENDPOINTS),
    },
    async ({ projectId, endpoints, refId }): Promise<CallToolResult> => {
      try {
        const resourcesToCreate: ResourcesToCreate = {
          endpoints: endpoints as Endpoints,
        }
        await saveConfiguration(client, projectId, resourcesToCreate, refId)
        return {
          content: [
            {
              type: 'text',
              text: `Configuration saved successfully.`,
            },
          ],
        }
      } catch (error) {
        const err = error as Error
        return {
          content: [
            {
              type: 'text',
              text: `Error saving configuration: ${err.message}`,
            },
          ],
        }
      }
    },
  )

  server.tool(
    toolNames.GET_CONFIGURATION,
    toolsDescriptions.GET_CONFIGURATION,
    {
      projectId: z.string().describe(paramsDescriptions.PROJECT_ID),
      refId: z.string().describe(paramsDescriptions.REF_ID),
    },
    async ({ projectId, refId }): Promise<CallToolResult> => {
      try {
        const config = await getConfiguration(client, projectId, refId)
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(config),
            },
          ],
        }
      } catch (error) {
        const err = error as Error
        return {
          content: [
            {
              type: 'text',
              text: `Error fetching configuration: ${err.message}`,
            },
          ],
        }
      }
    },
  )
}
