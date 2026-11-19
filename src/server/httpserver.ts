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

import { ConsoleMCPServerOptions } from './types'
import { getBaseUrlFromRequest } from './utils'
import { getMcpServer } from './server'
import { OAUTH_PROTECTED_RESOURCE_PATH } from './auth/wellKnownRouter'

export type HTTPServerOptions = ConsoleMCPServerOptions & {
  host: string

  /** Base URL for outbound Console API calls on /mcp; falls back to host when unset or empty. */
  apiHost?: string
}

/** Build the WWW-Authenticate header used when the access token is missing. */
const buildAuthenticateHeader = (baseUrl: string) => {
  const resourceMetadataUrl = new URL(OAUTH_PROTECTED_RESOURCE_PATH, baseUrl)
  return `Bearer realm="Console MCP Server", error="invalid_request", error_description="No access token was provided in this request", resource_metadata="${resourceMetadataUrl}", endpoint="/mcp"`
}

/** Send a 401 response for missing/invalid token. */
export const sendMissingToken = (request: FastifyRequest, reply: FastifyReply) => {
  const baseUrl = getBaseUrlFromRequest(request)
  const headerContent = buildAuthenticateHeader(baseUrl)
  reply.
    header('WWW-Authenticate', headerContent).
    code(401).
    send({
      jsonrpc: JSONRPC_VERSION,
      error: {
        code: ErrorCode.InternalError,
        message: 'Missing or invalid access token',
      },
      id: null,
    })
}

const connectToMcpServer = async (
  request: FastifyRequest,
  reply: FastifyReply,
  options: HTTPServerOptions,
  headers: IncomingHttpHeaders = {},
) => {
  const { clientId, clientSecret, enableCentralizedUserManagement, host } = options
  try {
    const server = getMcpServer(host, { clientId, clientSecret, enableCentralizedUserManagement, additionalHeaders: headers })
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
}

const pickHeaders = (request: FastifyRequest, keys: string[]): IncomingHttpHeaders => {
  const headers: IncomingHttpHeaders = {}
  for (const key of keys) {
    if (key in request.headers) {
      headers[key] = request.headers[key]
    }
  }
  return headers
}

export function httpServer (fastify: FastifyInstance, opts: HTTPServerOptions) {
  const { clientId, clientSecret } = opts
  const additionalHeadersKeys = env.HEADERS_TO_PROXY?.split(',') || []
  const apiOpts = { ...opts, host: opts.apiHost || opts.host }

  // On /mcp identity comes only from the user token: never forward identity headers or the inbound host.
  const apiHeadersKeys = additionalHeadersKeys.filter((key) => key !== 'host' && !key.startsWith('miauser'))

  let deprecationLogged = false

  fastify.post('/mcp-internal', async (request, reply) => {
    // This is an internal endpoint for the MCP Server. It is intended to be used ONLY in case the MCP
    // Server is running in the same trusted network as the services connecting to it (e.g., internal backend,
    // internal marketplace, etc.).
    //
    // It does not require authentication and proxies some headers as expected in the Mia-Platform Console architecture.
    //
    // Please use the endpoint /mcp for all other use cases.
    fastify.log.debug({ message: 'Received POST /console-mcp-server/mcp-internal request', body: request.body })

    if (!deprecationLogged) {
      deprecationLogged = true
      fastify.log.warn('/console-mcp-server/mcp-internal is deprecated and will be removed: use /console-mcp-server/mcp')
    }

    const additionalHeaders = pickHeaders(request, additionalHeadersKeys)

    // We include an empty host to avoid any authentication mechanism to be triggered.
    await connectToMcpServer(request, reply, { host: '', clientId, clientSecret }, additionalHeaders)
  })

  fastify.post('/mcp', async (request, reply) => {
    fastify.log.debug({ message: 'Received POST /console-mcp-server/mcp request', body: request.body })

    const authenticateViaClientCredentials = clientId && clientSecret
    if (authenticateViaClientCredentials) {
      await connectToMcpServer(request, reply, opts, {})
      return
    }

    const token = request.headers['Authorization'] ?? request.headers['authorization']
    if (!token) {
      sendMissingToken(request, reply)
      return
    }

    await connectToMcpServer(request, reply, apiOpts, { Authorization: token, ...pickHeaders(request, apiHeadersKeys) })
  })

  fastify.get('/mcp', async (request, reply) => {
    fastify.log.debug({ message: 'Received GET /console-mcp-server/mcp request' })

    const authenticateViaClientCredentials = clientId && clientSecret
    if (authenticateViaClientCredentials) {
      await connectToMcpServer(request, reply, opts, {})
      return
    }

    const token = request.headers['Authorization'] ?? request.headers['authorization']
    if (!token) {
      sendMissingToken(request, reply)
      return
    }

    await connectToMcpServer(request, reply, apiOpts, { Authorization: token, ...pickHeaders(request, apiHeadersKeys) })
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
