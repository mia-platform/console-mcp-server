import { beforeEach, suite, test } from 'node:test'
import Fastify, { FastifyInstance } from 'fastify'

import { wellKnownRouter } from './wellKnownRouter'


suite('./well-known routes', () => {
  let fastify: FastifyInstance
  beforeEach(async () => {
    fastify = Fastify({
      logger: false,
    })

    fastify.register(wellKnownRouter, { host: 'https://my-console-host.com' })
  })

  test('GET /.well-known/oauth-protected-resource/console-mcp-server', async (t) => {
    const response = await fastify.inject({
      method: 'GET',
      path: '/.well-known/oauth-protected-resource/console-mcp-server',
    })

    t.assert.equal(response.statusCode, 200)
    t.assert.equal(response.headers['content-type'], 'application/json; charset=utf-8')
    const body = JSON.parse(response.body)
    t.assert.equal(body.resource_name, 'Console MCP Server')
    t.assert.equal(body.resource, `http://localhost:80/console-mcp-server/mcp`)
    t.assert.equal(body.authorization_servers[0], `http://localhost:80/console-mcp-server`)
    t.assert.deepEqual(body.scopes_supported, [ 'profile', 'email', 'openid', 'offline_access' ])
    t.assert.deepEqual(body.bearer_methods_supported, [ 'header' ])
  })

  test('GET /.well-known/oauth-authorization-server/console-mcp-server', async (t) => {
    const response = await fastify.inject({
      method: 'GET',
      path: '/.well-known/oauth-authorization-server/console-mcp-server',
    })

    t.assert.equal(response.statusCode, 200)
    t.assert.equal(response.headers['content-type'], 'application/json; charset=utf-8')
    const body = JSON.parse(response.body)
    t.assert.equal(body.issuer, 'https://my-console-host.com')
    t.assert.equal(body.authorization_endpoint, `http://localhost:80/console-mcp-server/oauth/authorize`)
    t.assert.equal(body.token_endpoint, `http://localhost:80/console-mcp-server/oauth/token`)
    t.assert.equal(body.registration_endpoint, `http://localhost:80/console-mcp-server/oauth/register`)
    t.assert.deepEqual(body.scopes_supported, [ 'profile', 'email', 'openid', 'offline_access' ])
    t.assert.deepEqual(body.response_types_supported, [ 'code' ])
    t.assert.deepEqual(body.code_challenge_methods_supported, [ 'S256' ])
    t.assert.deepEqual(body.response_modes_supported, [ 'query' ])
    t.assert.deepEqual(body.grant_types_supported, [
      'authorization_code',
      'refresh_token',
    ])
  })
})
