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

import { addConfigurationCapabilities } from '.'
import { ERR_AI_FEATURES_NOT_ENABLED } from '../utils/validations'
import { TestMCPServer } from '../../server/utils.test'
import {
  APIClientMock,
  APIClientMockFunctions,
} from '../../apis/client'
import { ProjectVersion, RetrievedConfiguration } from '../../apis/types/configuration'

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

async function getTestMCPServerClient (mocks: APIClientMockFunctions): Promise<Client> {
  const client = await TestMCPServer((server) => {
    addConfigurationCapabilities(server, new APIClientMock(mocks))
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

  it('returns error - if getProjectInfo fails', async (t: it.TestContext) => {
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

  it('returns error - if AI features are not enabled for tenant', async (t: it.TestContext) => {
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
        text: `Error fetching revisions or versions: ${ERR_AI_FEATURES_NOT_ENABLED.replace('{tenantId}', testTenantId)}`,
        type: 'text',
      },
    ])
  })

  it('returns revisions and tags', async (t: it.TestContext) => {
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

  it('returns error - if request returns error', async (t: it.TestContext) => {
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
    t.assert.ok(result.isError)
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
    mock.fn(async (projectId: string, _refId: string): Promise<RetrievedConfiguration> => {
      if (projectId === 'error-project') {
        throw new Error('some error')
      }

      return mockConfiguration as unknown as RetrievedConfiguration
    })

  it('returns error - if getProjectInfo fails', async (t: it.TestContext) => {
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

    t.assert.ok(result.isError)
    t.assert.deepEqual(result.content, [
      {
        text: `Error fetching configuration: ${expectedError}`,
        type: 'text',
      },
    ])
  })

  it('should return error if AI features are not enabled for tenant', async (t: it.TestContext) => {
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
    t.assert.ok(result.isError)
    t.assert.deepEqual(result.content, [
      {
        text: `Error fetching configuration: ${ERR_AI_FEATURES_NOT_ENABLED.replace('{tenantId}', testTenantId)}`,
        type: 'text',
      },
    ])
  })

  it('should retrieve and return configuration', async (t: it.TestContext) => {
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

  it('should default refType to "revisions" when not provided', async (t: it.TestContext) => {
    const testTenantId = 'tenant123'
    const testProjectId = 'project123'
    const refId = 'main'

    const getProjectInfoMockFn = mock.fn(async (projectId: string) => {
      return {
        id: projectId,
        tenantId: testTenantId,
      } as unknown as IProject
    })
    const aiFeaturesMockFn = mock.fn(async () => true)
    const refTypeAwareGetConfigurationMockFn =
      mock.fn(async (_projectId: string, _refId: string, _refType?: string): Promise<RetrievedConfiguration> => {
        return mockConfiguration as unknown as RetrievedConfiguration
      })

    const client = await getTestMCPServerClient({
      getConfigurationMockFn: refTypeAwareGetConfigurationMockFn,
      getProjectInfoMockFn,
      isAiFeaturesEnabledForTenantMockFn: aiFeaturesMockFn,
    })
    await client.request({
      method: 'tools/call',
      params: {
        name: 'configuration_get',
        arguments: {
          projectId: testProjectId,
          refId,
        },
      },
    }, CallToolResultSchema)

    t.assert.equal(refTypeAwareGetConfigurationMockFn.mock.callCount(), 1)
    t.assert.deepEqual(refTypeAwareGetConfigurationMockFn.mock.calls[0].arguments, [ testProjectId, refId, 'revisions' ])
  })

  it('should map refType "version" to "versions" when retrieving configuration from a version', async (t: it.TestContext) => {
    const testTenantId = 'tenant123'
    const testProjectId = 'project123'
    const refId = 'v1.0.0'

    const getProjectInfoMockFn = mock.fn(async (projectId: string) => {
      return {
        id: projectId,
        tenantId: testTenantId,
      } as unknown as IProject
    })
    const aiFeaturesMockFn = mock.fn(async () => true)
    const refTypeAwareGetConfigurationMockFn =
      mock.fn(async (_projectId: string, _refId: string, _refType?: string): Promise<RetrievedConfiguration> => {
        return mockConfiguration as unknown as RetrievedConfiguration
      })

    const client = await getTestMCPServerClient({
      getConfigurationMockFn: refTypeAwareGetConfigurationMockFn,
      getProjectInfoMockFn,
      isAiFeaturesEnabledForTenantMockFn: aiFeaturesMockFn,
    })
    await client.request({
      method: 'tools/call',
      params: {
        name: 'configuration_get',
        arguments: {
          projectId: testProjectId,
          refId,
          refType: 'version',
        },
      },
    }, CallToolResultSchema)

    t.assert.equal(refTypeAwareGetConfigurationMockFn.mock.callCount(), 1)
    t.assert.deepEqual(refTypeAwareGetConfigurationMockFn.mock.calls[0].arguments, [ testProjectId, refId, 'versions' ])
  })

  it('should return error message if API request fails', async (t: it.TestContext) => {
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
    t.assert.ok(result.isError)
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

  it('returns error - if getProjectInfo fails', async (t: it.TestContext) => {
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

    t.assert.ok(result.isError)
    t.assert.deepEqual(result.content, [
      {
        text: `Error saving configuration: ${expectedError}`,
        type: 'text',
      },
    ])
  })

  it('returns error - when AI features are not enabled for tenant', async (t: it.TestContext) => {
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
    t.assert.ok(result.isError)
    t.assert.deepEqual(result.content, [
      {
        text: `Error saving configuration: ${ERR_AI_FEATURES_NOT_ENABLED.replace('{tenantId}', testTenantId)}`,
        type: 'text',
      },
    ])
  })

  it('saves configuration successfully with multiple resource types', async (t: it.TestContext) => {
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

  it('should return error message if POST request fails', async (t: it.TestContext) => {
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
    t.assert.ok(result.isError)
    t.assert.deepEqual(result.content, [
      {
        text: 'Error saving configuration: some error',
        type: 'text',
      },
    ])
  })
})


suite('create collection tool', () => {
  const saveConfigurationMockFn =
    mock.fn(async (projectId: string) => {
      if (projectId === 'error-project') {
        throw new Error('some error')
      }

      return mockSaveResponse
    })

  it('returns error - if getProjectInfo fails', async (t: it.TestContext) => {
    const testProjectId = 'project123'
    const refId = 'main'
    const collectionName = 'users'
    const fields = [
      { name: 'firstName', type: 'string', description: 'User first name' },
      { name: 'lastName', type: 'string', description: 'User last name' },
    ]

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
        name: 'create_collection',
        arguments: {
          projectId: testProjectId,
          refId,
          collectionName,
          fields,
        },
      },
    }, CallToolResultSchema)

    t.assert.ok(result.isError)
    t.assert.deepEqual(result.content, [
      {
        text: `Error creating collection: ${expectedError}`,
        type: 'text',
      },
    ])
  })

  it('returns error - when AI features are not enabled for tenant', async (t: it.TestContext) => {
    const testTenantId = 'tenant123'
    const testProjectId = 'project123'
    const refId = 'main'
    const collectionName = 'users'
    const fields = [
      { name: 'firstName', type: 'string', description: 'User first name' },
      { name: 'lastName', type: 'string', description: 'User last name' },
    ]

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
        name: 'create_collection',
        arguments: {
          projectId: testProjectId,
          refId,
          collectionName,
          fields,
        },
      },
    }, CallToolResultSchema)

    t.assert.equal(aiFeaturesMockFn.mock.callCount(), 1)
    t.assert.ok(result.isError)
    t.assert.deepEqual(result.content, [
      {
        text: `Error creating collection: ${ERR_AI_FEATURES_NOT_ENABLED.replace('{tenantId}', testTenantId)}`,
        type: 'text',
      },
    ])
  })

  it('creates collection successfully', async (t: it.TestContext) => {
    const testTenantId = 'tenant123'
    const testProjectId = 'project123'
    const refId = 'main'
    const collectionName = 'policy'
    const fields = [
      { name: 'policyId', type: 'string', description: 'Policy ID' },
      { name: 'customerId', type: 'string', description: 'Customer ID' },
      { name: 'policyName', type: 'string', description: 'Policy name' },
      { name: 'channel', type: 'string', description: 'Channel' },
      { name: 'policyCode', type: 'string', description: 'Policy code' },
      { name: 'policyType', type: 'string', description: 'Policy type' },
      { name: 'subscriptionDate', type: 'Date', description: 'Subscription date' },
    ]

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
        name: 'create_collection',
        arguments: {
          projectId: testProjectId,
          refId,
          collectionName,
          fields,
        },
      },
    }, CallToolResultSchema)

    t.assert.equal(aiFeaturesMockFn.mock.callCount(), 1)
    t.assert.deepEqual(result.content, [
      {
        text: `Collection "policy" created successfully with 7 user-defined fields.`,
        type: 'text',
      },
    ])
  })

  it('should return error message if POST request fails', async (t: it.TestContext) => {
    const testTenantId = 'tenant123'
    const testProjectId = 'error-project'
    const refId = 'main'
    const collectionName = 'users'
    const fields = [
      { name: 'firstName', type: 'string', description: 'User first name' },
      { name: 'lastName', type: 'string', description: 'User last name' },
    ]

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
        name: 'create_collection',
        arguments: {
          projectId: testProjectId,
          refId,
          collectionName,
          fields,
        },
      },
    }, CallToolResultSchema)

    t.assert.equal(aiFeaturesMockFn.mock.callCount(), 1)
    t.assert.ok(result.isError)
    t.assert.deepEqual(result.content, [
      {
        text: 'Error creating collection: some error',
        type: 'text',
      },
    ])
  })
})

