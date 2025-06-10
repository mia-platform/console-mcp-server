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

import { beforeEach, suite, test, TestContext } from 'node:test'
import { MockAgent, setGlobalDispatcher } from 'undici'

import { ConfigToSave } from './types/configuration'
import { HTTPClient } from './http-client'
import { PostProject } from './types/governance'
import { BackendClient, BackendClientInternal, internalEndpoint } from './backendClient'

const projectId = 'test-project-id'
const tenantId = 'test-tenant-id'
const refId = 'test-ref-id'

suite('Backend Internal Client', () => {
  const client = BackendClientInternal('', '')
  let agent: MockAgent

  beforeEach(() => {
    agent = new MockAgent()
    agent.disableNetConnect()
    setGlobalDispatcher(agent)
  })

  test('list companies', async (t: TestContext) => {
    const mockedResult = [
      { id: 'company1', name: 'Company 1' },
      { id: 'company2', name: 'Company 2' },
    ]

    agent.get(internalEndpoint).intercept({
      path: '/tenants/',
      method: 'GET',
      query: {
        per_page: '200',
        page: '1',
      },
    }).reply(200, mockedResult)

    const result = await client.listCompanies()
    t.assert.deepStrictEqual(result, mockedResult)
  })

  test('list companies must thrown if the API call fails', async (t: TestContext) => {
    agent.get(internalEndpoint).intercept({
      path: '/tenants/',
      method: 'GET',
      query: {
        per_page: '200',
        page: '1',
      },
    }).reply(500, { error: 'Internal Server Error' })

    await t.assert.rejects(async () => await client.listCompanies(), { name: 'Error' })
  })

  test('list company templates', async (t: TestContext) => {
    const mockedResult = [
      { id: 'template1', name: 'Template 1' },
      { id: 'template2', name: 'Template 2' },
    ]

    agent.get(internalEndpoint).intercept({
      path: `/templates/`,
      method: 'GET',
      query: {
        per_page: '200',
        page: '1',
        tenantId,
      },
    }).reply(200, mockedResult)

    const result = await client.companyTemplates(tenantId)
    t.assert.deepStrictEqual(result, mockedResult)
  })

  test('list company templates must thrown if the API call fails', async (t: TestContext) => {
    agent.get(internalEndpoint).intercept({
      path: `/templates/`,
      method: 'GET',
      query: {
        per_page: '200',
        page: '1',
        tenantId,
      },
    }).reply(500, { error: 'Internal Server Error' })

    await t.assert.rejects(async () => await client.companyTemplates(tenantId), { name: 'Error' })
  })

  test('list company iam identities', async (t: TestContext) => {
    const mockedResult = [
      { id: 'identity1', type: 'user', name: 'User 1' },
    ]

    agent.get(internalEndpoint).intercept({
      path: `/companies/${tenantId}/identities`,
      method: 'GET',
      query: {
        per_page: '200',
        page: '1',
        identityType: 'type',
      },
    }).reply(200, mockedResult)

    const result = await client.companyIAMIdentities(tenantId, 'type')
    t.assert.deepStrictEqual(result, mockedResult)
  })

  test('list company iam identities must thrown if the API call fails', async (t: TestContext) => {
    agent.get(internalEndpoint).intercept({
      path: `/companies/${tenantId}/identities`,
      method: 'GET',
      query: {
        per_page: '200',
        page: '1',
      },
    }).reply(500, { error: 'Internal Server Error' })

    await t.assert.rejects(async () => await client.companyIAMIdentities(tenantId), { name: 'Error' })
  })

  test('list company audit logs', async (t: TestContext) => {
    const mockedResult = [
      { id: 'identity1', type: 'user', name: 'User 1' },
    ]

    agent.get(internalEndpoint).intercept({
      path: `/tenants/${tenantId}/audit-logs`,
      method: 'GET',
      query: {
        per_page: '200',
        page: '1',
        from: '0000000000000000',
        to: '9999999999999999',
      },
    }).reply(200, mockedResult)

    const result = await client.companyAuditLogs(tenantId, '0000000000000000', '9999999999999999')
    t.assert.deepStrictEqual(result, mockedResult)
  })

  test('list company audit logs must thrown if the API call fails', async (t: TestContext) => {
    agent.get(internalEndpoint).intercept({
      path: `/tenants/${tenantId}/audit-logs`,
      method: 'GET',
      query: {
        per_page: '200',
        page: '1',
      },
    }).reply(500, { error: 'Internal Server Error' })

    await t.assert.rejects(async () => await client.companyAuditLogs(tenantId), { name: 'Error' })
  })

  test('list projects', async (t: TestContext) => {
    const mockedResult = [
      { id: 'project1', name: 'Project 1' },
      { id: 'project2', name: 'Project 2' },
    ]

    agent.get(internalEndpoint).intercept({
      path: '/projects/',
      method: 'GET',
      query: {
        per_page: '200',
        page: '1',
        tenantIds: tenantId,
      },
    }).reply(200, mockedResult)

    const result = await client.listProjects([ tenantId ])
    t.assert.deepStrictEqual(result, mockedResult)
  })

  test('list projects must thrown if the API call fails', async (t: TestContext) => {
    agent.get(internalEndpoint).intercept({
      path: '/projects/',
      method: 'GET',
      query: {
        per_page: '200',
        page: '1',
        search: 'test',
      },
    }).reply(500, { error: 'Internal Server Error' })

    await t.assert.rejects(async () => await client.listProjects([], 'test'), { name: 'Error' })
  })

  test('get project info', async (t: TestContext) => {
    const mockedResult = {
      id: projectId,
      name: 'Test Project',
      description: 'This is a test project',
      tenantId,
    }

    agent.get(internalEndpoint).intercept({
      path: `/projects/${projectId}/`,
      method: 'GET',
      query: {},
    }).reply(200, mockedResult)

    const result = await client.projectInfo(projectId)
    t.assert.deepStrictEqual(result, mockedResult)
  })

  test('get project info must thrown if the API call fails', async (t: TestContext) => {
    agent.get(internalEndpoint).intercept({
      path: `/projects/${projectId}/`,
      method: 'GET',
      query: {},
    }).reply(500, { error: 'Internal Server Error' })

    await t.assert.rejects(async () => await client.projectInfo(projectId), { name: 'Error' })
  })

  test('get new project draft', async (t: TestContext) => {
    const mockedResult = {
      templateId: 'template-id',
      repository: {
        providerId: 'provider-id',
        gitPath: 'git-path',
      },
    }

    agent.get(internalEndpoint).intercept({
      path: `/projects/draft`,
      method: 'GET',
      query: {
        tenantId,
        projectId,
        templateId: 'template-id',
        projectName: 'Test Project',
        description: 'description',
      },
    }).reply(200, mockedResult)

    const result = await client.projectDraft(tenantId, projectId, 'template-id', 'Test Project', 'description')
    t.assert.deepStrictEqual(result, mockedResult)
  })

  test('get new project draft must thrown if the API call fails', async (t: TestContext) => {
    agent.get(internalEndpoint).intercept({
      path: `/projects/draft`,
      method: 'GET',
      query: {
        tenantId,
        projectId,
        templateId: 'template-id',
        projectName: 'Test Project',
      },
    }).reply(500, { error: 'Internal Server Error' })

    await t.assert.rejects(
      async () => await client.projectDraft(tenantId, projectId, 'template-id', 'Test Project'),
      { name: 'Error' },
    )
  })

  test('create project', async (t: TestContext) => {
    const mockedResult = {
      id: 'new-project-id',
      name: 'New Project',
      description: 'This is a new project',
    }

    const body: PostProject = {
      enableConfGenerationOnDeploy: true,
      visibility: 'private',
      tenantId,
      projectId,
      templateId: 'template-id',
      name: 'Test Project',
      description: 'description',
      providerId: 'provider-id',
      environments: [],
      configurationGitPath: 'git-path',
    }

    agent.get(internalEndpoint).intercept({
      path: '/projects/',
      method: 'POST',
      body: JSON.stringify(body),
    }).reply(200, mockedResult)

    const result = await client.createProject(body)
    t.assert.deepStrictEqual(result, mockedResult)
  })

  test('create project must thrown if the API call fails', async (t: TestContext) => {
    const body: PostProject = {
      enableConfGenerationOnDeploy: true,
      visibility: 'private',
      tenantId,
      projectId,
      templateId: 'template-id',
      name: 'Test Project',
      description: 'description',
      providerId: 'provider-id',
      environments: [],
      configurationGitPath: 'git-path',
    }

    agent.get(internalEndpoint).intercept({
      path: '/projects/',
      method: 'POST',
      body: JSON.stringify(body),
    }).reply(500, { error: 'Internal Server Error' })

    await t.assert.rejects(async () => await client.createProject(body), { name: 'Error' })
  })

  test('get git provider groups', async (t: TestContext) => {
    const group = 'group/path/to/escape'
    const mockedResult = [
      {
        name: 'Group 1',
        path: 'group-1',
      },
      {
        name: 'Group 2',
        path: 'group-2',
      },
    ]

    agent.get(internalEndpoint).intercept({
      path: `/projects/${projectId}/groups/${encodeURIComponent(group)}/subgroups`,
      method: 'GET',
      query: {
        per_page: 200,
        page: 1,
        includeSelf: true,
      },
    }).reply(200, mockedResult)

    const result = await client.projectGitProviderGroups(projectId, group)
    t.assert.deepStrictEqual(result, mockedResult)
  })

  test('get git provider groups must thrown if the API call fails', async (t: TestContext) => {
    const group = 'group/path/to/escape'

    agent.get(internalEndpoint).intercept({
      path: `/projects/${projectId}/groups/${encodeURIComponent(group)}/subgroups`,
      method: 'GET',
      query: {
        per_page: 200,
        page: 1,
        includeSelf: true,
      },
    }).reply(500, { error: 'Internal Server Error' })

    await t.assert.rejects(async () => await client.projectGitProviderGroups(projectId, group), { name: 'Error' })
  })

  test('get configuration', async (t: TestContext) => {
    const mockedResult = {
      projectId,
    }

    agent.get(internalEndpoint).intercept({
      path: `/projects/${projectId}/revisions/${refId}/configuration`,
      method: 'GET',
    }).reply(200, mockedResult)

    const revisionResult = await client.getRevisionBasedConfiguration(projectId, refId)
    t.assert.deepStrictEqual(revisionResult, mockedResult)

    agent.get(internalEndpoint).intercept({
      path: `/projects/${projectId}/environments/${refId}/configuration`,
      method: 'GET',
    }).reply(200, mockedResult)
    const environmentResult = await client.getEnvironmentBasedConfiguration(projectId, refId)
    t.assert.deepStrictEqual(environmentResult, mockedResult)
  })

  test('get configuration must thrown if the API call fails', async (t: TestContext) => {
    agent.get(internalEndpoint).intercept({
      path: `/projects/${projectId}/revisions/${refId}/configuration`,
      method: 'GET',
    }).reply(500, { error: 'Internal Server Error' })
    await t.assert.rejects(
      async () => await client.getRevisionBasedConfiguration(projectId, refId),
      { name: 'Error' },
    )
  })

  test('save configuration', async (t: TestContext) => {
    const data = {
      title: 'title',
      previousSave: 'previous-save-id',
    } as ConfigToSave
    const mockedResult = { id: 'save-id' }

    agent.get(internalEndpoint).intercept({
      path: `/projects/${projectId}/revisions/${refId}/configuration`,
      method: 'POST',
      body: JSON.stringify(data),
    }).reply(200, mockedResult)
    const revisionResult = await client.saveRevisionBasedConfiguration(projectId, refId, data)
    t.assert.deepStrictEqual(revisionResult, mockedResult)

    agent.get(internalEndpoint).intercept({
      path: `/projects/${projectId}/environments/${refId}/configuration`,
      method: 'POST',
      body: JSON.stringify(data),
    }).reply(200, mockedResult)
    const environmentResult = await client.saveEnvironmentBasedConfiguration(projectId, refId, data)
    t.assert.deepStrictEqual(environmentResult, mockedResult)
  })
})

