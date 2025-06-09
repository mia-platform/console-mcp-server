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

import { beforeEach, suite, test } from 'node:test'

import { CallToolResultSchema } from '@modelcontextprotocol/sdk/types.js'
import { Client } from '@modelcontextprotocol/sdk/client/index.js'

import { addConfigurationCapabilities } from '.'
import { APIClient } from '../../apis/client'
import { TestMCPServer } from '../../server/utils.test'
import {
  ResourcesToCreate,
  SaveConfigurationOptions,
  SaveResponse,
} from '../../apis/types/governance'

const revisions = [
  { name: 'main' },
  { name: 'feature-branch' },
]

const tags = [
  { name: 'v1.0.0' },
  { name: 'v1.1.0' },
]

// Mock configuration object for tests
const mockConfiguration = {
  services: {
    'api-gateway': {
      name: 'api-gateway',
      type: 'custom',
      advanced: false,
      sourceComponentId: 'api-gateway',
      dockerImage: 'nexus.mia-platform.eu/core/api-gateway:9.3.0',
      replicas: 1,
    },
  },
  endpoints: {
    '/': {
      basePath: '/',
      type: 'custom',
      service: 'api-gateway',
      pathRewrite: '/',
      public: true,
      acl: 'true',
      description: 'API Gateway endpoint',
      listeners: { web: true },
      secreted: false,
      showInDocumentation: true,
    },
  },
  listeners: {
    web: {
      name: 'web',
      port: 8080,
      selectedByDefault: true,
    },
  },
  commitId: 'abc123',
}

// Mock save response for tests
const mockSaveResponse = {
  id: 'new-commit-id',
}

suite('list configuration revisions tool', () => {
  let client: Client

  beforeEach(async () => {
    client = await TestMCPServer((server) => {
      addConfigurationCapabilities(server, {
        async getConfigurationRevisions (projectId: string): Promise<Record<string, unknown>> {
          if (projectId === 'error-project') {
            throw new Error('error message')
          }

          return {
            revisions,
            versions: tags,
          }
        },
      } as APIClient)
    })
  })

  test('should return revisions and tags', async (t) => {
    const projectId = 'project123'

    const result = await client.request({
      method: 'tools/call',
      params: {
        name: 'list_configuration_revisions',
        arguments: {
          projectId,
        },
      },
    }, CallToolResultSchema)

    t.assert.deepEqual(result.content, [
      {
        text: JSON.stringify({
          revisions,
          versions: tags,
        }),
        type: 'text',
      },
    ])
  })

  test('should return error message if request returns error', async (t) => {
    const projectId = 'error-project'
    const result = await client.request({
      method: 'tools/call',
      params: {
        name: 'list_configuration_revisions',
        arguments: {
          projectId,
        },
      },
    }, CallToolResultSchema)

    t.assert.deepEqual(result.content, [
      {
        text: 'Error fetching revisions or versions: error message',
        type: 'text',
      },
    ])
  })
})

suite('get configuration tool', () => {
  let client: Client

  beforeEach(async () => {
    client = await TestMCPServer((server) => {
      addConfigurationCapabilities(server, {
        async getConfiguration (projectId: string, _refId: string): Promise<Record<string, unknown>> {
          if (projectId === 'error-project') {
            throw new Error('some error')
          }
          return mockConfiguration
        },
      } as APIClient)
    })
  })

  test('should retrieve and return configuration', async (t) => {
    const projectId = 'project123'
    const refId = 'main'

    const result = await client.request({
      method: 'tools/call',
      params: {
        name: 'configuration_get',
        arguments: {
          projectId,
          refId,
        },
      },
    }, CallToolResultSchema)

    t.assert.deepEqual(result.content, [
      {
        text: JSON.stringify(mockConfiguration),
        type: 'text',
      },
    ])
  })

  test('should return error message if API request fails', async (t) => {
    const projectId = 'error-project'
    const refId = 'main'

    const result = await client.request({
      method: 'tools/call',
      params: {
        name: 'configuration_get',
        arguments: {
          projectId,
          refId,
        },
      },
    }, CallToolResultSchema)

    t.assert.deepEqual(result.content, [
      {
        text: 'Error fetching configuration: some error',
        type: 'text',
      },
    ])
  })
})

suite('configuration save tool', () => {
  let client: Client

  beforeEach(async () => {
    client = await TestMCPServer((server) => {
      addConfigurationCapabilities(server, {
        async saveConfiguration (
          projectID: string,
          _refID: string,
          _resourcesToCreate: ResourcesToCreate,
          _options?: SaveConfigurationOptions,
        ): Promise<SaveResponse> {
          if (projectID === 'error-project') {
            throw new Error('some error')
          }

          return mockSaveResponse
        },
      } as APIClient)
    })
  })

  test('should save configuration successfully with multiple resource types', async (t) => {
    const projectId = 'project123'
    const refId = 'main'

    const endpointsToSave = {
      '/api': {
        basePath: '/api',
        type: 'custom',
        service: 'api-service',
        pathRewrite: '/',
        public: true,
        acl: 'true',
        description: 'API endpoint',
        listeners: { web: true },
        secreted: false,
        showInDocumentation: true,
      },
    }

    const servicesToSave = {
      'new-service': {
        name: 'new-service',
        type: 'custom',
        advanced: false,
        dockerImage: 'nexus.mia-platform.eu/core/new-service:1.0.0',
        replicas: 2,
      },
    }

    const configMapsToSave = {
      'app-config': {
        name: 'app-config',
        description: 'Application configuration',
        variables: {
          ENV: 'production',
          LOG_LEVEL: 'info',
        },
      },
    }

    const collectionsToSave = {
      users: {
        name: 'users',
        fields: [
          { name: 'firstName', type: 'string', required: true },
          { name: 'lastName', type: 'string', required: true },
          { name: 'email', type: 'string', required: true, unique: true },
        ],
        indexes: [
          { name: 'email_idx', unique: true, fields: [ { name: 'email' } ] },
        ],
      },
    }

    const result = await client.request({
      method: 'tools/call',
      params: {
        name: 'configuration_save',
        arguments: {
          projectId,
          refId,
          endpoints: endpointsToSave,
          services: servicesToSave,
          configMaps: configMapsToSave,
          collections: collectionsToSave,
        },
      },
    }, CallToolResultSchema)

    t.assert.deepEqual(result.content, [
      {
        text: 'Configuration saved successfully.',
        type: 'text',
      },
    ])
  })

  test('should return error message if POST request fails', async (t) => {
    const projectId = 'error-project'
    const refId = 'main'

    const endpointsToSave = {
      '/api': {
        basePath: '/api',
        type: 'custom',
        service: 'api-service',
        pathRewrite: '/',
        public: true,
        acl: 'true',
        description: 'API endpoint',
        listeners: { web: true },
        secreted: false,
        showInDocumentation: true,
      },
    }

    const result = await client.request({
      method: 'tools/call',
      params: {
        name: 'configuration_save',
        arguments: {
          projectId,
          refId,
          endpoints: endpointsToSave,
        },
      },
    }, CallToolResultSchema)

    t.assert.deepEqual(result.content, [
      {
        text: 'Error saving configuration: some error',
        type: 'text',
      },
    ])
  })
})
