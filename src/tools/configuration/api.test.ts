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

import { basename, dirname, join } from 'path'
import { beforeEach, snapshot, suite, test } from 'node:test'
import { Config, constants } from '@mia-platform/console-types'
import { MockAgent, setGlobalDispatcher } from 'undici'

import { APIClient } from '../../lib/client'
import { getConfiguration, saveConfiguration } from './api'
import { ResourcesToCreate, SaveResponse } from './types'

const { ServiceTypes } = constants


snapshot.setResolveSnapshotPath(generateSnapshotPath)
function generateSnapshotPath (testFilePath: string | undefined) {
  if (!testFilePath) {
    return ''
  }
  const filename = basename(testFilePath)
  const base = dirname(testFilePath)
  return join(base, `snapshots/${filename}.snapshot`)
}


const mockedEndpoint = 'http://localhost:3000'

const projectUId = '_projectId123'

const emptyConfig: Config = {
  groups: [],
  secrets: [],
  cmsCategories: {},
  cmsSettings: {
    accessGroupsExpression: '',
  },
  cmsDashboard: [],
  decorators: {},
  endpoints: {},
  collections: {},
  cmsAnalytics: {},
  services: {},
  configMaps: {},
  serviceAccounts: {},
  listeners: {},
}

const mockPreviousConfig: Config = {
  ...emptyConfig,
  services: {
    'existing-service': {
      name: 'existing-service',
      type: ServiceTypes.CUSTOM,
      dockerImage: 'existing-image',
      replicas: 1,
      advanced: false,
    },
  },
  configMaps: {
    'existing-config-map': {
      name: 'existing-config-map',
      files: [
        {
          name: 'key1',
          content: 'value1',
        },
      ],
    },
  },
  serviceAccounts: {
    'existing-service-account': {
      name: 'existing-service-account',
    },
  },
  listeners: {
    'existing-listener': {
      name: 'existing-listener',
      port: 8080,
    },
  },
}

const mockRetrievedConfiguration = {
  ...mockPreviousConfig,
  fastDataConfig: { collections: [] },
  microfrontendPluginsConfig: { plugins: [] },
  extensionsConfig: { files: {} },
  enabledFeatures: [],
  commitId: 'commit123',
}

// Mock resources to create
const mockResourcesToCreate: ResourcesToCreate = {
  services: {
    'new-service': {
      name: 'new-service',
      type: ServiceTypes.CUSTOM,
      dockerImage: 'new-image',
      replicas: 1,
      advanced: false,
    },
  },
  serviceAccounts: {
    'new-service-account': {
      name: 'new-service-account',
    },
  },
  serviceSecrets: {},
  configMaps: {
    'new-config-map': {
      name: 'new-config-map',
      files: [
        {
          name: 'key2',
          content: 'value2',
        },
      ],
    },
  },
  listeners: {
    'new-listener': {
      name: 'new-listener',
      port: 8081,
    },
  },
  collections: {
    'new-collection': {
      name: 'new-collection',
      id: 'new-collection',
      type: 'collection',
      fields: [
        {
          name: '_id',
          type: 'ObjectId',
          required: true,
          nullable: false,
        },
        {
          name: 'name',
          type: 'string',
          required: true,
          nullable: false,
        },
      ],
      internalEndpoints: [
        {
          basePath: '/new-collection-endpoint',
          defaultState: 'PUBLIC',
        },
      ],
      indexes: [],
    },
  },
  endpoints: {},
}

const mockSaveResponse: SaveResponse = {
  id: 'new-commit-id',
}

