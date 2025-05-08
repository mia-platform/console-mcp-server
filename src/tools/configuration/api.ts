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

import { Config, IProject } from '@mia-platform/console-types'

import { APIClient } from '../../lib/client'
import { ConfigToSave, ResourcesToCreate, RetrievedConfiguration, SaveResponse } from './types'

const configurationPath = (projectId: string, refId: string) => `/api/backend/projects/${projectId}/revisions/${encodeURIComponent(refId)}/configuration`

export async function saveConfiguration (client: APIClient, project: IProject, resourcesToCreate: ResourcesToCreate, refId: string): Promise<SaveResponse> {
  const previousCommit = await client.get<RetrievedConfiguration>(configurationPath(project._id, refId))

  const mergedConfigWithResourceToCreate: Config = mergeConfigWithResources(previousCommit, resourcesToCreate)

  const newConfig: ConfigToSave = {
    title: '[mcp] created resources',
    fastDataConfig: previousCommit.fastDataConfig,
    microfrontendPluginsConfig: previousCommit.microfrontendPluginsConfig || {},
    extensionsConfig: previousCommit.extensionsConfig || { files: {} },
    config: mergedConfigWithResourceToCreate,
    previousSave: previousCommit.commitId,
    deletedElements: {},
  }

  return await client.post<SaveResponse>(configurationPath(project._id, refId), newConfig)
}

function mergeConfigWithResources (previousConfig: Config, resourcesToCreate: ResourcesToCreate): Config {
  const { services, serviceAccounts, configMaps } = resourcesToCreate
  const { services: previousServices, configMaps: previousConfigMaps, serviceAccounts: previousServiceAccounts } = previousConfig

  // throw an error if a service already exists with the same name
  Object.keys(services).forEach((serviceName) => {
    if (previousServices[serviceName]) {
      throw new Error(`Service ${serviceName} already exists`)
    }
  })

  return {
    ...previousConfig,
    services: {
      ...previousServices,
      ...services,
    },
    configMaps: {
      ...previousConfigMaps,
      ...configMaps,
    },
    serviceAccounts: {
      ...previousServiceAccounts,
      ...serviceAccounts,
    },
    listeners: {
      ...previousConfig.listeners,
      ...resourcesToCreate.listeners,
    },
  }
}
