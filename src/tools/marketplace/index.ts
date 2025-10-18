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

import { assertAiFeaturesEnabledForTenant } from '../utils/validations'
import { CallToolResult } from '@modelcontextprotocol/sdk/types.js'
import { CatalogItemTypeDefinition } from '@mia-platform/console-types'
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'

import { unset } from 'lodash-es'
import { z } from 'zod'

import { IAPIClient } from '../../apis/client'
import { CatalogItemTypes, MarketplaceApplyItemsRequest } from '../../apis/types/marketplace'
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

  server.tool(
    toolNames.GET_MARKETPLACE_CATEGORIES,
    toolsDescriptions.GET_MARKETPLACE_CATEGORIES,
    {},
    async (): Promise<CallToolResult> => {
      try {
        const data = await client.getMarketplaceCategories()
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
              text: `Error fetching marketplace categories: ${err.message}`,
            },
          ],
        }
      }
    },
  )

  server.tool(
    toolNames.APPLY_MARKETPLACE_ITEMS,
    toolsDescriptions.APPLY_MARKETPLACE_ITEMS,
    {
      tenantId: z.string().describe(paramsDescriptions.TENANT_ID),
      items: z.object({
        resources: z.array(z.record(z.unknown())),
      }).describe(paramsDescriptions.MARKETPLACE_ITEMS_TO_APPLY),
    },
    async ({ tenantId, items }): Promise<CallToolResult> => {
      try {
        await assertAiFeaturesEnabledForTenant(client, tenantId)

        const data = await client.applyMarketplaceItems(tenantId, items as MarketplaceApplyItemsRequest)
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
              text: `Error applying marketplace items for tenant ${tenantId}: ${err.message}`,
            },
          ],
        }
      }
    },
  )

  server.tool(
    toolNames.UPSERT_ITEM_TYPE_DEFINITION,
    toolsDescriptions.UPSERT_ITEM_TYPE_DEFINITION,
    {
      tenantId: z.string().describe(paramsDescriptions.TENANT_ID),
      definition: z.record(z.unknown()).describe(paramsDescriptions.MARKETPLACE_ITEM_TYPE_DEFINITION),
    },
    async ({ tenantId, definition }): Promise<CallToolResult> => {
      try {
        await assertAiFeaturesEnabledForTenant(client, tenantId)

        const data = await client.upsertItemTypeDefinition(tenantId, definition as CatalogItemTypeDefinition)

        // Remove binary data fields
        unset(data, 'metadata.icon')
        unset(data, 'metadata.publisher.image')

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
              text: `Error upserting Item Type Definition for tenant ${tenantId}: ${err.message}`,
            },
          ],
        }
      }
    },
  )

  server.tool(
    toolNames.UPLOAD_MARKETPLACE_FILE,
    toolsDescriptions.UPLOAD_MARKETPLACE_FILE,
    {
      tenantId: z.string().describe(paramsDescriptions.TENANT_ID),
      formData: z.any().describe(paramsDescriptions.MARKETPLACE_FILE_FORM_DATA),
    },
    async ({ tenantId, formData }): Promise<CallToolResult> => {
      try {
        await assertAiFeaturesEnabledForTenant(client, tenantId)

        const data = await client.uploadMarketplaceFile(tenantId, formData as FormData)
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
              text: `Error uploading marketplace file for tenant ${tenantId}: ${err.message}`,
            },
          ],
        }
      }
    },
  )
}
