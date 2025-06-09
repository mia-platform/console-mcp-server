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

import { beforeEach, suite, test } from 'node:test'

import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { CallToolResultSchema, ListToolsResultSchema } from '@modelcontextprotocol/sdk/types.js'

import { addMarketplaceCapabilities } from '.'
import { APIClient } from '../../apis/client'
import { TestMCPServer } from '../../server/utils.test'

const elements = [
  { _id: 1, name: 'item1', tenantId: 'public', itemId: 'item-id-1' },
  { _id: 2, name: 'item2', tenantId: 'public', itemId: 'item-id-2' },
  { _id: 3, name: 'item3', tenantId: 'public', itemId: 'item-id-3' },
  { _id: 4, name: 'item4', tenantId: 'tenantID', itemId: 'item-id-4' },
]

const expectedElements = [
  { itemId: 'item-id-1', name: 'item1', tenantId: 'public' },
  { itemId: 'item-id-2', name: 'item2', tenantId: 'public' },
  { itemId: 'item-id-3', name: 'item3', tenantId: 'public' },
  { itemId: 'item-id-4', name: 'item4', tenantId: 'tenantID' },
]

const itemVersions = [
  { _id: 1, name: 'item1', tenantId: 'public', version: '1.0.0' },
  { _id: 1, name: 'item1', tenantId: 'public', version: '1.1.0' },
]

const itemInfo = {
  _id: 1,
  name: 'item',
  tenantId: 'public',
  version: '1.0.0',
}

suite('setup marketplace tools', () => {
  test('should setup marketplace tools to a server', async (t) => {
    const client = await TestMCPServer((server) => {
      addMarketplaceCapabilities(server, {} as APIClient)
    })

    const result = await client.request(
      {
        method: 'tools/list',
      },
      ListToolsResultSchema,
    )

    t.assert.equal(result.tools.length, 3)
  })
})

suite('marketplace list tool', () => {
  let client: Client
  beforeEach(async () => {
    client = await TestMCPServer((server) => {
      addMarketplaceCapabilities(server, {
        async listMarketplaceItems (tenantId, _type, _search): Promise<Record<string, unknown>[]> {
          if (tenantId === 'error') {
            throw new Error('error message')
          }

          return elements
        },
      } as APIClient)
    })
  })

  test('should return public elements', async (t) => {
    const result = await client.request({
      method: 'tools/call',
      params: {
        name: 'list_marketplace',
        arguments: {},
      },
    }, CallToolResultSchema)

    t.assert.deepEqual(result.content, [
      {
        text: JSON.stringify(expectedElements),
        type: 'text',
      },
    ])
  })

  test('should return error message if request return error', async (t) => {
    const result = await client.request({
      method: 'tools/call',
      params: {
        name: 'list_marketplace',
        arguments: {
          tenantId: 'error',
          type: 'example',
        },
      },
    }, CallToolResultSchema)

    t.assert.deepEqual(result.content, [
      {
        text: 'Error fetching marketplace items for company error: error message',
        type: 'text',
      },
    ])
  })
})

suite('marketplace item versions tool', () => {
  let client: Client
  beforeEach(async () => {
    client = await TestMCPServer((server) => {
      addMarketplaceCapabilities(server, {
        async marketplaceItemVersions (tenantID, _itemID): Promise<Record<string, unknown>[]> {
          if (tenantID === 'error') {
            throw new Error('error message')
          }

          return itemVersions
        },
      } as APIClient)
    })
  })

  test('should return item versions', async (t) => {
    const result = await client.request({
      method: 'tools/call',
      params: {
        name: 'list_marketplace_item_versions',
        arguments: {
          marketplaceItemId: 'item-id',
          marketplaceItemTenantId: 'tenantID',
        },
      },
    }, CallToolResultSchema)

    t.assert.deepEqual(result.content, [
      {
        text: JSON.stringify(itemVersions),
        type: 'text',
      },
    ])
  })

  test('should return error message if request return error', async (t) => {
    const result = await client.request({
      method: 'tools/call',
      params: {
        name: 'list_marketplace_item_versions',
        arguments: {
          marketplaceItemId: 'item-id',
          marketplaceItemTenantId: 'error',
        },
      },
    }, CallToolResultSchema)

    t.assert.deepEqual(result.content, [
      {
        text: 'Error fetching marketplace item versions for item-id: error message',
        type: 'text',
      },
    ])
  })
})

suite('marketplace item version info tool', () => {
  let client: Client
  beforeEach(async () => {
    client = await TestMCPServer((server) => {
      addMarketplaceCapabilities(server, {
        async marketplaceItemInfo (tenantID, _itemID, _version): Promise<Record<string, unknown>> {
          if (tenantID === 'error') {
            throw new Error('error message')
          }

          return itemInfo
        },
      } as APIClient)
    })
  })

  test('should return item versions', async (t) => {
    const result = await client.request({
      method: 'tools/call',
      params: {
        name: 'marketplace_item_version_info',
        arguments: {
          marketplaceItemId: 'item-id',
          marketplaceItemTenantId: 'tenantID',
          marketplaceItemVersion: '1.0.0',
        },
      },
    }, CallToolResultSchema)

    t.assert.deepEqual(result.content, [
      {
        text: JSON.stringify(itemInfo),
        type: 'text',
      },
    ])
  })

  test('should return error message if request return error', async (t) => {
    const result = await client.request({
      method: 'tools/call',
      params: {
        name: 'marketplace_item_version_info',
        arguments: {
          marketplaceItemId: 'item-id',
          marketplaceItemTenantId: 'error',
          marketplaceItemVersion: '1.0.0',
        },
      },
    }, CallToolResultSchema)

    t.assert.deepEqual(result.content, [
      {
        text: 'Error fetching marketplace item info for version 1.0.0: error message',
        type: 'text',
      },
    ])
  })
})
