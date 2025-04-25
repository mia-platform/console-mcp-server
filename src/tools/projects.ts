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
const projectsPath = '/api/backend/projects/'
const projectPath = '/api/backend/projects/{projectId}'
const projectStatusPath = '/api/projects/{projectId}/status/'
const projectRevisionsPath = '/api/backend/projects/{projectId}/revisions'
const projectVersionsPath = '/api/backend/projects/{projectId}/versions'
const projectPodsPath = '/api/projects/{projectId}/environments/{envId}/pods/describe/'
const projectContainerLogsPath = '/api/projects/{projectId}/environments/{envId}/pods/{podName}/containers/{containerName}/logs'

 // Interface for project response
interface Project {
  _id: string
  projectId: string
  name: string
  description?: string
  tenantId: string
  tenantName: string
  availableNamespaces?: any[]
  configurationGitPath?: string
  configurationManagement?: {
    saveMessageOptions?: {
      isConfirmationRequired?: {
        value: boolean
      }
    }
  }
  defaultBranch?: string
  deploy?: {
    runnerTool?: string
    strategy?: string
    useMiaPrefixEnvs?: boolean
  }
  dockerImageNameSuggestion?: {
    type: string
  }
  enabledSecurityFeatures?: {
    appArmor?: boolean
    hostProperties?: boolean
    privilegedPod?: boolean
    seccompProfile?: boolean
  }
  enabledServices?: Record<string, boolean>
  environments: Array<{
    envId: string
    envPrefix?: string
    label: string
    isProduction: boolean
    type?: string
    cluster?: {
      clusterId: string
      namespace: string
    }
    dashboards?: any[]
    deploy?: {
      providerId?: string
      runnerTool?: string
      strategy?: string
      type?: string
    }
    hosts?: Array<{
      host: string
      scheme: string
      isBackoffice?: boolean
    }>
    links?: any[]
  }>
  environmentsVariables?: {
    baseUrl?: string
    providerId?: string
    storage?: {
      path?: string
      type?: string
    }
    type?: string
  }
  flavor?: string
  info?: {
    projectOwner?: string
    teamContact?: string
  }
  logicalScopeLayers?: any[]
  monitoring?: {
    systems?: Array<{
      type: string
    }>
  }
  pipelines?: {
    providerId?: string
    type?: string
  }
  projectNamespaceVariable?: string
  repository?: {
    providerId: string
  }
}

// Interface for project response
interface ProjectSummary {
  _id: string
  projectId: string
  name: string
  description?: string
  tenantId: string
  tenantName: string
  info?: {
    projectOwner?: string
    teamContact?: string
  }
}

/**
 * Register project-related tools with the MCP server
 * 
 * @param server - The MCP Server instance
 * @param client - The API client
 * @returns void
 */
