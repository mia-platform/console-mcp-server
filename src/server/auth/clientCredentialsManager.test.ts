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
import { afterEach, beforeEach, describe, test } from 'node:test'

import { ClientCredentialsManager } from './clientCredentialsManager'

describe('ClientCredentialsManager', () => {
  let manager: ClientCredentialsManager

  /** Default implementation of the Date.now, which is going to be mocked at every test */
  const originalDateNow: () => number = Date.now
  const fixedTime = 1000000000000

  beforeEach(() => {
    manager = new ClientCredentialsManager()

    Date.now = () => fixedTime
  })

  afterEach(() => {
    Date.now = originalDateNow
  })

  test('should generate valid credentials', () => {
    const credentials = manager.generateCredentials()

    assert.ok(credentials.clientId)
    assert.ok(credentials.clientSecret)
    assert.ok(credentials.createdAt)
    assert.ok(credentials.expiresAt)
    assert.strictEqual(typeof credentials.clientId, 'string')
    assert.strictEqual(typeof credentials.clientSecret, 'string')
    assert.strictEqual(typeof credentials.createdAt, 'number')
    assert.strictEqual(typeof credentials.expiresAt, 'number')
  })

  test('should set expiration time to default value (300 seconds) from creation', () => {
    const credentials = manager.generateCredentials()
    const currentTime = Date.now()

    // Ensure createdAt is recent
    assert.ok(currentTime - credentials.createdAt <= 100)
    assert.strictEqual(credentials.expiresAt - credentials.createdAt, 300 * 1000)
  })

  test('should create credentials object from a provided client ID', () => {
    const providedClientId = 'custom-client-id'
    const credentials = manager.generateCredentials(providedClientId)

    assert.strictEqual(credentials.clientId, providedClientId)
  })

  test('should generate unique credentials each time', () => {
    const credentials1 = manager.generateCredentials()
    const credentials2 = manager.generateCredentials()

    assert.notStrictEqual(credentials1.clientId, credentials2.clientId)
    assert.notStrictEqual(credentials1.clientSecret, credentials2.clientSecret)
  })

  test('should return credentials for valid client ID', () => {
    const generated = manager.generateCredentials()
    const retrieved = manager.getCredentials(generated.clientId)

    assert.ok(retrieved)
    assert.strictEqual(retrieved.clientId, generated.clientId)
    assert.strictEqual(retrieved.clientSecret, generated.clientSecret)
  })

  test('should return null for non-existent client ID', () => {
    const retrieved = manager.getCredentials('non-existent-id')

    assert.strictEqual(retrieved, null)
  })

  test('should return null for expired credentials', () => {
    const generated = manager.generateCredentials()

    // Token should be expired 301 seconds later
    Date.now = () => fixedTime + 301 * 1000

    const retrieved = manager.getCredentials(generated.clientId)
    assert.strictEqual(retrieved, null)
  })

  test('should return null for expired client ID if the manager has custom expiry duration', () => {
    // Create a manager with 10 seconds expiry duration
    const shortLivedManager = new ClientCredentialsManager(10)
    const generated = shortLivedManager.generateCredentials()

    // Token should be expired 11 seconds later
    Date.now = () => fixedTime + 11 * 1000

    const retrieved = shortLivedManager.getCredentials(generated.clientId)
    assert.strictEqual(retrieved, null)
  })

  test('should add state to existing credentials', () => {
    const credentials = manager.generateCredentials()
    const state = 'test-state-value'

    const success = manager.addState(credentials.clientId, state)

    assert.strictEqual(success, true)
  })

  test('should return false for non-existent client ID', () => {
    const success = manager.addState('non-existent-id', 'test-state')

    assert.strictEqual(success, false)
  })

  test('should return false for expired credentials', () => {
    const credentials = manager.generateCredentials()

    // Token should be expired 301 seconds later
    Date.now = () => fixedTime + 301 * 1000

    const success = manager.addState(credentials.clientId, 'test-state')
    assert.strictEqual(success, false)
  })

  test('should not update state if called a second time', () => {
    const credentials = manager.generateCredentials()

    const success1 = manager.addState(credentials.clientId, 'state-1')
    assert.strictEqual(success1, true)

    const success2 = manager.addState(credentials.clientId, 'state-2')
    assert.strictEqual(success2, false)

    const storedData = manager.getStoredClientIdAndState(credentials.clientId)
    assert.strictEqual(storedData?.state, 'state-1')
  })

  test('should return client ID and state when both exist', () => {
    const credentials = manager.generateCredentials()
    const state = 'test-state-value'

    manager.addState(credentials.clientId, state)
    const retrieved = manager.getStoredClientIdAndState(credentials.clientId)

    assert.strictEqual(retrieved?.clientId, credentials.clientId)
    assert.strictEqual(retrieved?.state, state)
  })

  test('should return null for non-existent client ID', () => {
    const retrieved = manager.getStoredClientIdAndState('non-existent-id')

    assert.strictEqual(retrieved, null)
  })

  test('should return null when credentials exist but no state', () => {
    const credentials = manager.generateCredentials()
    const retrieved = manager.getStoredClientIdAndState(credentials.clientId)

    assert.strictEqual(retrieved, null)
  })

  test('should return null for expired credentials', () => {
    const credentials = manager.generateCredentials()
    manager.addState(credentials.clientId, 'test-state')

    // Token should be expired 301 seconds later
    Date.now = () => fixedTime + 301 * 1000

    const retrieved = manager.getStoredClientIdAndState(credentials.clientId)

    assert.strictEqual(retrieved, null)
  })

  test('should handle mixed expired and valid credentials', () => {
    const credentials1 = manager.generateCredentials()

    // Token should be still valid 30 seconds later
    Date.now = () => fixedTime + 30 * 1000

    const credentials2 = manager.generateCredentials()

    // 301 seconds later the first token will be expired, the second still valid
    Date.now = () => fixedTime + 301 * 1000

    const result1 = manager.getCredentials(credentials1.clientId)
    assert.strictEqual(result1, null)

    const result2 = manager.getCredentials(credentials2.clientId)
    assert.ok(result2)
  })

  test('should clear all stored credentials', () => {
    const credentials1 = manager.generateCredentials()
    const credentials2 = manager.generateCredentials()

    assert.ok(manager.getCredentials(credentials1.clientId))
    assert.ok(manager.getCredentials(credentials2.clientId))

    manager.destroy()

    assert.strictEqual(manager.getCredentials(credentials1.clientId), null)
    assert.strictEqual(manager.getCredentials(credentials2.clientId), null)
  })

  test('should work with empty credentials store', () => {
    assert.doesNotThrow(() => {
      manager.destroy()
    })
  })
})