suite('Backend Client', () => {
  const mockedEndpoint = 'http://localhost:3000'
  const client = new BackendClient(new HTTPClient(mockedEndpoint))
  let agent: MockAgent

  beforeEach(() => {
    agent = new MockAgent()
    agent.disableNetConnect()
    setGlobalDispatcher(agent)
  })

  test('list companies', async (t: TestContext) => {
    const mockedResult = [
      { id: 'company1', name: 'Company 1' },
      { id: 'company2', name: 'Company 2' },
    ]

    agent.get(mockedEndpoint).intercept({
      path: '/api/backend/tenants/',
      method: 'GET',
      query: {
        per_page: '200',
        page: '1',
      },
    }).reply(200, mockedResult)

    const result = await client.listCompanies()
    t.assert.deepStrictEqual(result, mockedResult)
  })

  test('list company templates', async (t: TestContext) => {
    const mockedResult = [
      { id: 'template1', name: 'Template 1' },
      { id: 'template2', name: 'Template 2' },
    ]

    agent.get(mockedEndpoint).intercept({
      path: `/api/backend/templates/`,
      method: 'GET',
      query: {
        per_page: '200',
        page: '1',
        tenantId,
      },
    }).reply(200, mockedResult)

    const result = await client.companyTemplates(tenantId)
    t.assert.deepStrictEqual(result, mockedResult)
  })

  test('list company iam identities', async (t: TestContext) => {
    const mockedResult = [
      { id: 'identity1', type: 'user', name: 'User 1' },
    ]

    agent.get(mockedEndpoint).intercept({
      path: `/api/companies/${tenantId}/identities`,
      method: 'GET',
      query: {
        per_page: '200',
        page: '1',
        identityType: 'type',
      },
    }).reply(200, mockedResult)

    const result = await client.companyIAMIdentities(tenantId, 'type')
    t.assert.deepStrictEqual(result, mockedResult)
  })

  test('list company audit logs', async (t: TestContext) => {
    const mockedResult = [
      { id: 'identity1', type: 'user', name: 'User 1' },
    ]

    agent.get(mockedEndpoint).intercept({
      path: `/api/tenants/${tenantId}/audit-logs`,
      method: 'GET',
      query: {
        per_page: '200',
        page: '1',
        from: '0000000000000000',
        to: '9999999999999999',
      },
    }).reply(200, mockedResult)

    const result = await client.companyAuditLogs(tenantId, '0000000000000000', '9999999999999999')
    t.assert.deepStrictEqual(result, mockedResult)
  })

  test('list projects', async (t: TestContext) => {
    const mockedResult = [
      { id: 'project1', name: 'Project 1' },
      { id: 'project2', name: 'Project 2' },
    ]

    agent.get(mockedEndpoint).intercept({
      path: '/api/backend/projects/',
      method: 'GET',
      query: {
        per_page: '200',
        page: '1',
        tenantIds: tenantId,
        search: 'test',
      },
    }).reply(200, mockedResult)

    const result = await client.listProjects([ tenantId ], 'test')
    t.assert.deepStrictEqual(result, mockedResult)
  })

  test('get project info', async (t: TestContext) => {
    const mockedResult = {
      id: projectId,
      name: 'Test Project',
      description: 'This is a test project',
      tenantId,
    }

    agent.get(mockedEndpoint).intercept({
      path: `/api/backend/projects/${projectId}/`,
      method: 'GET',
      query: {},
    }).reply(200, mockedResult)

    const result = await client.projectInfo(projectId)
    t.assert.deepStrictEqual(result, mockedResult)
  })

  test('get new project draft', async (t: TestContext) => {
    const mockedResult = {
      templateId: 'template-id',
      repository: {
        providerId: 'provider-id',
        gitPath: 'git-path',
      },
    }

    agent.get(mockedEndpoint).intercept({
      path: `/api/backend/projects/draft`,
      method: 'GET',
      query: {
        tenantId,
        projectId,
        templateId: 'template-id',
        projectName: 'Test Project',
        description: 'description',
      },
    }).reply(200, mockedResult)

    const result = await client.projectDraft(tenantId, projectId, 'template-id', 'Test Project', 'description')
    t.assert.deepStrictEqual(result, mockedResult)
  })

  test('create project', async (t: TestContext) => {
    const mockedResult = {
      id: 'new-project-id',
      name: 'New Project',
      description: 'This is a new project',
    }

    const body: PostProject = {
      enableConfGenerationOnDeploy: true,
      visibility: 'private',
      tenantId,
      projectId,
      templateId: 'template-id',
      name: 'Test Project',
      description: 'description',
      providerId: 'provider-id',
      environments: [],
      configurationGitPath: 'git-path',
    }

    agent.get(mockedEndpoint).intercept({
      path: `/api/backend/projects/`,
      method: 'POST',
      body: JSON.stringify(body),
    }).reply(200, mockedResult)

    const result = await client.createProject(body)
    t.assert.deepStrictEqual(result, mockedResult)
  })

  test('get git provider groups', async (t: TestContext) => {
    const group = 'group/path/to/escape'
    const mockedResult = [
      {
        name: 'Group 1',
        path: 'group-1',
      },
      {
        name: 'Group 2',
        path: 'group-2',
      },
    ]

    agent.get(mockedEndpoint).intercept({
      path: `/api/backend/projects/${projectId}/groups/${encodeURIComponent(group)}/subgroups`,
      method: 'GET',
      query: {
        per_page: 200,
        page: 1,
        includeSelf: true,
      },
    }).reply(200, mockedResult)

    const result = await client.projectGitProviderGroups(projectId, group)
    t.assert.deepStrictEqual(result, mockedResult)
  })

  test('get configuration', async (t: TestContext) => {
    const mockedResult = {
      projectId,
    }

    agent.get(mockedEndpoint).intercept({
      path: `/api/backend/projects/${projectId}/revisions/${refId}/configuration`,
      method: 'GET',
    }).reply(200, mockedResult)

    const revisionResult = await client.getRevisionBasedConfiguration(projectId, refId)
    t.assert.deepStrictEqual(revisionResult, mockedResult)

    agent.get(mockedEndpoint).intercept({
      path: `/api/projects/${projectId}/environments/${refId}/configuration`,
      method: 'GET',
    }).reply(200, mockedResult)
    const environmentResult = await client.getEnvironmentBasedConfiguration(projectId, refId)
    t.assert.deepStrictEqual(environmentResult, mockedResult)
  })

  test('save configuration', async (t: TestContext) => {
    const data = {
      title: 'title',
      previousSave: 'previous-save-id',
    } as ConfigToSave
    const mockedResult = { id: 'save-id' }

    agent.get(mockedEndpoint).intercept({
      path: `/api/backend/projects/${projectId}/revisions/${refId}/configuration`,
      method: 'POST',
      body: JSON.stringify(data),
    }).reply(200, mockedResult)
    const revisionResult = await client.saveRevisionBasedConfiguration(projectId, refId, data)
    t.assert.deepStrictEqual(revisionResult, mockedResult)

    agent.get(mockedEndpoint).intercept({
      path: `/api/projects/${projectId}/environments/${refId}/configuration`,
      method: 'POST',
      body: JSON.stringify(data),
    }).reply(200, mockedResult)
    const environmentResult = await client.saveEnvironmentBasedConfiguration(projectId, refId, data)
    t.assert.deepStrictEqual(environmentResult, mockedResult)
  })
})
