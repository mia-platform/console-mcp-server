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

import {
  beforeEach,
  mock,
  suite,
  test,
} from 'node:test'

import { CallToolResultSchema } from '@modelcontextprotocol/sdk/types.js'
import { Client } from '@modelcontextprotocol/sdk/client/index.js'

import { APIClient } from '../../apis/client'
import { TestMCPServer } from '../../server/utils.test'
import {
  addConfigurationCapabilities,
  ERR_AI_FEATURES_NOT_ENABLED,
  ERR_NO_TENANT_ID,
} from '.'
import {
  ResourcesToCreate,
  SaveConfigurationOptions,
  SaveResponse,
} from '../../apis/types/configuration'

const revisions = [
  { name: 'main' },
  { name: 'feature-branch' },
]

const tags = [
  { name: 'v1.0.0' },
  { name: 'v1.1.0' },
]

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

const mockSaveResponse = {
  id: 'new-commit-id',
}

interface CapabilitiesMocks {
  getConfigurationRevisionsMockFn?: (projectId: string) => Promise<Record<string, unknown>>
  getConfigurationMockFn?: (projectId: string, refId: string) => Promise<Record<string, unknown>>
  saveConfigurationMockFn?: (projectId: string) => Promise<SaveResponse>
  isAiFeaturesEnabledForTenantMockFn?: (tenantId: string) => Promise<boolean>
}

async function getTestMCPServerClient (capabilities: CapabilitiesMocks): Promise<Client> {
  const client = await TestMCPServer((server) => {
    addConfigurationCapabilities(server, {
      async getConfigurationRevisions (projectId: string): Promise<Record<string, unknown>> {
        if (!capabilities.getConfigurationRevisionsMockFn) {
          throw new Error('getConfigurationRevisionsMockFn not mocked')
        }

        return capabilities.getConfigurationRevisionsMockFn(projectId)
      },

      async isAiFeaturesEnabledForTenant (tenantId: string): Promise<boolean> {
        if (!capabilities.isAiFeaturesEnabledForTenantMockFn) {
          throw new Error('isAiFeaturesEnabledForTenantMockFn not mocked')
        }

        return capabilities.isAiFeaturesEnabledForTenantMockFn(tenantId)
      },

      async getConfiguration (projectId: string, refId: string): Promise<Record<string, unknown>> {
        if (!capabilities.getConfigurationMockFn) {
          throw new Error('getConfigurationMockFn not mocked')
        }

        return capabilities.getConfigurationMockFn(projectId, refId)
      },

      async saveConfiguration (
        projectId: string,
        _refId: string,
        _resourcesToCreate: ResourcesToCreate,
        _options?: SaveConfigurationOptions,
      ): Promise<SaveResponse> {
        if (!capabilities.saveConfigurationMockFn) {
          throw new Error('saveConfigurationMockFn not mocked')
        }

        return capabilities.saveConfigurationMockFn(projectId)
      },
    } as APIClient)
  })

  return client
}

