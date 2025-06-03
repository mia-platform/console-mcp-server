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
import { suite, test } from 'node:test'

import { ListToolsResultSchema } from '@modelcontextprotocol/sdk/types.js'

import { addServicesCapabilities } from '.'
import { APIClient } from '../../lib/client'
import { AppContext } from '../../server/server'
import { TestMCPServer } from '../../server/test-utils.test'

const mockedEndpoint = 'http://localhost:3000'

suite('setup services tools', () => {
  test('should setup services tools to a server', async (t) => {
    const client = await TestMCPServer((server) => {
      const apiClient = new APIClient(mockedEndpoint)
      addServicesCapabilities(server, { client: apiClient } as AppContext)
    })

    const result = await client.request(
      {
        method: 'tools/list',
      },
      ListToolsResultSchema,
    )

    t.assert.equal(result.tools.length, 1)
  })
})
