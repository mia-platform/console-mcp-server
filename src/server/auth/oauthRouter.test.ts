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
  const mockOktaCredentials = {
    clientId: 'okta-client-id',
    clientSecret: 'okta-client-secret',
    host: testHost,
  }

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

    mock.method(ClientCredentialsManager.prototype, 'destroy', () => undefined)

    fastify = Fastify({ logger: false })
    await fastify.register(oauthRouter, { oktaClientCredentials: mockOktaCredentials })
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
      const expectedLocation = `${testHost}/oauth2/v1/authorize?client_id=${mockOktaCredentials.clientId}&response_type=code&redirect_uri=https%3A%2F%2Fexample.com%2Fcallback&scope=openid&state=test-state&code_challenge=challenge&code_challenge_method=S256`
      t.assert.equal(response.headers.location, expectedLocation)
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
  })

  suite('POST /token', () => {
    test('invalid grant_type should return 400', async (t) => {
      const response = await fastify.inject({
        method: 'POST',
        path: '/token',
        payload: {
          grant_type: 'a-totally-invalid-grant',
          code: 'invalid-code',
          client_id: 'test-client-id',
          client_secret: 'test-client-secret',
        },
      })

      t.assert.equal(response.statusCode, 400)
      const body = response.json()
      t.assert.equal(body.error, 'unsupported_grant_type')
      t.assert.equal(body.error_description, 'Only "authorization_code" and "refresh_token" grant types are supported.')
    })

    suite('with authorization_code grant type', () => {
      test('should exchange authorization code for tokens', async (t) => {
        agent.get(testHost).intercept({
          path: '/oauth2/v1/token',
          method: 'POST',
          body: `grant_type=authorization_code&client_id=${mockOktaCredentials.clientId}&client_secret=${mockOktaCredentials.clientSecret}&code=auth-code&redirect_uri=&code_verifier=`,
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }).reply(200, {
          access_token: 'access-token',
          refresh_token: 'refresh-token',
          expires_at: 1760900101000,
          token_type: 'Bearer',
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

      test('should return 401 when client credentials are invalid', async (t) => {
        mock.method(ClientCredentialsManager.prototype, 'getCredentials', () => null, { times: 1 })

        const response = await fastify.inject({
          method: 'POST',
          path: '/token',
          payload: {
            grant_type: 'authorization_code',
            code: 'auth-code',
            client_id: 'invalid-client-id',
          },
        })

        t.assert.equal(response.statusCode, 401)
        const body = response.json()
        t.assert.equal(body.error, 'invalid_client')
        t.assert.equal(body.error_description, 'Invalid client credentials')
      })

      test('should handle token exchange failure from auth server', async (t) => {
        agent.get(testHost).intercept({
          path: '/oauth2/v1/token',
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
        t.assert.equal(body.error_description, 'Failed to complete the authorization_code request.')
      })

      test('should return 500 when auth server request fails', async (t) => {
        agent.get(testHost).intercept({
          path: '/oauth2/v1/token',
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
        t.assert.equal(body.error_description, 'Failed to process the authorization_code request.')
      })
    })

    suite('with refresh_token grant type', () => {
      test('should exchange refresh token for new tokens', async (t) => {
        agent.get(testHost).intercept({
          path: '/oauth2/v1/token',
          method: 'POST',
          body: `grant_type=refresh_token&client_id=${mockOktaCredentials.clientId}&client_secret=${mockOktaCredentials.clientSecret}&refresh_token=refresh-token-123`,
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }).reply(200, {
          access_token: 'new-access-token',
          refresh_token: 'new-refresh-token',
          expires_at: 1760900201000,
          token_type: 'Bearer',
        })

        const response = await fastify.inject({
          method: 'POST',
          path: '/token',
          payload: {
            grant_type: 'refresh_token',
            refresh_token: 'refresh-token-123',
            client_id: 'test-client-id',
            client_secret: 'test-client-secret',
          },
        })

        t.assert.equal(response.statusCode, 200)
        const body = response.json()
        t.assert.equal(body.access_token, 'new-access-token')
        t.assert.equal(body.refresh_token, 'new-refresh-token')
        t.assert.equal(body.expires_at, 1760900201000)
        t.assert.equal(body.token_type, 'Bearer')
      })

      test('should return 400 when refresh_token is missing', async (t) => {
        const response = await fastify.inject({
          method: 'POST',
          path: '/token',
          payload: {
            grant_type: 'refresh_token',
            client_id: 'test-client-id',
            client_secret: 'test-client-secret',
          },
        })

        t.assert.equal(response.statusCode, 400)
        const body = response.json()
        t.assert.equal(body.error, 'invalid_request')
        t.assert.equal(body.error_description, 'refresh_token is required for refresh_token grant')
      })
    })
  })
})
