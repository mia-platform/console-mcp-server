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

import assert from 'node:assert'
import {
  it,
  mock,
  suite,
} from 'node:test'

import { CallToolResultSchema } from '@modelcontextprotocol/sdk/types.js'
import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { IProject } from '@mia-platform/console-types'

import { APIClient } from '../../apis/client'
import { TestMCPServer } from '../../server/utils.test'
import {
  addConfigurationCapabilities,
  ERR_AI_FEATURES_NOT_ENABLED,
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
  getProjectInfoMockFn?: (projectId: string) => Promise<IProject>
  getConfigurationRevisionsMockFn?: (projectId: string) => Promise<Record<string, unknown>>
  getConfigurationMockFn?: (projectId: string, refId: string) => Promise<Record<string, unknown>>
  saveConfigurationMockFn?: (projectId: string) => Promise<SaveResponse>
  isAiFeaturesEnabledForTenantMockFn?: (tenantId: string) => Promise<boolean>
}

async function getTestMCPServerClient (capabilities: CapabilitiesMocks): Promise<Client> {
  const apiClient: APIClient = {
    async projectInfo (projectId: string): Promise<IProject> {
      if (!capabilities.getProjectInfoMockFn) {
        throw new Error('getProjectInfoMockFn not mocked')
      }

      return capabilities.getProjectInfoMockFn(projectId)
    },

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
  } as APIClient

  const client = await TestMCPServer((server) => {
    addConfigurationCapabilities(server, apiClient)
  })

  return client
}

