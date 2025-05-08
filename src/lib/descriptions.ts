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

export const toolsDescriptions = {
  // tenants tools
  LIST_TENANTS: 'List Mia-Platform Console companies or tenants that the user can access',
  LIST_TENANTS_TEMPLATES: 'List Mia-Platform project templates for a given company or tenant',
  LIST_TENANTS_IAM: 'List IAM user, groups and or service account for a company or tenant',
  VIEW_TENANTS_AUDIT_LOGS: 'View audit logs for a company or tenant to see who did what and when',

  // marketplace tools
  LIST_MARKETPLACE: 'List Mia-Platform Console marketplace items for a given company or tenant or the public ones if no company or tenant is specified',
  LIST_MARKETPLACE_ITEMS_VERSIONS: 'List all the available versions of a marketplace item',
  MARKETPLACE_ITEM_VERSION_INFO: 'Get information about a specific version of a marketplace item',

  // project tools
  LIST_PROJECTS: 'List Mia Projects that the user can access in the given companies or tenants. To do that before you need to know the tenantId with the tool list_tenants',
  GET_PROJECT_INFO: 'Get information about a Mia-Platform Console project',
  CREATE_PROJECT_FROM_TEMPLATE: 'Create a new Mia-Platform Console project from a template in the given company or tenant',

  // services tools
  CREATE_SERVICE_FROM_MARKETPLACE: 'Create a new service in a Mia-Platform Console project starting from an element of the marketplace',

  // deploy tools
  DEPLOY_PROJECT: 'Deploy a project in a specific environment for the given company or tenant. Before running deploy, check differences using the tool compare_update_for_deploy.',
  COMPARE_UPDATE_FOR_DEPLOY: 'Compare the current deployed configuration with the new configuration to be deployed. This is useful to see what will change in the project after the deployment',
  PIPELINE_STATUS: 'Get the status of a pipeline given a pipeline id. This is useful to check if the deployment is finished or if it failed. After running deploy, check the status of the pipeline using the tool pipeline_status',

  // configuration management tools
  LIST_CONFIGURATION_REVISIONS: 'List all the available revisions and tags for a project configuration',
}

export const paramsDescriptions = {
  // Tenant
  TENANT_ID: 'The Mia-Platform Console company or tenant to use. Can be found in the tenantId field of the list_tenants tool',
  MULTIPLE_TENANT_IDS: 'One or more Mia-Platform Console companies or tenants to filter. Can be found in the tenantId field of the list_tenants tool',

  // IAM
  IAM_IDENTITY_TYPE: 'Filter the IAM entities by type',

  // Audit Logs
  AUDIT_LOG_FROM: 'The start date of the audit logs to fetch, in unix timestamp format',
  AUDIT_LOG_TO: 'The end date of the audit logs to fetch, in unix timestamp format',

  // Marketplace
  MARKETPLACE_ITEM_ID: 'The marketplace item to use to create the service. Can be found in the itemId field of the list_marketplace tool',
  MARKETPLACE_ITEM_TYPE: 'Type of marketplace item to filter, empty string means no filter',
  MARKETPLACE_ITEM_TENANT_ID: 'The tenant or project of the marketplace item. Can be found in the tenantId field of the list_marketplace tool',
  MARKETPLACE_ITEM_VERSION: 'The version of the marketplace item to use. Can be found in the version field of the list_marketplace tool. This is optional, if not specified the latest version will be used',

  // Project
  PROJECT_ID: 'The project to use. Can be found in the _id field of the list_projects tool',
  PROJECT_NAME: 'The name of the project. It must be unique in the company or tenant',
  PROJECT_DESCRIPTION: 'The description of the project',
  TEMPLATE_ID: 'The template to use to create the project. Can be found in the _id field of the list_templates tool',
  PROJECT_ENVIRONMENT_ID: 'The environment or revision of the project to use. Can be found in the environments filed of the get_project_info or list_projects tools',

  // Service
  SERVICE_NAME: 'The name of the service. It must be unique in the project',
  SERVICE_DESCRIPTION: 'The description of the service',

  // Configuration
  REVISION: 'The revision of the project configuration to use. Can be found the list of the available revisions and tags using the list_configuration_revisions tool',
  REF_TYPE: 'The type of the reference to use, can be revision or version. Can be found in the list_configuration_revisions tool',
  REF_ID: 'The id of the reference to use, can be the revision or version. Can be found in the list_configuration_revisions tool',

  // Deploy
  PIPELINE_ID: 'The id of the pipeline to check the status of. Can be found in the response of the deploy tool',
}
