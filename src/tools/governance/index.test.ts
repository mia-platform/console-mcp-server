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
import { mock, suite, test } from 'node:test'

import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { IProject } from '@mia-platform/console-types'
import { CallToolResultSchema, ListToolsResultSchema } from '@modelcontextprotocol/sdk/types.js'

import { addGovernanceCapabilities } from '.'
import { APIClient } from '../../apis/client'
import { ERR_AI_FEATURES_NOT_ENABLED } from '../utils/validations'
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

interface CapabilitiesMocks {
  getProjectInfoMockFn?: (projectId: string) => Promise<IProject>
  isAiFeaturesEnabledForTenantMockFn?: (tenantId: string) => Promise<boolean>
  listProjectsMockFn?: (tenantIds: string[], search?: string) => Promise<Record<string, unknown>[]>
  createProjectFromTemplateMockFn?: (tenantId: string, projectName: string, templateId: string, description?: string) => Promise<Record<string, unknown>>
  listCompaniesMockFn?: () => Promise<Record<string, unknown>[]>
  companyTemplatesMockFn?: (tenantId: string) => Promise<Template[]>
  companyIAMIdentitiesMockFn?: (tenantId: string, type?: string) => Promise<Record<string, unknown>[]>
  companyAuditLogsMockFn?: (tenantId: string, from?: string, to?: string) => Promise<Record<string, unknown>[]>
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

    async listProjects (tenantIds: string[], search?: string): Promise<Record<string, unknown>[]> {
      if (!capabilities.listProjectsMockFn) {
        throw new Error('listProjectsMockFn not mocked')
      }

      return capabilities.listProjectsMockFn(tenantIds, search)
    },

    async createProjectFromTemplate (tenantId: string, projectName: string, templateId: string, description?: string): Promise<Record<string, unknown>> {
      if (!capabilities.createProjectFromTemplateMockFn) {
        throw new Error('createProjectFromTemplateMockFn not mocked')
      }

      return capabilities.createProjectFromTemplateMockFn(tenantId, projectName, templateId, description)
    },

    async listCompanies (): Promise<Record<string, unknown>[]> {
      if (!capabilities.listCompaniesMockFn) {
        throw new Error('listCompaniesMockFn not mocked')
      }

      return capabilities.listCompaniesMockFn()
    },

    async companyTemplates (tenantId: string): Promise<Template[]> {
      if (!capabilities.companyTemplatesMockFn) {
        throw new Error('companyTemplatesMockFn not mocked')
      }

      return capabilities.companyTemplatesMockFn(tenantId)
    },

    async companyIAMIdentities (tenantId: string, type?: string): Promise<Record<string, unknown>[]> {
      if (!capabilities.companyIAMIdentitiesMockFn) {
        throw new Error('companyIAMIdentitiesMockFn not mocked')
      }

      return capabilities.companyIAMIdentitiesMockFn(tenantId, type)
    },

