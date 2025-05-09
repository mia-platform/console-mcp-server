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

import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { CallToolResultSchema, ListToolsResultSchema } from '@modelcontextprotocol/sdk/types.js'
import { MockAgent, setGlobalDispatcher } from 'undici'
import test, { beforeEach, suite } from 'node:test'

import { addRuntimeCapabilities } from '.'
import { APIClient } from '../../lib/client'
import { podsPath } from './api'
import { TestMCPServer } from '../utils.test'
import { toolNames } from '../../lib/descriptions'

const mockedEndpoint = 'http://localhost:3000'

const pods = [
  { name: 'test-pod', status: 'running' },
  { name: 'test-pod-2', status: 'completed' },
]

suite('setup runtime tools', () => {
  test('should setup runtime tools to a server', async (t) => {
    const client = await TestMCPServer((server) => {
      const apiClient = new APIClient(mockedEndpoint)
      addRuntimeCapabilities(server, apiClient)
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

suite('list pods tool', () => {
  let client: Client
  let agent: MockAgent

  beforeEach(async () => {
    client = await TestMCPServer((server) => {
      const apiClient = new APIClient(mockedEndpoint)
      addRuntimeCapabilities(server, apiClient)
    })

    agent = new MockAgent()
    setGlobalDispatcher(agent)
  })

  test('should return error when pods are not found', async (t) => {
    agent.get(mockedEndpoint).intercept({
      path: podsPath('test-project', 'test-environment'),
      method: 'GET',
      // query: {
      //   per_page: 200,
      //   page: 1,
      // },
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    }).reply(500, { message: 'error message' })

    const result = await client.request({
      method: 'tools/call',
      params: {
        name: 'list_pods',
        arguments: {
          projectId: 'test-project',
          environmentId: 'test-environment',
        },
      },
    }, CallToolResultSchema)

    t.assert.deepEqual(result.content, [
      {
        text: 'Error fetching pods: error message',
        type: 'text',
      },
    ])
  })

  test('should list pods', async (t) => {
    agent.get(mockedEndpoint).intercept({
      path: podsPath('test-project', 'test-environment'),
      method: 'GET',
      // query: {
      //   per_page: 200,
      //   page: 1,
      // },
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    }).reply(200, pods)

    const result = await client.request({
      method: 'tools/call',
      params: {
        name: toolNames.LIST_PODS,
        arguments: {
          projectId: 'test-project',
          environmentId: 'test-environment',
        },
      },
    }, CallToolResultSchema)

    t.assert.deepEqual(result.content, [
      {
        text: `Pods: ${JSON.stringify(pods)}`,
        type: 'text',
      },
    ])
  })
})
