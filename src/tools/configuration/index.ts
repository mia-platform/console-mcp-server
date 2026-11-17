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

import { CallToolResult } from '@modelcontextprotocol/sdk/types'
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp'
import { z } from 'zod'
import { Collections, ConfigMaps, ServiceAccounts, Services } from '@mia-platform/console-types'

import { assertAiFeaturesEnabledForProject } from '../utils/validations'
import { IAPIClient, PUBLIC_VARIABLE_NAME_REGEX, validatePublicVariablesChanges } from '../../apis/client'
import { paramsDescriptions, toolNames, toolsDescriptions } from '../descriptions'
import { PublicVariablesChanges, ResourcesToCreate } from '../../apis/types/configuration'

// Same pattern the Console API enforces on version (tag) names.
const VERSION_NAME_PATTERN = /^[\w.{}-]+$/

const publicVariableNameError = `must start with an uppercase letter and contain only uppercase letters, digits and underscores (${PUBLIC_VARIABLE_NAME_REGEX.source})`

export function addConfigurationCapabilities (server: McpServer, client: IAPIClient) {
  server.tool(
    toolNames.LIST_CONFIGURATION_REVISIONS,
    toolsDescriptions.LIST_CONFIGURATION_REVISIONS,
    {
      projectId: z.string().describe(paramsDescriptions.PROJECT_ID),
    },
    async ({ projectId }): Promise<CallToolResult> => {
      try {
        const project = await client.projectInfo(projectId)
        await assertAiFeaturesEnabledForProject(client, project)

        const revisions = await client.getConfigurationRevisions(projectId)
        return {
          structuredContent: revisions,
          content: [
            {
              type: 'text',
              text: JSON.stringify(revisions),
            },
          ],
        }
      } catch (error) {
        const err = error as Error
        return {
          isError: true,
          content: [
            {
              type: 'text',
              text: `Error fetching revisions or versions: ${err.message}`,
            },
          ],
        }
      }
    },
  )

  server.tool(
    toolNames.GET_CONFIGURATION,
    toolsDescriptions.GET_CONFIGURATION,
    {
      projectId: z.string().describe(paramsDescriptions.PROJECT_ID),
      refId: z.string().describe(paramsDescriptions.REF_ID),
      refType: z.enum([ 'revision', 'version' ]).optional().default('revision').describe(paramsDescriptions.REF_TYPE),
    },
    async ({ projectId, refId, refType }): Promise<CallToolResult> => {
      try {
        const project = await client.projectInfo(projectId)
        await assertAiFeaturesEnabledForProject(client, project)

        const backendRefType = refType === 'version'
          ? 'versions'
          : 'revisions'
        const config = await client.getConfiguration(projectId, refId, backendRefType)
        return {
          structuredContent: config,
          content: [
            {
              type: 'text',
              text: JSON.stringify(config),
            },
          ],
        }
      } catch (error) {
        const err = error as Error
        return {
          isError: true,
          content: [
            {
              type: 'text',
              text: `Error fetching configuration: ${err.message}`,
            },
          ],
        }
      }
    },
  )

  server.tool(
    toolNames.CONFIGURATION_TO_SAVE,
    toolsDescriptions.CONFIGURATION_TO_SAVE,
    {
      projectId: z.string().describe(paramsDescriptions.PROJECT_ID),
      refId: z.string().describe(paramsDescriptions.REF_ID),
      services: z.record(z.string(), z.unknown()).optional().describe(paramsDescriptions.SERVICES),
      configMaps: z.record(z.string(), z.unknown()).optional().describe(paramsDescriptions.CONFIG_MAPS),
      serviceAccounts: z.record(z.string(), z.unknown()).optional().describe(paramsDescriptions.SERVICE_ACCOUNTS),
    },
    async ({ projectId, refId, services, configMaps, serviceAccounts }): Promise<CallToolResult> => {
      try {
        const project = await client.projectInfo(projectId)
        await assertAiFeaturesEnabledForProject(client, project)

        const resourcesToCreate: ResourcesToCreate = {
          services: services as Services,
          configMaps: configMaps as ConfigMaps,
          serviceAccounts: serviceAccounts as ServiceAccounts,
        }
        await client.saveConfiguration(projectId, refId, resourcesToCreate)
        return {
          content: [
            {
              type: 'text',
              text: `Configuration saved successfully.`,
            },
          ],
        }
      } catch (error) {
        const err = error as Error
        return {
          isError: true,
          content: [
            {
              type: 'text',
              text: `Error saving configuration: ${err.message}`,
            },
          ],
        }
      }
    },
  )

  server.tool(
    toolNames.CREATE_COLLECTION,
    toolsDescriptions.CREATE_COLLECTION,
    {
      projectId: z.string().describe(paramsDescriptions.PROJECT_ID),
      refId: z.string().describe(paramsDescriptions.REF_ID),
      collectionName: z.string().describe(paramsDescriptions.COLLECTION_NAME),
      fields: z.array(z.object({
        name: z.string(),
        type: z.string(),
        description: z.string(),
      })).describe(paramsDescriptions.COLLECTION_FIELDS),
    },
    async ({ projectId, refId, collectionName, fields }): Promise<CallToolResult> => {
      try {
        const project = await client.projectInfo(projectId)
        await assertAiFeaturesEnabledForProject(client, project)

        // Build the complete collection structure
        const collectionStructure = {
          [collectionName]: {
            id: collectionName,
            name: collectionName,
            fields: [
              // Mandatory fields
              {
                name: '_id',
                type: 'ObjectId',
                required: true,
                nullable: false,
                description: '_id',
              },
              {
                name: 'creatorId',
                type: 'string',
                required: true,
                nullable: false,
                description: 'creatorId',
              },
              {
                name: 'createdAt',
                type: 'Date',
                required: true,
                nullable: false,
                description: 'createdAt',
              },
              {
                name: 'updaterId',
                type: 'string',
                required: true,
                nullable: false,
                description: 'updaterId',
              },
              {
                name: 'updatedAt',
                type: 'Date',
                required: true,
                nullable: false,
                description: 'updatedAt',
              },
              {
                name: '__STATE__',
                type: 'string',
                required: true,
                nullable: false,
                description: '__STATE__',
              },
              // User-defined fields
              ...fields.map((field) => ({
                name: field.name,
                type: field.type,
                required: false,
                nullable: true,
                sensitivityValue: 0,
                description: field.description,
              })),
            ],
            internalEndpoints: [
              {
                basePath: `/${collectionName}`,
                defaultState: 'PUBLIC',
              },
            ],
            type: 'collection',
            indexes: [
              {
                name: '_id',
                type: 'normal',
                unique: true,
                fields: [
                  {
                    name: '_id',
                    order: 1,
                  },
                ],
              },
              {
                name: 'createdAt',
                type: 'normal',
                unique: false,
                fields: [
                  {
                    name: 'createdAt',
                    order: -1,
                  },
                ],
              },
              {
                name: 'stateIndex',
                type: 'normal',
                unique: false,
                fields: [
                  {
                    name: '__STATE__',
                    order: 1,
                  },
                ],
              },
            ],
            description: `Collection of ${collectionName}`,
            tags: [ 'collection' ],
          },
        }

        const resourcesToCreate: ResourcesToCreate = {
          collections: collectionStructure as Collections,
        }

        await client.saveConfiguration(projectId, refId, resourcesToCreate)
        return {
          content: [
            {
              type: 'text',
              text: `Collection "${collectionName}" created successfully with ${fields.length} user-defined fields.`,
            },
          ],
        }
      } catch (error) {
        const err = error as Error
        return {
          isError: true,
          content: [
            {
              type: 'text',
              text: `Error creating collection: ${err.message}`,
            },
          ],
        }
      }
    },
  )

  server.tool(
    toolNames.CREATE_ENDPOINTS,
    toolsDescriptions.CREATE_ENDPOINTS,
    {
      projectId: z.string().describe(paramsDescriptions.PROJECT_ID),
      refId: z.string().describe(paramsDescriptions.REF_ID),
      endpointType: z.enum([ 'custom', 'crud' ]).describe(paramsDescriptions.ENDPOINT_TYPE),
      endpointName: z.string().describe(paramsDescriptions.ENDPOINT_NAME),
      endpointTarget: z.string().describe(paramsDescriptions.ENDPOINT_TARGET),
    },
    async ({ projectId, refId, endpointType, endpointName, endpointTarget }): Promise<CallToolResult> => {
      try {
        const project = await client.projectInfo(projectId)
        await assertAiFeaturesEnabledForProject(client, project)

        const response = await client.createEndpoints(
          projectId,
          refId,
          endpointType,
          endpointName,
          endpointTarget,
        )

        return {
          content: [
            {
              type: 'text',
              text: `Endpoint "${endpointName}" created successfully. Response: ${JSON.stringify(response)}`,
            },
          ],
        }
      } catch (error) {
        const err = error as Error
        return {
          isError: true,
          content: [
            {
              type: 'text',
              text: `Error creating endpoint "${endpointName}": ${err.message}`,
            },
          ],
        }
      }
    },
  )

  server.tool(
    toolNames.CREATE_VERSION,
    toolsDescriptions.CREATE_VERSION,
    {
      projectId: z.string().describe(paramsDescriptions.PROJECT_ID),
      revisionName: z.string().describe(paramsDescriptions.REVISION_NAME),
      versionName: z.string().regex(VERSION_NAME_PATTERN).describe(paramsDescriptions.NEW_VERSION_NAME),
      message: z.string().optional().describe(paramsDescriptions.VERSION_MESSAGE),
      releaseDescription: z.string().optional().describe(paramsDescriptions.VERSION_RELEASE_DESCRIPTION),
    },
    async ({ projectId, revisionName, versionName, message, releaseDescription }): Promise<CallToolResult> => {
      try {
        const project = await client.projectInfo(projectId)
        await assertAiFeaturesEnabledForProject(client, project)

        // The create API answers with a generic error both for a duplicate version name and for an
        // unknown source revision, so both conditions are checked upfront to return a meaningful message.
        const { revisions, versions } = await client.getConfigurationRevisions(projectId)
        if (refNames(versions).includes(versionName)) {
          throw new Error(`version "${versionName}" already exists in project "${projectId}", choose a different name`)
        }
        const revisionNames = refNames(revisions)
        if (!revisionNames.includes(revisionName)) {
          throw new Error(`revision "${revisionName}" not found in project "${projectId}", available revisions: ${revisionNames.join(', ')}`)
        }

        const created = await client.createVersion(projectId, versionName, revisionName, message, releaseDescription)
        return {
          structuredContent: { ...created },
          content: [
            {
              type: 'text',
              text: `Version "${created.name}" created successfully from revision "${revisionName}".`,
            },
          ],
        }
      } catch (error) {
        const err = error as Error
        return {
          isError: true,
          content: [
            {
              type: 'text',
              text: `Error creating version "${versionName}": ${err.message}`,
            },
          ],
        }
      }
    },
  )

  server.tool(
    toolNames.GET_VERSION,
    toolsDescriptions.GET_VERSION,
    {
      projectId: z.string().describe(paramsDescriptions.PROJECT_ID),
      versionName: z.string().describe(paramsDescriptions.VERSION_NAME),
    },
    async ({ projectId, versionName }): Promise<CallToolResult> => {
      try {
        const project = await client.projectInfo(projectId)
        await assertAiFeaturesEnabledForProject(client, project)

        const version = await client.getVersion(projectId, versionName)
        return {
          structuredContent: { ...version },
          content: [
            {
              type: 'text',
              text: JSON.stringify(version),
            },
          ],
        }
      } catch (error) {
        const err = error as Error
        return {
          isError: true,
          content: [
            {
              type: 'text',
              text: `Error fetching version "${versionName}": ${err.message}`,
            },
          ],
        }
      }
    },
  )

  server.tool(
    toolNames.DELETE_VERSION,
    toolsDescriptions.DELETE_VERSION,
    {
      projectId: z.string().describe(paramsDescriptions.PROJECT_ID),
      versionName: z.string().describe(paramsDescriptions.VERSION_NAME),
    },
    async ({ projectId, versionName }): Promise<CallToolResult> => {
      try {
        const project = await client.projectInfo(projectId)
        await assertAiFeaturesEnabledForProject(client, project)

        // The delete API succeeds silently for a version that does not exist, so its existence is
        // checked upfront: the lookup fails with a "not found" error when the version is missing.
        await client.getVersion(projectId, versionName)
        await client.deleteVersion(projectId, versionName)
        return {
          content: [
            {
              type: 'text',
              text: `Version "${versionName}" deleted successfully.`,
            },
          ],
        }
      } catch (error) {
        const err = error as Error
        return {
          isError: true,
          content: [
            {
              type: 'text',
              text: `Error deleting version "${versionName}": ${err.message}`,
            },
          ],
        }
      }
    },
  )
  server.tool(
    toolNames.LIST_PUBLIC_VARIABLES,
    toolsDescriptions.LIST_PUBLIC_VARIABLES,
    {
      projectId: z.string().describe(paramsDescriptions.PROJECT_ID),
      refId: z.string().describe(paramsDescriptions.REF_ID),
      refType: z.enum([ 'revision', 'version' ]).optional().default('revision').describe(paramsDescriptions.REF_TYPE),
    },
    async ({ projectId, refId, refType }): Promise<CallToolResult> => {
      try {
        const project = await client.projectInfo(projectId)
        await assertAiFeaturesEnabledForProject(client, project)

        const backendRefType = refType === 'version'
          ? 'versions'
          : 'revisions'
        const config = await client.getConfiguration(projectId, refId, backendRefType)
        const publicVariables = config.unsecretedVariables || []
        return {
          structuredContent: { publicVariables },
          content: [
            {
              type: 'text',
              text: JSON.stringify(publicVariables),
            },
          ],
        }
      } catch (error) {
        const err = error as Error
        return {
          isError: true,
          content: [
            {
              type: 'text',
              text: `Error fetching public variables: ${err.message}`,
            },
          ],
        }
      }
    },
  )

  server.tool(
    toolNames.SAVE_PUBLIC_VARIABLES,
    toolsDescriptions.SAVE_PUBLIC_VARIABLES,
    {
      projectId: z.string().describe(paramsDescriptions.PROJECT_ID),
      refId: z.string().describe(paramsDescriptions.REVISION_ID),
      upsert: z.array(z.object({
        name: z.string().regex(PUBLIC_VARIABLE_NAME_REGEX, publicVariableNameError),
        environments: z.record(z.string(), z.string()),
      })).optional().describe(paramsDescriptions.PUBLIC_VARIABLES_UPSERT),
      delete: z.array(z.string().regex(PUBLIC_VARIABLE_NAME_REGEX, publicVariableNameError)).optional().describe(paramsDescriptions.PUBLIC_VARIABLES_DELETE),
    },
    async ({ projectId, refId, upsert, delete: toDelete }): Promise<CallToolResult> => {
      try {
        const project = await client.projectInfo(projectId)
        await assertAiFeaturesEnabledForProject(client, project)

        const changes: PublicVariablesChanges = { upsert, delete: toDelete }
        validatePublicVariablesChanges(changes)

        const projectEnvIds = new Set((project.environments || []).map(({ envId }) => envId))
        const requestedEnvIds = new Set((upsert || []).flatMap(({ environments }) => Object.keys(environments)))
        const unknownEnvIds = [ ...requestedEnvIds ].filter((envId) => !projectEnvIds.has(envId))
        if (unknownEnvIds.length > 0) {
          throw new Error(`unknown environments: ${unknownEnvIds.join(', ')}. Available environments: ${[ ...projectEnvIds ].join(', ')}`)
        }

        const { created, updated, deleted } = await client.updatePublicVariables(projectId, refId, changes, [ ...projectEnvIds ])
        return {
          structuredContent: { created, updated, deleted },
          content: [
            {
              type: 'text',
              text: `Public variables saved successfully. Created: ${formatNames(created)}. Updated: ${formatNames(updated)}. Deleted: ${formatNames(deleted)}. The changes take effect on the environments only after the next deploy.`,
            },
          ],
        }
      } catch (error) {
        const err = error as Error
        return {
          isError: true,
          content: [
            {
              type: 'text',
              text: `Error saving public variables: ${err.message}`,
            },
          ],
        }
      }
    },
  )
}

function refNames (refs: unknown): string[] {
  if (!Array.isArray(refs)) {
    return []
  }
  return refs.map((ref) => (ref as { name?: unknown }).name).filter((name): name is string => typeof name === 'string')
}

function formatNames (names: string[]): string {
  return names.length > 0
    ? names.join(', ')
    : 'none'
}
