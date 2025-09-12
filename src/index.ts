#!/usr/bin/env node
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

import { Command, Option } from 'commander'

import 'dotenv/config'
import Fastify from 'fastify'
import formbody from '@fastify/formbody'

import { httpServer } from './server/httpserver'
import { oauthRouter } from './server/auth/oauthRouter'
import { runStdioServer } from './server/stdio'
import { statusRoutes } from './server/statusRoutes'
import { wellKnownRouter } from './server/auth/wellKnownRouter'
import { description, version } from '../package.json'

const program = new Command()

program.
  name('console-mcp-server').
  description(description).
  version(version, '-v, --version')

program.
  command('start').
  description('start the Mia-Platform Console MCP Server').
  option('--stdio', 'run the server in stdio mode (default when using npx)', false).
  option('--server-host <serverHost>', 'host to expose the server on', '0.0.0.0').
  addOption(new Option('-p, --port <port>', 'port to run the server on').env('PORT').default('3000')).
  addOption(new Option('--host <host>', 'Mia-Platform Console host').env('CONSOLE_HOST')).
  action(async ({ host, stdio, port, serverHost }) => {
    const clientID = process.env.MIA_PLATFORM_CLIENT_ID || ''
    const clientSecret = process.env.MIA_PLATFORM_CLIENT_SECRET || ''

    if (stdio) {
      return runStdioServer(host, clientID, clientSecret).catch((error) => {
        console.error('Fatal error:', error)
        process.exit(1)
      })
    }

    const fastify = Fastify({
      logger: { level: process.env.LOG_LEVEL || 'info' },
      trustProxy: true,
    })

    // Register form body parser for OAuth2 endpoints
    await fastify.register(formbody)

    // Registering routes
    fastify.register(wellKnownRouter, { prefix: '/', host })
    fastify.register(statusRoutes, { prefix: '/-/' })
    fastify.register(httpServer, { prefix: '/console-mcp-server', host, clientID, clientSecret })
    fastify.register(oauthRouter, { prefix: '/console-mcp-server/oauth', host })

    return fastify.listen({ port: parseInt(port, 10), host: serverHost }, function (err) {
      if (err) {
        fastify.log.error(err)
        process.exit(1)
      }
    })
  })

program.parse(process.argv)

if (!program.args.length) {
  program.help()
  process.exit(0)
}
