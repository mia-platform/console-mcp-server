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
