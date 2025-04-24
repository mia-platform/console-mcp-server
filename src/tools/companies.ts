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

import { CallToolResult } from '@modelcontextprotocol/sdk/types.js'
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'

import { APIClient } from '../lib/client'

const listCompaniesPath = '/api/backend/tenants/'

export function addCompaniesCapabilities (server: McpServer, client:APIClient) {
  server.tool(
    'list_tenants',
    'List Mia-Platform Console companies or tenants that the user can access',
    {},
    async (): Promise<CallToolResult> => {
      try {
        const data = await client.getPaginated(listCompaniesPath)
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(data),
            },
          ],
        }
      } catch (error) {
        const err = error as Error
        return {
          content: [
            {
              type: 'text',
              text: `Error fetching companies: ${err.message}`,
            },
          ],
        }
      }
    },
  )
}
