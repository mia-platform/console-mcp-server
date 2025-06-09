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

import { addGovernanceCapabilities } from '.'
import { APIClient } from '../../apis/client'
import { Template } from '../../apis/types/governance'
import { TestMCPServer } from '../../server/utils.test'

// Project tools tests

const projects = [
  { _id: 1, name: 'name', tenantId: 'tenantID' },
  { _id: 2, name: 'name', tenantId: 'tenantID' },
  { _id: 1, name: 'name', tenantId: 'tenantID2' },
]

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
      addGovernanceCapabilities(server, {} as APIClient)
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
      addGovernanceCapabilities(server, {
        async listProjects (_tenantIds: string[], search?: string): Promise<Record<string, unknown>[]> {
          if (search === 'error') {
            throw new Error('error message')
          }
          return projects
        },
      } as APIClient)
    })
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

  test('should return error message if request return error', async (t) => {
    const result = await client.request({
      method: 'tools/call',
      params: {
        name: 'list_projects',
        arguments: {
          tenantIds: [ 'error' ],
          search: 'error',
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
})

suite('get project info', () => {
  let client: Client
  beforeEach(async () => {
    client = await TestMCPServer((server) => {
      addGovernanceCapabilities(server, {
        async projectInfo (projectId: string): Promise<Record<string, unknown>> {
          if (projectId === 'error') {
            throw new Error('error message')
          }
          return project
        },
      } as APIClient)
    })
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
      addGovernanceCapabilities(server, {
        async createProjectFromTemplate (
          tenantID: string,
          _projectName: string,
          _templateID: string,
          _description?: string,
        ): Promise<Record<string, unknown>> {
          if (tenantID === 'error') {
            throw new Error('error message')
          }
          return project
        },
      } as APIClient)
    })
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

const templates: Template[] = [
  {
    templateId: 'template-1-id', name: 'template1', tenantId: 'tenantID', deploy: {},
  },
  {
    templateId: 'template-2-id', name: 'template2', tenantId: 'tenantID', deploy: {},
  },
]

const expectedTemplatesToolOutput = [
  {
    templateId: 'template-1-id', name: 'template1',
  },
  {
    templateId: 'template-2-id', name: 'template2',
  },
]

const iamList = [
  { name: 'name', type: 'type' },
  { name: 'name', type: 'group' },
]

const auditLogs = [
  { id: 1, log: 'log' },
  { id: 2, log: 'log2' },
]

suite('companies list tool', () => {
  test('should return companies', async (t) => {
    const client = await TestMCPServer((server) => {
      addGovernanceCapabilities(server, {
        async listCompanies (): Promise<Record<string, unknown>[]> {
          return companies
        },
      } as APIClient)
    })

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
    const client = await TestMCPServer((server) => {
      addGovernanceCapabilities(server, {
        async listCompanies (): Promise<Record<string, unknown>[]> {
          throw new Error('error message')
        },
      } as APIClient)
    })

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
      addGovernanceCapabilities(server, {
        async companyTemplates (tenantID: string): Promise<Template[]> {
          if (tenantID === 'error') {
            throw new Error('error message')
          }

          return templates
        },
      } as APIClient)
    })
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
        text: JSON.stringify(expectedTemplatesToolOutput),
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
      addGovernanceCapabilities(server, {
        async companyIAMIdentities (tenantID: string, _type?: string): Promise<Record<string, unknown>[]> {
          if (tenantID === 'error') {
            throw new Error('error message')
          }
          return iamList
        },
      } as APIClient)
    })
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
      addGovernanceCapabilities(server, {
        async companyAuditLogs (tenantID: string, _from?: string, _to?: string): Promise<Record<string, unknown>[]> {
          if (tenantID === 'error') {
            throw new Error('error message')
          }
          return auditLogs
        },
      } as APIClient)
    })
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
