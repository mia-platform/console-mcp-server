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
  const REDIRECT_URI = 'vscode://vscode.dev/redirect'

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

    // TODO: Move the baseUrl construction to a common utility if used elsewhere
    const hostname = process.env.HOSTNAME || 'localhost'
    const port = process.env.HTTP_PORT || '3000'
    const baseUrl = `http://${hostname}:${port}`

    // TODO: Probably I'd need to store these information and reuse them instead of rewriting everything in the other endpoints
    // TODO: Probably these would be more suitable in a config map
    reply.send({
      issuer: `https://${OKTA_DOMAIN}`,
      authorization_endpoint: `https://${OKTA_DOMAIN}/oauth2/v1/authorize`,
      token_endpoint: `https://${OKTA_DOMAIN}/oauth2/v1/token`,
      registration_endpoint: `${baseUrl}/register`,
      response_types_supported: [ 'code' ],
      grant_types_supported: [ 'authorization_code' ],
      scopes_supported: [ 'openid', 'profile', 'email' ],
      token_endpoint_auth_methods_supported: [ 'client_secret_basic' ],
      redirect_uris: [ REDIRECT_URI ],
    })
  })

  fastify.post('/register', async (_req: FastifyRequest, reply: FastifyReply) => {
    // This endpoint initiates dynamic client registration. In a real-world scenario,
    // you would validate the request and possibly store the client details.
    // Here, we simply return the pre-configured client ID and secret.

    // TODO: Evaluate internally if save to use the client secret, to avoid impersonation attacks
    fastify.log.debug('POST /register called')

    reply.code(201).send({
      client_id: OKTA_CLIENT_ID,
      client_secret: OKTA_CLIENT_SECRET,
      redirect_uris: [ REDIRECT_URI ],
      client_name: 'Mia-Platform Console MCP Server',
      token_endpoint_auth_method: 'client_secret_basic',
    })
  })

  fastify.get('/authorize', async (_req: FastifyRequest, reply: FastifyReply) => {
    // This enpdoint handles the OAuth2 authorization request, giving the clientId, redirectUri and state
    // to receive a redirect URL to be opened by the user (via browser or webview) to perform login.
    // The redirect URL will then redirect to the /callback endpoint with the authorization code.
    fastify.log.debug('GET /authorize called')

    // TODO: Better an uuid4?
    const state = Math.random().toString(36).substring(2, 15)

    // const authorizeUrl = `https://${OKTA_DOMAIN}/oauth2/default/v1/authorize?` +
    const authorizeUrl = `https://${OKTA_DOMAIN}/oauth2/v1/authorize?` +
      `client_id=${encodeURIComponent(OKTA_CLIENT_ID)}` +
      `&response_type=code` +
      // TODO: Move the scopes in a constant
      `&scope=openid+profile+email` +
      `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
      `&state=${encodeURIComponent(state)}`

    fastify.log.debug({ authorizeUrl, state }, 'Redirecting to Okta authorize endpoint')

    reply.redirect(authorizeUrl)
  })

  // TODO: /callback or /oauth/callback?
  fastify.get('/callback', async (req: FastifyRequest, reply: FastifyReply) => {
    // This endpoint handles the OAuth2 callback after user authentication.
    // It receives the authorization code and state, which can be exchanged for an access token using the /token endpoint.
    fastify.log.debug({ query: req.query }, 'GET /callback called')

    const { code, state } = req.query as { code?: string, state?: string }

    if (!code) {
      fastify.log.debug('Missing code in /callback')
      reply.status(400).send({ error: 'Missing code' })
      return
    }
    // TODO: Add logic to validate the state parameter to prevent CSRF attacks

    fastify.log.debug({ code, state }, 'OAuth2 callback received')

    reply.send({ code, state })
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
          redirect_uri: REDIRECT_URI,
        }),
        {
          headers: {
            // TODO: Shouldn't clientId and clientSecret be sent in the query? Mind that if this works, that would be great,
            //       because it means we don't send the client secret to the client applications.
            Authorization: 'Basic ' + Buffer.from(`${OKTA_CLIENT_ID}:${OKTA_CLIENT_SECRET}`).toString('base64'),
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
