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
import { RBACClient } from './rbacClient'

const tenantId = 'test-tenant-id'

process.env.TZ = 'UTC'

suite('RBAC Client', () => {
  const mockedEndpoint = 'http://localhost:3000'
  const client = new RBACClient(new HTTPClient(mockedEndpoint))
  let agent: MockAgent

  beforeEach(() => {
    agent = new MockAgent()
    agent.disableNetConnect()
    setGlobalDispatcher(agent)
  })

  test('list company principals must thrown if the API call fails', async (t: TestContext) => {
    agent.get(mockedEndpoint).intercept({
      path: `/api/rbac/authz/principals`,
      method: 'GET',
      query: {
        limit: 25,
        type: 'user',
        tenantId: tenantId,
      },
    }).reply(500, { error: 'Internal Server Error' })

    await t.assert.rejects(async () => await client.listPrincipals('user', { tenantId }), { name: 'Error' })
  })

  test('list company principals', async (t: TestContext) => {
    const mockedResult = {
      items: [ { id: 'identity1', type: 'user', name: 'User 1' } ],
    }

    agent.get(mockedEndpoint).intercept({
      path: `/api/rbac/authz/principals`,
      method: 'GET',
      query: {
        limit: 25,
        type: 'user',
        tenantId: tenantId,
      },
    }).reply(200, mockedResult)

    const result = await client.listPrincipals('user', { tenantId })
    t.assert.deepStrictEqual(result, mockedResult)
  })
})
