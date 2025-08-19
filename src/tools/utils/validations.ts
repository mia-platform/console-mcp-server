import assert from 'node:assert'
import { IProject } from '@mia-platform/console-types'

import { APIClient } from '../../apis/client'

export const ERR_AI_FEATURES_NOT_ENABLED = 'AI features are not enabled for tenant:'

export async function assertAiFeaturesEnabledForTenant (client: APIClient, tenantId: string): Promise<void> {
  if (!tenantId) {
    throw new Error('No tenantId provided')
  }

  const isEnabled = await client.isAiFeaturesEnabledForTenant(tenantId)
  if (!isEnabled) {
    throw new Error(`${ERR_AI_FEATURES_NOT_ENABLED} '${tenantId}'`)
  }
}

export async function assertAiFeaturesEnabledForProject (client: APIClient, project: IProject): Promise<void> {
  assert(project.tenantId, 'Project must have a tenantId')
  await assertAiFeaturesEnabledForTenant(client, project.tenantId)
}