suite('create endpoints tool', () => {
  const createEndpointsMockFn = mock.fn(async (projectID: string) => {
    if (projectID === 'error-project') {
      throw new Error('some error')
    }
    return mockSaveResponse
  })

  it('returns error - if getProjectInfo fails', async (t: it.TestContext) => {
    const testProjectId = 'project123'
    const refId = 'main'
    const endpointType = 'custom' as const
    const endpointName = 'customer'
    const endpointTarget = 'customer-service'

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
        name: 'create_endpoints',
        arguments: {
          projectId: testProjectId,
          refId,
          endpointType,
          endpointName,
          endpointTarget,
        },
      },
    }, CallToolResultSchema)

    t.assert.ok(result.isError)
    t.assert.deepEqual(result.content, [
      {
        text: `Error creating endpoint "${endpointName}": ${expectedError}`,
        type: 'text',
      },
    ])
  })

  it('returns error - when AI features are not enabled for tenant', async (t: it.TestContext) => {
    const testTenantId = 'tenant123'
    const testProjectId = 'project123'
    const refId = 'main'
    const endpointType = 'crud' as const
    const endpointName = 'customer'
    const endpointTarget = 'customer'

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
      createEndpointsMockFn,
      getProjectInfoMockFn,
      isAiFeaturesEnabledForTenantMockFn: aiFeaturesMockFn,
    })
    const result = await client.request({
      method: 'tools/call',
      params: {
        name: 'create_endpoints',
        arguments: {
          projectId: testProjectId,
          refId,
          endpointType,
          endpointName,
          endpointTarget,
        },
      },
    }, CallToolResultSchema)

    t.assert.equal(aiFeaturesMockFn.mock.callCount(), 1)
    t.assert.ok(result.isError)
    t.assert.deepEqual(result.content, [
      {
        text: `Error creating endpoint "${endpointName}": ${ERR_AI_FEATURES_NOT_ENABLED.replace('{tenantId}', testTenantId)}`,
        type: 'text',
      },
    ])
  })

  it('creates custom endpoint successfully', async (t: it.TestContext) => {
    const testTenantId = 'tenant123'
    const testProjectId = 'project123'
    const refId = 'main'
    const endpointType = 'custom' as const
    const endpointName = 'customer'
    const endpointTarget = 'customer-service'

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
      createEndpointsMockFn,
      getProjectInfoMockFn,
      isAiFeaturesEnabledForTenantMockFn: aiFeaturesMockFn,
    })
    const result = await client.request({
      method: 'tools/call',
      params: {
        name: 'create_endpoints',
        arguments: {
          projectId: testProjectId,
          refId,
          endpointType,
          endpointName,
          endpointTarget,
        },
      },
    }, CallToolResultSchema)

    t.assert.equal(aiFeaturesMockFn.mock.callCount(), 1)
    t.assert.deepEqual(result.content, [
      {
        text: `Endpoint "${endpointName}" created successfully. Response: ${JSON.stringify(mockSaveResponse)}`,
        type: 'text',
      },
    ])
  })

  it('creates crud endpoint successfully', async (t: it.TestContext) => {
    const testTenantId = 'tenant123'
    const testProjectId = 'project123'
    const refId = 'main'
    const endpointType = 'crud' as const
    const endpointName = 'customer'
    const endpointTarget = 'customer'

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
      createEndpointsMockFn,
      getProjectInfoMockFn,
      isAiFeaturesEnabledForTenantMockFn: aiFeaturesMockFn,
    })
    const result = await client.request({
      method: 'tools/call',
      params: {
        name: 'create_endpoints',
        arguments: {
          projectId: testProjectId,
          refId,
          endpointType,
          endpointName,
          endpointTarget,
        },
      },
    }, CallToolResultSchema)

    t.assert.equal(aiFeaturesMockFn.mock.callCount(), 1)
    t.assert.deepEqual(result.content, [
      {
        text: `Endpoint "${endpointName}" created successfully. Response: ${JSON.stringify(mockSaveResponse)}`,
        type: 'text',
      },
    ])
  })

  it('should return error message if POST request fails', async (t: it.TestContext) => {
    const testTenantId = 'tenant123'
    const testProjectId = 'error-project'
    const refId = 'main'
    const endpointType = 'custom' as const
    const endpointName = 'customer'
    const endpointTarget = 'customer-service'

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
      createEndpointsMockFn,
      getProjectInfoMockFn,
      isAiFeaturesEnabledForTenantMockFn: aiFeaturesMockFn,
    })
    const result = await client.request({
      method: 'tools/call',
      params: {
        name: 'create_endpoints',
        arguments: {
          projectId: testProjectId,
          refId,
          endpointType,
          endpointName,
          endpointTarget,
        },
      },
    }, CallToolResultSchema)

    t.assert.equal(aiFeaturesMockFn.mock.callCount(), 1)
    t.assert.ok(result.isError)
    t.assert.deepEqual(result.content, [
      {
        text: `Error creating endpoint "${endpointName}": some error`,
        type: 'text',
      },
    ])
  })
})

