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
import { readProjectConfigurations, saveProjectConfigurations } from '../lib/designLib'
import { ProjectDesign } from '../types/project-design'

/**
 * Register design tools on MCP server
 * 
 * @param server MCP server
 * @param client API client
 */
export function registerDesignTools(server: McpServer, client: APIClient) {
  // Tool: Get Project Design Configuration
  server.tool(
    'get_project_design',
    'Get project design configuration including endpoints, collections, services, and more',
    {
      projectId: z.string().describe('The ProjectId of the project'),
      revision: z.string().describe('The revision to fetch (branch or tag name)').default('DEV').optional(),
    },
    async ({ projectId, revision = 'main' }): Promise<CallToolResult> => {
      try {
        // Call readProjectConfigurations from designLib
        const data = await readProjectConfigurations(client, projectId, revision)
        
        // Format the response with important sections
        const summary = {
          endpoints: Object.keys(data.endpoints || {}).length,
          collections: Object.keys(data.collections || {}).length,
          services: Object.keys(data.services || {}).length,
          secrets: (data.secrets || []).length,
          configMaps: Object.keys(data.configMaps || {}).length,
          platformVersion: data.platformVersion,
          version: data.version
        }
        
        // Create summary of services
        const servicesSummary = Object.entries(data.services || {}).map(([name, service]) => {
          return `- ${name}:
  Type: ${service.type}
  Docker Image: ${service.dockerImage}
  Replicas: ${service.replicas}
  Description: ${service.description || 'Not provided'}`
        }).join('\n\n')
        
        // Create summary of collections
        const collectionsSummary = Object.entries(data.collections || {}).map(([id, collection]) => {
          return `- ${collection.name} (ID: ${id}):
  Type: ${collection.type}
  Fields: ${collection.fields.length}
  Indexes: ${collection.indexes.length}
  Description: ${collection.description || 'Not provided'}`
        }).join('\n\n')
        
        // Create summary of endpoints
        const endpointsSummary = Object.entries(data.endpoints || {}).map(([id, endpoint]) => {
          return `- ${id}:
  Base Path: ${endpoint.basePath}
  Type: ${endpoint.type}
  Public: ${endpoint.public ? 'Yes' : 'No'}
  Description: ${endpoint.description || 'Not provided'}`
        }).join('\n\n')
        
        const formattedResponse = `Project Design Configuration for Project ID: ${projectId} (Revision: ${revision})

Last Commit: ${data.lastCommitAuthor ? `by ${data.lastCommitAuthor}` : 'Unknown'} ${data.committedDate ? `on ${new Date(data.committedDate).toLocaleString()}` : ''}
Platform Version: ${data.platformVersion || 'Unknown'}
Configuration Version: ${data.version || 'Unknown'}

Summary:
- Endpoints: ${summary.endpoints}
- Collections: ${summary.collections}
- Services: ${summary.services}
- Secrets: ${summary.secrets}
- Config Maps: ${summary.configMaps}

Services:
${servicesSummary || 'No services defined'}

Collections:
${collectionsSummary || 'No collections defined'}

Endpoints:
${endpointsSummary || 'No endpoints defined'}`
        
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
              text: `Error fetching project design: ${err.message}`,
            },
          ],
        }
      }
    }
  )

  // Tool: Save Project Design Configuration
  server.tool(
    'save_project_design',
    'Save project design configuration including endpoints, collections, services, and more',
    {
      projectId: z.string().describe('The ID of the project'),
      revision: z.string().describe('The revision to update (branch or tag name)').default('DEV').optional(),
      design: z.record(z.any()).describe('The project design object to save'),
      title: z.string().describe('A title for this configuration save operation'),
      previousSave: z.string().describe('The commit ID of the previous save (usually lastConfigFileCommitId from the design)').optional(),
      deletedElements: z.record(z.any()).describe('Map of deleted elements in the configuration').optional(),
      //projectMode: z.enum(['classical', 'regular']).describe('In can be classical or regular. Try with classical if you are not sure and if does not work try with regular.'),
    },
    async ({ projectId, revision = 'main', design, title, previousSave, deletedElements}): Promise<CallToolResult> => {
      try {
        // Call saveProjectConfigurations from designLib
        const result = await saveProjectConfigurations(
          client,
          projectId,
          revision,
          design as ProjectDesign,
          {
            title,
            previousSave,
            deletedElements,
          },
          // projectMode
        )
        
        return {
          content: [
            {
              type: 'text',
              text: `Successfully saved project design configuration for project ${projectId} (revision: ${revision}).
              
Commit ID: ${result.commitId || 'Not available'}
Title: ${title}`,
            },
          ],
        }
      } catch (error) {
        const err = error as Error
        return {
          content: [
            {
              type: 'text',
              text: `Error saving project design: ${err.message}`,
            },
          ],
        }
      }
    }
  )
}