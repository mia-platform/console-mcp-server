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
import { pick } from 'ramda'
import { z } from 'zod'
import { CatalogVersionedItem, ConfigMap, ConfigMaps, constants, CustomService, EnvironmentVariablesTypes, ICatalogPlugin, IProject } from '@mia-platform/console-types'

import { APIClient } from '../lib/client'
import { getProjectInfo } from './projects'
import { NewServicePayload } from '../types/new_service_payload'
import { getMarketplaceItemVersionInfo, listMarketPlaceItemVersions } from './marketplace'
import { paramsDescriptions, toolsDescriptions } from '../lib/descriptions'

const { ServiceTypes } = constants

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
        const service = await createServiceFromMarkeplaceItem(
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

async function createServiceFromMarkeplaceItem (
  client: APIClient,
  project: IProject,
  marketplaceItem: CatalogVersionedItem,
  name: string,
  environmentId?: string,
  description?: string,
) {
  let consolidatedEnvironmentId: string
  if (environmentId) {
    consolidatedEnvironmentId = environmentId
  } else if (project.defaultBranch) {
    consolidatedEnvironmentId = project.defaultBranch
  } else {
    throw new Error('No environmentId provided and no default branch found in the project')
  }

  let newServicePayload: NewServicePayload
  switch (marketplaceItem.type) {
  case 'plugin':
    newServicePayload = servicePayloadFromMarketplaceItem(marketplaceItem, project, name, description)
    break
  default:
    throw new Error('TODO')
  }
}

const DEFAULT_DOCUMENTATION_PATH = '/documentation/json'


export function servicePayloadFromMarketplaceItem (item: ICatalogPlugin.Item, project: IProject, name: string, description?: string): NewServicePayload {
  const serviceToCreateItemKey = Object.keys(item.resources?.services || {})?.[0]
  if (!serviceToCreateItemKey) {
    throw new Error('No service found in the marketplace item')
  }

  const serviceToCreate = item.resources?.services?.[serviceToCreateItemKey]
  if (!serviceToCreate) {
    throw new Error('No service found in the marketplace item')
  }

  const serviceAccountName = name

  const {
    links,
    defaultEnvironmentVariables = [],
    defaultResources,
    dockerImage,
    defaultProbes,
    defaultTerminationGracePeriodSeconds,
    defaultMonitoring,
    defaultConfigMaps = [],
    // defaultSecrets: defaultSecretsFromTemplate = [],
    defaultDocumentationPath,
    tags,
    mapEnvVarToMountPath,
    componentId,
    containerPorts = [],
    // additionalContainers,
    execPreStop,
    args,
    defaultLogParser = constants.MIA_LOG_PARSER_JSON,
    // listeners: newListeners,
  } = serviceToCreate

  const service: CustomService = {
    name,
    type: ServiceTypes.CUSTOM,
    tags: tags || [ ServiceTypes.CUSTOM ],
    advanced: false,
    sourceComponentId: componentId,
    dockerImage,
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
    links,
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
        const configMapFields = [ 'name', 'mountPath', 'viewAsReadOnly', 'link' ]

        const { usePreserve } = configMap
        if (!usePreserve) {
          return pick(configMapFields, configMap as Record<string, unknown>) as unknown as ConfigMap
        }

        const subPaths = configMap.files.
          filter((file) => !file.deleted).
          map((file) => file.name)
        return {
          ...pick(configMapFields, configMap as Record<string, unknown>),
          subPaths,
        } as unknown as ConfigMap
      }) }
      : {},
    // ...defaultSecretsFromTemplate.length > 0
    //   ? { secrets: defaultSecretsFromTemplate.map((config) => pick([ 'name', 'mountPath' ], config)) }
    //   : {},
    containerPorts,
    ...execPreStop
      ? { execPreStop }
      : {},
    ...args
      ? { args }
      : {},
    // ...additionalContainers
    //   ? { additionalContainers: additionalContainers.map((container) => ({
    //     ...omit([
    //       'repositoryUrl',
    //       'defaultEnvironmentVariables',
    //       'defaultArgs',
    //       'defaultMonitoring',
    //       'defaultProbes',
    //       'defaultConfigMaps',
    //       'defaultSecrets',
    //       'defaultDocumentationPath',
    //       'defaultResources',
    //     ], container),
    //     ...container.repositoryUrl
    //       ? { repoUrl: container.repositoryUrl }
    //       : {},
    //     ...container.defaultEnvironmentVariables
    //       ? { environment: container.defaultEnvironmentVariables }
    //       : {},
    //     ...container.defaultArgs
    //       ? { args: container.defaultArgs }
    //       : {},
    //     ...container.defaultMonitoring
    //       ? { args: container.defaultMonitoring }
    //       : {},
    //     ...container.defaultResources
    //       ? { resources: container.defaultResources }
    //       : {},
    //     ...container.defaultProbes
    //       ? { probes: container.defaultProbes }
    //       : {},
    //     ...container.defaultConfigMaps
    //       ? { configMaps: container.defaultConfigMaps }
    //       : {},
    //   })) }
    // : {},
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

  return {
    services: {
      [name]: service,
    },
    serviceAccounts: {
      [serviceAccountName]: { name: serviceAccountName },
    },
    configMaps: createdConfigMaps,
  }
}
