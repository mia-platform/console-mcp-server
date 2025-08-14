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
import { Collections, ConfigMaps, Endpoints, ServiceAccounts, Services } from '@mia-platform/console-types'

import { APIClient } from '../../apis/client'
import { ResourcesToCreate } from '../../apis/types/configuration'
import { paramsDescriptions, toolNames, toolsDescriptions } from '../descriptions'

export const ERR_NO_TENANT_ID = 'No tenantId specified'
export const ERR_AI_FEATURES_NOT_ENABLED = 'AI features are not enabled for tenant:'

async function assertAiFeaturesEnabledForTenant (client: APIClient, tenantId: string): Promise<void> {
  // Placeholder for actual feature check logic
  // This function should throw an error if AI features are not enabled for the given tenant
  if (!tenantId) {
    throw new Error(ERR_NO_TENANT_ID)
  }

  const isEnabled = await client.isAiFeaturesEnabledForTenant(tenantId)
  if (!isEnabled) {
    throw new Error(`${ERR_AI_FEATURES_NOT_ENABLED} '${tenantId}'`)
  }
}

export function addConfigurationCapabilities (server: McpServer, client: APIClient) {
  server.tool(
    toolNames.LIST_CONFIGURATION_REVISIONS,
    toolsDescriptions.LIST_CONFIGURATION_REVISIONS,
    {
      tenantId: z.string().describe(paramsDescriptions.TENANT_ID),
      projectId: z.string().describe(paramsDescriptions.PROJECT_ID),
    },
    async ({ projectId, tenantId }): Promise<CallToolResult> => {
      try {
        await assertAiFeaturesEnabledForTenant(client, tenantId)

        const revisions = await client.getConfigurationRevisions(projectId)
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(revisions),
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
    toolNames.GET_CONFIGURATION,
    toolsDescriptions.GET_CONFIGURATION,
    {
      tenantId: z.string().describe(paramsDescriptions.TENANT_ID),
      projectId: z.string().describe(paramsDescriptions.PROJECT_ID),
      refId: z.string().describe(paramsDescriptions.REF_ID),
    },
    async ({ tenantId, projectId, refId }): Promise<CallToolResult> => {
      try {
        await assertAiFeaturesEnabledForTenant(client, tenantId)

        const config = await client.getConfiguration(projectId, refId)
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

  server.tool(
    toolNames.CONFIGURATION_TO_SAVE,
    toolsDescriptions.CONFIGURATION_TO_SAVE,
    {
      tenantId: z.string().describe(paramsDescriptions.TENANT_ID),
      projectId: z.string().describe(paramsDescriptions.PROJECT_ID),
      refId: z.string().describe(paramsDescriptions.REF_ID),
      endpoints: z.record(z.string(), z.unknown()).optional().describe(paramsDescriptions.ENDPOINTS),
      collections: z.record(z.string(), z.unknown()).optional().describe(paramsDescriptions.COLLECTIONS),
      services: z.record(z.string(), z.unknown()).optional().describe(paramsDescriptions.SERVICES),
      configMaps: z.record(z.string(), z.unknown()).optional().describe(paramsDescriptions.CONFIG_MAPS),
      serviceAccounts: z.record(z.string(), z.unknown()).optional().describe(paramsDescriptions.SERVICE_ACCOUNTS),
    },
    async ({ tenantId, projectId, endpoints, collections, refId, services, configMaps, serviceAccounts }): Promise<CallToolResult> => {
      try {
        await assertAiFeaturesEnabledForTenant(client, tenantId)

        const resourcesToCreate: ResourcesToCreate = {
          endpoints: endpoints as Endpoints,
          collections: collections as Collections,
          services: services as Services,
          configMaps: configMaps as ConfigMaps,
          serviceAccounts: serviceAccounts as ServiceAccounts,
        }
        await client.saveConfiguration(projectId, refId, resourcesToCreate)
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
}
