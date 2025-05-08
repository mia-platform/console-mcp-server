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

import { addConfigurationCapabilities } from './configuration'
import { APIClient } from '../lib/client'
import { TestMCPServer } from './utils.test'

const mockedEndpoint = 'http://localhost:3000'

const revisions = [
  { name: 'main' },
  { name: 'feature-branch' },
]

const tags = [
  { name: 'v1.0.0' },
  { name: 'v1.1.0' },
]

suite('setup configuration tools', () => {
  test('should setup configuration tools to a server', async (t) => {
    const client = await TestMCPServer((server) => {
      const apiClient = new APIClient(mockedEndpoint)
      addConfigurationCapabilities(server, apiClient)
    })

    const result = await client.request(
      {
        method: 'tools/list',
      },
      ListToolsResultSchema,
    )

    t.assert.equal(result.tools.length, 1)
  })
})

suite('list configuration revisions tool', () => {
  let client: Client
  let agent: MockAgent

  beforeEach(async () => {
    client = await TestMCPServer((server) => {
      const apiClient = new APIClient(mockedEndpoint)
      addConfigurationCapabilities(server, apiClient)
    })

    agent = new MockAgent()
    setGlobalDispatcher(agent)
  })

  test('should return revisions and tags', async (t) => {
    const projectId = 'project123'

    agent.get(mockedEndpoint).intercept({
      path: `/api/backend/projects/${projectId}/revisions`,
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    }).reply(200, revisions)

    agent.get(mockedEndpoint).intercept({
      path: `/api/backend/projects/${projectId}/versions`,
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    }).reply(200, tags)

    const result = await client.request({
      method: 'tools/call',
      params: {
        name: 'list_configuration_revisions',
        arguments: {
          projectId,
        },
      },
    }, CallToolResultSchema)

    t.assert.deepEqual(result.content, [
      {
        text: `Revisions: ${JSON.stringify(revisions)}\nVersion: ${JSON.stringify(tags)}`,
        type: 'text',
      },
    ])
  })

  test('should return error message if request returns error', async (t) => {
    const projectId = 'error-project'

    agent.get(mockedEndpoint).intercept({
      path: `/api/backend/projects/${projectId}/revisions`,
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    }).reply(500, { message: 'error message' })

    const result = await client.request({
      method: 'tools/call',
      params: {
        name: 'list_configuration_revisions',
        arguments: {
          projectId,
        },
      },
    }, CallToolResultSchema)

    t.assert.deepEqual(result.content, [
      {
        text: 'Error fetching revisions or versions: error message',
        type: 'text',
      },
    ])
  })
})
