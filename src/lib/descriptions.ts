// Copyright Mia srl
// SPDX-License-Identifier: Apache-2.0

// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at

//     http://www.apache.org/licenses/LICENSE-2.0

// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

export const toolsDescriptions: Record<string, string> = {
  // tenants tools
  LIST_TENANTS: 'List Mia-Platform Console companies or tenants that the user can access',
  LIST_TENANTS_IAM: 'List IAM user, groups and or service account for a company or tenant',
  VIEW_TENANTS_AUDIT_LOGS: 'View audit logs for a company or tenant to see who did what and when',

  // marketplace tools
  LIST_MARKETPLACE: 'List Mia-Platform Console marketplace items for a given company or tenant or the public ones if no company or tenant is specified',

  // project tools
  LIST_PROJECTS: 'List Mia Projects that the user can access in the given companies or tenants. To do that before you need to know the tenantId with the tool list_tenants',
  GET_PROJECT_INFO: 'Get information about a Mia-Platform Console project',
}

export const paramDescriptions: Record<string, string> = {
  // Tenant
  TENANT_ID: 'The company or tenant id',
  MULTIPLE_TENANT_IDS: 'one or more id of Mia-Platform Console companies or tenants to filter. Can be found in the tenantId field of the list_tenants tool',

  // IAM
  IAM_IDENTITY_TYPE: 'Filter the IAM entities by type',

  // Audit Logs
  AUDIT_LOG_FROM: 'The start date of the audit logs to fetch, in unix timestamp format',
  AUDIT_LOG_TO: 'The end date of the audit logs to fetch, in unix timestamp format',

  // Marketplace
  MARKETPLACE_ITEM_TYPE: 'type of marketplace item to filter, empty string means no filter',

  // Project
  PROJECT_ID: 'The Id of the project. You can find the projectId in the list_projects tool, usign the _id field',
}
