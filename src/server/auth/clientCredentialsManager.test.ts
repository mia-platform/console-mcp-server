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
import { beforeEach, describe, test } from 'node:test'

import { ClientCredentialsManager } from './clientCredentialsManager'

describe('ClientCredentialsManager', () => {
  let manager: ClientCredentialsManager

  beforeEach(() => {
    manager = new ClientCredentialsManager()
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

  test('should set expiration time to 60 seconds from creation', () => {
    const credentials = manager.generateCredentials()
    const currentTime = Date.now()

    // Ensure createdAt is recent
    assert.ok(currentTime - credentials.createdAt <= 100)
    assert.strictEqual(credentials.expiresAt - credentials.createdAt, 60 * 1000)
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
    // Create credentials with a past expiration time by mocking Date.now
    const originalDateNow = Date.now
    const fixedTime = 1000000000000 // Fixed timestamp
    Date.now = () => fixedTime

    const generated = manager.generateCredentials()

    // Restore Date.now and advance time
    Date.now = () => fixedTime + 61 * 1000 // 61 seconds later

    const retrieved = manager.getCredentials(generated.clientId)

    // Restore original Date.now
    Date.now = originalDateNow

    assert.strictEqual(retrieved, null)
  })

  test('should clean up expired credentials when accessing them', () => {
    // Create credentials with a past expiration time
    const originalDateNow = Date.now
    const fixedTime = 1000000000000
    Date.now = () => fixedTime

    const generated = manager.generateCredentials()

    // Advance time to expire credentials
    Date.now = () => fixedTime + 61 * 1000

    // First call should return null and clean up
    const retrieved1 = manager.getCredentials(generated.clientId)
    assert.strictEqual(retrieved1, null)

    // Second call should also return null (confirming cleanup)
    const retrieved2 = manager.getCredentials(generated.clientId)
    assert.strictEqual(retrieved2, null)

    // Restore original Date.now
    Date.now = originalDateNow
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
    const originalDateNow = Date.now
    const fixedTime = 1000000000000
    Date.now = () => fixedTime

    const credentials = manager.generateCredentials()

    // Advance time to expire credentials
    Date.now = () => fixedTime + 61 * 1000

    const success = manager.addState(credentials.clientId, 'test-state')

    Date.now = originalDateNow

    assert.strictEqual(success, false)
  })

  test('should clean up expired credentials when adding state', () => {
    const originalDateNow = Date.now
    const fixedTime = 1000000000000
    Date.now = () => fixedTime

    const credentials = manager.generateCredentials()

    // Advance time to expire credentials
    Date.now = () => fixedTime + 61 * 1000

    // Adding state should fail and clean up expired credentials
    const success = manager.addState(credentials.clientId, 'test-state')
    assert.strictEqual(success, false)

    // Subsequent access should also return null
    const retrieved = manager.getCredentials(credentials.clientId)
    assert.strictEqual(retrieved, null)

    Date.now = originalDateNow
  })

  test('should not update state if called multiple times', () => {
    const credentials = manager.generateCredentials()

    const success1 = manager.addState(credentials.clientId, 'state-1')
    assert.strictEqual(success1, true)

    const success2 = manager.addState(credentials.clientId, 'state-2')
    assert.strictEqual(success2, true)

    const storedData = manager.getStoredClientIdAndState(credentials.clientId)
    assert.ok(storedData)
    assert.strictEqual(storedData.state, 'state-2')
  })

  test('should return client ID and state when both exist', () => {
    const credentials = manager.generateCredentials()
    const state = 'test-state-value'

    manager.addState(credentials.clientId, state)
    const retrieved = manager.getStoredClientIdAndState(credentials.clientId)

    assert.ok(retrieved)
    assert.strictEqual(retrieved.clientId, credentials.clientId)
    assert.strictEqual(retrieved.state, state)
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
    const originalDateNow = Date.now
    const fixedTime = 1000000000000
    Date.now = () => fixedTime

    const credentials = manager.generateCredentials()
    manager.addState(credentials.clientId, 'test-state')

    // Advance time to expire credentials
    Date.now = () => fixedTime + 61 * 1000

    const retrieved = manager.getStoredClientIdAndState(credentials.clientId)

    Date.now = originalDateNow

    assert.strictEqual(retrieved, null)
  })

  test('should handle mixed expired and valid credentials', () => {
    const originalDateNow = Date.now
    const fixedTime = 1000000000000
    Date.now = () => fixedTime

    // Generate first credential
    const credentials1 = manager.generateCredentials()

    // Advance time slightly (not enough to expire)
    Date.now = () => fixedTime + 30 * 1000

    // Generate second credential (first should still be valid)
    const credentials2 = manager.generateCredentials()

    // Advance time to expire only the first credential
    Date.now = () => fixedTime + 65 * 1000

    // Access credentials (should clean up expired ones)
    const result1 = manager.getCredentials(credentials1.clientId)
    const result2 = manager.getCredentials(credentials2.clientId)

    assert.strictEqual(result1, null) // First should be expired and cleaned up
    assert.ok(result2) // Second should still be valid

    Date.now = originalDateNow
  })

  test('should clear all stored credentials', () => {
    const credentials1 = manager.generateCredentials()
    const credentials2 = manager.generateCredentials()

    // Verify credentials exist
    assert.ok(manager.getCredentials(credentials1.clientId))
    assert.ok(manager.getCredentials(credentials2.clientId))

    // Destroy all credentials
    manager.destroy()

    // Verify all credentials are gone
    assert.strictEqual(manager.getCredentials(credentials1.clientId), null)
    assert.strictEqual(manager.getCredentials(credentials2.clientId), null)
  })

  test('should work with empty credentials store', () => {
    // Should not throw when no credentials exist
    assert.doesNotThrow(() => {
      manager.destroy()
    })
  })
})
