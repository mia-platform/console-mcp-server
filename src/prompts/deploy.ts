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

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp'

import z from 'zod'

export const addDeployPrompt = (server: McpServer) => {
  server.registerPrompt(
    'deploy',
    {
      title: 'Deploy Mia-Platform project',
      description: 'Base prompt to deploy a Mia-Platform project',
      argsSchema: {
        tenant: z.string().describe('The name or the identifier tenant where the project to deploy is located.'),
        project: z.string().describe('The name or the identifier of the project to deploy.'),
        environment: z.string().describe('In which environment the project has to be deployed.'),
        revisionName: z.string().optional().describe('The name of the revision to deploy. If not provided, the main revision will be used.'),
      },
    },
    async ({ revisionName, environment, project, tenant }) => {
      const revisionInstruction = revisionName
        ? `The revision to deploy is called ${revisionName}`
        : 'Please fetch which revision is the main one to execute the deployment of that configuration'

      const revisionConfirm = revisionName || 'to be fetched'

      return {
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: `Please execute the deployment of project ${project} in tenant ${tenant} to environment ${environment}. ${revisionInstruction}.\n\nAfter the deployment, provide:\n1. The pipeline execution URL.\n2. The deployment status, including whether pods are being created correctly or if there are any errors.`,
            },
          },
          {
            role: 'assistant',
            content: {
              type: 'text',
              text: `I understand you want me to deploy this project. \
First I will review the list of available tenants and the list of available projects to be sure that I find the project you want to be developed. \
If I don't find the tenant or the project, or the environment, I will try to use tools to get \
the list of available tenants, projects, environments and the revision (if missing or incorrect) to be sure that the parameters you provided are correct. \
Then, I will validate the configuration, start the deployment, and then return:
- The pipeline URL
- The deployment status (pods creation and error checks).

Before proceeding, please confirm these parameters:
- Project: ${project}
- Tenant: ${tenant}
- Environment: ${environment}
- Revision: ${revisionConfirm}\
`,
            },
          },
          {
            role: 'user',
            content: {
              type: 'text',
              text: `Yes, proceed.`,
            },
          },
        ],
      }
    },
  )
}
