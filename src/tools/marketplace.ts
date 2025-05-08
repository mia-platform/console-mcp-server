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
import { z } from 'zod'
import { CatalogItem, CatalogItemRelease, CatalogVersionedItem } from '@mia-platform/console-types'

import { APIClient } from '../lib/client'
import { paramsDescriptions, toolNames, toolsDescriptions } from '../lib/descriptions'

const listMarketplacePath = '/api/marketplace/'
const listMarketplaceItemVersions = (tenantId: string, marketplaceId: string) => {
  return `/api/tenants/${tenantId}/marketplace/items/${marketplaceId}/versions`
}
const marketplaceItemVersionInfo = (tenantId: string, marketplaceId: string, version: string) => {
  return `/api/tenants/${tenantId}/marketplace/items/${marketplaceId}/versions/${version}`
}

const types = [
  'application',
  'example',
  'extension',
  'custom-resource',
  'plugin',
  'proxy',
  'sidecar',
  'template',
  '', // allow empty string to indicate no type to filter
] as const

export function addMarketplaceCapabilities (server: McpServer, client:APIClient) {
  server.tool(
    toolNames.LIST_MARKETPLACE,
    toolsDescriptions.LIST_MARKETPLACE,
    {
      tenantId: z.string().optional().describe(paramsDescriptions.TENANT_ID),
      type: z.enum(types).optional().describe(paramsDescriptions.MARKETPLACE_ITEM_TYPE),
    },
    async ({ tenantId, type }): Promise<CallToolResult> => {
      try {
        const data = await listMarketplaceItems(client, tenantId, type)
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
        const data = await listMarketPlaceItemVersions(client, marketplaceItemId, marketplaceItemTenantId)
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
        const data = await getMarketplaceItemVersionInfo(
          client,
          marketplaceItemId,
          marketplaceItemTenantId,
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
}

export async function listMarketplaceItems (client: APIClient, tenantId?: string, type?: string) {
  const params = new URLSearchParams()
  if (tenantId) {
    params.set('includeTenantId', tenantId)
  }
  if (type) {
    params.set('types', type)
  }

  return await client.getPaginated<CatalogItem>(listMarketplacePath, {}, params)
}

export async function listMarketPlaceItemVersions (client: APIClient, itemId: string, tenantId: string) {
  return await client.getPaginated<CatalogItemRelease>(listMarketplaceItemVersions(tenantId, itemId))
}

export async function getMarketplaceItemVersionInfo (client: APIClient, itemId: string, tenantId: string, version: string) {
  return await client.get<CatalogVersionedItem>(marketplaceItemVersionInfo(tenantId, itemId, version))
}
