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

import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'

import { getMcpServer } from './server'

export async function runStdioServer (host: string, clientID: string, clientSecret: string) {
  const server = getMcpServer(host, clientID, clientSecret)
  const transport = new StdioServerTransport()

  await server.connect(transport)
  console.error('Mia-Platform Console server running on stdio')
}
