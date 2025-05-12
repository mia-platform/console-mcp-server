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

import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { beforeEach, suite, test } from 'node:test'
import { CallToolResultSchema, ListToolsResultSchema } from '@modelcontextprotocol/sdk/types.js'
import { MockAgent, setGlobalDispatcher } from 'undici'

import { addGovernanceCapabilities } from '.'
import { APIClient } from '../../lib/client'
import { ProjectDraft } from './types'
import { getAppContext, TestMCPServer } from '../../server/test-utils.test'

const mockedEndpoint = 'http://localhost:3000'

// Project tools tests

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

suite('setup governance tools', () => {
  test('should setup tools to a server', async (t) => {
    const client = await TestMCPServer((server) => {
      const apiClient = new APIClient(mockedEndpoint)
      addGovernanceCapabilities(server, getAppContext({ client: apiClient }))
    })

    const result = await client.request(
      {
        method: 'tools/list',
      },
      ListToolsResultSchema,
    )

    t.assert.equal(result.tools.length, 7)
  })
})

suite('projects list tool', () => {
  let client: Client
  beforeEach(async () => {
    client = await TestMCPServer((server) => {
      const apiClient = new APIClient(mockedEndpoint)
      addGovernanceCapabilities(server, getAppContext({ client: apiClient }))
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
      addGovernanceCapabilities(server, getAppContext({ client: apiClient }))
    })

    const agent = new MockAgent()
    setGlobalDispatcher(agent)

    agent.get(mockedEndpoint).intercept({
      path: '/api/backend/projects/projectID/',
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
    }).reply(200, project)

    agent.get(mockedEndpoint).intercept({
      path: '/api/backend/projects/error/',
      method: 'GET',
      headers: {
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
      addGovernanceCapabilities(server, getAppContext({ client: apiClient }))
    })

    const agent = new MockAgent()
    setGlobalDispatcher(agent)

    agent.get(mockedEndpoint).intercept({
      path: '/api/backend/projects/draft',
      method: 'GET',
      headers: {
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
        Accept: 'application/json',
      },
    }).reply(200, project)

    agent.get(mockedEndpoint).intercept({
      path: '/api/backend/projects/draft',
      method: 'GET',
      headers: {
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

// Tenant tools tests

const companies = [
  { id: 1, name: 'name' },
  { id: 2, name: 'name2' },
]

const blueprint = {
  id: 1,
  name: 'name',
  templates: [
    {
      id: 1, name: 'template1',
    },
    {
      id: 2, name: 'template2',
    },
  ],
}

const groupIamList = [
  { name: 'name', type: 'group' },
]

const iamList = [
  { name: 'name', type: 'type' },
  ...groupIamList,
]

const auditLogs = [
  { id: 1, log: 'log' },
  { id: 2, log: 'log2' },
]

suite('companies list tool', () => {
  let client: Client
  let agent: MockAgent
  beforeEach(async () => {
    client = await TestMCPServer((server) => {
      const apiClient = new APIClient(mockedEndpoint)
      addGovernanceCapabilities(server, getAppContext({ client: apiClient }))
    })

    agent = new MockAgent()
    setGlobalDispatcher(agent)
  })

  test('should return companies', async (t) => {
    agent.get(mockedEndpoint).intercept({
      path: '/api/backend/tenants/',
      method: 'GET',
      query: {
        per_page: 200,
        page: 1,
      },
      headers: {
        Accept: 'application/json',
      },
    }).reply(200, companies)

    const result = await client.request({
      method: 'tools/call',
      params: {
        name: 'list_tenants',
        arguments: {},
      },
    }, CallToolResultSchema)

    t.assert.deepEqual(result.content, [
      {
        text: JSON.stringify(companies),
        type: 'text',
      },
    ])
  })

  test('should return error message if request return error', async (t) => {
    agent.get(mockedEndpoint).intercept({
      path: '/api/backend/tenants/',
      method: 'GET',
      query: {
        per_page: 200,
        page: 1,
      },
      headers: {
        Accept: 'application/json',
      },
    }).reply(500, { message: 'error message' })

    const result = await client.request({
      method: 'tools/call',
      params: {
        name: 'list_tenants',
        arguments: {},
      },
    }, CallToolResultSchema)

    t.assert.deepEqual(result.content, [
      {
        text: 'Error fetching companies: error message',
        type: 'text',
      },
    ])
  })
})

suite('company list template', () => {
  let client: Client
  beforeEach(async () => {
    client = await TestMCPServer((server) => {
      const apiClient = new APIClient(mockedEndpoint)
      addGovernanceCapabilities(server, getAppContext({ client: apiClient }))
    })

    const agent = new MockAgent()
    setGlobalDispatcher(agent)

    agent.get(mockedEndpoint).intercept({
      path: '/api/backend/tenants/tenantID/project-blueprint/',
      method: 'GET',
      query: {},
      headers: {
        Accept: 'application/json',
      },
    }).reply(200, blueprint)

    agent.get(mockedEndpoint).intercept({
      path: '/api/backend/tenants/empty/project-blueprint/',
      method: 'GET',
      query: {},
      headers: {
        Accept: 'application/json',
      },
    }).reply(200, {})

    agent.get(mockedEndpoint).intercept({
      path: '/api/backend/tenants/error/project-blueprint/',
      method: 'GET',
      query: {},
      headers: {
        Accept: 'application/json',
      },
    }).reply(500, { message: 'error message' })
  })

  test('should return company templates', async (t) => {
    const result = await client.request({
      method: 'tools/call',
      params: {
        name: 'list_tenant_templates',
        arguments: {
          tenantId: 'tenantID',
        },
      },
    }, CallToolResultSchema)

    t.assert.deepEqual(result.content, [
      {
        text: JSON.stringify(blueprint.templates),
        type: 'text',
      },
    ])
  })

  test('should return empty array without templates object', async (t) => {
    const result = await client.request({
      method: 'tools/call',
      params: {
        name: 'list_tenant_templates',
        arguments: {
          tenantId: 'empty',
        },
      },
    }, CallToolResultSchema)

    t.assert.deepEqual(result.content, [
      {
        text: JSON.stringify([]),
        type: 'text',
      },
    ])
  })

  test('should return error message if request return error', async (t) => {
    const result = await client.request({
      method: 'tools/call',
      params: {
        name: 'list_tenant_templates',
        arguments: {
          tenantId: 'error',
        },
      },
    }, CallToolResultSchema)

    t.assert.deepEqual(result.content, [
      {
        text: 'Error fetching templates for company error: error message',
        type: 'text',
      },
    ])
  })
})

suite('iam list tool', () => {
  let client: Client
  beforeEach(async () => {
    client = await TestMCPServer((server) => {
      const apiClient = new APIClient(mockedEndpoint)
      addGovernanceCapabilities(server, getAppContext({ client: apiClient }))
    })

    const agent = new MockAgent()
    setGlobalDispatcher(agent)

    agent.get(mockedEndpoint).intercept({
      path: '/api/companies/tenantID/identities',
      method: 'GET',
      query: {
        per_page: 200,
        page: 0,
      },
      headers: {
        Accept: 'application/json',
      },
    }).reply(200, iamList)

    agent.get(mockedEndpoint).intercept({
      path: '/api/companies/tenantID/identities',
      method: 'GET',
      query: {
        per_page: 200,
        page: 0,
        identityType: 'group',
      },
      headers: {
        Accept: 'application/json',
      },
    }).reply(200, groupIamList)

    agent.get(mockedEndpoint).intercept({
      path: '/api/companies/error/identities',
      method: 'GET',
      query: {
        per_page: 200,
        page: 0,
      },
      headers: {
        Accept: 'application/json',
      },
    }).reply(500, { message: 'error message' })
  })

  test('should return complete iam list', async (t) => {
    const result = await client.request({
      method: 'tools/call',
      params: {
        name: 'list_tenant_iam',
        arguments: {
          tenantId: 'tenantID',
        },
      },
    }, CallToolResultSchema)

    t.assert.deepEqual(result.content, [
      {
        text: JSON.stringify(iamList),
        type: 'text',
      },
    ])
  })

  test('should return filtered iam list', async (t) => {
    const result = await client.request({
      method: 'tools/call',
      params: {
        name: 'list_tenant_iam',
        arguments: {
          tenantId: 'tenantID',
          identityType: 'group',
        },
      },
    }, CallToolResultSchema)

    t.assert.deepEqual(result.content, [
      {
        text: JSON.stringify(groupIamList),
        type: 'text',
      },
    ])
  })

  test('should return error message if request return error', async (t) => {
    const result = await client.request({
      method: 'tools/call',
      params: {
        name: 'list_tenant_iam',
        arguments: {
          tenantId: 'error',
        },
      },
    }, CallToolResultSchema)

    t.assert.deepEqual(result.content, [
      {
        text: 'Error fetching IAM for company error: error message',
        type: 'text',
      },
    ])
  })
})

suite('audit log', () => {
  let client: Client
  beforeEach(async () => {
    client = await TestMCPServer((server) => {
      const apiClient = new APIClient(mockedEndpoint)
      addGovernanceCapabilities(server, getAppContext({ client: apiClient }))
    })

    const agent = new MockAgent()
    setGlobalDispatcher(agent)

    agent.get(mockedEndpoint).intercept({
      path: '/api/tenants/tenantID/audit-logs',
      method: 'GET',
      query: {
        per_page: 200,
        page: 0,
        from: '1234567890',
        to: '1234567890',
      },
      headers: {
        Accept: 'application/json',
      },
    }).reply(200, auditLogs)

    agent.get(mockedEndpoint).intercept({
      path: '/api/tenants/error/audit-logs',
      method: 'GET',
      query: {
        per_page: 200,
        page: 0,
      },
      headers: {
        Accept: 'application/json',
      },
    }).reply(500, { message: 'error message' })
  })

  test('should return audit logs', async (t) => {
    const result = await client.request({
      method: 'tools/call',
      params: {
        name: 'view_audit_logs',
        arguments: {
          tenantId: 'tenantID',
          to: '1234567890',
          from: '1234567890',
        },
      },
    }, CallToolResultSchema)

    t.assert.deepEqual(result.content, [
      {
        text: JSON.stringify(auditLogs),
        type: 'text',
      },
    ])
  })

  test('should return error message if request return error', async (t) => {
    const result = await client.request({
      method: 'tools/call',
      params: {
        name: 'view_audit_logs',
        arguments: {
          tenantId: 'error',
        },
      },
    }, CallToolResultSchema)

    t.assert.deepEqual(result.content, [
      {
        text: 'Error fetching audit logs for company error: error message',
        type: 'text',
      },
    ])
  })
})
