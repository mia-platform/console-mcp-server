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

export const podsPath = ({
  projectId,
  environmentId,
}: {
  projectId: string,
  environmentId: string,
}) => `/api/projects/${projectId}/environments/${environmentId}/pods/describe/`

export const logsPath = ({
  projectId,
  environmentId,
  podName,
  containerName,
}: {
  projectId: string,
  environmentId: string,
  podName: string,
  containerName: string,
}) => `/api/projects/${projectId}/environments/${environmentId}/pods/${podName}/containers/${containerName}/logs?file=true`

export async function listPods (client: APIClient, projectId: string, environmentId: string) {
  const pods = await client.get(podsPath({ projectId, environmentId }))
  return pods
}

export async function getPodLogs (client: APIClient, projectId: string, environmentId: string, podName: string, containerName: string): Promise<string> {
  const logs = await client.get<string>(
    logsPath({ projectId, environmentId, podName, containerName }),
    {
      Accept: 'text/plain',
    },
  )
  return logs
}
