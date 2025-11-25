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

import { CallToolResult } from '@modelcontextprotocol/sdk/types.js'
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { unset } from 'lodash-es'
import { z } from 'zod'

import { assertAiFeaturesEnabledForTenant } from '../utils/validations'
import { CatalogItemTypeDefinition } from '@mia-platform/console-types'
import { CatalogItemTypes } from '../../apis/types/marketplace'
import { IAPIClient } from '../../apis/client'
import { paramsDescriptions, toolNames, toolsDescriptions } from '../descriptions'

export function addMarketplaceCapabilities (server: McpServer, client: IAPIClient) {
  server.tool(
    toolNames.LIST_MARKETPLACE,
    toolsDescriptions.LIST_MARKETPLACE,
    {
      tenantId: z.string().optional().describe(paramsDescriptions.MARKETPLACE_TENANT_ID_FILTER),
      type: z.enum(CatalogItemTypes).optional().describe(paramsDescriptions.MARKETPLACE_ITEM_TYPE),
      search: z.string().optional().describe(paramsDescriptions.MARKETPLACE_ITEM_SEARCH),
    },
    async ({ tenantId, type, search }): Promise<CallToolResult> => {
      try {
        // Only validate AI features if a specific tenantId is provided (not for public marketplace)
        if (tenantId) {
          await assertAiFeaturesEnabledForTenant(client, tenantId)
        }

        const data = await client.listMarketplaceItems(tenantId, type, search)
        const mappedData = data.map((item) => {
          const { itemId, name, tenantId, type, description, supportedBy, isLatest, version } = item

          return {
            itemId,
            name,
            tenantId,
            type,
            description,
            supportedBy,
            isLatest,
            version,
          }
        })
        return {
          structuredContent: { marketplaceItems: mappedData },
          content: [
            {
              type: 'text',
              text: JSON.stringify(mappedData),
            },
          ],
        }
      } catch (error) {
        const err = error as Error
        return {
          content: [
            {
              type: 'text',
              text: `Error fetching marketplace items for company ${tenantId || 'public'}: ${err.message}`,
            },
          ],
        }
      }
    },
  )

  server.tool(
    toolNames.LIST_MARKETPLACE_ITEM_VERSIONS,
    toolsDescriptions.LIST_MARKETPLACE_ITEMS_VERSIONS,
    {
      marketplaceItemId: z.string().describe(paramsDescriptions.MARKETPLACE_ITEM_ID),
      marketplaceItemTenantId: z.string().describe(paramsDescriptions.MARKETPLACE_ITEM_TENANT_ID),
    },
    async ({ marketplaceItemId, marketplaceItemTenantId }): Promise<CallToolResult> => {
      try {
        await assertAiFeaturesEnabledForTenant(client, marketplaceItemTenantId)

        const data = await client.marketplaceItemVersions(marketplaceItemTenantId, marketplaceItemId)
        return {
          structuredContent: { versions: data },
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
              text: `Error fetching marketplace item versions for ${marketplaceItemId}: ${err.message}`,
            },
          ],
        }
      }
    },
  )

  server.tool(
    toolNames.MARKETPLACE_ITEM_VERSION_INFO,
    toolsDescriptions.MARKETPLACE_ITEM_VERSION_INFO,
    {
      marketplaceItemId: z.string().describe(paramsDescriptions.MARKETPLACE_ITEM_ID),
      marketplaceItemTenantId: z.string().describe(paramsDescriptions.MARKETPLACE_ITEM_TENANT_ID),
      marketplaceItemVersion: z.string().describe(paramsDescriptions.MARKETPLACE_ITEM_VERSION),
    },
    async ({ marketplaceItemId, marketplaceItemTenantId, marketplaceItemVersion }): Promise<CallToolResult> => {
      try {
        await assertAiFeaturesEnabledForTenant(client, marketplaceItemTenantId)

        const data = await client.marketplaceItemInfo(
          marketplaceItemTenantId,
          marketplaceItemId,
          marketplaceItemVersion,
        )
        return {
          structuredContent: data,
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
              text: `Error fetching marketplace item info for version ${marketplaceItemVersion}: ${err.message}`,
            },
          ],
        }
      }
    },
  )

  server.tool(
    toolNames.LIST_MARKETPLACE_ITEM_TYPE_DEFINITIONS,
    toolsDescriptions.LIST_MARKETPLACE_ITEM_TYPE_DEFINITIONS,
    {
      namespace: z.string().optional().describe(paramsDescriptions.MARKETPLACE_ITD_LIST_NAMESPACE),
      name: z.string().optional().describe(paramsDescriptions.MARKETPLACE_ITD_LIST_NAME),
      displayName: z.string().optional().describe(paramsDescriptions.MARKETPLACE_ITD_LIST_DISPLAY_NAME),
    },
    async ({ namespace, name, displayName }): Promise<CallToolResult> => {
      try {
        if (namespace) {
          const tenantIds = namespace.split(',')
          await Promise.all(tenantIds.map((tenantId) => assertAiFeaturesEnabledForTenant(client, tenantId)))
        }

        const data = await client.listMarketplaceItemTypeDefinitions(namespace, name, displayName)

        let tenantIdAiFeaturesEnabledMap: Map<string, boolean> | null = null

        // We don't need to check the returned data if the argument is used, since we already checked that all
        // passed namespaces have AI features enabled
        if (!namespace) {
          tenantIdAiFeaturesEnabledMap = new Map()

          const dataTenantIds = new Set(data.map((itd) => itd.metadata.namespace.id))

          const assertAiFeaturesEnabledForTenantPromises: Promise<void>[] = []
          dataTenantIds.forEach((tenantId) => {
            assertAiFeaturesEnabledForTenantPromises.push(assertAiFeaturesEnabledForTenant(client, tenantId).
              then(() => {
                tenantIdAiFeaturesEnabledMap?.set(tenantId, true)
              }).
              catch(() => {
                tenantIdAiFeaturesEnabledMap?.set(tenantId, false)
              }))
          })

          await Promise.all(assertAiFeaturesEnabledForTenantPromises)
        }

        const mappedData = data.reduce<CatalogItemTypeDefinition['metadata'][]>((acc, itd) => {
          if (tenantIdAiFeaturesEnabledMap?.get(itd.metadata.namespace.id) === false) {
            return acc
          }

          return [
            ...acc,
            {
              annotations: itd.metadata.annotations,
              description: itd.metadata.description,
              displayName: itd.metadata.displayName,
              documentation: itd.metadata.documentation,
              labels: itd.metadata.labels,
              links: itd.metadata.links,
              maintainers: itd.metadata.maintainers,
              name: itd.metadata.name,
              namespace: itd.metadata.namespace,
              publisher: itd.metadata.publisher
                ? { name: itd.metadata.publisher.name, url: itd.metadata.publisher.url }
                : undefined,
              tags: itd.metadata.tags,
              visibility: itd.metadata.visibility,
            },
          ]
        }, [])

        return {
          structuredContent: { itemTypeDefinitions: mappedData },
          content: [
            {
              type: 'text',
              text: JSON.stringify(mappedData),
            },
          ],
        }
      } catch (error) {
        const err = error as Error
        return {
          content: [
            {
              type: 'text',
              text: `Error fetching marketplace item type definitions: ${err.message}`,
            },
          ],
        }
      }
    },
  )

  server.tool(
    toolNames.MARKETPLACE_ITEM_TYPE_DEFINITION_INFO,
    toolsDescriptions.MARKETPLACE_ITEM_TYPE_DEFINITION_INFO,
    {
      marketplaceITDTenantId: z.string().describe(paramsDescriptions.MARKETPLACE_ITD_TENANT_ID),
      marketplaceITDName: z.string().describe(paramsDescriptions.MARKETPLACE_ITD_NAME),
    },
    async ({ marketplaceITDName, marketplaceITDTenantId }): Promise<CallToolResult> => {
      try {
        await assertAiFeaturesEnabledForTenant(client, marketplaceITDTenantId)

        const data = await client.marketplaceItemTypeDefinitionInfo(marketplaceITDTenantId, marketplaceITDName)

        unset(data, 'metadata.icon')
        unset(data, 'metadata.publisher.image')

        return {
          structuredContent: data,
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
              text: `Error fetching marketplace Item Type Definition info for namespace ${marketplaceITDTenantId} and name ${marketplaceITDName}: ${err.message}`,
            },
          ],
        }
      }
    },
  )
}
