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
import { MockAgent, setGlobalDispatcher } from 'undici'

import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { CallToolResultSchema, ListToolsResultSchema } from '@modelcontextprotocol/sdk/types.js'

import { addMarketplaceCapabilities } from '.'
import { APIClient } from '../../lib/client'
import { getAppContext, TestMCPServer } from '../../server/test-utils.test'

const mockedEndpoint = 'http://localhost:3000'

const publicElements = [
  { _id: 1, name: 'item1', tenantId: 'public', itemId: 'item-id-1' },
  { _id: 2, name: 'item2', tenantId: 'public', itemId: 'item-id-2' },
  { _id: 3, name: 'item3', tenantId: 'public', itemId: 'item-id-3' },
]

const expectedPublicElementList = [
  { itemId: 'item-id-1', name: 'item1', tenantId: 'public' },
  { itemId: 'item-id-2', name: 'item2', tenantId: 'public' },
  { itemId: 'item-id-3', name: 'item3', tenantId: 'public' },
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

const tenantElement = { _id: 4, name: 'item4', tenantId: 'tenantID', itemId: 'item-id-4' }
const expectedTenantElementList = [
  { itemId: 'item-id-4', name: 'item4', tenantId: 'tenantID' },
]

suite('setup marketplace tools', () => {
  test('should setup marketplace tools to a server', async (t) => {
    const client = await TestMCPServer((server) => {
      const apiClient = new APIClient(mockedEndpoint)
      addMarketplaceCapabilities(server, getAppContext({ client: apiClient }))
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
      const apiClient = new APIClient(mockedEndpoint)
      addMarketplaceCapabilities(server, getAppContext({ client: apiClient }))
    })

    const agent = new MockAgent()
    setGlobalDispatcher(agent)

    agent.get(mockedEndpoint).intercept({
      path: '/api/marketplace/',
      method: 'GET',
      query: {
        per_page: 200,
        page: 1,
      },
      headers: {
        Accept: 'application/json',
      },
    }).reply(200, publicElements)

    agent.get(mockedEndpoint).intercept({
      path: '/api/marketplace/',
      method: 'GET',
      query: {
        per_page: 200,
        page: 1,
        includeTenantId: 'tenantID',
      },
      headers: {
        Accept: 'application/json',
      },
    }).reply(200, [ ...publicElements, tenantElement ])

    agent.get(mockedEndpoint).intercept({
      path: '/api/marketplace/',
      method: 'GET',
      query: {
        per_page: 200,
        page: 1,
        name: 'item1',
      },
      headers: {
        Accept: 'application/json',
      },
    }).reply(200, [ publicElements[0] ])

    agent.get(mockedEndpoint).intercept({
      path: '/api/marketplace/',
      method: 'GET',
      query: {
        per_page: 200,
        page: 1,
        includeTenantId: 'error',
        types: 'example',
      },
      headers: {
        Accept: 'application/json',
      },
    }).reply(500, { message: 'error message' })
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
        text: JSON.stringify(expectedPublicElementList),
        type: 'text',
      },
    ])
  })

  test('should return public elements searching by name', async (t) => {
    const result = await client.request({
      method: 'tools/call',
      params: {
        name: 'list_marketplace',
        arguments: {
          search: 'item1',
        },
      },
    }, CallToolResultSchema)

    t.assert.deepEqual(result.content, [
      {
        text: JSON.stringify([ expectedPublicElementList[0] ]),
        type: 'text',
      },
    ])
  })


  test('should return public elements plus tenant ones', async (t) => {
    const result = await client.request({
      method: 'tools/call',
      params: {
        name: 'list_marketplace',
        arguments: {
          tenantId: 'tenantID',
        },
      },
    }, CallToolResultSchema)

    t.assert.deepEqual(result.content, [
      {
        text: JSON.stringify([ ...expectedPublicElementList, ...expectedTenantElementList ]),
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
      const apiClient = new APIClient(mockedEndpoint)
      addMarketplaceCapabilities(server, getAppContext({ client: apiClient }))
    })

    const agent = new MockAgent()
    setGlobalDispatcher(agent)

    agent.get(mockedEndpoint).intercept({
      path: '/api/tenants/tenantID/marketplace/items/item-id/versions',
      method: 'GET',
      query: {
        per_page: 200,
        page: 1,
      },
      headers: {
        Accept: 'application/json',
      },
    }).reply(200, itemVersions)

    agent.get(mockedEndpoint).intercept({
      path: '/api/tenants/error/marketplace/items/item-id/versions',
      method: 'GET',
      query: {
        per_page: 200,
        page: 1,
      },
      headers: {
        Accept: 'application/json',
      },
    }).reply(500, { message: 'error message' })
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
      const apiClient = new APIClient(mockedEndpoint)
      addMarketplaceCapabilities(server, getAppContext({ client: apiClient }))
    })

    const agent = new MockAgent()
    setGlobalDispatcher(agent)

    agent.get(mockedEndpoint).intercept({
      path: '/api/tenants/tenantID/marketplace/items/item-id/versions/1.0.0',
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
    }).reply(200, itemInfo)

    agent.get(mockedEndpoint).intercept({
      path: '/api/tenants/error/marketplace/items/item-id/versions/1.0.0',
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
    }).reply(500, { message: 'error message' })
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
