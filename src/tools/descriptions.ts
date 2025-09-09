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
  LIST_PROJECTS_DESCRIPTION: 'List all projects in the company or tenant identified by the tenantId. If no tenantId is specified, it will list all projects in the current company or tenant. Try to use always search paramenter passing the project name if it is specified',
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
  CONFIGURATION_TO_SAVE: 'configuration_save',
  GET_CONFIGURATION: 'configuration_get',
  CREATE_COLLECTION: 'create_collection',

  // runtime tools
  LIST_PODS: 'list_pods',
  GET_POD_LOGS: 'get_pod_logs',
}

export const toolsDescriptions = {
  // tenants tools
  LIST_TENANTS: 'List Mia-Platform Console companies or tenants that the user can access. Only companies or tenants with AI features enabled will be returned.',
  LIST_TENANTS_TEMPLATES: 'List Mia-Platform project templates for a given company or tenant',
  LIST_TENANTS_IAM: 'List IAM user, groups and or service account for a company or tenant',
  VIEW_TENANTS_AUDIT_LOGS: 'View audit logs for a company or tenant to see who did what and when',

  // marketplace tools
  LIST_MARKETPLACE: `
  List Mia-Platform Console marketplace items for a given company or tenant or the public ones if no company or tenant is specified.
  If the api-gateway is required, and not differently specified, create the envoy based api-gateway.
  `,
  LIST_MARKETPLACE_ITEMS_VERSIONS: 'List all the available versions of a marketplace item',
  MARKETPLACE_ITEM_VERSION_INFO: 'Get information about a specific version of a marketplace item',

  // project tools
  LIST_PROJECTS: `
  List Mia-Platform Projects that the user can access in the given companies or tenants.
  To do that before you need to know the tenantId with the tool ${toolNames.LIST_TENANTS}.
  Only Projects for companies or tenants that enabled AI features will be returned.
  `,
  GET_PROJECT_INFO: 'Get information about a Mia-Platform Console project',
  CREATE_PROJECT_FROM_TEMPLATE: `
  Create a new Mia-Platform Console project from a template in the given company or tenant.
  Use default template if not specified.
  The template can be a public one or a private one, in this case you need to specify the tenantId of the template.
  The project name must be unique in the company or tenant.
  If no further action are required, return the _id and the link to the Console project at the user.
  `,

  // services tools
  CREATE_SERVICE_FROM_MARKETPLACE: `Create a new service in a Mia-Platform Console project starting from an element of the marketplace. If the service is already in the project, ask confirmation to the user if he wants to create another one or use the existing one.`,

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
  CONFIGURATION_TO_SAVE: 'Save the configuration for a project.',
  GET_CONFIGURATION: 'Get the actual configuration for a project for a specific revision or tag',
  CREATE_COLLECTION: 'Create a new CRUD collection in a project. This tool accepts the collection name and user-defined fields, then automatically generates the complete collection structure including all mandatory fields (_id, creatorId, createdAt, updaterId, updatedAt, __STATE__), indexes, internal endpoints, and tags. If the crud-service does not exist in the project, it should be created first using the create_service_from_marketplace tool.',
}

