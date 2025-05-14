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

export class AccessToken {
  access_token: string
  token_type: string
  private expires_at: number

  constructor (token: string, token_type: string, expires_in: number) {
    this.access_token = token
    this.token_type = token_type
    this.expires_at = Date.now() + expires_in * 1000
  }

  expired (expirationWindowSeconds: number): boolean {
    return this.expires_at - (Date.now() + expirationWindowSeconds * 1000) <= 0
  }
}

interface AuthnOpts {
  clientId?: string,
  clientSecret?: string,
}

export async function doAuthentication (basePath: string, options: AuthnOpts): Promise<AccessToken|undefined> {
  if (options.clientId && options.clientSecret) {
    console.error('do authentication with m2m credentials')
    return await doM2MAuthentication(basePath, options.clientId, options.clientSecret)
  }

  console.error('do authentication with miactl token from cache')
  return await loadMiactlToken(basePath)
}

interface M2MTokenResponse {
  access_token: string
  token_type: string
  expires_in: number
}

async function doM2MAuthentication (basePath: string, clientId: string, clientCredentials: string): Promise<AccessToken> {
  const url = new URL(m2mPath, basePath)

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

  console.error('data tokentype', data)
  return new AccessToken(data.access_token, data.token_type, data.expires_in)
}
