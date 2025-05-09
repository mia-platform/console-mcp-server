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

export const toolNames = {
  // tenants tools
  LIST_TENANTS: 'list_tenants',
  LIST_TENANT_TEMPLATES: 'list_tenant_templates',
  LIST_TENANT_IAM: 'list_tenant_iam',
  VIEW_TENANT_AUDIT_LOGS: 'view_audit_logs',

  // marketplace tools
  LIST_MARKETPLACE: 'list_marketplace',
  LIST_MARKETPLACE_ITEM_VERSIONS: 'list_marketplace_item_versions',
  MARKETPLACE_ITEM_VERSION_INFO: 'marketplace_item_version_info',

  // project tools
  LIST_PROJECTS: 'list_projects',
  GET_PROJECT_INFO: 'get_project_info',
  CREATE_PROJECT_FROM_TEMPLATE: 'create_project_from_template',

  // services tools
  CREATE_SERVICE_FROM_MARKETPLACE: 'create_service_from_marketplace',

  // deploy tools
  DEPLOY_PROJECT: 'deploy_project',
  COMPARE_UPDATE_FOR_DEPLOY: 'compare_update_for_deploy',
  PIPELINE_STATUS: 'deploy_pipeline_status',

  // configuration management tools
  LIST_CONFIGURATION_REVISIONS: 'list_configuration_revisions',
  CREATE_OR_UPDATE_ENDPOINT: 'create_or_update_endpoint',
  CONFIGURATION_TO_SAVE: 'configuration_save',
  GET_CONFIGURATION: 'configuration_get',

  // runtime tools
  LIST_PODS: 'list_pods',
  GET_POD_LOGS: 'get_pod_logs',
}

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
  LIST_PROJECTS: `List Mia Projects that the user can access in the given companies or tenants. To do that before you need to know the tenantId with the tool ${toolNames.LIST_TENANTS}`,
  GET_PROJECT_INFO: 'Get information about a Mia-Platform Console project',
  CREATE_PROJECT_FROM_TEMPLATE: 'Create a new Mia-Platform Console project from a template in the given company or tenant',

  // services tools
  CREATE_SERVICE_FROM_MARKETPLACE: 'Create a new service in a Mia-Platform Console project starting from an element of the marketplace',

  // deploy tools
  DEPLOY_PROJECT: `Deploy a project in a specific environment for the given company or tenant. Before running deploy, check differences using the tool ${toolNames.COMPARE_UPDATE_FOR_DEPLOY}. After running deploy, check the status of the pipeline using the tool ${toolNames.PIPELINE_STATUS}`,
  COMPARE_UPDATE_FOR_DEPLOY: 'Compare the current deployed configuration with the new configuration to be deployed. This is useful to see what will change in the project after the deployment',
  PIPELINE_STATUS: `Get the status of a pipeline given a pipeline id. This is useful to check if the deployment is finished or if it failed. After running ${toolNames.DEPLOY_PROJECT} tool, check the status of the pipeline using the tool ${toolNames.PIPELINE_STATUS}`,

  // runtime tools
  LIST_PODS: `List all the pods in a project environment to know the information about the running services and their status.`,
  GET_POD_LOGS: `
    Get the logs of a specific pod in a project environment.
    It can be useful to debug issues with the running services.
  `,

  // configuration management tools
  LIST_CONFIGURATION_REVISIONS: 'List all the available revisions and tags for a project configuration',
  CREATE_OR_UPDATE_ENDPOINT: `Create or update an endpoint for the project configuration. After running this tool, save the configuration using the tool ${toolNames.CONFIGURATION_TO_SAVE}`,
  CONFIGURATION_TO_SAVE: 'Save the configuration for a project',
  GET_CONFIGURATION: 'Get the actual configuration for a project for a specific revision or tag',
}

