// Copyright Mia srl
// SPDX-License-Identifier: Apache-2.0

// Licensed under the Apache License, Version 2.0 (the 'License')
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at

//     http://www.apache.org/licenses/LICENSE-2.0

// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an 'AS IS' BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import assert from 'node:assert'
import { test, suite, beforeEach } from 'node:test'
import { MockAgent, setGlobalDispatcher } from 'undici'
import { constants } from '@mia-platform/console-types'

import { APIClient } from './client'
import { name, version } from '../../package.json'

const { API_CONSOLE_TOTAL_PAGES_HEADER_KEY } = constants
const mockedEndpoint = 'http://localhost:3000'
const testPath = '/test/request'

interface TestResponse {
  message: string
}

suite('http client test suite without authentication', () => {
  const client = new APIClient(mockedEndpoint, '', '')
  let agent: MockAgent
  beforeEach(() => {
    agent = new MockAgent()
    setGlobalDispatcher(agent)
  })

  test('get request', async () => {
    const response: TestResponse = {
      message: 'success',
    }
    agent.
      get(mockedEndpoint).
      intercept({
        path: testPath,
        method: 'GET',
        query: {
          test: 'testValue',
        },
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'User-Agent': `${name}/${version}`,
        }
      }).
      reply(200, response)

    const result = await client.get<TestResponse>(testPath, new URLSearchParams({test: 'testValue'}))
    assert.deepEqual(result, response)
  })

  test('fail request', async () => {
    agent.
      get(mockedEndpoint).
      intercept({
        path: testPath,
        method: 'GET',
        query: {
          test: 'testValue',
        },
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'User-Agent': `${name}/${version}`,
        }
      }).
      reply(500, {
        message: 'custom error message',
      })

    await assert.rejects(client.get(testPath, new URLSearchParams({test: 'testValue'})), Error('custom error message'))
  })

  test('get list request', async () => {
    agent.
      get(mockedEndpoint).
      intercept({
        path: testPath,
        method: 'GET',
        query: {
          per_page: 200,
          page: 1,
          test: 'testValue',
        },
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'User-Agent': `${name}/${version}`,
        }
      }).
      reply(200, [{message: 'first'}], {
        headers: {
          [API_CONSOLE_TOTAL_PAGES_HEADER_KEY]: '2',
        },
      })
    agent.
      get(mockedEndpoint).
      intercept({
        path: testPath,
        method: 'GET',
        query: {
          per_page: 200,
          page: 2,
          test: 'testValue',
        },
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'User-Agent': `${name}/${version}`,
        }
      }).
      reply(200, [{message: 'second'}], {
        headers: {
          [API_CONSOLE_TOTAL_PAGES_HEADER_KEY]: '2',
        },
      })

    const result = await client.getPaginated<TestResponse>(testPath, new URLSearchParams({test: 'testValue'}))
    assert.deepEqual(result, [
      {message: 'first'},
      {message: 'second'},
    ])
  })
})

suite('http client test suite with authentication', () => {
  const clientID = 'clientId'
  const clientSecret = 'clientSecret'
  const accessToken = 'mockedAccessToken'

  let agent: MockAgent
  beforeEach(() => {
    agent = new MockAgent()
    setGlobalDispatcher(agent)
  })

  test('get request', async () => {
    const client = new APIClient(mockedEndpoint, clientID, clientSecret)
    const response: TestResponse = {
      message: 'success',
    }

    agent.
      get(mockedEndpoint).
      intercept({
        path: '/api/m2m/oauth/token',
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization: 'Basic Y2xpZW50SWQ6Y2xpZW50U2VjcmV0',
          'User-Agent': `${name}/${version}`,
        },
      }).
      reply(200, {
        access_token: accessToken,
        token_type: 'Bearer',
        expires_in: 3600,
      })

    agent.
      get(mockedEndpoint).
      intercept({
        path: testPath,
        method: 'GET',
        query: {
          test: 'testValue',
        },
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'User-Agent': `${name}/${version}`,
          'Authorization': `Bearer ${accessToken}`,
        }
      }).
      reply(200, response)

    const result = await client.get<TestResponse>(testPath, new URLSearchParams({test: 'testValue'}))
    assert.deepEqual(result, response)
  })

  test('failed authentication', async () => {
    const client = new APIClient(mockedEndpoint, clientID, clientSecret)
    agent.
      get(mockedEndpoint).
      intercept({
        path: '/api/m2m/oauth/token',
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization: 'Basic Y2xpZW50SWQ6Y2xpZW50U2VjcmV0',
          'User-Agent': `${name}/${version}`,
        },
      }).
      reply(401, {
        message: 'failed authentication',
      })

      await assert.rejects(client.get(testPath, new URLSearchParams({test: 'testValue'})), Error('failed authentication'))
  })
})
