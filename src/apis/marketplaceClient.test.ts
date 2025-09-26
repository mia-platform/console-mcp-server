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

import { beforeEach, suite, test, TestContext } from 'node:test'
import { MockAgent, setGlobalDispatcher } from 'undici'

import { CatalogItemTypeDefinition } from '@mia-platform/console-types'
import { HTTPClient } from './http-client'
import { internalEndpoint, MarketplaceClient, MarketplaceClientInternal } from './marketplaceClient'

const tenantID = 'tenantID'
const itemID = 'itemid'
const itdName = 'itdName'
const search = 'item1'
const type = 'example'
const version = '1.0.1'

const tenantItems = [
  { _id: 1, name: 'item1', tenantId: 'public', itemId: 'item-id-1' },
]

const publicItems = [
  { itemId: 'item-id-1', name: 'item1', tenantId: 'public' },
  { itemId: 'item-id-2', name: 'item2', tenantId: 'public' },
]

const itemTypeDefinitions: CatalogItemTypeDefinition[] = [
  {
    apiVersion: 'software-catalog.mia-platform.eu/v1',
    kind: 'item-type-definition',
    metadata: {
      namespace: { scope: 'tenant', id: 'mia-platform' },
      displayName: 'Plugin ITD',
      name: 'plugin',
      visibility: { scope: 'console' },
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

suite('Marketplace Internal Client', () => {
  const client = MarketplaceClientInternal('', '')
  let agent: MockAgent

  beforeEach(() => {
    agent = new MockAgent()
    agent.disableNetConnect()
    setGlobalDispatcher(agent)
  })

  test('list marketplace items', async (t: TestContext) => {
    agent.get(internalEndpoint).intercept({
      path: '/api/marketplace/',
      method: 'GET',
      query: {
        per_page: 200,
        page: 1,
      },
    }).reply(200, publicItems)
    t.assert.deepEqual(await client.listMarketplaceItems(), publicItems)

    agent.get(internalEndpoint).intercept({
      path: '/api/marketplace/',
      method: 'GET',
      query: {
        per_page: 200,
        page: 1,
        includeTenantId: tenantID,
      },
    }).reply(200, [ ...publicItems, ...tenantItems ])
    t.assert.deepEqual(await client.listMarketplaceItems(tenantID), [ ...publicItems, ...tenantItems ])

    agent.get(internalEndpoint).intercept({
      path: '/api/marketplace/',
      method: 'GET',
      query: {
        per_page: 200,
        page: 1,
        includeTenantId: tenantID,
        types: type,
        name: search,
      },
    }).reply(200, tenantItems)
    t.assert.deepEqual(await client.listMarketplaceItems(tenantID, type, search), tenantItems)
  })

  test('list marketplace items must throw if the API call fails', async (t: TestContext) => {
    agent.get(internalEndpoint).intercept({
      path: '/api/marketplace/',
      method: 'GET',
      query: {
        per_page: 200,
        page: 1,
      },
    }).reply(500, { error: 'Internal Server Error' })
    await t.assert.rejects(async () => await client.listMarketplaceItems(), { name: 'Error' })
  })

  test('list marketplace item versions', async (t: TestContext) => {
    const versions = [
      { version: version, itemId: 'item-id-1', tenantId: 'public', isLatest: false },
      { version: '1.0.1', itemId: 'item-id-1', tenantId: 'public', isLatest: true },
    ]

    agent.get(internalEndpoint).intercept({
      path: `/api/tenants/${tenantID}/marketplace/items/${itemID}/versions`,
      method: 'GET',
      query: {
        per_page: 200,
        page: 1,
      },
    }).reply(200, versions)

    const result = await client.marketplaceItemVersions(tenantID, itemID)
    t.assert.deepEqual(result, versions)
  })

  test('list marketplace item versions must throw if the API call fails', async (t: TestContext) => {
    agent.get(internalEndpoint).intercept({
      path: `/api/tenants/${tenantID}/marketplace/items/${itemID}/versions`,
      method: 'GET',
      query: {
        per_page: 200,
        page: 1,
      },
    }).reply(500, { error: 'Internal Server Error' })
    await t.assert.rejects(async () => await client.marketplaceItemVersions(tenantID, itemID), { name: 'Error' })
  })

  test('marketplace item info', async (t: TestContext) => {
    const mockedResponse = { version: version, itemId: 'item-id-1', tenantId: 'public' }

    agent.get(internalEndpoint).intercept({
      path: `/api/tenants/${tenantID}/marketplace/items/${itemID}/versions/${version}`,
      method: 'GET',
    }).reply(200, mockedResponse)

    const result = await client.marketplaceItemInfo(tenantID, itemID, version)
    t.assert.deepEqual(result, mockedResponse)
  })

  test('marketplace item latest version info', async (t: TestContext) => {
    const mockedResponse = { version: version, itemId: itemID, tenantId: 'public' }
    const versions = [
      { version: '1.0.0', itemId: itemID, tenantId: 'public', isLatest: false },
      { version: version, itemId: itemID, tenantId: 'public', isLatest: true },
    ]

    agent.get(internalEndpoint).intercept({
      path: `/api/tenants/${tenantID}/marketplace/items/${itemID}/versions`,
      method: 'GET',
      query: {
        per_page: 200,
        page: 1,
      },
    }).reply(200, versions)

    agent.get(internalEndpoint).intercept({
      path: `/api/tenants/${tenantID}/marketplace/items/${itemID}/versions/${version}`,
      method: 'GET',
    }).reply(200, mockedResponse)

    const result = await client.marketplaceItemInfo(tenantID, itemID)
    t.assert.deepEqual(result, mockedResponse)
  })

  test('marketplace item info must throw if the API call fails', async (t: TestContext) => {
    agent.get(internalEndpoint).intercept({
      path: `/api/tenants/${tenantID}/marketplace/items/${itemID}/versions/${version}`,
      method: 'GET',
    }).reply(500, { error: 'Internal Server Error' })
    await t.assert.rejects(async () => await client.marketplaceItemInfo(tenantID, itemID, version), { name: 'Error' })
  })

  test('list marketplace Item Type Definitions', async (t: TestContext) => {
    agent.get(internalEndpoint).intercept({
      path: '/api/marketplace/item-type-definitions',
      method: 'GET',
      query: {
        perPage: 200,
        per_page: 200,
        page: 1,
      },
    }).reply(200, itemTypeDefinitions)
    t.assert.deepEqual(await client.listMarketplaceItemTypeDefinitions(), itemTypeDefinitions)

    agent.get(internalEndpoint).intercept({
      path: '/api/marketplace/item-type-definitions',
      method: 'GET',
      query: {
        perPage: 200,
        per_page: 200,
        page: 1,
        namespace: 'mia-platform,my-company',
        name: 'plugin,custom-workload',
        displayName: 'Plugin,Custom Workload',
      },
    }).reply(200, itemTypeDefinitions)
    t.assert.deepEqual(await client.listMarketplaceItemTypeDefinitions('mia-platform,my-company', 'plugin,custom-workload', 'Plugin,Custom Workload'), itemTypeDefinitions)
  })

  test('list marketplace Item Type Definitions must throw if the API call fails', async (t: TestContext) => {
    agent.get(internalEndpoint).intercept({
      path: '/api/marketplace/item-type-definitions',
      method: 'GET',
      query: {
        perPage: 200,
        per_page: 200,
        page: 1,
      },
    }).reply(500, { error: 'Internal Server Error' })
    await t.assert.rejects(async () => await client.listMarketplaceItemTypeDefinitions(), { name: 'Error' })
  })

  test('marketplace Item Type Definition info', async (t: TestContext) => {
    agent.get(internalEndpoint).intercept({
      path: `/api/tenants/${tenantID}/marketplace/item-type-definitions/${itdName}`,
      method: 'GET',
    }).reply(200, itemTypeDefinitions.at(0))
    t.assert.deepEqual(await client.marketplaceItemTypeDefinitionInfo(tenantID, itdName), itemTypeDefinitions.at(0))
  })

  test('marketplace Item Type Definitions info must throw if the API call fails', async (t: TestContext) => {
    agent.get(internalEndpoint).intercept({
      path: `/api/tenants/${tenantID}/marketplace/item-type-definitions/${itdName}`,
      method: 'GET',
    }).reply(500, { error: 'Internal Server Error' })
    await t.assert.rejects(async () => await client.marketplaceItemTypeDefinitionInfo(tenantID, itdName), { name: 'Error' })
  })
})

suite('Marketplace Client', () => {
  const mockedEndpoint = 'http://localhost:3000'
  const client = new MarketplaceClient(new HTTPClient(mockedEndpoint))
  let agent: MockAgent

  beforeEach(() => {
    agent = new MockAgent()
    agent.disableNetConnect()
    setGlobalDispatcher(agent)
  })

  test('list marketplace items', async (t: TestContext) => {
    agent.get(mockedEndpoint).intercept({
      path: '/api/marketplace/',
      method: 'GET',
      query: {
        per_page: 200,
        page: 1,
      },
    }).reply(200, publicItems)
    t.assert.deepEqual(await client.listMarketplaceItems(), publicItems)

    agent.get(mockedEndpoint).intercept({
      path: '/api/marketplace/',
      method: 'GET',
      query: {
        per_page: 200,
        page: 1,
        includeTenantId: tenantID,
      },
    }).reply(200, [ ...publicItems, ...tenantItems ])
    t.assert.deepEqual(await client.listMarketplaceItems(tenantID), [ ...publicItems, ...tenantItems ])

    agent.get(mockedEndpoint).intercept({
      path: '/api/marketplace/',
      method: 'GET',
      query: {
        per_page: 200,
        page: 1,
        includeTenantId: tenantID,
        types: type,
        name: search,
      },
    }).reply(200, tenantItems)
    t.assert.deepEqual(await client.listMarketplaceItems(tenantID, type, search), tenantItems)
  })

  test('list marketplace item versions', async (t: TestContext) => {
    const versions = [
      { version: '1.0.0', itemId: 'item-id-1', tenantId: 'public' },
      { version: version, itemId: 'item-id-1', tenantId: 'public' },
    ]

    agent.get(mockedEndpoint).intercept({
      path: `/api/tenants/${tenantID}/marketplace/items/${itemID}/versions`,
      method: 'GET',
      query: {
        per_page: 200,
        page: 1,
      },
    }).reply(200, versions)

    const result = await client.marketplaceItemVersions(tenantID, itemID)
    t.assert.deepEqual(result, versions)
  })

  test('marketplace item info', async (t: TestContext) => {
    const mockedResponse = { version: version, itemId: 'item-id-1', tenantId: 'public' }

    agent.get(mockedEndpoint).intercept({
      path: `/api/tenants/${tenantID}/marketplace/items/${itemID}/versions/${version}`,
      method: 'GET',
    }).reply(200, mockedResponse)

    const result = await client.marketplaceItemInfo(tenantID, itemID, version)
    t.assert.deepEqual(result, mockedResponse)
  })

  test('marketplace item latest version info', async (t: TestContext) => {
    const mockedResponse = { version: version, itemId: itemID, tenantId: 'public' }
    const versions = [
      { version: '1.0.0', itemId: itemID, tenantId: 'public', isLatest: false },
      { version: version, itemId: itemID, tenantId: 'public', isLatest: true },
    ]

    agent.get(mockedEndpoint).intercept({
      path: `/api/tenants/${tenantID}/marketplace/items/${itemID}/versions`,
      method: 'GET',
      query: {
        per_page: 200,
        page: 1,
      },
    }).reply(200, versions)

    agent.get(mockedEndpoint).intercept({
      path: `/api/tenants/${tenantID}/marketplace/items/${itemID}/versions/${version}`,
      method: 'GET',
    }).reply(200, mockedResponse)

    const result = await client.marketplaceItemInfo(tenantID, itemID)
    t.assert.deepEqual(result, mockedResponse)
  })

  test('marketplace item info must throw if the API call fails', async (t: TestContext) => {
    agent.get(mockedEndpoint).intercept({
      path: `/api/tenants/${tenantID}/marketplace/items/${itemID}/versions/${version}`,
      method: 'GET',
    }).reply(500, { error: 'Internal Server Error' })
    await t.assert.rejects(async () => await client.marketplaceItemInfo(tenantID, itemID, version), { name: 'Error' })
  })

  test('list marketplace Item Type Definitions', async (t: TestContext) => {
    agent.get(mockedEndpoint).intercept({
      path: '/api/marketplace/item-type-definitions',
      method: 'GET',
      query: {
        perPage: 200,
        per_page: 200,
        page: 1,
      },
    }).reply(200, itemTypeDefinitions)
    t.assert.deepEqual(await client.listMarketplaceItemTypeDefinitions(), itemTypeDefinitions)

    agent.get(mockedEndpoint).intercept({
      path: '/api/marketplace/item-type-definitions',
      method: 'GET',
      query: {
        perPage: 200,
        per_page: 200,
        page: 1,
        namespace: 'mia-platform,my-company',
        name: 'plugin,custom-workload',
        displayName: 'Plugin,Custom Workload',
      },
    }).reply(200, itemTypeDefinitions)
    t.assert.deepEqual(await client.listMarketplaceItemTypeDefinitions('mia-platform,my-company', 'plugin,custom-workload', 'Plugin,Custom Workload'), itemTypeDefinitions)
  })

  test('list marketplace Item Type Definitions must throw if the API call fails', async (t: TestContext) => {
    agent.get(mockedEndpoint).intercept({
      path: '/api/marketplace/item-type-definitions',
      method: 'GET',
      query: {
        perPage: 200,
        per_page: 200,
        page: 1,
      },
    }).reply(500, { error: 'Internal Server Error' })
    await t.assert.rejects(async () => await client.listMarketplaceItemTypeDefinitions(), { name: 'Error' })
  })

  test('marketplace Item Type Definition info', async (t: TestContext) => {
    agent.get(mockedEndpoint).intercept({
      path: `/api/tenants/${tenantID}/marketplace/item-type-definitions/${itdName}`,
      method: 'GET',
    }).reply(200, itemTypeDefinitions.at(0))
    t.assert.deepEqual(await client.marketplaceItemTypeDefinitionInfo(tenantID, itdName), itemTypeDefinitions.at(0))
  })

  test('marketplace Item Type Definitions info must throw if the API call fails', async (t: TestContext) => {
    agent.get(mockedEndpoint).intercept({
      path: `/api/tenants/${tenantID}/marketplace/item-type-definitions/${itdName}`,
      method: 'GET',
    }).reply(500, { error: 'Internal Server Error' })
    await t.assert.rejects(async () => await client.marketplaceItemTypeDefinitionInfo(tenantID, itdName), { name: 'Error' })
  })
})
