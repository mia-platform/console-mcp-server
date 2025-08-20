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
import { it, mock, suite, test } from 'node:test'

import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { IProject } from '@mia-platform/console-types'
import { CallToolResultSchema, ListToolsResultSchema } from '@modelcontextprotocol/sdk/types.js'

import { addDeployCapabilities } from '.'
import { APIClient } from '../../apis/client'
import { ERR_AI_FEATURES_NOT_ENABLED } from '../utils/validations'
import { TestMCPServer } from '../../server/utils.test'

const triggerDeployResponse = {
  id: 123,
  url: 'https://console.mia-platform.eu/pipelines/123',
}

const compareUpdateResponse = {
  lastDeployedManifests: [
    { content: 'content1', name: 'manifest1', resourceName: 'resource1', type: 'type1' },
  ],
  revisionManifests: [
    { content: 'content2', name: 'manifest2', resourceName: 'resource2', type: 'type2' },
  ],
}

interface CapabilitiesMocks {
  getProjectInfoMockFn?: (projectId: string) => Promise<IProject>
  isAiFeaturesEnabledForTenantMockFn?: (tenantId: string) => Promise<boolean>

  deployProjectEnvironmentFromRevision?: (projectId: string, environment: string, revision: string, refType: string) => Promise<{ id: number, url: string }>
  compareProjectEnvironmentFromRevisionForDeploy?: (projectId: string, environment: string, revision: string, refType: string) => Promise<typeof compareUpdateResponse>
  waitProjectDeployForCompletion?: (projectId: string, pipelineId: string) => Promise<{ status: string }>
}

async function getTestMCPServerClient (capabilities: CapabilitiesMocks): Promise<Client> {
  const apiClient: APIClient = {
    async projectInfo (projectId: string): Promise<IProject> {
      if (!capabilities.getProjectInfoMockFn) {
        throw new Error('getProjectInfoMockFn not mocked')
      }

      return capabilities.getProjectInfoMockFn(projectId)
    },

    async isAiFeaturesEnabledForTenant (tenantId: string): Promise<boolean> {
      if (!capabilities.isAiFeaturesEnabledForTenantMockFn) {
        throw new Error('isAiFeaturesEnabledForTenantMockFn not mocked')
      }

      return capabilities.isAiFeaturesEnabledForTenantMockFn(tenantId)
    },

    async deployProjectEnvironmentFromRevision (projectId, environment, revision, refType: string) {
      if (!capabilities.deployProjectEnvironmentFromRevision) {
        throw new Error('deployProjectEnvironmentFromRevision not mocked')
      }

      return capabilities.deployProjectEnvironmentFromRevision(projectId, environment, revision, refType)
    },

    async compareProjectEnvironmentFromRevisionForDeploy (projectId, environment, revision, refType) {
      if (!capabilities.compareProjectEnvironmentFromRevisionForDeploy) {
        throw new Error('compareProjectEnvironmentFromRevisionForDeploy not mocked')
      }

      return capabilities.compareProjectEnvironmentFromRevisionForDeploy(projectId, environment, revision, refType)
    },

    async waitProjectDeployForCompletion (projectId, pipelineId) {
      if (!capabilities.waitProjectDeployForCompletion) {
        throw new Error('waitProjectDeployForCompletion not mocked')
      }

      return capabilities.waitProjectDeployForCompletion(projectId, pipelineId)
    },
  } as APIClient

  const client = await TestMCPServer((server) => {
    addDeployCapabilities(server, apiClient)
  })

  return client
}

suite('setup deploy tools', () => {
  test('should setup deploy tools to a server', async (t) => {
    const client = await TestMCPServer((server) => {
      addDeployCapabilities(server, {} as APIClient)
    })

    const result = await client.request(
      {
        method: 'tools/list',
      },
      ListToolsResultSchema,
    )

    t.assert.equal(result.tools.length, 3)
  })
})

