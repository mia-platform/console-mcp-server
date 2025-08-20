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

import { addServicesCapabilities } from '.'
import { ERR_AI_FEATURES_NOT_ENABLED } from '../utils/validations'
import { TestMCPServer } from '../../server/utils.test'
import { toolNames } from '../descriptions'
import {
  APIClientMock,
  APIClientMockFunctions,
} from '../../apis/client'

const name = 'name'
const description = 'description'
const refId = 'reference-id'
const marketplaceItemId = 'item-id'
const marketplaceItemTenantId = 'tenant-id'
const marketplaceItemVersion = 'version'

const saveResponse = {
  id: 'save-id',
}

async function getTestMCPServerClient (mocks: APIClientMockFunctions): Promise<Client> {
  const client = await TestMCPServer((server) => {
    addServicesCapabilities(server, new APIClientMock(mocks))
  })

  return client
}

suite('setup services tools', () => {
  test('should setup services tools to a server', async (t) => {
    const client = await TestMCPServer((server) => {
      addServicesCapabilities(server, new APIClientMock({}))
    })

    const result = await client.request(
      {
        method: 'tools/list',
      },
      ListToolsResultSchema,
    )

    t.assert.equal(result.tools.length, 1)
  })
})

suite('create service from marketplace tool', () => {
  const createServiceFromMarketplaceItemMockFn = mock.fn(async (projectID: string) => {
    if (projectID === 'error-project') {
      throw new Error('error message')
    }
    return saveResponse
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
        name: toolNames.CREATE_SERVICE_FROM_MARKETPLACE,
        arguments: {
          projectId: testProjectId,
          name,
          description,
          refId,
          marketplaceItemId,
          marketplaceItemTenantId,
          marketplaceItemVersion,
        },
      },
    }, CallToolResultSchema)

    t.assert.deepEqual(result.content, [
      {
        text: `Error creating ${name} service: ${expectedError}`,
        type: 'text',
      },
    ])
  })

  it('returns error - if ai features are not enabled for tenant', async (t) => {
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
      getProjectInfoMockFn,
      isAiFeaturesEnabledForTenantMockFn: aiFeaturesMockFn,
    })

    const result = await client.request({
      method: 'tools/call',
      params: {
        name: toolNames.CREATE_SERVICE_FROM_MARKETPLACE,
        arguments: {
          projectId: testProjectId,
          name,
          description,
          refId,
          marketplaceItemId,
          marketplaceItemTenantId,
          marketplaceItemVersion,
        },
      },
    }, CallToolResultSchema)

    t.assert.deepEqual(result.content, [
      {
        text: `Error creating ${name} service: ${ERR_AI_FEATURES_NOT_ENABLED} '${testTenantId}'`,
        type: 'text',
      },
    ])
  })

  test('should create a service from marketplace item', async (t) => {
    const testTenantId = 'tenant123'
    const testProjectId = 'project123'

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
      createServiceFromMarketplaceItemMockFn,
    })

    const result = await client.request({
      method: 'tools/call',
      params: {
        name: toolNames.CREATE_SERVICE_FROM_MARKETPLACE,
        arguments: {
          projectId: testProjectId,
          name,
          description,
          refId,
          marketplaceItemId,
          marketplaceItemTenantId,
          marketplaceItemVersion,
        },
      },
    }, CallToolResultSchema)

    t.assert.deepEqual(result.content, [
      {
        text: JSON.stringify(saveResponse),
        type: 'text',
      },
    ])
  })

  test('should return error when service creation fails', async (t) => {
    const testTenantId = 'tenant123'
    const testProjectId = 'error-project'

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
      createServiceFromMarketplaceItemMockFn,
    })

    const result = await client.request({
      method: 'tools/call',
      params: {
        name: toolNames.CREATE_SERVICE_FROM_MARKETPLACE,
        arguments: {
          projectId: testProjectId,
          name,
          description,
          refId,
          marketplaceItemId,
          marketplaceItemTenantId,
          marketplaceItemVersion,
        },
      },
    }, CallToolResultSchema)

    t.assert.deepEqual(result.content, [
      {
        text: `Error creating ${name} service: error message`,
        type: 'text',
      },
    ])
  })
})
