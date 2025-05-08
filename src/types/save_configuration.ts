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

import { Config, ConfigMaps, ServiceAccounts, Services } from '@mia-platform/console-types'

export interface ResourcesToCreate {
  services: Services
  configMaps?: ConfigMaps
  serviceAccounts: ServiceAccounts
}

export type RetrievedConfiguration = Config & {
  fastDataConfig: unknown,
  microfrontendPluginsConfig: unknown,
  extensionsConfig: unknown,
  enabledFeatures: unknown,
}

export interface ConfigToSave {
  title: string,
  previousSave?: string,
  config: Config,
  fastDataConfig: unknown,
  microfrontendPluginsConfig: unknown,
  extensionsConfig: unknown,
  deletedElements: Record<string, unknown>,
}

export interface SaveResponse {
  id: string,
  upgraded?: boolean,
}
