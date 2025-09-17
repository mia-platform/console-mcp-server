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

import { afterEach, beforeEach, suite, test } from 'node:test'
import Fastify, { FastifyInstance } from 'fastify'

import { statusRoutes } from './statusRoutes.js'
import { name, version } from '../../package.json'

suite('test http streaming server', () => {

  let fastify: FastifyInstance
  beforeEach(async () => {
    fastify = Fastify({
      logger: false,
    })

    fastify.register(statusRoutes)
  })

  afterEach(async () => {
    await fastify.close()
  })

  test('invoke ready API', async (t) => {
    const response = await fastify.inject({
      method: 'GET',
      path: '/ready',
    })

    t.assert.equal(response.statusCode, 200)
    t.assert.deepEqual(response.json(), {
      name,
      status: 'OK',
      statusOK: true,
      version,
    })
  })

  test('invoke healthz API', async (t) => {
    const response = await fastify.inject({
      method: 'GET',
      path: '/healthz',
    })

    t.assert.equal(response.statusCode, 200)
    t.assert.deepEqual(response.json(), {
      name,
      status: 'OK',
      statusOK: true,
      version,
    })
  })
})
