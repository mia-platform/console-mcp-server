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

import { HTTPClient } from './http-client'
import { TenantClient } from './tenantClient'

process.env.TZ = 'UTC'

suite('Tenant Client', () => {
  const mockedEndpoint = 'http://localhost:3000'
  const client = new TenantClient(new HTTPClient(mockedEndpoint))
  let agent: MockAgent

  beforeEach(() => {
    agent = new MockAgent()
    agent.disableNetConnect()
    setGlobalDispatcher(agent)
  })

  test('list companies', async (t: TestContext) => {
    const mockedResult = [
      { companyId: 'company1', companyName: 'Company 1' },
      { companyId: 'company2', companyName: 'Company 2' },
    ]

    agent.get(mockedEndpoint).intercept({
      path: '/api/user/companies',
      method: 'GET',
    }).reply(200, mockedResult)

    const result = await client.listCompanies()
    t.assert.deepStrictEqual(result, mockedResult)
  })

  test('list companies must thrown if the API call fails', async (t: TestContext) => {
    agent.get(mockedEndpoint).intercept({
      path: '/api/user/companies',
      method: 'GET',
    }).reply(500, { error: 'Internal Server Error' })

    await t.assert.rejects(async () => await client.listCompanies(), { name: 'Error' })
  })
})