export const paramsDescriptions = {
  // Tenant
  TENANT_ID: `The Mia-Platform Console company or tenant to use. Can be found in the tenantId field of the ${toolNames.LIST_TENANTS} tool`,
  MULTIPLE_TENANT_IDS: `One or more Mia-Platform Console companies or tenants to filter. Can be found in the tenantId field of the ${toolNames.LIST_TENANTS} tool`,

  // IAM
  IAM_IDENTITY_TYPE: 'Filter the IAM entities by type',

  // Audit Logs
  AUDIT_LOG_FROM: 'The start date of the audit logs to fetch, in unix timestamp format',
  AUDIT_LOG_TO: 'The end date of the audit logs to fetch, in unix timestamp format',

  // Marketplace
  MARKETPLACE_ITEM_ID: `The marketplace item to use to create the service. Can be found in the itemId field of the ${toolNames.LIST_MARKETPLACE} tool`,
  MARKETPLACE_ITEM_TYPE: 'Type of marketplace item to filter, empty string means no filter',
  MARKETPLACE_ITEM_TENANT_ID: `The tenant or project of the marketplace item. Can be found in the tenantId field of the ${toolNames.LIST_MARKETPLACE} tool`,
  MARKETPLACE_ITEM_VERSION: `The version of the marketplace item to use. Can be found in the version field of the ${toolNames.LIST_MARKETPLACE} tool. This is optional, if not specified the latest version will be used`,

  // Project
  PROJECT_ID: `The project to use. Can be found in the _id field of the ${toolNames.LIST_PROJECTS} tool`,
  PROJECT_NAME: 'The name of the project. It must be unique in the company or tenant',
  PROJECT_DESCRIPTION: 'The description of the project',
  TEMPLATE_ID: 'The template to use to create the project. Can be found in the _id field of the list_templates tool',
  PROJECT_ENVIRONMENT_ID: `The environment of the project to use. Can be found in the environments filed of the ${toolNames.GET_PROJECT_INFO} or ${toolNames.LIST_PROJECTS} tools`,

  // Service
  SERVICE_NAME: 'The name of the service. It must be unique in the project',
  SERVICE_DESCRIPTION: 'The description of the service',

  // Configuration
  REF_TYPE: `The type of the reference to use, can be revision or version. Can be found in the ${toolNames.LIST_CONFIGURATION_REVISIONS} tool`,
  REF_ID: `The id of the reference to use, can be the revision or version. Can be found in the ${toolNames.LIST_CONFIGURATION_REVISIONS} tool`,
  ENDPOINTS: `
  The endpoints to create or update. The key is the path of the endpoint, the value is the endpoint object.
  An example of a custom endpoint is:
  {
    "basePath": "/echo",
    "type": "custom",
    "public": false,
    "showInDocumentation": true,
    "secreted": false,
    "acl": "true",
    "service": "echo-service",
    "port": "80",
    "pathRewrite": "/",
    "description": "Endpoint /echo",
    "tags": [
      "echo-service"
    ],
    "backofficeAcl": {
      "inherited": true
    },
    "allowUnknownRequestContentType": false,
    "allowUnknownResponseContentType": false,
    "forceMicroserviceGatewayProxy": false,
    "listeners": {
      "frontend": true
    },
    "useDownstreamProtocol": true
  }

  If you want to expose a crud-service endpoint, you can use the following example:
{
    "basePath": "/books",
    "pathName": "/",
    "pathRewrite": "/books",
    "type": "crud",
    "tags": [
      "crud"
    ],
    "description": "Endpoint /crud-books",
    "collectionId": "books",
    "public": true,
    "secreted": false,
    "showInDocumentation": true,
    "acl": "true",
    "backofficeAcl": {
      "inherited": true
    },
    "allowUnknownRequestContentType": false,
    "allowUnknownResponseContentType": false,
    "forceMicroserviceGatewayProxy": false,
    "routes": {
      "GET/": {
        "id": "GET/",
        "verb": "GET",
        "path": "/",
        "public": {
          "inherited": true
        },
        "secreted": {
          "inherited": true
        },
        "showInDocumentation": {
          "inherited": true
        },
        "acl": {
          "inherited": true
        },
        "backofficeAcl": {
          "inherited": true
        },
        "rateLimit": {
          "inherited": true
        },
        "allowUnknownRequestContentType": {
          "inherited": true
        },
        "allowUnknownResponseContentType": {
          "inherited": true
        },
        "preDecorators": [],
        "postDecorators": []
      },
      "POST/": {
        "id": "POST/",
        "verb": "POST",
        "path": "/",
        "public": {
          "inherited": true
        },
        "secreted": {
          "inherited": true
        },
        "showInDocumentation": {
          "inherited": true
        },
        "acl": {
          "inherited": true
        },
        "backofficeAcl": {
          "inherited": true
        },
        "rateLimit": {
          "inherited": true
        },
        "allowUnknownRequestContentType": {
          "inherited": true
        },
        "allowUnknownResponseContentType": {
          "inherited": true
        },
        "preDecorators": [],
        "postDecorators": []
      },
      "GET/export": {
        "id": "GET/export",
        "verb": "GET",
        "path": "/export",
        "public": {
          "inherited": true
        },
        "secreted": {
          "inherited": true
        },
        "showInDocumentation": {
          "inherited": true
        },
        "acl": {
          "inherited": true
        },
        "backofficeAcl": {
          "inherited": true
        },
        "rateLimit": {
          "inherited": true
        },
        "allowUnknownRequestContentType": {
          "inherited": true
        },
        "allowUnknownResponseContentType": {
          "inherited": false,
          "value": true
        },
        "preDecorators": [],
        "postDecorators": []
      },
      "GET/:id": {
        "id": "GET/:id",
        "verb": "GET",
        "path": "/:id",
        "public": {
          "inherited": true
        },
        "secreted": {
          "inherited": true
        },
        "showInDocumentation": {
          "inherited": true
        },
        "acl": {
          "inherited": true
        },
        "backofficeAcl": {
          "inherited": true
        },
        "rateLimit": {
          "inherited": true
        },
        "allowUnknownRequestContentType": {
          "inherited": true
        },
        "allowUnknownResponseContentType": {
          "inherited": true
        },
        "preDecorators": [],
        "postDecorators": []
      },
      "DELETE/:id": {
        "id": "DELETE/:id",
        "verb": "DELETE",
        "path": "/:id",
        "public": {
          "inherited": true
        },
        "secreted": {
          "inherited": true
        },
        "showInDocumentation": {
          "inherited": true
        },
        "acl": {
          "inherited": true
        },
        "backofficeAcl": {
          "inherited": true
        },
        "rateLimit": {
          "inherited": true
        },
        "allowUnknownRequestContentType": {
          "inherited": true
        },
        "allowUnknownResponseContentType": {
          "inherited": true
        },
        "preDecorators": [],
        "postDecorators": []
      },
      "DELETE/": {
        "id": "DELETE/",
        "verb": "DELETE",
        "path": "/",
        "public": {
          "inherited": true
        },
        "secreted": {
          "inherited": true
        },
        "showInDocumentation": {
          "inherited": true
        },
        "acl": {
          "inherited": true
        },
        "backofficeAcl": {
          "inherited": true
        },
        "rateLimit": {
          "inherited": true
        },
        "allowUnknownRequestContentType": {
          "inherited": true
        },
        "allowUnknownResponseContentType": {
          "inherited": true
        },
        "preDecorators": [],
        "postDecorators": []
      },
      "PATCH/:id": {
        "id": "PATCH/:id",
        "verb": "PATCH",
        "path": "/:id",
        "public": {
          "inherited": true
        },
        "secreted": {
          "inherited": true
        },
        "showInDocumentation": {
          "inherited": true
        },
        "acl": {
          "inherited": true
        },
        "backofficeAcl": {
          "inherited": true
        },
        "rateLimit": {
          "inherited": true
        },
        "allowUnknownRequestContentType": {
          "inherited": true
        },
        "allowUnknownResponseContentType": {
          "inherited": true
        },
        "preDecorators": [],
        "postDecorators": []
      },
      "PATCH/": {
        "id": "PATCH/",
        "verb": "PATCH",
        "path": "/",
        "public": {
          "inherited": true
        },
        "secreted": {
          "inherited": true
        },
        "showInDocumentation": {
          "inherited": true
        },
        "acl": {
          "inherited": true
        },
        "backofficeAcl": {
          "inherited": true
        },
        "rateLimit": {
          "inherited": true
        },
        "allowUnknownRequestContentType": {
          "inherited": true
        },
        "allowUnknownResponseContentType": {
          "inherited": true
        },
        "preDecorators": [],
        "postDecorators": []
      },
      "GET/count": {
        "id": "GET/count",
        "verb": "GET",
        "path": "/count",
        "public": {
          "inherited": true
        },
        "secreted": {
          "inherited": true
        },
        "showInDocumentation": {
          "inherited": true
        },
        "acl": {
          "inherited": true
        },
        "backofficeAcl": {
          "inherited": true
        },
        "rateLimit": {
          "inherited": true
        },
        "allowUnknownRequestContentType": {
          "inherited": true
        },
        "allowUnknownResponseContentType": {
          "inherited": true
        },
        "preDecorators": [],
        "postDecorators": []
      },
      "POST/bulk": {
        "id": "POST/bulk",
        "verb": "POST",
        "path": "/bulk",
        "public": {
          "inherited": true
        },
        "secreted": {
          "inherited": true
        },
        "showInDocumentation": {
          "inherited": true
        },
        "acl": {
          "inherited": true
        },
        "backofficeAcl": {
          "inherited": true
        },
        "rateLimit": {
          "inherited": true
        },
        "allowUnknownRequestContentType": {
          "inherited": true
        },
        "allowUnknownResponseContentType": {
          "inherited": true
        },
        "preDecorators": [],
        "postDecorators": []
      },
      "POST/upsert-one": {
        "id": "POST/upsert-one",
        "verb": "POST",
        "path": "/upsert-one",
        "public": {
          "inherited": true
        },
        "secreted": {
          "inherited": true
        },
        "showInDocumentation": {
          "inherited": true
        },
        "acl": {
          "inherited": true
        },
        "backofficeAcl": {
          "inherited": true
        },
        "rateLimit": {
          "inherited": true
        },
        "allowUnknownRequestContentType": {
          "inherited": true
        },
        "allowUnknownResponseContentType": {
          "inherited": true
        },
        "preDecorators": [],
        "postDecorators": []
      },
      "PATCH/bulk": {
        "id": "PATCH/bulk",
        "verb": "PATCH",
        "path": "/bulk",
        "public": {
          "inherited": true
        },
        "secreted": {
          "inherited": true
        },
        "showInDocumentation": {
          "inherited": true
        },
        "acl": {
          "inherited": true
        },
        "backofficeAcl": {
          "inherited": true
        },
        "rateLimit": {
          "inherited": true
        },
        "allowUnknownRequestContentType": {
          "inherited": true
        },
        "allowUnknownResponseContentType": {
          "inherited": true
        },
        "preDecorators": [],
        "postDecorators": []
      },
      "POST/:id/state": {
        "id": "POST/:id/state",
        "verb": "POST",
        "path": "/:id/state",
        "public": {
          "inherited": true
        },
        "secreted": {
          "inherited": true
        },
        "showInDocumentation": {
          "inherited": true
        },
        "acl": {
          "inherited": true
        },
        "backofficeAcl": {
          "inherited": true
        },
        "rateLimit": {
          "inherited": true
        },
        "allowUnknownRequestContentType": {
          "inherited": true
        },
        "allowUnknownResponseContentType": {
          "inherited": true
        },
        "preDecorators": [],
        "postDecorators": []
      },
      "POST/state": {
        "id": "POST/state",
        "verb": "POST",
        "path": "/state",
        "public": {
          "inherited": true
        },
        "secreted": {
          "inherited": true
        },
        "showInDocumentation": {
          "inherited": true
        },
        "acl": {
          "inherited": true
        },
        "backofficeAcl": {
          "inherited": true
        },
        "rateLimit": {
          "inherited": true
        },
        "allowUnknownRequestContentType": {
          "inherited": true
        },
        "allowUnknownResponseContentType": {
          "inherited": true
        },
        "preDecorators": [],
        "postDecorators": []
      }
    },
    "listeners": {
      "frontend": true
    }
  }
`,
  COLLECTIONS: `The crud-service collection to create or update. The key is the name of the collection, the value is the collection object. If crud-service not exists in the project, create it with ${toolNames.CREATE_SERVICE_FROM_MARKETPLACE} tool.
  An example of a crud-service collection is:
  {
    "id": "users",
    "name": "users",
    "fields": [
      {
        "name": "_id",
        "type": "ObjectId",
        "required": true,
        "nullable": false,
        "description": "_id"
      },
      {
        "name": "creatorId",
        "type": "string",
        "required": true,
        "nullable": false,
        "description": "creatorId"
      },
      {
        "name": "createdAt",
        "type": "Date",
        "required": true,
        "nullable": false,
        "description": "createdAt"
      },
      {
        "name": "updaterId",
        "type": "string",
        "required": true,
        "nullable": false,
        "description": "updaterId"
      },
      {
        "name": "updatedAt",
        "type": "Date",
        "required": true,
        "nullable": false,
        "description": "updatedAt"
      },
      {
        "name": "__STATE__",
        "type": "string",
        "required": true,
        "nullable": false,
        "description": "__STATE__"
      },
      {
        "name": "name",
        "type": "string",
        "required": false,
        "nullable": false,
        "sensitivityValue": 0,
        "encryptionEnabled": false,
        "encryptionSearchable": false
      }
    ],
    "internalEndpoints": [
      {
        "basePath": "/users",
        "defaultState": "PUBLIC"
      }
    ],
    "type": "collection",
    "indexes": [
      {
        "name": "_id",
        "type": "normal",
        "unique": true,
        "fields": [
          {
            "name": "_id",
            "order": 1
          }
        ]
      },
      {
        "name": "createdAt",
        "type": "normal",
        "unique": false,
        "fields": [
          {
            "name": "createdAt",
            "order": -1
          }
        ]
      },
      {
        "name": "stateIndex",
        "type": "normal",
        "unique": false,
        "fields": [
          {
            "name": "__STATE__",
            "order": 1
          }
        ]
      }
    ],
    "description": "Collection of users",
    "tags": [
      "collection"
    ]
  }
`,
  // Endpoints
  ENDPOINT_PATH: 'The path of the endpoint to create or update',
  ENDPOINT_TYPE: 'The type of the endpoint to create or update. Use "custom" as default, if not specified.',
  ENDPOINT_IS_PUBLIC: 'If true, the endpoint is public and can be accessed from outside the project without authentication',
  ENDPOINT_ACL: `The ACL to use for the endpoint. This is a CEL expression that will be evaluated to check if the user can access the endpoint.
  Some examples:
  - 'true': the endpoint is externally accessible
  - 'false': the endpoint is not externally accessible
  - 'groups.admin': the endpoint is accessible only to users with the "admin" group`,
  ENDPOINT_SERVICE: 'The target service to use for the endpoint. This is the name of the service in the project',
  ENDPOINT_PORT: 'Exposed port of the service. This is optional, if not specified the default port will be used',
  ENDPOINT_PATH_REWRITE: 'The path rewrite to use for the endpoint. This is optional, if not specified it will be set to "/", so the base path will be trimmed when invoking the target service',
  ENDPOINT_DESCRIPTION: 'Description of the endpoint. If not specified, it should be created based on the context',
  ENDPOINT_LISTENERS: 'The listeners to use for the endpoint. This is a list of strings that represent the listeners to use. If not specified, it will be used the default listeners for the project',
  ENDPOINT_SHOW_IN_DOCUMENTATION: 'If true, the endpoint will be shown in the documentation. If false, it will not be shown in the documentation',

  // Deploy
  PIPELINE_ID: `The id of the pipeline to check the status of. Can be found in the response of the ${toolNames.DEPLOY_PROJECT} tool`,

  // Runtime
  POD_NAME: `The name of the pod to get the logs from. Can be found in the response of the ${toolNames.LIST_PODS} tool`,
  CONTAINER_NAME: `The name of the container pod to get the logs from. Can be found in the response of the ${toolNames.LIST_PODS} tool`,
}
