import axios from 'axios'
import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'

import 'dotenv/config'

// TODO: Logs should be improved to be more consistent, formatted
export async function oauthRouter (fastify: FastifyInstance) {
  const OKTA_DOMAIN = process.env.OKTA_DOMAIN || ''
  const OKTA_CLIENT_ID = process.env.OKTA_CLIENT_ID || ''
  const OKTA_CLIENT_SECRET = process.env.OKTA_CLIENT_SECRET || ''

  // TODO: Probably this would come in form of a configurable env var or a constant file with several redirect URIs
  //       depending on the environment and/or the client applications (e.g. VSCode, web app, etc.)
  // TODO: If localhost, this must be 33418 for VSCode, otherwise the redirect won't work
  // const REDIRECT_URI = 'https://localhost:53535/oauth/callback'

  if (!OKTA_DOMAIN || !OKTA_CLIENT_ID || !OKTA_CLIENT_SECRET) {
    fastify.log.warn({
      message: 'Missing required environment variables: OKTA_DOMAIN, OKTA_CLIENT_ID, OKTA_CLIENT_SECRET',
      missing_domain: !OKTA_DOMAIN,
      missing_client_id: !OKTA_CLIENT_ID,
      missing_client_secret: !OKTA_CLIENT_SECRET,
    })
    return
  }

  fastify.get('/.well-known/oauth-authorization-server', async (_req: FastifyRequest, reply: FastifyReply) => {
    // Enpdoint to expose OAuth2 authorization server metadata, which means the endpoints and
    // configurations needed by OAuth2 clients to interact with the authorization server.
    fastify.log.debug('GET /.well-known/oauth-authorization-server called')

    reply.send({
      issuer: `https://${OKTA_DOMAIN}`,
      authorization_endpoint: `https://${OKTA_DOMAIN}/oauth2/v1/authorize`,
      token_endpoint: `https://${OKTA_DOMAIN}/oauth2/v1/token`,
      registration_endpoint: `https://${OKTA_DOMAIN}/oauth2/v1/clients`,
      response_types_supported: [ 'code' ],
      grant_types_supported: [ 'authorization_code' ],
      scopes_supported: [ 'openid', 'profile', 'email' ],
      token_endpoint_auth_methods_supported: [ 'client_secret_basic' ],
      // redirect_uris: [ REDIRECT_URI ],
    })
  })

  fastify.post('/token', async (req: FastifyRequest, reply: FastifyReply) => {
    // This endpoint exchanges the authorization code for an access token by communicating with Okta's token endpoint.
    // The token received can be used in future requests to authenticate the client, then forwarded to the API Clients.
    fastify.log.debug({ body: req.body }, 'POST /token called')
    const { code } = req.body as { code?: string }

    if (!code) {
      fastify.log.debug('Missing code in /token')
      reply.status(400).send({ error: 'Missing code' })
      return
    }

    try {
      fastify.log.debug('Exchanging code for token with Okta')

      const tokenRes = await axios.post(
        // `https://${OKTA_DOMAIN}/oauth2/default/v1/token`,
        `https://${OKTA_DOMAIN}/oauth2/v1/token`,
        new URLSearchParams({
          grant_type: 'authorization_code',
          code,
          // redirect_uri: REDIRECT_URI,
        }),
        {
          headers: {
            // TODO: Shouldn't clientId and clientSecret be sent in the query? Mind that if this works, that would be great,
            //       because it means we don't send the client secret to the client applications.
            // Authorization: 'Basic ' + Buffer.from(`${OKTA_CLIENT_ID}:${OKTA_CLIENT_SECRET}`).toString('base64'),
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        },
      )
      fastify.log.debug({ token: tokenRes.data }, 'Token received from Okta')
      reply.send(tokenRes.data)
    } catch (err) {
      const error = err as { response?: { data?: unknown }, message?: string }
      fastify.log.error({ error }, 'Token exchange failed')
      reply.status(500).send({ error: 'Token exchange failed', details: error?.response?.data || error?.message })
    }
  })
}
