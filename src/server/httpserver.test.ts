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

import { Writable } from 'node:stream'
import { afterEach, beforeEach, suite, test } from 'node:test'

import { JSONRPC_VERSION } from '@modelcontextprotocol/sdk/types.js'
import Fastify, { FastifyInstance } from 'fastify'
import { MockAgent, setGlobalDispatcher } from 'undici'

import { httpServer } from './httpserver.js'
import { internalEndpoint } from '../apis/backendClient.js'

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

  test('call mcp endpoint is not allowed without token', async (t) => {
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
    t.assert.match(firstInit.headers['www-authenticate'] as string, /Bearer realm="Console MCP Server"/)
    t.assert.match(firstInit.headers['www-authenticate'] as string, /\/.well-known\/oauth-protected-resource\/console-mcp-server"/)
  })

  test('open passive SSE stream with GET /mcp (with auth token)', async (t) => {
    const address = await fastify.listen({ port: 0 })
    const controller = new AbortController()
    const response = await fetch(`${address}/mcp`, {
      method: 'GET',
      headers: {
        Accept: 'text/event-stream',
        Authorization: 'Bearer test-token',
      },
      signal: controller.signal,
    })

    t.assert.equal(response.status, 200)
    t.assert.equal(response.headers.get('content-type'), 'text/event-stream')

    controller.abort()
  })

  test('GET /mcp without token is unauthorized', async (t) => {
    const response = await fastify.inject({
      method: 'GET',
      path: '/mcp',
      headers: {
        Accept: 'text/event-stream',
      },
    })

    t.assert.equal(response.statusCode, 401)
    t.assert.match(response.headers['www-authenticate'] as string, /Bearer realm="Console MCP Server"/)
    t.assert.match(response.headers['www-authenticate'] as string, /\/\.well-known\/oauth-protected-resource\/console-mcp-server"/)
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

suite('outbound calls of the http streaming server', () => {
  const testHost = 'http://console.example.com'
  const testApiHost = 'http://api-gateway:8080'
  const listTenantsCall = {
    jsonrpc: JSONRPC_VERSION,
    method: 'tools/call',
    params: { name: 'list_tenants', arguments: {} },
    id: 'call-1',
  }

  let agent: MockAgent
  let logs: Record<string, unknown>[]
  const previousHeadersToProxy = process.env.HEADERS_TO_PROXY

  const buildServer = (apiHost?: string) => {
    const stream = new Writable({
      write (chunk, _, done) {
        logs.push(JSON.parse(chunk.toString()))
        done()
      },
    })
    const fastify = Fastify({ logger: { level: 'warn', stream } })
    fastify.register(httpServer, { host: testHost, apiHost, clientID: '', clientSecret: '' })
    return fastify
  }

  const interceptListTenants = (origin: string) => {
    const captured: { headers?: Record<string, string> } = {}
    agent.get(origin).intercept({ path: '/api/backend/tenants/', method: 'GET', query: { per_page: '200', page: '1' } }).
      reply(200, (opts) => {
        captured.headers = Object.fromEntries(Object.entries(opts.headers as Record<string, string>).map(([ key, value ]) => [ key.toLowerCase(), value ]))
        return []
      })
    return captured
  }

  beforeEach(() => {
    logs = []
    process.env.HEADERS_TO_PROXY = 'x-request-id,request-id'
    agent = new MockAgent()
    agent.disableNetConnect()
    setGlobalDispatcher(agent)
  })

  afterEach(() => {
    if (previousHeadersToProxy === undefined) {
      delete process.env.HEADERS_TO_PROXY
    } else {
      process.env.HEADERS_TO_PROXY = previousHeadersToProxy
    }
  })

  test('POST /mcp calls apiHost forwarding Authorization and proxied headers only', async (t) => {
    process.env.HEADERS_TO_PROXY = 'x-request-id,request-id,host,miauserid,miausergroups'
    const fastify = buildServer(testApiHost)
    const captured = interceptListTenants(testApiHost)

    const response = await fastify.inject({
      method: 'POST',
      path: '/mcp',
      headers: {
        Accept: 'application/json, text/event-stream',
        Authorization: 'Bearer user-token',
        'x-request-id': 'req-1',
        miauserid: 'user-1',
        miausergroups: 'admin',
      },
      payload: listTenantsCall,
    })
    await fastify.close()

    t.assert.equal(response.statusCode, 200)
    t.assert.equal(captured.headers?.authorization, 'Bearer user-token')
    t.assert.equal(captured.headers?.['x-request-id'], 'req-1')
    t.assert.equal(captured.headers?.miauserid, undefined)
    t.assert.equal(captured.headers?.miausergroups, undefined)
    t.assert.notEqual(captured.headers?.host, 'localhost:80')
  })

  for (const apiHost of [ undefined, '' ]) {
    test(`POST /mcp falls back to host when apiHost is ${JSON.stringify(apiHost)}`, async (t) => {
      const fastify = buildServer(apiHost)
      const captured = interceptListTenants(testHost)

      const response = await fastify.inject({
        method: 'POST',
        path: '/mcp',
        headers: { Accept: 'application/json, text/event-stream', Authorization: 'Bearer user-token' },
        payload: listTenantsCall,
      })
      await fastify.close()

      t.assert.equal(response.statusCode, 200)
      t.assert.equal(captured.headers?.authorization, 'Bearer user-token')
    })
  }

  test('POST /mcp-internal uses internal clients and logs the deprecation warning once', async (t) => {
    const fastify = buildServer(testApiHost)

    for (const id of [ 'req-1', 'req-2' ]) {
      const captured = interceptListTenants(internalEndpoint)
      const response = await fastify.inject({
        method: 'POST',
        path: '/mcp-internal',
        headers: { Accept: 'application/json, text/event-stream', 'x-request-id': id },
        payload: listTenantsCall,
      })
      t.assert.equal(response.statusCode, 200)
      t.assert.equal(captured.headers?.['x-request-id'], id)
    }
    await fastify.close()

    const deprecations = logs.filter((log) => log.level === 40 && (/deprecated/).test(String(log.msg)))
    t.assert.equal(deprecations.length, 1)
  })
})
