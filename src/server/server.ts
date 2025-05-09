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

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'

import { addCompaniesCapabilities } from '../tools/companies'
import { addConfigurationCapabilities } from '../tools/configuration'
import { addDeployCapabilities } from '../tools/deploy'
import { addMarketplaceCapabilities } from '../tools/marketplace'
import { addProjectsCapabilities } from '../tools/projects'
import { addRuntimeCapabilities } from '../tools/runtime'
import { addServicesCapabilities } from '../tools/services'
import { APIClient } from '../lib/client'
import { description, name, version } from '../../package.json'

export function getMcpServer (host: string, clientID: string, clientSecret: string): McpServer {
  const client = new APIClient(host, clientID, clientSecret)
  const server = new McpServer({
    name,
    description,
    version,
    capabilities: {
      logging: {},
      resources: {},
      prompts: {},
      tools: {},
    },
  })

  addMarketplaceCapabilities(server, client)
  addProjectsCapabilities(server, client)
  addCompaniesCapabilities(server, client)
  addServicesCapabilities(server, client)
  addConfigurationCapabilities(server, client)
  addDeployCapabilities(server, client)
  addRuntimeCapabilities(server, client)

  return server
}
