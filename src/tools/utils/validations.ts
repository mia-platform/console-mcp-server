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

import assert from 'node:assert'

import { IProject } from '@mia-platform/console-types'

import { IAPIClient } from '../../apis/client'

export const ERR_AI_FEATURES_NOT_ENABLED = 'AI features are not enabled for tenant:'
export const ERR_AI_FEATURES_NOT_ENABLED_MULTIPLE_TENANTS = 'None of specified tenants has AI features enabled'

export async function assertAiFeaturesEnabledForTenant (client: IAPIClient, tenantId: string): Promise<void> {
  if (!tenantId) {
    throw new Error('No tenantId provided')
  }

  const isEnabled = await client.isAiFeaturesEnabledForTenant(tenantId)
  if (!isEnabled) {
    throw new Error(`${ERR_AI_FEATURES_NOT_ENABLED} '${tenantId}'`)
  }
}

export async function assertAiFeaturesEnabledForProject (client: IAPIClient, project: IProject): Promise<void> {
  assert(project.tenantId, 'Project must have a tenantId')
  await assertAiFeaturesEnabledForTenant(client, project.tenantId)
}
