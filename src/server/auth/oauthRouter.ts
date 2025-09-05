import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'

import 'dotenv/config'

const OKTA_CLIENT_ID = process.env.OKTA_CLIENT_ID

const getBaseUrlFromRequest = (req: FastifyRequest) => {
  const { hostname = 'localhost', port = process.env.PORT, protocol = 'http' } = req
  return `${protocol}://${hostname}:${port}`
}

export async function oauthRouter (fastify: FastifyInstance, options: { host?: string }) {
  const { host = '' } = options

  fastify.get('/.well-known/oauth-protected-resource', async (request: FastifyRequest, reply: FastifyReply) => {
    const { body, headers } = request
    const baseUrl = getBaseUrlFromRequest(request)

    fastify.log.debug({
      message: 'GET /.well-known/oauth-protected-resource called',
      requestBody: body,
      requestHeaders: headers,
    })

    reply.send({
      resource_name: 'Console MCP Server',
      resource: `${baseUrl}/mcp`,
      authorization_servers: [ baseUrl ],
      scopes_supported: [ 'profile', 'email', 'openid', 'offline-access' ],
      bearer_methods_supported: [ 'header' ],
    })
  })

  fastify.post('/register', async (request: FastifyRequest, reply: FastifyReply) => {
    const { body, headers } = request

    fastify.log.debug({
      message: 'POST /register called',
      requestBody: body,
      requestHeaders: headers,
    })

    reply.send({
      client_id: OKTA_CLIENT_ID,
    })
  })

  fastify.get('/.well-known/oauth-authorization-server', async (request: FastifyRequest, reply: FastifyReply) => {
    const { body, headers } = request
    const baseUrl = getBaseUrlFromRequest(request)

    fastify.log.debug({
      message: 'GET /.well-known/oauth-authorization-server called',
      requestBody: body,
      requestHeaders: headers,
    })

    reply.send({
      issuer: host,
      authorization_endpoint: `${host}/api/authorize?appId=console-mcp-server&providerId=okta`,
      token_endpoint: `${host}/api/oauth/token?appId=console-mcp-server&providerId=okta`,
      scopes_supported: [ 'profile', 'email', 'openid', 'offline-access' ],
      registration_endpoint: `${baseUrl}/register`,
      response_types_supported: [
        'code',
      ],
      response_modes_supported: [
        'query',
      ],
      grant_types_supported: [
        'authorization_code',
        'refresh_token',
      ],
      token_endpoint_auth_methods_supported: [
        'client_secret_basic',
        'client_secret_post',
        'none',
      ],
    })
  })
}
