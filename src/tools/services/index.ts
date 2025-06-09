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

import { CallToolResult } from '@modelcontextprotocol/sdk/types.js'
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'

import { APIClient } from '../../apis/client'
import { paramsDescriptions, toolNames, toolsDescriptions } from '../descriptions'

export function addServicesCapabilities (server: McpServer, client: APIClient) {
  server.tool(
    toolNames.CREATE_SERVICE_FROM_MARKETPLACE,
    toolsDescriptions.CREATE_SERVICE_FROM_MARKETPLACE,
    {
      projectId: z.string().describe(paramsDescriptions.PROJECT_ID),
      name: z.string().describe(paramsDescriptions.SERVICE_NAME).regex(/^[a-z]([-a-z0-9]*[a-z0-9])?$/),
      description: z.string().optional().describe(paramsDescriptions.SERVICE_DESCRIPTION),
      refId: z.string().describe(paramsDescriptions.REF_ID),
      marketplaceItemId: z.string().describe(paramsDescriptions.MARKETPLACE_ITEM_ID),
      marketplaceItemTenantId: z.string().describe(paramsDescriptions.MARKETPLACE_ITEM_TENANT_ID),
      marketplaceItemVersion: z.string().optional().describe(paramsDescriptions.MARKETPLACE_ITEM_VERSION),
    },
    async (args): Promise<CallToolResult> => {
      try {
        const response = await client.createServiceFromMarketplaceItem(
          args.projectId,
          args.name,
          args.refId,
          args.marketplaceItemId,
          args.marketplaceItemTenantId,
          args.marketplaceItemVersion,
          args.description,
        )

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(response),
            },
          ],
        }
      } catch (error) {
        const err = error as Error
        return {
          content: [
            {
              type: 'text',
              text: `Error creating ${args.name} service: ${err.message}`,
            },
          ],
        }
      }
    },
  )
}
