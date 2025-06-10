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
import { DeployClient, DeployClientInternal, internalEndpoint } from './deployClient'

const projectID = 'test-project-id'
const refId = 'test-ref-id'
const revisionType = 'tags'
const environment = 'test'
const pipelineID = 'pipeline-123'

suite('Deploy Internal Client', () => {
  const client = DeployClientInternal('', '')
  let agent: MockAgent

  beforeEach(() => {
    agent = new MockAgent()
    agent.disableNetConnect()
    setGlobalDispatcher(agent)
  })

  test('trigger deploy', async (t: TestContext) => {
    const mockedResult = {
      id: 123,
      url: 'http://example.com/deploy/123',
    }

    agent.get(internalEndpoint).intercept({
      path: `/projects/${projectID}/trigger/pipeline/`,
      method: 'GET',
      query: {
        fromEnvironment: environment,
        toRef: refId,
        refType: revisionType,
      },
    }).reply(200, mockedResult)

    const result = await client.triggerDeploy(projectID, environment, refId, revisionType)
    t.assert.deepStrictEqual(result, mockedResult)
  })

  test('trigger deploy must throw if the API call fails', async (t: TestContext) => {
    agent.get(internalEndpoint).intercept({
      path: `/projects/${projectID}/trigger/pipeline/`,
      method: 'GET',
      query: {
        fromEnvironment: environment,
        toRef: refId,
        refType: revisionType,
      },
    }).reply(500, { error: 'Internal Server Error' })

    await t.assert.rejects(
      async () => await client.triggerDeploy(projectID, environment, refId, revisionType),
      { name: 'Error' },
    )
  })

  test('compare for deploy', async (t: TestContext) => {
    const mockedResult = {
      lastDeployedManifests: [
        { content: 'content1', name: 'manifest1', resourceName: 'resource1', type: 'type1' },
      ],
      revisionManifests: [
        { content: 'content2', name: 'manifest2', resourceName: 'resource2', type: 'type2' },
      ],
    }

    agent.get(internalEndpoint).intercept({
      path: `/projects/${projectID}/compare/raw`,
      method: 'GET',
      query: {
        fromEnvironment: environment,
        toRef: refId,
        refType: revisionType,
      },
    }).reply(200, mockedResult)

    const result = await client.compareForDeploy(projectID, environment, refId, revisionType)
    t.assert.deepStrictEqual(result, mockedResult)
  })

  test('compare for deploy must throw if the API call fails', async (t: TestContext) => {
    agent.get(internalEndpoint).intercept({
      path: `/projects/${projectID}/compare/raw`,
      method: 'GET',
      query: {
        fromEnvironment: environment,
        toRef: refId,
        refType: revisionType,
      },
    }).reply(500, { error: 'Internal Server Error' })

    await t.assert.rejects(
      async () => await client.compareForDeploy(projectID, environment, refId, revisionType),
      { name: 'Error' },
    )
  })

  test('wait for pipeline completion', async (t: TestContext) => {
    const mockedStatus = { status: 'success' }

    agent.get(internalEndpoint).intercept({
      path: `/projects/${projectID}/pipelines/${pipelineID}/status/`,
      method: 'GET',
    }).reply(200, { status: 'waiting' }).times(1)
    agent.get(internalEndpoint).intercept({
      path: `/projects/${projectID}/pipelines/${pipelineID}/status/`,
      method: 'GET',
    }).reply(200, mockedStatus)
    const result = await client.waitForPipelineCompletion(projectID, pipelineID, 100, 1)
    t.assert.deepStrictEqual(result, mockedStatus)
  })

  test('wait for pipeline completion must throw for timeout', async (t: TestContext) => {
    const mockedStatus = { status: 'waiting' }

    agent.get(internalEndpoint).intercept({
      path: `/projects/${projectID}/pipelines/${pipelineID}/status/`,
      method: 'GET',
    }).reply(200, mockedStatus).persist()

    await t.assert.rejects(
      async () => await client.waitForPipelineCompletion(projectID, pipelineID, 1, 10),
      { name: 'Error' },
    )
  })

  test('wait for pipeline completion must throw if the API call fails', async (t: TestContext) => {
    agent.get(internalEndpoint).intercept({
      path: `/projects/${projectID}/pipelines/${pipelineID}/status/`,
      method: 'GET',
    }).reply(500, { error: 'Internal Server Error' })
    await t.assert.rejects(
      async () => await client.waitForPipelineCompletion(projectID, pipelineID, 1, 1),
      { name: 'Error' },
    )
  })
})

suite('Deploy Client', () => {
  const mockedEndpoint = 'http://localhost:3000'
  const client = new DeployClient(new HTTPClient(mockedEndpoint))
  let agent: MockAgent

  beforeEach(() => {
    agent = new MockAgent()
    agent.disableNetConnect()
    setGlobalDispatcher(agent)
  })

  test('trigger deploy', async (t: TestContext) => {
    const mockedResult = {
      id: 123,
      url: 'http://example.com/deploy/123',
    }

    agent.get(mockedEndpoint).intercept({
      path: `/api/deploy/projects/${projectID}/trigger/pipeline/`,
      method: 'GET',
      query: {
        fromEnvironment: environment,
        toRef: refId,
        refType: revisionType,
      },
    }).reply(200, mockedResult)

    const result = await client.triggerDeploy(projectID, environment, refId, revisionType)
    t.assert.deepStrictEqual(result, mockedResult)
  })

  test('compare for deploy', async (t: TestContext) => {
    const mockedResult = {
      lastDeployedManifests: [
        { content: 'content1', name: 'manifest1', resourceName: 'resource1', type: 'type1' },
      ],
      revisionManifests: [
        { content: 'content2', name: 'manifest2', resourceName: 'resource2', type: 'type2' },
      ],
    }

    agent.get(mockedEndpoint).intercept({
      path: `/api/deploy/projects/${projectID}/compare/raw`,
      method: 'GET',
      query: {
        fromEnvironment: environment,
        toRef: refId,
        refType: revisionType,
      },
    }).reply(200, mockedResult)

    const result = await client.compareForDeploy(projectID, environment, refId, revisionType)
    t.assert.deepStrictEqual(result, mockedResult)
  })

  test('compare for deploy must throw if the API call fails', async (t: TestContext) => {
    agent.get(mockedEndpoint).intercept({
      path: `/api/deploy/projects/${projectID}/compare/raw`,
      method: 'GET',
      query: {
        fromEnvironment: environment,
        toRef: refId,
        refType: revisionType,
      },
    }).reply(500, { error: 'Internal Server Error' })

    await t.assert.rejects(
      async () => await client.compareForDeploy(projectID, environment, refId, revisionType),
      { name: 'Error' },
    )
  })

  test('wait for pipeline completion', async (t: TestContext) => {
    const mockedStatus = { status: 'success' }

    agent.get(mockedEndpoint).intercept({
      path: `/api/deploy/projects/${projectID}/pipelines/${pipelineID}/status/`,
      method: 'GET',
    }).reply(200, { status: 'waiting' }).times(1)
    agent.get(mockedEndpoint).intercept({
      path: `/api/deploy/projects/${projectID}/pipelines/${pipelineID}/status/`,
      method: 'GET',
    }).reply(200, mockedStatus)
    const result = await client.waitForPipelineCompletion(projectID, pipelineID, 100, 1)
    t.assert.deepStrictEqual(result, mockedStatus)
  })
})
