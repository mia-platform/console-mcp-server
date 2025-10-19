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
import { suite, test } from 'node:test'

import { CatalogItemTypeDefinition } from '@mia-platform/console-types'
import { createMarketplaceItemTemplate, isVersioningSupported, validateMarketplaceItemStructure } from './utils'

suite('Marketplace Utils', () => {
  const versionedITD: CatalogItemTypeDefinition = {
    apiVersion: 'software-catalog.mia-platform.eu/v1',
    kind: 'item-type-definition',
    metadata: {
      namespace: { scope: 'tenant', id: 'test-tenant' },
      name: 'plugin',
      displayName: 'Plugin',
      visibility: { scope: 'tenant', ids: [ 'test-tenant' ] },
    },
    spec: {
      type: 'plugin',
      scope: 'tenant',
      isVersioningSupported: true,
      validation: {
        mechanism: 'json-schema',
        schema: { type: 'object' },
      },
    },
  }

  const nonVersionedITD: CatalogItemTypeDefinition = {
    apiVersion: 'software-catalog.mia-platform.eu/v1',
    kind: 'item-type-definition',
    metadata: {
      namespace: { scope: 'tenant', id: 'test-tenant' },
      name: 'ai-prompt',
      displayName: 'AI Prompt',
      visibility: { scope: 'tenant', ids: [ 'test-tenant' ] },
    },
    spec: {
      type: 'ai-prompt',
      scope: 'tenant',
      validation: {
        mechanism: 'json-schema',
        schema: {
          type: 'object',
          properties: {
            promptGoal: { type: 'string', description: 'The aim of the prompt' },
            promptText: { type: 'string', description: 'The full prompt' },
          },
          required: [ 'promptGoal', 'promptText' ],
        },
      },
    },
  }

  test('isVersioningSupported returns true for versioned ITD', () => {
    assert.strictEqual(isVersioningSupported(versionedITD), true)
  })

  test('isVersioningSupported returns false for non-versioned ITD', () => {
    assert.strictEqual(isVersioningSupported(nonVersionedITD), false)
  })

  test('validateMarketplaceItemStructure accepts versioned item for versioned ITD', () => {
    const item = {
      itemId: 'test-plugin',
      name: 'Test Plugin',
      version: {
        name: '1.0.0',
        releaseDate: '2025-01-18T00:00:00.000Z',
        lifecycleStatus: 'published',
        releaseNote: 'Initial release',
      },
    }

    const errors = validateMarketplaceItemStructure(item, versionedITD)
    assert.strictEqual(errors.length, 0)
  })

  test('validateMarketplaceItemStructure rejects non-versioned item for versioned ITD', () => {
    const item = {
      itemId: 'test-plugin',
      name: 'Test Plugin',
    }

    const errors = validateMarketplaceItemStructure(item, versionedITD)
    assert.strictEqual(errors.length, 1)
    assert.match(errors[0], /supports versioning but no version object was provided/)
  })

  test('validateMarketplaceItemStructure accepts non-versioned item for non-versioned ITD', () => {
    const item = {
      itemId: 'test-prompt',
      name: 'Test AI Prompt',
      resources: {
        promptGoal: 'Test goal',
        promptText: 'Test prompt text',
      },
    }

    const errors = validateMarketplaceItemStructure(item, nonVersionedITD)
    assert.strictEqual(errors.length, 0)
  })

  test('validateMarketplaceItemStructure rejects versioned item for non-versioned ITD', () => {
    const item = {
      itemId: 'test-prompt',
      name: 'Test AI Prompt',
      version: {
        name: '1.0.0',
        releaseDate: '2025-01-18T00:00:00.000Z',
        lifecycleStatus: 'published',
        releaseNote: 'Initial release',
      },
    }

    const errors = validateMarketplaceItemStructure(item, nonVersionedITD)
    assert.strictEqual(errors.length, 1)
    assert.match(errors[0], /does not support versioning but a version object was provided/)
  })

  test('createMarketplaceItemTemplate creates versioned template for versioned ITD', () => {
    const template = createMarketplaceItemTemplate(versionedITD, 'test-plugin', 'Test Plugin', 'test-tenant')

    assert.strictEqual(template.itemId, 'test-plugin')
    assert.strictEqual(template.name, 'Test Plugin')
    assert.strictEqual(template.type, 'plugin')
    assert.ok(template.version)
    assert.strictEqual((template.itemTypeDefinitionRef as Record<string, unknown>).name, 'plugin')
    assert.strictEqual((template.itemTypeDefinitionRef as Record<string, unknown>).namespace, 'test-tenant')
  })

  test('createMarketplaceItemTemplate creates non-versioned template for non-versioned ITD', () => {
    const template = createMarketplaceItemTemplate(nonVersionedITD, 'test-prompt', 'Test AI Prompt', 'test-tenant')

    assert.strictEqual(template.itemId, 'test-prompt')
    assert.strictEqual(template.name, 'Test AI Prompt')
    assert.strictEqual(template.type, 'ai-prompt')
    assert.strictEqual(template.version, undefined)
    assert.strictEqual((template.itemTypeDefinitionRef as Record<string, unknown>).name, 'ai-prompt')
    assert.strictEqual((template.itemTypeDefinitionRef as Record<string, unknown>).namespace, 'test-tenant')
  })
})
