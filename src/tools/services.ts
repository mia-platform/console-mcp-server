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
import { CatalogVersionedItem, IProject } from '@mia-platform/console-types'

import { APIClient } from '../lib/client'
import { getProjectInfo } from './projects'
import { getMarketplaceItemVersionInfo, listMarketPlaceItemVersions } from './marketplace'
import { paramsDescriptions, toolsDescriptions } from '../lib/descriptions'

export function addServicesCapabilities (server: McpServer, client: APIClient) {
  server.tool(
    'create_service_from_marketplace',
    toolsDescriptions.CREATE_SERVICE_FROM_MARKETPLACE,
    {
      projectId: z.string().describe(paramsDescriptions.PROJECT_ID),
      tenantId: z.string().describe(paramsDescriptions.TENANT_ID),
      name: z.string().describe(paramsDescriptions.SERVICE_NAME).regex(/^[a-z]([-a-z0-9]*[a-z0-9])?$/),
      description: z.string().optional().describe(paramsDescriptions.SERVICE_DESCRIPTION),
      environmentId: z.string().optional().describe(paramsDescriptions.ENVIRONMENT_ID),
      marketplaceItemId: z.string().describe(paramsDescriptions.MARKETPLACE_ID),
      marketplaceItemTenantId: z.string().describe(paramsDescriptions.MARKETPLACE_TENANT_ID),
      marketplaceItemVersion: z.string().optional().describe(paramsDescriptions.MARKETPLACE_VERSION),
    },
    async (args): Promise<CallToolResult> => {
      try {
        const project = await getProjectInfo(client, args.projectId)

        const marketplaceItem = await getMarketplaceItem(client, args.marketplaceItemId, args.marketplaceItemTenantId, args.marketplaceItemVersion)
        const service = await createServiceFromTemplate(
          client,
          project,
          marketplaceItem,
          args.name,
          args.environmentId,
          args.description,
        )

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(service),
            },
          ],
        }
      } catch (error) {
        const err = error as Error
        return {
          content: [
            {
              type: 'text',
              text: `Error creating the ${args.name} project: ${err.message}`,
            },
          ],
        }
      }
    },
  )
}

async function getMarketplaceItem (
  client: APIClient,
  marketplaceItemId: string,
  marketplaceItemTenantId: string,
  marketplaceItemVersion?: string,
) {
  if (!marketplaceItemVersion) {
    const versions = await listMarketPlaceItemVersions(client, marketplaceItemId, marketplaceItemTenantId)
    if (versions.length === 0) {
      throw new Error(`No versions found for marketplace item ${marketplaceItemId}`)
    }
    for (const version of versions) {
      if (version.isLatest) {
        marketplaceItemVersion = version.version
        break
      }
    }

    if (!marketplaceItemVersion) {
      throw new Error(`No latest version found for marketplace item ${marketplaceItemId}`)
    }
  }

  const marketplaceItem = await getMarketplaceItemVersionInfo(client, marketplaceItemId, marketplaceItemTenantId, marketplaceItemVersion)
  const type = marketplaceItem.type
  switch (type) {
  case 'plugin':
  case 'template':
  case 'example':
    return marketplaceItem
  default:
    throw new Error(`Cannot create a new service from marketplace item ${marketplaceItemId}: ${type} is invalid`)
  }
}

async function createServiceFromTemplate (
  client: APIClient,
  project: IProject,
  marketplaceItem: CatalogVersionedItem,
  name: string,
  environmentId?: string,
  description?: string,
) {
  let newConfiguration = {
    services: {},
    configMaps: {},
    serviceSecrets: {},
    serviceAccounts: {},
  }

  switch (marketplaceItem.type) {
  case 'plugin':
    break
  default:
    serviceBody = {
      ...serviceBody,
    }
  }

  return saveServiceInConfiguration(client, newConfiguration, project._id, environmentId)
}

async function saveServiceInConfiguration (
  client: APIClient,
  serviceBody: Record<string, unknown>,
  projectId: string,
  environmentId?: string,
) {

}
