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

import { afterEach, beforeEach, mock, suite, test } from 'node:test'
import Fastify, { FastifyInstance } from 'fastify'
import { MockAgent, setGlobalDispatcher } from 'undici'

import { ClientCredentialsManager } from './clientCredentialsManager'
import { oauthRouter } from './oauthRouter'

suite('OAuth Router', () => {
  const testHost = 'https://test.mia-platform.eu'
  let fastify: FastifyInstance
  let agent: MockAgent

  beforeEach(async () => {
    agent = new MockAgent()
    agent.disableNetConnect()
    setGlobalDispatcher(agent)

    mock.method(ClientCredentialsManager.prototype, 'generateCredentials', () => ({
      clientId: 'test-client-id',
      clientSecret: 'test-client-secret',
      createdAt: Date.now(),
      expiresAt: Date.now() + 300000,
    }))

    mock.method(ClientCredentialsManager.prototype, 'getCredentials', () => ({
      clientId: 'test-client-id',
      clientSecret: 'test-client-secret',
    }))

    mock.method(ClientCredentialsManager.prototype, 'addState', () => true)

    mock.method(ClientCredentialsManager.prototype, 'getStoredClientIdAndState', () => ({
      clientId: 'test-client-id',
      state: 'test-state',
    }))

    mock.method(ClientCredentialsManager.prototype, 'destroy', () => undefined)

    fastify = Fastify({ logger: false })
    await fastify.register(oauthRouter, { host: testHost })
  })

  afterEach(async () => {
    await fastify.close()
    mock.restoreAll()
  })

  suite('POST /register', () => {
    test('should register client with minimal required fields', async (t) => {
      const response = await fastify.inject({
        method: 'POST',
        path: '/register',
        payload: {
          redirect_uris: [ 'https://example.com/callback' ],
        },
      })

      t.assert.equal(response.statusCode, 201)
      const body = response.json()
      t.assert.equal(body.client_id, 'test-client-id')
      t.assert.equal(body.client_secret, 'test-client-secret')
      t.assert.deepEqual(body.redirect_uris, [ 'https://example.com/callback' ])
    })

    test('should return 400 when redirect_uris is missing', async (t) => {
      const response = await fastify.inject({
        method: 'POST',
        path: '/register',
        payload: {},
      })

      t.assert.equal(response.statusCode, 400)
      const body = response.json()
      t.assert.equal(body.error, 'invalid_client_metadata')
      t.assert.equal(body.error_description, '"redirect_uris" is required and must be an array')
    })

    test('should return 400 when redirect_uris is not an array', async (t) => {
      const response = await fastify.inject({
        method: 'POST',
        path: '/register',
        payload: {
          redirect_uris: 'https://example.com/callback',
        },
      })

      t.assert.equal(response.statusCode, 400)
      const body = response.json()
      t.assert.equal(body.error, 'invalid_client_metadata')
    })
  })

  suite('GET /authorize', () => {
    test('should redirect to auth server when all parameters are valid', async (t) => {
      agent.get(testHost).intercept({
        path: '/api/authorize?appId=console-mcp-server&providerId=okta&redirect=https%3A%2F%2Fexample.com%2Fcallback&state=test-state',
        method: 'GET',
      }).reply(302, '', { headers: { location: 'https://auth.example.com/oauth/authorize' } })

      const response = await fastify.inject({
        method: 'GET',
        path: '/authorize',
        query: {
          client_id: 'test-client-id',
          response_type: 'code',
          redirect_uri: 'https://example.com/callback',
          scope: 'openid',
          state: 'test-state',
          code_challenge: 'challenge',
          code_challenge_method: 'S256',
        },
      })

      t.assert.equal(response.statusCode, 302)
      t.assert.equal(response.headers.location, 'https://auth.example.com/oauth/authorize')
    })

    test('should return 400 when client_id is missing', async (t) => {
      const response = await fastify.inject({
        method: 'GET',
        path: '/authorize',
        query: {},
      })

      t.assert.equal(response.statusCode, 400)
      const body = response.json()
      t.assert.equal(body.error, 'invalid_request')
      t.assert.equal(body.error_description, 'client_id is required')
    })

    test('should return 400 when client_id is invalid', async (t) => {
      mock.method(ClientCredentialsManager.prototype, 'getCredentials', () => null, { times: 1 })

      const response = await fastify.inject({
        method: 'GET',
        path: '/authorize',
        query: {
          client_id: 'invalid-client-id',
        },
      })

      t.assert.equal(response.statusCode, 400)
      const body = response.json()
      t.assert.equal(body.error, 'invalid_client')
      t.assert.equal(body.error_description, 'Invalid or expired client_id')
    })

    test('should return 400 when state storage fails', async (t) => {
      mock.method(ClientCredentialsManager.prototype, 'addState', () => false, { times: 1 })

      const response = await fastify.inject({
        method: 'GET',
        path: '/authorize',
        query: {
          client_id: 'test-client-id',
          state: 'test-state',
        },
      })

      t.assert.equal(response.statusCode, 400)
      const body = response.json()
      t.assert.equal(body.error, 'invalid_client')
    })

    test('should return 500 when auth server request fails', async (t) => {
      agent.get(testHost).intercept({
        path: '/api/authorize?appId=console-mcp-server&providerId=okta',
        method: 'GET',
      }).replyWithError(new Error('Network error'))

      const response = await fastify.inject({
        method: 'GET',
        path: '/authorize',
        query: {
          client_id: 'test-client-id',
        },
      })

      t.assert.equal(response.statusCode, 500)
      const body = response.json()
      t.assert.equal(body.error, 'server_error')
      t.assert.equal(body.error_description, 'Failed to process authorization request')
    })
  })

  suite('POST /token', () => {
    test('should exchange authorization code for a new token', async (t) => {
      agent.get(testHost).intercept({
        path: '/api/oauth/token',
        method: 'POST',
        body: 'code=auth-code&state=test-state',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }).reply(200, {
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        expiresAt: 1760900101000,
      })

      const response = await fastify.inject({
        method: 'POST',
        path: '/token',
        payload: {
          grant_type: 'authorization_code',
          code: 'auth-code',
          client_id: 'test-client-id',
          client_secret: 'test-client-secret',
        },
      })

      t.assert.equal(response.statusCode, 200)
      const body = response.json()
      t.assert.equal(body.access_token, 'access-token')
      t.assert.equal(body.refresh_token, 'refresh-token')
      t.assert.equal(body.expires_at, 1760900101000)
      t.assert.equal(body.token_type, 'Bearer')
    })

    test('should refresh tokens successfully', async (t) => {
      agent.get(testHost).intercept({
        path: '/api/refreshToken',
        method: 'POST',
        body: 'grant_type=refresh_token&refresh_token=old-refresh-token',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }).reply(200, {
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
        expiresAt: 1760900101000,
      })

      const response = await fastify.inject({
        method: 'POST',
        path: '/token',
        payload: {
          grant_type: 'refresh_token',
          refresh_token: 'old-refresh-token',
        },
      })

      t.assert.equal(response.statusCode, 200)
      const body = response.json()
      t.assert.equal(body.access_token, 'new-access-token')
      t.assert.equal(body.refresh_token, 'new-refresh-token')
      t.assert.equal(body.expires_at, 1760900101000)
      t.assert.equal(body.token_type, 'Bearer')
    })

    test('should return 401 when client credentials are invalid', async (t) => {
      mock.method(ClientCredentialsManager.prototype, 'getCredentials', () => null, { times: 1 })

      const response = await fastify.inject({
        method: 'POST',
        path: '/token',
        payload: {
          grant_type: 'authorization_code',
          code: 'auth-code',
          client_id: 'invalid-client-id',
          client_secret: 'invalid-secret',
        },
      })

      t.assert.equal(response.statusCode, 401)
      const body = response.json()
      t.assert.equal(body.error, 'invalid_client')
      t.assert.equal(body.error_description, 'Invalid client credentials')
    })

    test('should return 400 if the grant_type is invalid', async (t) => {
      const response = await fastify.inject({
        method: 'POST',
        path: '/token',
        payload: {
          code: 'auth-code',
          client_id: 'test-client-id',
          client_secret: 'test-client-secret',
        },
      })

      t.assert.equal(response.statusCode, 400)
      const body = response.json()
      t.assert.equal(body.error, 'unsupported_grant_type')
      t.assert.equal(body.error_description, 'Only "authorization_code" and "refresh_token" grant types are supported')
    })

    test('should return 400 when client_secret is missing when requesting a new token', async (t) => {
      const response = await fastify.inject({
        method: 'POST',
        path: '/token',
        payload: {
          grant_type: 'authorization_code',
          code: 'auth-code',
          client_id: 'test-client-id',
        },
      })

      t.assert.equal(response.statusCode, 400)
      const body = response.json()
      t.assert.equal(body.error, 'invalid_request')
      t.assert.equal(body.error_description, 'client_id and client_secret are required')
    })

    test('should return 401 when client_secret does not match', async (t) => {
      const response = await fastify.inject({
        method: 'POST',
        path: '/token',
        payload: {
          grant_type: 'authorization_code',
          code: 'auth-code',
          client_id: 'test-client-id',
          client_secret: 'wrong-secret',
        },
      })

      t.assert.equal(response.statusCode, 401)
      const body = response.json()
      t.assert.equal(body.error, 'invalid_client')
      t.assert.equal(body.error_description, 'Invalid client credentials')
    })

    test('should return 400 when no state found for client', async (t) => {
      mock.method(ClientCredentialsManager.prototype, 'getStoredClientIdAndState', () => null, { times: 1 })

      const response = await fastify.inject({
        method: 'POST',
        path: '/token',
        payload: {
          grant_type: 'authorization_code',
          code: 'auth-code',
          client_id: 'test-client-id',
          client_secret: 'test-client-secret',
        },
      })

      t.assert.equal(response.statusCode, 400)
      const body = response.json()
      t.assert.equal(body.error, 'invalid_request')
      t.assert.equal(body.error_description, 'No state found for client_id')
    })

    test('should return 400 when no state in stored client data', async (t) => {
      mock.method(ClientCredentialsManager.prototype, 'getStoredClientIdAndState', () => ({
        clientId: 'test-client-id',
        state: undefined,
      }), { times: 1 })

      const response = await fastify.inject({
        method: 'POST',
        path: '/token',
        payload: {
          grant_type: 'authorization_code',
          code: 'auth-code',
          client_id: 'test-client-id',
          client_secret: 'test-client-secret',
        },
      })

      t.assert.equal(response.statusCode, 400)
      const body = response.json()
      t.assert.equal(body.error, 'invalid_request')
      t.assert.equal(body.error_description, 'No state found for client_id')
    })

    test('should return 400 in case of token exchange failure from auth server side', async (t) => {
      agent.get(testHost).intercept({
        path: '/api/oauth/token',
        method: 'POST',
      }).reply(400, 'Invalid authorization code')

      const response = await fastify.inject({
        method: 'POST',
        path: '/token',
        payload: {
          grant_type: 'authorization_code',
          code: 'invalid-code',
          client_id: 'test-client-id',
          client_secret: 'test-client-secret',
        },
      })

      t.assert.equal(response.statusCode, 400)
      const body = response.json()
      t.assert.equal(body.error, 'invalid_request')
      t.assert.equal(body.error_description, 'Failed to receive token from Authentication Server')
    })

    test('should return 500 when auth server request fails to get a new token', async (t) => {
      agent.get(testHost).intercept({
        path: '/api/oauth/token',
        method: 'POST',
      }).replyWithError(new Error('Network error'))

      const response = await fastify.inject({
        method: 'POST',
        path: '/token',
        payload: {
          grant_type: 'authorization_code',
          code: 'auth-code',
          client_id: 'test-client-id',
          client_secret: 'test-client-secret',
        },
      })

      t.assert.equal(response.statusCode, 500)
      const body = response.json()
      t.assert.equal(body.error, 'server_error')
      t.assert.equal(body.error_description, 'Failed to process token request (grant type: authorization_code)')
    })

    test('should return 500 when auth server request fails to refresh an token', async (t) => {
      agent.get(testHost).intercept({
        path: '/api/refreshToken',
        method: 'POST',
      }).replyWithError(new Error('Network error'))

      const response = await fastify.inject({
        method: 'POST',
        path: '/token',
        payload: {
          grant_type: 'refresh_token',
          refresh_token: 'old-refresh-token',
        },
      })

      t.assert.equal(response.statusCode, 500)
      const body = response.json()
      t.assert.equal(body.error, 'server_error')
      t.assert.equal(body.error_description, 'Failed to process token request (grant type: refresh_token)')
    })
  })
})
