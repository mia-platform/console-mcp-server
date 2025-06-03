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

import { Command } from 'commander'

import Fastify from 'fastify'
import { httpServer } from './server/httpserver'
import { runStdioServer } from './server/stdio'
import { description, name, version } from '../package.json'

const program = new Command()

program.
  name(name).
  description(description).
  version(version, '-v, --version')

program.
  command('start').
  description('start the Mia-Platform Console MCP Server').
  option('-p, --port <port>', 'port to run the server on', '3000').
  option('--stdio', 'run the server locally', false).
  option('--host <host>', 'Mia-Platform Console host', 'https://console.cloud.mia-platform.eu').
  action(({ host, stdio, port }) => {
    const clientID = process.env.MIA_PLATFORM_CLIENT_ID || ''
    const clientSecret = process.env.MIA_PLATFORM_CLIENT_SECRET || ''

    if (stdio) {
      return runStdioServer(host, clientID, clientSecret).catch((error) => {
        console.error('Fatal error:', error)
        process.exit(1)
      })
    }

    const fastify = Fastify({
      logger: true,
    })
    fastify.register(httpServer, {
      host,
      clientID,
      clientSecret,
    })

    return fastify.listen({ port: parseInt(port, 10) }, function (err) {
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