suite('create version tool', () => {
  const testTenantId = 'tenant123'
  const testProjectId = 'project123'

  const getProjectInfoMockFn = async (projectId: string) => {
    return {
      id: projectId,
      tenantId: testTenantId,
    } as unknown as IProject
  }
  const aiFeaturesMockFn = async () => true
  const getConfigurationRevisionsMockFn = async () => ({
    revisions,
    versions: tags,
  })

  async function callCreateVersion (client: Client, args: Record<string, unknown>) {
    return client.request({
      method: 'tools/call',
      params: {
        name: 'create_version',
        arguments: args,
      },
    }, CallToolResultSchema)
  }

  it('returns error - if getProjectInfo fails', async (t: it.TestContext) => {
    const createVersionMockFn = mock.fn(async () => ({ name: 'v2.0.0' }))
    const client = await getTestMCPServerClient({
      getProjectInfoMockFn: async () => {
        throw new Error('error fetching project info')
      },
      createVersionMockFn,
    })

    const result = await callCreateVersion(client, { projectId: testProjectId, revisionName: 'main', versionName: 'v2.0.0' })

    t.assert.ok(result.isError)
    t.assert.equal(createVersionMockFn.mock.callCount(), 0)
    t.assert.deepEqual(result.content, [
      {
        text: 'Error creating version "v2.0.0": error fetching project info',
        type: 'text',
      },
    ])
  })

  it('returns error - if AI features are not enabled for tenant', async (t: it.TestContext) => {
    const createVersionMockFn = mock.fn(async () => ({ name: 'v2.0.0' }))
    const client = await getTestMCPServerClient({
      getProjectInfoMockFn,
      isAiFeaturesEnabledForTenantMockFn: async () => false,
      createVersionMockFn,
    })

    const result = await callCreateVersion(client, { projectId: testProjectId, revisionName: 'main', versionName: 'v2.0.0' })

    t.assert.ok(result.isError)
    t.assert.equal(createVersionMockFn.mock.callCount(), 0)
    t.assert.deepEqual(result.content, [
      {
        text: `Error creating version "v2.0.0": ${ERR_AI_FEATURES_NOT_ENABLED.replace('{tenantId}', testTenantId)}`,
        type: 'text',
      },
    ])
  })

  it('creates the version from the given revision', async (t: it.TestContext) => {
    const createVersionMockFn = mock.fn(async (_projectId: string, versionName: string) => ({ name: versionName }))
    const client = await getTestMCPServerClient({
      getProjectInfoMockFn,
      isAiFeaturesEnabledForTenantMockFn: aiFeaturesMockFn,
      getConfigurationRevisionsMockFn,
      createVersionMockFn,
    })

    const result = await callCreateVersion(client, {
      projectId: testProjectId,
      revisionName: 'main',
      versionName: 'v2.0.0',
      message: 'second release',
      releaseDescription: 'release note',
    })

    t.assert.ok(!result.isError)
    t.assert.equal(createVersionMockFn.mock.callCount(), 1)
    t.assert.deepEqual(createVersionMockFn.mock.calls[0].arguments, [
      testProjectId,
      'v2.0.0',
      'main',
      'second release',
      'release note',
    ])
    t.assert.deepEqual(result.structuredContent, { name: 'v2.0.0' })
    t.assert.deepEqual(result.content, [
      {
        text: 'Version "v2.0.0" created successfully from revision "main".',
        type: 'text',
      },
    ])
  })

  it('returns error - if the version already exists, without calling the create API', async (t: it.TestContext) => {
    const createVersionMockFn = mock.fn(async () => ({ name: 'v1.0.0' }))
    const client = await getTestMCPServerClient({
      getProjectInfoMockFn,
      isAiFeaturesEnabledForTenantMockFn: aiFeaturesMockFn,
      getConfigurationRevisionsMockFn,
      createVersionMockFn,
    })

    const result = await callCreateVersion(client, { projectId: testProjectId, revisionName: 'main', versionName: 'v1.0.0' })

    t.assert.ok(result.isError)
    t.assert.equal(createVersionMockFn.mock.callCount(), 0)
    t.assert.deepEqual(result.content, [
      {
        text: `Error creating version "v1.0.0": version "v1.0.0" already exists in project "${testProjectId}", choose a different name`,
        type: 'text',
      },
    ])
  })

  it('returns error - if the revision does not exist, without calling the create API', async (t: it.TestContext) => {
    const createVersionMockFn = mock.fn(async () => ({ name: 'v2.0.0' }))
    const client = await getTestMCPServerClient({
      getProjectInfoMockFn,
      isAiFeaturesEnabledForTenantMockFn: aiFeaturesMockFn,
      getConfigurationRevisionsMockFn,
      createVersionMockFn,
    })

    const result = await callCreateVersion(client, { projectId: testProjectId, revisionName: 'unknown', versionName: 'v2.0.0' })

    t.assert.ok(result.isError)
    t.assert.equal(createVersionMockFn.mock.callCount(), 0)
    t.assert.deepEqual(result.content, [
      {
        text: `Error creating version "v2.0.0": revision "unknown" not found in project "${testProjectId}", available revisions: main, feature-branch`,
        type: 'text',
      },
    ])
  })

  it('returns error - if the version name is not valid, without calling any API', async (t: it.TestContext) => {
    const projectInfoMockFn = mock.fn(getProjectInfoMockFn)
    const createVersionMockFn = mock.fn(async () => ({ name: 'v2.0.0' }))
    const client = await getTestMCPServerClient({
      getProjectInfoMockFn: projectInfoMockFn,
      isAiFeaturesEnabledForTenantMockFn: aiFeaturesMockFn,
      getConfigurationRevisionsMockFn,
      createVersionMockFn,
    })

    await t.assert.rejects(
      callCreateVersion(client, { projectId: testProjectId, revisionName: 'main', versionName: 'v2 0/0' }),
      { code: -32602 },
    )
    t.assert.equal(projectInfoMockFn.mock.callCount(), 0)
    t.assert.equal(createVersionMockFn.mock.callCount(), 0)
  })

  it('returns error - if the create API fails', async (t: it.TestContext) => {
    const client = await getTestMCPServerClient({
      getProjectInfoMockFn,
      isAiFeaturesEnabledForTenantMockFn: aiFeaturesMockFn,
      getConfigurationRevisionsMockFn,
      createVersionMockFn: async () => {
        throw new Error('Unable to create version')
      },
    })

    const result = await callCreateVersion(client, { projectId: testProjectId, revisionName: 'main', versionName: 'v2.0.0' })

    t.assert.ok(result.isError)
    t.assert.deepEqual(result.content, [
      {
        text: 'Error creating version "v2.0.0": Unable to create version',
        type: 'text',
      },
    ])
  })
})