    async companyAuditLogs (tenantId: string, from?: string, to?: string): Promise<Record<string, unknown>[]> {
      if (!capabilities.companyAuditLogsMockFn) {
        throw new Error('companyAuditLogsMockFn not mocked')
      }

      return capabilities.companyAuditLogsMockFn(tenantId, from, to)
    },
  } as APIClient

  const client = await TestMCPServer((server) => {
    addGovernanceCapabilities(server, apiClient)
  })

  return client
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
  const listProjectsMockFn = mock.fn(async (tenantIds: string[], search?: string) => {
    if (search === 'error' || tenantIds.includes('error')) {
      throw new Error('error message')
    }
    return projects
  })

  test('returns error - if AI features are not enabled for tenant', async (t) => {
    const testTenantIds = [ 'tenant123' ]

    const aiFeaturesMockFn = mock.fn(async (tenantId: string) => {
      assert.strictEqual(tenantId, testTenantIds[0])
      return false
    })

    const client = await getTestMCPServerClient({
      isAiFeaturesEnabledForTenantMockFn: aiFeaturesMockFn,
    })
    const result = await client.request({
      method: 'tools/call',
      params: {
        name: 'list_projects',
        arguments: {
          tenantIds: testTenantIds,
        },
      },
    }, CallToolResultSchema)

    t.assert.deepEqual(result.content, [
      {
        text: `Error fetching projects for ${testTenantIds.join(', ')}: ${ERR_AI_FEATURES_NOT_ENABLED} '${testTenantIds[0]}'`,
        type: 'text',
      },
    ])
  })

  test('should return projects', async (t) => {
    const testTenantIds = [ 'tenantID' ]

    const aiFeaturesMockFn = mock.fn(async (tenantId: string) => {
      assert.strictEqual(tenantId, testTenantIds[0])
      return true
    })

    const client = await getTestMCPServerClient({
      isAiFeaturesEnabledForTenantMockFn: aiFeaturesMockFn,
      listProjectsMockFn,
    })
    const result = await client.request({
      method: 'tools/call',
      params: {
        name: 'list_projects',
        arguments: {
          tenantIds: testTenantIds,
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
    const testTenantIds = [ 'error' ]

    const aiFeaturesMockFn = mock.fn(async (tenantId: string) => {
      assert.strictEqual(tenantId, testTenantIds[0])
      return true
    })

    const client = await getTestMCPServerClient({
      isAiFeaturesEnabledForTenantMockFn: aiFeaturesMockFn,
      listProjectsMockFn,
    })
    const result = await client.request({
      method: 'tools/call',
      params: {
        name: 'list_projects',
        arguments: {
          tenantIds: testTenantIds,
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
  test('returns error - if AI features are not enabled for tenant', async (t) => {
    const testTenantId = 'tenant123'
    const testProjectId = 'project123'

    const getProjectInfoForValidationMockFn = mock.fn(async (projectId: string) => {
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
      getProjectInfoMockFn: getProjectInfoForValidationMockFn,
      isAiFeaturesEnabledForTenantMockFn: aiFeaturesMockFn,
    })
    const result = await client.request({
      method: 'tools/call',
      params: {
        name: 'get_project_info',
        arguments: {
          projectId: testProjectId,
        },
      },
    }, CallToolResultSchema)

    t.assert.deepEqual(result.content, [
      {
        text: `Error fetching project ${testProjectId}: ${ERR_AI_FEATURES_NOT_ENABLED} '${testTenantId}'`,
        type: 'text',
      },
    ])
  })

  test('should return project info', async (t) => {
    const testTenantId = 'tenantID'
    const testProjectId = 'projectID'

    const getProjectInfoForValidationMockFn = mock.fn(async (projectId: string) => {
      assert.equal(projectId, testProjectId)
      return {
        ...project,
        tenantId: testTenantId,
      } as unknown as IProject
    })

    const client = await getTestMCPServerClient({
      getProjectInfoMockFn: getProjectInfoForValidationMockFn,
      isAiFeaturesEnabledForTenantMockFn: async () => true,
    })
    const result = await client.request({
      method: 'tools/call',
      params: {
        name: 'get_project_info',
        arguments: {
          projectId: testProjectId,
        },
      },
    }, CallToolResultSchema)

    t.assert.deepEqual(result.content, [
      {
        text: JSON.stringify({
          ...project,
          tenantId: testTenantId,
        }),
        type: 'text',
      },
    ])
  })

  test('should return error message if request return error', async (t) => {
    const testTenantId = 'tenantID'
    const testProjectId = 'error'

    const getProjectInfoForValidationMockFn = mock.fn(async (projectId: string) => {
      assert.equal(projectId, testProjectId)
      if (projectId === 'error') {
        throw new Error('error message')
      }
      return {
        ...project,
        tenantId: testTenantId,
      } as unknown as IProject
    })

    const client = await getTestMCPServerClient({
      getProjectInfoMockFn: getProjectInfoForValidationMockFn,
      isAiFeaturesEnabledForTenantMockFn: async () => true,
    })
    const result = await client.request({
      method: 'tools/call',
      params: {
        name: 'get_project_info',
        arguments: {
          projectId: testProjectId,
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
  test('returns error - if AI features are not enabled for tenant', async (t) => {
    const testTenantId = 'tenant123'

    const aiFeaturesMockFn = mock.fn(async (tenantId: string) => {
      assert.strictEqual(tenantId, testTenantId)
      return false
    })

    const client = await getTestMCPServerClient({
      isAiFeaturesEnabledForTenantMockFn: aiFeaturesMockFn,
    })
    const result = await client.request({
      method: 'tools/call',
      params: {
        name: 'create_project_from_template',
        arguments: {
          tenantId: testTenantId,
          templateId: 'templateID',
          projectName: 'Name',
          projectDescription: 'description',
        },
      },
    }, CallToolResultSchema)

    t.assert.deepEqual(result.content, [
      {
        text: `Error creating project from template templateID: ${ERR_AI_FEATURES_NOT_ENABLED} '${testTenantId}'`,
        type: 'text',
      },
    ])
  })

  test('should create a new project', async (t) => {
    const client = await getTestMCPServerClient({
      createProjectFromTemplateMockFn: async () => project,
      isAiFeaturesEnabledForTenantMockFn: async () => true,
    })
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
    const client = await getTestMCPServerClient({
      createProjectFromTemplateMockFn: async () => {
        throw new Error('error message')
      },
      isAiFeaturesEnabledForTenantMockFn: async () => true,
    })
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
  { tenantId: 1, name: 'name', defaultTemplateId: 'template-id-1' },
  { tenantId: 2, name: 'name2', defaultTemplateId: 'template-id-2' },
]

const templates: Template[] = [
  {
    templateId: 'template-1-id', name: 'template1', tenantId: 'tenantID', deploy: {},
  },
  {
    templateId: 'template-2-id', name: 'template2', tenantId: 'tenantID', deploy: {},
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
  test('returns error - if AI features are not enabled for tenant', async (t) => {
    const testTenantId = 'tenant123'

    const aiFeaturesMockFn = mock.fn(async (tenantId: string) => {
      assert.strictEqual(tenantId, testTenantId)
      return false
    })

    const client = await getTestMCPServerClient({
      isAiFeaturesEnabledForTenantMockFn: aiFeaturesMockFn,
    })
    const result = await client.request({
      method: 'tools/call',
      params: {
        name: 'list_tenant_templates',
        arguments: {
          tenantId: testTenantId,
        },
      },
    }, CallToolResultSchema)

    t.assert.deepEqual(result.content, [
      {
        text: `Error fetching templates for company ${testTenantId}: ${ERR_AI_FEATURES_NOT_ENABLED} '${testTenantId}'`,
        type: 'text',
      },
    ])
  })

  test('should list templates', async (t) => {
    const client = await getTestMCPServerClient({
      companyTemplatesMockFn: async () => templates,
      isAiFeaturesEnabledForTenantMockFn: async () => true,
    })
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
        text: JSON.stringify(templates),
        type: 'text',
      },
    ])
  })

  test('should return error message if request return error', async (t) => {
    const client = await getTestMCPServerClient({
      companyTemplatesMockFn: async () => {
        throw new Error('error message')
      },
      isAiFeaturesEnabledForTenantMockFn: async () => true,
    })
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
  test('returns error - if AI features are not enabled for tenant', async (t) => {
    const testTenantId = 'tenant123'

    const aiFeaturesMockFn = mock.fn(async (tenantId: string) => {
      assert.strictEqual(tenantId, testTenantId)
      return false
    })

    const client = await getTestMCPServerClient({
      isAiFeaturesEnabledForTenantMockFn: aiFeaturesMockFn,
    })
    const result = await client.request({
      method: 'tools/call',
      params: {
        name: 'list_tenant_iam',
        arguments: {
          tenantId: testTenantId,
        },
      },
    }, CallToolResultSchema)

    t.assert.deepEqual(result.content, [
      {
        text: `Error fetching IAM for company ${testTenantId}: ${ERR_AI_FEATURES_NOT_ENABLED} '${testTenantId}'`,
        type: 'text',
      },
    ])
  })

  test('should return complete iam list', async (t) => {
    const client = await getTestMCPServerClient({
      companyIAMIdentitiesMockFn: async () => iamList,
      isAiFeaturesEnabledForTenantMockFn: async () => true,
    })
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
    const client = await getTestMCPServerClient({
      companyIAMIdentitiesMockFn: async () => {
        throw new Error('error message')
      },
      isAiFeaturesEnabledForTenantMockFn: async () => true,
    })
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
  test('returns error - if AI features are not enabled for tenant', async (t) => {
    const testTenantId = 'tenant123'

    const aiFeaturesMockFn = mock.fn(async (tenantId: string) => {
      assert.strictEqual(tenantId, testTenantId)
      return false
    })

    const client = await getTestMCPServerClient({
      isAiFeaturesEnabledForTenantMockFn: aiFeaturesMockFn,
    })
    const result = await client.request({
      method: 'tools/call',
      params: {
        name: 'view_audit_logs',
        arguments: {
          tenantId: testTenantId,
        },
      },
    }, CallToolResultSchema)

    t.assert.deepEqual(result.content, [
      {
        text: `Error fetching audit logs for company ${testTenantId}: ${ERR_AI_FEATURES_NOT_ENABLED} '${testTenantId}'`,
        type: 'text',
      },
    ])
  })

  test('should return audit logs', async (t) => {
    const client = await getTestMCPServerClient({
      companyAuditLogsMockFn: async () => auditLogs,
      isAiFeaturesEnabledForTenantMockFn: async () => true,
    })
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
    const client = await getTestMCPServerClient({
      companyAuditLogsMockFn: async () => {
        throw new Error('error message')
      },
      isAiFeaturesEnabledForTenantMockFn: async () => true,
    })
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
