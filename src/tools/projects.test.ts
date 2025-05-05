// Copyright Mia srl
// SPDX-License-Identifier: Apache-2.0

// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at

//     http://www.apache.org/licenses/LICENSE-2.0

// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import { beforeEach, suite, test } from 'node:test'
import { MockAgent, setGlobalDispatcher } from 'undici'

import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { CallToolResultSchema, ListToolsResultSchema } from '@modelcontextprotocol/sdk/types.js'

import { addProjectsCapabilities } from './projects'
import { APIClient } from '../lib/client'
import { ProjectDraft } from '../types/project_draft'
import { TestMCPServer } from './utils.test'

const mockedEndpoint = 'http://localhost:3000'

const projects = [
  { id: 1, name: 'name', tenant: 'tenantID' },
  { id: 2, name: 'name', tenant: 'tenantID' },
]

const secondTenantProjects = [
  { id: 1, name: 'name', tenant: 'tenantID2' },
]

const draft: ProjectDraft = {
  templateId: 'templateID',
  repository: {
    providerId: 'providerId',
    gitPath: 'repository/path.git',
    visibility: 'visibility',
  },
}

const postProject = {
  name: 'Name',
  description: 'description',
  tenantId: 'tenantID',
  environments: [],
  configurationGitPath: 'repository/path.git',
  projectId: 'name',
  templateId: 'templateID',
  visibility: 'visibility',
  providerId: 'providerId',
  enableConfGenerationOnDeploy: true,
}

const project = {
  id: 1,
  name: 'Name',
  projectId: 'name',
  tenantId: 'tenantID',
  templateId: 'templateID',
  description: 'description',
}