suite('deploy project tool', () => {
  const deployProjectEnvironmentFromRevisionMockFn = mock.fn(async (projectId: string, _environment: string, _revision: string, _refType: string) => {
    if (projectId === 'error-project') {
      throw new Error('error message')
    }

    return triggerDeployResponse
  })

  it('returns error - if getProjectInfo fails', async (t) => {
    const testProjectId = 'project123'
    const revision = 'main'
    const environment = 'development'
    const refType = 'revision'

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
        name: 'deploy_project',
        arguments: {
          projectId: testProjectId,
          revision,
          refType,
          environment,
        },
      },
    }, CallToolResultSchema)

    t.assert.deepEqual(result.content, [
      {
        text: `Error deploying project: ${expectedError}`,
        type: 'text',
      },
    ])
  })

  it('returns error - if ai features are not enabled for tenant', async (t) => {
    const testTenantId = 'tenant123'
    const testProjectId = 'project123'
    const revision = 'main'
    const environment = 'development'
    const refType = 'revision'

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
      getProjectInfoMockFn,
      isAiFeaturesEnabledForTenantMockFn: aiFeaturesMockFn,
    })
    const result = await client.request({
      method: 'tools/call',
      params: {
        name: 'deploy_project',
        arguments: {
          projectId: testProjectId,
          revision,
          refType,
          environment,
        },
      },
    }, CallToolResultSchema)

    t.assert.deepEqual(result.content, [
      {
        text: `Error deploying project: ${ERR_AI_FEATURES_NOT_ENABLED} '${testTenantId}'`,
        type: 'text',
      },
    ])
  })

  it('triggers a deployment correctly', async (t) => {
    const testTenantId = 'tenant123'
    const testProjectId = 'project123'
    const revision = 'main'
    const environment = 'development'
    const refType = 'revision'

    const getProjectInfoMockFn = mock.fn(async (projectId: string) => {
      assert.equal(projectId, testProjectId)
      return {
        id: projectId,
        tenantId: testTenantId,
      } as unknown as IProject
    })

    const client = await getTestMCPServerClient({
      getProjectInfoMockFn,
      isAiFeaturesEnabledForTenantMockFn: async () => true,

      deployProjectEnvironmentFromRevision: deployProjectEnvironmentFromRevisionMockFn,
    })
    const result = await client.request({
      method: 'tools/call',
      params: {
        name: 'deploy_project',
        arguments: {
          projectId: testProjectId,
          revision,
          refType,
          environment,
        },
      },
    }, CallToolResultSchema)

    t.assert.deepEqual(result.content, [
      {
        text: `URL to check the deployment status: ${triggerDeployResponse.url} for pipeline with id ${triggerDeployResponse.id}`,
        type: 'text',
      },
    ])
  })

  it('returns error - if depoloy request fails', async (t) => {
    const testTenantId = 'tenant123'
    const testProjectId = 'error-project'
    const revision = 'main'
    const environment = 'development'
    const refType = 'revision'

    const getProjectInfoMockFn = mock.fn(async (projectId: string) => {
      assert.equal(projectId, testProjectId)
      return {
        id: projectId,
        tenantId: testTenantId,
      } as unknown as IProject
    })

    const client = await getTestMCPServerClient({
      getProjectInfoMockFn,
      isAiFeaturesEnabledForTenantMockFn: async () => true,

      deployProjectEnvironmentFromRevision: deployProjectEnvironmentFromRevisionMockFn,
    })
    const result = await client.request({
      method: 'tools/call',
      params: {
        name: 'deploy_project',
        arguments: {
          projectId: testProjectId,
          revision,
          refType,
          environment,
        },
      },
    }, CallToolResultSchema)

    t.assert.deepEqual(result.content, [
      {
        text: 'Error deploying project: error message',
        type: 'text',
      },
    ])
  })
})

suite('compare_update_for_deploy tool', () => {
  const compareProjectEnvironmentFromRevisionForDeployMockFn = mock.fn(async (projectId: string, _environment: string, _revision: string, _refType: string) => {
    if (projectId === 'error-project') {
      throw new Error('error message')
    }

    return compareUpdateResponse
  })

  it('returns error - if getProjectInfo fails', async (t) => {
    const testProjectId = 'project123'
    const revision = 'main'
    const environment = 'development'
    const refType = 'revision'

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
        name: 'compare_update_for_deploy',
        arguments: {
          projectId: testProjectId,
          revision,
          refType,
          environment,
        },
      },
    }, CallToolResultSchema)

    t.assert.deepEqual(result.content, [
      {
        text: `Error retrieving configuration updates: ${expectedError}`,
        type: 'text',
      },
    ])
  })

  it('returns error - if ai features are not enabled for tenant', async (t) => {
    const testTenantId = 'tenant123'
    const testProjectId = 'project123'
    const revision = 'main'
    const environment = 'development'
    const refType = 'revision'

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
      getProjectInfoMockFn,
      isAiFeaturesEnabledForTenantMockFn: aiFeaturesMockFn,
    })
    const result = await client.request({
      method: 'tools/call',
      params: {
        name: 'compare_update_for_deploy',
        arguments: {
          projectId: testProjectId,
          revision,
          refType,
          environment,
        },
      },
    }, CallToolResultSchema)

    t.assert.deepEqual(result.content, [
      {
        text: `Error retrieving configuration updates: ${ERR_AI_FEATURES_NOT_ENABLED} '${testTenantId}'`,
        type: 'text',
      },
    ])
  })

  test('should retrieve configuration updates for deploy', async (t) => {
    const testTenantId = 'tenant123'
    const testProjectId = 'project123'
    const revision = 'main'
    const environment = 'development'
    const refType = 'revision'

    const getProjectInfoMockFn = mock.fn(async (projectId: string) => {
      assert.equal(projectId, testProjectId)
      return {
        id: projectId,
        tenantId: testTenantId,
      } as unknown as IProject
    })

    const client = await getTestMCPServerClient({
      getProjectInfoMockFn,
      isAiFeaturesEnabledForTenantMockFn: async () => true,
      compareProjectEnvironmentFromRevisionForDeploy: compareProjectEnvironmentFromRevisionForDeployMockFn,
    })
    const result = await client.request({
      method: 'tools/call',
      params: {
        name: 'compare_update_for_deploy',
        arguments: {
          projectId: testProjectId,
          revision,
          refType,
          environment,
        },
      },
    }, CallToolResultSchema)

    t.assert.deepEqual(result.content, [
      {
        text: JSON.stringify(compareUpdateResponse),
        type: 'text',
      },
    ])
  })

  test('should return error message if compare update request returns error', async (t) => {
    const testTenantId = 'tenant123'
    const testProjectId = 'error-project'
    const revision = 'main'
    const environment = 'development'
    const refType = 'revision'

    const getProjectInfoMockFn = mock.fn(async (projectId: string) => {
      assert.equal(projectId, testProjectId)
      return {
        id: projectId,
        tenantId: testTenantId,
      } as unknown as IProject
    })

    const client = await getTestMCPServerClient({
      getProjectInfoMockFn,
      isAiFeaturesEnabledForTenantMockFn: async () => true,
      compareProjectEnvironmentFromRevisionForDeploy: compareProjectEnvironmentFromRevisionForDeployMockFn,
    })
    const result = await client.request({
      method: 'tools/call',
      params: {
        name: 'compare_update_for_deploy',
        arguments: {
          projectId: testProjectId,
          revision,
          refType,
          environment,
        },
      },
    }, CallToolResultSchema)

    t.assert.deepEqual(result.content, [
      {
        text: 'Error retrieving configuration updates: error message',
        type: 'text',
      },
    ])
  })
})

