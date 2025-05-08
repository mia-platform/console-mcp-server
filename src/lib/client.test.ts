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
  const client = new APIClient(mockedEndpoint)
  let agent: MockAgent
  beforeEach(() => {
    agent = new MockAgent()
    setGlobalDispatcher(agent)
  })

  test('get request', async (t) => {
    const response: TestResponse = {
      message: 'success',
    }
    agent.get(mockedEndpoint).intercept({
      path: testPath,
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'User-Agent': `${name}/${version}`,
      },
    }).reply(200, response)

    const result = await client.get<TestResponse>(testPath)
    t.assert.deepEqual(result, response)
  })

  test('fail request', async (t) => {
    agent.get(mockedEndpoint).intercept({
      path: testPath,
      method: 'GET',
      query: {
        test: 'testValue',
      },
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'User-Agent': `${name}/${version}`,
      },
    }).reply(500, {
      message: 'custom error message',
    })

    await t.assert.rejects(
      client.get(testPath, {}, new URLSearchParams({ test: 'testValue' })),
      Error('custom error message'),
    )
  })

  test('get list request', async (t) => {
    agent.get(mockedEndpoint).intercept({
      path: testPath,
      method: 'GET',
      query: {
        per_page: 200,
        page: 1,
        test: 'testValue',
      },
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'User-Agent': `${name}/${version}`,
      },
    }).reply(200, [ { message: 'first' } ], {
      headers: {
        [API_CONSOLE_TOTAL_PAGES_HEADER_KEY]: '2',
      },
    })
    agent.get(mockedEndpoint).intercept({
      path: testPath,
      method: 'GET',
      query: {
        per_page: 200,
        page: 2,
        test: 'testValue',
      },
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'User-Agent': `${name}/${version}`,
      },
    }).reply(200, [ { message: 'second' } ], {
      headers: {
        [API_CONSOLE_TOTAL_PAGES_HEADER_KEY]: '2',
      },
    })

    const result = await client.getPaginated<TestResponse>(testPath, {}, new URLSearchParams({ test: 'testValue' }))
    t.assert.deepEqual(result, [
      { message: 'first' },
      { message: 'second' },
    ])
  })

  test('post request', async (t) => {
    const body = {
      key: 'value',
      array: [
        'element',
      ],
      number: 1,
      object: {
        key: 'value',
      },
    }

    agent.get(mockedEndpoint).intercept({
      path: testPath,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'User-Agent': `${name}/${version}`,
      },
      body: JSON.stringify(body),
    }).reply(200, { message: 'test' })

    const result = await client.post<TestResponse>(testPath, body)
    t.assert.deepEqual(result, { message: 'test' })
  })

  test('set custom headers, don\'t override fixed ones', async (t) => {
    agent.get(mockedEndpoint).intercept({
      path: testPath,
      headers: {
        'custom-header': 'customValue',
        Authorization: 'custom authorization',
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'User-Agent': `${name}/${version}`,
      },
    }).reply(200, { message: 'test' })

    const result = await client.get<TestResponse>(testPath, {
      'custom-header': 'customValue',
      Authorization: 'custom authorization',
      Accept: 'custom accpet value',
      'User-Agent': 'custom user agent',
    })

    t.assert.deepEqual(result, { message: 'test' })
  })
})

