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

import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js'
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'

export type ToolsBuilder = (server: McpServer) => void

export async function TestMCPServer (toolsBuilder: ToolsBuilder): Promise<Client> {
  const testServer = new McpServer({
    name: 'test server',
    version: '1.0',
  })

  const testClient = new Client({
    name: 'test client',
    version: '1.0',
  })

  toolsBuilder(testServer)

  const [ clientTransport, serverTransport ] = InMemoryTransport.createLinkedPair()
  await Promise.all([
    testClient.connect(clientTransport),
    testServer.server.connect(serverTransport),
  ])

  return testClient
}
