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

import { AuditLogsClient } from './auditLogsClient'
import { HTTPClient } from './http-client'

const tenantId = 'test-tenant-id'

process.env.TZ = 'UTC'

suite('Audit Logs Client', () => {
  const mockedEndpoint = 'http://localhost:3000'
  const client = new AuditLogsClient(new HTTPClient(mockedEndpoint))
  let agent: MockAgent

  beforeEach(() => {
    agent = new MockAgent()
    agent.disableNetConnect()
    setGlobalDispatcher(agent)
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
        page: '0',
        from: '1710154800000',
        to: '1710156600000',
      },
    }).reply(200, mockedResult)

    const result = await client.companyAuditLogs(tenantId, '1710154800000', '1710156600000')
    t.assert.deepStrictEqual(result, mockedResult)
  })

  test('list company audit logs with dates as a filter', async (t: TestContext) => {
    const mockedResult = [
      { id: 'identity1', type: 'user', name: 'User 1' },
    ]

    agent.get(mockedEndpoint).intercept({
      path: `/api/tenants/${tenantId}/audit-logs`,
      method: 'GET',
      query: {
        per_page: '200',
        page: '0',
        from: '1710154800000',
        to: '1710156600000',
      },
    }).reply(200, mockedResult)

    const result = await client.companyAuditLogs(tenantId, '2024-03-11T11:00:00', '2024-03-11T11:30:00')
    t.assert.deepStrictEqual(result, mockedResult)
  })

  test('list company audit logs must thrown if the API call fails', async (t: TestContext) => {
    agent.get(mockedEndpoint).intercept({
      path: `/api/tenants/${tenantId}/audit-logs`,
      method: 'GET',
      query: {
        per_page: '200',
        page: '0',
      },
    }).reply(500, { error: 'Internal Server Error' })


    await t.assert.rejects(async () => await client.companyAuditLogs(tenantId), { name: 'Error' })
  })
})
