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

export const internalEndpoint = 'http://internal.local:3000'

export function KubernetesClientInternal (
  clientID?: string,
  clientSecret?: string,
  additionalHeaders: UndiciHeaders = {},
): KubernetesClient {
  const client = new HTTPClient(internalEndpoint, clientID, clientSecret, additionalHeaders)
  return new KubernetesClient(client, true)
}

export class KubernetesClient {
  #client: HTTPClient
  #internal: boolean

  constructor (client: HTTPClient, internal = false) {
    this.#client = client
    this.#internal = internal
  }

  async listPods (projectID: string, environmentID: string): Promise<Record<string, unknown>[]> {
    return this.#client.get<Record<string, unknown>[]>(this.#podsPath(projectID, environmentID))
  }

  async podLogs (
    projectID: string,
    environmentID: string,
    podName: string,
    containerName: string,
    lines = 500,
  ): Promise<string> {
    const params = new URLSearchParams({
      file: 'true',
      tailLines: lines.toString(),
    })
    return await this.#client.getPlain<string>(this.#logsPath(projectID, environmentID, podName, containerName), params)
  }

  #podsPath (projectID: string, environmentID: string): string {
    if (this.#internal) {
      return `/projects/${projectID}/environments/${environmentID}/pods/describe/`
    }

    return `/api/projects/${projectID}/environments/${environmentID}/pods/describe/`
  }

  #logsPath (projectID: string, environmentID: string, podName: string, containerName: string): string {
    if (this.#internal) {
      return `/projects/${projectID}/environments/${environmentID}/pods/${podName}/containers/${containerName}/logs`
    }

    return `/api/projects/${projectID}/environments/${environmentID}/pods/${podName}/containers/${containerName}/logs`
  }
}
