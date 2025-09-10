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

import { suite, test, TestContext } from 'node:test'

import { formatQueryParamToUnixTimestamp } from './utils'

suite('formatQueryParamToUnixTimestamp', () => {
  test('should return undefined for undefined input', (t: TestContext) => {
    t.assert.equal(formatQueryParamToUnixTimestamp(undefined), undefined)
  })

  test('should throw error for invalid date format', (t: TestContext) => {
    t.assert.throws(
      () => formatQueryParamToUnixTimestamp('invalid-date'),
      { message: 'Invalid date format: invalid-date' },
    )
  })

  test('should handle different valid date formats', (t: TestContext) => {
    const testCases = [
      { input: '2023-12-31', expected: '1703980800000' },
      { input: '2023-06-15T12:30:00+02:00', expected: '1686825000000' },
      { input: '2023-06-15T10:30:00Z', expected: '1686825000000' },
      { input: '2023-06-15T10:30:00.000Z', expected: '1686825000000' },
      { input: '2023-06-15T10:30:00.000+00:00', expected: '1686825000000' },
    ]

    for (const { input, expected } of testCases) {
      t.assert.equal(formatQueryParamToUnixTimestamp(input), expected, `Failed for input: ${input} (expected: ${expected})`)
    }
  })
})
