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

import test, { suite } from 'node:test'

import { sha256 } from '.'

suite('sha256', () => {
  test('should convert empty string to empty sha256', (t) => {
    // echo -n "" | sha256sum
    // e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855
    const input = ''
    const expectedOutput = 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'
    const result = sha256(input)
    t.assert.equal(result, expectedOutput)
  })

  test('should convert string to sha256', (t) => {
    // echo -n "hello" | sha256sum
    // 2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824
    const input = 'hello'
    const expectedOutput = '2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824'
    const result = sha256(input)
    t.assert.equal(result, expectedOutput)
  })

  test('should convert string with special characters to sha256', (t) => {
    // echo -n "hello@123" | sha256sum
    // 71c72e7e33d58c8a0cab0caba274eef284c3c6c41d2780273d57a2a79d01754f
    const input = 'hello@123'
    const expectedOutput = '71c72e7e33d58c8a0cab0caba274eef284c3c6c41d2780273d57a2a79d01754f'
    const result = sha256(input)
    t.assert.equal(result, expectedOutput)
  })
})
