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

import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { CallToolResultSchema, ListToolsResultSchema } from '@modelcontextprotocol/sdk/types.js'

import { addDeployCapabilities } from '.'
import { APIClient } from '../../apis/client'
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
  let client: Client

  beforeEach(async () => {
    client = await TestMCPServer((server) => {
      addDeployCapabilities(server, {
        async deployProjectEnvironmentFromRevision (projectId, _environment, _revision, _refType) {
          if (projectId === 'error-project') {
            throw new Error('error message')
          }

          return triggerDeployResponse
        },
      } as APIClient)
    })
  })

  test('should trigger a deployment', async (t) => {
    const projectId = 'project123'
    const revision = 'main'
    const environment = 'development'
    const refType = 'revision'

    const result = await client.request({
      method: 'tools/call',
      params: {
        name: 'deploy_project',
        arguments: {
          projectId,
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

  test('should return error message if request returns error', async (t) => {
    const projectId = 'error-project'
    const revision = 'main'
    const environment = 'development'
    const refType = 'revision'

    const result = await client.request({
      method: 'tools/call',
      params: {
        name: 'deploy_project',
        arguments: {
          projectId,
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
  let client: Client

  beforeEach(async () => {
    client = await TestMCPServer((server) => {
      addDeployCapabilities(server, {
        async compareProjectEnvironmentFromRevisionForDeploy (projectId, _environment, _revision, _refType) {
          if (projectId === 'error-project') {
            throw new Error('error message')
          }

          return compareUpdateResponse
        },
      } as APIClient)
    })
  })

  test('should retrieve configuration updates for deploy', async (t) => {
    const projectId = 'project123'
    const revision = 'main'
    const environment = 'development'
    const refType = 'revision'

    const result = await client.request({
      method: 'tools/call',
      params: {
        name: 'compare_update_for_deploy',
        arguments: {
          projectId,
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
    const projectId = 'error-project'
    const revision = 'main'
    const environment = 'development'
    const refType = 'revision'

    const result = await client.request({
      method: 'tools/call',
      params: {
        name: 'compare_update_for_deploy',
        arguments: {
          projectId,
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
  let client: Client
  const successStatus = { status: 'success' }

  beforeEach(async () => {
    client = await TestMCPServer((server) => {
      addDeployCapabilities(server, {
        async waitProjectDeployForCompletion (projectId, _pipelineId) {
          if (projectId === 'error-project') {
            throw new Error('error message')
          }

          return successStatus
        },
      } as APIClient)
    })
  })

  test('should get pipeline status successfully', async (t) => {
    const projectId = 'project123'
    const pipelineId = '456'

    const result = await client.request({
      method: 'tools/call',
      params: {
        name: 'deploy_pipeline_status',
        arguments: {
          projectId,
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
    const projectId = 'error-project'
    const pipelineId = '456'

    const result = await client.request({
      method: 'tools/call',
      params: {
        name: 'deploy_pipeline_status',
        arguments: {
          projectId,
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
