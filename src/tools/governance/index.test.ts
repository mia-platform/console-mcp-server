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
import {
  CallToolResultSchema,
  ListToolsResultSchema,
} from '@modelcontextprotocol/sdk/types.js'
import {
  IProject,
  ITenant,
} from '@mia-platform/console-types'

import { addGovernanceCapabilities } from '.'
import { Template } from '../../apis/types/governance'
import { TestMCPServer } from '../../server/utils.test'
import {
  APIClientMock,
  APIClientMockFunctions,
} from '../../apis/client'
import {
  ERR_AI_FEATURES_NOT_ENABLED,
  ERR_AI_FEATURES_NOT_ENABLED_MULTIPLE_TENANTS,
  ERR_NO_TENANTS_FOUND_WITH_AI_FEATURES_ENABLED,
} from '../utils/validations'

const projects = [
  { _id: 10, name: 'name', tenantId: 'tenant1' },
  { _id: 11, name: 'name', tenantId: 'tenant1' },
  { _id: 20, name: 'name', tenantId: 'tenant2' },
  { _id: 21, name: 'name', tenantId: 'tenant2' },
  { _id: 30, name: 'name', tenantId: 'tenant3' },
]

const project = {
  id: 1,
  name: 'Name',
  projectId: 'name',
  tenantId: 'tenantID',
  templateId: 'templateID',
  description: 'description',
}

async function getTestMCPServerClient (mocks: APIClientMockFunctions): Promise<Client> {
  const client = await TestMCPServer((server) => {
    addGovernanceCapabilities(server, new APIClientMock(mocks))
  })

  return client
}