suite('get version tool', () => {
  const testTenantId = 'tenant123'
  const testProjectId = 'project123'

  const version: ProjectVersion = {
    name: 'v1.0.0',
    commit: { date: '2026-10-16T10:00:00.000Z', changesId: 'abc', author: 'John', authorEmail: 'john@example.com' },
    versionInfo: { description: 'first release', releaseNote: 'release note' },
    origin: { name: 'main', type: 'revision', date: '2026-10-16T09:00:00.000Z', changesId: 'def', author: 'John', authorEmail: 'john@example.com' },
  }

  const getProjectInfoMockFn = async (projectId: string) => {
    return {
      id: projectId,
      tenantId: testTenantId,
    } as unknown as IProject
  }
  const getVersionMockFn = async (projectId: string, versionName: string) => {
    if (versionName !== version.name) {
      throw new Error(`Version '${versionName}' not found for project '${projectId}'`)
    }
    return version
  }

  async function callGetVersion (client: Client, args: Record<string, unknown>) {
    return client.request({
      method: 'tools/call',
      params: {
        name: 'get_version',
        arguments: args,
      },
    }, CallToolResultSchema)
  }

  it('returns error - if getProjectInfo fails', async (t: it.TestContext) => {
    const client = await getTestMCPServerClient({
      getProjectInfoMockFn: async () => {
        throw new Error('error fetching project info')
      },
      getVersionMockFn,
    })

    const result = await callGetVersion(client, { projectId: testProjectId, versionName: 'v1.0.0' })

    t.assert.ok(result.isError)
    t.assert.deepEqual(result.content, [
      {
        text: 'Error fetching version "v1.0.0": error fetching project info',
        type: 'text',
      },
    ])
  })

  it('returns error - if AI features are not enabled for tenant', async (t: it.TestContext) => {
    const client = await getTestMCPServerClient({
      getProjectInfoMockFn,
      isAiFeaturesEnabledForTenantMockFn: async () => false,
      getVersionMockFn,
    })

    const result = await callGetVersion(client, { projectId: testProjectId, versionName: 'v1.0.0' })

    t.assert.ok(result.isError)
    t.assert.deepEqual(result.content, [
      {
        text: `Error fetching version "v1.0.0": ${ERR_AI_FEATURES_NOT_ENABLED.replace('{tenantId}', testTenantId)}`,
        type: 'text',
      },
    ])
  })

  it('returns the version details', async (t: it.TestContext) => {
    const client = await getTestMCPServerClient({
      getProjectInfoMockFn,
      isAiFeaturesEnabledForTenantMockFn: async () => true,
      getVersionMockFn,
    })

    const result = await callGetVersion(client, { projectId: testProjectId, versionName: 'v1.0.0' })

    t.assert.ok(!result.isError)
    t.assert.deepEqual(result.structuredContent, version)
    t.assert.deepEqual(result.content, [
      {
        text: JSON.stringify(version),
        type: 'text',
      },
    ])
  })

  it('returns error - if the version does not exist', async (t: it.TestContext) => {
    const client = await getTestMCPServerClient({
      getProjectInfoMockFn,
      isAiFeaturesEnabledForTenantMockFn: async () => true,
      getVersionMockFn,
    })

    const result = await callGetVersion(client, { projectId: testProjectId, versionName: 'missing' })

    t.assert.ok(result.isError)
    t.assert.deepEqual(result.content, [
      {
        text: `Error fetching version "missing": Version 'missing' not found for project '${testProjectId}'`,
        type: 'text',
      },
    ])
  })
})

