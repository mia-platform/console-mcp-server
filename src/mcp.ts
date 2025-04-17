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

import Fastify from 'fastify'
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'

import { APIClient } from './lib/client'
import { marketplaceTools } from './tools/marketplace'
import { sseServer } from './lib/serversse'
import { description, name, version } from '../package.json'

// Create server instance
const server = new McpServer({
  name,
  version,
  description,
  capabilities: {
    resources: {},
    tools: {},
    logging: {},
  },
})

export function initializeMCPServer (host: string, clientID: string, clientSecret: string) {
  const client = new APIClient(host, clientID, clientSecret)
  marketplaceTools(server, client)
}

export async function localServer () {
  const transport = new StdioServerTransport()
  await server.connect(transport)
}

export async function remoteServer (port: string) {
  const fastify = Fastify({
    logger: true,
  })

  fastify.register(sseServer, {
    server,
  })

  await fastify.listen({ port: parseInt(port, 10) }, function (err) {
    if (err) {
      fastify.log.error(err)
      process.exit(1)
    }
  })
}
