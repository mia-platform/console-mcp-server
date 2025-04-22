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

import { FastifyInstance } from 'fastify'
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js'

interface MCPMessagesQuerystring {
  sessionId: string
}

interface SSEServerPluginOptions {
  server: McpServer
}

export function sseServer (fastify: FastifyInstance, opts: SSEServerPluginOptions) {
  const { server } = opts

  const transports: Record<string, SSEServerTransport> = {}

  fastify.get('/sse', async (_, reply) => {
    const transport = new SSEServerTransport('/messages', reply.raw)
    transports[transport.sessionId] = transport

    reply.raw.on('close', () => {
      delete transports[transport.sessionId]
    })
    await server.connect(transport)
  })

  fastify.post<{ Querystring: MCPMessagesQuerystring }>('/messages', async (req, reply) => {
    const sessionId = req.query.sessionId
    const transport = transports[sessionId]
    if (transport) {
      await transport.handlePostMessage(req.raw, reply.raw, req.body)
    } else {
      reply.status(400).send(`No session found with id: ${sessionId}`)
    }
  })
}
