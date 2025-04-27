// filepath: /Users/giulioroggero/sourcecode/mia-platform/console-mcp-server/src/tools/catalog.ts
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

// API Paths
// TODO verify mia-plaform after tenant if is to be configured or hardcoded
const marketplacePath = '/api/marketplace'
const itemVersionsPath = '/api/tenants/mia-platform/marketplace/items/{itemId}/versions'
const itemVersionDetailsPath = '/api/tenants/mia-platform/marketplace/items/{itemId}/versions/{version}'


// Interface for marketplace item response
interface CategoryInfo {
  id: string
  label: string
}

interface Documentation {
  type: string
  url: string
}

interface Version {
  name: string
  releaseNote: string
}

interface Visibility {
  allTenants: boolean
  public: boolean
}

interface MarketplaceItem {
  _id: string
  itemId: string
  lifecycleStatus: string
  name: string
  releaseDate: string
  tenantId: string
  type: string
  category: CategoryInfo
  componentsIds: string[]
  description: string
  documentation?: Documentation
  imageUrl: string
  isLatest: boolean
  repositoryUrl?: string
  supportedBy?: string
  supportedByImageUrl?: string
  version?: Version
  visibility?: Visibility
}

interface ItemVersion {
  description: string
  lifecycleStatus: string
  name: string
  reference: string
  releaseDate: string
  releaseNote: string
  version: string
  isLatest?: boolean
  security: boolean
  visibility: Visibility
}

interface ContainerPort {
  name: string
  from: number
  to: number
  protocol: string
}

interface Pipeline {
  path?: string
  url?: string
  token?: string
}

interface Service {
  type: string
  name: string
  description: string
  archiveUrl: string
  pipelines: {
    [key: string]: Pipeline
  }
  containerPorts: ContainerPort[]
}

interface ItemVersionDetails {
  _id: string
  category: CategoryInfo
  componentsIds: string[]
  description: string
  documentation?: Documentation
  imageUrl: string
  isLatest: boolean
  itemId: string
  lifecycleStatus: string
  name: string
  releaseDate: string
  repositoryUrl?: string
  resources: {
    services: {
      [key: string]: Service
    }
  }
  supportedBy?: string
  supportedByImageUrl?: string
  tenantId: string
  type: string
  version: Version
  visibility: Visibility
}

/**
 * Register catalog tools on MCP server
 * 
 * @param server MCP server
 * @param client API client
 */
