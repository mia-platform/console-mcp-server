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

import path from 'node:path'

import { CallToolResult } from '@modelcontextprotocol/sdk/types.js'
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import { CatalogVersionedItem, ConfigMaps, ConfigServiceSecrets, constants, CustomService, EnvironmentVariablesTypes, ICatalogPlugin, ICatalogTemplate, IProject, Listeners } from '@mia-platform/console-types'

import { APIClient } from '../lib/client'
import { AppContext } from '../server/server'
import { ResourcesToCreate } from './configuration/types'
import { saveConfiguration } from './configuration/api'
import { getGitProviderProjectGroups, getProjectInfo } from './governance/apis/projects'
import { getMarketplaceItemVersionInfo, listMarketPlaceItemVersions } from './marketplace/api'
import { paramsDescriptions, toolNames, toolsDescriptions } from '../lib/descriptions'

const { ServiceTypes, DOCKER_IMAGE_NAME_SUGGESTION_TYPES } = constants

const createServiceRepository = (projectId: string) => {
  return `/api/backend/projects/${projectId}/service`
}

export function addServicesCapabilities (server: McpServer, appContext: AppContext) {
  const { client } = appContext
  server.tool(
    toolNames.CREATE_SERVICE_FROM_MARKETPLACE,
    toolsDescriptions.CREATE_SERVICE_FROM_MARKETPLACE,
    {
      projectId: z.string().describe(paramsDescriptions.PROJECT_ID),
      tenantId: z.string().describe(paramsDescriptions.TENANT_ID),
      name: z.string().describe(paramsDescriptions.SERVICE_NAME).regex(/^[a-z]([-a-z0-9]*[a-z0-9])?$/),
      description: z.string().optional().describe(paramsDescriptions.SERVICE_DESCRIPTION),
      refId: z.string().describe(paramsDescriptions.REF_ID),
      marketplaceItemId: z.string().describe(paramsDescriptions.MARKETPLACE_ITEM_ID),
      marketplaceItemTenantId: z.string().describe(paramsDescriptions.MARKETPLACE_ITEM_TENANT_ID),
      marketplaceItemVersion: z.string().optional().describe(paramsDescriptions.MARKETPLACE_ITEM_VERSION),
    },
    async (args): Promise<CallToolResult> => {
      try {
        const project = await getProjectInfo(client, args.projectId)

        const marketplaceItem = await getMarketplaceItem(client, args.marketplaceItemId, args.marketplaceItemTenantId, args.marketplaceItemVersion)
        const resourceToCreate = await createServiceFromMarkeplaceItem(
          client,
          project,
          marketplaceItem,
          args.name,
          args.description,
        )

        const response = await saveConfiguration(appContext, project._id, resourceToCreate, args.refId, {
          throwIfServiceAlreadyExists: true,
        })

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ response }),
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

async function createServiceFromMarkeplaceItem (
  client: APIClient,
  project: IProject,
  marketplaceItem: CatalogVersionedItem,
  name: string,
  description?: string,
): Promise<ResourcesToCreate> {
  let resourcesToCreate: ResourcesToCreate
  switch (marketplaceItem.type) {
  case 'plugin':
    resourcesToCreate = servicePayloadFromMarketplaceItem(marketplaceItem as ICatalogPlugin.Item, name, description)
    break
  case 'template':
    resourcesToCreate = await servicePayloadFromTemplate(client, marketplaceItem as ICatalogTemplate.Item, project, name, description)
    break
  default:
    throw new Error('TODO')
  }

  return resourcesToCreate
}

const DEFAULT_DOCUMENTATION_PATH = '/documentation/json'

export function servicePayloadFromMarketplaceItem (item: ICatalogPlugin.Item|ICatalogTemplate.Item, name: string, description?: string, dockerImageName?: string): ResourcesToCreate {
  const serviceToCreateItemKey = Object.keys(item.resources?.services || {})?.[0]
  if (!serviceToCreateItemKey) {
    throw new Error('No service found in the marketplace item')
  }

  const serviceToCreate = item.resources?.services?.[serviceToCreateItemKey]
  if (!serviceToCreate) {
    throw new Error('No service found in the marketplace item')
  }

  const {
    defaultEnvironmentVariables = [],
    defaultResources,
    dockerImage,
    defaultProbes,
    defaultTerminationGracePeriodSeconds,
    defaultMonitoring,
    defaultConfigMaps = [],
    defaultSecrets = [],
    defaultDocumentationPath,
    mapEnvVarToMountPath,
    componentId,
    containerPorts = [],
    defaultArgs,
    defaultLogParser = constants.MIA_LOG_PARSER_JSON,
  } = serviceToCreate
  const serviceAccountName = name
  let listenersToCreate: Listeners | undefined

  let service: CustomService = {
    name,
    type: ServiceTypes.CUSTOM,
    tags: [ ServiceTypes.CUSTOM ],
    description,
    advanced: false,
    sourceComponentId: componentId,
    dockerImage: dockerImageName || dockerImage || '',
    sourceMarketplaceItem: {
      itemId: item.itemId,
      tenantId: item.tenantId,
      version: item.version?.name || 'NA',
    },
    ...mapEnvVarToMountPath
      ? { mapEnvVarToMountPath }
      : {},
    environment: defaultEnvironmentVariables.map((env) => {
      switch (env.valueType) {
      case 'plain':
        return {
          ...env,
          value: env.value || '',
          valueType: EnvironmentVariablesTypes.PLAIN_TEXT,
        }
      case 'secret':
        return {
          ...env,
          valueType: EnvironmentVariablesTypes.FROM_SECRET,
        }
      case 'downwardAPI':
        return {
          ...env,
          valueType: EnvironmentVariablesTypes.DOWNWARD_API,
        }
      }
    }),
    logParser: defaultLogParser,
    resources: defaultResources,
    probes: defaultProbes,
    serviceAccountName,
    ...defaultMonitoring
      ? { monitoring: defaultMonitoring }
      : {},
    terminationGracePeriodSeconds: defaultTerminationGracePeriodSeconds,
    replicas: 1,
    swaggerPath: defaultDocumentationPath !== ''
      ? defaultDocumentationPath || DEFAULT_DOCUMENTATION_PATH
      : '',
    ...defaultConfigMaps.length > 0
      ? { configMaps: defaultConfigMaps.map((configMap) => {
        const { name, usePreserve, mountPath, viewAsReadOnly, link, files } = configMap
        if (!usePreserve) {
          return { name, mountPath, viewAsReadOnly, link }
        }

        const subPaths = files.
          filter((file) => !file.deleted).
          map((file) => file.name)

        return { name, mountPath, viewAsReadOnly, link, subPaths }
      }) }
      : {},
    ...defaultSecrets.length > 0
      ? { secrets: defaultSecrets.map((config) => {
        const { name, mountPath } = config
        return { name, mountPath }
      }) }
      : {},
    containerPorts,
  }

  if (item.type === 'plugin') {
    const {
      links,
      tags,
      execPreStop,
      args,
      additionalContainers,
    } = serviceToCreate as ICatalogPlugin.Resources['services'][string]
    listenersToCreate = item.resources?.listeners

    service = {
      ...service,
      links,
      ...tags && { tags },
      ...execPreStop && { execPreStop },
      ...args && { args },
      ...additionalContainers && { additionalContainers: additionalContainers.map((container) => {
        const {
          args,
          containerPorts,
          defaultArgs,
          defaultEnvironmentVariables,
          defaultProbes,
          defaultResources,
          description,
          dockerImage,
          name,
        } = container
        return {
          name,
          dockerImage,
          ...description && { description },
          ...args && { args },
          ...defaultArgs && { args: defaultArgs },
          ...containerPorts && { containerPorts },
          ...defaultResources && { resources: defaultResources },
          ...defaultProbes && { probes: defaultProbes },
          environment: defaultEnvironmentVariables?.map((env) => ({
            ...env,
            value: env.value || '',
            valueType: EnvironmentVariablesTypes.PLAIN_TEXT,
          })),
        }
      }) },
    }
  }

  service = {
    ...service,
    ...defaultArgs && { args: defaultArgs },
  }

  const createdConfigMaps: ConfigMaps = defaultConfigMaps.reduce((acc, configMap) => {
    return {
      ...acc,
      [configMap.name]: {
        name: configMap.name,
        files: configMap.files.map((file) => ({
          name: file.name,
          content: file.content,
        })),
      },
    }
  }, {} as ConfigMaps)

  const createdSecrets = defaultSecrets.reduce((acc, secret) => {
    return {
      ...acc,
      [secret.name]: {
        name: secret.name,
      },
    }
  }, {} as ConfigServiceSecrets)

  return {
    services: {
      [name]: service,
    },
    serviceAccounts: {
      [serviceAccountName]: { name: serviceAccountName },
    },
    configMaps: createdConfigMaps,
    serviceSecrets: createdSecrets,
    listeners: listenersToCreate,
  }
}

export async function servicePayloadFromTemplate (
  client: APIClient,
  item: ICatalogTemplate.Item,
  project: IProject,
  name: string,
  description?: string,
): Promise<ResourcesToCreate> {
  const serviceToCreateItemKey = Object.keys(item.resources?.services || {})?.[0]
  if (!serviceToCreateItemKey) {
    throw new Error('No service found in the marketplace item')
  }

  const serviceToCreate = item.resources?.services?.[serviceToCreateItemKey]
  if (!serviceToCreate) {
    throw new Error('No service found in the marketplace item')
  }

  const projectGroups = await getGitProviderProjectGroups(client, project._id, path.dirname(project.configurationGitPath))

  let groupName: string | undefined
  if (projectGroups.length === 1) {
    groupName = projectGroups[0]['full_path'] as string
  } else {
    for (const projectGroup of projectGroups) {
      if ((projectGroup['full_path'] as string).endsWith('/services')) {
        groupName = projectGroup['full_path'] as string
        break
      }
    }
  }

  if (!groupName) {
    throw new Error('No group found for the project')
  }

  const projectProviderType = project.pipelines?.type
  if (!projectProviderType) {
    throw new Error('No provider type found for the project')
  }

  let pipeline: string | undefined
  if (serviceToCreate.pipelines) {
    if (projectProviderType in serviceToCreate.pipelines) {
      pipeline = projectProviderType
    }
  }

  const imageName = generateImageName(name, project, groupName)
  const containerRegistryId = project.containerRegistries?.filter((registry) => registry.isDefault)[0]?.id

  const createServiceRepositoryBody = {
    serviceName: name,
    resourceName: serviceToCreateItemKey,
    groupName,
    ...description && { serviceDescription: description },
    templateId: item._id,
    defaultConfigMaps: serviceToCreate.defaultConfigMaps,
    defaultSecrets: serviceToCreate.defaultSecrets,
    repoName: name,
    pipeline,
    imageName,
    containerRegistryId,
  }

  const createdService = await client.post<Record<string, unknown>>(createServiceRepository(project._id), createServiceRepositoryBody)
  return servicePayloadFromMarketplaceItem(item, name, description, createdService['dockerImage'] as string)
}

function generateImageName (name: string, project: IProject, groupName: string): string {
  if (project.dockerImageNameSuggestion) {
    switch (project.dockerImageNameSuggestion.type) {
    case DOCKER_IMAGE_NAME_SUGGESTION_TYPES.PROJECT_ID:
      return `${project.projectId}/${name}`
    case DOCKER_IMAGE_NAME_SUGGESTION_TYPES.REPOSITORY:
      return `${groupName}/${name}`
    case DOCKER_IMAGE_NAME_SUGGESTION_TYPES.CONSTANT_PREFIX:
      return `${(project.dockerImageNameSuggestion as DockerSuggestionPrefix).prefix}/${name}`
    }
  }

  return name
}

interface DockerSuggestionPrefix {
  prefix: string
}
