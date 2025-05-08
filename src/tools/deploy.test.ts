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

import { addDeployCapabilities } from './deploy'
import { APIClient } from '../lib/client'
import { TestMCPServer } from './utils.test'

const mockedEndpoint = 'http://localhost:3000'

const triggerDeployResponse = {
  id: 123,
  url: 'https://console.mia-platform.eu/pipelines/123',
}

suite('setup deploy tools', () => {
  test('should setup deploy tools to a server', async (t) => {
    const client = await TestMCPServer((server) => {
      const apiClient = new APIClient(mockedEndpoint)
      addDeployCapabilities(server, apiClient)
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

suite('deploy project tool', () => {
  let client: Client
  let agent: MockAgent

  beforeEach(async () => {
    client = await TestMCPServer((server) => {
      const apiClient = new APIClient(mockedEndpoint)
      addDeployCapabilities(server, apiClient)
    })

    agent = new MockAgent()
    setGlobalDispatcher(agent)
  })

  test('should trigger a deployment', async (t) => {
    const projectId = 'project123'
    const revision = 'main'
    const environment = 'development'
    const refType = 'revision'

    agent.get(mockedEndpoint).intercept({
      path: `/api/deploy/projects/${projectId}/trigger/pipeline/`,
      method: 'POST',
      body: JSON.stringify({
        environment,
        revision,
        refType,
      }),
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    }).reply(200, triggerDeployResponse)

    const result = await client.request({
      method: 'tools/call',
      params: {
        name: 'deploy',
        arguments: {
          projectId,
          revision,
          refType: 'revision',
          environment,
        },
      },
    }, CallToolResultSchema)

    t.assert.deepEqual(result.content, [
      {
        text: `URL to check the deployment status: ${triggerDeployResponse.url} for pipeline with id ${triggerDeployResponse.id}`,
        type: 'text',
      },
    ])
  })

  test('should return error message if request returns error', async (t) => {
    const projectId = 'error-project'
    const revision = 'main'
    const environment = 'development'
    const refType = 'revision'

    agent.get(mockedEndpoint).intercept({
      path: `/api/deploy/projects/${projectId}/trigger/pipeline/`,
      method: 'POST',
      body: JSON.stringify({
        environment,
        revision,
        refType,
      }),
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    }).reply(500, { message: 'error message' })

    const result = await client.request({
      method: 'tools/call',
      params: {
        name: 'deploy',
        arguments: {
          projectId,
          revision,
          refType: 'revision',
          environment,
        },
      },
    }, CallToolResultSchema)

    t.assert.deepEqual(result.content, [
      {
        text: 'Error deploying project: error message',
        type: 'text',
      },
    ])
  })
})
