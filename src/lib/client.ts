// Copyright Mia srl
// SPDX-License-Identifier: Apache-2.0

// Licensed under the Apache License, Version 2.0 (the 'License')
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at

//     http://www.apache.org/licenses/LICENSE-2.0

// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an 'AS IS' BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import { name, version } from '../../package.json'
import { constants } from '@mia-platform/console-types'

const { API_CONSOLE_TOTAL_PAGES_HEADER_KEY } = constants

const UserAgent = `${name}/${version}`

export class APIClient {

  private baseURL: string
  private token: string

  constructor(baseURL: string, token: string) {
    this.baseURL = baseURL
    this.token = token
  }

  async get<T>(path: string, params?: URLSearchParams): Promise<T> {
    const url = new URL(path, this.baseURL)
    if (params) {
      url.search = params.toString()
    }

    const response = await doRequest(url, 'GET', this.token)
    return await response.json()
  }

  async getPaginated<T>(path: string, params?: URLSearchParams, startingPage=1, maxPage = 10): Promise<T[]> {
    const url = new URL(path, this.baseURL)
    if (!params) {
      params = new URLSearchParams()
    }
    params.set('per_page', '200')

    const results:T[] = []
    let page = startingPage
    do {
      params.set('page', `${page}`)
      url.search = params.toString()

      const response = await doRequest(url, 'GET', this.token)
      results.push(...(await response.json()))
      const totalPages = response.headers.get(API_CONSOLE_TOTAL_PAGES_HEADER_KEY)
      if (totalPages === null) {
        break
      }
    } while (page++ < maxPage)

    return results
  }
}

function headers(token: string): HeadersInit {
  return {
    'User-Agent': UserAgent,
    Accept: 'application/json',
    ContentType: 'application/json',
    ...token && { Authorization: `Bearer ${token}` },
  }
}

async function doRequest(url: URL, method: string, token: string): Promise<Response> {
  const response = await fetch(url, {headers: headers(token), method: method})
  if (!response.ok) {
    const data = await response.json() as Record<string, string>
    const message = data.message || 'Unknown error with status ${response.status}'
    throw new Error(message)
  }

  return response
}
