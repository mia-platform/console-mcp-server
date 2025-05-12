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

import { APIClient } from '../lib/client'
import FeatureTogglesClient, { FeatureTogglesResponse } from './FeaturesToggleClient'

const mockedEndpoint = 'http://localhost:3000'
const featureTogglesPath = '/api/feature-toggles'

suite('FeatureTogglesClient', () => {
  let apiClient: APIClient
  let featureTogglesClient: FeatureTogglesClient
  let agent: MockAgent

  beforeEach(() => {
    agent = new MockAgent()
    setGlobalDispatcher(agent)
    apiClient = new APIClient(mockedEndpoint)
    featureTogglesClient = new FeatureTogglesClient(apiClient)
  })

  test('fetchActiveFeatures should call API with correct parameters', async (t: TestContext) => {
    const mockResponse: FeatureTogglesResponse = {
      feature1: true,
      feature2: false,
    }

    const featureToggleIds = [ 'feature1', 'feature2' ]

    agent.get(mockedEndpoint).intercept({
      path: `${featureTogglesPath}?featureToggleIds=${featureToggleIds.join(',')}`,
      method: 'GET',
      headers: {
        'content-type': 'application/json',
      },
    }).reply(200, mockResponse)

    const result = await featureTogglesClient.fetchActiveFeatures(featureToggleIds)

    t.assert.deepStrictEqual(result, mockResponse)
  })

  test('fetchActiveFeatures should include context parameters', async (t: TestContext) => {
    const mockResponse: FeatureTogglesResponse = {
      feature1: true,
      feature2: false,
    }

    const featureToggleIds = [ 'feature1', 'feature2' ]
    const context = {
      tenantId: 'tenant-123',
      projectId: 'project-456',
      envId: 'env-789',
    }

    agent.get(mockedEndpoint).intercept({
      path: `${featureTogglesPath}?featureToggleIds=${featureToggleIds.join(',')}&tenantId=${context.tenantId}&projectId=${context.projectId}&envId=${context.envId}`,
      method: 'GET',
      headers: {
        'content-type': 'application/json',
      },
    }).reply(200, mockResponse)

    const result = await featureTogglesClient.fetchActiveFeatures(featureToggleIds, context)

    t.assert.deepStrictEqual(result, mockResponse)
  })

  test('fetchActiveFeatures should return empty object if empty featureToggleIds', async (t: TestContext) => {
    const mockResponse: FeatureTogglesResponse = {}
    const featureToggleIds: string[] = []

    const result = await featureTogglesClient.fetchActiveFeatures(featureToggleIds)

    t.assert.deepStrictEqual(result, mockResponse)
  })

  test('fetchActiveFeatures should handle server errors', async (t: TestContext) => {
    const featureToggleIds = [ 'feature1', 'feature2' ]

    agent.get(mockedEndpoint).intercept({
      path: `${featureTogglesPath}?featureToggleIds=${featureToggleIds.join(',')}`,
      method: 'GET',
      headers: {
        'content-type': 'application/json',
      },
    }).reply(500, { error: 'Internal Server Error' })

    await t.assert.rejects(
      async () => {
        await featureTogglesClient.fetchActiveFeatures(featureToggleIds)
      },
      {
        name: 'Error',
      },
    )
  })
})
