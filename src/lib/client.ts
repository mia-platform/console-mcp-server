// Copyright Mia srl
// SPDX-License-Identifier: Apache-2.0

// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at

//     http://www.apache.org/licenses/LICENSE-2.0

// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import qs from 'node:querystring'
import { request } from 'undici'
import Dispatcher, { UndiciHeaders } from 'undici/types/dispatcher'

import { constants } from '@mia-platform/console-types'

import { name, version } from '../../package.json'

const { API_CONSOLE_TOTAL_PAGES_HEADER_KEY } = constants

const UserAgent = `${name}/${version}`
const m2mPath = '/api/m2m/oauth/token'
const EXPIRATION_WINDOW_IN_SECONDS = 300

export class APIClient {
  private baseURL: string
  private token: AccessToken | undefined
  private clientID: string
  private clientSecret: string

  constructor (baseURL: string, clientID?: string, clientSecret?: string) {
    this.baseURL = baseURL
    this.clientID = clientID || ''
    this.clientSecret = clientSecret || ''
  }

  async get<T> (path: string, additionalHeaders: Record<string, unknown> = {}, params?: URLSearchParams): Promise<T> {
    const url = new URL(path, this.baseURL)
    if (params) {
      url.search = params.toString()
    }

    const { body } = await this.doRequest(url, 'GET', additionalHeaders)
    return await body.json() as T
  }

  async getPaginated<T> (
    path: string,
    additionalHeaders: Record<string, unknown> = {},
    params = new URLSearchParams(),
    startingPage = 1,
    maxPage = 10,
  ): Promise<T[]> {
    const url = new URL(path, this.baseURL)
    params.set('per_page', '200')

    const results:T[] = []
    let page = startingPage
    do {
      params.set('page', `${page}`)
      url.search = params.toString()

      const { body, headers } = await this.doRequest(url, 'GET', additionalHeaders)
      const items = await body.json() as T[]
      results.push(...items)
      const totalPages = headers[API_CONSOLE_TOTAL_PAGES_HEADER_KEY]
      if (totalPages === undefined || parseInt(totalPages as string, 10) <= page) {
        break
      }
    } while (page++ < maxPage)

    return results
  }

  private async doRequest (
    url: URL,
    method: string,
    additionalHeaders: Record<string, unknown> = {},
  ): Promise<Dispatcher.ResponseData> {
    await this.validateToken()

    const response = await request(url, {
      method: method,
      headers: headers(this.token, additionalHeaders),
    })

    if (response.statusCode != 200) {
      const data = await response.body.json() as Record<string, string>
      const message = data.message || `Unknown error with status ${response.statusCode}`
      throw new Error(message)
    }

    return response
  }

  private async validateToken (): Promise<void> {
    if (!this.clientID || !this.clientSecret) {
      return
    }

    if (this.token && !this.token.expired(EXPIRATION_WINDOW_IN_SECONDS)) {
      return
    }

    this.token = await doAuthentication(this.baseURL, this.clientID, this.clientSecret)
  }
}

function headers (token: AccessToken | undefined, headers: Record<string, unknown> = {}): UndiciHeaders {
  return {
    ...headers,
    'User-Agent': UserAgent,
    Accept: 'application/json',
    'Content-Type': 'application/json',
    ...token && { Authorization: `${token.token_type} ${token.access_token}` },
  }
}

async function doAuthentication (basePath: string, clientId: string, clientCredentials: string): Promise<AccessToken> {
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

  const data = await body.json() as Record<string, string>
  return new AccessToken(data.access_token, data.token_type, parseInt(data.expires_in, 10))
}

class AccessToken {
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
