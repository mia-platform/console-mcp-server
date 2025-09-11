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

import { afterEach, beforeEach, suite, test } from 'node:test'

import { JSONRPC_VERSION } from '@modelcontextprotocol/sdk/types.js'
import Fastify, { FastifyInstance } from 'fastify'

import { httpServer } from './httpserver.js'

suite('test http streaming server', () => {
  const testHost = 'http://localhost:3000'

  let fastify: FastifyInstance
  beforeEach(async () => {
    fastify = Fastify({
      logger: false,
    })

    fastify.register(httpServer, {
      host: testHost,
      clientID: '',
      clientSecret: '',
    })
  })

  afterEach(async () => {
    await fastify.close()
  })

  test('run http streaming server calling internal mcp endpoint', async (t) => {
    const firstInit = await fastify.inject({
      method: 'POST',
      path: '/mcp-internal',
      headers: {
        Accept: 'application/json, text/event-stream',
      },
      payload: {
        jsonrpc: JSONRPC_VERSION,
        method: 'initialize',
        params: {
          clientInfo: {
            name: 'test-client',
            version: '1.0',
          },
          protocolVersion: '2025-03-26',
          capabilities: {},
        },
        id: 'init-1',
      },
    })

    t.assert.equal(firstInit.statusCode, 200)
    t.assert.equal(firstInit.headers['content-type'], 'text/event-stream')
  })

  test('run http streaming server calling mcp endpoint (with auth endpoint)', async (t) => {
    const firstInit = await fastify.inject({
      method: 'POST',
      path: '/mcp',
      headers: {
        Accept: 'application/json, text/event-stream',
        Authorization: 'Bearer test-token',
      },
      payload: {
        jsonrpc: JSONRPC_VERSION,
        method: 'initialize',
        params: {
          clientInfo: {
            name: 'test-client',
            version: '1.0',
          },
          protocolVersion: '2025-03-26',
          capabilities: {},
        },
        id: 'init-1',
      },
    })

    t.assert.equal(firstInit.statusCode, 200)
    t.assert.equal(firstInit.headers['content-type'], 'text/event-stream')
  })

  test('run http streaming server calling mcp endpoint (without auth endpoint)', async (t) => {
    const firstInit = await fastify.inject({
      method: 'POST',
      path: '/mcp',
      headers: {
        Accept: 'application/json, text/event-stream',
      },
      payload: {
        jsonrpc: JSONRPC_VERSION,
        method: 'initialize',
        params: {
          clientInfo: {
            name: 'test-client',
            version: '1.0',
          },
          protocolVersion: '2025-03-26',
          capabilities: {},
        },
        id: 'init-1',
      },
    })

    t.assert.equal(firstInit.statusCode, 401)
    t.assert.equal(firstInit.headers['www-authenticate'], 'Bearer realm="Console MCP Server", error="invalid_request", error_description="No access token was provided in this request", resource_metadata="http://localhost/.well-known/oauth-protected-resource/console-mcp-server"')
  })

  test('get request is not allowed for stateless server', async (t) => {
    const unsupported = await fastify.inject({
      method: 'GET',
      path: '/mcp',
      headers: {
        Accept: 'application/json, text/event-stream',
      },
    })

    t.assert.equal(unsupported.statusCode, 405)
    t.assert.equal(unsupported.headers['content-type'], 'application/json; charset=utf-8')
    t.assert.deepEqual(unsupported.json(), {
      jsonrpc: JSONRPC_VERSION,
      error: {
        code: -32000,
        message: 'Method not allowed.',
      },
      id: null,
    })
  })

  test('delete request is not allowed for stateless server', async (t) => {
    const unsupported = await fastify.inject({
      method: 'DELETE',
      path: '/mcp',
      headers: {
        Accept: 'application/json, text/event-stream',
      },
    })

    t.assert.equal(unsupported.statusCode, 405)
    t.assert.equal(unsupported.headers['content-type'], 'application/json; charset=utf-8')
    t.assert.deepEqual(unsupported.json(), {
      jsonrpc: JSONRPC_VERSION,
      error: {
        code: -32000,
        message: 'Method not allowed.',
      },
      id: null,
    })
  })
})
