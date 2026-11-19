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

import { formatQueryParamToUnixTimestamp } from './utils'
import { HTTPClient } from './http-client'

/**
 * Client dedicated to RBAC Requests, currently used to retrieve User Audit Logs.
 *
 * NOTE: This client can be used only if the console enables the Centralized User Management (v15.2.2 and above)
*/
export class AuditLogsClient {
  #client: HTTPClient

  constructor (client: HTTPClient) {
    this.#client = client
  }

  companyAuditLogs (tenantId: string, from?: string, to?: string): Promise<unknown[]> {
    const params = new URLSearchParams({
      ...from && { from: formatQueryParamToUnixTimestamp(from) },
      ...to && { to: formatQueryParamToUnixTimestamp(to) },
    })

    return this.#client.getPaginated<unknown>(`/api/tenants/${tenantId}/audit-logs`, params, 0)
  }
}
