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

import { addRuntimeCapabilities } from '.'
import { ERR_AI_FEATURES_NOT_ENABLED } from '../utils/validations'
import { TestMCPServer } from '../../server/utils.test'
import { toolNames } from '../descriptions'
import {
  APIClientMock,
  APIClientMockFunctions,
} from '../../apis/client'

const pods = [
  { name: 'test-pod', status: 'running' },
  { name: 'test-pod-2', status: 'completed' },
]

const logs = `{"level":"info","time":"2025-05-09T08:41:36.530819Z","scope":"upstream","message":"lds: add/update listener 'frontend'"}
{"level":"info","time":"2025-05-09T08:41:36.530839Z","scope":"config","message":"all dependencies initialized. starting workers"}`

async function getTestMCPServerClient (mocks: APIClientMockFunctions): Promise<Client> {
  const client = await TestMCPServer((server) => {
    addRuntimeCapabilities(server, new APIClientMock(mocks))
  })

  return client
}

suite('setup runtime tools', () => {
  test('should setup runtime tools to a server', async (t: it.TestContext) => {
    const client = await TestMCPServer((server) => {
      addRuntimeCapabilities(server, new APIClientMock({}))
    })

    const result = await client.request(
      {
        method: 'tools/list',
      },
      ListToolsResultSchema,
    )

    t.assert.equal(result.tools.length, 2)
  })
})

suite('list pods tool', () => {
  const listPodsMockFn = mock.fn(async (projectId: string, _environmentId: string) => {
    if (projectId === 'error-project') {
      throw new Error('error message')
    }

    return pods
  })

  it('returns error - if getProjectInfo fails', async (t: it.TestContext) => {
    const testProjectId = 'project123'
    const environmentId = 'test-environment'

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
        name: 'list_pods',
        arguments: {
          projectId: testProjectId,
          environmentId,
        },
      },
    }, CallToolResultSchema)

    t.assert.deepEqual(result.content, [
      {
        text: `Error fetching pods: ${expectedError}`,
        type: 'text',
      },
    ])
  })

  it('returns error - if AI features are not enabled for tenant', async (t: it.TestContext) => {
    const testTenantId = 'tenant123'
    const testProjectId = 'project123'
    const environmentId = 'test-environment'

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
        name: 'list_pods',
        arguments: {
          projectId: testProjectId,
          environmentId,
        },
      },
    }, CallToolResultSchema)

    t.assert.ok(result.isError)
    t.assert.deepEqual(result.content, [
      {
        text: `Error fetching pods: ${ERR_AI_FEATURES_NOT_ENABLED} '${testTenantId}'`,
        type: 'text',
      },
    ])
  })

  test('should list pods', async (t: it.TestContext) => {
    const testTenantId = 'tenant123'
    const testProjectId = 'test-project'
    const environmentId = 'test-environment'

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
      listPodsMockFn,
    })
    const result = await client.request({
      method: 'tools/call',
      params: {
        name: toolNames.LIST_PODS,
        arguments: {
          projectId: testProjectId,
          environmentId,
        },
      },
    }, CallToolResultSchema)

    t.assert.deepEqual(result.content, [
      {
        text: `Pods: ${JSON.stringify(pods)}`,
        type: 'text',
      },
    ])
  })

  test('should return error when pods are not found', async (t: it.TestContext) => {
    const testTenantId = 'tenant123'
    const testProjectId = 'error-project'
    const environmentId = 'test-environment'

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
      listPodsMockFn,
    })
    const result = await client.request({
      method: 'tools/call',
      params: {
        name: 'list_pods',
        arguments: {
          projectId: testProjectId,
          environmentId,
        },
      },
    }, CallToolResultSchema)

    t.assert.ok(result.isError)
    t.assert.deepEqual(result.content, [
      {
        text: 'Error fetching pods: error message',
        type: 'text',
      },
    ])
  })
})

suite('get pod logs tool', () => {
  const podLogsMockFn = mock.fn(async (projectId: string, _environmentId: string, _podName: string, _containerName: string, _lines?: number) => {
    if (projectId === 'error-project') {
      throw new Error('error message')
    }

    return logs
  })

  it('returns error - if getProjectInfo fails', async (t: it.TestContext) => {
    const testProjectId = 'project123'
    const environmentId = 'test-environment'
    const podName = 'test-pod'
    const containerName = 'test-container'

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
        name: toolNames.GET_POD_LOGS,
        arguments: {
          projectId: testProjectId,
          environmentId,
          podName,
          containerName,
        },
      },
    }, CallToolResultSchema)

    t.assert.ok(result.isError)
    t.assert.deepEqual(result.content, [
      {
        text: `Error fetching logs for container ${containerName} in pod ${podName}: ${expectedError}`,
        type: 'text',
      },
    ])
  })

  it('returns error - if AI features are not enabled for tenant', async (t: it.TestContext) => {
    const testTenantId = 'tenant123'
    const testProjectId = 'project123'
    const environmentId = 'test-environment'
    const podName = 'test-pod'
    const containerName = 'test-container'

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
        name: toolNames.GET_POD_LOGS,
        arguments: {
          projectId: testProjectId,
          environmentId,
          podName,
          containerName,
        },
      },
    }, CallToolResultSchema)

    t.assert.ok(result.isError)
    t.assert.deepEqual(result.content, [
      {
        text: `Error fetching logs for container ${containerName} in pod ${podName}: ${ERR_AI_FEATURES_NOT_ENABLED} '${testTenantId}'`,
        type: 'text',
      },
    ])
  })

  test('should return logs', async (t: it.TestContext) => {
    const testTenantId = 'tenant123'
    const testProjectId = 'test-project'
    const environmentId = 'test-environment'
    const podName = 'test-pod'
    const containerName = 'test-container'

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
      podLogsMockFn,
    })
    const result = await client.request({
      method: 'tools/call',
      params: {
        name: toolNames.GET_POD_LOGS,
        arguments: {
          projectId: testProjectId,
          environmentId,
          podName,
          containerName,
        },
      },
    }, CallToolResultSchema)

    t.assert.deepEqual(result.content[0].text, `Logs for container ${containerName} in pod ${podName}: ${logs}`)
  })

  test('should return error when logs are not found', async (t: it.TestContext) => {
    const testTenantId = 'tenant123'
    const testProjectId = 'error-project'
    const environmentId = 'test-environment'
    const podName = 'test-pod'
    const containerName = 'test-container'

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
      podLogsMockFn,
    })
    const result = await client.request({
      method: 'tools/call',
      params: {
        name: toolNames.GET_POD_LOGS,
        arguments: {
          projectId: testProjectId,
          environmentId,
          podName,
          containerName,
        },
      },
    }, CallToolResultSchema)

    t.assert.ok(result.isError)
    t.assert.deepEqual(result.content, [
      {
        text: `Error fetching logs for container ${containerName} in pod ${podName}: error message`,
        type: 'text',
      },
    ])
  })
})