suite('setup governance tools', () => {
  test('should setup tools to a server', async (t: it.TestContext) => {
    const client = await TestMCPServer((server) => {
      addGovernanceCapabilities(server, new APIClientMock({}))
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
  const aiFeaturesRulesForTenant: Record<string, boolean> = {
    tenant1: true,
    tenant2: false,
    tenant3: true,
  }

  const aiFeaturesMockFn = mock.fn(async (tenantId: string): Promise<boolean> => {
    if (!(tenantId in aiFeaturesRulesForTenant)) {
      throw new Error(`Tenant ${tenantId} not found`)
    }

    return aiFeaturesRulesForTenant[tenantId]
  })

  const listProjectsMockFn = mock.fn(async (tenantIds: string[], _search?: string) => {
    // Assert all tenantIds have AI features enabled
    const enabledTenants = tenantIds.filter((tenantId) => aiFeaturesRulesForTenant[tenantId])
    assert.equal(
      tenantIds.every((tenantIds) => {
        assert.equal(enabledTenants.includes(tenantIds), true)
        return true
      }),
      true,
    )

    // Return filtered projects
    return projects.filter((project) => {
      return tenantIds.includes(project.tenantId)
    })
  })


  it('returns only projects from tenants with AI features enabled', async (t: it.TestContext) => {
    const testTenantIds = [ 'tenant1', 'tenant2' ]

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

    const expectedProjects = projects.filter((project) => {
      return testTenantIds.includes(project.tenantId) && aiFeaturesRulesForTenant[project.tenantId]
    })
    t.assert.deepEqual(result.content, [
      {
        text: JSON.stringify(expectedProjects),
        type: 'text',
      },
    ])
  })

  it('returns error - if no specified tenant has AI features enabled', async (t: it.TestContext) => {
    const testTenantIds = [ 'tenant2' ]

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

    t.assert.ok(result.isError)
    t.assert.deepEqual(result.content, [
      {
        text: `Error fetching projects for ${testTenantIds.join(', ')}: ${ERR_AI_FEATURES_NOT_ENABLED_MULTIPLE_TENANTS}`,
        type: 'text',
      },
    ])
  })

  it('filters errors when retrieving company AI settings', async (t: it.TestContext) => {
    const testTenantIds = [ 'error', 'tenant3' ]

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

    const expectedProjects = projects.filter((project) => {
      return testTenantIds.includes(project.tenantId) && aiFeaturesRulesForTenant[project.tenantId]
    })
    t.assert.deepEqual(result.content, [
      {
        text: JSON.stringify(expectedProjects),
        type: 'text',
      },
    ])
  })

  it('returns error message if request return error', async (t: it.TestContext) => {
    const testTenantIds = [ 'tenant1' ]

    const client = await getTestMCPServerClient({
      isAiFeaturesEnabledForTenantMockFn: aiFeaturesMockFn,
      listProjectsMockFn: async () => {
        throw new Error('error message')
      },
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

    t.assert.ok(result.isError)
    t.assert.deepEqual(result.content, [
      {
        text: `Error fetching projects for ${testTenantIds.join(', ')}: error message`,
        type: 'text',
      },
    ])
  })
})

suite('get project info', () => {
  test('returns error - if AI features are not enabled for tenant', async (t: it.TestContext) => {
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

    t.assert.ok(result.isError)
    t.assert.deepEqual(result.content, [
      {
        text: `Error fetching project ${testProjectId}: ${ERR_AI_FEATURES_NOT_ENABLED} '${testTenantId}'`,
        type: 'text',
      },
    ])
  })

  it('returns project info', async (t: it.TestContext) => {
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

  it('returns error message if request return error', async (t: it.TestContext) => {
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

    t.assert.ok(result.isError)
    t.assert.deepEqual(result.content, [
      {
        text: 'Error fetching project error: error message',
        type: 'text',
      },
    ])
  })
})

suite('create project from template', () => {
  test('returns error - if AI features are not enabled for tenant', async (t: it.TestContext) => {
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

    t.assert.ok(result.isError)
    t.assert.deepEqual(result.content, [
      {
        text: `Error creating project from template templateID: ${ERR_AI_FEATURES_NOT_ENABLED} '${testTenantId}'`,
        type: 'text',
      },
    ])
  })

  test('should create a new project', async (t: it.TestContext) => {
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

  it('returns error message if request return error', async (t: it.TestContext) => {
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

    t.assert.ok(result.isError)
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
  { tenantId: 'tenant1', name: 'name', defaultTemplateId: 'template-id-1' },
  { tenantId: 'tenant2', name: 'name2', defaultTemplateId: 'template-id-2' },
  { tenantId: 'tenant3', name: 'name3', defaultTemplateId: 'template-id-3' },
] as ITenant[]

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
  const aiFeaturesRulesForTenant: Record<string, boolean> = {
    tenant1: true,
    tenant2: false,
    tenant3: true,
  }
  const aiFeaturesMockFn = mock.fn(async (tenantId: string): Promise<boolean> => {
    if (!(tenantId in aiFeaturesRulesForTenant)) {
      throw new Error(`Tenant ${tenantId} not found`)
    }

    return aiFeaturesRulesForTenant[tenantId]
  })

  test('returns only companies with AI features enabled', async (t: it.TestContext) => {
    const client = await getTestMCPServerClient({
      isAiFeaturesEnabledForTenantMockFn: aiFeaturesMockFn,
      listCompaniesMockFn: async () => companies,
    })

    const result = await client.request({
      method: 'tools/call',
      params: {
        name: 'list_tenants',
        arguments: {},
      },
    }, CallToolResultSchema)

    const expectedCompanies = companies.filter((company) => aiFeaturesRulesForTenant[company.tenantId])
    t.assert.deepEqual(result.content, [
      {
        text: JSON.stringify(expectedCompanies),
        type: 'text',
      },
    ])
  })

  it('returns error - if no tenant has AI features enabled', async (t: it.TestContext) => {
    const notEnabledCompanies = companies.filter((company) => !aiFeaturesRulesForTenant[company.tenantId])

    const client = await getTestMCPServerClient({
      isAiFeaturesEnabledForTenantMockFn: aiFeaturesMockFn,
      listCompaniesMockFn: async () => notEnabledCompanies,
    })
    const result = await client.request({
      method: 'tools/call',
      params: {
        name: 'list_tenants',
        arguments: {},
      },
    }, CallToolResultSchema)

    t.assert.ok(result.isError)
    t.assert.deepEqual(result.content, [
      {
        text: `Error fetching companies: ${ERR_NO_TENANTS_FOUND_WITH_AI_FEATURES_ENABLED}`,
        type: 'text',
      },
    ])
  })

  it('filters companies for which retrieving company AI settings resulted in error', async (t: it.TestContext) => {
    const testCompanies = [
      {
        tenantId: 'tenant1',
        name: 'name',
        defaultTemplateId: 'template-id-1',
      },

      // NOTE: this one triggers the error in the mock function
      {
        tenantId: 'error',
        name: 'error',
        defaultTemplateId: 'template-id-error',
      },
    ] as ITenant[]

    const client = await getTestMCPServerClient({
      isAiFeaturesEnabledForTenantMockFn: aiFeaturesMockFn,
      listCompaniesMockFn: async () => testCompanies,
    })
    const result = await client.request({
      method: 'tools/call',
      params: {
        name: 'list_tenants',
        arguments: {},
      },
    }, CallToolResultSchema)

    const expectedCompanies = testCompanies.filter((company) => {
      return aiFeaturesRulesForTenant[company.tenantId]
    })
    t.assert.deepEqual(result.content, [
      {
        text: JSON.stringify(expectedCompanies),
        type: 'text',
      },
    ])
  })

  it('returns error message if request return error', async (t: it.TestContext) => {
    const client = await TestMCPServer((server) => {
      addGovernanceCapabilities(
        server,
        new APIClientMock({
          listCompaniesMockFn: async () => {
            throw new Error('error message')
          },
        }),
      )
    })

    const result = await client.request({
      method: 'tools/call',
      params: {
        name: 'list_tenants',
        arguments: {},
      },
    }, CallToolResultSchema)

    t.assert.ok(result.isError)
    t.assert.deepEqual(result.content, [
      {
        text: 'Error fetching companies: error message',
        type: 'text',
      },
    ])
  })
})

suite('company list template', () => {
  test('returns error - if AI features are not enabled for tenant', async (t: it.TestContext) => {
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

    t.assert.ok(result.isError)
    t.assert.deepEqual(result.content, [
      {
        text: `Error fetching templates for company ${testTenantId}: ${ERR_AI_FEATURES_NOT_ENABLED} '${testTenantId}'`,
        type: 'text',
      },
    ])
  })

  test('should list templates', async (t: it.TestContext) => {
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

  it('returns error message if request return error', async (t: it.TestContext) => {
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

    t.assert.ok(result.isError)
    t.assert.deepEqual(result.content, [
      {
        text: 'Error fetching templates for company error: error message',
        type: 'text',
      },
    ])
  })
})

suite('iam list tool', () => {
  test('returns error - if AI features are not enabled for tenant', async (t: it.TestContext) => {
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

    t.assert.ok(result.isError)
    t.assert.deepEqual(result.content, [
      {
        text: `Error fetching IAM for company ${testTenantId}: ${ERR_AI_FEATURES_NOT_ENABLED} '${testTenantId}'`,
        type: 'text',
      },
    ])
  })

  it('returns complete iam list', async (t: it.TestContext) => {
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

  it('returns error message if request return error', async (t: it.TestContext) => {
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

    t.assert.ok(result.isError)
    t.assert.deepEqual(result.content, [
      {
        text: 'Error fetching IAM for company error: error message',
        type: 'text',
      },
    ])
  })
})

suite('audit log', () => {
  test('returns error - if AI features are not enabled for tenant', async (t: it.TestContext) => {
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

    t.assert.ok(result.isError)
    t.assert.deepEqual(result.content, [
      {
        text: `Error fetching audit logs for company ${testTenantId}: ${ERR_AI_FEATURES_NOT_ENABLED} '${testTenantId}'`,
        type: 'text',
      },
    ])
  })

  it('returns audit logs', async (t: it.TestContext) => {
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

  it('returns error message if request return error', async (t: it.TestContext) => {
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

    t.assert.ok(result.isError)
    t.assert.deepEqual(result.content, [
      {
        text: 'Error fetching audit logs for company error: error message',
        type: 'text',
      },
    ])
  })
})