export function projectsTools(server: McpServer, client: APIClient) {
  // Tool 2: List Projects
  server.tool(
    'get-projects',
    'List all projects accessible to the authenticated user',
    {},
    async (): Promise<CallToolResult> => {
      try {
        
        const data = await client.get<ProjectSummary[]>(projectsPath)
        // Format each project to show only its properties
        const formattedProjects = data.map(project => {
          return `Project: ${project.name}
        ID: ${project.projectId}
        _id: ${project._id}
        Description: ${project.description || 'N/A'}
        Project Owner: ${project.info?.projectOwner || 'N/A'}
        Team Contact: ${project.info?.teamContact || 'N/A'}
        Tenant ID: ${project.tenantId}
        Tenant Name: ${project.tenantName}`;
        }).join('\n\n');
        
        return {
          content: [
            {
              type: 'text',
              text: formattedProjects,
            },
          ],
        }
      } catch (error) {
        const err = error as Error
        return {
          content: [
            {
              type: 'text',
              text: `Error fetching projects: ${err.message}`,
            },
          ],
        }
      }
    }
  )

  server.tool(
    'get-project-info',
    'Provide all information about a single project',
    {
      projectId: z.string().describe('The ID of the project')
    },
    async ({ projectId }): Promise<CallToolResult> => {
      try {
        const path = projectPath.replace('{projectId}', projectId)
        const data = await client.get<Project>(path)
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
              text: `Error fetching projects: ${err.message}`,
            },
          ],
        }
      }
    }
  )

  // Tool 8: Get Project Status
  server.tool(
    'project-status',
    'Get the aggregated status for each environment within a specified project',
    {
      projectId: z.string().describe('The ID of the project')
    },
    async ({ projectId }): Promise<CallToolResult> => {
      try {
        const apiPath = projectStatusPath.replace('{projectId}', projectId)
        const data = await client.get(apiPath)
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
              text: `Error fetching project status for project ${projectId}: ${err.message}`,
            },
          ],
        }
      }
    }
  )

  // Tool 9: Get Project Revisions
  server.tool(
    'get-project-revisions',
    'Get list of available Git branches/revisions for a project',
    {
      projectId: z.string().describe('The ID of the project')
    },
    async ({ projectId }): Promise<CallToolResult> => {
      try {
        const apiPath = projectRevisionsPath.replace('{projectId}', projectId)
        const data = await client.get(apiPath)
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
              text: `Error fetching revisions for project ${projectId}: ${err.message}`,
            },
          ],
        }
      }
    }
  )

  // Tool 10: Get Project Versions
  server.tool(
    'get-project-versions',
    'Get list of tagged versions from a project\'s repository',
    {
      projectId: z.string().describe('The ID of the project')
    },
    async ({ projectId }): Promise<CallToolResult> => {
      try {
        const apiPath = projectVersionsPath.replace('{projectId}', projectId)
        const data = await client.get(apiPath)
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
              text: `Error fetching versions for project ${projectId}: ${err.message}`,
            },
          ],
        }
      }
    }
  )

  // Tool 11: Describe Environment Pods
  server.tool(
    'describe-environment-pods',
    'Get detailed pod descriptions for a project environment',
    {
      projectId: z.string().describe('The ID of the project'),
      envId: z.string().describe('The environment ID (e.g., "DEV", "PROD")')
    },
    async ({ projectId, envId }): Promise<CallToolResult> => {
      try {
        const apiPath = projectPodsPath
          .replace('{projectId}', projectId)
          .replace('{envId}', envId)
        const data = await client.get(apiPath)
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
              text: `Error fetching pod descriptions for project ${projectId} in environment ${envId}: ${err.message}`,
            },
          ],
        }
      }
    }
  )

  // Tool 12: Get Container Logs
  server.tool(
    'get-container-logs',
    'Get logs for a specific container within a pod',
    {
      projectId: z.string().describe('The ID of the project'),
      envId: z.string().describe('The environment ID'),
      podName: z.string().describe('The name of the pod'),
      containerName: z.string().describe('The name of the container within the pod'),
      follow: z.boolean().optional().describe('Stream logs continuously'),
      tailLines: z.number().optional().describe('Number of lines to fetch from the end'),
      previous: z.boolean().optional().describe('Fetch logs from the previous instance of the container')
    },
    async ({ projectId, envId, podName, containerName, follow, tailLines, previous }): Promise<CallToolResult> => {
      try {
        let apiPath = projectContainerLogsPath
          .replace('{projectId}', projectId)
          .replace('{envId}', envId)
          .replace('{podName}', podName)
          .replace('{containerName}', containerName)
        
        const params = new URLSearchParams()
        if (follow !== undefined) params.set('follow', follow.toString())
        if (tailLines !== undefined) params.set('tailLines', tailLines.toString())
        if (previous !== undefined) params.set('previous', previous.toString())
        
        // Add formatting options for better readability
        params.set('wrapHtml', 'true')
        params.set('pretty', 'true')
        
        const data = await client.get(apiPath, {}, params, 'text')
        return {
          content: [
            {
              type: 'text',
              text: data as string,
            },
          ],
        }
      } catch (error) {
        const err = error as Error
        return {
          content: [
            {
              type: 'text',
              text: `Error fetching logs for container ${containerName} in pod ${podName} for project ${projectId} in environment ${envId}: ${err.message}`,
            },
          ],
        }
      }
    }
  )
}
