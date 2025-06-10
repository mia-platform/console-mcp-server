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

import { HTTPClient } from './http-client'

export const internalEndpoint = process.env.FEATURE_TOGGLE_INTERNAL_ENDPOINT || 'http://internal.local:3000'

export function FeatureToggleClientInternal (
  clientID?: string,
  clientSecret?: string,
  additionalHeaders: UndiciHeaders = {},
): FeatureToggleClient {
  const client = new HTTPClient(internalEndpoint, clientID, clientSecret, additionalHeaders)
  return new FeatureToggleClient(client, true)
}

export class FeatureToggleClient {
  #client: HTTPClient
  #internal: boolean

  constructor (client: HTTPClient, internal = false) {
    this.#client = client
    this.#internal = internal
  }

  async getToggles (projectID: string, featureToggleIds: string[]): Promise<Record<string, boolean>> {
    if (featureToggleIds.length === 0) {
      return {}
    }

    const params = new URLSearchParams({
      projectId: projectID,
      featureToggleIds: featureToggleIds.join(','),
    })

    return this.#client.get<Record<string, boolean>>(this.#featureTogglePath(), params)
  }

  #featureTogglePath (): string {
    return this.#internal
      ? '/feature-toggles'
      : '/api/feature-toggles'
  }
}
