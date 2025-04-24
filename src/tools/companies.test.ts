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

import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { CallToolResultSchema, ListToolsResultSchema } from '@modelcontextprotocol/sdk/types.js'

import { addCompaniesCapabilities } from '../tools/companies'
import { APIClient } from '../lib/client'
import { TestMCPServer } from './utils.test'

const mockedEndpoint = 'http://localhost:3000'

const companies = [
  { id: 1, name: 'name' },
  { id: 2, name: 'name2' },
]

suite('setup companies tools', () => {
  test('should setup companies tools to a server', async (t) => {
    const client = await TestMCPServer((server) => {
      const apiClient = new APIClient(mockedEndpoint)
      addCompaniesCapabilities(server, apiClient)
    })

    const result = await client.request(
      {
        method: 'tools/list',
      },
      ListToolsResultSchema,
    )

    t.assert.equal(result.tools.length, 1)
    t.assert.equal(result.tools[0].name, 'list_tenants')
  })
})

suite('companies list tool', () => {
  let client: Client
  let agent: MockAgent
  beforeEach(async () => {
    client = await TestMCPServer((server) => {
      const apiClient = new APIClient(mockedEndpoint)
      addCompaniesCapabilities(server, apiClient)
    })

    agent = new MockAgent()
    setGlobalDispatcher(agent)
  })

  test('should return companies', async (t) => {
    agent.get(mockedEndpoint).intercept({
      path: '/api/backend/tenants/',
      method: 'GET',
      query: {
        per_page: 200,
        page: 1,
      },
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    }).reply(200, companies)

    const result = await client.request({
      method: 'tools/call',
      params: {
        name: 'list_tenants',
        arguments: {},
      },
    }, CallToolResultSchema)

    t.assert.deepEqual(result.content, [
      {
        text: JSON.stringify(companies),
        type: 'text',
      },
    ])
  })

  test('should return error message if request return error', async (t) => {
    agent.get(mockedEndpoint).intercept({
      path: '/api/backend/tenants/',
      method: 'GET',
      query: {
        per_page: 200,
        page: 1,
      },
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    }).reply(500, { message: 'error message' })

    const result = await client.request({
      method: 'tools/call',
      params: {
        name: 'list_tenants',
        arguments: {},
      },
    }, CallToolResultSchema)

    t.assert.deepEqual(result.content, [
      {
        text: 'Error fetching companies: error message',
        type: 'text',
      },
    ])
  })
})
