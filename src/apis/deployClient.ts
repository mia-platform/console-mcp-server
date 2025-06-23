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
import { CompareForDeployResponse, PipelineStatus, TriggerDeployResponse } from './types/deploy'

export const internalEndpoint = process.env.DEPLOY_INTERNAL_ENDPOINT || 'http://internal.local:3000'

export function DeployClientInternal (
  clientID?: string,
  clientSecret?: string,
  additionalHeaders: UndiciHeaders = {},
): DeployClient {
  const client = new HTTPClient(internalEndpoint, clientID, clientSecret, additionalHeaders)
  return new DeployClient(client, true)
}

export class DeployClient {
  #client: HTTPClient
  #internal: boolean

  constructor (client: HTTPClient, internal = false) {
    this.#client = client
    this.#internal = internal
  }

  async triggerDeploy (
    projectID: string,
    environment: string,
    revision: string,
    revisionType: string,
  ): Promise<TriggerDeployResponse> {
    const body = {
      revision,
      refType: revisionType,
      environment,
    }

    return await this.#client.post<TriggerDeployResponse>(this.#deployPath(projectID), body)
  }

  async compareForDeploy (
    projectID: string,
    environment: string,
    revision: string,
    revisionType: string,
  ): Promise<CompareForDeployResponse> {
    const params = new URLSearchParams({
      fromEnvironment: environment,
      toRef: revision,
      refType: revisionType,
    })

    return await this.#client.get<CompareForDeployResponse>(this.#comparePath(projectID), params)
  }

  async waitForPipelineCompletion (
    projectID: string,
    pipelineID: string,
    timeout = 5 * 60 * 1000,
    interval = 5000,
  ): Promise<PipelineStatus> {
    const startTime = Date.now()
    const path = this.#pipelineStatusPath(projectID, pipelineID)
    while (true) {
      const status = await this.#client.get<PipelineStatus>(path)
      if ([ 'success', 'failed', 'canceled', 'abandoned', 'skipped', 'succededWithIssues' ].includes(status.status)) {
        return status
      }

      if (Date.now() - startTime > timeout) {
        throw new Error(`Pipeline execution timed out after ${timeout}ms`)
      }

      await new Promise((resolve) => setTimeout(resolve, interval))
    }
  }

  #deployPath (projectID: string): string {
    if (this.#internal) {
      return `/projects/${projectID}/trigger/pipeline/`
    }

    return `/api/deploy/projects/${projectID}/trigger/pipeline/`
  }

  #comparePath (projectID: string): string {
    if (this.#internal) {
      return `/projects/${projectID}/compare/raw`
    }

    return `/api/deploy/projects/${projectID}/compare/raw`
  }

  #pipelineStatusPath (projectID: string, pipelineID: string): string {
    if (this.#internal) {
      return `/projects/${projectID}/pipelines/${pipelineID}/status/`
    }

    return `/api/deploy/projects/${projectID}/pipelines/${pipelineID}/status/`
  }
}
