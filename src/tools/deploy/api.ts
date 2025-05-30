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

import { APIClient } from '../../lib/client'
import { CompareForDeployResponse, PipelineStatus, TriggerDeployResponse } from './types'

const deployPath = (projectId: string) => `/api/deploy/projects/${projectId}/trigger/pipeline/`
const compareUpdatePath = (projectId: string) => `/api/deploy/projects/${projectId}/compare/raw`
const pipelineStatusPath = (projectId: string, pipelineId: string) => `/api/deploy/projects/${projectId}/pipelines/${pipelineId}/status/`

export interface TriggerOptions {
  environment: string,
  revision: string,
  refType: string,
}

export async function triggerDeploy (client: APIClient, projectId: string, payload: TriggerOptions) {
  const data = await client.post<TriggerDeployResponse>(deployPath(projectId), payload)
  return data
}

export async function compareForDeploy (client: APIClient, projectId: string, payload: TriggerOptions) {
  const data = await client.get<CompareForDeployResponse>(compareUpdatePath(projectId), new URLSearchParams({
    fromEnvironment: payload.environment,
    toRef: payload.revision,
    refType: payload.refType,
  }))

  return data
}

export async function waitForPipelineCompletion (
  client: APIClient,
  projectId: string,
  pipelineId: string,
  timeout = 5 * 60 * 1000,
  interval = 5000,
): Promise<PipelineStatus> {
  const startTime = Date.now()

  while (true) {
    const status = await client.get<PipelineStatus>(pipelineStatusPath(projectId, pipelineId))

    if ([ 'success', 'failed', 'canceled', 'abandoned', 'skipped', 'succededWithIssues' ].includes(status.status)) {
      return status
    }

    if (Date.now() - startTime > timeout) {
      throw new Error(`Pipeline execution timed out after ${timeout}ms`)
    }

    // Wait before polling again
    if (process.env.NODE_ENV === 'test') {
      interval = 0
    }
    await new Promise((resolve) => setTimeout(resolve, interval))
  }
}