suite('http client test suite with authentication', () => {
  const clientID = 'SampleClientId'
  const clientSecret = 'SampleClientSecret'
  const expiringSecret = 'SampleExpiringSecret'
  const failAuthenticationSecret = 'SampleWrongSecret'
  const accessToken = 'SampleAccessToken'

  let agent: MockAgent
  beforeEach(() => {
    agent = new MockAgent()
    setGlobalDispatcher(agent)
    agent.get(mockedEndpoint).intercept({
      path: '/api/m2m/oauth/token',
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${Buffer.from(`${clientID}:${clientSecret}`).toString('base64')}`,
        'User-Agent': `${name}/${version}`,
      },
    }).reply(200, {
      access_token: accessToken,
      token_type: 'Bearer',
      expires_in: 3600,
    }).times(1)
    agent.get(mockedEndpoint).intercept({
      path: '/api/m2m/oauth/token',
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${Buffer.from(`${clientID}:${failAuthenticationSecret}`).toString('base64')}`,
        'User-Agent': `${name}/${version}`,
      },
    }).reply(401, {
      message: 'failed authentication',
    }).times(1)
    agent.get(mockedEndpoint).intercept({
      path: '/api/m2m/oauth/token',
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${Buffer.from(`${clientID}:${expiringSecret}`).toString('base64')}`,
        'User-Agent': `${name}/${version}`,
      },
    }).reply(200, {
      access_token: accessToken,
      token_type: 'Bearer',
      expires_in: 100, // below the EXPIRATION_WINDOW_IN_SECONDS threshold to invalid it for the next request
    }).times(2)
  })

  test('get request', async (t) => {
    const client = new APIClient(mockedEndpoint, clientID, clientSecret)
    const response: TestResponse = {
      message: 'success',
    }

    agent.get(mockedEndpoint).intercept({
      path: testPath,
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'User-Agent': `${name}/${version}`,
        Authorization: `Bearer ${accessToken}`,
      },
    }).reply(200, response)

    const result = await client.get<TestResponse>(testPath)
    t.assert.deepEqual(result, response)
  })

  test('failed authentication', async (t) => {
    const client = new APIClient(mockedEndpoint, clientID, failAuthenticationSecret)

    await t.assert.rejects(
      client.get(testPath, {}, new URLSearchParams({ test: 'testValue' })),
      Error('failed authentication'),
    )
  })

  test('dont\'t call authentication endpoint if access token is already set and is valid', async (t) => {
    const client = new APIClient(mockedEndpoint, clientID, clientSecret)
    const response: TestResponse = {
      message: 'success',
    }

    agent.get(mockedEndpoint).intercept({
      path: testPath,
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'User-Agent': `${name}/${version}`,
        Authorization: `Bearer ${accessToken}`,
      },
    }).reply(200, response)
    const result1 = await client.get<TestResponse>(testPath)
    t.assert.deepEqual(result1, response)

    agent.get(mockedEndpoint).intercept({
      path: testPath,
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'User-Agent': `${name}/${version}`,
        Authorization: `Bearer ${accessToken}`,
      },
    }).reply(200, response)
    const result2 = await client.get<TestResponse>(testPath)
    t.assert.deepEqual(result2, response)
  })

  test('call authentication endpoint if access token is already set but expired', async (t) => {
    const client = new APIClient(mockedEndpoint, clientID, expiringSecret)
    const response: TestResponse = {
      message: 'success',
    }

    agent.get(mockedEndpoint).intercept({
      path: testPath,
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'User-Agent': `${name}/${version}`,
        Authorization: `Bearer ${accessToken}`,
      },
    }).reply(200, response)
    const result1 = await client.get<TestResponse>(testPath)
    t.assert.deepEqual(result1, response)

    agent.get(mockedEndpoint).intercept({
      path: testPath,
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'User-Agent': `${name}/${version}`,
        Authorization: `Bearer ${accessToken}`,
      },
    }).reply(200, response)
    const result2 = await client.get<TestResponse>(testPath)
    t.assert.deepEqual(result2, response)
  })

  test('set custom headers, don\'t override fixed ones', async (t) => {
    const client = new APIClient(mockedEndpoint, clientID, clientSecret)

    agent.get(mockedEndpoint).intercept({
      path: testPath,
      headers: {
        'custom-header': 'customValue',
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'User-Agent': `${name}/${version}`,
      },
    }).reply(200, { message: 'test' })

    const result = await client.get<TestResponse>(testPath, {
      'custom-header': 'customValue',
      Authorization: 'custom authorization',
      Accept: 'custom accpet value',
      'User-Agent': 'custom user agent',
    })

    t.assert.deepEqual(result, { message: 'test' })
  })
})
