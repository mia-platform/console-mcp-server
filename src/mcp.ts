// Copyright Mia srl
// SPDX-License-Identifier: Apache-2.0

// Licensed under the Apache License, Version 2.0 (the "License")
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at

//     http://www.apache.org/licenses/LICENSE-2.0

// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js"

import { name, description, version } from "../package.json"
import { marketplaceTools } from './tools/marketplace'
import { APIClient } from './lib/client'

// Create server instance
const server = new McpServer({
  name,
  version,
  description,
  capabilities: {
    resources: {},
    tools: {},
  },
})

export function initializeMCPServer(host: string, clientID: string, clientSecret: string) {
  const client = new APIClient(host, clientID, clientSecret)
  marketplaceTools(server, client)
}

export async function localServer() {
  const transport = new StdioServerTransport()
  await server.connect(transport)
}

export async function remoteServer(port: string) {
  console.error("start runner on port", port)
  console.error("TODO: implement remote server")
}
