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

import { constants } from '@mia-platform/console-types'
import { request } from 'undici'
import Dispatcher, { UndiciHeaders } from 'undici/types/dispatcher'

import { UserAgent } from './useragent'
import { AccessToken, doAuthentication } from './token'

const { API_CONSOLE_TOTAL_PAGES_HEADER_KEY } = constants

const EXPIRATION_WINDOW_IN_SECONDS = 300

export interface Options {
  plainText?: boolean
}

export class HTTPClient {
  private baseURL: string
  private clientID: string
  private clientSecret: string
  private requestHeaders: UndiciHeaders

  /** Cached token, if received from M2M authentication or extracted from miactl instance installed in local machine */
  private cachedToken: AccessToken | undefined

  constructor (baseURL: string, clientID?: string, clientSecret?: string, additionalHeaders: UndiciHeaders = {}) {
    this.baseURL = baseURL
    this.clientID = clientID || ''
    this.clientSecret = clientSecret || ''
    this.requestHeaders = additionalHeaders
  }

  async getPlain<T> (path: string, params?: URLSearchParams): Promise<T> {
    return this.getRequest<T>(path, params, true)
  }

  async get<T> (path: string, params?: URLSearchParams): Promise<T> {
    return this.getRequest<T>(path, params)
  }

  private async getRequest<T> (path: string, params?: URLSearchParams, plain = false): Promise<T> {
    const url = new URL(path, this.baseURL)
    if (params) {
      url.search = params.toString()
    }

    let accept: string | undefined
    if (plain) {
      accept = 'text/plain'
    }

    const { body, headers } = await this.doRequest(url, 'GET', undefined, accept)
    if (headers['content-type']?.includes('text/plain')) {
      return await body.text() as T
    }
    return await body.json() as T
  }

  async post<T> (
    path: string,
    body = {},
    params?: URLSearchParams,
  ): Promise<T> {
    const url = new URL(path, this.baseURL)
    if (params) {
      url.search = params.toString()
    }

    const { body: returnBody } = await this.doRequest(url, 'POST', body)
    return await returnBody.json() as T
  }

  async put<T> (
    path: string,
    body = {},
    params?: URLSearchParams,
  ): Promise<T> {
    const url = new URL(path, this.baseURL)
    if (params) {
      url.search = params.toString()
    }

    const { body: returnBody } = await this.doRequest(url, 'PUT', body)
    return await returnBody.json() as T
  }

  async patch<T> (
    path: string,
    body = {},
    params?: URLSearchParams,
  ): Promise<T> {
    const url = new URL(path, this.baseURL)
    if (params) {
      url.search = params.toString()
    }

    const { body: returnBody } = await this.doRequest(url, 'PATCH', body)
    return await returnBody.json() as T
  }

  async getPaginated<T> (
    path: string,
    params = new URLSearchParams(),
    startingPage = 1,
    maxPage = 10,
  ): Promise<T[]> {
    const url = new URL(path, this.baseURL)
    params.set('per_page', '200')

    const results: T[] = []
    let page = startingPage
    do {
      params.set('page', `${page}`)
      url.search = params.toString()

      const { body, headers } = await this.doRequest(url, 'GET')
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
    body?: Record<string, unknown>,
    accept = 'application/json',
  ): Promise<Dispatcher.ResponseData> {
    const requestHasToken = this.additionalHeadersIncludeToken()
    if (!requestHasToken) {
      await this.validateCachedToken()
    }

    const headers = {
      Accept: accept,
      ...this.requestHeaders,
      ...!!body && { 'Content-Type': 'application/json' },
      'User-Agent': UserAgent,
      ...this.cachedToken && { Authorization: `${this.cachedToken.token_type} ${this.cachedToken.access_token}` },
    }

    const response = await request(url, {
      method,
      headers,
      ...body && { body: JSON.stringify(body) },
    })

    if (response.statusCode != 200) {
      const data = await response.body.json() as Record<string, string>
      console.error({ statusCode: response.statusCode, data })
      const message = data.message || `Unknown error with status ${response.statusCode}`
      throw new Error(message)
    }

    return response
  }

  private additionalHeadersIncludeToken (): boolean {
    return !!this.requestHeaders &&
      typeof this.requestHeaders === 'object' &&
      !Array.isArray(this.requestHeaders) &&
      ('Authorization' in this.requestHeaders || 'authorization' in this.requestHeaders)
  }

  private async validateCachedToken (): Promise<void> {
    if (this.cachedToken && !this.cachedToken.expired(EXPIRATION_WINDOW_IN_SECONDS)) {
      return
    }

    this.cachedToken = await doAuthentication(this.baseURL, {
      clientId: this.clientID,
      clientSecret: this.clientSecret,
    })
  }
}
