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

import { ClientCredentialsManager } from './clientCredentialsManager'
import { type AuthorizeRequest, type RefreshTokenRequest, type RegisterRequest, type TokenRequest } from './types'

const OAUTH_AUTHORIZE_PATH = '/api/authorize'
const OAUTH_TOKEN_PATH = '/api/oauth/token'
const OAUTH_REFRESH_TOKEN_PATH = '/api/refreshToken'


export async function oauthRouter (fastify: FastifyInstance, options: { host?: string }) {
  const { host = '' } = options
  const clientManager = new ClientCredentialsManager()

  fastify.post('/register', async (request: FastifyRequest, reply: FastifyReply) => {
    const body = request.body as RegisterRequest

    fastify.log.debug({
      message: 'POST /register called',
      requestBody: body,
    })

    if (!body.redirect_uris || !Array.isArray(body.redirect_uris)) {
      return reply.code(400).send({
        error: 'invalid_client_metadata',
        error_description: '"redirect_uris" is required and must be an array',
      })
    }

    const { clientId, clientSecret, expiresAt, createdAt } = clientManager.generateCredentials()
    reply.code(201).send({
      client_id: clientId,
      client_secret: clientSecret,
      client_id_issued_at: createdAt,
      client_secret_expires_at: expiresAt,
      redirect_uris: body.redirect_uris,
      grant_types: body.grant_types ?? [ 'authorization_code' ],
      response_types: body.response_types ?? [ 'code' ],
      client_name: body.client_name ?? 'Unknown Client',
      token_endpoint_auth_method: body.token_endpoint_auth_method ?? 'client_secret_basic',
      scope: body.scope ?? '',
    })
  })

  fastify.get('/authorize', async (request: FastifyRequest, reply: FastifyReply) => {
    const query = request.query as AuthorizeRequest

    fastify.log.debug({ message: 'GET /authorize called', requestQuery: query })

    if (!query.client_id) {
      return reply.code(400).send({
        error: 'invalid_request',
        error_description: 'client_id is required',
      })
    }

    const credentials = clientManager.getCredentials(query.client_id)
    if (!credentials) {
      fastify.log.debug({ clientId: query.client_id }, 'Invalid or expired client_id')
      return reply.code(400).send({
        error: 'invalid_client',
        error_description: 'Invalid or expired client_id',
      })
    }

    if (query.state) {
      const success = clientManager.addState(query.client_id, query.state)
      if (!success) {
        fastify.log.debug({ clientId: query.client_id }, 'Failed to store state for client_id')
        return reply.code(400).send({
          error: 'invalid_client',
          error_description: 'Invalid or expired client_id',
        })
      }
    }

    const authorizeParams = new URLSearchParams()
    authorizeParams.set('appId', 'console-mcp-server')
    authorizeParams.set('providerId', 'okta')

    if (query.response_type) authorizeParams.set('response_type', query.response_type)
    if (query.redirect_uri) authorizeParams.set('redirect_uri', query.redirect_uri)
    if (query.scope) authorizeParams.set('scope', query.scope)
    if (query.state) authorizeParams.set('state', query.state)
    if (query.code_challenge) authorizeParams.set('code_challenge', query.code_challenge)
    if (query.code_challenge_method) authorizeParams.set('code_challenge_method', query.code_challenge_method)

    const oktaAuthorizeUrl = new URL(`${OAUTH_AUTHORIZE_PATH}?${authorizeParams.toString()}`, host)

    try {
      const response = await fetch(oktaAuthorizeUrl, {
        method: 'GET',
        redirect: 'manual',
      })

      if (response.status === 302) {
        const location = response.headers.get('location')
        if (location) {
          return reply.code(302).header('location', location).send()
        }
      }

      return reply.code(response.status).send(await response.text())
    } catch (error) {
      fastify.log.error({ error }, 'Failed to call Okta authorize endpoint')
      return reply.code(500).send({
        error: 'server_error',
        error_description: 'Failed to process authorization request',
      })
    }
  })

  fastify.post('/token', async (request: FastifyRequest, reply: FastifyReply) => {
    const body = request.body as TokenRequest

    fastify.log.debug({ message: 'POST /token called', requestBody: body })

    if (!body.code) {
      return reply.code(400).send({
        error: 'invalid_request',
        error_description: 'code is required',
      })
    }

    if (!body.client_id || !body.client_secret) {
      return reply.code(400).send({
        error: 'invalid_request',
        error_description: 'client_id and client_secret are required',
      })
    }

    const credentials = clientManager.getCredentials(body.client_id)
    console.log({ credentials, body })
    if (!credentials || credentials.clientSecret !== body.client_secret) {
      return reply.code(401).send({
        error: 'invalid_client',
        error_description: 'Invalid client credentials',
      })
    }

    const storedClientData = clientManager.getStoredClientIdAndState(body.client_id)
    if (!storedClientData || !storedClientData.state) {
      return reply.code(400).send({
        error: 'invalid_request',
        error_description: 'No state found for client_id',
      })
    }

    const tokenRequestBody = new URLSearchParams()
    tokenRequestBody.set('code', body.code)
    tokenRequestBody.set('state', storedClientData.state)

    const oktaTokenUrl = `${host}${OAUTH_TOKEN_PATH}`

    try {
      const response = await fetch(oktaTokenUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: tokenRequestBody.toString(),
      })

      if (!response.ok) {
        const errorText = await response.text()
        fastify.log.error({ status: response.status, error: errorText }, 'Okta token request failed')
        return reply.code(response.status).send({
          error: 'invalid_request',
          error_description: 'Failed to exchange authorization code',
        })
      }

      const tokenData = await response.json()

      return reply.code(200).send({
        access_token: tokenData.accessToken,
        refresh_token: tokenData.refreshToken,
        expires_at: tokenData.expiresAt,
        token_type: 'Bearer',
      })
    } catch (error) {
      fastify.log.error({ error }, 'Failed to call Authentication Server')
      return reply.code(500).send({
        error: 'server_error',
        error_description: 'Failed to process token request',
      })
    }
  })

  fastify.post('/refreshToken', async (request: FastifyRequest, reply: FastifyReply) => {
    const body = request.body as RefreshTokenRequest

    fastify.log.debug({ message: 'POST /refreshToken called', requestBody: body })

    if (!body.grant_type || body.grant_type !== 'refresh_token') {
      return reply.code(400).send({
        error: 'unsupported_grant_type',
        error_description: 'Only refresh_token grant type is supported',
      })
    }

    if (!body.refresh_token) {
      return reply.code(400).send({
        error: 'invalid_request',
        error_description: 'refresh_token is required',
      })
    }

    const refreshTokenRequestBody = new URLSearchParams()
    refreshTokenRequestBody.set('grant_type', 'refresh_token')
    refreshTokenRequestBody.set('refresh_token', body.refresh_token)
    if (body.client_id) refreshTokenRequestBody.set('client_id', body.client_id)
    if (body.client_secret) refreshTokenRequestBody.set('client_secret', body.client_secret)

    const refreshTokenUrl = `${host}${OAUTH_REFRESH_TOKEN_PATH}`

    try {
      const response = await fetch(refreshTokenUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: refreshTokenRequestBody.toString(),
      })

      if (!response.ok) {
        const errorText = await response.text()
        fastify.log.error({ status: response.status, error: errorText }, 'Okta refresh token request failed')
        return reply.code(response.status).send({
          error: 'invalid_request',
          error_description: 'Failed to refresh token',
        })
      }

      const tokenData = await response.json()
      console.log({ tokenData })

      return reply.code(200).send({
        access_token: tokenData.accessToken,
        refresh_token: tokenData.refreshToken,
        expires_at: tokenData.expiresAt,
        token_type: 'Bearer',
      })
    } catch (error) {
      fastify.log.error({ error }, 'Failed to call Authentication Server for refresh token')
      return reply.code(500).send({
        error: 'server_error',
        error_description: 'Failed to process refresh token request',
      })
    }
  })

  fastify.addHook('onClose', async () => {
    clientManager.destroy()
  })
}
