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

import assert from 'node:assert'
import { it, mock, suite, test } from 'node:test'

import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { CallToolResultSchema, ListToolsResultSchema } from '@modelcontextprotocol/sdk/types.js'
import { CatalogItemRelease, CatalogItemTypeDefinition, CatalogVersionedItem } from '@mia-platform/console-types'

import { addMarketplaceCapabilities } from '.'
import { ERR_AI_FEATURES_NOT_ENABLED } from '../utils/validations'
import { TestMCPServer } from '../../server/utils.test'
import {
  APIClientMock,
  APIClientMockFunctions,
} from '../../apis/client'

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
  {
    _id: 1,
    name: 'item1',
    tenantId: 'public',
    version: '1.0.0',
  },
  {
    _id: 1,
    name: 'item1',
    tenantId: 'public',
    version: '1.1.0',
  },
]

const itemInfo = {
  _id: 1,
  name: 'item',
  tenantId: 'public',
  version: '1.0.0',
}

const itemTypeDefinitions: CatalogItemTypeDefinition[] = [
  {
    apiVersion: 'software-catalog.mia-platform.eu/v1',
    kind: 'item-type-definition',
    metadata: {
      namespace: { scope: 'tenant', id: 'mia-platform' },
      displayName: 'Plugin ITD',
      name: 'plugin',
      visibility: { scope: 'console' },
      annotations: { foo: 'bar' },
      description: 'Description...',
      documentation: { url: 'http://example.com', type: 'external' },
      icon: { base64Data: 'abc', mediaType: 'image/png' },
      labels: { foo: 'bar' },
      links: [ { url: 'example.com', displayName: 'Example' } ],
      maintainers: [ { email: 'test@test.com', name: 'John Doe' } ],
      publisher: {
        name: 'John Doe',
        url: 'http://example.com',
        image: { base64Data: 'abc', mediaType: 'image/png' },
      },
      tags: [ 'foo', 'bar' ],
    },
    spec: {
      isVersioningSupported: true,
      type: 'plugin',
      scope: 'tenant',
      validation: {
        mechanism: 'json-schema',
        schema: { type: 'object' },
      },
    },
    __v: 1,
  },
  {
    apiVersion: 'software-catalog.mia-platform.eu/v1',
    kind: 'item-type-definition',
    metadata: {
      namespace: { scope: 'tenant', id: 'my-company' },
      displayName: 'Custom Workload ITD',
      name: 'custom-workload',
      visibility: { scope: 'tenant', ids: [ 'my-company' ] },
    },
    spec: {
      type: 'custom-workload',
      scope: 'tenant',
      validation: {
        mechanism: 'json-schema',
        schema: { type: 'object' },
      },
    },
    __v: 1,
  },
]

async function getTestMCPServerClient (mocks: APIClientMockFunctions): Promise<Client> {
  const client = await TestMCPServer((server) => {
    addMarketplaceCapabilities(server, new APIClientMock(mocks))
  })

  return client
}

suite('setup marketplace tools', () => {
  test('should setup marketplace tools to a server', async (t) => {
    const client = await TestMCPServer((server) => {
      addMarketplaceCapabilities(server, new APIClientMock({}))
    })

    const result = await client.request(
      {
        method: 'tools/list',
      },
      ListToolsResultSchema,
    )

    t.assert.equal(result.tools.length, 9)
  })
})

