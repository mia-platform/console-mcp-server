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
import { type AuthorizeRequest, type RegisterRequest, TokenRequest } from './types'

const OAUTH_AUTHORIZE_PATH = '/oauth2/v1/authorize'
const OAUTH_TOKEN_PATH = '/oauth2/v1/token'

export interface OktaCredentials {
  clientId: string
  clientSecret: string
  host: string
}

export interface OAuthRouterOptions {

  /** Used by fastify. Defines the prefix where the endpoint defined in oauthRouter will be placed. */
  prefix?: string

  /** Credentials to connect to the Okta IDP to receive the token */
  oktaClientCredentials?: OktaCredentials

  /** Duration, in seconds, after which the client credentials created via `/register` route are deleted. */
  clientExpiryDuration?: number
}


export async function oauthRouter (fastify: FastifyInstance, options: OAuthRouterOptions) {
  const { oktaClientCredentials, clientExpiryDuration } = options

  if (!oktaClientCredentials) {
    fastify.log.warn('Okta client credentials not provided. OAuth routes will not be available.')
    return
  }

  const { clientId, clientSecret, host } = oktaClientCredentials

  const clientManager = new ClientCredentialsManager(clientExpiryDuration)

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

    const { clientId, createdAt } = clientManager.generateCredentials()
    reply.code(201).send({
      client_id: clientId,
      client_id_issued_at: createdAt,
      redirect_uris: body.redirect_uris,
      grant_types: body.grant_types ?? [ 'authorization_code', 'refresh_token' ],
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

    const authorizeParams = new URLSearchParams()
    authorizeParams.set('client_id', clientId)

    if (query.response_type) authorizeParams.set('response_type', query.response_type)
    if (query.redirect_uri) authorizeParams.set('redirect_uri', query.redirect_uri)
    if (query.scope) authorizeParams.set('scope', query.scope)
    if (query.state) authorizeParams.set('state', query.state)
    if (query.code_challenge) authorizeParams.set('code_challenge', query.code_challenge)
    if (query.code_challenge_method) authorizeParams.set('code_challenge_method', query.code_challenge_method)

    const oktaAuthorizeUrl = new URL(`${OAUTH_AUTHORIZE_PATH}?${authorizeParams.toString()}`, host)

    try {
      return reply.code(302).header('Location', oktaAuthorizeUrl.toString()).send()
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

    if (!body.grant_type) {
      return reply.code(400).send({
        error: 'invalid_request',
        error_description: 'grant_type is required',
      })
    }

    if (body.grant_type !== 'authorization_code' && body.grant_type !== 'refresh_token') {
      return reply.code(400).send({
        error: 'unsupported_grant_type',
        error_description: 'Only "authorization_code" and "refresh_token" grant types are supported.',
      })
    }

    const credentials = clientManager.getCredentials(body.client_id)
    if (!credentials) {
      return reply.code(401).send({
        error: 'invalid_client',
        error_description: 'Invalid client credentials',
      })
    }

    const tokenRequestBody = new URLSearchParams()
    tokenRequestBody.set('grant_type', 'authorization_code')
    tokenRequestBody.set('client_id', clientId)
    tokenRequestBody.set('client_secret', clientSecret)

    if (body.grant_type === 'authorization_code') {
      if (!body.code) {
        return reply.code(400).send({
          error: 'invalid_request',
          error_description: 'code is required',
        })
      }

      tokenRequestBody.set('code', body.code)
      tokenRequestBody.set('redirect_uri', body.redirect_uri || '')
      tokenRequestBody.set('code_verifier', body.code_verifier || '')
    } else if (body.grant_type === 'refresh_token') {
      if (!body.refresh_token) {
        return reply.code(400).send({
          error: 'invalid_request',
          error_description: 'refresh_token is required for refresh_token grant',
        })
      }

      tokenRequestBody.set('refresh_token', body.refresh_token)
      if (body.scope) tokenRequestBody.set('scope', body.scope)
    }

    try {
      const response = await fetch(`${host}${OAUTH_TOKEN_PATH}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: tokenRequestBody.toString(),
      })

      if (!response.ok) {
        const errorText = await response.text()
        fastify.log.error({ status: response.status, error: errorText }, 'Okta token request failed')
        return reply.code(response.status).send({
          error: 'invalid_request',
          error_description: `Failed to complete the ${body.grant_type} request.`,
        })
      }

      const tokenData = await response.json()
      return reply.code(200).send(tokenData)
    } catch (error) {
      fastify.log.error({ error }, 'Failed to call Authentication Server')
      return reply.code(500).send({
        error: 'server_error',
        error_description: `Failed to process the ${body.grant_type} request.`,
      })
    }
  })

  fastify.addHook('onClose', async () => {
    clientManager.destroy()
  })
}