suite('list configuration revisions tool', () => {
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

  it('returns error - if getProjectInfo fails', async (t) => {
    const testProjectId = 'project123'

    const expectedError = 'error fetching project info'
    const getProjectInfoMockFn = mock.fn(async (_projectId: string) => {
      throw new Error(expectedError)
    })

    const client = await getTestMCPServerClient({
      getProjectInfoMockFn,
    })
    const result = await client.request({
      method: 'tools/call',
      params: {
        name: 'list_configuration_revisions',
        arguments: {
          projectId: testProjectId,
        },
      },
    }, CallToolResultSchema)

    t.assert.deepEqual(result.content, [
      {
        text: `Error fetching revisions or versions: ${expectedError}`,
        type: 'text',
      },
    ])
  })

  it('returns error - if AI features are not enabled for tenant', async (t) => {
    const testTenantId = 'tenant123'
    const testProjectId = 'project123'

    const getProjectInfoMockFn = mock.fn(async (projectId: string) => {
      assert.equal(projectId, testProjectId)
      return {
        id: projectId,
        tenantId: testTenantId,
      } as unknown as IProject
    })
    const aiFeaturesMockFn = mock.fn(async (tenantId: string) => {
      assert.strictEqual(tenantId, testTenantId)
      return false
    })

    const client = await getTestMCPServerClient({
      getConfigurationRevisionsMockFn,
      getProjectInfoMockFn,
      isAiFeaturesEnabledForTenantMockFn: aiFeaturesMockFn,
    })
    const result = await client.request({
      method: 'tools/call',
      params: {
        name: 'list_configuration_revisions',
        arguments: {
          projectId: testProjectId,
        },
      },
    }, CallToolResultSchema)

    t.assert.equal(aiFeaturesMockFn.mock.callCount(), 1)
    t.assert.deepEqual(result.content, [
      {
        text: `Error fetching revisions or versions: ${ERR_AI_FEATURES_NOT_ENABLED} '${testTenantId}'`,
        type: 'text',
      },
    ])
  })

  it('returns revisions and tags', async (t) => {
    const testTenantId = 'tenant123'
    const testProjectId = 'project123'

    const getProjectInfoMockFn = mock.fn(async (projectId: string) => {
      assert.equal(projectId, testProjectId)
      return {
        id: projectId,
        tenantId: testTenantId,
      } as unknown as IProject
    })
    const aiFeaturesMockFn = mock.fn(async (tenantId: string) => {
      assert.strictEqual(tenantId, testTenantId)
      return true
    })

    const client = await getTestMCPServerClient({
      getConfigurationRevisionsMockFn,
      getProjectInfoMockFn,
      isAiFeaturesEnabledForTenantMockFn: aiFeaturesMockFn,
    })
    const result = await client.request({
      method: 'tools/call',
      params: {
        name: 'list_configuration_revisions',
        arguments: {
          tenantId: testTenantId,
          projectId: testProjectId,
        },
      },
    }, CallToolResultSchema)

    t.assert.equal(aiFeaturesMockFn.mock.callCount(), 1)
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

  it('returns error - if request returns error', async (t) => {
    const testTenantId = 'tenant123'
    const testProjectId = 'error-project'

    const getProjectInfoMockFn = mock.fn(async (projectId: string) => {
      assert.equal(projectId, testProjectId)
      return {
        id: projectId,
        tenantId: testTenantId,
      } as unknown as IProject
    })
    const aiFeaturesMockFn = mock.fn(async (tenantId: string) => {
      assert.strictEqual(tenantId, testTenantId)
      return true
    })

    const client = await getTestMCPServerClient({
      getConfigurationRevisionsMockFn,
      getProjectInfoMockFn,
      isAiFeaturesEnabledForTenantMockFn: aiFeaturesMockFn,
    })
    const result = await client.request({
      method: 'tools/call',
      params: {
        name: 'list_configuration_revisions',
        arguments: {
          tenantId: testTenantId,
          projectId: testProjectId,
        },
      },
    }, CallToolResultSchema)

    t.assert.equal(aiFeaturesMockFn.mock.callCount(), 1)
    t.assert.deepEqual(result.content, [
      {
        text: 'Error fetching revisions or versions: error message',
        type: 'text',
      },
    ])
  })
})

suite('get configuration tool', () => {
  const getConfigurationMockFn =
    mock.fn(async (projectId: string, _refId: string) => {
      if (projectId === 'error-project') {
        throw new Error('some error')
      }

      return mockConfiguration
    })

  it('returns error - if getProjectInfo fails', async (t) => {
    const testProjectId = 'project123'
    const refId = 'main'

    const expectedError = 'error fetching project info'
    const getProjectInfoMockFn = mock.fn(async (_projectId: string) => {
      throw new Error(expectedError)
    })

    const client = await getTestMCPServerClient({
      getProjectInfoMockFn,
    })
    const result = await client.request({
      method: 'tools/call',
      params: {
        name: 'configuration_get',
        arguments: {
          projectId: testProjectId,
          refId,
        },
      },
    }, CallToolResultSchema)

    t.assert.deepEqual(result.content, [
      {
        text: `Error fetching configuration: ${expectedError}`,
        type: 'text',
      },
    ])
  })

  it('should return error if AI features are not enabled for tenant', async (t) => {
    const testTenantId = 'tenant123'
    const testProjectId = 'project123'
    const refId = 'main'

    const getProjectInfoMockFn = mock.fn(async (projectId: string) => {
      assert.equal(projectId, testProjectId)
      return {
        id: projectId,
        tenantId: testTenantId,
      } as unknown as IProject
    })
    const aiFeaturesMockFn = mock.fn(async (tenantId: string) => {
      assert.strictEqual(tenantId, testTenantId)
      return false
    })

    const client = await getTestMCPServerClient({
      getConfigurationMockFn,
      getProjectInfoMockFn,
      isAiFeaturesEnabledForTenantMockFn: aiFeaturesMockFn,
    })
    const result = await client.request({
      method: 'tools/call',
      params: {
        name: 'configuration_get',
        arguments: {
          projectId: testProjectId,
          refId,
        },
      },
    }, CallToolResultSchema)

    t.assert.equal(aiFeaturesMockFn.mock.callCount(), 1)
    t.assert.deepEqual(result.content, [
      {
        text: `Error fetching configuration: ${ERR_AI_FEATURES_NOT_ENABLED} '${testTenantId}'`,
        type: 'text',
      },
    ])
  })

  it('should retrieve and return configuration', async (t) => {
    const testTenantId = 'tenant123'
    const testProjectId = 'project123'
    const refId = 'main'

    const getProjectInfoMockFn = mock.fn(async (projectId: string) => {
      assert.equal(projectId, testProjectId)
      return {
        id: projectId,
        tenantId: testTenantId,
      } as unknown as IProject
    })
    const aiFeaturesMockFn = mock.fn(async (tenantId: string) => {
      assert.strictEqual(tenantId, testTenantId)
      return true
    })

    const client = await getTestMCPServerClient({
      getConfigurationMockFn,
      getProjectInfoMockFn,
      isAiFeaturesEnabledForTenantMockFn: aiFeaturesMockFn,
    })
    const result = await client.request({
      method: 'tools/call',
      params: {
        name: 'configuration_get',
        arguments: {
          projectId: testProjectId,
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

  it('should return error message if API request fails', async (t) => {
    const testTenantId = 'tenant123'
    const testProjectId = 'error-project'
    const refId = 'main'

    const getProjectInfoMockFn = mock.fn(async (projectId: string) => {
      assert.equal(projectId, testProjectId)
      return {
        id: projectId,
        tenantId: testTenantId,
      } as unknown as IProject
    })
    const aiFeaturesMockFn = mock.fn(async (tenantId: string) => {
      assert.strictEqual(tenantId, testTenantId)
      return true
    })

    const client = await getTestMCPServerClient({
      getConfigurationMockFn,
      getProjectInfoMockFn,
      isAiFeaturesEnabledForTenantMockFn: aiFeaturesMockFn,
    })
    const result = await client.request({
      method: 'tools/call',
      params: {
        name: 'configuration_get',
        arguments: {
          projectId: testProjectId,
          refId,
        },
      },
    }, CallToolResultSchema)

    t.assert.equal(aiFeaturesMockFn.mock.callCount(), 1)
    t.assert.deepEqual(result.content, [
      {
        text: 'Error fetching configuration: some error',
        type: 'text',
      },
    ])
  })
})

suite('configuration save tool', () => {
  const saveConfigurationMockFn =
    mock.fn(async (projectId: string) => {
      if (projectId === 'error-project') {
        throw new Error('some error')
      }

      return mockSaveResponse
    })

  it('returns error - if getProjectInfo fails', async (t) => {
    const testProjectId = 'project123'
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
    const expectedError = 'error fetching project info'
    const getProjectInfoMockFn = mock.fn(async (_projectId: string) => {
      throw new Error(expectedError)
    })

    const client = await getTestMCPServerClient({
      getProjectInfoMockFn,
    })
    const result = await client.request({
      method: 'tools/call',
      params: {
        name: 'configuration_save',
        arguments: {
          projectId: testProjectId,
          refId,
          endpoints: endpointsToSave,
        },
      },
    }, CallToolResultSchema)

    t.assert.deepEqual(result.content, [
      {
        text: `Error saving configuration: ${expectedError}`,
        type: 'text',
      },
    ])
  })

  it('returns error - when AI features are not enabled for tenant', async (t) => {
    const testTenantId = 'tenant123'
    const testProjectId = 'project123'
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

    const getProjectInfoMockFn = mock.fn(async (projectId: string) => {
      assert.equal(projectId, testProjectId)
      return {
        id: projectId,
        tenantId: testTenantId,
      } as unknown as IProject
    })
    const aiFeaturesMockFn = mock.fn(async (tenantId: string) => {
      assert.strictEqual(tenantId, testTenantId)
      return false
    })

    const client = await getTestMCPServerClient({
      saveConfigurationMockFn,
      getProjectInfoMockFn,
      isAiFeaturesEnabledForTenantMockFn: aiFeaturesMockFn,
    })
    const result = await client.request({
      method: 'tools/call',
      params: {
        name: 'configuration_save',
        arguments: {
          projectId: testProjectId,
          refId,
          endpoints: endpointsToSave,
        },
      },
    }, CallToolResultSchema)

    t.assert.equal(aiFeaturesMockFn.mock.callCount(), 1)
    t.assert.deepEqual(result.content, [
      {
        text: `Error saving configuration: ${ERR_AI_FEATURES_NOT_ENABLED} '${testTenantId}'`,
        type: 'text',
      },
    ])
  })

  it('saves configuration successfully with multiple resource types', async (t) => {
    const testTenantId = 'tenant123'
    const testProjectId = 'project123'
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

    const getProjectInfoMockFn = mock.fn(async (projectId: string) => {
      assert.equal(projectId, testProjectId)
      return {
        id: projectId,
        tenantId: testTenantId,
      } as unknown as IProject
    })
    const aiFeaturesMockFn = mock.fn(async (tenantId: string) => {
      assert.strictEqual(tenantId, testTenantId)
      return true
    })

    const client = await getTestMCPServerClient({
      saveConfigurationMockFn,
      getProjectInfoMockFn,
      isAiFeaturesEnabledForTenantMockFn: aiFeaturesMockFn,
    })
    const result = await client.request({
      method: 'tools/call',
      params: {
        name: 'configuration_save',
        arguments: {
          tenantId: testTenantId,
          projectId: testProjectId,
          refId,
          endpoints: endpointsToSave,
          services: servicesToSave,
          configMaps: configMapsToSave,
          collections: collectionsToSave,
        },
      },
    }, CallToolResultSchema)

    t.assert.equal(aiFeaturesMockFn.mock.callCount(), 1)
    t.assert.deepEqual(result.content, [
      {
        text: 'Configuration saved successfully.',
        type: 'text',
      },
    ])
  })

  it('should return error message if POST request fails', async (t) => {
    const testTenantId = 'tenant123'
    const testProjectId = 'error-project'
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

    const getProjectInfoMockFn = mock.fn(async (projectId: string) => {
      assert.equal(projectId, testProjectId)
      return {
        id: projectId,
        tenantId: testTenantId,
      } as unknown as IProject
    })
    const aiFeaturesMockFn = mock.fn(async (tenantId: string) => {
      assert.strictEqual(tenantId, testTenantId)
      return true
    })

    const client = await getTestMCPServerClient({
      saveConfigurationMockFn,
      getProjectInfoMockFn,
      isAiFeaturesEnabledForTenantMockFn: aiFeaturesMockFn,
    })
    const result = await client.request({
      method: 'tools/call',
      params: {
        name: 'configuration_save',
        arguments: {
          projectId: testProjectId,
          refId,
          endpoints: endpointsToSave,
        },
      },
    }, CallToolResultSchema)

    t.assert.equal(aiFeaturesMockFn.mock.callCount(), 1)
    t.assert.deepEqual(result.content, [
      {
        text: 'Error saving configuration: some error',
        type: 'text',
      },
    ])
  })
})