suite('configuration API', () => {
  let client: APIClient
  let agent: MockAgent

  beforeEach(() => {
    client = new APIClient(mockedEndpoint)
    agent = new MockAgent()
    setGlobalDispatcher(agent)
  })

  suite('getConfiguration', () => {
    test('should retrieve configuration correctly', async (t) => {
      const refId = 'main'
      const configPath = `/api/backend/projects/${projectUId}/revisions/${encodeURIComponent(refId)}/configuration`

      // Mock the GET request
      agent.get(mockedEndpoint).intercept({
        path: configPath,
        method: 'GET',
        headers: {
          Accept: 'application/json',
        },
      }).reply(200, mockRetrievedConfiguration)

      // Call the function and verify the result
      const result = await getConfiguration(client, projectUId, refId)
      t.assert.deepEqual(result, mockRetrievedConfiguration)
    })

    test('should handle URL encoding of refId', async (t) => {
      const refId = 'feature/branch-with/special-chars'
      const encodedRefId = encodeURIComponent(refId)
      const configPath = `/api/backend/projects/${projectUId}/revisions/${encodedRefId}/configuration`

      // Mock the GET request with encoded path
      agent.get(mockedEndpoint).intercept({
        path: configPath,
        method: 'GET',
        headers: {
          Accept: 'application/json',
        },
      }).reply(200, mockRetrievedConfiguration)

      // Call the function and verify the result
      const result = await getConfiguration(client, projectUId, refId)
      t.assert.deepEqual(result, mockRetrievedConfiguration)
    })

    test('should propagate error when API request fails', async (t) => {
      const refId = 'main'
      const configPath = `/api/backend/projects/${projectUId}/revisions/${encodeURIComponent(refId)}/configuration`

      // Mock the GET request to fail
      agent.get(mockedEndpoint).intercept({
        path: configPath,
        method: 'GET',
        headers: {
          Accept: 'application/json',
        },
      }).reply(500, { message: 'Failed to retrieve configuration' })

      // Call the function and check it rejects with the error
      await t.assert.rejects(
        getConfiguration(client, projectUId, refId),
        Error('Failed to retrieve configuration'),
      )
    })
  })

  suite('saveConfiguration', () => {
    test('should save configuration correctly', async (t) => {
      const refId = 'main'
      const configPath = `/api/backend/projects/${projectUId}/revisions/${encodeURIComponent(refId)}/configuration`

      // Mock the GET request to retrieve previous configuration
      agent.get(mockedEndpoint).intercept({
        path: configPath,
        method: 'GET',
        headers: {
          Accept: 'application/json',
        },
      }).reply(200, mockRetrievedConfiguration)

      // Mock the POST request to save the new configuration
      agent.get(mockedEndpoint).intercept({
        path: configPath,
        method: 'POST',
        headers: {
          Accept: 'application/json',
        },
        body: JSON.stringify({
          title: '[mcp] created resources',
          fastDataConfig: mockRetrievedConfiguration.fastDataConfig,
          microfrontendPluginsConfig: mockRetrievedConfiguration.microfrontendPluginsConfig,
          extensionsConfig: mockRetrievedConfiguration.extensionsConfig,
          config: {
            ...mockRetrievedConfiguration,
            services: {
              ...mockRetrievedConfiguration.services,
              ...mockResourcesToCreate.services,
            },
            configMaps: {
              ...mockRetrievedConfiguration.configMaps,
              ...mockResourcesToCreate.configMaps,
            },
            serviceSecrets: {
              ...mockRetrievedConfiguration.serviceSecrets,
              ...mockResourcesToCreate.serviceSecrets,
            },
            serviceAccounts: {
              ...mockRetrievedConfiguration.serviceAccounts,
              ...mockResourcesToCreate.serviceAccounts,
            },
            listeners: {
              ...mockRetrievedConfiguration.listeners,
              ...mockResourcesToCreate.listeners,
            },
            collections: {
              ...mockRetrievedConfiguration.collections,
              ...mockResourcesToCreate.collections,
            },
          },
          previousSave: mockRetrievedConfiguration.commitId,
          deletedElements: {},
        }),
      }).reply(200, mockSaveResponse)

      // Call the function and check the result
      const result = await saveConfiguration(client, projectUId, mockResourcesToCreate, refId)
      t.assert.deepEqual(result, mockSaveResponse)
    })

    test('should propagate errors from GET request', async (t) => {
      const refId = 'main'
      const configPath = `/api/backend/projects/${projectUId}/revisions/${encodeURIComponent(refId)}/configuration`

      // Mock the GET request to fail
      agent.get(mockedEndpoint).intercept({
        path: configPath,
        method: 'GET',
        headers: {
          Accept: 'application/json',
        },
      }).reply(500, { message: 'Internal server error' })

      // Call the function and check it rejects with the error
      await t.assert.rejects(
        saveConfiguration(client, projectUId, mockResourcesToCreate, refId),
        Error('Internal server error'),
      )
    })

    test('should propagate errors from POST request', async (t) => {
      const refId = 'main'
      const configPath = `/api/backend/projects/${projectUId}/revisions/${encodeURIComponent(refId)}/configuration`

      // Mock the GET request to retrieve previous configuration
      agent.get(mockedEndpoint).intercept({
        path: configPath,
        method: 'GET',
        headers: {
          Accept: 'application/json',
        },
      }).reply(200, mockRetrievedConfiguration)

      // Mock the POST request to fail
      agent.get(mockedEndpoint).intercept({
        path: configPath,
        method: 'POST',
        headers: {
          Accept: 'application/json',
        },
      }).reply(500, { message: 'Failed to save configuration' })

      // Call the function and check it rejects with the error
      await t.assert.rejects(
        saveConfiguration(client, projectUId, mockResourcesToCreate, refId),
        Error('Failed to save configuration'),
      )
    })
  })

  suite('mergeConfigWithResources', () => {
    test('should throw error when service already exists', async (t) => {
      const refId = 'main'
      const configPath = `/api/backend/projects/${projectUId}/revisions/${encodeURIComponent(refId)}/configuration`

      // Create resources with a service that already exists in the config
      const conflictingResources: ResourcesToCreate = {
        services: {
          'existing-service': { // This will conflict
            name: 'existing-service',
            type: ServiceTypes.CUSTOM,
            dockerImage: 'conflicting-image',
            replicas: 1,
            advanced: false,
          },
        },
        serviceAccounts: {},
      }

      // Mock the GET request to retrieve previous configuration
      agent.get(mockedEndpoint).intercept({
        path: configPath,
        method: 'GET',
        headers: {
          Accept: 'application/json',
        },
      }).reply(200, mockRetrievedConfiguration)

      // Call the function and check it rejects with the error
      await t.assert.rejects(
        saveConfiguration(client, projectUId, conflictingResources, refId),
        Error('Service existing-service already exists'),
      )
    })

    test('should correctly merge resources when no conflicts exist', async (t) => {
      const refId = 'main'
      const configPath = `/api/backend/projects/${projectUId}/revisions/${encodeURIComponent(refId)}/configuration`

      // Mock the GET request to retrieve previous configuration
      agent.get(mockedEndpoint).intercept({
        path: configPath,
        method: 'GET',
        headers: {
          Accept: 'application/json',
        },
      }).reply(200, mockRetrievedConfiguration)

      // Mock the POST request and capture the request body to verify merge logic
      let capturedRequestBody: unknown = null

      agent.get(mockedEndpoint).intercept({
        path: configPath,
        method: 'POST',
        headers: {
          Accept: 'application/json',
        },
      }).reply(200, (opts) => {
        capturedRequestBody = JSON.parse(opts.body as string)
        return mockSaveResponse
      })

      // Call the function
      await saveConfiguration(client, projectUId, mockResourcesToCreate, refId)

      // Verify that collections were merged correctly
      const configToSave = capturedRequestBody as { config: Config }
      t.assert.deepEqual(configToSave.config.collections, {
        ...mockRetrievedConfiguration.collections,
        ...mockResourcesToCreate.collections,
      })

      t.assert.snapshot(capturedRequestBody, {
        serializers: [ (value) => JSON.stringify(value, null, 2) ],
      })
    })

    test('should handle missing optional properties gracefully', async (t) => {
      const refId = 'main'
      const configPath = `/api/backend/projects/${projectUId}/revisions/${encodeURIComponent(refId)}/configuration`

      // Create a previous config with missing properties
      const minimalPreviousConfig: Config = {
        ...emptyConfig,
        services: mockPreviousConfig.services,
        configMaps: {},
        serviceAccounts: {},
      }

      const minimalRetrievedConfig = {
        ...minimalPreviousConfig,
        fastDataConfig: { collections: [] },
        commitId: 'commit123',
      }

      // Create minimal resources to add
      const minimalResources: ResourcesToCreate = {
        services: mockResourcesToCreate.services,
        serviceAccounts: {},
      }

      // Mock the GET request to retrieve previous configuration
      agent.get(mockedEndpoint).intercept({
        path: configPath,
        method: 'GET',
        headers: {
          Accept: 'application/json',
        },
      }).reply(200, minimalRetrievedConfig)

      // Mock the POST request and capture the request body to verify merge logic
      let capturedRequestBody: unknown = null

      agent.get(mockedEndpoint).intercept({
        path: configPath,
        method: 'POST',
        headers: {
          Accept: 'application/json',
        },
      }).reply(200, (opts) => {
        capturedRequestBody = JSON.parse(opts.body as string)
        return mockSaveResponse
      })

      // Call the function
      await saveConfiguration(client, projectUId, minimalResources, refId)

      t.assert.snapshot(capturedRequestBody, {
        serializers: [ (value) => JSON.stringify(value, null, 2) ],
      })
    })

    test('should correctly merge collections with existing collections', async (t) => {
      const refId = 'main'
      const configPath = `/api/backend/projects/${projectUId}/revisions/${encodeURIComponent(refId)}/configuration`

      // Resources with only collections to be added
      const collectionResources: ResourcesToCreate = {
        collections: {
          'new-collection': {
            name: 'new-collection',
            id: 'new-collection',
            type: 'collection',
            fields: [
              {
                name: '_id',
                type: 'ObjectId',
                required: true,
                nullable: false,
              },
              {
                name: 'name',
                type: 'string',
                required: true,
                nullable: false,
              },
            ],
            internalEndpoints: [
              {
                basePath: '/new-collection-endpoint',
                defaultState: 'PUBLIC',
              },
            ],
            indexes: [],
          },
          'another-new-collection': {
            name: 'another-new-collection',
            id: 'another-new-collection',
            type: 'collection',
            fields: [
              {
                name: '_id',
                type: 'ObjectId',
                required: true,
                nullable: false,
              },
              {
                name: 'value',
                type: 'number',
                required: true,
                nullable: false,
              },
            ],
            internalEndpoints: [
              {
                basePath: '/another-new-collection-endpoint',
                defaultState: 'PUBLIC',
              },
            ],
            indexes: [],
          },
        },
        services: {},
        serviceAccounts: {},
        serviceSecrets: {},
        configMaps: {},
        listeners: {},
        endpoints: {},
      }

      // Mock the GET request to retrieve previous configuration
      agent.get(mockedEndpoint).intercept({
        path: configPath,
        method: 'GET',
        headers: {
          Accept: 'application/json',
        },
      }).reply(200, {
        ...mockRetrievedConfiguration,
        collections: {
          'existing-collection': {
            name: 'existing-collection',
            id: 'existing-collection',
            type: 'collection',
            fields: [
              {
                name: '_id',
                type: 'ObjectId',
                required: true,
                nullable: false,
              },
            ],
            internalEndpoints: [
              {
                basePath: '/existing-collection-endpoint',
                defaultState: 'PUBLIC',
              },
            ],
            indexes: [],
          },
        },
      })

      let capturedRequestBody: unknown = null
      agent.get(mockedEndpoint).intercept({
        path: configPath,
        method: 'POST',
        headers: {
          Accept: 'application/json',
        },
      }).reply(200, (opts) => {
        capturedRequestBody = JSON.parse(opts.body as string)
        return mockSaveResponse
      })

      await saveConfiguration(client, projectUId, collectionResources, refId)

      const configToSave = capturedRequestBody as { config: Config }
      t.assert.snapshot(configToSave, {
        serializers: [ (value) => JSON.stringify(value, null, 2) ],
      })
    })
  })
})
