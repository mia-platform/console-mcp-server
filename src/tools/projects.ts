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
const projectRevisionsPath = '/api/backend/projects/{projectId}/revisions'
const projectVersionsPath = '/api/backend/projects/{projectId}/versions'
const projectPodsPath = '/api/projects/{projectId}/environments/{envId}/pods/describe/'
const projectContainerLogsPath = '/api/projects/{projectId}/environments/{envId}/pods/{podName}/containers/{containerName}/logs'
const providersPath = '/api/backend/tenants/{tenantId}/providers/'
const projectBlueprintPath = '/api/backend/tenants/{tenantId}/project-blueprint/'

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

// Interface for provider response
interface Provider {
  _id: string
  providerId: string
  type: string
  label: string
  description?: string
  urls: {
    base: string
    apiBase: string
  }
  credentials: {
    type: string
  }
  capabilities: Array<{
    name: string
    functionalities?: Array<{
      name: string
    }>
    repositoryPathTemplate?: string
  }>
}

// Interfaces for project blueprint response
interface Host {
  host: string
  isBackoffice: boolean
  scheme: string
}

interface Cluster {
  namespace: string
  clusterId: string
  kubeContextVariables?: {
    [key: string]: string
  }
}

interface Environment {
  envId: string
  label: string
  hosts: Host[]
  isProduction: boolean
  cluster: Cluster
}

interface ContainerRegistry {
  id: string
  name: string
  hostname: string
  imagePullSecretName?: string
  isDefault: boolean
}

interface SecurityFeatures {
  seccompProfile: boolean
  appArmor: boolean
  hostProperties: boolean
  privilegedPod: boolean
}

interface DashboardCategory {
  label: string
}

interface Dashboard {
  id: string
  label: string
  url: string
  type: string
  category: DashboardCategory
}

interface Deploy {
  runnerTool: string
  useMiaPrefixEnvs?: boolean
  projectStructure?: string
  strategy: string
}

interface Template {
  templateId: string
  name: string
  _id: string
  tenantId: string
  description?: string
  archiveUrl: string
  deploy: Deploy
  dashboards: Dashboard[]
  enabledServices: {
    [key: string]: boolean
  }
  staticSecret: Record<string, unknown>
}

interface ProjectBlueprint {
  tenantId: string
  name: string
  environments: Environment[]
  availableNamespaces: any[]
  environmentsVariables: {
    type: string
    providerId: string
  }
  pipelines: {
    providerId: string
    type: string
  }
  defaultTemplateId: string
  repository: {
    type: string
    providerId: string
    basePath: string
    visibility: string
  }
  containerRegistries: ContainerRegistry[]
  enabledSecurityFeatures: SecurityFeatures
  templates: Template[]
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
            ProjectId: ${project._id}
            ProjectSlug: ${project.projectId}
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
  
