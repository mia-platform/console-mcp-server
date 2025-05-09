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

import { Config } from '@mia-platform/console-types'

import { APIClient } from '../../lib/client'
import { ConfigToSave, ResourcesToCreate, RetrievedConfiguration, SaveConfigurationOptions, SaveResponse } from './types'

const configurationPath = (projectId: string, refId: string) => `/api/backend/projects/${projectId}/revisions/${encodeURIComponent(refId)}/configuration`

export async function getConfiguration (client: APIClient, projectUId: string, refId: string): Promise<RetrievedConfiguration> {
  const response = await client.get<RetrievedConfiguration>(configurationPath(projectUId, refId))
  return response
}

export async function saveConfiguration (client: APIClient, projectUId: string, resourcesToCreate: ResourcesToCreate, refId: string, options?: SaveConfigurationOptions): Promise<SaveResponse> {
  const previousCommit = await getConfiguration(client, projectUId, refId)

  const mergedConfigWithResourceToCreate: Config = mergeConfigWithResources(previousCommit, resourcesToCreate, options)

  const newConfig: ConfigToSave = {
    title: '[mcp] created resources',
    fastDataConfig: previousCommit.fastDataConfig,
    microfrontendPluginsConfig: previousCommit.microfrontendPluginsConfig || {},
    extensionsConfig: previousCommit.extensionsConfig || { files: {} },
    config: mergedConfigWithResourceToCreate,
    previousSave: previousCommit.commitId,
    deletedElements: {},
  }

  return await client.post<SaveResponse>(configurationPath(projectUId, refId), newConfig)
}

function mergeConfigWithResources (previousConfig: Config, resourcesToCreate: ResourcesToCreate, options?: SaveConfigurationOptions): Config {
  const { services, serviceAccounts, configMaps, serviceSecrets } = resourcesToCreate
  const {
    services: previousServices,
    configMaps: previousConfigMaps,
    serviceAccounts: previousServiceAccounts,
    serviceSecrets: previousServiceSecrets,
  } = previousConfig

  if (options?.throwIfServiceAlreadyExists) {
    // throw an error if a service already exists with the same name
    Object.keys(services || {}).forEach((serviceName) => {
      if (previousServices[serviceName]) {
        throw new Error(`Service ${serviceName} already exists`)
      }
    })
  }

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
    serviceSecrets: {
      ...previousServiceSecrets,
      ...serviceSecrets,
    },
    serviceAccounts: {
      ...previousServiceAccounts,
      ...serviceAccounts,
    },
    listeners: {
      ...previousConfig.listeners,
      ...resourcesToCreate.listeners,
    },
    endpoints: {
      ...previousConfig.endpoints,
      ...resourcesToCreate.endpoints,
    },
    collections: {
      ...previousConfig.collections,
      ...resourcesToCreate.collections,
    },
  }
}

