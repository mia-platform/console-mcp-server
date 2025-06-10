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
import test, { beforeEach, suite } from 'node:test'

import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { CallToolResultSchema, ListToolsResultSchema } from '@modelcontextprotocol/sdk/types.js'

import { addServicesCapabilities } from '.'
import { APIClient } from '../../apis/client'
import { SaveResponse } from '../../apis/types/configuration'
import { TestMCPServer } from '../../server/utils.test'
import { toolNames } from '../descriptions'

const projectId = 'project-id'
const name = 'name'
const description = 'description'
const refId = 'reference-id'
const marketplaceItemId = 'item-id'
const marketplaceItemTenantId = 'tenant-id'
const marketplaceItemVersion = 'version'

const saveResponse = {
  id: 'save-id',
}

suite('setup services tools', () => {
  test('should setup services tools to a server', async (t) => {
    const client = await TestMCPServer((server) => {
      addServicesCapabilities(server, {} as APIClient)
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

suite('create service from marketplace tool', () => {
  let client: Client

  beforeEach(async () => {
    client = await TestMCPServer((server) => {
      addServicesCapabilities(server, {
        async createServiceFromMarketplaceItem (
          projectID: string,
          _name: string,
          _refID: string,
          _marketplaceItemID: string,
          _marketplaceItemTenantID: string,
          _marketplaceItemVersion?: string,
          _description?: string,
        ): Promise<SaveResponse> {
          if (projectID === 'error') {
            throw new Error('error message')
          }
          return saveResponse
        },
      } as APIClient)
    })
  })

  test('should create a service from marketplace item', async (t) => {
    const result = await client.request({
      method: 'tools/call',
      params: {
        name: toolNames.CREATE_SERVICE_FROM_MARKETPLACE,
        arguments: {
          projectId,
          name,
          description,
          refId,
          marketplaceItemId,
          marketplaceItemTenantId,
          marketplaceItemVersion,
        },
      },
    }, CallToolResultSchema)

    t.assert.deepEqual(result.content, [
      {
        text: JSON.stringify(saveResponse),
        type: 'text',
      },
    ])
  })

  test('should return error when pods are not found', async (t) => {
    const result = await client.request({
      method: 'tools/call',
      params: {
        name: toolNames.CREATE_SERVICE_FROM_MARKETPLACE,
        arguments: {
          projectId: 'error',
          name,
          description,
          refId,
          marketplaceItemId,
          marketplaceItemTenantId,
          marketplaceItemVersion,
        },
      },
    }, CallToolResultSchema)

    t.assert.deepEqual(result.content, [
      {
        text: `Error creating ${name} service: error message`,
        type: 'text',
      },
    ])
  })
})
