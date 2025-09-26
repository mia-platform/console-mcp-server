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
import { beforeEach, suite, test } from 'node:test'

import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { GetPromptResultSchema, ListPromptsResultSchema } from '@modelcontextprotocol/sdk/types.js'

import { addDeployPrompt } from './deploy'
import { TestMCPServer } from '../server/utils.test'

suite('setup deploy prompt', () => {
  let client: Client
  beforeEach(async () => {
    client = await TestMCPServer((server) => {
      addDeployPrompt(server)
    })
  })

  test('the prompt is included in the list of prompts', async () => {
    const result = await client.request(
      {
        method: 'prompts/list',
      },
      ListPromptsResultSchema,
    )

    assert.equal(result.prompts.length, 1)
  })

  test('the prompt is retrieved with the requested parameters', async () => {
    const result = await client.request(
      {
        method: 'prompts/get',
        params: {
          name: 'deploy',
          arguments: {
            tenant: 'my-tenant',
            project: 'my-project',
            environment: 'my-environment',
          },
        },
      },
      GetPromptResultSchema,
    )

    assert.equal(result.messages.length, 3)
    const [ firstUserMessage, firstAssistantMessage, secondUserMessage ] = result.messages
    assert.equal(firstUserMessage.role, 'user')
    assert.equal(firstAssistantMessage.role, 'assistant')
    assert.equal(secondUserMessage.role, 'user')

    const firstUserMessageText = firstUserMessage.content.text
    if (typeof firstUserMessageText !== 'string') {
      assert.fail('message text is not a string')
    }

    assert.ok(firstUserMessageText.includes('my-project'))
    assert.ok(firstUserMessageText.includes('my-tenant'))
    assert.ok(firstUserMessageText.includes('my-environment'))
    assert.ok(firstUserMessageText.includes('Please fetch which revision'))

    const firstAssistantMessageText = firstAssistantMessage.content.text
    if (typeof firstAssistantMessageText !== 'string') {
      assert.fail('message text is not a string')
    }

    assert.ok(firstAssistantMessageText.includes('my-project'))
    assert.ok(firstAssistantMessageText.includes('my-tenant'))
    assert.ok(firstAssistantMessageText.includes('my-environment'))
    assert.ok(firstAssistantMessageText.includes('to be fetched'))
  })

  test('the prompt is retrieved including the revisionName', async () => {
    const result = await client.request(
      {
        method: 'prompts/get',
        params: {
          name: 'deploy',
          arguments: {
            tenant: 'my-tenant',
            project: 'my-project',
            environment: 'my-environment',
            revisionName: 'my-revision',
          },
        },
      },
      GetPromptResultSchema,
    )

    assert.equal(result.messages.length, 3)
    const [ firstUserMessage, firstAssistantMessage, secondUserMessage ] = result.messages
    assert.equal(firstUserMessage.role, 'user')
    assert.equal(firstAssistantMessage.role, 'assistant')
    assert.equal(secondUserMessage.role, 'user')

    const firstUserMessageText = firstUserMessage.content.text
    if (typeof firstUserMessageText !== 'string') {
      assert.fail('message text is not a string')
    }

    assert.ok(firstUserMessageText.includes('my-revision'))

    const firstAssistantMessageText = firstAssistantMessage.content.text
    if (typeof firstAssistantMessageText !== 'string') {
      assert.fail('message text is not a string')
    }

    assert.ok(firstAssistantMessageText.includes('my-revision'))
  })
})
