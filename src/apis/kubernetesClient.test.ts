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

import { HTTPClient } from './http-client'
import { internalEndpoint, KubernetesClient, KubernetesClientInternal } from './kubernetesClient'

const projectID = 'test-project-id'
const environmentID = 'test'
const podName = 'pod-name'
const containerName = 'container-name'

suite('Feature Toggle Internal Client', () => {
  const client = KubernetesClientInternal('', '')
  let agent: MockAgent

  beforeEach(() => {
    agent = new MockAgent()
    agent.disableNetConnect()
    setGlobalDispatcher(agent)
  })

  test('list pods available', async (t: TestContext) => {
    const mockResponse = [
      { name: 'test-pod', status: 'running' },
      { name: 'test-pod-2', status: 'completed' },
    ]

    agent.get(internalEndpoint).intercept({
      path: `/projects/${projectID}/environments/${environmentID}/pods/describe/`,
      method: 'GET',
    }).reply(200, mockResponse)

    const result = await client.listPods(projectID, environmentID)
    t.assert.deepStrictEqual(result, mockResponse)
  })

  test('list pods available must throw if the API call fails', async (t: TestContext) => {
    agent.get(internalEndpoint).intercept({
      path: `/projects/${projectID}/environments/${environmentID}/pods/describe/`,
      method: 'GET',
    }).reply(500, { error: 'Internal Server Error' })

    await t.assert.rejects(async () => await client.listPods(projectID, environmentID), { name: 'Error' })
  })

  test('get pod logs', async (t: TestContext) => {
    const mockResponse = `{"level":"info","time":"2025-05-09T08:41:36.530819Z","scope":"upstream","message":"lds: add/update listener 'frontend'"}
{"level":"info","time":"2025-05-09T08:41:36.530839Z","scope":"config","message":"all dependencies initialized. starting workers"}`

    agent.get(internalEndpoint).intercept({
      path: `/projects/${projectID}/environments/${environmentID}/pods/${podName}/containers/${containerName}/logs`,
      method: 'GET',
      headers: {
        Accept: 'text/plain',
      },
      query: {
        file: true,
        tailLines: 300,
      },
    }).reply(200, mockResponse, {
      headers: {
        'Content-Type': 'text/plain',
      },
    })

    const result = await client.podLogs(projectID, environmentID, podName, containerName, 300)
    t.assert.deepStrictEqual(result, mockResponse)
  })

  test('get pod logs must throw if the API call fails', async (t: TestContext) => {
    agent.get(internalEndpoint).intercept({
      path: `/projects/${projectID}/environments/${environmentID}/pods/${podName}/containers/${containerName}/logs`,
      method: 'GET',
      headers: {
        Accept: 'text/plain',
      },
      query: {
        file: true,
        tailLines: 300,
      },
    }).reply(500, { error: 'Internal Server Error' })

    await t.assert.rejects(
      async () => await client.podLogs(projectID, environmentID, podName, containerName, 300),
      { name: 'Error' },
    )
  })
})

suite('Feature Toggle Client', () => {
  const mockedEndpoint = 'http://localhost:3000'
  const client = new KubernetesClient(new HTTPClient(mockedEndpoint))
  let agent: MockAgent

  beforeEach(() => {
    agent = new MockAgent()
    agent.disableNetConnect()
    setGlobalDispatcher(agent)
  })

  test('list pods available', async (t: TestContext) => {
    const mockResponse = [
      { name: 'test-pod', status: 'running' },
      { name: 'test-pod-2', status: 'completed' },
    ]

    agent.get(mockedEndpoint).intercept({
      path: `/api/projects/${projectID}/environments/${environmentID}/pods/describe/`,
      method: 'GET',
    }).reply(200, mockResponse)

    const result = await client.listPods(projectID, environmentID)
    t.assert.deepStrictEqual(result, mockResponse)
  })

  test('get pod logs', async (t: TestContext) => {
    const mockResponse = `{"level":"info","time":"2025-05-09T08:41:36.530819Z","scope":"upstream","message":"lds: add/update listener 'frontend'"}
{"level":"info","time":"2025-05-09T08:41:36.530839Z","scope":"config","message":"all dependencies initialized. starting workers"}`

    agent.get(mockedEndpoint).intercept({
      path: `/api/projects/${projectID}/environments/${environmentID}/pods/${podName}/containers/${containerName}/logs`,
      method: 'GET',
      headers: {
        Accept: 'text/plain',
      },
      query: {
        file: true,
        tailLines: 300,
      },
    }).reply(200, mockResponse, {
      headers: {
        'Content-Type': 'text/plain',
      },
    })

    const result = await client.podLogs(projectID, environmentID, podName, containerName, 300)
    t.assert.deepStrictEqual(result, mockResponse)
  })
})
