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

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'

import { APIClient } from '../lib/client'
import { marketplaceTools } from './marketplace'
import { userTools } from './user'
import { projectsTools } from './projects'
import { consoleSystemTools } from './console-system'
import { environmentTools } from './environment'
import { auditLogTools } from './audit-log'

/**
 * Register all Console API tools with the MCP server
 * 
 * @param server - The MCP Server instance
 * @param client - The API client
 * @returns void
 */
export function registerConsoleApiTools(server: McpServer, client: APIClient) {
  marketplaceTools(server, client)
  userTools(server, client)
  projectsTools(server, client)
  consoleSystemTools(server, client)
  environmentTools(server, client)
  auditLogTools(server, client)
}
