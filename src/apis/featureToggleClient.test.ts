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
import { FeatureToggleClient, FeatureToggleClientInternal, internalEndpoint } from './featureToggleClient'

const projectId = 'test-project-id'

suite('Feature Toggle Internal Client', () => {
  const client = FeatureToggleClientInternal('', '')
  let agent: MockAgent

  beforeEach(() => {
    agent = new MockAgent()
    agent.disableNetConnect()
    setGlobalDispatcher(agent)
  })

  test('fetch active feature shoul call API with correct parameters', async (t: TestContext) => {
    const toggles = [ 'feature1', 'feature2' ]
    const mockResponse = {
      [toggles[0]]: true,
      [toggles[1]]: false,
    }

    agent.get(internalEndpoint).intercept({
      path: '/feature-toggles',
      method: 'GET',
      query: {
        featureToggleIds: toggles.join(','),
        projectId,
      },
    }).reply(200, mockResponse)

    const result = await client.getToggles(projectId, toggles)
    t.assert.deepStrictEqual(result, mockResponse)
  })

  test('fetch empty array of toggles should return empty object and not make any call', async (t: TestContext) => {
    const toggles: string[] = []
    const result = await client.getToggles(projectId, toggles)
    t.assert.deepStrictEqual(result, {})
  })

  test('an error should be thrown if the API call fails', async (t: TestContext) => {
    const toggles = [ 'feature1' ]

    agent.get(internalEndpoint).intercept({
      path: '/feature-toggles',
      method: 'GET',
      query: {
        featureToggleIds: toggles.join(','),
        projectId,
      },
    }).reply(500, { error: 'Internal Server Error' })

    await t.assert.rejects(async () => await client.getToggles(projectId, toggles), { name: 'Error' })
  })
})

suite('Feature Toggle Client', () => {
  const mockedEndpoint = 'http://localhost:3000'
  const client = new FeatureToggleClient(new HTTPClient(mockedEndpoint))
  let agent: MockAgent

  beforeEach(() => {
    agent = new MockAgent()
    agent.disableNetConnect()
    setGlobalDispatcher(agent)
  })

  test('fetch active feature shoul call API with correct parameters', async (t: TestContext) => {
    const toggles = [ 'feature1', 'feature2' ]
    const mockResponse = {
      [toggles[0]]: true,
      [toggles[1]]: false,
    }

    agent.get(mockedEndpoint).intercept({
      path: '/api/feature-toggles',
      method: 'GET',
      query: {
        featureToggleIds: toggles.join(','),
        projectId,
      },
    }).reply(200, mockResponse)

    const result = await client.getToggles(projectId, toggles)
    t.assert.deepStrictEqual(result, mockResponse)
  })
})