suite('delete version tool', () => {
  const testTenantId = 'tenant123'
  const testProjectId = 'project123'

  const getProjectInfoMockFn = async (projectId: string) => {
    return {
      id: projectId,
      tenantId: testTenantId,
    } as unknown as IProject
  }
  const getVersionMockFn = async (projectId: string, versionName: string) => {
    if (versionName !== 'v1.0.0') {
      throw new Error(`Version '${versionName}' not found for project '${projectId}'`)
    }
    return { name: versionName } as unknown as ProjectVersion
  }

  async function callDeleteVersion (client: Client, args: Record<string, unknown>) {
    return client.request({
      method: 'tools/call',
      params: {
        name: 'delete_version',
        arguments: args,
      },
    }, CallToolResultSchema)
  }

  it('returns error - if getProjectInfo fails', async (t: it.TestContext) => {
    const deleteVersionMockFn = mock.fn(async () => undefined)
    const client = await getTestMCPServerClient({
      getProjectInfoMockFn: async () => {
        throw new Error('error fetching project info')
      },
      getVersionMockFn,
      deleteVersionMockFn,
    })

    const result = await callDeleteVersion(client, { projectId: testProjectId, versionName: 'v1.0.0' })

    t.assert.ok(result.isError)
    t.assert.equal(deleteVersionMockFn.mock.callCount(), 0)
    t.assert.deepEqual(result.content, [
      {
        text: 'Error deleting version "v1.0.0": error fetching project info',
        type: 'text',
      },
    ])
  })

  it('returns error - if AI features are not enabled for tenant', async (t: it.TestContext) => {
    const deleteVersionMockFn = mock.fn(async () => undefined)
    const client = await getTestMCPServerClient({
      getProjectInfoMockFn,
      isAiFeaturesEnabledForTenantMockFn: async () => false,
      getVersionMockFn,
      deleteVersionMockFn,
    })

    const result = await callDeleteVersion(client, { projectId: testProjectId, versionName: 'v1.0.0' })

    t.assert.ok(result.isError)
    t.assert.equal(deleteVersionMockFn.mock.callCount(), 0)
    t.assert.deepEqual(result.content, [
      {
        text: `Error deleting version "v1.0.0": ${ERR_AI_FEATURES_NOT_ENABLED.replace('{tenantId}', testTenantId)}`,
        type: 'text',
      },
    ])
  })

  it('deletes the version', async (t: it.TestContext) => {
    const deleteVersionMockFn = mock.fn(async (_projectId: string, _versionName: string) => undefined)
    const client = await getTestMCPServerClient({
      getProjectInfoMockFn,
      isAiFeaturesEnabledForTenantMockFn: async () => true,
      getVersionMockFn,
      deleteVersionMockFn,
    })

    const result = await callDeleteVersion(client, { projectId: testProjectId, versionName: 'v1.0.0' })

    t.assert.ok(!result.isError)
    t.assert.equal(deleteVersionMockFn.mock.callCount(), 1)
    t.assert.deepEqual(deleteVersionMockFn.mock.calls[0].arguments, [ testProjectId, 'v1.0.0' ])
    t.assert.deepEqual(result.content, [
      {
        text: 'Version "v1.0.0" deleted successfully.',
        type: 'text',
      },
    ])
  })

  it('returns error - if the version does not exist, without calling the delete API', async (t: it.TestContext) => {
    const deleteVersionMockFn = mock.fn(async () => undefined)
    const client = await getTestMCPServerClient({
      getProjectInfoMockFn,
      isAiFeaturesEnabledForTenantMockFn: async () => true,
      getVersionMockFn,
      deleteVersionMockFn,
    })

    const result = await callDeleteVersion(client, { projectId: testProjectId, versionName: 'missing' })

    t.assert.ok(result.isError)
    t.assert.equal(deleteVersionMockFn.mock.callCount(), 0)
    t.assert.deepEqual(result.content, [
      {
        text: `Error deleting version "missing": Version 'missing' not found for project '${testProjectId}'`,
        type: 'text',
      },
    ])
  })

  it('returns error - if the delete API fails', async (t: it.TestContext) => {
    const client = await getTestMCPServerClient({
      getProjectInfoMockFn,
      isAiFeaturesEnabledForTenantMockFn: async () => true,
      getVersionMockFn,
      deleteVersionMockFn: async () => {
        throw new Error('Unable to delete version')
      },
    })

    const result = await callDeleteVersion(client, { projectId: testProjectId, versionName: 'v1.0.0' })

    t.assert.ok(result.isError)
    t.assert.deepEqual(result.content, [
      {
        text: 'Error deleting version "v1.0.0": Unable to delete version',
        type: 'text',
      },
    ])
  })
})
