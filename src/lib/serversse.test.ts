// Copyright Mia srl
// SPDX-License-Identifier: Apache-2.0

// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at

//     http://www.apache.org/licenses/LICENSE-2.0

// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import readline from 'node:readline'
import { beforeEach, suite, test } from 'node:test'

import { CallToolRequest } from '@modelcontextprotocol/sdk/types.js'
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import Fastify, { FastifyInstance } from 'fastify'


import { sseServer } from './serversse.js'

suite('test server sse', () => {
  let fastify: FastifyInstance
  beforeEach(() => {
    const mcpServer = new McpServer({
      name: 'test',
      version: '0.0.1',
    })

    mcpServer.tool('test_tool', 'test tool', {}, () => {
      return {
        content: [
          {
            type: 'text',
            text: 'test',
          },
        ],
      }
    })

    fastify = Fastify({
      logger: false,
    })
    fastify.register(sseServer, { server: mcpServer })
  })

  test('test creation of sse sessionId', async (t) => {
    const sseSession = await fastify.inject({
      method: 'GET',
      url: '/sse',
      payloadAsStream: true,
    })

    t.assert.deepEqual(sseSession.statusCode, 200)
    t.assert.deepEqual(sseSession.headers, {
      'content-type': 'text/event-stream',
      'cache-control': 'no-cache, no-transform',
      connection: 'keep-alive',
      'transfer-encoding': 'chunked',
      date: sseSession.headers.date,
    })

    const reader = readline.createInterface({
      input: sseSession.stream(),
      crlfDelay: Infinity,
    })

    let session = ''
    for await (const line of reader) {
      if (line.startsWith('data:')) {
        session = line.substring(5).trim()
        break
      }
    }

    const messageRequest = await fastify.inject({
      method: 'POST',
      url: session,
      body: {
        jsonrpc: '2.0',
        id: 1,
        method: 'tools/call',
        params: {
          name: 'test_tool',
          arguments: {},
        },
      } as CallToolRequest,
    })

    t.assert.equal(messageRequest.statusCode, 202)
    t.assert.equal(messageRequest.body, 'Accepted')
    await sseSession.raw.res.end()

    const failMessageRequest = await fastify.inject({
      method: 'POST',
      url: session,
      body: {
        jsonrpc: '2.0',
        id: 2,
        method: 'tools/call',
        params: {
          name: 'test_tool',
          arguments: {},
        },
      } as CallToolRequest,
    })

    t.assert.equal(failMessageRequest.statusCode, 400)
  })

  test('calling messages without sessionId or opening an sse session return 400', async (t) => {
    const response = await fastify.inject({
      method: 'POST',
      url: '/messages',
    })

    t.assert.equal(response.statusCode, 400)
  })
})