suite('setup projects tools', () => {
  test('should setup projects tools to a server', async (t) => {
    const client = await TestMCPServer((server) => {
      const apiClient = new APIClient(mockedEndpoint)
      addProjectsCapabilities(server, apiClient)
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

suite('projects list tool', () => {
  let client: Client
  beforeEach(async () => {
    client = await TestMCPServer((server) => {
      const apiClient = new APIClient(mockedEndpoint)
      addProjectsCapabilities(server, apiClient)
    })

    const agent = new MockAgent()
    setGlobalDispatcher(agent)

    agent.get(mockedEndpoint).intercept({
      path: '/api/backend/projects/',
      method: 'GET',
      query: {
        per_page: 200,
        page: 1,
        tenantIds: 'tenantID',
      },
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    }).reply(200, projects)

    agent.get(mockedEndpoint).intercept({
      path: '/api/backend/projects/',
      method: 'GET',
      query: {
        per_page: 200,
        page: 1,
        tenantIds: 'tenantID,tenantID2',
      },
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    }).reply(200, [ ...projects, ...secondTenantProjects ])

    agent.get(mockedEndpoint).intercept({
      path: '/api/backend/projects/',
      method: 'GET',
      query: {
        per_page: 200,
        page: 1,
        tenantIds: 'error',
      },
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    }).reply(500, { message: 'error message' })
  })

  test('should return projects', async (t) => {
    const result = await client.request({
      method: 'tools/call',
      params: {
        name: 'list_projects',
        arguments: {
          tenantIds: [ 'tenantID' ],
        },
      },
    }, CallToolResultSchema)

    t.assert.deepEqual(result.content, [
      {
        text: JSON.stringify(projects),
        type: 'text',
      },
    ])
  })

  test('should return projects for multiple tenants', async (t) => {
    const result = await client.request({
      method: 'tools/call',
      params: {
        name: 'list_projects',
        arguments: {
          tenantIds: [ 'tenantID', 'tenantID2' ],
        },
      },
    }, CallToolResultSchema)

    t.assert.deepEqual(result.content, [
      {
        text: JSON.stringify([ ...projects, ...secondTenantProjects ]),
        type: 'text',
      },
    ])
  })

  test('should return error message if request return error', async (t) => {
    const result = await client.request({
      method: 'tools/call',
      params: {
        name: 'list_projects',
        arguments: {
          tenantIds: [ 'error' ],
        },
      },
    }, CallToolResultSchema)

    t.assert.deepEqual(result.content, [
      {
        text: 'Error fetching projects for error: error message',
        type: 'text',
      },
    ])
  })

  test('should return error if tenantId is not provided', async (t) => {
    t.assert.rejects(async () => {
      await client.request({
        method: 'tools/call',
        params: {
          name: 'list_projects',
          arguments: {
            tenantId: '',
          },
        },
      }, CallToolResultSchema)
    })
  })
})

suite('get project info', () => {
  let client: Client
  beforeEach(async () => {
    client = await TestMCPServer((server) => {
      const apiClient = new APIClient(mockedEndpoint)
      addProjectsCapabilities(server, apiClient)
    })

    const agent = new MockAgent()
    setGlobalDispatcher(agent)

    agent.get(mockedEndpoint).intercept({
      path: '/api/backend/projects/projectID/',
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    }).reply(200, project)

    agent.get(mockedEndpoint).intercept({
      path: '/api/backend/projects/error/',
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    }).reply(500, { message: 'error message' })
  })

  test('should return project info', async (t) => {
    const result = await client.request({
      method: 'tools/call',
      params: {
        name: 'get_project_info',
        arguments: {
          projectId: 'projectID',
        },
      },
    }, CallToolResultSchema)

    t.assert.deepEqual(result.content, [
      {
        text: JSON.stringify(project),
        type: 'text',
      },
    ])
  })

  test('should return error message if request return error', async (t) => {
    const result = await client.request({
      method: 'tools/call',
      params: {
        name: 'get_project_info',
        arguments: {
          projectId: 'error',
        },
      },
    }, CallToolResultSchema)

    t.assert.deepEqual(result.content, [
      {
        text: 'Error fetching project error: error message',
        type: 'text',
      },
    ])
  })
})

suite('create project from template', () => {
  let client: Client
  beforeEach(async () => {
    client = await TestMCPServer((server) => {
      const apiClient = new APIClient(mockedEndpoint)
      addProjectsCapabilities(server, apiClient)
    })

    const agent = new MockAgent()
    setGlobalDispatcher(agent)

    agent.get(mockedEndpoint).intercept({
      path: '/api/backend/projects/draft',
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      query: {
        tenantId: 'tenantID',
        projectId: 'name',
        templateId: 'templateID',
        projectName: 'Name',
      },
    }).reply(200, draft)

    agent.get(mockedEndpoint).intercept({
      path: '/api/backend/projects/',
      method: 'POST',
      body: JSON.stringify(postProject),
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    }).reply(200, project)

    agent.get(mockedEndpoint).intercept({
      path: '/api/backend/projects/draft',
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      query: {
        tenantId: 'error',
        projectId: 'name',
        templateId: 'templateID',
        projectName: 'Name',
      },
    }).reply(500, { message: 'error message' })
  })

  test('should create a new project', async (t) => {
    const result = await client.request({
      method: 'tools/call',
      params: {
        name: 'create_project_from_template',
        arguments: {
          tenantId: 'tenantID',
          templateId: 'templateID',
          projectName: 'Name',
          projectDescription: 'description',
        },
      },
    }, CallToolResultSchema)

    t.assert.deepEqual(result.content, [
      {
        text: JSON.stringify(project),
        type: 'text',
      },
    ])
  })

  test('should return error message if request return error', async (t) => {
    const result = await client.request({
      method: 'tools/call',
      params: {
        name: 'create_project_from_template',
        arguments: {
          tenantId: 'error',
          projectId: 'name',
          templateId: 'templateID',
          projectName: 'Name',
        },
      },
    }, CallToolResultSchema)

    t.assert.deepEqual(result.content, [
      {
        text: 'Error creating project from template templateID: error message',
        type: 'text',
      },
    ])
  })
})
