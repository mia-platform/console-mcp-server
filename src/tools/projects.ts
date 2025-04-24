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
import { z } from 'zod'

import { APIClient } from '../lib/client'

const listProjectsPath = '/api/backend/projects/'

export function addProjectsCapabilities (server: McpServer, client:APIClient) {
  server.tool(
    'list_projects',
    'List Mia-Platform Console projects that the user can access in the given companies or tenants',
    {
      tenantIds: z.string().array().nonempty().describe('one or more id of Mia-Platform Console companies or tenants to filter'),
    },
    async ({ tenantIds }): Promise<CallToolResult> => {
      const companiesIds = tenantIds.join(',')
      try {
        const params = new URLSearchParams({
          tenantIds: companiesIds,
        })

        const data = await client.getPaginated(listProjectsPath, {}, params)
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
              text: `Error fetching projects for ${companiesIds}: ${err.message}`,
            },
          ],
        }
      }
    },
  )
}
