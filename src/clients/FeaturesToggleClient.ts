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

import { APIClient } from '../lib/client'

export type FeatureTogglesResponse = Record<string, boolean>

export enum ScopeType {
  USER = 'user',
  PROJECT = 'project',
  COMPANY = 'company',
  ENVIRONMENT = 'environment',
  CONSOLE = 'console',
}

export interface FeatureTogglesContext {
  tenantId?: string
  projectId?: string
  envId?: string
}

export type IFeatureTogglesClient = Omit<FeatureTogglesClient, 'client'>

export default class FeatureTogglesClient implements IFeatureTogglesClient {
  private client

  constructor (client: APIClient) {
    this.client = client
  }

  async fetchActiveFeatures (featureToggleIds: string[], ftContext: FeatureTogglesContext = {}): Promise<FeatureTogglesResponse> {
    if (featureToggleIds.length === 0) {
      return {}
    }
    const activeFeatures = await this.client.get<FeatureTogglesResponse>(
      '/api/feature-toggles',
      new URLSearchParams({
        featureToggleIds: featureToggleIds.join(','),
        ...ftContext as Record<string, string>,
      }),
    )

    return activeFeatures
  }
}