suite('list configuration revisions tool', () => {
  let client: Client

  const getConfigurationRevisionsMockFn =
    mock.fn(async (projectId: string) => {
      if (projectId === 'error-project') {
        throw new Error('error message')
      }

      return {
        revisions,
        versions: tags,
      }
    })

  beforeEach(async () => {
    client = await getTestMCPServerClient({
      getConfigurationRevisionsMockFn,
      isAiFeaturesEnabledForTenantMockFn: mock.fn(async (tenantId: string) => tenantId !== 'not-enabled-tenant'),
    })
  })

  test('should return error empty tenant is passed', async (t) => {
    const tenantId = ''
    const projectId = 'project123'

    const result = await client.request({
      method: 'tools/call',
      params: {
        name: 'list_configuration_revisions',
        arguments: {
          tenantId,
          projectId,
        },
      },
    }, CallToolResultSchema)

    t.assert.deepEqual(result.content, [
      {
        text: `Error fetching revisions or versions: ${ERR_NO_TENANT_ID}`,
        type: 'text',
      },
    ])
  })

  test('should return error if AI features are not enabled for tenant', async (t) => {
    const tenantId = 'not-enabled-tenant'
    const projectId = 'project123'

    const result = await client.request({
      method: 'tools/call',
      params: {
        name: 'list_configuration_revisions',
        arguments: {
          tenantId,
          projectId,
        },
      },
    }, CallToolResultSchema)

    t.assert.deepEqual(result.content, [
      {
        text: `Error fetching revisions or versions: ${ERR_AI_FEATURES_NOT_ENABLED} '${tenantId}'`,
        type: 'text',
      },
    ])
  })

  test('should return revisions and tags', async (t) => {
    const tenantId = 'tenant123'
    const projectId = 'project123'

    const result = await client.request({
      method: 'tools/call',
      params: {
        name: 'list_configuration_revisions',
        arguments: {
          tenantId,
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
    const tenantId = 'tenant123'
    const projectId = 'error-project'

    const result = await client.request({
      method: 'tools/call',
      params: {
        name: 'list_configuration_revisions',
        arguments: {
          tenantId,
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

  const getConfigurationMockFn =
    mock.fn(async (projectId: string, _refId: string) => {
      if (projectId === 'error-project') {
        throw new Error('some error')
      }

      return mockConfiguration
    })

  beforeEach(async () => {
    client = await getTestMCPServerClient({
      getConfigurationMockFn,
      isAiFeaturesEnabledForTenantMockFn: mock.fn(async (tenantId: string) => tenantId !== 'not-enabled-tenant'),
    })
  })

  test('should return error empty tenant is passed', async (t) => {
    const tenantId = ''
    const projectId = 'project123'
    const refId = 'main'

    const result = await client.request({
      method: 'tools/call',
      params: {
        name: 'configuration_get',
        arguments: {
          tenantId,
          projectId,
          refId,
        },
      },
    }, CallToolResultSchema)

    t.assert.deepEqual(result.content, [
      {
        text: `Error fetching configuration: ${ERR_NO_TENANT_ID}`,
        type: 'text',
      },
    ])
  })

  test('should return error if AI features are not enabled for tenant', async (t) => {
    const tenantId = 'not-enabled-tenant'
    const projectId = 'project123'
    const refId = 'main'

    const result = await client.request({
      method: 'tools/call',
      params: {
        name: 'configuration_get',
        arguments: {
          tenantId,
          projectId,
          refId,
        },
      },
    }, CallToolResultSchema)

    t.assert.deepEqual(result.content, [
      {
        text: `Error fetching configuration: ${ERR_AI_FEATURES_NOT_ENABLED} '${tenantId}'`,
        type: 'text',
      },
    ])
  })

  test('should retrieve and return configuration', async (t) => {
    const tenantId = 'tenant123'
    const projectId = 'project123'
    const refId = 'main'

    const result = await client.request({
      method: 'tools/call',
      params: {
        name: 'configuration_get',
        arguments: {
          tenantId,
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
    const tenantId = 'tenant123'
    const projectId = 'error-project'
    const refId = 'main'

    const result = await client.request({
      method: 'tools/call',
      params: {
        name: 'configuration_get',
        arguments: {
          tenantId,
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

  const saveConfigurationMockFn =
    mock.fn(async (projectId: string) => {
      if (projectId === 'error-project') {
        throw new Error('some error')
      }

      return mockSaveResponse
    })

  beforeEach(async () => {
    client = await getTestMCPServerClient({
      saveConfigurationMockFn,
      isAiFeaturesEnabledForTenantMockFn: mock.fn(async (tenantId: string) => tenantId !== 'not-enabled-tenant'),
    })
  })

  test('should return error empty tenant is passed', async (t) => {
    const tenantId = ''
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

    const result = await client.request({
      method: 'tools/call',
      params: {
        name: 'configuration_save',
        arguments: {
          tenantId,
          projectId,
          refId,
          endpoints: endpointsToSave,
        },
      },
    }, CallToolResultSchema)

    t.assert.deepEqual(result.content, [
      {
        text: `Error saving configuration: ${ERR_NO_TENANT_ID}`,
        type: 'text',
      },
    ])
  })

  test('should return error if AI features are not enabled for tenant', async (t) => {
    const tenantId = 'not-enabled-tenant'
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

    const result = await client.request({
      method: 'tools/call',
      params: {
        name: 'configuration_save',
        arguments: {
          tenantId,
          projectId,
          refId,
          endpoints: endpointsToSave,
        },
      },
    }, CallToolResultSchema)

    t.assert.deepEqual(result.content, [
      {
        text: `Error saving configuration: ${ERR_AI_FEATURES_NOT_ENABLED} '${tenantId}'`,
        type: 'text',
      },
    ])
  })

  test('should save configuration successfully with multiple resource types', async (t) => {
    const tenantId = 'tenant123'
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
          tenantId,
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
    const tenantId = 'tenant123'
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
          tenantId,
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
