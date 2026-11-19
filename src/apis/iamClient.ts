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

import { UndiciHeaders } from 'undici/types/dispatcher'

import { formatQueryParamToUnixTimestamp } from './utils'
import { HTTPClient } from './http-client'

export const internalEndpoint = process.env.IAM_INTERNAL_ENDPOINT || 'http://internal.local:3000'

export function IAMClientInternal (
  clientID?: string,
  clientSecret?: string,
  additionalHeaders: UndiciHeaders = {},
): IAMClient {
  const client = new HTTPClient(internalEndpoint, clientID, clientSecret, additionalHeaders)
  return new IAMClient(client, true)
}

export class IAMClient {
  #client: HTTPClient
  #internal: boolean

  constructor (client: HTTPClient, internal = false) {
    this.#client = client
    this.#internal = internal
  }

  companyIAMIdentities (tenantId: string, type?: string): Promise<unknown[]> {
    const params = new URLSearchParams({
      ...type && { identityType: type },
    })

    return this.#client.getPaginated<unknown>(this.#companyIAMPath(tenantId), params, 0)
  }

  companyAuditLogs (tenantId: string, from?: string, to?: string): Promise<unknown[]> {
    const params = new URLSearchParams({
      ...from && { from: formatQueryParamToUnixTimestamp(from) },
      ...to && { to: formatQueryParamToUnixTimestamp(to) },
    })

    return this.#client.getPaginated<unknown>(this.#companyAuditLogsPath(tenantId), params, 0)
  }

  #companyIAMPath (tenantId: string): string {
    if (this.#internal) {
      return `/companies/${tenantId}/identities`
    }
    return `/api/companies/${tenantId}/identities`
  }

  #companyAuditLogsPath (tenantId: string): string {
    if (this.#internal) {
      return `/tenants/${tenantId}/audit-logs`
    }
    return `/api/tenants/${tenantId}/audit-logs`
  }
}
