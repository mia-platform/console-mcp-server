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

import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js'
import { ListPromptsResultSchema, ListToolsResultSchema } from '@modelcontextprotocol/sdk/types.js'

import { getMcpServer } from './server'
import { toolsDescriptions } from '../tools/descriptions'

suite('initialize server', () => {
  test('get mcp server', async (t) => {
    const testHost = 'localhost:3000'
    const server = getMcpServer(testHost, '', '')

    const testClient = new Client({
      name: 'test client',
      version: '1.0',
    })

    const [ clientTransport, serverTransport ] = InMemoryTransport.createLinkedPair()
    await Promise.all([
      testClient.connect(clientTransport),
      server.server.connect(serverTransport),
    ])

    const toolsResult = await testClient.request(
      {
        method: 'tools/list',
      },
      ListToolsResultSchema,
    )
    t.assert.equal(toolsResult.tools.length, Object.keys(toolsDescriptions).length, 'should return all the registred tools')

    const promptsResult = await testClient.request(
      {
        method: 'prompts/list',
      },
      ListPromptsResultSchema,
    )

    t.assert.equal(promptsResult.prompts.length, 1, 'should return all the registred prompts')

    await clientTransport.close()
    await serverTransport.close()
    await testClient.close()
    await server.close()
  })
})
