// Copyright Mia srl
// SPDX-License-Identifier: Apache-2.0

// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at

//     http://www.apache.org/licenses/LICENSE-2.0

// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import { CallToolResult } from '@modelcontextprotocol/sdk/types.js'
import { CatalogItem } from '@mia-platform/console-types'
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'

import { APIClient } from '../lib/client'
import { paramDescriptions, toolsDescriptions } from '../lib/descriptions'

const listMarketplacePath = '/api/marketplace/'

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
    'list_marketplace',
    toolsDescriptions.LIST_MARKETPLACE,
    {
      tenantId: z.string().optional().describe(paramDescriptions.TENANT_ID),
      type: z.enum(types).optional().describe(paramDescriptions.MARKETPLACE_ITEM_TYPE),
    },
    async ({ tenantId, type }): Promise<CallToolResult> => {
      try {
        const params = new URLSearchParams({})
        if (tenantId) {
          params.set('includeTenantId', tenantId)
        }
        if (type) {
          params.set('types', type)
        }

        const data = await client.getPaginated<CatalogItem>(listMarketplacePath, {}, params)
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
}
