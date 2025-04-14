// Copyright Mia srl
// SPDX-License-Identifier: Apache-2.0

// Licensed under the Apache License, Version 2.0 (the "License")
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at

//     http://www.apache.org/licenses/LICENSE-2.0

// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import { CatalogItem } from '@mia-platform/console-types'

import { APIClient } from '../lib/client'

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
] as const

export function marketplaceTools(server: McpServer, client:APIClient) {
  server.tool(
    'list_marketplace',
    'List marketplace items for a given company, or the public ones if no company is provided',
    {
      tenantId: z.string().optional(),
      type: z.enum(types).optional()
    },
    async ({ tenantId, type }) => {
      try {
        const params = new URLSearchParams({})
        if (tenantId) {
          params.set('includeTenantId', tenantId)
        }
        if (type) {
          params.set('types', type)
        }

        const data = await client.getPaginated<CatalogItem>(listMarketplacePath, params)
        if (!data || data.length === 0) {
          return {
            content: [
              {
                type: 'text',
                text: `No marketplace items found for company ${tenantId || 'public'}`,
              },
            ],
          }
        }

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
    }
  )
}