  // Tool: Create Project
  server.tool(
    // TODO: Qui devo verificare di popolare in modo corretto tuti i parametri.
    // non serve che siano passati tutti da fuori, alcuni sono da calcolare da codcie come il projectId
    // e il gitrepo url
    // verificare che passi il base64 del cluster
    'create-project',
    'Create a new Mia project in Mia-Platform Console using the preffered project blueprint and envrionment. You need to provide the project name, description, flavor, tenant ID, and environments. That information are available in the project blueprint, in providers. Verify to that information before creating a project.',
    {
      name: z.string().describe('The name of the project'),
      description: z.string().optional().describe('The description of the project'),
      flavor: z.string().describe('The flavor of the project, e.g. "application"'),
      tenantId: z.string().describe('The tenant ID to which the project belongs'),
      environments: z.array(z.object({
        envId: z.string().describe('The environment ID, e.g. "DEV", "PROD"'),
        label: z.string().describe('The label of the environment'),
        isProduction: z.boolean().describe('Whether this is a production environment'),
        cluster: z.object({
          hostname: z.string().optional().describe('The hostname of the cluster'),
          namespace: z.string().optional().describe('The namespace in the cluster'),
          clusterId: z.string().optional().describe('The ID of the cluster')
        })
      })),
      enabledServices: z.record(z.boolean()).optional().describe('Services to enable for the project'),
      configurationGitPath: z.string().optional().describe('Git path for configuration'),
      templateId: z.string().optional().describe('The template ID to use for the project'),
      providerId: z.string().optional().describe('The provider ID for the repository')
    },
    async ({ 
      name, 
      description, 
      flavor, 
      tenantId, 
      environments, 
      enabledServices,
      configurationGitPath,
      templateId,
      providerId 
    }): Promise<CallToolResult> => {
      try {

        const projectId = name.toLowerCase().replace(/\s+/g, '-')

        // Construct the request payload
        const projectData: Record<string, unknown> = {
          name: name,
          projectId: projectId,
          description: description || '',
          flavor: flavor || 'application',
          tenantId: tenantId,
          environments: environments || [],
          enabledServices: enabledServices || {},
          configurationGitPath: configurationGitPath || '',
          templateId: templateId || '',
          visibility: 'internal',
          providerId: providerId || '',
        }
        
        // Make the POST request
        const data = await client.post<Project>(projectsPath, projectData)
        
        // Format the response
        const formattedProject = `Project successfully created:
          Project: ${data.name}
          ProjectId: ${data._id}
          ProjectSlug: ${data.projectId}
          Description: ${data.description || 'N/A'}
          Tenant ID: ${data.tenantId}
          Tenant Name: ${data.tenantName || 'N/A'}
          Default Branch: ${data.defaultBranch || 'N/A'}
          Configuration Git Path: ${data.configurationGitPath || 'N/A'}
          Environments: ${data.environments.map((env: any) => env.label).join(', ') || 'N/A'}`
        
        return {
          content: [
            {
              type: 'text',
              text: formattedProject,
            },
          ],
        }
      } catch (error) {
        const err = error as Error
        return {
          content: [
            {
              type: 'text',
              text: `Error creating project: ${err.message}`,
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
      projectId: z.string().describe('The ProjectId of the project')
    },
    async ({ projectId }): Promise<CallToolResult> => {
      try {
        const path = projectPath.replace('{projectId}', projectId)
        const data = await client.get<Project>(path)
        const formattedProject = `Project: ${data.name}
          ProjectId: ${data._id}
          ProjectSlug: ${data.projectId}
          Description: ${data.description || 'N/A'}
          Project Owner: ${data.info?.projectOwner || 'N/A'}
          Team Contact: ${data.info?.teamContact || 'N/A'}
          Tenant ID: ${data.tenantId}
          Tenant Name: ${data.tenantName}
          Default Branch: ${data.defaultBranch || 'N/A'}
          Configuration Git Path: ${data.configurationGitPath || 'N/A'}
          Configuration Management: ${data.configurationManagement?.saveMessageOptions?.isConfirmationRequired?.value || 'N/A'}
          Deploy Runner Tool: ${data.deploy?.runnerTool || 'N/A'}
          Deploy Strategy: ${data.deploy?.strategy || 'N/A'}
          Docker Image Name Suggestion: ${data.dockerImageNameSuggestion?.type || 'N/A'}
          Environments: ${data.environments.map(env => env.label).join(', ')}
          Environments Variables: ${data.environmentsVariables?.baseUrl || 'N/A'}
          Flavor: ${data.flavor || 'N/A'}
          Monitoring Systems: ${data.monitoring?.systems?.map(system => system.type).join(', ') || 'N/A'}
          Pipelines Provider ID: ${data.pipelines?.providerId || 'N/A'}
          Repository Provider ID: ${data.repository?.providerId || 'N/A'}
          Project Namespace Variable: ${data.projectNamespaceVariable || 'N/A'}
          Enabled Services: ${Object.entries(data.enabledServices || {}).map(([key, value]) => `${key}: ${value}`).join(', ') || 'N/A'}
          Enabled Security Features: ${Object.entries(data.enabledSecurityFeatures || {}).map(([key, value]) => `${key}: ${value}`).join(', ') || 'N/A'}`;      
        return {
          content: [
            {
              type: 'text',
              text: formattedProject,
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

  // Tool 9: Get Project Revisions
  server.tool(
    'get-project-revisions',
    'Get list of available Git branches/revisions for a project',
    {
      projectId: z.string().describe('The ProjectId of the project')
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
      projectId: z.string().describe('The ProjectId of the project')
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
      projectId: z.string().describe('The ProjectId of the project'),
      envId: z.string().describe('The environment ID (e.g., "DEV", "PROD")')
    },
    async ({ projectId, envId }): Promise<CallToolResult> => {
      try {
        const apiPath = projectPodsPath
          .replace('{projectId}', projectId)
          .replace('{envId}', envId)
        const data = await client.get(apiPath)

        // Format each pod to show its properties in a readable format
        const formattedPods = (data as any[]).map(pod => {
          return `Pod: ${pod.name}
          Namespace: ${pod.namespace || 'N/A'}
          Status: ${pod.status || 'N/A'}
          Phase: ${pod.phase || 'N/A'}
          Node: ${pod.node || 'N/A'}
          QoSClass: ${pod.qosClass || 'N/A'}
          Start Time: ${pod.startTime || 'N/A'}
          Components: ${pod.component?.map((c: any) => `${c.name}:${c.version}`).join(', ') || 'N/A'}
          Labels: ${Object.entries(pod.labels || {}).map(([key, value]) => `${key}: ${value}`).join(', ') || 'N/A'}
          Containers: ${pod.containers?.map((container: any) => 
            `\n            - Name: ${container.name}
            - Image: ${container.image}
            - Status: ${container.status || 'N/A'}
            - Ready: ${container.ready || false}
            - Started: ${container.started || 'N/A'}
            - RestartCount: ${container.restartCount || 0}
            - Resources: ${JSON.stringify(container.resources || {})}`
          ).join('\n          ') || 'N/A'}`;
        }).join('\n\n');
        
        return {
          content: [
            {
              type: 'text',
              text: formattedPods,
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
      projectId: z.string().describe('The ProjectId of the project'),
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

  // Tool: Get Providers
  server.tool(
    'get-providers',
    'Get list of available providers for a tenant',
    {
      tenantId: z.string().describe('The ID of the tenant for which to fetch providers')
    },
    async ({ tenantId }): Promise<CallToolResult> => {
      try {
        const apiPath = providersPath.replace('{tenantId}', tenantId)
        const data = await client.get<Provider[]>(apiPath)
        
        // Format each provider to show its properties in a readable format
        const formattedProviders = data.map(provider => {
          return `Provider: ${provider.label}
            Provider ID: ${provider.providerId}
            Type: ${provider.type}
            Description: ${provider.description || 'N/A'}
            URL Base: ${provider.urls.base}
            API Base: ${provider.urls.apiBase}
            Credentials Type: ${provider.credentials.type}
            Capabilities: ${provider.capabilities.map(cap => {
              const functionalitiesStr = cap.functionalities ? 
                ` (Functionalities: ${cap.functionalities.map(f => f.name).join(', ')})` : '';
              return `${cap.name}${functionalitiesStr}`;
            }).join(', ')}
            ${provider.capabilities.some(cap => cap.repositoryPathTemplate) ? 
              `Repository Path Template: ${provider.capabilities.find(cap => cap.repositoryPathTemplate)?.repositoryPathTemplate}` : ''}`;
        }).join('\n\n');
        
        return {
          content: [
            {
              type: 'text',
              text: formattedProviders,
            },
          ],
        }
      } catch (error) {
        const err = error as Error
        return {
          content: [
            {
              type: 'text',
              text: `Error fetching providers for tenant ${tenantId}: ${err.message}`,
            },
          ],
        }
      }
    }
  )

  // Tool: Get Project Blueprint
  server.tool(
    'get-project-blueprint',
    'Get project templates, available environments, and configuration information for a tenant',
    {
      tenantId: z.string().describe('The ID of the tenant for which to fetch the project blueprint')
    },
    async ({ tenantId }): Promise<CallToolResult> => {
      try {
        const apiPath = projectBlueprintPath.replace('{tenantId}', tenantId)
        const data = await client.get<ProjectBlueprint>(apiPath)
        
        // Format the blueprint information in a readable way
        let formattedBlueprint = `Blueprint Name: ${data.name}
Tenant ID: ${data.tenantId}
Default Template ID: ${data.defaultTemplateId}

Repository Configuration:
  Type: ${data.repository.type}
  Provider ID: ${data.repository.providerId}
  Base Path: ${data.repository.basePath}
  Visibility: ${data.repository.visibility}

Pipeline Configuration:
  Type: ${data.pipelines.type}
  Provider ID: ${data.pipelines.providerId}

Environment Variables Configuration:
  Type: ${data.environmentsVariables.type}
  Provider ID: ${data.environmentsVariables.providerId}

Environments:`;

        // Format environments
        data.environments.forEach(env => {
          formattedBlueprint += `\n\n  Environment: ${env.label} (${env.envId})
  Production: ${env.isProduction}
  Cluster:
    Namespace: ${env.cluster.namespace}
    Cluster ID: ${env.cluster.clusterId}
  Hosts:`;
          
          env.hosts.forEach(host => {
            formattedBlueprint += `\n    - ${host.scheme}://${host.host}${host.isBackoffice ? ' (Backoffice)' : ''}`;
          });
        });

        // Format container registries
        formattedBlueprint += `\n\nContainer Registries:`;
        data.containerRegistries.forEach(registry => {
          formattedBlueprint += `\n  - ${registry.name} (${registry.hostname})${registry.isDefault ? ' (Default)' : ''}`;
        });

        // Format security features
        formattedBlueprint += `\n\nEnabled Security Features:
  Seccomp Profile: ${data.enabledSecurityFeatures.seccompProfile}
  App Armor: ${data.enabledSecurityFeatures.appArmor}
  Host Properties: ${data.enabledSecurityFeatures.hostProperties}
  Privileged Pod: ${data.enabledSecurityFeatures.privilegedPod}`;

        // Format templates
        formattedBlueprint += `\n\nAvailable Templates (${data.templates.length}):`;
        data.templates.forEach(template => {
          formattedBlueprint += `\n\n  Template: ${template.name}
  Template ID: ${template.templateId}
  Description: ${template.description || 'N/A'}
  Deployment:
    Runner Tool: ${template.deploy.runnerTool}
    Strategy: ${template.deploy.strategy}${template.deploy.projectStructure ? '\n    Project Structure: ' + template.deploy.projectStructure : ''}`;
        });
        
        return {
          content: [
            {
              type: 'text',
              text: formattedBlueprint,
            },
          ],
        }
      } catch (error) {
        const err = error as Error
        return {
          content: [
            {
              type: 'text',
              text: `Error fetching project blueprint for tenant ${tenantId}: ${err.message}`,
            },
          ],
        }
      }
    }
  )
}
