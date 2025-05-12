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
import { MockAgent, setGlobalDispatcher } from 'undici'

import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { CallToolResultSchema, ListToolsResultSchema } from '@modelcontextprotocol/sdk/types.js'

import { addDeployCapabilities } from '.'
import { APIClient } from '../../lib/client'
import { TestMCPServer } from '../utils.test'

const mockedEndpoint = 'http://localhost:3000'

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
      const apiClient = new APIClient(mockedEndpoint)
      addDeployCapabilities(server, apiClient)
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
  let agent: MockAgent

  beforeEach(async () => {
    client = await TestMCPServer((server) => {
      const apiClient = new APIClient(mockedEndpoint)
      addDeployCapabilities(server, apiClient)
    })

    agent = new MockAgent()
    setGlobalDispatcher(agent)
  })

  test('should trigger a deployment', async (t) => {
    const projectId = 'project123'
    const revision = 'main'
    const environment = 'development'
    const refType = 'revision'

    agent.get(mockedEndpoint).intercept({
      path: `/api/deploy/projects/${projectId}/trigger/pipeline/`,
      method: 'POST',
      body: JSON.stringify({
        environment,
        revision,
        refType,
      }),
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    }).reply(200, triggerDeployResponse)

    const result = await client.request({
      method: 'tools/call',
      params: {
        name: 'deploy_project',
        arguments: {
          projectId,
          revision,
          refType: 'revision',
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

    agent.get(mockedEndpoint).intercept({
      path: `/api/deploy/projects/${projectId}/trigger/pipeline/`,
      method: 'POST',
      body: JSON.stringify({
        environment,
        revision,
        refType,
      }),
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    }).reply(500, { message: 'error message' })

    const result = await client.request({
      method: 'tools/call',
      params: {
        name: 'deploy_project',
        arguments: {
          projectId,
          revision,
          refType: 'revision',
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
  let agent: MockAgent

  beforeEach(async () => {
    client = await TestMCPServer((server) => {
      const apiClient = new APIClient(mockedEndpoint)
      addDeployCapabilities(server, apiClient)
    })

    agent = new MockAgent()
    setGlobalDispatcher(agent)
  })

  test('should retrieve configuration updates for deploy', async (t) => {
    const projectId = 'project123'
    const revision = 'main'
    const environment = 'development'
    const refType = 'revision'

    agent.get(mockedEndpoint).intercept({
      path: `/api/deploy/projects/${projectId}/compare/raw?fromEnvironment=${environment}&toRef=${revision}&refType=${refType}`,
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
    }).reply(200, compareUpdateResponse)

    const result = await client.request({
      method: 'tools/call',
      params: {
        name: 'compare_update_for_deploy',
        arguments: {
          projectId,
          revision,
          refType: 'revision',
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

    agent.get(mockedEndpoint).intercept({
      path: `/api/deploy/projects/${projectId}/compare/raw?fromEnvironment=${environment}&toRef=${revision}&refType=${refType}`,
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
    }).reply(500, { message: 'error message' })

    const result = await client.request({
      method: 'tools/call',
      params: {
        name: 'compare_update_for_deploy',
        arguments: {
          projectId,
          revision,
          refType: 'revision',
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
  let agent: MockAgent

  beforeEach(async () => {
    client = await TestMCPServer((server) => {
      const apiClient = new APIClient(mockedEndpoint)
      addDeployCapabilities(server, apiClient)
    })

    agent = new MockAgent()
    setGlobalDispatcher(agent)
  })

  test('should get pipeline status successfully', async (t) => {
    const projectId = 'project123'
    const pipelineId = '456'
    const successStatus = { status: 'success' }

    agent.get(mockedEndpoint).intercept({
      path: `/api/deploy/projects/${projectId}/pipelines/${pipelineId}/status/`,
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
    }).reply(200, successStatus)

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

  test('should handle numeric pipelineId', async (t) => {
    const projectId = 'project123'
    const pipelineId = 456
    const successStatus = { status: 'success' }

    agent.get(mockedEndpoint).intercept({
      path: `/api/deploy/projects/${projectId}/pipelines/${pipelineId}/status/`,
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
    }).reply(200, successStatus)

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

    agent.get(mockedEndpoint).intercept({
      path: `/api/deploy/projects/${projectId}/pipelines/${pipelineId}/status/`,
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
    }).reply(500, { message: 'error message' })

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

  test('should wait until pipeline completion', async (t) => {
    const projectId = 'timeout-project'
    const pipelineId = '456'
    const runningStatus = { status: 'running' }
    const successStatus = { status: 'success' }

    agent.get(mockedEndpoint).intercept({
      path: `/api/deploy/projects/${projectId}/pipelines/${pipelineId}/status/`,
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
    }).reply(200, runningStatus)

    agent.get(mockedEndpoint).intercept({
      path: `/api/deploy/projects/${projectId}/pipelines/${pipelineId}/status/`,
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
    }).reply(200, successStatus)

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
        text: 'Pipeline status: success',
        type: 'text',
      },
    ])
  })
})