export function registerCatalogTools(server: McpServer, client: APIClient) {
  // Tool: List Software Catalog Items
  server.tool(
    'list_catalog',
    'List Mia-Platform Software Catalog items (template, example, plugins, applications and more) for a given company or tenant or the public ones if no company or tenant is specified',
    {
      tenantId: z.string().describe('the id of the Mia-Platform Console company or tenant to filter').optional(),
      type: z.enum(['application', 'example', 'extension', 'custom-resource', 'plugin', 'proxy', 'sidecar', 'template', '']).describe('type of catalog item to filter, empty string means no filter').optional(),
      nameFilter: z.string().describe('name of the item to filter').optional(),
    },
    async ({ tenantId, type, nameFilter }): Promise<CallToolResult> => {
      try {
        // Building query parameters
        const searchParams = new URLSearchParams()
        if (tenantId) {
          searchParams.append('includeTenantId', tenantId)
        }
        if (type) {
          searchParams.append('types', type)
        }
        
        // Add default parameters
        searchParams.append('page', '1')
        searchParams.append('perPage', '25')
        searchParams.append('sort', 'name')
        searchParams.append('name', nameFilter  || '')
        
        // Make the request
        const endpoint = `${marketplacePath}?${searchParams.toString()}`
        const data = await client.get<MarketplaceItem[]>(endpoint)
        
        // Format the response
        const itemsList = data.map(item => {
          let details = `- Name: ${item.name}
  TemplateId: ${item._id}
  TemplateSlug: ${item.itemId}
  Type: ${item.type}
  Category: ${item.category.label}
  Description: ${item.description}
  Status: ${item.lifecycleStatus}
  Supported By: ${item.supportedBy || 'Not specified'}`

          if (item.version) {
            details += `\n  Version: ${item.version.name}`
          }
          
          if (item.repositoryUrl) {
            details += `\n  Repository: ${item.repositoryUrl}`
          }
          
          return details
        }).join('\n\n')
        
        const summary = `Found ${data.length} catalog items${tenantId ? ` for tenant ${tenantId}` : ''}${type ? ` of type ${type}` : ''}`
        
        return {
          content: [
            {
              type: 'text',
              text: `${summary}\n\n${itemsList}`,
            },
          ],
        }
      } catch (error) {
        const err = error as Error
        return {
          content: [
            {
              type: 'text',
              text: `Error fetching catalog items: ${err.message}`,
            },
          ],
        }
      }
    }
  )

  // Tool: List Item Versions
  server.tool(
    'list_item_versions',
    'Get all versions of a specific catalog item',
    {
      tenantId: z.string().describe('The tenant ID that owns the catalog item'),
      itemId: z.string().describe('The ID of the catalog item to fetch versions for. Use the "list_catalog" tool to find the item ID and use TemplateSlug to get the itemId'),
    },
    async ({ tenantId, itemId }): Promise<CallToolResult> => {
      try {
        // Build API path with parameters
        const endpoint = itemVersionsPath
          .replace('{tenantId}', tenantId)
          .replace('{itemId}', itemId) //TemplateSlug
        
        // Make the request
        const data = await client.get<ItemVersion[]>(endpoint)
        
        // Format the response
        const versionsList = data.map(version => {
          let details = `- ${version.name} (Version: ${version.version || 'NA'})
  Status: ${version.lifecycleStatus}
  Release Date: ${new Date(version.releaseDate).toLocaleDateString()}
  Release Note: ${version.releaseNote || 'None'}
  TemplateID: ${itemId}
  Reference ID: ${version.reference}`

          if (version.isLatest) {
            details += '\n  Latest Version: Yes'
          }
          
          details += `\n  Security Update: ${version.security ? 'Yes' : 'No'}`
          details += `\n  Visibility: ${version.visibility.public ? 'Public' : 'Private'}${version.visibility.allTenants ? ', Available to all tenants' : ''}`
          
          return details
        }).join('\n\n')
        
        const summary = `Found ${data.length} versions for catalog item '${itemId}' in tenant '${tenantId}'`
        
        return {
          content: [
            {
              type: 'text',
              text: `${summary}\n\n${versionsList}`,
            },
          ],
        }
      } catch (error) {
        const err = error as Error
        return {
          content: [
            {
              type: 'text',
              text: `Error fetching versions for catalog item '${itemId}': ${err.message}`,
            },
          ],
        }
      }
    }
  )

  // Tool: Get Item Version Details
  server.tool(
    'get_item_version_details',
    'Get detailed information about a specific version of a catalog item',
    {
      tenantId: z.string().describe('The tenant ID that owns the catalog item'),
      itemId: z.string().describe('The ID of the catalog item. Use the "list_catalog" tool to find the item ID and use TemplateSlug to get the itemId'),
      version: z.string().describe('The version of the catalog item. Use the "list_item_versions" tool to find the version'),
    },
    async ({ tenantId, itemId, version }): Promise<CallToolResult> => {
      try {
        // Build API path with parameters
        const endpoint = itemVersionDetailsPath
          .replace('{tenantId}', tenantId)
          .replace('{itemId}', itemId) // TemplateSlug
          .replace('{version}', version)
        
        // Make the request
        const data = await client.get<ItemVersionDetails>(endpoint)
        
        // Format the response with important details for creating microservices
        const services = Object.entries(data.resources.services).map(([serviceName, service]) => {
          let serviceDetails = `- Service: ${serviceName}
        Type: ${service.type}
        Description: ${service.description}
        Archive URL: ${service.archiveUrl}`
          
          if (service.pipelines && Object.keys(service.pipelines).length > 0) {
            serviceDetails += `\n  
        Available Pipelines:`
            
            Object.entries(service.pipelines).forEach(([pipelineKey, pipeline]) => {
              serviceDetails += `\n    - ${pipelineKey}: ${pipeline.path ? `Path: ${pipeline.path}` : `URL: ${pipeline.url}`}`
            })
          }
          
          serviceDetails += '\n  \n  Container Ports:'
          service.containerPorts.forEach(port => {
            serviceDetails += `\n    - ${port.name}: ${port.from} -> ${port.to} (${port.protocol})`
          })
          
          return serviceDetails
        }).join('\n\n')
        
        const formattedResponse = `Item Details for '${data.name}' (Version ${data.version.name}):

TemplateId: ${data._id}
TemplateSlug: ${data.name}
Type: ${data.type}
Category: ${data.category.label}
Lifecycle Status: ${data.lifecycleStatus}
Description: ${data.description}
Release Date: ${new Date(data.releaseDate).toLocaleDateString()}
${data.repositoryUrl ? `Repository URL: ${data.repositoryUrl}` : ''}
${data.documentation ? `Documentation: ${data.documentation.url}` : ''}
Visibility: ${data.visibility.public ? 'Public' : 'Private'}
Supported By: ${data.supportedBy || 'Not specified'}

Services:
${services}`
        
        return {
          content: [
            {
              type: 'text',
              text: formattedResponse,
            },
          ],
        }
      } catch (error) {
        const err = error as Error
        return {
          content: [
            {
              type: 'text',
              text: `Error fetching details for catalog item '${itemId}' version '${version}': ${err.message}`,
            },
          ],
        }
      }
    }
  )
}
