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

import { env } from 'node:process'

import { FastifyInstance } from 'fastify'
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js'
import { ErrorCode, JSONRPC_VERSION } from '@modelcontextprotocol/sdk/types.js'

import { getMcpServer } from './server'
import { IncomingHttpHeaders } from 'undici/types/header'

export interface HTTPServerOptions {
  host: string
  clientID: string
  clientSecret: string
}

export function httpServer (fastify: FastifyInstance, opts: HTTPServerOptions) {
  const { host, clientID, clientSecret } = opts
  const additionalHeadersKeys = env.HEADERS_TO_PROXY?.split(',') || []

  fastify.post('/mcp', async (request, reply) => {
    const additionalHeaders: IncomingHttpHeaders = {}
    for (const key of additionalHeadersKeys) {
      if (key in request.headers) {
        additionalHeaders[key] = request.headers[key]
      }
    }

    try {
      const server = getMcpServer(host, clientID, clientSecret, additionalHeaders)
      const transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: undefined,
      })

      reply.raw.on('close', () => {
        transport.close()
        server.close()
      })

      await server.connect(transport)
      await transport.handleRequest(request.raw, reply.raw, request.body)
    } catch (error) {
      console.error('Error handling MCP request:', error)
      reply.code(500)
      reply.send({
        jsonrpc: JSONRPC_VERSION,
        error: {
          code: ErrorCode.InternalError,
          message: 'Internal server error',
        },
        id: null,
      })
    }
  })

  fastify.get('/mcp', async (_, reply) => {
    reply.code(405)
    reply.send({
      jsonrpc: JSONRPC_VERSION,
      error: {
        code: ErrorCode.ConnectionClosed,
        message: 'Method not allowed.',
      },
      id: null,
    })
  })

  fastify.delete('/mcp', async (_, reply) => {
    reply.code(405)
    reply.send({
      jsonrpc: JSONRPC_VERSION,
      error: {
        code: ErrorCode.ConnectionClosed,
        message: 'Method not allowed.',
      },
      id: null,
    })
  })
}
