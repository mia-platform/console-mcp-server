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

import { HTTPClient } from './http-client'

export type PrincipalType = 'user' | 'service_account'

export type ListPrincipalsParams = {
  tenantId: string
} & ({
  limit?: number
} | {
  continueToken: string
})

export interface GetPrincipalParams {
  tenantId: string
  projectId?: string
}

export class RBACClient {
  #client: HTTPClient

  constructor (client: HTTPClient) {
    this.#client = client
  }

  listPrincipals (type: PrincipalType = 'user', opts: ListPrincipalsParams): Promise<Record<string, unknown>[]> {
    const hasContinue = (opts: unknown): opts is { tenantId: string, continueToken: string } => !!opts && typeof opts === 'object' && 'continueToken' in opts && typeof opts['continueToken'] === 'string'

    const params = new URLSearchParams({
      type,
      tenantId: opts.tenantId,
      ...hasContinue(opts)
        ? { continue: opts.continueToken }
        : { limit: opts.limit?.toString() ?? '25' },
    })

    return this.#client.get<Record<string, unknown>[]>(`/api/rbac/authz/principals`, params)
  }

  getPrincipal (principalId: string, opt: GetPrincipalParams): Promise<unknown> {
    return this.#client.get<unknown>(`/api/rbac/authz/principals/${principalId}`, new URLSearchParams({ ...opt }))
  }
}
