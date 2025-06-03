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
import { toolNames } from '../../lib/descriptions'
import { getAppContext, TestMCPServer } from '../../server/test-utils.test'
import { logsPath, podsPath } from './api'

const mockedEndpoint = 'http://localhost:3000'

const pods = [
  { name: 'test-pod', status: 'running' },
  { name: 'test-pod-2', status: 'completed' },
]

suite('setup runtime tools', () => {
  test('should setup runtime tools to a server', async (t) => {
    const client = await TestMCPServer((server) => {
      const apiClient = new APIClient(mockedEndpoint)
      addRuntimeCapabilities(server, getAppContext({ client: apiClient }))
    })

    const result = await client.request(
      {
        method: 'tools/list',
      },
      ListToolsResultSchema,
    )

    t.assert.equal(result.tools.length, 2)
  })
})

suite('list pods tool', () => {
  let client: Client
  let agent: MockAgent

  beforeEach(async () => {
    client = await TestMCPServer((server) => {
      const apiClient = new APIClient(mockedEndpoint)
      addRuntimeCapabilities(server, getAppContext({ client: apiClient }))
    })

    agent = new MockAgent()
    setGlobalDispatcher(agent)
  })

  test('should return error when pods are not found', async (t) => {
    agent.get(mockedEndpoint).intercept({
      path: podsPath({ projectId: 'test-project', environmentId: 'test-environment' }),
      method: 'GET',
      headers: {
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
      path: podsPath({ projectId: 'test-project', environmentId: 'test-environment' }),
      method: 'GET',
      headers: {
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

suite('get pod logs tool', () => {
  let client: Client
  let agent: MockAgent

  beforeEach(async () => {
    client = await TestMCPServer((server) => {
      const apiClient = new APIClient(mockedEndpoint)
      addRuntimeCapabilities(server, getAppContext({ client: apiClient }))
    })

    agent = new MockAgent()
    setGlobalDispatcher(agent)
  })

  test('should return error when logs are not found', async (t) => {
    agent.get(mockedEndpoint).intercept({
      path: logsPath({
        projectId: 'test-project',
        environmentId: 'test-environment',
        podName: 'test-pod',
        containerName: 'test-container',
        lines: 100,
      }),
      method: 'GET',
      headers: {
        Accept: 'text/plain',
      },
    }).reply(500, { message: 'error message' })

    const result = await client.request({
      method: 'tools/call',
      params: {
        name: toolNames.GET_POD_LOGS,
        arguments: {
          projectId: 'test-project',
          environmentId: 'test-environment',
          podName: 'test-pod',
          containerName: 'test-container',
        },
      },
    }, CallToolResultSchema)

    t.assert.deepEqual(result.content, [
      {
        text: 'Error fetching logs for container test-container in pod test-pod: error message',
        type: 'text',
      },
    ])
  })


  test('should return logs', async (t) => {
    const logs = `{"level":"info","time":"2025-05-09T08:41:36.530819Z","scope":"upstream","message":"lds: add/update listener 'frontend'"}
{"level":"info","time":"2025-05-09T08:41:36.530839Z","scope":"config","message":"all dependencies initialized. starting workers"}`

    agent.get(mockedEndpoint).intercept({
      path: logsPath({
        projectId: 'test-project',
        environmentId: 'test-environment',
        podName: 'test-pod',
        containerName: 'test-container',
        lines: 100,
      }),
      method: 'GET',
      headers: {

        Accept: 'text/plain',
      },
    }).reply(200, logs, {
      headers: {
        'Content-Type': 'text/plain',
      },
    })

    const result = await client.request({
      method: 'tools/call',
      params: {
        name: toolNames.GET_POD_LOGS,
        arguments: {
          projectId: 'test-project',
          environmentId: 'test-environment',
          podName: 'test-pod',
          containerName: 'test-container',
        },
      },
    }, CallToolResultSchema)

    t.assert.deepEqual(result.content[0].text, `Logs for container test-container in pod test-pod: ${logs}`)
  })
})
