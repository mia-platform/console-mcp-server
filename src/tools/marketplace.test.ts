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

import { beforeEach, suite, test } from 'node:test'
import { MockAgent, setGlobalDispatcher } from 'undici'

import { Client } from '@modelcontextprotocol/sdk/client/index'
import { CallToolResultSchema, ListToolsResultSchema } from '@modelcontextprotocol/sdk/types'

import { APIClient } from '../lib/client'
import { marketplaceTools } from './marketplace'
import { TestMCPServer } from './utils.test'

const mockedEndpoint = 'http://localhost:3000'

const publicElements = [
  { id: 1, name: 'item', tenant: 'public' },
  { id: 2, name: 'item', tenant: 'public' },
  { id: 3, name: 'item', tenant: 'public' },
]

const tenantElement = { id: 4, name: 'item', tenant: 'tenantID' }

suite('setup marketplace tools', () => {
  test('should setup marketplace tools to a server', async (t) => {
    const client = await TestMCPServer((server) => {
      const apiClient = new APIClient(mockedEndpoint)
      marketplaceTools(server, apiClient)
    })

    const result = await client.request(
      {
        method: 'tools/list',
      },
      ListToolsResultSchema,
    )

    t.assert.equal(result.tools.length, 1)
    t.assert.equal(result.tools[0].name, 'list_marketplace')
  })
})

suite('marketplace list tool', () => {
  let client: Client
  beforeEach(async () => {
    client = await TestMCPServer((server) => {
      const apiClient = new APIClient(mockedEndpoint)
      marketplaceTools(server, apiClient)
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
        'Content-Type': 'application/json',
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
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    }).reply(200, [ ...publicElements, tenantElement ])

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
        'Content-Type': 'application/json',
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
        text: JSON.stringify(publicElements),
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
        text: JSON.stringify([ ...publicElements, tenantElement ]),
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
