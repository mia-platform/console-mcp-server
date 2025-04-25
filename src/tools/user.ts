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

// User Info endpoint path
const userInfoPath = '/api/userinfo'

// User Companies endpoint path
const userCompaniesPath = '/api/user/companies'

// Interface for user info response
interface UserInfo {
  email: string
  groups: string[]
  name: string
  userId: string
  userSettingsURL: string
}

// Interface for user companies response
interface CompanyMembership {
  companyId: string
  companyName: string
  roleId: string
  groups?: {
    _id: string
    name: string
    roleId: string
  }[]
}

/**
 * Register user-related tools with the MCP server
 * 
 * @param server - The MCP Server instance
 * @param client - The API client
 * @returns void
 */
export function userTools(server: McpServer, client: APIClient) {
  // Tool 1: Get User Info
  server.tool(
    'get_user_info',
    'Get information about the currently authenticated user',
    {},
    async (): Promise<CallToolResult> => {
      try {
        const data = await client.get<UserInfo>(userInfoPath)
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
              text: `Error fetching user info: ${err.message}`,
            },
          ],
        }
      }
    }
  )
  
  // Tool 3: Get User Companies
  server.tool(
    'get_user_companies',
    'Get the list of companies the user is associated with, including their role within each company',
    {},
    async (): Promise<CallToolResult> => {
      try {
        const data = await client.get<CompanyMembership[]>(userCompaniesPath)
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
              text: `Error fetching user companies: ${err.message}`,
            },
          ],
        }
      }
    }
  )
}
