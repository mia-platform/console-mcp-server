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

import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'

import { getBaseUrlFromRequest } from '../utils'

const BASE_PATH = 'console-mcp-server'
const AUTHORIZE_PATH = `${BASE_PATH}/oauth/authorize`
const TOKEN_PATH = `${BASE_PATH}/oauth/token`
const REGISTER_PATH = `${BASE_PATH}/oauth/register`

export const OAUTH_PROTECTED_RESOURCE_PATH = `/.well-known/oauth-protected-resource/${BASE_PATH}`
const OAUTH_AUTHORIZATION_SERVER_PATH = `/.well-known/oauth-authorization-server/${BASE_PATH}`
const OAUTH_SCOPES = [ 'profile', 'email', 'openid', 'offline_access' ]

export async function wellKnownRouter (fastify: FastifyInstance, options: { host?: string }) {
  const { host = '' } = options

  fastify.get(OAUTH_PROTECTED_RESOURCE_PATH, async (request: FastifyRequest, reply: FastifyReply) => {
    const { body, headers } = request

    fastify.log.debug({
      message: `GET ${OAUTH_PROTECTED_RESOURCE_PATH} called`,
      requestBody: body,
      requestHeaders: headers,
    })

    const baseUrl = getBaseUrlFromRequest(request)

    reply.send({
      resource_name: 'Console MCP Server',
      resource: `${baseUrl}/${BASE_PATH}/mcp`,
      authorization_servers: [ `${baseUrl}/${BASE_PATH}` ],
      scopes_supported: OAUTH_SCOPES,
      bearer_methods_supported: [ 'header' ],
    })
  })

  fastify.get(OAUTH_AUTHORIZATION_SERVER_PATH, async (request: FastifyRequest, reply: FastifyReply) => {
    const { body, headers } = request
    const baseUrl = getBaseUrlFromRequest(request)

    fastify.log.debug({
      message: `GET ${OAUTH_AUTHORIZATION_SERVER_PATH} called`,
      requestBody: body,
      requestHeaders: headers,
    })

    reply.send({
      issuer: host,
      authorization_endpoint: `${baseUrl}/${AUTHORIZE_PATH}`,
      token_endpoint: `${baseUrl}/${TOKEN_PATH}`,
      registration_endpoint: `${baseUrl}/${REGISTER_PATH}`,
      scopes_supported: OAUTH_SCOPES,
      response_types_supported: [ 'code' ],
      code_challenge_methods_supported: [ 'S256' ],
      response_modes_supported: [ 'query' ],
      grant_types_supported: [
        'authorization_code',
        'refresh_token',
      ],
      token_endpoint_auth_methods_supported: [ 'none' ],
    })
  })
}