suite('deploy_pipeline_status tool', () => {
  const successStatus = { status: 'success' }

  const waitProjectDeployForCompletionMockFn = mock.fn(async (projectId: string, _pipelineId: string) => {
    if (projectId === 'error-project') {
      throw new Error('error message')
    }

    return successStatus
  })

  it('returns error - if getProjectInfo fails', async (t) => {
    const testProjectId = 'project123'
    const pipelineId = '456'

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
        name: 'deploy_pipeline_status',
        arguments: {
          projectId: testProjectId,
          pipelineId,
        },
      },
    }, CallToolResultSchema)

    t.assert.deepEqual(result.content, [
      {
        text: `Error deploying project: ${expectedError}`,
        type: 'text',
      },
    ])
  })

  it('returns error - if ai features are not enabled for tenant', async (t) => {
    const testTenantId = 'tenant123'
    const testProjectId = 'project123'
    const pipelineId = '456'

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
      getProjectInfoMockFn,
      isAiFeaturesEnabledForTenantMockFn: aiFeaturesMockFn,
    })
    const result = await client.request({
      method: 'tools/call',
      params: {
        name: 'deploy_pipeline_status',
        arguments: {
          projectId: testProjectId,
          pipelineId,
        },
      },
    }, CallToolResultSchema)

    t.assert.deepEqual(result.content, [
      {
        text: `Error deploying project: ${ERR_AI_FEATURES_NOT_ENABLED} '${testTenantId}'`,
        type: 'text',
      },
    ])
  })

  test('should get pipeline status successfully', async (t) => {
    const testTenantId = 'tenant123'
    const testProjectId = 'project123'
    const pipelineId = '456'

    const getProjectInfoMockFn = mock.fn(async (projectId: string) => {
      assert.equal(projectId, testProjectId)
      return {
        id: projectId,
        tenantId: testTenantId,
      } as unknown as IProject
    })

    const client = await getTestMCPServerClient({
      getProjectInfoMockFn,
      isAiFeaturesEnabledForTenantMockFn: async () => true,
      waitProjectDeployForCompletion: waitProjectDeployForCompletionMockFn,
    })
    const result = await client.request({
      method: 'tools/call',
      params: {
        name: 'deploy_pipeline_status',
        arguments: {
          projectId: testProjectId,
          pipelineId,
        },
      },
    }, CallToolResultSchema)

    t.assert.deepEqual(result.content, [
      {
        text: `Pipeline status: ${successStatus.status}`,
        type: 'text',
      },
    ])
  })

  test('should return error message if pipeline status request returns error', async (t) => {
    const testTenantId = 'tenant123'
    const testProjectId = 'error-project'
    const pipelineId = '456'

    const getProjectInfoMockFn = mock.fn(async (projectId: string) => {
      assert.equal(projectId, testProjectId)
      return {
        id: projectId,
        tenantId: testTenantId,
      } as unknown as IProject
    })

    const client = await getTestMCPServerClient({
      getProjectInfoMockFn,
      isAiFeaturesEnabledForTenantMockFn: async () => true,
      waitProjectDeployForCompletion: waitProjectDeployForCompletionMockFn,
    })
    const result = await client.request({
      method: 'tools/call',
      params: {
        name: 'deploy_pipeline_status',
        arguments: {
          projectId: testProjectId,
          pipelineId,
        },
      },
    }, CallToolResultSchema)

    t.assert.deepEqual(result.content, [
      {
        text: 'Error deploying project: error message',
        type: 'text',
      },
    ])
  })
})