export const paramsDescriptions = {
  // Tenant
  TENANT_ID: `The Mia-Platform Console company or tenant to use. Can be found in the tenantId field of the ${toolNames.LIST_TENANTS} tool`,
  SEARCH_STRING_PROJECT: `The search string to use to filter the projects. Try always to use this parameter to filter the projects. Only if you are not able to find the project you are looking for, use only the tenantId parameter. But before doing that try with different combinations of the search string. If you are not able to find the search string use ""`,

  MULTIPLE_TENANT_IDS: `One or more Mia-Platform Console companies or tenants to filter. Can be found in the tenantId field of the ${toolNames.LIST_TENANTS} tool`,

  // IAM
  IAM_IDENTITY_TYPE: 'Filter the IAM entities by type',

  // Audit Logs
  AUDIT_LOG_FROM: 'The start date of the audit logs to fetch, in unix timestamp format',
  AUDIT_LOG_TO: 'The end date of the audit logs to fetch, in unix timestamp format',

  // Marketplace
  MARKETPLACE_ITEM_ID: `The marketplace item to use to create the service. Can be found in the itemId field of the ${toolNames.LIST_MARKETPLACE} tool`,
  MARKETPLACE_ITEM_TYPE: `
  Type of marketplace item to filter, empty string means no filter.
  Possible values are:
  - application: Applications are bundles of resources that brings together services (i.e., plugins, templates, and examples), endpoints, CRUD collections, and public variables to ease the setup of large-scale artifacts.
  - example: Examples works no differently than templates, in the sense that they too provide an archive with base configurations. Unlike templates, examples should come with some features already implemented and tailored to help the user better familiarize with the development environment.
  - extension: Extensions are custom pages that enhances Console capabilities by integrating it into the sidebar navigation. Since extensions have their own dedicated section, they are left out by the Software Catalog UI. Extensions can still be managed with miactl, and API calls.
  - custom-resource: Infrastructure resources are custom objects that are not part of the standard Console supported resources. They can be managed from the dedicated section of the Console Design area.
  - plugin: Plugins are services that can be instantiated from the microservices section of the Console Design area. Practically speaking, plugins are Docker images that comes with some predefined configurations to make them work in Console projects (e.g., environment variables, config maps, probes...).
  - proxy: Proxies are specific configurations used to invoke APIs that are not part of the current project but may be exposed by an external provider or another project. Proxies can be instantiated from the dedicated section of the Console Design area.
  - sidecar: Sidecars are secondary utility containers running side by side with the main container in the same host. They are Docker images that can be instantiated from the dedicated section of the Console Design area.
  - template: Teamplates can be instantiated in Console the same as plugins. The difference is that they provide an archive that is cloned in the Project scope, instead of a Docker image, giving developers direct access to the codebase to evolve it at will. Templates are meant to be starting points with the bear minimum needed to start a service. Just like plugins, templates may also come with some predefined configurations.
  - infrastructure-component-runtime: Infrastructure Component runtime items are custom objects that are not part of the standard Console supported resources. They can be managed in the context of Infrastructure Project to be able to collect runtime data for visualization within Console.
  `,
  MARKETPLACE_ITEM_TENANT_ID: `The tenant of the marketplace item. Can be found in the tenantId field of the ${toolNames.LIST_MARKETPLACE} tool`,
  MARKETPLACE_ITEM_VERSION: `The version of the marketplace item to use. Can be found in the version field of the ${toolNames.LIST_MARKETPLACE} tool. This is optional, if not specified the latest version will be used`,
  MARKETPLACE_ITEM_SEARCH: `The search string to use to filter the marketplace items. This is optional, if not specified all the marketplace items will be returned`,
  MARKETPLACE_TENANT_ID_FILTER: `
  The Mia-Platform Console company or tenant for which to return both the public and private marketplace resources.
  Can be found in the tenantId field of the ${toolNames.LIST_TENANTS} tool.
  `,

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
  COLLECTION_NAME: `The name of the collection to create. Must be a valid identifier (letters, numbers, underscores).`,
  COLLECTION_FIELDS: `The user-defined fields for the collection. Each field should be an object with: name (string), type (string), description (string). Supported types: "string", "number", "boolean", "Date", "ObjectId", "Array_string", "Array_number", "Array_RawObject", "RawObject". Example: [{"name": "firstName", "type": "string", "description": "User first name"}, {"name": "age", "type": "number", "description": "User age"}]`,
  ENDPOINTS: `
  The endpoints to create or update. If a service with componentId of api-gateway or api-gateway-envoy not exists in the project, create it with ${toolNames.CREATE_SERVICE_FROM_MARKETPLACE} tool. The key is the path of the endpoint, the value is the endpoint object.
  Always set the tags to the endpoint, if not specified it can be set to empty array.
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

  If you want to expose an endpoint which targets the crud-service, use the following example, the routes supported
  are the only ones defined in the example, no other routes are supported:
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
SERVICES: `The services to create or update. The key is the name of the service, the value is the service object. If the service not exists in the project, create it with ${toolNames.CREATE_SERVICE_FROM_MARKETPLACE} tool.
  An example of a service is:
  {
    "type": "custom",
    "advanced": false,
    "name": "echo-service",
    "dockerImage": "davidebianchi/echo-service",
    "replicas": 1,
    "serviceAccountName": "echo-service",
    "logParser": "mia-json",
    "environment": [
      {
        "name": "HTTP_PORT",
        "valueType": "plain",
        "value": "3000"
      }
    ],
    "annotations": [
      {
        "name": "fluentbit.io/parser",
        "value": "pino",
        "description": "Pino parser annotation for Fluent Bit",
        "readOnly": true
      }
    ],
    "labels": [
      {
        "name": "app",
        "value": "echo-service",
        "description": "Name of the microservice, in the service selector",
        "readOnly": true,
        "isSelector": false
      },
      {
        "name": "app.kubernetes.io/name",
        "value": "echo-service",
        "description": "Name of the microservice",
        "readOnly": true,
        "isSelector": false
      },
      {
        "name": "app.kubernetes.io/version",
        "value": "latest",
        "description": "Tag of the Docker image",
        "readOnly": true,
        "isSelector": false
      },
      {
        "name": "app.kubernetes.io/component",
        "value": "custom",
        "description": "Microservice kind, for the Console",
        "readOnly": true,
        "isSelector": false
      },
      {
        "name": "app.kubernetes.io/part-of",
        "value": "test-mcp-creation",
        "description": "Project that own the microservice",
        "readOnly": true,
        "isSelector": false
      },
      {
        "name": "app.kubernetes.io/managed-by",
        "value": "mia-platform",
        "description": "Identify who manage the service",
        "readOnly": true,
        "isSelector": false
      },
      {
        "name": "mia-platform.eu/stage",
        "value": "{{STAGE_TO_DEPLOY}}",
        "description": "Environment used for the deploy",
        "readOnly": true,
        "isSelector": false
      },
      {
        "name": "mia-platform.eu/tenant",
        "value": "390f60bf-7d4f-45f3-86eb-9d8a20957819",
        "description": "Tenant owner of the project",
        "readOnly": true,
        "isSelector": false
      },
      {
        "name": "mia-platform.eu/log-type",
        "value": "mia-json",
        "description": "Format of logs for the microservice",
        "readOnly": true,
        "isSelector": false
      }
    ],
    "resources": {
      "cpuLimits": {
        "max": "100m",
        "min": "100m"
      },
      "memoryLimits": {
        "max": "150Mi",
        "min": "150Mi"
      }
    },
    "tags": [
      "custom"
    ],
    "createdAt": "2025-05-08T17:26:48.798Z",
    "containerPorts": [
      {
        "name": "http",
        "from": 80,
        "to": 3000
      }
    ],
    "terminationGracePeriodSeconds": 30,
    "configMaps": [
      {
        "name": "config",
        "mountPath": "/foo"
      }
    ]
  }
`,
  CONFIG_MAPS: `The config maps to create or update. The key is the name of the config map, the value is the config map object.
  An example of a config map is:
  {
    name: 'config',
    files: [
      {
        name: 'config.json',
        content: '{}'
      }
    ]
  }
`,
  SERVICE_ACCOUNTS: `The service accounts to create or update. The key is the name of the service account, the value is the service account name.
  An example of a service account is:
  {
    name: 'echo-service',
  }
`,

  // Deploy
  PIPELINE_ID: `The id of the pipeline to check the status of. Can be found in the response of the ${toolNames.DEPLOY_PROJECT} tool`,

  // Runtime
  POD_NAME: `The name of the pod to get the logs from. Can be found in the response of the ${toolNames.LIST_PODS} tool`,
  CONTAINER_NAME: `The name of the container pod to get the logs from. Can be found in the response of the ${toolNames.LIST_PODS} tool`,
}
