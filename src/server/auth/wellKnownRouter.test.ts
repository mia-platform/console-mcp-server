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
import Fastify, { FastifyInstance } from 'fastify'

import { wellKnownRouter } from './wellKnownRouter'


suite('./well-known routes', () => {
  let fastify: FastifyInstance
  beforeEach(async () => {
    fastify = Fastify({
      logger: false,
    })

    fastify.register(wellKnownRouter, { host: 'https://my-console-host.com' })
  })

  test('GET /.well-known/oauth-protected-resource/console-mcp-server', async (t) => {
    const response = await fastify.inject({
      method: 'GET',
      path: '/.well-known/oauth-protected-resource/console-mcp-server',
    })

    t.assert.equal(response.statusCode, 200)
    t.assert.equal(response.headers['content-type'], 'application/json; charset=utf-8')
    const body = JSON.parse(response.body)
    t.assert.equal(body.resource_name, 'Console MCP Server')
    t.assert.equal(body.resource, `http://localhost:80/console-mcp-server/mcp`)
    t.assert.equal(body.authorization_servers[0], `http://localhost:80/console-mcp-server`)
    t.assert.deepEqual(body.scopes_supported, [ 'profile', 'email', 'openid', 'offline-access' ])
    t.assert.deepEqual(body.bearer_methods_supported, [ 'header' ])
  })

  test('GET /.well-known/oauth-authorization-server/console-mcp-server', async (t) => {
    const response = await fastify.inject({
      method: 'GET',
      path: '/.well-known/oauth-authorization-server/console-mcp-server',
    })

    t.assert.equal(response.statusCode, 200)
    t.assert.equal(response.headers['content-type'], 'application/json; charset=utf-8')
    const body = JSON.parse(response.body)
    t.assert.equal(body.issuer, 'https://my-console-host.com')
    t.assert.equal(body.authorization_endpoint, `http://localhost:80/console-mcp-server/oauth/authorize`)
    t.assert.equal(body.token_endpoint, `http://localhost:80/console-mcp-server/oauth/token`)
    t.assert.equal(body.registration_endpoint, `http://localhost:80/console-mcp-server/oauth/register`)
    t.assert.deepEqual(body.scopes_supported, [ 'profile', 'email', 'openid', 'offline-access' ])
    t.assert.deepEqual(body.response_types_supported, [ 'code' ])
    t.assert.deepEqual(body.code_challenge_methods_supported, [ 'S256' ])
    t.assert.deepEqual(body.response_modes_supported, [ 'query' ])
    t.assert.deepEqual(body.grant_types_supported, [
      'authorization_code',
      'refresh_token',
    ])
  })
})
