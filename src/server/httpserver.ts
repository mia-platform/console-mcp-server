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
import { IncomingHttpHeaders } from 'undici/types/header'
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js'
import { ErrorCode, JSONRPC_VERSION } from '@modelcontextprotocol/sdk/types.js'
import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'

import { getBaseUrlFromRequest } from './utils'
import { getMcpServer } from './server'
import { OAUTH_PROTECTED_RESOURCE_PATH } from './auth/wellKnownRouter'

export interface HTTPServerOptions {
  host: string
  clientID: string
  clientSecret: string
}

const connectToMcpServer = async (
  request: FastifyRequest,
  reply: FastifyReply,
  options: HTTPServerOptions,
  headers: IncomingHttpHeaders = {},
) => {
  const { host, clientID, clientSecret } = options
  try {
    const server = getMcpServer(host, clientID, clientSecret, headers)
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

    return reply
  }
}

export function httpServer (fastify: FastifyInstance, opts: HTTPServerOptions) {
  const { clientID, clientSecret } = opts
  const additionalHeadersKeys = env.HEADERS_TO_PROXY?.split(',') || []


  fastify.post('/mcp-internal', async (request, reply) => {
    // This is an internal endpoint for the MCP Server. It is intended to be used ONLY in case the MCP
    // Server is running in the same trusted network as the services connecting to it (e.g., internal backend,
    // internal marketplace, etc.).
    //
    // It does not require authentication and proxies some headers as expected in the Mia-Platform Console architecture.
    //
    // Please use the endpoint /mcp for all other use cases.
    fastify.log.debug({ message: 'Received POST /mcp-internal request', body: request.body })

    const additionalHeaders: IncomingHttpHeaders = {}
    for (const key of additionalHeadersKeys) {
      if (key in request.headers) {
        additionalHeaders[key] = request.headers[key]
      }
    }

    // We include an empty host to avoid any authentication mechanism to be triggered.
    return await connectToMcpServer(request, reply, { host: '', clientID, clientSecret }, additionalHeaders)
  })

  fastify.post('/mcp', async (request, reply) => {
    fastify.log.debug({ message: 'Received POST /mcp request', body: request.body })

    const authenticateViaClientCredentials = clientID && clientSecret
    if (authenticateViaClientCredentials) {
      return await connectToMcpServer(request, reply, opts, {})
    }

    const token = request.headers['Authorization'] ?? request.headers['authorization']

    if (!token) {
      const baseUrl = getBaseUrlFromRequest(request)
      const resourceMetadataUrl = new URL(OAUTH_PROTECTED_RESOURCE_PATH, baseUrl)
      const headerContent = `Bearer realm="Console MCP Server", error="invalid_request", error_description="No access token was provided in this request", resource_metadata="${resourceMetadataUrl}"`

      reply.
        header(
          'WWW-Authenticate',
          headerContent,
        ).
        code(401).
        send({
          jsonrpc: JSONRPC_VERSION,
          error: {
            code: ErrorCode.InternalError,
            message: 'Missing or invalid access token',
          },
          id: null,
        })
      return
    }

    return await connectToMcpServer(request, reply, opts, { Authorization: token })
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