suite('marketplace list tool', () => {
  const listMarketplaceItemsMockFn = mock.fn(async (tenantId?: string) => {
    if (tenantId === 'error') {
      throw new Error('error message')
    }
    return elements
  })

  test('should return public elements', async (t) => {
    const client = await getTestMCPServerClient({
      listMarketplaceItemsMockFn,
    })

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

  it('returns error - if AI features are not enabled for tenant', async (t) => {
    const testTenantId = 'tenant123'

    const aiFeaturesMockFn = mock.fn(async (tenantId: string) => {
      assert.strictEqual(tenantId, testTenantId)
      return false
    })

    const client = await getTestMCPServerClient({
      isAiFeaturesEnabledForTenantMockFn: aiFeaturesMockFn,
    })

    const result = await client.request({
      method: 'tools/call',
      params: {
        name: 'list_marketplace',
        arguments: {
          tenantId: testTenantId,
          type: 'example',
        },
      },
    }, CallToolResultSchema)

    t.assert.deepEqual(result.content, [
      {
        text: `Error fetching marketplace items for company ${testTenantId}: ${ERR_AI_FEATURES_NOT_ENABLED} '${testTenantId}'`,
        type: 'text',
      },
    ])
  })

  test('should return error message if request return error', async (t) => {
    const client = await getTestMCPServerClient({
      isAiFeaturesEnabledForTenantMockFn: async () => true,
      listMarketplaceItemsMockFn,
    })

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
  const marketplaceItemVersionsMockFn = mock.fn(async (tenantID: string, _itemID: string): Promise<CatalogItemRelease[]> => {
    if (tenantID === 'error') throw new Error('error message')

    return itemVersions as unknown as CatalogItemRelease[]
  })

  it('returns error - if AI features are not enabled for tenant', async (t) => {
    const testTenantId = 'tenant123'

    const aiFeaturesMockFn = mock.fn(async (tenantId: string) => {
      assert.strictEqual(tenantId, testTenantId)
      return false
    })

    const client = await getTestMCPServerClient({
      isAiFeaturesEnabledForTenantMockFn: aiFeaturesMockFn,
    })

    const result = await client.request({
      method: 'tools/call',
      params: {
        name: 'list_marketplace_item_versions',
        arguments: {
          marketplaceItemId: 'item-id',
          marketplaceItemTenantId: testTenantId,
        },
      },
    }, CallToolResultSchema)

    t.assert.deepEqual(result.content, [
      {
        text: `Error fetching marketplace item versions for item-id: ${ERR_AI_FEATURES_NOT_ENABLED} '${testTenantId}'`,
        type: 'text',
      },
    ])
  })

  test('should return item versions', async (t) => {
    const testTenantId = 'tenantID'

    const client = await getTestMCPServerClient({
      isAiFeaturesEnabledForTenantMockFn: async () => true,
      marketplaceItemVersionsMockFn,
    })

    const result = await client.request({
      method: 'tools/call',
      params: {
        name: 'list_marketplace_item_versions',
        arguments: {
          marketplaceItemId: 'item-id',
          marketplaceItemTenantId: testTenantId,
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
    const client = await getTestMCPServerClient({
      isAiFeaturesEnabledForTenantMockFn: async () => true,
      marketplaceItemVersionsMockFn,
    })

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
  const marketplaceItemInfoMockFn = mock.fn(async (tenantID: string, _itemID: string, _version?: string): Promise<CatalogVersionedItem> => {
    if (tenantID === 'error') {
      throw new Error('error message')
    }
    return itemInfo as unknown as CatalogVersionedItem
  })

  it('returns error - if AI features are not enabled for tenant', async (t) => {
    const testTenantId = 'tenant123'

    const aiFeaturesMockFn = mock.fn(async (tenantId: string) => {
      assert.strictEqual(tenantId, testTenantId)
      return false
    })

    const client = await getTestMCPServerClient({
      isAiFeaturesEnabledForTenantMockFn: aiFeaturesMockFn,
    })

    const result = await client.request({
      method: 'tools/call',
      params: {
        name: 'marketplace_item_version_info',
        arguments: {
          marketplaceItemId: 'item-id',
          marketplaceItemTenantId: testTenantId,
          marketplaceItemVersion: '1.0.0',
        },
      },
    }, CallToolResultSchema)

    t.assert.deepEqual(result.content, [
      {
        text: `Error fetching marketplace item info for version 1.0.0: ${ERR_AI_FEATURES_NOT_ENABLED} '${testTenantId}'`,
        type: 'text',
      },
    ])
  })

  test('should return item version info', async (t) => {
    const testTenantId = 'tenantID'

    const client = await getTestMCPServerClient({
      isAiFeaturesEnabledForTenantMockFn: async () => true,
      marketplaceItemInfoMockFn,
    })

    const result = await client.request({
      method: 'tools/call',
      params: {
        name: 'marketplace_item_version_info',
        arguments: {
          marketplaceItemId: 'item-id',
          marketplaceItemTenantId: testTenantId,
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
    const client = await getTestMCPServerClient({
      isAiFeaturesEnabledForTenantMockFn: async () => true,
      marketplaceItemInfoMockFn,
    })

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

suite('marketplace Item Type Definitions list tool', async () => {
  const listMarketplaceItemTypeDefinitionsMockFn = mock.fn(async (namespace?: string) => {
    if (namespace === 'error') {
      throw new Error('error message')
    }

    return itemTypeDefinitions
  })

  test('should return ITDs', async (t) => {
    const isAiFeaturesEnabledForTenantMockFn = mock.fn(async () => true)

    const client = await getTestMCPServerClient({
      isAiFeaturesEnabledForTenantMockFn,
      listMarketplaceItemTypeDefinitionsMockFn,
    })

    const result = await client.request({
      method: 'tools/call',
      params: {
        name: 'list_marketplace_item_type_definitions',
        arguments: {},
      },
    }, CallToolResultSchema)

    const expectedITDs = [
      {
        annotations: { foo: 'bar' },
        description: 'Description...',
        displayName: 'Plugin ITD',
        documentation: { url: 'http://example.com', type: 'external' },
        labels: { foo: 'bar' },
        links: [ { url: 'example.com', displayName: 'Example' } ],
        maintainers: [ { email: 'test@test.com', name: 'John Doe' } ],
        name: 'plugin',
        namespace: { scope: 'tenant', id: 'mia-platform' },
        publisher: {
          name: 'John Doe',
          url: 'http://example.com',
        },
        tags: [ 'foo', 'bar' ],
        visibility: { scope: 'console' },
      },
      {
        displayName: 'Custom Workload ITD',
        name: 'custom-workload',
        namespace: { scope: 'tenant', id: 'my-company' },
        visibility: { scope: 'tenant', ids: [ 'my-company' ] },
      },
    ]

    t.assert.deepEqual(result.content, [
      {
        text: JSON.stringify(expectedITDs),
        type: 'text',
      },
    ])

    t.assert.equal(isAiFeaturesEnabledForTenantMockFn.mock.callCount(), 2)
    t.assert.deepEqual(isAiFeaturesEnabledForTenantMockFn.mock.calls.at(0)!.arguments, [ 'mia-platform' ])
    t.assert.deepEqual(isAiFeaturesEnabledForTenantMockFn.mock.calls.at(1)!.arguments, [ 'my-company' ])
  })

  test('should return ITDs with namespace param if all namespaces have AI features enabled', async (t) => {
    const isAiFeaturesEnabledForTenantMockFn = mock.fn(async () => true)

    const client = await getTestMCPServerClient({
      isAiFeaturesEnabledForTenantMockFn,
      listMarketplaceItemTypeDefinitionsMockFn,
    })

    const result = await client.request({
      method: 'tools/call',
      params: {
        name: 'list_marketplace_item_type_definitions',
        arguments: {
          namespace: 'mia-platform,my-company,other-company',
        },
      },
    }, CallToolResultSchema)

    const expectedITDs = [
      {
        annotations: { foo: 'bar' },
        description: 'Description...',
        displayName: 'Plugin ITD',
        documentation: { url: 'http://example.com', type: 'external' },
        labels: { foo: 'bar' },
        links: [ { url: 'example.com', displayName: 'Example' } ],
        maintainers: [ { email: 'test@test.com', name: 'John Doe' } ],
        name: 'plugin',
        namespace: { scope: 'tenant', id: 'mia-platform' },
        publisher: {
          name: 'John Doe',
          url: 'http://example.com',
        },
        tags: [ 'foo', 'bar' ],
        visibility: { scope: 'console' },
      },
      {
        displayName: 'Custom Workload ITD',
        name: 'custom-workload',
        namespace: { scope: 'tenant', id: 'my-company' },
        visibility: { scope: 'tenant', ids: [ 'my-company' ] },
      },
    ]

    t.assert.deepEqual(result.content, [
      {
        text: JSON.stringify(expectedITDs),
        type: 'text',
      },
    ])

    t.assert.equal(isAiFeaturesEnabledForTenantMockFn.mock.callCount(), 3)
    t.assert.deepEqual(isAiFeaturesEnabledForTenantMockFn.mock.calls.at(0)!.arguments, [ 'mia-platform' ])
    t.assert.deepEqual(isAiFeaturesEnabledForTenantMockFn.mock.calls.at(1)!.arguments, [ 'my-company' ])
    t.assert.deepEqual(isAiFeaturesEnabledForTenantMockFn.mock.calls.at(2)!.arguments, [ 'other-company' ])
  })

  test('should return error message if namespace param is used and not all namespaces have AI features enabled', async (t) => {
    const isAiFeaturesEnabledForTenantMockFn = mock.fn(async (tenantId: string) => {
      if (tenantId === 'other-company') {
        throw new Error('error message')
      }

      return true
    })

    const client = await getTestMCPServerClient({
      isAiFeaturesEnabledForTenantMockFn,
      listMarketplaceItemTypeDefinitionsMockFn,
    })

    const result = await client.request({
      method: 'tools/call',
      params: {
        name: 'list_marketplace_item_type_definitions',
        arguments: {
          namespace: 'mia-platform,other-company',
        },
      },
    }, CallToolResultSchema)

    t.assert.deepEqual(result.content, [
      {
        text: 'Error fetching marketplace item type definitions: error message',
        type: 'text',
      },
    ])

    t.assert.equal(isAiFeaturesEnabledForTenantMockFn.mock.callCount(), 2)
    t.assert.deepEqual(isAiFeaturesEnabledForTenantMockFn.mock.calls.at(0)!.arguments, [ 'mia-platform' ])
    t.assert.deepEqual(isAiFeaturesEnabledForTenantMockFn.mock.calls.at(1)!.arguments, [ 'other-company' ])
  })

  test('should return ITDs filtering out namespaces without AI features enabled', async (t) => {
    const isAiFeaturesEnabledForTenantMockFn = mock.fn(async (tenantId: string) => {
      if (tenantId === 'my-company') {
        throw new Error('error message')
      }

      return true
    })

    const client = await getTestMCPServerClient({
      isAiFeaturesEnabledForTenantMockFn,
      listMarketplaceItemTypeDefinitionsMockFn,
    })

    const result = await client.request({
      method: 'tools/call',
      params: {
        name: 'list_marketplace_item_type_definitions',
        arguments: {},
      },
    }, CallToolResultSchema)

    const expectedITDs = [
      {
        annotations: { foo: 'bar' },
        description: 'Description...',
        displayName: 'Plugin ITD',
        documentation: { url: 'http://example.com', type: 'external' },
        labels: { foo: 'bar' },
        links: [ { url: 'example.com', displayName: 'Example' } ],
        maintainers: [ { email: 'test@test.com', name: 'John Doe' } ],
        name: 'plugin',
        namespace: { scope: 'tenant', id: 'mia-platform' },
        publisher: {
          name: 'John Doe',
          url: 'http://example.com',
        },
        tags: [ 'foo', 'bar' ],
        visibility: { scope: 'console' },
      },
    ]

    t.assert.deepEqual(result.content, [
      {
        text: JSON.stringify(expectedITDs),
        type: 'text',
      },
    ])

    t.assert.equal(isAiFeaturesEnabledForTenantMockFn.mock.callCount(), 2)
    t.assert.deepEqual(isAiFeaturesEnabledForTenantMockFn.mock.calls.at(0)!.arguments, [ 'mia-platform' ])
    t.assert.deepEqual(isAiFeaturesEnabledForTenantMockFn.mock.calls.at(1)!.arguments, [ 'my-company' ])
  })

  test('should return error message if request return error', async (t) => {
    const client = await getTestMCPServerClient({
      isAiFeaturesEnabledForTenantMockFn: async () => true,
      listMarketplaceItemTypeDefinitionsMockFn,
    })

    const result = await client.request({
      method: 'tools/call',
      params: {
        name: 'list_marketplace_item_type_definitions',
        arguments: { namespace: 'error' },
      },
    }, CallToolResultSchema)

    t.assert.deepEqual(result.content, [
      {
        text: 'Error fetching marketplace item type definitions: error message',
        type: 'text',
      },
    ])
  })
})

suite('marketplace Item Type Definition info tool', async () => {
  const marketplaceItemTypeDefinitionInfoMockFn = mock.fn(async (tenantID?: string) => {
    if (tenantID === 'error') {
      throw new Error('error message')
    }

    return itemTypeDefinitions.at(0) as CatalogItemTypeDefinition
  })

  test('should return the ITD', async (t) => {
    const client = await getTestMCPServerClient({
      isAiFeaturesEnabledForTenantMockFn: async () => true,
      marketplaceItemTypeDefinitionInfoMockFn,
    })

    const result = await client.request({
      method: 'tools/call',
      params: {
        name: 'marketplace_item_type_definition_info',
        arguments: {
          marketplaceITDTenantId: 'tenantID',
          marketplaceITDName: 'itdName',
        },
      },
    }, CallToolResultSchema)

    const expectedITD = {
      apiVersion: 'software-catalog.mia-platform.eu/v1',
      kind: 'item-type-definition',
      metadata: {
        namespace: { scope: 'tenant', id: 'mia-platform' },
        displayName: 'Plugin ITD',
        name: 'plugin',
        visibility: { scope: 'console' },
        annotations: { foo: 'bar' },
        description: 'Description...',
        documentation: { url: 'http://example.com', type: 'external' },
        labels: { foo: 'bar' },
        links: [ { url: 'example.com', displayName: 'Example' } ],
        maintainers: [ { email: 'test@test.com', name: 'John Doe' } ],
        publisher: {
          name: 'John Doe',
          url: 'http://example.com',
        },
        tags: [ 'foo', 'bar' ],
      },
      spec: {
        isVersioningSupported: true,
        type: 'plugin',
        scope: 'tenant',
        validation: {
          mechanism: 'json-schema',
          schema: { type: 'object' },
        },
      },
      __v: 1,
    }

    t.assert.deepEqual(result.content, [
      {
        text: JSON.stringify(expectedITD),
        type: 'text',
      },
    ])
  })

  it('should return an error if AI features are not enabled for tenant', async (t) => {
    const testTenantId = 'tenant123'

    const aiFeaturesMockFn = mock.fn(async (tenantId: string) => {
      assert.strictEqual(tenantId, testTenantId)
      return false
    })

    const client = await getTestMCPServerClient({
      isAiFeaturesEnabledForTenantMockFn: aiFeaturesMockFn,
    })

    const result = await client.request({
      method: 'tools/call',
      params: {
        name: 'marketplace_item_type_definition_info',
        arguments: {
          marketplaceITDTenantId: testTenantId,
          marketplaceITDName: 'itdName',
        },
      },
    }, CallToolResultSchema)

    t.assert.deepEqual(result.content, [
      {
        text: `Error fetching marketplace Item Type Definition info for namespace ${testTenantId} and name itdName: ${ERR_AI_FEATURES_NOT_ENABLED} '${testTenantId}'`,
        type: 'text',
      },
    ])
  })

  test('should return error message if request return error', async (t) => {
    const client = await getTestMCPServerClient({
      isAiFeaturesEnabledForTenantMockFn: async () => true,
      marketplaceItemTypeDefinitionInfoMockFn,
    })

    const result = await client.request({
      method: 'tools/call',
      params: {
        name: 'marketplace_item_type_definition_info',
        arguments: {
          marketplaceITDTenantId: 'error',
          marketplaceITDName: 'itdName',
        },
      },
    }, CallToolResultSchema)

    t.assert.deepEqual(result.content, [
      {
        text: 'Error fetching marketplace Item Type Definition info for namespace error and name itdName: error message',
        type: 'text',
      },
    ])
  })
})

suite('marketplace categories tool', () => {
  const getMarketplaceCategoriesMockFn = mock.fn(async () => {
    return [
      { categoryId: 'ai-agents', label: 'AI Agents' },
      { categoryId: 'databases', label: 'Databases' },
    ]
  })

  test('should return categories', async (t) => {
    const client = await getTestMCPServerClient({
      getMarketplaceCategoriesMockFn,
    })

    const result = await client.request({
      method: 'tools/call',
      params: {
        name: 'get_marketplace_categories',
        arguments: {},
      },
    }, CallToolResultSchema)

    t.assert.deepEqual(result.content, [
      {
        text: JSON.stringify([
          { categoryId: 'ai-agents', label: 'AI Agents' },
          { categoryId: 'databases', label: 'Databases' },
        ]),
        type: 'text',
      },
    ])
  })

  test('should return error when categories fetch fails', async (t) => {
    const getMarketplaceCategoriesErrorMockFn = mock.fn(async () => {
      throw new Error('categories error')
    })

    const client = await getTestMCPServerClient({
      getMarketplaceCategoriesMockFn: getMarketplaceCategoriesErrorMockFn,
    })

    const result = await client.request({
      method: 'tools/call',
      params: {
        name: 'get_marketplace_categories',
        arguments: {},
      },
    }, CallToolResultSchema)

    t.assert.deepEqual(result.content, [
      {
        text: 'Error fetching marketplace categories: categories error',
        type: 'text',
      },
    ])
  })
})

suite('apply marketplace items tool', () => {
  const applyMarketplaceItemsMockFn = mock.fn(async (tenantId: string) => {
    if (tenantId === 'error') {
      throw new Error('apply error')
    }
    return {
      resources: [
        {
          _id: '507f1f77bcf86cd799439011',
          itemId: 'test-item',
          tenantId: 'test-tenant',
          version: '1.0.0',
          status: 'created' as const,
        },
      ],
    }
  })

  test('should apply marketplace items', async (t) => {
    const client = await getTestMCPServerClient({
      isAiFeaturesEnabledForTenantMockFn: mock.fn(async () => true),
      applyMarketplaceItemsMockFn,
    })

    const result = await client.request({
      method: 'tools/call',
      params: {
        name: 'apply_marketplace_items',
        arguments: {
          tenantId: 'test-tenant',
          items: {
            resources: [
              {
                name: 'Test Item',
                itemId: 'test-item',
                tenantId: 'test-tenant',
                resources: {},
                lifecycleStatus: 'published',
              },
            ],
          },
        },
      },
    }, CallToolResultSchema)

    const expectedResponse = {
      resources: [
        {
          _id: '507f1f77bcf86cd799439011',
          itemId: 'test-item',
          tenantId: 'test-tenant',
          version: '1.0.0',
          status: 'created',
        },
      ],
    }

    t.assert.deepEqual(result.content, [
      {
        text: JSON.stringify(expectedResponse),
        type: 'text',
      },
    ])
  })

  test('should return error - if AI features are not enabled for tenant', async (t) => {
    const client = await getTestMCPServerClient({
      isAiFeaturesEnabledForTenantMockFn: mock.fn(async () => {
        throw new Error('AI features not enabled')
      }),
      applyMarketplaceItemsMockFn,
    })

    const result = await client.request({
      method: 'tools/call',
      params: {
        name: 'apply_marketplace_items',
        arguments: {
          tenantId: 'test-tenant',
          items: { resources: [] },
        },
      },
    }, CallToolResultSchema)

    t.assert.deepEqual(result.content, [
      {
        text: 'Error applying marketplace items for tenant test-tenant: AI features not enabled',
        type: 'text',
      },
    ])
  })
})

suite('upsert item type definition tool', () => {
  const upsertItemTypeDefinitionMockFn = mock.fn(async (tenantId: string) => {
    if (tenantId === 'error') {
      throw new Error('upsert error')
    }
    return {
      apiVersion: 'software-catalog.mia-platform.eu/v1',
      kind: 'item-type-definition',
      metadata: {
        namespace: { scope: 'tenant', id: tenantId },
        name: 'custom-plugin',
        displayName: 'Custom Plugin',
        visibility: { scope: 'tenant', ids: [ tenantId ] },
      },
      spec: {
        type: 'custom-plugin',
        scope: 'tenant',
        validation: {
          mechanism: 'json-schema',
          schema: { type: 'object' },
        },
      },
      __v: 0,
    }
  })

  test('should upsert item type definition', async (t) => {
    const client = await getTestMCPServerClient({
      isAiFeaturesEnabledForTenantMockFn: mock.fn(async () => true),
      upsertItemTypeDefinitionMockFn,
    })

    const result = await client.request({
      method: 'tools/call',
      params: {
        name: 'upsert_item_type_definition',
        arguments: {
          tenantId: 'test-tenant',
          definition: {
            apiVersion: 'software-catalog.mia-platform.eu/v1',
            kind: 'item-type-definition',
            metadata: {
              namespace: { scope: 'tenant', id: 'test-tenant' },
              name: 'custom-plugin',
            },
            spec: {
              type: 'custom-plugin',
            },
          },
        },
      },
    }, CallToolResultSchema)

    const expectedResponse = {
      apiVersion: 'software-catalog.mia-platform.eu/v1',
      kind: 'item-type-definition',
      metadata: {
        namespace: { scope: 'tenant', id: 'test-tenant' },
        name: 'custom-plugin',
        displayName: 'Custom Plugin',
        visibility: { scope: 'tenant', ids: [ 'test-tenant' ] },
      },
      spec: {
        type: 'custom-plugin',
        scope: 'tenant',
        validation: {
          mechanism: 'json-schema',
          schema: { type: 'object' },
        },
      },
      __v: 0,
    }

    t.assert.deepEqual(result.content, [
      {
        text: JSON.stringify(expectedResponse),
        type: 'text',
      },
    ])
  })

  test('should return error - if AI features are not enabled for tenant', async (t) => {
    const client = await getTestMCPServerClient({
      isAiFeaturesEnabledForTenantMockFn: mock.fn(async () => {
        throw new Error('AI features not enabled')
      }),
      upsertItemTypeDefinitionMockFn,
    })

    const result = await client.request({
      method: 'tools/call',
      params: {
        name: 'upsert_item_type_definition',
        arguments: {
          tenantId: 'test-tenant',
          definition: {},
        },
      },
    }, CallToolResultSchema)

    t.assert.deepEqual(result.content, [
      {
        text: 'Error upserting Item Type Definition for tenant test-tenant: AI features not enabled',
        type: 'text',
      },
    ])
  })
})

suite('upload marketplace file tool', () => {
  const uploadMarketplaceFileMockFn = mock.fn(async (tenantId: string) => {
    if (tenantId === 'error') {
      throw new Error('upload error')
    }
    return {
      _id: '507f1f77bcf86cd799439011',
      file: 'uploaded-file.png',
      location: 'https://example.com/files/uploaded-file.png',
      name: 'uploaded-file.png',
      originalname: 'my-icon.png',
      size: 1024,
    }
  })

  test('should upload marketplace file', async (t) => {
    const client = await getTestMCPServerClient({
      isAiFeaturesEnabledForTenantMockFn: mock.fn(async () => true),
      uploadMarketplaceFileMockFn,
    })

    const result = await client.request({
      method: 'tools/call',
      params: {
        name: 'upload_marketplace_file',
        arguments: {
          tenantId: 'test-tenant',
          formData: {}, // Note: FormData handling is not fully implemented
        },
      },
    }, CallToolResultSchema)

    const expectedResponse = {
      _id: '507f1f77bcf86cd799439011',
      file: 'uploaded-file.png',
      location: 'https://example.com/files/uploaded-file.png',
      name: 'uploaded-file.png',
      originalname: 'my-icon.png',
      size: 1024,
    }

    t.assert.deepEqual(result.content, [
      {
        text: JSON.stringify(expectedResponse),
        type: 'text',
      },
    ])
  })

  test('should return error - if AI features are not enabled for tenant', async (t) => {
    const client = await getTestMCPServerClient({
      isAiFeaturesEnabledForTenantMockFn: mock.fn(async () => {
        throw new Error('AI features not enabled')
      }),
      uploadMarketplaceFileMockFn,
    })

    const result = await client.request({
      method: 'tools/call',
      params: {
        name: 'upload_marketplace_file',
        arguments: {
          tenantId: 'test-tenant',
          formData: {},
        },
      },
    }, CallToolResultSchema)

    t.assert.deepEqual(result.content, [
      {
        text: 'Error uploading marketplace file for tenant test-tenant: AI features not enabled',
        type: 'text',
      },
    ])
  })
})
