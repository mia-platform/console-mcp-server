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

import qs from 'node:querystring'
import { request } from 'undici'

import { loadMiactlToken } from './miactl-cache'
import { UserAgent } from './useragent'

const m2mPath = '/api/m2m/oauth/token'
const refreshPath = '/api/refreshtoken'

export class AccessToken {
  access_token: string
  token_type: string
  private expires_at: number
  private refresh_token?: string

  constructor (token: string, token_type: string, expires_in: number, refresh_token?: string) {
    this.access_token = token
    this.token_type = token_type
    this.expires_at = Date.now() + expires_in * 1000
    this.refresh_token = refresh_token
  }

  expired (expirationWindowSeconds = 0): boolean {
    return this.expires_at - (Date.now() + expirationWindowSeconds * 1000) <= 0
  }

  refreshToken (): string | undefined {
    return this.refresh_token
  }
}

interface AuthnOpts {
  clientId?: string
  clientSecret?: string
}

export async function doAuthentication (baseURL: string, options: AuthnOpts): Promise<AccessToken | undefined> {
  if (options.clientId && options.clientSecret) {
    return await doM2MAuthentication(baseURL, options.clientId, options.clientSecret)
  }


  return await doUserAuthentication(baseURL)
}

interface M2MTokenResponse {
  access_token: string
  token_type: string
  expires_in: number
}

interface UserTokenResponse {
  accessToken: string
  refreshToken: string
  expiresAt: number
}

async function doM2MAuthentication (baseURL: string, clientId: string, clientCredentials: string): Promise<AccessToken> {
  const url = new URL(m2mPath, baseURL)

  const { statusCode, body } = await request(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientCredentials}`).toString('base64')}`,
      'User-Agent': UserAgent,
    },
    body: qs.stringify({
      grant_type: 'client_credentials',
    }),
  })

  if (statusCode != 200) {
    const data = await body.json() as Record<string, string>
    const message = data.message || `Unknown error with status ${statusCode}`
    throw new Error(message)
  }

  const data = await body.json() as M2MTokenResponse
  return new AccessToken(data.access_token, data.token_type, data.expires_in)
}

/**
 * @deprecated We are going to remove the support of the miactl token soon. Either use M2M authentication or OAuth2 authentication.
 * @param baseURL the base URL of the MCP server
 * @returns an access token
 */
async function doUserAuthentication (baseURL: string): Promise<AccessToken | undefined> {
  const miactlToken = await loadMiactlToken(baseURL)
  if (!miactlToken) {
    return undefined
  }

  if (!miactlToken.expired()) {
    return miactlToken
  }

  const refreshedToken = await refreshToken(baseURL, miactlToken)
  return refreshedToken
}

async function refreshToken (baseURL: string, token: AccessToken): Promise<AccessToken> {
  const url = new URL(refreshPath, baseURL)

  const refreshToken = token.refreshToken()
  if (!refreshToken) {
    throw new Error('No refresh token available')
  }
  const { statusCode, body } = await request(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': UserAgent,
    },
    body: JSON.stringify({
      refreshToken,
    }),
  })

  if (statusCode != 200) {
    const data = await body.json() as Record<string, string>
    const message = data.message || `Unknown error with status ${statusCode}`
    throw new Error(message)
  }

  const data = await body.json() as UserTokenResponse

  const expiresIn = Math.floor((data.expiresAt - Date.now()) / 1000)
  return new AccessToken(data.accessToken, 'Bearer', expiresIn, data.refreshToken)
}
