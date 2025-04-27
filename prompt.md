# How to implement the MCP Server for Mia-Platform Console APIs

Use the following instruction to implement the MCP Server of Mia-Platform console using Claude 3.7 Sonnet

## Pattern to use

### Core createConsoleApiTool Function

Use the same approach of marketplace.ts and don't abstract too much for the first step

### Key Features

Generic Type Parameters:
- TParams: Type for the parameters accepted by the tool
- TResult: Optional type for the transformed result

Flexible Configuration:
- toolName & toolDescription: Metadata for tool registration
- apiPath: The API endpoint path
- paramSchema: Zod schema for validating parameters
- isPaginated: Flag to use single or paginated request
- mapResult: Optional function to transform the API result

Parameter Handling:
- Dynamically builds query parameters from the provided params
- Handles special cases like arrays

API Request Handling:
- Supports both paginated and single requests
- Centralizes error handling

Result Processing:
- Optional result transformation via mapResult
- Consistent response format

### Example Tool Implementations

The file includes example implementations of three different tool types:

- Marketplace Tool (reimplementation of the existing tool):

```javascript
export function marketplaceTools(server: McpServer, client: APIClient) {
  // Implementation using createConsoleApiTool
}
```

- Projects Listing Tool:

``` javascript
export function projectsTools(server: McpServer, client: APIClient) {
  // Implementation using createConsoleApiTool
}
```

- Environments Tool:

```javascript
export function environmentsTools(server: McpServer, client: APIClient) {
  // Implementation using createConsoleApiTool
}
```

### Benefits of This Approach

- Reduced Boilerplate: Eliminates repetitive code when implementing similar API tools
- Consistent Error Handling: Centralizes try/catch blocks and error formatting
- Type Safety: Uses TypeScript generics to ensure type safety
- Flexible Configuration: Supports both simple and complex API interactions
- Maintainability: Changes to the core API interaction pattern can be made in one place

### How to Use It

To implement a new API tool:
- Define a new function for your tool category (e.g., projectsTools)
- Call createConsoleApiTool with the appropriate configuration
- Define your parameter schema using Zod
- Add a result transformation function


## List of APIs to implement

1.  **Name:** Get User Info
    *   **URL Path:** `/api/userinfo`
    *   **Aim:** Retrieves information about the currently authenticated user.
    *   **Parameters:** None.
    *   **Request Body Schema:** None (GET request).
    *   **Response JSON Schema:**
        ```json
        {
          "email": "string",
          "groups": ["string"],
          "name": "string",
          "userId": "string",
          "userSettingsURL": "string" // URL format
        }
        ```

2.  **Name:** List Projects
    *   **URL Path:** `/api/backend/projects/`
    *   **Aim:** Fetches a list of all projects accessible to the authenticated user across all their companies/tenants.
    *   **Parameters:** None observed (potentially supports filtering/pagination).
    *   **Request Body Schema:** None (GET request).
    *   **Response JSON Schema:**
        ```json
        [ // Array of Project Objects
          {
            "_id": "string", // Internal ID
            "availableNamespaces": ["object"], // (Structure may vary or be empty)
            "configurationGitPath": "string", // Path in Git repo
            "configurationManagement": { // Optional?
              "saveMessageOptions": {
                "isConfirmationRequired": {
                  "value": "boolean"
                }
              }
            },
            "deploy": {
              "runnerTool": "string", // e.g., "mlp"
              "strategy": "string", // e.g., "push", "pull"
              "useMiaPrefixEnvs": "boolean" // Optional?
              // Potentially other fields like "orchestratorGenerator"
            },
            "dockerImageNameSuggestion": { // Optional?
              "type": "string" // e.g., "PROJECT_ID"
            },
            "enabledSecurityFeatures": { // Optional?
              "appArmor": "boolean",
              "hostProperties": "boolean",
              "privilegedPod": "boolean",
              "seccompProfile": "boolean"
            },
            "enabledServices": { // Key names might vary
              "api-gateway": "boolean",
              "api-portal": "boolean",
              "auth0-client": "boolean",
              "authorization-service": "boolean",
              "cms-backend": "boolean",
              "cms-site": "boolean",
              "crud-service": "boolean",
              "microservice-gateway": "boolean",
              "oauth-login-site": "boolean",
              "swagger-aggregator": "boolean",
              "v1-adapter": "boolean"
              // Potentially more services
            },
            "environments": [ // Array of Environment Objects
              {
                "cluster": {
                  "clusterId": "string",
                  "namespace": "string"
                },
                "dashboards": ["object"], // (Structure may vary or be empty)
                "deploy": {
                  "runnerTool": "string", // e.g., "mlp"
                  "strategy": "string", // e.g., "push"
                  "type": "string" // e.g., "gitlab-ci"
                  // Optional fields like "providerId"
                },
                "envId": "string", // e.g., "DEV", "PROD"
                "envPrefix": "string", // e.g., "DEV", "PROD"
                "hosts": [ // Array of Host Objects (or empty)
                  {
                    "host": "string", // Hostname
                    "isBackoffice": "boolean", // Optional?
                    "scheme": "string" // e.g., "https"
                  }
                ],
                "isProduction": "boolean",
                "label": "string", // User-friendly label
                "links": ["object"], // (Structure may vary or be empty)
                "type": "string" // e.g., "runtime"
              }
            ],
            "environmentsVariables": { // Optional? Structure depends on type
              "baseUrl": "string", // Example for type: gitlab
              "storage": { // Example for type: gitlab
                "path": "string",
                "type": "string" // e.g., "groups"
              },
              "type": "string", // e.g., "gitlab", "azure-key-vault"
              "providerId": "string" // Optional, depends on type
              // Potentially other fields like "azureClientId", "azureTenantId" for AKV
            },
            "flavor": "string", // e.g., "application", "infrastructure"
            "info": { // Optional?
              "projectOwner": "string",
              "teamContact": "string",
              "technologies": ["string"] // Optional?
            },
            "layerId": "string", // Optional? e.g., "Platform Governance"
            "links": { // Optional? Key is often UUID or "application"
              "string": { // Link ID or predefined key
                "name": "string", // Optional?
                "url": "string", // Optional?
                "isBackoffice": "boolean", // Optional?
                "isEnvironmentLink": "boolean", // Optional?
                "path": "string" // Optional?
              }
            },
            "logicalScopeLayers": [ // Optional? (or empty array)
              {
                "name": "string",
                "order": "number"
              }
            ],
            "monitoring": { // Optional?
              "systems": [
                {
                  "type": "string" // e.g., "prometheus-operator"
                }
              ]
            },
            "name": "string", // Project display name
            "pipelines": { // Optional? Structure depends on type
              "type": "string", // e.g., "gitlab-ci", "jenkins", "azure-pipelines"
              "providerId": "string", // Optional, depends on type
              "jobId": "string", // Optional, for Jenkins
              "statusWebhookSecretCredentialsId": "string", // Optional, for Azure
              "azurePipelineId": "number" // Optional, for Azure
            },
            "projectId": "string", // Technical project ID/slug
            "projectNamespaceVariable": "string", // e.g., "{{KUBE_NAMESPACE}}"
            "repository": {
              "providerId": "string" // ID of the Git provider
            },
            "tenantId": "string", // UUID
            "tenantName": "string",
            "description": "string", // Optional?
            "color": "string", // Optional? Hex color code
            "defaultBranch": "string", // Optional? e.g., "main"
            "containerRegistries": [ // Optional? (or empty array)
              {
                "hostname": "string",
                "id": "string", // UUID
                "imagePullSecretName": "string", // Optional?
                "isDefault": "boolean",
                "name": "string"
              }
            ]
            // Potentially more fields depending on configuration/flavor
          }
        ]
        ```

3.  **Name:** Get User Companies
    *   **URL Path:** `/api/user/companies`
    *   **Aim:** Fetches the list of companies the user is associated with, including their role within each company.
    *   **Parameters:** None.
    *   **Request Body Schema:** None (GET request).
    *   **Response JSON Schema:**
        ```json
        [ // Array of Company Membership Objects
          {
            "companyId": "string", // UUID
            "companyName": "string",
            "roleId": "string", // e.g., "company-owner"
            "groups": [ // Optional? Array of Group Membership Objects (or empty)
              {
                "_id": "string", // Internal ID
                "name": "string",
                "roleId": "string"
              }
            ]
          }
        ]
        ```

4.  **Name:** Get Console Extensions (Global/Tenant)
    *   **URL Path:** `/api/extensibility/extensions`
    *   **Aim:** Retrieves the list of active UI extensions (microfrontends, links) for the console. Can be filtered by tenant.
    *   **Parameters:**
        *   `tenantId` (Query Parameter, Optional, string, UUID format): Filters extensions for a specific tenant. If omitted, likely returns global extensions.
    *   **Request Body Schema:** None (GET request).
    *   **Response JSON Schema:**
        ```json
        [ // Array of Extension Objects
          {
            "microfrontendId": "string", // Identifier for the extension
            "type": "string", // e.g., "spa", "iframe", "external-link"
            "entry": "string", // Entry point URL/path
            "routes": [ // Optional? Array of Route Objects
              {
                "id": "string", // Unique ID for the route within the extension
                "locationId": "string", // Where the route appears (e.g., "tenant", "project")
                "labelIntl": { // Internationalized label
                  "en": "string",
                  "it": "string"
                  // potentially other languages
                },
                "renderType": "string", // Optional? e.g., "category"
                "parentId": "string", // Optional? ID of the parent route for nesting
                "destinationPath": "string", // Optional? Path within the extension URL
                "icon": { // Optional?
                  "name": "string" // Icon identifier (e.g., Phosphor icon name)
                }
              }
            ]
          }
        ]
        ```
    *   **Note:** Called twice in the logs, once without `tenantId` (likely global) and once with `tenantId`.

5.  **Name:** List Roles
    *   **URL Path:** `/v2/api/roles/`
    *   **Aim:** Fetches the definitions of all available user roles within the console system.
    *   **Parameters:** None observed.
    *   **Request Body Schema:** None (GET request).
    *   **Response JSON Schema:**
        ```json
        [ // Array of Role Objects
          {
            "_id": "string", // Internal ID
            "roleId": "string", // Technical role ID (e.g., "company-owner", "developer")
            "__STATE__": "string", // e.g., "PUBLIC"
            "createdAt": "string", // ISO 8601 date-time
            "creatorId": "string",
            "permissions": ["string"], // Array of permission IDs
            "updatedAt": "string", // ISO 8601 date-time
            "updaterId": "string",
            "description": "string", // Optional? User-friendly description
            "name": "string", // User-friendly name
            "order": "number" // Display order hint
          }
        ]
        ```

6.  **Name:** List Permissions
    *   **URL Path:** `/v2/api/permissions/`
    *   **Aim:** Fetches the definitions of all available permissions within the console system.
    *   **Parameters:**
        *   `_l` (Query Parameter, Optional, number): Likely a limit for the number of results (e.g., `_l=200`).
    *   **Request Body Schema:** None (GET request).
    *   **Response JSON Schema:**
        ```json
        [ // Array of Permission Objects
          {
            "_id": "string", // Internal ID
            "__STATE__": "string", // e.g., "PUBLIC"
            "permissionId": "string", // e.g., "console.company.view"
            "createdAt": "string", // ISO 8601 date-time
            "creatorId": "string",
            "intlDescription": { // Optional? Internationalized description
              "en": "string",
              "it": "string"
              // potentially other languages
            },
            "updatedAt": "string", // ISO 8601 date-time
            "updaterId": "string"
          }
        ]
        ```

7.  **Name:** Get Assistant Chat Commands
    *   **URL Path:** `/api/assistant/chat/commands`
    *   **Aim:** Retrieves the available chat commands for the Mia-Assistant feature, filtered by tenant.
    *   **Parameters:**
        *   `tenant_id` (Query Parameter, Required, string, UUID format): The ID of the tenant for which to fetch commands.
    *   **Request Body Schema:** None (GET request).
    *   **Response JSON Schema:**
        ```json
        [ // Array of Command Objects
          {
            "name": "string", // Command name (e.g., "debug")
            "intlDescription": { // Internationalized description
              "en": "string",
              "it": "string"
              // potentially other languages
            },
            "scopes": ["string"] // Where the command is applicable (e.g., "environment")
          }
        ]
        ```

8.  **Name:** Get Project Status
    *   **URL Path:** `/api/projects/{projectId}/status/`
    *   **Aim:** Fetches the aggregated status (pod health, basic metrics) for each environment within a specified project.
    *   **Parameters:**
        *   `projectId` (Path Parameter, Required, string, ObjectId format): The ID of the project.
    *   **Request Body Schema:** None (GET request).
    *   **Response JSON Schema:**
        ```json
        [ // Array of Environment Status Objects
          {
            "envId": "string", // e.g., "DEV", "PROD"
            "pods": {
              "healthy": "number", // Count of healthy pods
              "unhealthy": "number" // Count of unhealthy pods
            },
            "metrics": {} // Object for metrics (structure may vary, was empty in example)
          }
        ]
        ```

9.  **Name:** Get Project Revisions
    *   **URL Path:** `/api/backend/projects/{projectId}/revisions`
    *   **Aim:** Retrieves the list of available Git branches/revisions for a specific project's configuration repository.
    *   **Parameters:**
        *   `projectId` (Path Parameter, Required, string, ObjectId format): The ID of the project.
    *   **Request Body Schema:** None (GET request).
    *   **Response JSON Schema:**
        ```json
        [ // Array of Revision Objects
          {
            "name": "string", // Branch/revision name
            "commit": {
              "date": "string", // ISO 8601 date-time
              "author": "string",
              "authorEmail": "string"
            },
            "isDefault": "boolean" // Optional? Indicates the default branch
          }
        ]
        ```

10. **Name:** Get Project Versions
    *   **URL Path:** `/api/backend/projects/{projectId}/versions`
    *   **Aim:** Retrieves the list of tagged versions (releases) from a specific project's configuration repository.
    *   **Parameters:**
        *   `projectId` (Path Parameter, Required, string, ObjectId format): The ID of the project.
    *   **Request Body Schema:** None (GET request).
    *   **Response JSON Schema:**
        ```json
        [ // Array of Version Objects
          {
            "name": "string", // Tag name (e.g., "v1.0.0", "empty")
            "commit": {
              "date": "string", // ISO 8601 date-time
              "author": "string",
              "authorEmail": "string"
            },
            "versionInfo": { // Optional?
              "releaseNote": "string" // Optional?
            }
          }
        ]
        ```

11. **Name:** Describe Environment Pods
    *   **URL Path:** `/api/projects/{projectId}/environments/{envId}/pods/describe/`
    *   **Aim:** Fetches detailed descriptions (similar to `kubectl describe pod`) for all pods within a specific project environment.
    *   **Parameters:**
        *   `projectId` (Path Parameter, Required, string, ObjectId format): The ID of the project.
        *   `envId` (Path Parameter, Required, string): The environment ID (e.g., "DEV", "PROD").
    *   **Request Body Schema:** None (GET request).
    *   **Response JSON Schema:**
        ```json
        [ // Array of Pod Description Objects
          {
            "annotations": {"string": "string"}, // Key-value map
            "component": [ // Optional? Array of component objects from Marketplace
              {
                "name": "string",
                "version": "string"
              }
            ],
            "conditions": [ // Array of Pod Condition Objects
              {
                "lastProbeTime": "string", // ISO 8601 date-time or empty
                "lastTransitionTime": "string", // ISO 8601 date-time
                "status": "string", // "True", "False", "Unknown"
                "type": "string" // e.g., "Initialized", "Ready", "ContainersReady", "PodScheduled"
              }
            ],
            "containers": [ // Array of Container Objects
              {
                "containerId": "string", // e.g., "containerd://..."
                "env": [ // Array of Environment Variable Objects
                  {
                    "name": "string",
                    "value": "string" // Value might be masked for secrets
                  }
                ],
                "image": "string", // Docker image name and tag
                "imageId": "string", // Image ID with SHA digest
                "lastState": {}, // Object describing last termination state (often empty)
                "mounts": [ // Array of Volume Mount Objects
                  {
                    "mountPath": "string", // Path inside container
                    "name": "string", // Volume name
                    "readOnly": "boolean"
                  }
                ],
                "name": "string", // Container name
                "ready": "boolean",
                "resources": {
                  "limits": { // Optional?
                    "cpu": "string", // e.g., "500m"
                    "memory": "string" // e.g., "400Mi"
                  },
                  "usage": { // Optional? Current usage
                    "cpu": "string", // e.g., "5469187n" (nanocores)
                    "memory": "string" // e.g., "218304Ki"
                  }
                },
                "restartCount": "number",
                "started": "string", // ISO 8601 date-time
                "status": "string" // e.g., "running", "terminated"
              }
            ],
            "containersReady": "boolean",
            "labels": {"string": "string"}, // Key-value map
            "name": "string", // Pod name
            "namespace": "string",
            "node": "string", // Node name where the pod is scheduled
            "phase": "string", // e.g., "Running", "Pending", "Succeeded", "Failed"
            "qosClass": "string", // e.g., "Burstable", "Guaranteed", "BestEffort"
            "startTime": "string", // ISO 8601 date-time
            "status": "string", // Simplified status e.g., "ok", "error"
            "tolerations": [ // Optional? Array of Toleration Objects
              {
                "effect": "string", // e.g., "NoExecute", "NoSchedule"
                "key": "string",
                "operator": "string" // e.g., "Exists"
                // "value" and "tolerationSeconds" might also be present
              }
            ],
            "volumes": [ // Array of Volume Objects (structure varies by type)
              {
                "volumeName": { // Key is the volume name
                  "defaultMode": "number", // e.g., 420 (octal)
                  "name": "string", // Name of the ConfigMap/Secret/etc.
                  "type": "string", // e.g., "configMap", "projected", "secret"
                  // Other fields depend on the type (e.g., "sources" for projected)
                }
              }
            ]
          }
        ]
        ```

12. **Name:** Get Container Logs
    *   **URL Path:** `/api/projects/{projectId}/environments/{envId}/pods/{podName}/containers/{containerName}/logs`
    *   **Aim:** Retrieves the logs for a specific container within a pod.
    *   **Parameters:**
        *   `projectId` (Path Parameter, Required, string, ObjectId format): The ID of the project.
        *   `envId` (Path Parameter, Required, string): The environment ID.
        *   `podName` (Path Parameter, Required, string): The name of the pod.
        *   `containerName` (Path Parameter, Required, string): The name of the container within the pod.
        *   `follow` (Query Parameter, Optional, boolean): Stream logs continuously.
        *   `wrapHtml` (Query Parameter, Optional, boolean): Wrap log lines in HTML spans for frontend formatting.
        *   `pretty` (Query Parameter, Optional, boolean): Attempt to pretty-print JSON logs.
        *   `tailLines` (Query Parameter, Optional, number): Number of lines to fetch from the end.
        *   `useEnhancedPrettier` (Query Parameter, Optional, boolean): Use an enhanced prettifier.
        *   `previous` (Query Parameter, Optional, boolean): Fetch logs from the previous instance of the container (if it crashed).
    *   **Request Body Schema:** None (GET request).
    *   **Response Schema:** `text/html` or plain text containing log lines. Not JSON.


# Example of prompts after the first set of tools

implement a new tool called <the tool name> to retrive the project templates, the available environments, the configurationGitPah

use the same approach of get-projects

the api request and the response is the following, parse the response in formatted Text

# Raw Curl
-------------------------------------

## Create a Project

Get Provider List
curl 'https://demo.console.gcp.mia-platform.eu/api/backend/tenants/b933f1ef-5b8e-4adf-a346-24a3b03d13e8/providers/' \
  -H 'Accept: application/json'

```json
  [
  {
    "providerId": "digital-platform-c-gitlab",
    "type": "gitlab",
    "label": "Mia-Platform GitLab",
    "urls": {
      "base": "https://git.tools.mia-platform.eu",
      "apiBase": "https://git.tools.mia-platform.eu/api"
    },
    "credentials": {
      "type": "token"
    },
    "capabilities": [
      {
        "name": "secret-manager"
      },
      {
        "name": "ci-cd-tool"
      },
      {
        "name": "git-provider",
        "functionalities": [
          {
            "name": "project"
          }
        ]
      }
    ],
    "_id": "638f1fff7be577272f7fb9d0"
  },
  {
    "providerId": "akv-provider",
    "type": "azure-key-vault",
    "label": "akv-provider",
    "urls": {
      "base": "https://ciccio",
      "apiBase": "https://ciccio"
    },
    "credentials": {
      "type": "token"
    },
    "capabilities": [
      {
        "name": "secret-manager",
        "functionalities": []
      }
    ],
    "_id": "65f42be4d94dc0af05aef1cd"
  },
  {
    "providerId": "demo-test",
    "type": "extension-api",
    "label": "demo-test",
    "urls": {
      "base": "https://tmpmf.free.beeceptor.com",
      "apiBase": "https://tmpmf.free.beeceptor.com"
    },
    "credentials": {
      "type": "token"
    },
    "capabilities": [
      {
        "name": "orchestrator-generator",
        "functionalities": []
      }
    ],
    "_id": "65f804bbdd5ea0b98056ebc6"
  },
  {
    "providerId": "mia-platform-azure",
    "type": "azure-devops",
    "label": "Mia-Platform Azure",
    "urls": {
      "base": "https://dev.azure.com",
      "apiBase": "https://dev.azure.com"
    },
    "credentials": {
      "type": "token"
    },
    "capabilities": [
      {
        "name": "git-provider",
        "functionalities": [
          {
            "name": "project"
          }
        ]
      },
      {
        "name": "ci-cd-tool",
        "functionalities": []
      }
    ],
    "_id": "6538f2a7455f85defe1b2366"
  },
  {
    "providerId": "aws-generator",
    "type": "extension-api",
    "label": "AWS Generator",
    "urls": {
      "base": "https://deployment-orchestrator-ext-test.mia-demo-re5gu6.gcp.mia-platform.eu/aws-generator",
      "apiBase": "https://deployment-orchestrator-ext-test.mia-demo-re5gu6.gcp.mia-platform.eu/aws-generator/generate"
    },
    "credentials": {
      "type": "token"
    },
    "capabilities": [
      {
        "name": "orchestrator-generator"
      }
    ],
    "_id": "663e2805ffe0f520ec6d7033"
  },
  {
    "providerId": "test-frengo-akv",
    "type": "azure-key-vault",
    "label": "test-frengo-akv",
    "urls": {
      "base": "https://test-demo-akv.vault.azure.net/",
      "apiBase": "https://test-demo-akv.vault.azure.net/"
    },
    "credentials": {
      "type": "client_credentials_certificate"
    },
    "capabilities": [
      {
        "name": "secret-manager"
      }
    ],
    "_id": "669a16c8e36dcd0766397c38"
  },
  {
    "providerId": "provider-demp",
    "type": "gitlab",
    "label": "provider demp",
    "urls": {
      "base": "https://base-url",
      "apiBase": "https://api-base-url"
    },
    "credentials": {
      "type": "token"
    },
    "capabilities": [
      {
        "name": "secret-manager",
        "functionalities": []
      },
      {
        "name": "ci-cd-tool",
        "functionalities": []
      },
      {
        "name": "git-provider",
        "functionalities": [
          {
            "name": "project"
          }
        ]
      }
    ],
    "_id": "669a5a9fe36dcd0766397c6c"
  },
  {
    "providerId": "github-giulio",
    "type": "github",
    "label": "GitHub Giulio",
    "description": "GitHub provider of Giulio space",
    "urls": {
      "base": "https://github.com",
      "apiBase": "https://api.github.com"
    },
    "credentials": {
      "type": "token"
    },
    "capabilities": [
      {
        "name": "ci-cd-tool"
      },
      {
        "name": "git-provider",
        "functionalities": [
          {
            "name": "project"
          }
        ],
        "repositoryPathTemplate": "giulioroggero/{{projectId}}"
      }
    ],
    "_id": "67b1d955fa909e3dff000cfd"
  }
]
```

Get Clusters
curl 'https://demo.console.gcp.mia-platform.eu/api/tenants/b933f1ef-5b8e-4adf-a346-24a3b03d13e8/clusters/' \
  -H 'accept: application/json' \

```json
[
  {
    "_id": "67f7f755c9dfc7ba2f000e9d",
    "clusterId": "internal-expert",
    "connection": {
      "base64CA": "LS0tLS1CRUdJTiBDRVJUSUZJQ0FURS0tLS0tCk1JSUVMVENDQXBXZ0F3SUJBZ0lSQU9QaTJsc2RBd0l6U2d3TlhwYVFNTjh3RFFZSktvWklodmNOQVFFTEJRQXcKTHpFdE1Dc0dBMVVFQXhNa00yRXhZMlZoTldFdFlqazNZUzAwWkRoa0xUaGpaakV0T1dJellUa3lOemhqTVRVeQpNQ0FYRFRJek1URXhNekE0TlRFeU5Wb1lEekl3TlRNeE1UQTFNRGsxTVRJMVdqQXZNUzB3S3dZRFZRUURFeVF6CllURmpaV0UxWVMxaU9UZGhMVFJrT0dRdE9HTm1NUzA1WWpOaE9USTNPR014TlRJd2dnR2lNQTBHQ1NxR1NJYjMKRFFFQkFRVUFBNElCandBd2dnR0tBb0lCZ1FEQmYvckZXdlFLeWlaSmJ6UnBrYkRkUmhzTlhHQVArZWppVlpZcgowcWNJYmdGc0U1Wm92UjB1NGdIUG9lODd0QmpUTmpWdzdwajZUSzBqSngvYmVaSE4yeUNqdzhvZUhsUGRvc3luCmRMVkNQSVZ6RHB1Ny9RK0Y2bW5GNlN2amdZREZQbjAyZTlyMGtuaUh0YTRsYkxqSjFpNU1BMnoyWWNXeCswL1EKajRxTDljSGxITmlaQTg1ZWQwQ29Obk5wejVveDdEc3FreVZkZ3dSYVZrWDJITDRxV2tiaHVVSnV4RnQwYWpydwpNVDFtamdjMU5iWGlMZER5OGRyMmhQV0dSY0xJTHZHU2M5YjdhN1c1RFBMeE03MmFmTkNCNEpkQzUrNVppTk8zCkNES3YwL01rZXBDakpEMXdFL2RVWmc2Tld1WFZmcldsUXpCN2F0SElYeGdNdkIvbS91NnVHYmxndytGUEErQloKOGRGSEZLMTVmYytoWVZMY0dOazFLZ0tpQUNBUEVDTHB5MHBCZzF4NEhWemdPSjJkTWpNUVlnald2UC9wdFFzcgpvVmMvUWZ4bGZRQndYOHNScWNsbHRtaUVORnNsRjVjSFdlM2dKOTUvSnRxc3VQdjRzcFF4UFI1U0lqeTU5dTdLCkVoUkpHNUQzVi9RV21aQkFjemdadlBRU0tQVUNBd0VBQWFOQ01FQXdEZ1lEVlIwUEFRSC9CQVFEQWdJRU1BOEcKQTFVZEV3RUIvd1FGTUFNQkFmOHdIUVlEVlIwT0JCWUVGR1h2cHd2K1lPcHJoSUY0Z0VlTnAzc1ZrOE55TUEwRwpDU3FHU0liM0RRRUJDd1VBQTRJQmdRQThQaHRTUmxBN1RzbnZKcC9MdFV6SkU1ZXI2K09IMTFSZE9tM2tiMjRpCjhRU2twMGNzbndaNGdoZmt0WnAxbHhnN1NlK1RBUGZKdzE4VE5HckJuNDI0ZXZvbWErM081eWZORnNrNVFnQTYKNjRXcE82a2Q0eStnK2lYcDBJUVRXZnR2TkJzUlFiWlN5Wm14a0xHWk9NSkxNWmpMNEw1YVZTZWFtSno3Z21lYgpNZnZ3ME03SU1WOWZLUFh0WUFMOTUxKzQ3alROTWNrME15ZDlld2dBcGRteHovWXU0WVNpZitobVUvSE1LOWh6Cm4yT3h3UWhuRTRZbm9ETzNiYnJVTUovM0xLSDJCS1dieTAxb2hBeVpxYTF1MXltMmY4dnFUemV0aEpuVTdBbngKUERXR095UHpuWVBxRlA3Tzhtd0l2eXY2SjhUTDY5WitSL0NObW1vbjlPWTllSW01MnNYOU5LR3A1N0NibzZPZwo1TkMxMk9kTUJSdHVOMEpzRTJiSmwwMGUyeWNNMW1wL01tbCtKbDY0V2xCR2tESVhkRTZKZ0JMYklRWjhQZCt5CmJDeUlWR2M3SmkrSFE0MENteHRISWc0bmVmNUFJYytDT243TnR2TFJScWEvaXB3eTRhZHNHZWlRU1gyYndMQmMKTGJwRy90UnUvZHArcURiY0g0OC9tdFU9Ci0tLS0tRU5EIENFUlRJRklDQVRFLS0tLS0=",
      "credentials": {
        "type": "token"
      },
      "url": "https://35.195.53.74"
    },
    "distribution": "GKE",
    "linkedProjects": [
      {
        "_id": "67f7f7aac9dfc7ba2f000e9e",
        "linkedEnvironments": [
          {
            "envId": "DEV-GCP",
            "label": "Development Google"
          }
        ],
        "name": "Demo Multi Cloud",
        "projectId": "demo-multi-cloud"
      }
    ],
    "runtimeInfo": {
      "cpuCores": 4,
      "nodesCount": 2,
      "ramMiB": 32766.72,
      "version": "v1.31.7-gke.1013001"
    },
    "tenantId": "b933f1ef-5b8e-4adf-a346-24a3b03d13e8",
    "vendor": "GCP"
  },
  {
    "_id": "67111f327c27d260a21c1c52",
    "clusterId": "mia-azure-demo",
    "connection": {
      "base64CA": "LS0tLS1CRUdJTiBDRVJUSUZJQ0FURS0tLS0tCk1JSUU2RENDQXRDZ0F3SUJBZ0lRRDNjRnQzNUlIaCtDejl2UzFUcUoxVEFOQmdrcWhraUc5dzBCQVFzRkFEQU4KTVFzd0NRWURWUVFERXdKallUQWdGdzB5TkRBNU1EUXhNekV4TURGYUdBOHlNRFUwTURrd05ERXpNakV3TVZvdwpEVEVMTUFrR0ExVUVBeE1DWTJFd2dnSWlNQTBHQ1NxR1NJYjNEUUVCQVFVQUE0SUNEd0F3Z2dJS0FvSUNBUURpCjJZVFBVODZLY0NWcUFOSEdsV3YwZ2VsVnF4RDJoMlVsaEgvQS9uWGVXd0VjL2cwbjhhaTRwK3dYOFI5UHhHOGIKMkpEVDJjME5EYVBsU2s0d3dQTWNUUS9rMWNNTDVHc3F3dW11UE5tYnJyZnhyYktHa21BRGFlS3lXaGR6Z0xxNQpjMTlzUzhyQ0xiSm0zT2ZWK2hUOURpR0NPSjUzbVRIb3NzVjRFb1hIS05NaFJzYW1BbEtuUGlEdE5XWmRBT3UrCnBhcnE4dUNJV05hOWR0ZTRRKzRFbzhycVBPUzZGQ2NSTEFwaUZjSlFTbVVhWFZxcW8zaXhscG0xUk8rMTVvdXUKRmxQemdNbk5kNVA2bjhFZ2NjdjBUbVdrZUszZzJMcldkN0M2cDBnSWluT0JTOG9RZXBBcFluWk5JVEJlRm1qeQpWMHVMb3pzRGh4M1AvdVhZNlp1MG80Rno3eVJ5bWtsT2QyaUU5c1FwWWoxSHducHhzbGtISUxhSjRzVm1PYXg0CkUycWJXTGxnVk1ZWHZJK2VOUGE2NStGVU9BTGgyR1JyKzBnNC8xTit3RW15d1AwS1p1bEFGM2lkTEhnbDhESGMKemVVMnh5NWpjelMvYlVrUVNETkZwSXJpY3B5d21DU0tpWTlPbmpuV0ZYZTFLd0xRRmRnT2QyYklZYVAxc2drRAp2blI5d3FPY0xMMTR5RDNnY1RteCtDS3lnRmFhQXpQdEV5S3dnK0ZFSFU5bG1NdHRac0ltbXVpek9hTWp2YUN5ClN2aGRScXhXY3ZCT1JRWGZhbjVvMWJvbkc3VGY3RnVtM0NBZFNHY3ZvVHVLeW9BaTdQZVcyMGl0M1ZNaUpOYWsKYlZCVVBxNElCYnVLRkZ6V1hiQU5JdXlGT0pWUTMxaHVSNFA5N1U1alZRSURBUUFCbzBJd1FEQU9CZ05WSFE4QgpBZjhFQkFNQ0FxUXdEd1lEVlIwVEFRSC9CQVV3QXdFQi96QWRCZ05WSFE0RUZnUVVDR2txZU5uNkFBVDNBSE91CnFoMUxSa0ZnNnFrd0RRWUpLb1pJaHZjTkFRRUxCUUFEZ2dJQkFCMzBWZnR5MXU0ajllRnVweUpxZzU4aHJETXEKaVdDS2R0UWFkM1NXTTRhR2s0L3hUajRxNlBSOWN1akUxUjRJZlFWMDBUNFVQcGNVa3MxeG9HeDQrUHBORFduLwpWWU9NblNzRXIzNjZOb283VzYxSm5NUThaak9kWVRTdFdVUFgrenBqYVZ6ZU9kYkl4Uk1GTzJORTVFNVJnR3hLCmdLNkMvMm53Zkt6bHh2TkRmNTREdENrOUZ6bldwcnkwQ2lvYnRlNktOKzFUZlZFdVBqTzltOE1wOVhqNXdEd3AKUURBWTVsbDc1MndoUVpLaitha0xhZE03a3JBMmR2ZzFBRVpHS1FPaG1zcUFTV2xZa0o3VHJzV2I1cGJpTU8zUgp5Nk1NZFdqMHFkUzBHQ1g3Z2kzZEk5RXVVWkl3NFhkWEJ6VTFodkN2ck80d2IxTnd2djRpRkFQSGlRSFJqQnBaCkxTWlFXbk9MYnA2OVlhYmV0b05rKzdDbWQ2T2pSSDdUNnY3UERWN0gwYjZTS2l2RW92N2dVdk01ZDhudlEvc1UKdW1IWUcvM3haUS85K2dQR3lBaURiUXZpRmNHUUlsanRNcjVGb3RMOTdKcEVPUXhIaXRlN2I4eUE2ZzBNNmtWMgpKaG42ZEpJVjJzbVFmSkxJNjM0a1hJRGFRaks2c1cvbVp2ejlvTWZZai9CQVE1MWk1WWk5a2kyWFdxemFNanlhCkJNRWMxUEp3RU9nKzRwUERoUG90N2lGdlE0YWU5bkRHaW9LU3BNYzJ4K1FkajZRMk9DOWQvSmU5RHZrWHIzeTQKazhWRXlHc05aQm5lQ2dLY2hoZkszZGpHRHhxK2c0T2xpN3dFVCs0aVFod3NhcXlCTjlUSFJYbzkycU4rSHNNSAorckxuVm9obkhHam1paHFDCi0tLS0tRU5EIENFUlRJRklDQVRFLS0tLS0=",
      "credentials": {
        "type": "token"
      },
      "url": "https://mia-demo-h3hrdo6i.hcp.northeurope.azmk8s.io:443"
    },
    "distribution": "AKS",
    "linkedProjects": [
      {
        "_id": "65f1855d2b3a4f3a39a6ac68",
        "linkedEnvironments": [
          {
            "envId": "DEV",
            "label": "Development"
          },
          {
            "envId": "PROD",
            "label": "Production"
          }
        ],
        "name": "Demo Prada - Fast Data",
        "projectId": "demo-prada-fast-data"
      },
      {
        "_id": "67f40321c9dfc7ba2f000cb6",
        "linkedEnvironments": [
          {
            "envId": "DEV",
            "label": "Development"
          },
          {
            "envId": "PROD",
            "label": "Production"
          }
        ],
        "name": "AI Agents Playground",
        "projectId": "ai-agents-playground"
      },
      {
        "_id": "67f4cf6ac9dfc7ba2f000d49",
        "linkedEnvironments": [
          {
            "envId": "DEV",
            "label": "Development"
          },
          {
            "envId": "PROD",
            "label": "Production"
          }
        ],
        "name": "AI Agent Builder Demo 2",
        "projectId": "ai-agent-builder-demo-2"
      }
    ],
    "runtimeInfo": {
      "cpuCores": 20,
      "nodesCount": 10,
      "ramMiB": 67888.7,
      "version": "v1.30.7"
    },
    "tenantId": "b933f1ef-5b8e-4adf-a346-24a3b03d13e8",
    "vendor": "Azure"
  },
  {
    "_id": "638f22cf7be577272f7fb9d9",
    "clusterId": "noprod",
    "connection": {
      "base64CA": "LS0tLS1CRUdJTiBDRVJUSUZJQ0FURS0tLS0tCk1JSUVMVENDQXBXZ0F3SUJBZ0lSQVBBZGN1QkQzTlF4SDIxMFdwNDgxRjR3RFFZSktvWklodmNOQVFFTEJRQXcKTHpFdE1Dc0dBMVVFQXhNa09HRmtPV1pqWldNdE16Y3dZUzAwWXpsa0xXRXdNbVV0T1dFek16a3pOelZsT0RReQpNQ0FYRFRJek1URXdOekUwTURJME1sb1lEekl3TlRNeE1ETXdNVFV3TWpReVdqQXZNUzB3S3dZRFZRUURFeVE0CllXUTVabU5sWXkwek56QmhMVFJqT1dRdFlUQXlaUzA1WVRNek9UTTNOV1U0TkRJd2dnR2lNQTBHQ1NxR1NJYjMKRFFFQkFRVUFBNElCandBd2dnR0tBb0lCZ1FEZ3BSWWRtUWhuTVFuWkdoWlV4dHBaVThTQUgrblFTR2JiNU9GWgo2L3EzWmJENmhZaDhiT1Q0SDRGSlJMd3JpU0NlK1hzZXpaYjhDU0UydytmZElZM29nSGNNWFd5Mk12ejZCWGpqCnZnQVc0VkRYU1BBUWM4RWtyS1RDbnNTVENrb2w0UTh3QURTZmFrRGRBVG1BVHNCV21PeWM0UHRSYmRlcHpmYWUKcGtiN1RSdlZVeUdRR0tPcGdZSzVMaE9JcWRnbUxhaXdpYThNdGJlc1Fnb2k1Tnc3REhKazY1bks1SU9wS0tIVApNSjB6cXNqTkt3ZzdKZmFiSXRYVU9WV1MwdzJlTU5HeXRDNzJCOVBqL3MxVHhGTG1iOEVFL0pSc2EvZXRZSHFZCnpjR1o5UGY5czR2THprY01oOFo2bmRQVE1OYzdKMmxGSVdNdVBMYXJBM2JVUmZ0Rm02eUhOWEFyY3ZHL3hVM20KVkxjV1hLUm9tYnJBNW9qQXMwblpzaTB5K0hqYnhlUnpQTHcvZE14Y3Q2LzgwVDk4NW1lYmJidUJVU29qeTdQWgowVW9vME5jcm9KSGhkRnBudVB4NFYreTMvL0R1b2ZFNFhzTUJkdEVEY1cxaW9qcXlBYkZBTUJvckJRYzlackovCnprQmg3K2E5MWZOOCszZkZNWHhiUEs0NVZ2c0NBd0VBQWFOQ01FQXdEZ1lEVlIwUEFRSC9CQVFEQWdJRU1BOEcKQTFVZEV3RUIvd1FGTUFNQkFmOHdIUVlEVlIwT0JCWUVGSEpxTTNXdGU4UVo5Unl3dTc5ZGlpdWE5bnFxTUEwRwpDU3FHU0liM0RRRUJDd1VBQTRJQmdRQmd4R3hzaTJQU3lvZGdqc2E4NVd2SHRXU2tEanM1bENENmlIZFBtU21PClp3b01ncHUwOXFQK2NVM01LRUszU1J3OXNYQThBWll6d09jblNSdVBad3UxL2w4ODQxcEJkVFVKWHlLRUpialgKdmh1QXZwWGZaU3d4QldOalppU0JtRlB6ejJ0S2xOc1JoVFN0cHVhMGNlME5QdjVWNjJIb1p3YnZHMG0yS2owdgpWZjU4TEVwM05KUlZ6TTY2WGxIZ0QzclhkbWNrQ2dVRTVMT0JaTVMvcjduNXFneVpjSE9wQlBDeklZMml6bVA0CjVha3dEZGQrUldOcmdZUUx1K0pzbFY2ZVFzS2FDWGNHeDBDSzc0TUUrV0N4TlNSb0pKYnp2SzlvcElYeGkzMVAKUkd1c1hCOTZXWU1ESXFKNng1TlNEekR0d0IvL2FlQndPZkdWbVdDQ2psZFU1TzhnK1o3cEZBYko1YlpweGpDMwpwK3gzdDBTaGpqN0JLQ3d0SUVTUE5CN1NhZXJ0NVdxMHFhd0RJKzloWE5JSHZHWG1oR1gwUFNFalBHcFYxd0RyCkRkTWQzZlM3bkh4bkF4SXU1Nm12aVFRa2ZINFZLYUlyZHZKekxVNHVYWnYrWGt4eVA4NDA0OGxVYXMxY0FmSEgKbTZUUC9CWm94cnpaazBybEI1ODQrbFk9Ci0tLS0tRU5EIENFUlRJRklDQVRFLS0tLS0K",
      "credentials": {
        "type": "token"
      },
      "url": "https://35.187.15.76/"
    },
    "distribution": "GKE",
    "geographics": "Belgium",
    "linkedProjects": [
      {
        "_id": "664462f80ab66695d4addfae",
        "linkedEnvironments": [
          {
            "envId": "EPHE",
            "label": "Demo"
          },
          {
            "envId": "FEDE",
            "label": "Testfede"
          }
        ],
        "name": "Ephemeral Environments Omar",
        "projectId": "ephemeral-environments-omar"
      }
    ],
    "tenantId": "b933f1ef-5b8e-4adf-a346-24a3b03d13e8",
    "vendor": "GCP"
  },
  {
    "_id": "64946fecacbfb5652b0ee741",
    "clusterId": "rke",
    "connection": {
      "base64CA": "LS0tLS1CRUdJTiBDRVJUSUZJQ0FURS0tLS0tCk1JSUJ2VENDQVdPZ0F3SUJBZ0lCQURBS0JnZ3Foa2pPUFFRREFqQkdNUnd3R2dZRFZRUUtFeE5rZVc1aGJXbGoKYkdsemRHVnVaWEl0YjNKbk1TWXdKQVlEVlFRRERCMWtlVzVoYldsamJHbHpkR1Z1WlhJdFkyRkFNVFk0TnpRMApNREF3TnpBZUZ3MHlNekEyTWpJeE16SXdNRGRhRncwek16QTJNVGt4TXpJd01EZGFNRVl4SERBYUJnTlZCQW9UCkUyUjVibUZ0YVdOc2FYTjBaVzVsY2kxdmNtY3hKakFrQmdOVkJBTU1IV1I1Ym1GdGFXTnNhWE4wWlc1bGNpMWoKWVVBeE5qZzNORFF3TURBM01Ga3dFd1lIS29aSXpqMENBUVlJS29aSXpqMERBUWNEUWdBRWR2LzV3OHRUeWFRWApaUWR3RHVZNTRqRzdYTVRCZjhJZVFTYUxGY0pxSlVJR01qRTVUUmJZdlVrOWpUT2JXV2NPV0M3YnlzT3V3SFc5CjBDQ3ZxcEc0VEtOQ01FQXdEZ1lEVlIwUEFRSC9CQVFEQWdLa01BOEdBMVVkRXdFQi93UUZNQU1CQWY4d0hRWUQKVlIwT0JCWUVGQUplK0VTYnpLa3JISVkzNmUwdnVXSkxuc2tBTUFvR0NDcUdTTTQ5QkFNQ0EwZ0FNRVVDSUVhSQpYbmFXS0thdDZDWFBNWFB5RHI2dnZKUUVjU3A2elRxS1BxUDFGRjlSQWlFQWtLaUJUVXVaQ2UvRUgvVTl5dVVMCkpTYnZzMFN4ZFh0Qk8ydzBuc0RMZ01BPQotLS0tLUVORCBDRVJUSUZJQ0FURS0tLS0t",
      "credentials": {
        "type": "token"
      },
      "url": "https://rancher.34.22.179.165.sslip.io/k8s/clusters/c-m-2j6gswph"
    },
    "description": "This cluster is usually shut down. If you need to turn it on, go to GCP operations-lab project. Go to Compute Engine. Select quickstart-quickstart-node and quickstart-rancher-server instances. Start them. Wait 5-6 minutes.",
    "distribution": "RKE",
    "tenantId": "b933f1ef-5b8e-4adf-a346-24a3b03d13e8",
    "vendor": "Rancher"
  }
]
```

Get Project Blueprints
curl 'https://demo.console.gcp.mia-platform.eu/api/backend/tenants/b933f1ef-5b8e-4adf-a346-24a3b03d13e8/project-blueprint/' \
  -H 'accept: application/json' \
  
```json
{
  "tenantId": "b933f1ef-5b8e-4adf-a346-24a3b03d13e8",
  "name": "Experiments",
  "environments": [
    {
      "envId": "DEV",
      "label": "Development",
      "hosts": [
        {
          "host": "%projectId%-test.mia-demo-re5gu6.gcp.mia-platform.eu",
          "isBackoffice": false,
          "scheme": "https"
        }
      ],
      "isProduction": false,
      "cluster": {
        "namespace": "%projectId%-dev",
        "clusterId": "67111f327c27d260a21c1c52",
        "kubeContextVariables": {
          "KUBE_URL": "KUBE_AZURE_NOPROD_URL",
          "KUBE_TOKEN": "KUBE_AZURE_NOPROD_TOKEN",
          "KUBE_CA_PEM": "KUBE_AZURE_NOPROD_CA_PEM"
        }
      }
    },
    {
      "envId": "PROD",
      "label": "Production",
      "hosts": [
        {
          "host": "%projectId%.mia-demo-re5gu6.gcp.mia-platform.eu",
          "isBackoffice": false,
          "scheme": "https"
        }
      ],
      "isProduction": true,
      "cluster": {
        "namespace": "%projectId%-prod",
        "clusterId": "67111f327c27d260a21c1c52",
        "kubeContextVariables": {
          "KUBE_URL": "KUBE_AZURE_NOPROD_URL",
          "KUBE_TOKEN": "KUBE_AZURE_NOPROD_TOKEN",
          "KUBE_CA_PEM": "KUBE_AZURE_NOPROD_CA_PEM"
        }
      }
    }
  ],
  "availableNamespaces": [],
  "environmentsVariables": {
    "type": "gitlab",
    "providerId": "digital-platform-c-gitlab"
  },
  "pipelines": {
    "providerId": "digital-platform-c-gitlab",
    "type": "gitlab-ci"
  },
  "defaultTemplateId": "b3f09625-9389-4c81-84ce-0159b24ee264",
  "repository": {
    "type": "gitlab",
    "providerId": "digital-platform-c-gitlab",
    "basePath": "clients/mia-platform/demo/demo-companies/digital-platform-c",
    "visibility": "internal"
  },
  "containerRegistries": [
    {
      "id": "349a921b-21e6-4349-878b-5b5b5a820781",
      "name": "orca-ghcr",
      "hostname": "orca-ghcr.com",
      "imagePullSecretName": "orca-ghcr",
      "isDefault": false
    },
    {
      "id": "60273517-df65-4faf-bb8c-f998adfd67e2",
      "name": "orca-google-registry",
      "hostname": "orca-google-registry.com",
      "imagePullSecretName": "orca-google-registry",
      "isDefault": false
    },
    {
      "id": "1636736a-2907-4d2c-8f5e-738e27e19a03",
      "name": "ghcr.io",
      "hostname": "ghcr.io",
      "isDefault": false
    },
    {
      "id": "cd6ae8c5-feb0-4e5c-beec-39cf8290d3d7",
      "name": "mia-platform-nexus",
      "hostname": "nexus.mia-platform.eu",
      "isDefault": true
    }
  ],
  "enabledSecurityFeatures": {
    "seccompProfile": true,
    "appArmor": true,
    "hostProperties": true,
    "privilegedPod": true
  },
  "templates": [
    {
      "templateId": "bd18c537-fd72-4952-866c-f682bd58a146",
      "name": "Mia-Platform Basic Project Template Experiments",
      "_id": "665d8851cec9736057ac3f6a",
      "tenantId": "b933f1ef-5b8e-4adf-a346-24a3b03d13e8",
      "archiveUrl": "https://git.tools.mia-platform.eu/api/v4/projects/105650/repository/archive.tar.gz?sha=v3.1.0",
      "deploy": {
        "runnerTool": "mlp",
        "useMiaPrefixEnvs": false,
        "projectStructure": "kustomize",
        "strategy": "push"
      },
      "dashboards": [
        {
          "id": "fdecb702-a6a8-4646-8d34-d420530b4999",
          "label": "Responses Details",
          "url": "https://grafana.mia-platform.eu/d/dfNsc-jnz/api-gateway-apis?orgId=131&var-cluster=miademo&var-namespace=%namespace%&var-loki=Loki&var-prometheus=Prometheus&from=now-1d&theme=light&kiosk=tv",
          "type": "iframe",
          "category": {
            "label": "API"
          }
        },
        {
          "id": "resource-util-per-pod",
          "label": "Pods Resources",
          "url": "https://grafana.mia-platform.eu/d/6581e46e4e5c7ba40a07646395ef7b23/kubernetes-compute-resources-pod?orgId=131&refresh=15s&var-datasource=default&var-cluster=miademo&var-namespace=%namespace%&theme=light&kiosk=tv",
          "type": "iframe",
          "category": {
            "label": "Resources"
          }
        },
        {
          "id": "resource-util-per-ns",
          "label": "Runtime Summary",
          "url": "https://grafana.mia-platform.eu/d/a87fb0d919ec0ea5f6543124e16c42a5/kubernetes-compute-resources-namespace-workloads?orgId=131&refresh=15s&var-datasource=default&var-cluster=miademo&var-namespace=%namespace%&theme=light&kiosk=tv",
          "type": "iframe",
          "category": {
            "label": "Resources"
          }
        },
        {
          "id": "kafka-consumer-group",
          "label": "Projections",
          "url": "https://grafana.mia-platform.eu/d/3397b707-4324-48f5-bf48-05949e3fecb0/kafka-messages-dashboard?var-cluster=miademo&var-namespace=%namespace%&var-consumer_group=demo.development.warehouse&var-consumergroup_subscribed_topics=All&var-topic=demo.development.pr-articles-json&orgId=131&theme=light&&kiosk=tv",
          "type": "iframe",
          "category": {
            "label": "Fast Data"
          }
        },
        {
          "id": "fast-data-svc-creator",
          "label": "Single Views",
          "url": "https://grafana.mia-platform.eu/d/9a041f86-6f82-44c0-8416-80e377985015/fast-data-single-views?orgId=131&refresh=10s&var-datasource=Prometheus&var-cluster=miademo&var-namespace=%namespace%&var-portfolioOrigin=articles&var-svType=All&var-svcDeployment=All&theme=light&kiosk=tv",
          "type": "iframe",
          "category": {
            "label": "Fast Data"
          }
        },
        {
          "id": "container-logs-k8s",
          "label": "Container Logs",
          "url": "https://grafana.mia-platform.eu/explore?orgId=131&left=%7B%22datasource%22:%226RF5EkK4z%22,%22queries%22:%5B%7B%22refId%22:%22A%22,%22expr%22:%22%7Bnamespace%3D%5C%22%namespace%%5C%22%7D%20%7C%3D%20%60%60%22,%22queryType%22:%22range%22,%22datasource%22:%7B%22type%22:%22loki%22,%22uid%22:%226RF5EkK4z%22%7D,%22editorMode%22:%22builder%22%7D%5D,%22range%22:%7B%22from%22:%22now-7d%22,%22to%22:%22now%22%7D%7D&theme=light&kiosk=tv",
          "type": "iframe",
          "category": {
            "label": "Logs"
          }
        }
      ],
      "enabledServices": {
        "cms-site": false,
        "cms-backend": false,
        "v1-adapter": false,
        "auth0-client": false,
        "oauth-login-site": false,
        "crud-service": false,
        "swagger-aggregator": false,
        "api-portal": false,
        "microservice-gateway": false,
        "authorization-service": false,
        "api-gateway": false
      },
      "staticSecret": {}
    },
    {
      "templateId": "1b423a05-e862-47a0-ad91-8f6dbcac5860",
      "name": "Mia-Platform Azure Template Experiments",
      "_id": "665d8937cec9736057ac3f6c",
      "tenantId": "b933f1ef-5b8e-4adf-a346-24a3b03d13e8",
      "description": "Template for Azure",
      "archiveUrl": "https://dev.azure.com/mia-platform-devops/Projects%20Templates/_apis/git/repositories/Mia-Platform%20Basic%20Project%20Template/items?path=/&versionDescriptor%5BversionOptions%5D=0&versionDescriptor%5BversionType%5D=0&versionDescriptor%5Bversion%5D=master&resolveLfs=true&%24format=zip&api-version=5.0&download=true",
      "deploy": {
        "runnerTool": "mlp",
        "useMiaPrefixEnvs": false,
        "projectStructure": "kustomize",
        "strategy": "push"
      },
      "dashboards": [
        {
          "id": "fdecb702-a6a8-4646-8d34-d420530b4999",
          "label": "Responses Details",
          "url": "https://grafana.mia-platform.eu/d/dfNsc-jnz/api-gateway-apis?orgId=131&var-cluster=miademo&var-namespace=%namespace%&var-loki=Loki&var-prometheus=Prometheus&from=now-1d&theme=light&kiosk=tv",
          "type": "iframe",
          "category": {
            "label": "API"
          }
        },
        {
          "id": "resource-util-per-pod",
          "label": "Pods Resources",
          "url": "https://grafana.mia-platform.eu/d/6581e46e4e5c7ba40a07646395ef7b23/kubernetes-compute-resources-pod?orgId=131&refresh=15s&var-datasource=default&var-cluster=miademo&var-namespace=%namespace%&theme=light&kiosk=tv",
          "type": "iframe",
          "category": {
            "label": "Resources"
          }
        },
        {
          "id": "resource-util-per-ns",
          "label": "Runtime Summary",
          "url": "https://grafana.mia-platform.eu/d/a87fb0d919ec0ea5f6543124e16c42a5/kubernetes-compute-resources-namespace-workloads?orgId=131&refresh=15s&var-datasource=default&var-cluster=miademo&var-namespace=%namespace%&theme=light&kiosk=tv",
          "type": "iframe",
          "category": {
            "label": "Resources"
          }
        },
        {
          "id": "kafka-consumer-group",
          "label": "Projections",
          "url": "https://grafana.mia-platform.eu/d/3397b707-4324-48f5-bf48-05949e3fecb0/kafka-messages-dashboard?var-cluster=miademo&var-namespace=%namespace%&var-consumer_group=demo.development.warehouse&var-consumergroup_subscribed_topics=All&var-topic=demo.development.pr-articles-json&orgId=131&theme=light&&kiosk=tv",
          "type": "iframe",
          "category": {
            "label": "Fast Data"
          }
        },
        {
          "id": "fast-data-svc-creator",
          "label": "Single Views",
          "url": "https://grafana.mia-platform.eu/d/9a041f86-6f82-44c0-8416-80e377985015/fast-data-single-views?orgId=131&refresh=10s&var-datasource=Prometheus&var-cluster=miademo&var-namespace=%namespace%&var-portfolioOrigin=articles&var-svType=All&var-svcDeployment=All&theme=light&kiosk=tv",
          "type": "iframe",
          "category": {
            "label": "Fast Data"
          }
        },
        {
          "id": "container-logs-k8s",
          "label": "Container Logs",
          "url": "https://grafana.mia-platform.eu/explore?orgId=131&left=%7B%22datasource%22:%226RF5EkK4z%22,%22queries%22:%5B%7B%22refId%22:%22A%22,%22expr%22:%22%7Bnamespace%3D%5C%22%namespace%%5C%22%7D%20%7C%3D%20%60%60%22,%22queryType%22:%22range%22,%22datasource%22:%7B%22type%22:%22loki%22,%22uid%22:%226RF5EkK4z%22%7D,%22editorMode%22:%22builder%22%7D%5D,%22range%22:%7B%22from%22:%22now-7d%22,%22to%22:%22now%22%7D%7D&theme=light&kiosk=tv",
          "type": "iframe",
          "category": {
            "label": "Logs"
          }
        }
      ],
      "enabledServices": {
        "cms-site": false,
        "cms-backend": false,
        "v1-adapter": false,
        "auth0-client": false,
        "oauth-login-site": false,
        "crud-service": false,
        "swagger-aggregator": false,
        "api-portal": false,
        "microservice-gateway": false,
        "authorization-service": false,
        "api-gateway": false
      },
      "staticSecret": {}
    },
    {
      "templateId": "b3f09625-9389-4c81-84ce-0159b24ee264",
      "name": "Mia-Platform Enhanced Workflow Basic Template Experiments",
      "_id": "665d898bcec9736057ac3f6d",
      "tenantId": "b933f1ef-5b8e-4adf-a346-24a3b03d13e8",
      "description": "A basic template to get started with the enhanced workflow",
      "archiveUrl": "https://git.tools.mia-platform.eu/api/v4/projects/139891/repository/archive.tar.gz",
      "deploy": {
        "runnerTool": "mlp",
        "projectStructure": "kustomize",
        "strategy": "push"
      },
      "dashboards": [
        {
          "id": "fdecb702-a6a8-4646-8d34-d420530b4999",
          "label": "Responses Details",
          "url": "https://grafana.mia-platform.eu/d/dfNsc-jnz/api-gateway-apis?orgId=131&var-cluster=miademo&var-namespace=%namespace%&var-loki=Loki&var-prometheus=Prometheus&from=now-1d&theme=light&kiosk=tv",
          "type": "iframe",
          "category": {
            "label": "API"
          }
        },
        {
          "id": "resource-util-per-pod",
          "label": "Pods Resources",
          "url": "https://grafana.mia-platform.eu/d/6581e46e4e5c7ba40a07646395ef7b23/kubernetes-compute-resources-pod?orgId=131&refresh=15s&var-datasource=default&var-cluster=miademo&var-namespace=%namespace%&theme=light&kiosk=tv",
          "type": "iframe",
          "category": {
            "label": "Resources"
          }
        },
        {
          "id": "resource-util-per-ns",
          "label": "Runtime Summary",
          "url": "https://grafana.mia-platform.eu/d/a87fb0d919ec0ea5f6543124e16c42a5/kubernetes-compute-resources-namespace-workloads?orgId=131&refresh=15s&var-datasource=default&var-cluster=miademo&var-namespace=%namespace%&theme=light&kiosk=tv",
          "type": "iframe",
          "category": {
            "label": "Resources"
          }
        },
        {
          "id": "kafka-consumer-group",
          "label": "Projections",
          "url": "https://grafana.mia-platform.eu/d/3397b707-4324-48f5-bf48-05949e3fecb0/kafka-messages-dashboard?var-cluster=miademo&var-namespace=%namespace%&var-consumer_group=demo.development.warehouse&var-consumergroup_subscribed_topics=All&var-topic=demo.development.pr-articles-json&orgId=131&theme=light&&kiosk=tv",
          "type": "iframe",
          "category": {
            "label": "Fast Data"
          }
        },
        {
          "id": "fast-data-svc-creator",
          "label": "Single Views",
          "url": "https://grafana.mia-platform.eu/d/9a041f86-6f82-44c0-8416-80e377985015/fast-data-single-views?orgId=131&refresh=10s&var-datasource=Prometheus&var-cluster=miademo&var-namespace=%namespace%&var-portfolioOrigin=articles&var-svType=All&var-svcDeployment=All&theme=light&kiosk=tv",
          "type": "iframe",
          "category": {
            "label": "Fast Data"
          }
        },
        {
          "id": "container-logs-k8s",
          "label": "Container Logs",
          "url": "https://grafana.mia-platform.eu/explore?orgId=131&left=%7B%22datasource%22:%226RF5EkK4z%22,%22queries%22:%5B%7B%22refId%22:%22A%22,%22expr%22:%22%7Bnamespace%3D%5C%22%namespace%%5C%22%7D%20%7C%3D%20%60%60%22,%22queryType%22:%22range%22,%22datasource%22:%7B%22type%22:%22loki%22,%22uid%22:%226RF5EkK4z%22%7D,%22editorMode%22:%22builder%22%7D%5D,%22range%22:%7B%22from%22:%22now-7d%22,%22to%22:%22now%22%7D%7D&theme=light&kiosk=tv",
          "type": "iframe",
          "category": {
            "label": "Logs"
          }
        }
      ],
      "enabledServices": {
        "cms-site": false,
        "cms-backend": false,
        "v1-adapter": false,
        "auth0-client": false,
        "oauth-login-site": false,
        "crud-service": false,
        "swagger-aggregator": false,
        "api-portal": false,
        "microservice-gateway": false,
        "authorization-service": false,
        "api-gateway": false
      },
      "staticSecret": {}
    }
  ]
}
```

Get draft project
curl 'https://demo.console.gcp.mia-platform.eu/api/backend/projects/draft?tenantId=b933f1ef-5b8e-4adf-a346-24a3b03d13e8&projectId=test-project-giulio&projectName=Test%20Project%20Giulio&flavor=application'

```json
{
  "environments": [
    {
      "envId": "DEV",
      "label": "Development",
      "hosts": [
        {
          "host": "test-project-giulio-test.mia-demo-re5gu6.gcp.mia-platform.eu",
          "isBackoffice": false,
          "scheme": "https"
        }
      ],
      "isProduction": false,
      "cluster": {
        "hostname": "mia-demo-h3hrdo6i.hcp.northeurope.azmk8s.io",
        "namespace": "test-project-giulio-dev",
        "clusterId": "67111f327c27d260a21c1c52",
        "_id": "67111f327c27d260a21c1c52",
        "base64CA": "LS0tLS1CRUdJTiBDRVJUSUZJQ0FURS0tLS0tCk1JSUU2RENDQXRDZ0F3SUJBZ0lRRDNjRnQzNUlIaCtDejl2UzFUcUoxVEFOQmdrcWhraUc5dzBCQVFzRkFEQU4KTVFzd0NRWURWUVFERXdKallUQWdGdzB5TkRBNU1EUXhNekV4TURGYUdBOHlNRFUwTURrd05ERXpNakV3TVZvdwpEVEVMTUFrR0ExVUVBeE1DWTJFd2dnSWlNQTBHQ1NxR1NJYjNEUUVCQVFVQUE0SUNEd0F3Z2dJS0FvSUNBUURpCjJZVFBVODZLY0NWcUFOSEdsV3YwZ2VsVnF4RDJoMlVsaEgvQS9uWGVXd0VjL2cwbjhhaTRwK3dYOFI5UHhHOGIKMkpEVDJjME5EYVBsU2s0d3dQTWNUUS9rMWNNTDVHc3F3dW11UE5tYnJyZnhyYktHa21BRGFlS3lXaGR6Z0xxNQpjMTlzUzhyQ0xiSm0zT2ZWK2hUOURpR0NPSjUzbVRIb3NzVjRFb1hIS05NaFJzYW1BbEtuUGlEdE5XWmRBT3UrCnBhcnE4dUNJV05hOWR0ZTRRKzRFbzhycVBPUzZGQ2NSTEFwaUZjSlFTbVVhWFZxcW8zaXhscG0xUk8rMTVvdXUKRmxQemdNbk5kNVA2bjhFZ2NjdjBUbVdrZUszZzJMcldkN0M2cDBnSWluT0JTOG9RZXBBcFluWk5JVEJlRm1qeQpWMHVMb3pzRGh4M1AvdVhZNlp1MG80Rno3eVJ5bWtsT2QyaUU5c1FwWWoxSHducHhzbGtISUxhSjRzVm1PYXg0CkUycWJXTGxnVk1ZWHZJK2VOUGE2NStGVU9BTGgyR1JyKzBnNC8xTit3RW15d1AwS1p1bEFGM2lkTEhnbDhESGMKemVVMnh5NWpjelMvYlVrUVNETkZwSXJpY3B5d21DU0tpWTlPbmpuV0ZYZTFLd0xRRmRnT2QyYklZYVAxc2drRAp2blI5d3FPY0xMMTR5RDNnY1RteCtDS3lnRmFhQXpQdEV5S3dnK0ZFSFU5bG1NdHRac0ltbXVpek9hTWp2YUN5ClN2aGRScXhXY3ZCT1JRWGZhbjVvMWJvbkc3VGY3RnVtM0NBZFNHY3ZvVHVLeW9BaTdQZVcyMGl0M1ZNaUpOYWsKYlZCVVBxNElCYnVLRkZ6V1hiQU5JdXlGT0pWUTMxaHVSNFA5N1U1alZRSURBUUFCbzBJd1FEQU9CZ05WSFE4QgpBZjhFQkFNQ0FxUXdEd1lEVlIwVEFRSC9CQVV3QXdFQi96QWRCZ05WSFE0RUZnUVVDR2txZU5uNkFBVDNBSE91CnFoMUxSa0ZnNnFrd0RRWUpLb1pJaHZjTkFRRUxCUUFEZ2dJQkFCMzBWZnR5MXU0ajllRnVweUpxZzU4aHJETXEKaVdDS2R0UWFkM1NXTTRhR2s0L3hUajRxNlBSOWN1akUxUjRJZlFWMDBUNFVQcGNVa3MxeG9HeDQrUHBORFduLwpWWU9NblNzRXIzNjZOb283VzYxSm5NUThaak9kWVRTdFdVUFgrenBqYVZ6ZU9kYkl4Uk1GTzJORTVFNVJnR3hLCmdLNkMvMm53Zkt6bHh2TkRmNTREdENrOUZ6bldwcnkwQ2lvYnRlNktOKzFUZlZFdVBqTzltOE1wOVhqNXdEd3AKUURBWTVsbDc1MndoUVpLaitha0xhZE03a3JBMmR2ZzFBRVpHS1FPaG1zcUFTV2xZa0o3VHJzV2I1cGJpTU8zUgp5Nk1NZFdqMHFkUzBHQ1g3Z2kzZEk5RXVVWkl3NFhkWEJ6VTFodkN2ck80d2IxTnd2djRpRkFQSGlRSFJqQnBaCkxTWlFXbk9MYnA2OVlhYmV0b05rKzdDbWQ2T2pSSDdUNnY3UERWN0gwYjZTS2l2RW92N2dVdk01ZDhudlEvc1UKdW1IWUcvM3haUS85K2dQR3lBaURiUXZpRmNHUUlsanRNcjVGb3RMOTdKcEVPUXhIaXRlN2I4eUE2ZzBNNmtWMgpKaG42ZEpJVjJzbVFmSkxJNjM0a1hJRGFRaks2c1cvbVp2ejlvTWZZai9CQVE1MWk1WWk5a2kyWFdxemFNanlhCkJNRWMxUEp3RU9nKzRwUERoUG90N2lGdlE0YWU5bkRHaW9LU3BNYzJ4K1FkajZRMk9DOWQvSmU5RHZrWHIzeTQKazhWRXlHc05aQm5lQ2dLY2hoZkszZGpHRHhxK2c0T2xpN3dFVCs0aVFod3NhcXlCTjlUSFJYbzkycU4rSHNNSAorckxuVm9obkhHam1paHFDCi0tLS0tRU5EIENFUlRJRklDQVRFLS0tLS0=",
        "kubeContextVariables": {
          "KUBE_URL": "KUBE_AZURE_NOPROD_URL",
          "KUBE_TOKEN": "KUBE_AZURE_NOPROD_TOKEN",
          "KUBE_CA_PEM": "KUBE_AZURE_NOPROD_CA_PEM"
        }
      }
    },
    {
      "envId": "PROD",
      "label": "Production",
      "hosts": [
        {
          "host": "test-project-giulio.mia-demo-re5gu6.gcp.mia-platform.eu",
          "isBackoffice": false,
          "scheme": "https"
        }
      ],
      "isProduction": true,
      "cluster": {
        "hostname": "mia-demo-h3hrdo6i.hcp.northeurope.azmk8s.io",
        "namespace": "test-project-giulio-prod",
        "clusterId": "67111f327c27d260a21c1c52",
        "_id": "67111f327c27d260a21c1c52",
        "base64CA": "LS0tLS1CRUdJTiBDRVJUSUZJQ0FURS0tLS0tCk1JSUU2RENDQXRDZ0F3SUJBZ0lRRDNjRnQzNUlIaCtDejl2UzFUcUoxVEFOQmdrcWhraUc5dzBCQVFzRkFEQU4KTVFzd0NRWURWUVFERXdKallUQWdGdzB5TkRBNU1EUXhNekV4TURGYUdBOHlNRFUwTURrd05ERXpNakV3TVZvdwpEVEVMTUFrR0ExVUVBeE1DWTJFd2dnSWlNQTBHQ1NxR1NJYjNEUUVCQVFVQUE0SUNEd0F3Z2dJS0FvSUNBUURpCjJZVFBVODZLY0NWcUFOSEdsV3YwZ2VsVnF4RDJoMlVsaEgvQS9uWGVXd0VjL2cwbjhhaTRwK3dYOFI5UHhHOGIKMkpEVDJjME5EYVBsU2s0d3dQTWNUUS9rMWNNTDVHc3F3dW11UE5tYnJyZnhyYktHa21BRGFlS3lXaGR6Z0xxNQpjMTlzUzhyQ0xiSm0zT2ZWK2hUOURpR0NPSjUzbVRIb3NzVjRFb1hIS05NaFJzYW1BbEtuUGlEdE5XWmRBT3UrCnBhcnE4dUNJV05hOWR0ZTRRKzRFbzhycVBPUzZGQ2NSTEFwaUZjSlFTbVVhWFZxcW8zaXhscG0xUk8rMTVvdXUKRmxQemdNbk5kNVA2bjhFZ2NjdjBUbVdrZUszZzJMcldkN0M2cDBnSWluT0JTOG9RZXBBcFluWk5JVEJlRm1qeQpWMHVMb3pzRGh4M1AvdVhZNlp1MG80Rno3eVJ5bWtsT2QyaUU5c1FwWWoxSHducHhzbGtISUxhSjRzVm1PYXg0CkUycWJXTGxnVk1ZWHZJK2VOUGE2NStGVU9BTGgyR1JyKzBnNC8xTit3RW15d1AwS1p1bEFGM2lkTEhnbDhESGMKemVVMnh5NWpjelMvYlVrUVNETkZwSXJpY3B5d21DU0tpWTlPbmpuV0ZYZTFLd0xRRmRnT2QyYklZYVAxc2drRAp2blI5d3FPY0xMMTR5RDNnY1RteCtDS3lnRmFhQXpQdEV5S3dnK0ZFSFU5bG1NdHRac0ltbXVpek9hTWp2YUN5ClN2aGRScXhXY3ZCT1JRWGZhbjVvMWJvbkc3VGY3RnVtM0NBZFNHY3ZvVHVLeW9BaTdQZVcyMGl0M1ZNaUpOYWsKYlZCVVBxNElCYnVLRkZ6V1hiQU5JdXlGT0pWUTMxaHVSNFA5N1U1alZRSURBUUFCbzBJd1FEQU9CZ05WSFE4QgpBZjhFQkFNQ0FxUXdEd1lEVlIwVEFRSC9CQVV3QXdFQi96QWRCZ05WSFE0RUZnUVVDR2txZU5uNkFBVDNBSE91CnFoMUxSa0ZnNnFrd0RRWUpLb1pJaHZjTkFRRUxCUUFEZ2dJQkFCMzBWZnR5MXU0ajllRnVweUpxZzU4aHJETXEKaVdDS2R0UWFkM1NXTTRhR2s0L3hUajRxNlBSOWN1akUxUjRJZlFWMDBUNFVQcGNVa3MxeG9HeDQrUHBORFduLwpWWU9NblNzRXIzNjZOb283VzYxSm5NUThaak9kWVRTdFdVUFgrenBqYVZ6ZU9kYkl4Uk1GTzJORTVFNVJnR3hLCmdLNkMvMm53Zkt6bHh2TkRmNTREdENrOUZ6bldwcnkwQ2lvYnRlNktOKzFUZlZFdVBqTzltOE1wOVhqNXdEd3AKUURBWTVsbDc1MndoUVpLaitha0xhZE03a3JBMmR2ZzFBRVpHS1FPaG1zcUFTV2xZa0o3VHJzV2I1cGJpTU8zUgp5Nk1NZFdqMHFkUzBHQ1g3Z2kzZEk5RXVVWkl3NFhkWEJ6VTFodkN2ck80d2IxTnd2djRpRkFQSGlRSFJqQnBaCkxTWlFXbk9MYnA2OVlhYmV0b05rKzdDbWQ2T2pSSDdUNnY3UERWN0gwYjZTS2l2RW92N2dVdk01ZDhudlEvc1UKdW1IWUcvM3haUS85K2dQR3lBaURiUXZpRmNHUUlsanRNcjVGb3RMOTdKcEVPUXhIaXRlN2I4eUE2ZzBNNmtWMgpKaG42ZEpJVjJzbVFmSkxJNjM0a1hJRGFRaks2c1cvbVp2ejlvTWZZai9CQVE1MWk1WWk5a2kyWFdxemFNanlhCkJNRWMxUEp3RU9nKzRwUERoUG90N2lGdlE0YWU5bkRHaW9LU3BNYzJ4K1FkajZRMk9DOWQvSmU5RHZrWHIzeTQKazhWRXlHc05aQm5lQ2dLY2hoZkszZGpHRHhxK2c0T2xpN3dFVCs0aVFod3NhcXlCTjlUSFJYbzkycU4rSHNNSAorckxuVm9obkhHam1paHFDCi0tLS0tRU5EIENFUlRJRklDQVRFLS0tLS0=",
        "kubeContextVariables": {
          "KUBE_URL": "KUBE_AZURE_NOPROD_URL",
          "KUBE_TOKEN": "KUBE_AZURE_NOPROD_TOKEN",
          "KUBE_CA_PEM": "KUBE_AZURE_NOPROD_CA_PEM"
        }
      }
    }
  ],
  "environmentsVariables": {
    "type": "gitlab",
    "providerId": "digital-platform-c-gitlab",
    "baseUrl": "https://git.tools.mia-platform.eu",
    "storage": {
      "type": "groups",
      "path": "clients/mia-platform/demo/demo-companies/digital-platform-c/test-project-giulio"
    }
  },
  "templateId": "b3f09625-9389-4c81-84ce-0159b24ee264",
  "repository": {
    "providerId": "digital-platform-c-gitlab",
    "provider": {
      "label": "Mia-Platform GitLab",
      "type": "gitlab"
    },
    "gitPath": "clients/mia-platform/demo/demo-companies/digital-platform-c/test-project-giulio/configurations",
    "visibility": "internal"
  },
  "pipelines": {
    "providerId": "digital-platform-c-gitlab",
    "type": "gitlab-ci"
  }
}
```

curl 'https://demo.console.gcp.mia-platform.eu/api/backend/templates/?tenantId=b933f1ef-5b8e-4adf-a346-24a3b03d13e8' 

```json
[
  {
    "_id": "665d8851cec9736057ac3f6a",
    "templateId": "bd18c537-fd72-4952-866c-f682bd58a146",
    "tenantId": "b933f1ef-5b8e-4adf-a346-24a3b03d13e8",
    "name": "Mia-Platform Basic Project Template Experiments",
    "archiveUrl": "https://git.tools.mia-platform.eu/api/v4/projects/105650/repository/archive.tar.gz?sha=v3.1.0",
    "deploy": {
      "runnerTool": "mlp",
      "useMiaPrefixEnvs": false,
      "projectStructure": "kustomize",
      "strategy": "push"
    },
    "dashboards": [
      {
        "id": "fdecb702-a6a8-4646-8d34-d420530b4999",
        "label": "Responses Details",
        "url": "https://grafana.mia-platform.eu/d/dfNsc-jnz/api-gateway-apis?orgId=131&var-cluster=miademo&var-namespace=%namespace%&var-loki=Loki&var-prometheus=Prometheus&from=now-1d&theme=light&kiosk=tv",
        "type": "iframe",
        "category": {
          "label": "API"
        }
      },
      {
        "id": "resource-util-per-pod",
        "label": "Pods Resources",
        "url": "https://grafana.mia-platform.eu/d/6581e46e4e5c7ba40a07646395ef7b23/kubernetes-compute-resources-pod?orgId=131&refresh=15s&var-datasource=default&var-cluster=miademo&var-namespace=%namespace%&theme=light&kiosk=tv",
        "type": "iframe",
        "category": {
          "label": "Resources"
        }
      },
      {
        "id": "resource-util-per-ns",
        "label": "Runtime Summary",
        "url": "https://grafana.mia-platform.eu/d/a87fb0d919ec0ea5f6543124e16c42a5/kubernetes-compute-resources-namespace-workloads?orgId=131&refresh=15s&var-datasource=default&var-cluster=miademo&var-namespace=%namespace%&theme=light&kiosk=tv",
        "type": "iframe",
        "category": {
          "label": "Resources"
        }
      },
      {
        "id": "kafka-consumer-group",
        "label": "Projections",
        "url": "https://grafana.mia-platform.eu/d/3397b707-4324-48f5-bf48-05949e3fecb0/kafka-messages-dashboard?var-cluster=miademo&var-namespace=%namespace%&var-consumer_group=demo.development.warehouse&var-consumergroup_subscribed_topics=All&var-topic=demo.development.pr-articles-json&orgId=131&theme=light&&kiosk=tv",
        "type": "iframe",
        "category": {
          "label": "Fast Data"
        }
      },
      {
        "id": "fast-data-svc-creator",
        "label": "Single Views",
        "url": "https://grafana.mia-platform.eu/d/9a041f86-6f82-44c0-8416-80e377985015/fast-data-single-views?orgId=131&refresh=10s&var-datasource=Prometheus&var-cluster=miademo&var-namespace=%namespace%&var-portfolioOrigin=articles&var-svType=All&var-svcDeployment=All&theme=light&kiosk=tv",
        "type": "iframe",
        "category": {
          "label": "Fast Data"
        }
      },
      {
        "id": "container-logs-k8s",
        "label": "Container Logs",
        "url": "https://grafana.mia-platform.eu/explore?orgId=131&left=%7B%22datasource%22:%226RF5EkK4z%22,%22queries%22:%5B%7B%22refId%22:%22A%22,%22expr%22:%22%7Bnamespace%3D%5C%22%namespace%%5C%22%7D%20%7C%3D%20%60%60%22,%22queryType%22:%22range%22,%22datasource%22:%7B%22type%22:%22loki%22,%22uid%22:%226RF5EkK4z%22%7D,%22editorMode%22:%22builder%22%7D%5D,%22range%22:%7B%22from%22:%22now-7d%22,%22to%22:%22now%22%7D%7D&theme=light&kiosk=tv",
        "type": "iframe",
        "category": {
          "label": "Logs"
        }
      }
    ],
    "enabledServices": {
      "cms-site": false,
      "cms-backend": false,
      "v1-adapter": false,
      "auth0-client": false,
      "oauth-login-site": false,
      "crud-service": false,
      "swagger-aggregator": false,
      "api-portal": false,
      "microservice-gateway": false,
      "authorization-service": false,
      "api-gateway": false
    },
    "staticSecret": {}
  },
  {
    "_id": "665d8937cec9736057ac3f6c",
    "templateId": "1b423a05-e862-47a0-ad91-8f6dbcac5860",
    "tenantId": "b933f1ef-5b8e-4adf-a346-24a3b03d13e8",
    "name": "Mia-Platform Azure Template Experiments",
    "description": "Template for Azure",
    "archiveUrl": "https://dev.azure.com/mia-platform-devops/Projects%20Templates/_apis/git/repositories/Mia-Platform%20Basic%20Project%20Template/items?path=/&versionDescriptor%5BversionOptions%5D=0&versionDescriptor%5BversionType%5D=0&versionDescriptor%5Bversion%5D=master&resolveLfs=true&%24format=zip&api-version=5.0&download=true",
    "deploy": {
      "runnerTool": "mlp",
      "useMiaPrefixEnvs": false,
      "projectStructure": "kustomize",
      "strategy": "push"
    },
    "dashboards": [
      {
        "id": "fdecb702-a6a8-4646-8d34-d420530b4999",
        "label": "Responses Details",
        "url": "https://grafana.mia-platform.eu/d/dfNsc-jnz/api-gateway-apis?orgId=131&var-cluster=miademo&var-namespace=%namespace%&var-loki=Loki&var-prometheus=Prometheus&from=now-1d&theme=light&kiosk=tv",
        "type": "iframe",
        "category": {
          "label": "API"
        }
      },
      {
        "id": "resource-util-per-pod",
        "label": "Pods Resources",
        "url": "https://grafana.mia-platform.eu/d/6581e46e4e5c7ba40a07646395ef7b23/kubernetes-compute-resources-pod?orgId=131&refresh=15s&var-datasource=default&var-cluster=miademo&var-namespace=%namespace%&theme=light&kiosk=tv",
        "type": "iframe",
        "category": {
          "label": "Resources"
        }
      },
      {
        "id": "resource-util-per-ns",
        "label": "Runtime Summary",
        "url": "https://grafana.mia-platform.eu/d/a87fb0d919ec0ea5f6543124e16c42a5/kubernetes-compute-resources-namespace-workloads?orgId=131&refresh=15s&var-datasource=default&var-cluster=miademo&var-namespace=%namespace%&theme=light&kiosk=tv",
        "type": "iframe",
        "category": {
          "label": "Resources"
        }
      },
      {
        "id": "kafka-consumer-group",
        "label": "Projections",
        "url": "https://grafana.mia-platform.eu/d/3397b707-4324-48f5-bf48-05949e3fecb0/kafka-messages-dashboard?var-cluster=miademo&var-namespace=%namespace%&var-consumer_group=demo.development.warehouse&var-consumergroup_subscribed_topics=All&var-topic=demo.development.pr-articles-json&orgId=131&theme=light&&kiosk=tv",
        "type": "iframe",
        "category": {
          "label": "Fast Data"
        }
      },
      {
        "id": "fast-data-svc-creator",
        "label": "Single Views",
        "url": "https://grafana.mia-platform.eu/d/9a041f86-6f82-44c0-8416-80e377985015/fast-data-single-views?orgId=131&refresh=10s&var-datasource=Prometheus&var-cluster=miademo&var-namespace=%namespace%&var-portfolioOrigin=articles&var-svType=All&var-svcDeployment=All&theme=light&kiosk=tv",
        "type": "iframe",
        "category": {
          "label": "Fast Data"
        }
      },
      {
        "id": "container-logs-k8s",
        "label": "Container Logs",
        "url": "https://grafana.mia-platform.eu/explore?orgId=131&left=%7B%22datasource%22:%226RF5EkK4z%22,%22queries%22:%5B%7B%22refId%22:%22A%22,%22expr%22:%22%7Bnamespace%3D%5C%22%namespace%%5C%22%7D%20%7C%3D%20%60%60%22,%22queryType%22:%22range%22,%22datasource%22:%7B%22type%22:%22loki%22,%22uid%22:%226RF5EkK4z%22%7D,%22editorMode%22:%22builder%22%7D%5D,%22range%22:%7B%22from%22:%22now-7d%22,%22to%22:%22now%22%7D%7D&theme=light&kiosk=tv",
        "type": "iframe",
        "category": {
          "label": "Logs"
        }
      }
    ],
    "enabledServices": {
      "cms-site": false,
      "cms-backend": false,
      "v1-adapter": false,
      "auth0-client": false,
      "oauth-login-site": false,
      "crud-service": false,
      "swagger-aggregator": false,
      "api-portal": false,
      "microservice-gateway": false,
      "authorization-service": false,
      "api-gateway": false
    },
    "staticSecret": {}
  },
  {
    "_id": "665d898bcec9736057ac3f6d",
    "templateId": "b3f09625-9389-4c81-84ce-0159b24ee264",
    "tenantId": "b933f1ef-5b8e-4adf-a346-24a3b03d13e8",
    "name": "Mia-Platform Enhanced Workflow Basic Template Experiments",
    "description": "A basic template to get started with the enhanced workflow",
    "archiveUrl": "https://git.tools.mia-platform.eu/api/v4/projects/139891/repository/archive.tar.gz",
    "deploy": {
      "runnerTool": "mlp",
      "projectStructure": "kustomize",
      "strategy": "push"
    },
    "dashboards": [
      {
        "id": "fdecb702-a6a8-4646-8d34-d420530b4999",
        "label": "Responses Details",
        "url": "https://grafana.mia-platform.eu/d/dfNsc-jnz/api-gateway-apis?orgId=131&var-cluster=miademo&var-namespace=%namespace%&var-loki=Loki&var-prometheus=Prometheus&from=now-1d&theme=light&kiosk=tv",
        "type": "iframe",
        "category": {
          "label": "API"
        }
      },
      {
        "id": "resource-util-per-pod",
        "label": "Pods Resources",
        "url": "https://grafana.mia-platform.eu/d/6581e46e4e5c7ba40a07646395ef7b23/kubernetes-compute-resources-pod?orgId=131&refresh=15s&var-datasource=default&var-cluster=miademo&var-namespace=%namespace%&theme=light&kiosk=tv",
        "type": "iframe",
        "category": {
          "label": "Resources"
        }
      },
      {
        "id": "resource-util-per-ns",
        "label": "Runtime Summary",
        "url": "https://grafana.mia-platform.eu/d/a87fb0d919ec0ea5f6543124e16c42a5/kubernetes-compute-resources-namespace-workloads?orgId=131&refresh=15s&var-datasource=default&var-cluster=miademo&var-namespace=%namespace%&theme=light&kiosk=tv",
        "type": "iframe",
        "category": {
          "label": "Resources"
        }
      },
      {
        "id": "kafka-consumer-group",
        "label": "Projections",
        "url": "https://grafana.mia-platform.eu/d/3397b707-4324-48f5-bf48-05949e3fecb0/kafka-messages-dashboard?var-cluster=miademo&var-namespace=%namespace%&var-consumer_group=demo.development.warehouse&var-consumergroup_subscribed_topics=All&var-topic=demo.development.pr-articles-json&orgId=131&theme=light&&kiosk=tv",
        "type": "iframe",
        "category": {
          "label": "Fast Data"
        }
      },
      {
        "id": "fast-data-svc-creator",
        "label": "Single Views",
        "url": "https://grafana.mia-platform.eu/d/9a041f86-6f82-44c0-8416-80e377985015/fast-data-single-views?orgId=131&refresh=10s&var-datasource=Prometheus&var-cluster=miademo&var-namespace=%namespace%&var-portfolioOrigin=articles&var-svType=All&var-svcDeployment=All&theme=light&kiosk=tv",
        "type": "iframe",
        "category": {
          "label": "Fast Data"
        }
      },
      {
        "id": "container-logs-k8s",
        "label": "Container Logs",
        "url": "https://grafana.mia-platform.eu/explore?orgId=131&left=%7B%22datasource%22:%226RF5EkK4z%22,%22queries%22:%5B%7B%22refId%22:%22A%22,%22expr%22:%22%7Bnamespace%3D%5C%22%namespace%%5C%22%7D%20%7C%3D%20%60%60%22,%22queryType%22:%22range%22,%22datasource%22:%7B%22type%22:%22loki%22,%22uid%22:%226RF5EkK4z%22%7D,%22editorMode%22:%22builder%22%7D%5D,%22range%22:%7B%22from%22:%22now-7d%22,%22to%22:%22now%22%7D%7D&theme=light&kiosk=tv",
        "type": "iframe",
        "category": {
          "label": "Logs"
        }
      }
    ],
    "enabledServices": {
      "cms-site": false,
      "cms-backend": false,
      "v1-adapter": false,
      "auth0-client": false,
      "oauth-login-site": false,
      "crud-service": false,
      "swagger-aggregator": false,
      "api-portal": false,
      "microservice-gateway": false,
      "authorization-service": false,
      "api-gateway": false
    },
    "staticSecret": {}
  }
]
```

curl 'https://demo.console.gcp.mia-platform.eu/api/backend/projects/' \
  -H 'sec-ch-ua-platform: "macOS"' \
  -H 'Referer: https://demo.console.gcp.mia-platform.eu/tenants/b933f1ef-5b8e-4adf-a346-24a3b03d13e8/projects/create' \

  --data-raw '{"name":"Test Project Giulio2222","description":"This is the project description","flavor":"application","tenantId":"b933f1ef-5b8e-4adf-a346-24a3b03d13e8","environments":[{"envId":"DEV","label":"Development","hosts":[{"host":"test-project-giulio-test.mia-demo-re5gu6.gcp.mia-platform.eu","isBackoffice":false,"scheme":"https"}],"isProduction":false,"cluster":{"hostname":"mia-demo-h3hrdo6i.hcp.northeurope.azmk8s.io","namespace":"test-project-giulio-dev","clusterId":"67111f327c27d260a21c1c52","_id":"67111f327c27d260a21c1c52","base64CA":"LS0tLS1CRUdJTiBDRVJUSUZJQ0FURS0tLS0tCk1JSUU2RENDQXRDZ0F3SUJBZ0lRRDNjRnQzNUlIaCtDejl2UzFUcUoxVEFOQmdrcWhraUc5dzBCQVFzRkFEQU4KTVFzd0NRWURWUVFERXdKallUQWdGdzB5TkRBNU1EUXhNekV4TURGYUdBOHlNRFUwTURrd05ERXpNakV3TVZvdwpEVEVMTUFrR0ExVUVBeE1DWTJFd2dnSWlNQTBHQ1NxR1NJYjNEUUVCQVFVQUE0SUNEd0F3Z2dJS0FvSUNBUURpCjJZVFBVODZLY0NWcUFOSEdsV3YwZ2VsVnF4RDJoMlVsaEgvQS9uWGVXd0VjL2cwbjhhaTRwK3dYOFI5UHhHOGIKMkpEVDJjME5EYVBsU2s0d3dQTWNUUS9rMWNNTDVHc3F3dW11UE5tYnJyZnhyYktHa21BRGFlS3lXaGR6Z0xxNQpjMTlzUzhyQ0xiSm0zT2ZWK2hUOURpR0NPSjUzbVRIb3NzVjRFb1hIS05NaFJzYW1BbEtuUGlEdE5XWmRBT3UrCnBhcnE4dUNJV05hOWR0ZTRRKzRFbzhycVBPUzZGQ2NSTEFwaUZjSlFTbVVhWFZxcW8zaXhscG0xUk8rMTVvdXUKRmxQemdNbk5kNVA2bjhFZ2NjdjBUbVdrZUszZzJMcldkN0M2cDBnSWluT0JTOG9RZXBBcFluWk5JVEJlRm1qeQpWMHVMb3pzRGh4M1AvdVhZNlp1MG80Rno3eVJ5bWtsT2QyaUU5c1FwWWoxSHducHhzbGtISUxhSjRzVm1PYXg0CkUycWJXTGxnVk1ZWHZJK2VOUGE2NStGVU9BTGgyR1JyKzBnNC8xTit3RW15d1AwS1p1bEFGM2lkTEhnbDhESGMKemVVMnh5NWpjelMvYlVrUVNETkZwSXJpY3B5d21DU0tpWTlPbmpuV0ZYZTFLd0xRRmRnT2QyYklZYVAxc2drRAp2blI5d3FPY0xMMTR5RDNnY1RteCtDS3lnRmFhQXpQdEV5S3dnK0ZFSFU5bG1NdHRac0ltbXVpek9hTWp2YUN5ClN2aGRScXhXY3ZCT1JRWGZhbjVvMWJvbkc3VGY3RnVtM0NBZFNHY3ZvVHVLeW9BaTdQZVcyMGl0M1ZNaUpOYWsKYlZCVVBxNElCYnVLRkZ6V1hiQU5JdXlGT0pWUTMxaHVSNFA5N1U1alZRSURBUUFCbzBJd1FEQU9CZ05WSFE4QgpBZjhFQkFNQ0FxUXdEd1lEVlIwVEFRSC9CQVV3QXdFQi96QWRCZ05WSFE0RUZnUVVDR2txZU5uNkFBVDNBSE91CnFoMUxSa0ZnNnFrd0RRWUpLb1pJaHZjTkFRRUxCUUFEZ2dJQkFCMzBWZnR5MXU0ajllRnVweUpxZzU4aHJETXEKaVdDS2R0UWFkM1NXTTRhR2s0L3hUajRxNlBSOWN1akUxUjRJZlFWMDBUNFVQcGNVa3MxeG9HeDQrUHBORFduLwpWWU9NblNzRXIzNjZOb283VzYxSm5NUThaak9kWVRTdFdVUFgrenBqYVZ6ZU9kYkl4Uk1GTzJORTVFNVJnR3hLCmdLNkMvMm53Zkt6bHh2TkRmNTREdENrOUZ6bldwcnkwQ2lvYnRlNktOKzFUZlZFdVBqTzltOE1wOVhqNXdEd3AKUURBWTVsbDc1MndoUVpLaitha0xhZE03a3JBMmR2ZzFBRVpHS1FPaG1zcUFTV2xZa0o3VHJzV2I1cGJpTU8zUgp5Nk1NZFdqMHFkUzBHQ1g3Z2kzZEk5RXVVWkl3NFhkWEJ6VTFodkN2ck80d2IxTnd2djRpRkFQSGlRSFJqQnBaCkxTWlFXbk9MYnA2OVlhYmV0b05rKzdDbWQ2T2pSSDdUNnY3UERWN0gwYjZTS2l2RW92N2dVdk01ZDhudlEvc1UKdW1IWUcvM3haUS85K2dQR3lBaURiUXZpRmNHUUlsanRNcjVGb3RMOTdKcEVPUXhIaXRlN2I4eUE2ZzBNNmtWMgpKaG42ZEpJVjJzbVFmSkxJNjM0a1hJRGFRaks2c1cvbVp2ejlvTWZZai9CQVE1MWk1WWk5a2kyWFdxemFNanlhCkJNRWMxUEp3RU9nKzRwUERoUG90N2lGdlE0YWU5bkRHaW9LU3BNYzJ4K1FkajZRMk9DOWQvSmU5RHZrWHIzeTQKazhWRXlHc05aQm5lQ2dLY2hoZkszZGpHRHhxK2c0T2xpN3dFVCs0aVFod3NhcXlCTjlUSFJYbzkycU4rSHNNSAorckxuVm9obkhHam1paHFDCi0tLS0tRU5EIENFUlRJRklDQVRFLS0tLS0=","kubeContextVariables":{"KUBE_URL":"KUBE_AZURE_NOPROD_URL","KUBE_TOKEN":"KUBE_AZURE_NOPROD_TOKEN","KUBE_CA_PEM":"KUBE_AZURE_NOPROD_CA_PEM"}}},{"envId":"PROD","label":"Production","hosts":[{"host":"test-project-giulio.mia-demo-re5gu6.gcp.mia-platform.eu","isBackoffice":false,"scheme":"https"}],"isProduction":true,"cluster":{"hostname":"mia-demo-h3hrdo6i.hcp.northeurope.azmk8s.io","namespace":"test-project-giulio-prod","clusterId":"67111f327c27d260a21c1c52","_id":"67111f327c27d260a21c1c52","base64CA":"LS0tLS1CRUdJTiBDRVJUSUZJQ0FURS0tLS0tCk1JSUU2RENDQXRDZ0F3SUJBZ0lRRDNjRnQzNUlIaCtDejl2UzFUcUoxVEFOQmdrcWhraUc5dzBCQVFzRkFEQU4KTVFzd0NRWURWUVFERXdKallUQWdGdzB5TkRBNU1EUXhNekV4TURGYUdBOHlNRFUwTURrd05ERXpNakV3TVZvdwpEVEVMTUFrR0ExVUVBeE1DWTJFd2dnSWlNQTBHQ1NxR1NJYjNEUUVCQVFVQUE0SUNEd0F3Z2dJS0FvSUNBUURpCjJZVFBVODZLY0NWcUFOSEdsV3YwZ2VsVnF4RDJoMlVsaEgvQS9uWGVXd0VjL2cwbjhhaTRwK3dYOFI5UHhHOGIKMkpEVDJjME5EYVBsU2s0d3dQTWNUUS9rMWNNTDVHc3F3dW11UE5tYnJyZnhyYktHa21BRGFlS3lXaGR6Z0xxNQpjMTlzUzhyQ0xiSm0zT2ZWK2hUOURpR0NPSjUzbVRIb3NzVjRFb1hIS05NaFJzYW1BbEtuUGlEdE5XWmRBT3UrCnBhcnE4dUNJV05hOWR0ZTRRKzRFbzhycVBPUzZGQ2NSTEFwaUZjSlFTbVVhWFZxcW8zaXhscG0xUk8rMTVvdXUKRmxQemdNbk5kNVA2bjhFZ2NjdjBUbVdrZUszZzJMcldkN0M2cDBnSWluT0JTOG9RZXBBcFluWk5JVEJlRm1qeQpWMHVMb3pzRGh4M1AvdVhZNlp1MG80Rno3eVJ5bWtsT2QyaUU5c1FwWWoxSHducHhzbGtISUxhSjRzVm1PYXg0CkUycWJXTGxnVk1ZWHZJK2VOUGE2NStGVU9BTGgyR1JyKzBnNC8xTit3RW15d1AwS1p1bEFGM2lkTEhnbDhESGMKemVVMnh5NWpjelMvYlVrUVNETkZwSXJpY3B5d21DU0tpWTlPbmpuV0ZYZTFLd0xRRmRnT2QyYklZYVAxc2drRAp2blI5d3FPY0xMMTR5RDNnY1RteCtDS3lnRmFhQXpQdEV5S3dnK0ZFSFU5bG1NdHRac0ltbXVpek9hTWp2YUN5ClN2aGRScXhXY3ZCT1JRWGZhbjVvMWJvbkc3VGY3RnVtM0NBZFNHY3ZvVHVLeW9BaTdQZVcyMGl0M1ZNaUpOYWsKYlZCVVBxNElCYnVLRkZ6V1hiQU5JdXlGT0pWUTMxaHVSNFA5N1U1alZRSURBUUFCbzBJd1FEQU9CZ05WSFE4QgpBZjhFQkFNQ0FxUXdEd1lEVlIwVEFRSC9CQVV3QXdFQi96QWRCZ05WSFE0RUZnUVVDR2txZU5uNkFBVDNBSE91CnFoMUxSa0ZnNnFrd0RRWUpLb1pJaHZjTkFRRUxCUUFEZ2dJQkFCMzBWZnR5MXU0ajllRnVweUpxZzU4aHJETXEKaVdDS2R0UWFkM1NXTTRhR2s0L3hUajRxNlBSOWN1akUxUjRJZlFWMDBUNFVQcGNVa3MxeG9HeDQrUHBORFduLwpWWU9NblNzRXIzNjZOb283VzYxSm5NUThaak9kWVRTdFdVUFgrenBqYVZ6ZU9kYkl4Uk1GTzJORTVFNVJnR3hLCmdLNkMvMm53Zkt6bHh2TkRmNTREdENrOUZ6bldwcnkwQ2lvYnRlNktOKzFUZlZFdVBqTzltOE1wOVhqNXdEd3AKUURBWTVsbDc1MndoUVpLaitha0xhZE03a3JBMmR2ZzFBRVpHS1FPaG1zcUFTV2xZa0o3VHJzV2I1cGJpTU8zUgp5Nk1NZFdqMHFkUzBHQ1g3Z2kzZEk5RXVVWkl3NFhkWEJ6VTFodkN2ck80d2IxTnd2djRpRkFQSGlRSFJqQnBaCkxTWlFXbk9MYnA2OVlhYmV0b05rKzdDbWQ2T2pSSDdUNnY3UERWN0gwYjZTS2l2RW92N2dVdk01ZDhudlEvc1UKdW1IWUcvM3haUS85K2dQR3lBaURiUXZpRmNHUUlsanRNcjVGb3RMOTdKcEVPUXhIaXRlN2I4eUE2ZzBNNmtWMgpKaG42ZEpJVjJzbVFmSkxJNjM0a1hJRGFRaks2c1cvbVp2ejlvTWZZai9CQVE1MWk1WWk5a2kyWFdxemFNanlhCkJNRWMxUEp3RU9nKzRwUERoUG90N2lGdlE0YWU5bkRHaW9LU3BNYzJ4K1FkajZRMk9DOWQvSmU5RHZrWHIzeTQKazhWRXlHc05aQm5lQ2dLY2hoZkszZGpHRHhxK2c0T2xpN3dFVCs0aVFod3NhcXlCTjlUSFJYbzkycU4rSHNNSAorckxuVm9obkhHam1paHFDCi0tLS0tRU5EIENFUlRJRklDQVRFLS0tLS0=","kubeContextVariables":{"KUBE_URL":"KUBE_AZURE_NOPROD_URL","KUBE_TOKEN":"KUBE_AZURE_NOPROD_TOKEN","KUBE_CA_PEM":"KUBE_AZURE_NOPROD_CA_PEM"}}}],"enabledServices":{"cms-site":false,"cms-backend":false,"v1-adapter":false,"auth0-client":false,"oauth-login-site":false,"crud-service":false,"swagger-aggregator":false,"api-portal":false,"microservice-gateway":false,"authorization-service":false,"api-gateway":false},"configurationGitPath":"clients/mia-platform/demo/demo-companies/digital-platform-c/test-project-giulio/configurations","projectId":"test-project-giulio","templateId":"b3f09625-9389-4c81-84ce-0159b24ee264","visibility":"internal","providerId":"digital-platform-c-gitlab","pipelines":{"type":"gitlab-ci","providerId":"digital-platform-c-gitlab"},"enableConfGenerationOnDeploy":true}'

  ```json
  {
  "_id": "680cacfc25e7a18172e9c11d",
  "name": "Test Project Giulio",
  "configurationGitPath": "clients/mia-platform/demo/demo-companies/digital-platform-c/test-project-giulio/configurations",
  "projectId": "test-project-giulio",
  "environments": [
    {
      "envId": "DEV",
      "label": "Development",
      "envPrefix": "DEV",
      "hosts": [
        {
          "host": "test-project-giulio-test.mia-demo-re5gu6.gcp.mia-platform.eu",
          "isBackoffice": false,
          "scheme": "https"
        }
      ],
      "isProduction": false,
      "cluster": {
        "hostname": "mia-demo-h3hrdo6i.hcp.northeurope.azmk8s.io",
        "namespace": "test-project-giulio-dev",
        "clusterId": "mia-azure-demo",
        "_id": "67111f327c27d260a21c1c52",
        "base64CA": "LS0tLS1CRUdJTiBDRVJUSUZJQ0FURS0tLS0tCk1JSUU2RENDQXRDZ0F3SUJBZ0lRRDNjRnQzNUlIaCtDejl2UzFUcUoxVEFOQmdrcWhraUc5dzBCQVFzRkFEQU4KTVFzd0NRWURWUVFERXdKallUQWdGdzB5TkRBNU1EUXhNekV4TURGYUdBOHlNRFUwTURrd05ERXpNakV3TVZvdwpEVEVMTUFrR0ExVUVBeE1DWTJFd2dnSWlNQTBHQ1NxR1NJYjNEUUVCQVFVQUE0SUNEd0F3Z2dJS0FvSUNBUURpCjJZVFBVODZLY0NWcUFOSEdsV3YwZ2VsVnF4RDJoMlVsaEgvQS9uWGVXd0VjL2cwbjhhaTRwK3dYOFI5UHhHOGIKMkpEVDJjME5EYVBsU2s0d3dQTWNUUS9rMWNNTDVHc3F3dW11UE5tYnJyZnhyYktHa21BRGFlS3lXaGR6Z0xxNQpjMTlzUzhyQ0xiSm0zT2ZWK2hUOURpR0NPSjUzbVRIb3NzVjRFb1hIS05NaFJzYW1BbEtuUGlEdE5XWmRBT3UrCnBhcnE4dUNJV05hOWR0ZTRRKzRFbzhycVBPUzZGQ2NSTEFwaUZjSlFTbVVhWFZxcW8zaXhscG0xUk8rMTVvdXUKRmxQemdNbk5kNVA2bjhFZ2NjdjBUbVdrZUszZzJMcldkN0M2cDBnSWluT0JTOG9RZXBBcFluWk5JVEJlRm1qeQpWMHVMb3pzRGh4M1AvdVhZNlp1MG80Rno3eVJ5bWtsT2QyaUU5c1FwWWoxSHducHhzbGtISUxhSjRzVm1PYXg0CkUycWJXTGxnVk1ZWHZJK2VOUGE2NStGVU9BTGgyR1JyKzBnNC8xTit3RW15d1AwS1p1bEFGM2lkTEhnbDhESGMKemVVMnh5NWpjelMvYlVrUVNETkZwSXJpY3B5d21DU0tpWTlPbmpuV0ZYZTFLd0xRRmRnT2QyYklZYVAxc2drRAp2blI5d3FPY0xMMTR5RDNnY1RteCtDS3lnRmFhQXpQdEV5S3dnK0ZFSFU5bG1NdHRac0ltbXVpek9hTWp2YUN5ClN2aGRScXhXY3ZCT1JRWGZhbjVvMWJvbkc3VGY3RnVtM0NBZFNHY3ZvVHVLeW9BaTdQZVcyMGl0M1ZNaUpOYWsKYlZCVVBxNElCYnVLRkZ6V1hiQU5JdXlGT0pWUTMxaHVSNFA5N1U1alZRSURBUUFCbzBJd1FEQU9CZ05WSFE4QgpBZjhFQkFNQ0FxUXdEd1lEVlIwVEFRSC9CQVV3QXdFQi96QWRCZ05WSFE0RUZnUVVDR2txZU5uNkFBVDNBSE91CnFoMUxSa0ZnNnFrd0RRWUpLb1pJaHZjTkFRRUxCUUFEZ2dJQkFCMzBWZnR5MXU0ajllRnVweUpxZzU4aHJETXEKaVdDS2R0UWFkM1NXTTRhR2s0L3hUajRxNlBSOWN1akUxUjRJZlFWMDBUNFVQcGNVa3MxeG9HeDQrUHBORFduLwpWWU9NblNzRXIzNjZOb283VzYxSm5NUThaak9kWVRTdFdVUFgrenBqYVZ6ZU9kYkl4Uk1GTzJORTVFNVJnR3hLCmdLNkMvMm53Zkt6bHh2TkRmNTREdENrOUZ6bldwcnkwQ2lvYnRlNktOKzFUZlZFdVBqTzltOE1wOVhqNXdEd3AKUURBWTVsbDc1MndoUVpLaitha0xhZE03a3JBMmR2ZzFBRVpHS1FPaG1zcUFTV2xZa0o3VHJzV2I1cGJpTU8zUgp5Nk1NZFdqMHFkUzBHQ1g3Z2kzZEk5RXVVWkl3NFhkWEJ6VTFodkN2ck80d2IxTnd2djRpRkFQSGlRSFJqQnBaCkxTWlFXbk9MYnA2OVlhYmV0b05rKzdDbWQ2T2pSSDdUNnY3UERWN0gwYjZTS2l2RW92N2dVdk01ZDhudlEvc1UKdW1IWUcvM3haUS85K2dQR3lBaURiUXZpRmNHUUlsanRNcjVGb3RMOTdKcEVPUXhIaXRlN2I4eUE2ZzBNNmtWMgpKaG42ZEpJVjJzbVFmSkxJNjM0a1hJRGFRaks2c1cvbVp2ejlvTWZZai9CQVE1MWk1WWk5a2kyWFdxemFNanlhCkJNRWMxUEp3RU9nKzRwUERoUG90N2lGdlE0YWU5bkRHaW9LU3BNYzJ4K1FkajZRMk9DOWQvSmU5RHZrWHIzeTQKazhWRXlHc05aQm5lQ2dLY2hoZkszZGpHRHhxK2c0T2xpN3dFVCs0aVFod3NhcXlCTjlUSFJYbzkycU4rSHNNSAorckxuVm9obkhHam1paHFDCi0tLS0tRU5EIENFUlRJRklDQVRFLS0tLS0="
      },
      "dashboards": [
        {
          "id": "fdecb702-a6a8-4646-8d34-d420530b4999",
          "label": "Responses Details",
          "url": "https://grafana.mia-platform.eu/d/dfNsc-jnz/api-gateway-apis?orgId=131&var-cluster=miademo&var-namespace=test-project-giulio-dev&var-loki=Loki&var-prometheus=Prometheus&from=now-1d&theme=light&kiosk=tv",
          "type": "iframe",
          "category": {
            "label": "API"
          }
        },
        {
          "id": "resource-util-per-pod",
          "label": "Pods Resources",
          "url": "https://grafana.mia-platform.eu/d/6581e46e4e5c7ba40a07646395ef7b23/kubernetes-compute-resources-pod?orgId=131&refresh=15s&var-datasource=default&var-cluster=miademo&var-namespace=test-project-giulio-dev&theme=light&kiosk=tv",
          "type": "iframe",
          "category": {
            "label": "Resources"
          }
        },
        {
          "id": "resource-util-per-ns",
          "label": "Runtime Summary",
          "url": "https://grafana.mia-platform.eu/d/a87fb0d919ec0ea5f6543124e16c42a5/kubernetes-compute-resources-namespace-workloads?orgId=131&refresh=15s&var-datasource=default&var-cluster=miademo&var-namespace=test-project-giulio-dev&theme=light&kiosk=tv",
          "type": "iframe",
          "category": {
            "label": "Resources"
          }
        },
        {
          "id": "kafka-consumer-group",
          "label": "Projections",
          "url": "https://grafana.mia-platform.eu/d/3397b707-4324-48f5-bf48-05949e3fecb0/kafka-messages-dashboard?var-cluster=miademo&var-namespace=test-project-giulio-dev&var-consumer_group=demo.development.warehouse&var-consumergroup_subscribed_topics=All&var-topic=demo.development.pr-articles-json&orgId=131&theme=light&&kiosk=tv",
          "type": "iframe",
          "category": {
            "label": "Fast Data"
          }
        },
        {
          "id": "fast-data-svc-creator",
          "label": "Single Views",
          "url": "https://grafana.mia-platform.eu/d/9a041f86-6f82-44c0-8416-80e377985015/fast-data-single-views?orgId=131&refresh=10s&var-datasource=Prometheus&var-cluster=miademo&var-namespace=test-project-giulio-dev&var-portfolioOrigin=articles&var-svType=All&var-svcDeployment=All&theme=light&kiosk=tv",
          "type": "iframe",
          "category": {
            "label": "Fast Data"
          }
        },
        {
          "id": "container-logs-k8s",
          "label": "Container Logs",
          "url": "https://grafana.mia-platform.eu/explore?orgId=131&left=%7B%22datasource%22:%226RF5EkK4z%22,%22queries%22:%5B%7B%22refId%22:%22A%22,%22expr%22:%22%7Bnamespace%3D%5C%22test-project-giulio-dev%5C%22%7D%20%7C%3D%20%60%60%22,%22queryType%22:%22range%22,%22datasource%22:%7B%22type%22:%22loki%22,%22uid%22:%226RF5EkK4z%22%7D,%22editorMode%22:%22builder%22%7D%5D,%22range%22:%7B%22from%22:%22now-7d%22,%22to%22:%22now%22%7D%7D&theme=light&kiosk=tv",
          "type": "iframe",
          "category": {
            "label": "Logs"
          }
        }
      ]
    },
    {
      "envId": "PROD",
      "label": "Production",
      "envPrefix": "PROD",
      "hosts": [
        {
          "host": "test-project-giulio.mia-demo-re5gu6.gcp.mia-platform.eu",
          "isBackoffice": false,
          "scheme": "https"
        }
      ],
      "isProduction": true,
      "cluster": {
        "hostname": "mia-demo-h3hrdo6i.hcp.northeurope.azmk8s.io",
        "namespace": "test-project-giulio-prod",
        "clusterId": "mia-azure-demo",
        "_id": "67111f327c27d260a21c1c52",
        "base64CA": "LS0tLS1CRUdJTiBDRVJUSUZJQ0FURS0tLS0tCk1JSUU2RENDQXRDZ0F3SUJBZ0lRRDNjRnQzNUlIaCtDejl2UzFUcUoxVEFOQmdrcWhraUc5dzBCQVFzRkFEQU4KTVFzd0NRWURWUVFERXdKallUQWdGdzB5TkRBNU1EUXhNekV4TURGYUdBOHlNRFUwTURrd05ERXpNakV3TVZvdwpEVEVMTUFrR0ExVUVBeE1DWTJFd2dnSWlNQTBHQ1NxR1NJYjNEUUVCQVFVQUE0SUNEd0F3Z2dJS0FvSUNBUURpCjJZVFBVODZLY0NWcUFOSEdsV3YwZ2VsVnF4RDJoMlVsaEgvQS9uWGVXd0VjL2cwbjhhaTRwK3dYOFI5UHhHOGIKMkpEVDJjME5EYVBsU2s0d3dQTWNUUS9rMWNNTDVHc3F3dW11UE5tYnJyZnhyYktHa21BRGFlS3lXaGR6Z0xxNQpjMTlzUzhyQ0xiSm0zT2ZWK2hUOURpR0NPSjUzbVRIb3NzVjRFb1hIS05NaFJzYW1BbEtuUGlEdE5XWmRBT3UrCnBhcnE4dUNJV05hOWR0ZTRRKzRFbzhycVBPUzZGQ2NSTEFwaUZjSlFTbVVhWFZxcW8zaXhscG0xUk8rMTVvdXUKRmxQemdNbk5kNVA2bjhFZ2NjdjBUbVdrZUszZzJMcldkN0M2cDBnSWluT0JTOG9RZXBBcFluWk5JVEJlRm1qeQpWMHVMb3pzRGh4M1AvdVhZNlp1MG80Rno3eVJ5bWtsT2QyaUU5c1FwWWoxSHducHhzbGtISUxhSjRzVm1PYXg0CkUycWJXTGxnVk1ZWHZJK2VOUGE2NStGVU9BTGgyR1JyKzBnNC8xTit3RW15d1AwS1p1bEFGM2lkTEhnbDhESGMKemVVMnh5NWpjelMvYlVrUVNETkZwSXJpY3B5d21DU0tpWTlPbmpuV0ZYZTFLd0xRRmRnT2QyYklZYVAxc2drRAp2blI5d3FPY0xMMTR5RDNnY1RteCtDS3lnRmFhQXpQdEV5S3dnK0ZFSFU5bG1NdHRac0ltbXVpek9hTWp2YUN5ClN2aGRScXhXY3ZCT1JRWGZhbjVvMWJvbkc3VGY3RnVtM0NBZFNHY3ZvVHVLeW9BaTdQZVcyMGl0M1ZNaUpOYWsKYlZCVVBxNElCYnVLRkZ6V1hiQU5JdXlGT0pWUTMxaHVSNFA5N1U1alZRSURBUUFCbzBJd1FEQU9CZ05WSFE4QgpBZjhFQkFNQ0FxUXdEd1lEVlIwVEFRSC9CQVV3QXdFQi96QWRCZ05WSFE0RUZnUVVDR2txZU5uNkFBVDNBSE91CnFoMUxSa0ZnNnFrd0RRWUpLb1pJaHZjTkFRRUxCUUFEZ2dJQkFCMzBWZnR5MXU0ajllRnVweUpxZzU4aHJETXEKaVdDS2R0UWFkM1NXTTRhR2s0L3hUajRxNlBSOWN1akUxUjRJZlFWMDBUNFVQcGNVa3MxeG9HeDQrUHBORFduLwpWWU9NblNzRXIzNjZOb283VzYxSm5NUThaak9kWVRTdFdVUFgrenBqYVZ6ZU9kYkl4Uk1GTzJORTVFNVJnR3hLCmdLNkMvMm53Zkt6bHh2TkRmNTREdENrOUZ6bldwcnkwQ2lvYnRlNktOKzFUZlZFdVBqTzltOE1wOVhqNXdEd3AKUURBWTVsbDc1MndoUVpLaitha0xhZE03a3JBMmR2ZzFBRVpHS1FPaG1zcUFTV2xZa0o3VHJzV2I1cGJpTU8zUgp5Nk1NZFdqMHFkUzBHQ1g3Z2kzZEk5RXVVWkl3NFhkWEJ6VTFodkN2ck80d2IxTnd2djRpRkFQSGlRSFJqQnBaCkxTWlFXbk9MYnA2OVlhYmV0b05rKzdDbWQ2T2pSSDdUNnY3UERWN0gwYjZTS2l2RW92N2dVdk01ZDhudlEvc1UKdW1IWUcvM3haUS85K2dQR3lBaURiUXZpRmNHUUlsanRNcjVGb3RMOTdKcEVPUXhIaXRlN2I4eUE2ZzBNNmtWMgpKaG42ZEpJVjJzbVFmSkxJNjM0a1hJRGFRaks2c1cvbVp2ejlvTWZZai9CQVE1MWk1WWk5a2kyWFdxemFNanlhCkJNRWMxUEp3RU9nKzRwUERoUG90N2lGdlE0YWU5bkRHaW9LU3BNYzJ4K1FkajZRMk9DOWQvSmU5RHZrWHIzeTQKazhWRXlHc05aQm5lQ2dLY2hoZkszZGpHRHhxK2c0T2xpN3dFVCs0aVFod3NhcXlCTjlUSFJYbzkycU4rSHNNSAorckxuVm9obkhHam1paHFDCi0tLS0tRU5EIENFUlRJRklDQVRFLS0tLS0="
      },
      "dashboards": [
        {
          "id": "fdecb702-a6a8-4646-8d34-d420530b4999",
          "label": "Responses Details",
          "url": "https://grafana.mia-platform.eu/d/dfNsc-jnz/api-gateway-apis?orgId=131&var-cluster=miademo&var-namespace=test-project-giulio-prod&var-loki=Loki&var-prometheus=Prometheus&from=now-1d&theme=light&kiosk=tv",
          "type": "iframe",
          "category": {
            "label": "API"
          }
        },
        {
          "id": "resource-util-per-pod",
          "label": "Pods Resources",
          "url": "https://grafana.mia-platform.eu/d/6581e46e4e5c7ba40a07646395ef7b23/kubernetes-compute-resources-pod?orgId=131&refresh=15s&var-datasource=default&var-cluster=miademo&var-namespace=test-project-giulio-prod&theme=light&kiosk=tv",
          "type": "iframe",
          "category": {
            "label": "Resources"
          }
        },
        {
          "id": "resource-util-per-ns",
          "label": "Runtime Summary",
          "url": "https://grafana.mia-platform.eu/d/a87fb0d919ec0ea5f6543124e16c42a5/kubernetes-compute-resources-namespace-workloads?orgId=131&refresh=15s&var-datasource=default&var-cluster=miademo&var-namespace=test-project-giulio-prod&theme=light&kiosk=tv",
          "type": "iframe",
          "category": {
            "label": "Resources"
          }
        },
        {
          "id": "kafka-consumer-group",
          "label": "Projections",
          "url": "https://grafana.mia-platform.eu/d/3397b707-4324-48f5-bf48-05949e3fecb0/kafka-messages-dashboard?var-cluster=miademo&var-namespace=test-project-giulio-prod&var-consumer_group=demo.development.warehouse&var-consumergroup_subscribed_topics=All&var-topic=demo.development.pr-articles-json&orgId=131&theme=light&&kiosk=tv",
          "type": "iframe",
          "category": {
            "label": "Fast Data"
          }
        },
        {
          "id": "fast-data-svc-creator",
          "label": "Single Views",
          "url": "https://grafana.mia-platform.eu/d/9a041f86-6f82-44c0-8416-80e377985015/fast-data-single-views?orgId=131&refresh=10s&var-datasource=Prometheus&var-cluster=miademo&var-namespace=test-project-giulio-prod&var-portfolioOrigin=articles&var-svType=All&var-svcDeployment=All&theme=light&kiosk=tv",
          "type": "iframe",
          "category": {
            "label": "Fast Data"
          }
        },
        {
          "id": "container-logs-k8s",
          "label": "Container Logs",
          "url": "https://grafana.mia-platform.eu/explore?orgId=131&left=%7B%22datasource%22:%226RF5EkK4z%22,%22queries%22:%5B%7B%22refId%22:%22A%22,%22expr%22:%22%7Bnamespace%3D%5C%22test-project-giulio-prod%5C%22%7D%20%7C%3D%20%60%60%22,%22queryType%22:%22range%22,%22datasource%22:%7B%22type%22:%22loki%22,%22uid%22:%226RF5EkK4z%22%7D,%22editorMode%22:%22builder%22%7D%5D,%22range%22:%7B%22from%22:%22now-7d%22,%22to%22:%22now%22%7D%7D&theme=light&kiosk=tv",
          "type": "iframe",
          "category": {
            "label": "Logs"
          }
        }
      ]
    }
  ],
  "repository": {
    "providerId": "digital-platform-c-gitlab"
  },
  "description": "This is the project description",
  "flavor": "application",
  "repositoryUrl": "https://git.tools.mia-platform.eu/clients/mia-platform/demo/demo-companies/digital-platform-c/test-project-giulio/configurations",
  "defaultBranch": "main",
  "branches": [
    "master"
  ],
  "tags": [],
  "environmentsVariables": {
    "type": "gitlab",
    "providerId": "digital-platform-c-gitlab",
    "baseUrl": "https://git.tools.mia-platform.eu",
    "storage": {
      "type": "groups",
      "path": "clients/mia-platform/demo/demo-companies/digital-platform-c/test-project-giulio"
    }
  },
  "availableNamespaces": [],
  "enabledServices": {
    "cms-site": false,
    "cms-backend": false,
    "v1-adapter": false,
    "auth0-client": false,
    "oauth-login-site": false,
    "crud-service": false,
    "swagger-aggregator": false,
    "api-portal": false,
    "microservice-gateway": false,
    "authorization-service": false,
    "api-gateway": false
  },
  "dockerImageNameSuggestion": {
    "type": "PROJECT_ID"
  },
  "pipelines": {
    "providerId": "digital-platform-c-gitlab",
    "type": "gitlab-ci"
  },
  "tenantId": "b933f1ef-5b8e-4adf-a346-24a3b03d13e8",
  "info": {
    "projectOwner": "Giulio Roggero",
    "teamContact": "giulio.roggero@mia-platform.eu"
  },
  "deploy": {
    "runnerTool": "mlp",
    "strategy": "push"
  },
  "enabledSecurityFeatures": {
    "seccompProfile": true,
    "appArmor": true,
    "hostProperties": true,
    "privilegedPod": true
  },
  "containerRegistries": [
    {
      "id": "349a921b-21e6-4349-878b-5b5b5a820781",
      "name": "orca-ghcr",
      "hostname": "orca-ghcr.com",
      "imagePullSecretName": "orca-ghcr",
      "isDefault": false
    },
    {
      "id": "60273517-df65-4faf-bb8c-f998adfd67e2",
      "name": "orca-google-registry",
      "hostname": "orca-google-registry.com",
      "imagePullSecretName": "orca-google-registry",
      "isDefault": false
    },
    {
      "id": "1636736a-2907-4d2c-8f5e-738e27e19a03",
      "name": "ghcr.io",
      "hostname": "ghcr.io",
      "isDefault": false
    },
    {
      "id": "cd6ae8c5-feb0-4e5c-beec-39cf8290d3d7",
      "name": "mia-platform-nexus",
      "hostname": "nexus.mia-platform.eu",
      "isDefault": true
    }
  ],
  "originalTemplate": {
    "id": "b3f09625-9389-4c81-84ce-0159b24ee264",
    "name": "Mia-Platform Enhanced Workflow Basic Template Experiments"
  },
  "isRepositoryCreated": true,
  "areNamespacesCreated": [
    {
      "namespace": "test-project-giulio-dev",
      "envId": "DEV",
      "labels": {
        "mia-platform.eu/company": "b933f1ef-5b8e-4adf-a346-24a3b03d13e8",
        "mia-platform.eu/environment": "DEV",
        "mia-platform.eu/project": "test-project-giulio",
        "kubernetes.io/metadata.name": "test-project-giulio-dev",
        "app.kubernetes.io/managed-by": "mia-platform"
      }
    },
    {
      "namespace": "test-project-giulio-prod",
      "envId": "PROD",
      "labels": {
        "mia-platform.eu/company": "b933f1ef-5b8e-4adf-a346-24a3b03d13e8",
        "mia-platform.eu/environment": "PROD",
        "mia-platform.eu/project": "test-project-giulio",
        "kubernetes.io/metadata.name": "test-project-giulio-prod",
        "app.kubernetes.io/managed-by": "mia-platform"
      }
    }
  ]
}
```

----------------------------
## Create a Microservice

curl 'https://demo.console.gcp.mia-platform.eu/api/backend/projects/680cacfc25e7a18172e9c11d/service' \
  --data-raw '{"serviceName":"nodejs-16-helloworld-microservice-example","serviceDescription":"Example of a simple Node.js 16 application. \nIt contains example of tests too.","imageName":"test-project-giulio/nodejs-16-helloworld-microservice-example","repoName":"nodejs-16-helloworld-microservice-example","groupName":"clients/mia-platform/demo/demo-companies/digital-platform-c/test-project-giulio/services","templateId":"67a4ed58d38aa6c26d28026e","pipeline":"gitlab-ci","defaultConfigMaps":[],"resourceName":"nodejs-16-helloworld-microservice-example","containerRegistryId":"cd6ae8c5-feb0-4e5c-beec-39cf8290d3d7"}'

  ```json
  {
  "serviceName": "nodejs-16-helloworld-microservice-example",
  "dockerImage": "nexus.mia-platform.eu/test-project-giulio/nodejs-16-helloworld-microservice-example",
  "containerRegistryId": "cd6ae8c5-feb0-4e5c-beec-39cf8290d3d7",
  "repoId": 144261,
  "webUrl": "https://git.tools.mia-platform.eu/clients/mia-platform/demo/demo-companies/digital-platform-c/test-project-giulio/services/nodejs-16-helloworld-microservice-example",
  "sshUrl": "git@git.tools.mia-platform.eu:clients/mia-platform/demo/demo-companies/digital-platform-c/test-project-giulio/services/nodejs-16-helloworld-microservice-example.git",
  "resourceName": "nodejs-16-helloworld-microservice-example",
  "containerPorts": [
    {
      "from": 80,
      "name": "http",
      "protocol": "TCP",
      "to": 3000
    }
  ],
  "defaultConfigMaps": []
}
  ```


  curl 'https://demo.console.gcp.mia-platform.eu/api/backend/marketplace/tenants/mia-platform/resources/node-js-helloworld-microservice-example/versions/1.0.0' 

  ```json
  {
  "_id": "67a4ed58d38aa6c26d28026e",
  "itemId": "node-js-helloworld-microservice-example",
  "name": "Node.js 16 HelloWorld Microservice Example",
  "tenantId": "mia-platform",
  "type": "example",
  "version": {
    "name": "1.0.0",
    "releaseNote": "-"
  },
  "category": {
    "id": "nodejs",
    "label": "Start From Code - Node.js"
  },
  "comingSoon": false,
  "componentsIds": [],
  "description": "Example of a simple Node.js 16 application. \nIt contains example of tests too.",
  "documentation": {
    "type": "markdown",
    "url": "https://raw.githubusercontent.com/mia-platform-marketplace/Node.js-Hello-World-Microservice-Example/refs/heads/16.x/README.md"
  },
  "imageUrl": "/v2/files/download/907b67c1-1ee2-418a-bc49-a3b5a2132546.png",
  "isLatest": true,
  "releaseDate": "2025-02-20T16:47:48.039Z",
  "releaseStage": "stable",
  "repositoryUrl": "https://github.com/mia-platform-marketplace/Node.js-Hello-World-Microservice-Example/tree/16.x",
  "resources": {
    "services": {
      "nodejs-16-helloworld-microservice-example": {
        "type": "example",
        "name": "nodejs-16-helloworld-microservice-example",
        "description": "Example of a simple Node.js 16 application. \nIt contains example of tests too.",
        "archiveUrl": "https://github.com/mia-platform-marketplace/Node.js-Hello-World-Microservice-Example/archive/refs/heads/16.x.tar.gz",
        "pipelines": {
          "gitlab-ci": {
            "path": "/projects/platform%2Fpipelines-templates/repository/files/console-pipeline%2Fnode-hello-world.gitlab-ci.yml/raw"
          },
          "webhook": {
            "url": "https://example.com",
            "token": "test-token"
          }
        },
        "containerPorts": [
          {
            "name": "http",
            "from": 80,
            "to": 3000,
            "protocol": "TCP"
          }
        ]
      }
    }
  },
  "supportedBy": "Mia-Platform",
  "supportedByImageUrl": "/v2/files/download/ba717d35-36a7-4794-9405-8ff69adec98d.png",
  "visibility": {
    "allTenants": false,
    "public": true
  }
}
```

curl 'https://demo.console.gcp.mia-platform.eu/api/projects/680cacfc25e7a18172e9c11d/environments/DEV/configuration' \
  --data-raw $'{"title":"change: serviceAccounts: nodejs-16-helloworld-microservic...","deletedElements":{},"fastDataConfig":{"systems":{},"castFunctions":{"defaultIdentity":{"castFunctionId":"defaultIdentity","name":"defaultIdentity","dataType":"all","casting":"module.exports = function castIdentity (value, fieldName, logger) {\\n  return value\\n}","type":"default"},"defaultCastToString":{"castFunctionId":"defaultCastToString","name":"defaultCastToString","dataType":"string","casting":"module.exports = function castToString (value, fieldName, logger) {\\n  if (value === null) {return null}\\n  if (value === undefined) {return undefined}\\n  if (typeof value === \'object\') {return JSON.stringify(value)}\\n  return String(value)\\n}\\n","type":"default"},"defaultCastToInteger":{"castFunctionId":"defaultCastToInteger","name":"defaultCastToInteger","dataType":"number","casting":"module.exports = function castToInt (value, fieldName, logger) {\\n  if (value === null) {return null}\\n  if (value === undefined) {return undefined}\\n  const number = Number(value)\\n  if (Number.isNaN(number)) {\\n    logger.debug({fieldName}, \'is invalid, will be casted to undefined\')\\n    return undefined\\n  }\\n  return parseInt(number, 10)\\n}\\n","type":"default"},"defaultCastToFloat":{"castFunctionId":"defaultCastToFloat","name":"defaultCastToFloat","dataType":"number","casting":"module.exports = function castToFloat (value, fieldName, logger) {\\n  if (value === null) {return null}\\n  if (value === undefined) {return undefined}\\n  const number = Number(value)\\n  if (Number.isNaN(number)) {\\n    logger.debug({fieldName}, \'is invalid, will be casted to undefined\')\\n    return undefined\\n  }\\n  return number\\n}\\n","type":"default"},"defaultCastUnitTimestampToISOString":{"castFunctionId":"defaultCastUnitTimestampToISOString","name":"defaultCastUnitTimestampToISOString","dataType":"string","casting":"module.exports = function castUnitTimestampToISOString (value, fieldName, logger) {\\n  if (value === null) {return null}\\n  if (value === undefined) {return undefined}\\n  const date = new Date(value)\\n  if (date.toString() \u0021== \'Invalid Date\') {return date.toISOString()}\\n  logger.debug({fieldName}, \'is invalid, will be casted to undefined\')\\n  return undefined\\n}\\n","type":"default"},"defaultCastStringToBoolean":{"castFunctionId":"defaultCastStringToBoolean","name":"defaultCastStringToBoolean","dataType":"boolean","casting":"module.exports = function castStringToBoolean (value, fieldName, logger) {\\n  if (value === \'false\') {return false}\\n  if (value === \'true\') {return true}\\n  if (value === null) {return null}\\n  if (value === undefined) {return undefined}\\n  logger.debug({fieldName}, \'is invalid, will be casted to undefined\')\\n  return undefined\\n}\\n","type":"default"},"defaultCastToDate":{"castFunctionId":"defaultCastToDate","name":"defaultCastToDate","dataType":"Date","casting":"module.exports = function castToDate (value, fieldName, logger) {\\n  if (value === null) {return null}\\n  const date = new Date(value)\\n  if (date.toString() \u0021== \'Invalid Date\') {\\n    return date\\n  }\\n  logger.debug({fieldName}, \'is invalid, will be casted to undefined\')\\n  return undefined\\n}","type":"default"},"defaultCastToObject":{"castFunctionId":"defaultCastToObject","name":"defaultCastToObject","dataType":"RawObject","casting":"module.exports = function castToObject (value, fieldName, logger) {\\n  if (value === null) {return null}\\n  let valueToCast = value\\n  try {\\n    if(typeof valueToCast === \'string\') {valueToCast = JSON.parse(valueToCast)}\\n  } catch(e) {\\n    logger.debug({fieldName}, \'is invalid, will be casted to undefined\')\\n    return undefined\\n  }\\n  if (typeof valueToCast \u0021== \'object\' || valueToCast.constructor \u0021== Object) {\\n    logger.debug({fieldName}, \'is invalid, will be casted to undefined\')\\n    return undefined\\n  }\\n  return valueToCast\\n}","type":"default"},"defaultCastToArrayOfObject":{"castFunctionId":"defaultCastToArrayOfObject","name":"defaultCastToArrayOfObject","dataType":"Array_RawObject","casting":"module.exports = function castToArrayOfObject (value, fieldName, logger) {\\n  if (value === null) { return null }\\n  let valueToCast = value\\n  try {\\n    if(typeof valueToCast === \'string\') {valueToCast = JSON.parse(valueToCast)}\\n  } catch(e) {\\n    logger.debug({fieldName}, \'is invalid, will be casted to undefined\')\\n    return undefined\\n  }\\n  if (typeof valueToCast \u0021== \'object\' || valueToCast.constructor \u0021== Array ||\\n  valueToCast.some(element => typeof element \u0021== \'object\' || element.constructor \u0021== Object)) {\\n    logger.debug({fieldName}, \'is invalid, will be casted to undefined\')\\n    return undefined\\n  }\\n  return valueToCast\\n}","type":"default"}},"singleViews":{},"deletedElements":{},"version":"2.2.0","lastCommitId":"","updatedAt":"","erSchemas":{}},"microfrontendPluginsConfig":{},"extensionsConfig":{"files":{}},"config":{"applications":{},"collections":{},"endpoints":{},"groups":[],"secrets":[],"cmsCategories":{},"cmsSettings":{"accessGroupsExpression":"isBackoffice && groups.admin"},"cmsAnalytics":{},"cmsDashboard":[],"decorators":{},"serviceAccounts":{"nodejs-16-helloworld-microservice-example":{"name":"nodejs-16-helloworld-microservice-example"}},"services":{"nodejs-16-helloworld-microservice-example":{"name":"nodejs-16-helloworld-microservice-example","type":"custom","tags":["custom"],"advanced":false,"environment":[{"name":"LOG_LEVEL","value":"{{LOG_LEVEL}}","valueType":"plain"},{"name":"MICROSERVICE_GATEWAY_SERVICE_NAME","value":"microservice-gateway","valueType":"plain"},{"name":"TRUSTED_PROXIES","value":"10.0.0.0/8,172.16.0.0/12,192.168.0.0/16","valueType":"plain"},{"name":"HTTP_PORT","value":"3000","valueType":"plain"},{"name":"USERID_HEADER_KEY","value":"miauserid","valueType":"plain"},{"name":"GROUPS_HEADER_KEY","value":"miausergroups","valueType":"plain"},{"name":"CLIENTTYPE_HEADER_KEY","value":"client-type","valueType":"plain"},{"name":"BACKOFFICE_HEADER_KEY","value":"isbackoffice","valueType":"plain"},{"name":"USER_PROPERTIES_HEADER_KEY","value":"miauserproperties","valueType":"plain"}],"description":"Example of a simple Node.js 16 application. \\nIt contains example of tests too.","resources":{"memoryLimits":{"max":"150Mi","min":"150Mi"},"cpuLimits":{"max":"100m","min":"100m"}},"probes":{"liveness":{"port":"http","path":"/-/healthz","initialDelaySeconds":15,"periodSeconds":20,"timeoutSeconds":1,"failureThreshold":3},"readiness":{"port":"http","path":"/-/ready","initialDelaySeconds":5,"periodSeconds":10,"timeoutSeconds":1,"successThreshold":1,"failureThreshold":3}},"terminationGracePeriodSeconds":30,"logParser":"mia-json","dockerImage":"nexus.mia-platform.eu/test-project-giulio/nodejs-16-helloworld-microservice-example","repoUrl":"https://git.tools.mia-platform.eu/clients/mia-platform/demo/demo-companies/digital-platform-c/test-project-giulio/services/nodejs-16-helloworld-microservice-example","sshUrl":"git@git.tools.mia-platform.eu:clients/mia-platform/demo/demo-companies/digital-platform-c/test-project-giulio/services/nodejs-16-helloworld-microservice-example.git","createdAt":"2025-04-26T09:54:59.480Z","generatedFrom":{"_id":"67a4ed58d38aa6c26d28026e"},"replicas":1,"annotations":[{"name":"mia-platform.eu/version","value":"This will contain the platform version","description":"Version of Mia-Platform used by the project","readOnly":true},{"name":"fluentbit.io/parser","value":"This will depend on your log parser","description":"Pino parser annotation for Fluent Bit","readOnly":true}],"labels":[{"name":"app","value":"nodejs-16-helloworld-microservice-example","description":"Name of the microservice, in the service selector","readOnly":true},{"name":"app.kubernetes.io/name","value":"nodejs-16-helloworld-microservice-example","description":"Name of the microservice","readOnly":true},{"name":"app.kubernetes.io/version","value":"This will depend on your Docker Image tag","description":"Tag of the Docker image","readOnly":true},{"name":"app.kubernetes.io/component","value":"custom","description":"Microservice kind, for the Console","readOnly":true},{"name":"app.kubernetes.io/part-of","value":"test-project-giulio","description":"Project that own the microservice","readOnly":true},{"name":"app.kubernetes.io/managed-by","value":"mia-platform","description":"Identify who manage the service","readOnly":true},{"name":"mia-platform.eu/stage","value":"{{STAGE_TO_DEPLOY}}","description":"Environment used for the deploy","readOnly":true},{"name":"mia-platform.eu/tenant","value":"b933f1ef-5b8e-4adf-a346-24a3b03d13e8","description":"Tenant owner of the project","readOnly":true},{"name":"mia-platform.eu/log-type","value":"This will depend on your log parser","description":"Format of logs for the microservice","readOnly":true}],"serviceAccountName":"nodejs-16-helloworld-microservice-example","swaggerPath":"/documentation/json","containerPorts":[{"from":80,"name":"http","protocol":"TCP","to":3000}],"sourceMarketplaceItem":{"itemId":"node-js-helloworld-microservice-example","version":"1.0.0","tenantId":"mia-platform"},"containerRegistryId":"cd6ae8c5-feb0-4e5c-beec-39cf8290d3d7"}},"configMaps":{},"serviceSecrets":{},"apiVersions":[],"unsecretedVariables":[],"listeners":{},"version":"0.61.0"}}'


  ```json
  {"id":"3974b476-01b2-4f46-94c3-c392c0fe4ffe","upgraded":false}
  ```

### Get Configuration in Console Design Area

#### Curl
 curl 'https://demo.console.gcp.mia-platform.eu/api/backend/projects/680de44e25e7a18172e9c192/revisions/main/configuration' \
 
#### JSON Response example for Design configuration
 ```json
 {
  "endpoints": {
    "/analytics": {
      "basePath": "/analytics",
      "type": "custom",
      "public": true,
      "showInDocumentation": true,
      "secreted": false,
      "acl": "true",
      "service": "analytics-transactions",
      "port": "80",
      "pathRewrite": "/",
      "description": "Endpoint /analytics",
      "tags": [
        "analytics"
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
    },
    "/adaptive-checkout": {
      "basePath": "/adaptive-checkout",
      "routes": {
        "GET/": {
          "id": "GET/",
          "path": "/",
          "public": {
            "inherited": true
          },
          "showInDocumentation": {
            "inherited": true
          },
          "secreted": {
            "inherited": true
          },
          "acl": {
            "inherited": true
          },
          "backofficeAcl": {
            "inherited": true
          },
          "verb": "GET",
          "allowUnknownRequestContentType": {
            "inherited": true
          },
          "allowUnknownResponseContentType": {
            "inherited": true
          },
          "preDecorators": [],
          "postDecorators": [],
          "rateLimit": {
            "inherited": true
          }
        },
        "POST/": {
          "id": "POST/",
          "path": "/",
          "public": {
            "inherited": true
          },
          "showInDocumentation": {
            "inherited": true
          },
          "secreted": {
            "inherited": true
          },
          "acl": {
            "inherited": true
          },
          "backofficeAcl": {
            "inherited": true
          },
          "verb": "POST",
          "allowUnknownRequestContentType": {
            "inherited": true
          },
          "allowUnknownResponseContentType": {
            "inherited": true
          },
          "preDecorators": [],
          "postDecorators": [],
          "rateLimit": {
            "inherited": true
          }
        },
        "GET/export": {
          "id": "GET/export",
          "path": "/export",
          "public": {
            "inherited": true
          },
          "showInDocumentation": {
            "inherited": true
          },
          "secreted": {
            "inherited": true
          },
          "acl": {
            "inherited": true
          },
          "backofficeAcl": {
            "inherited": true
          },
          "verb": "GET",
          "allowUnknownRequestContentType": {
            "inherited": true
          },
          "allowUnknownResponseContentType": {
            "inherited": false,
            "value": true
          },
          "preDecorators": [],
          "postDecorators": [],
          "rateLimit": {
            "inherited": true
          }
        },
        "GET/:id": {
          "id": "GET/:id",
          "path": "/:id",
          "public": {
            "inherited": true
          },
          "showInDocumentation": {
            "inherited": true
          },
          "secreted": {
            "inherited": true
          },
          "acl": {
            "inherited": true
          },
          "backofficeAcl": {
            "inherited": true
          },
          "verb": "GET",
          "allowUnknownRequestContentType": {
            "inherited": true
          },
          "allowUnknownResponseContentType": {
            "inherited": true
          },
          "preDecorators": [],
          "postDecorators": [],
          "rateLimit": {
            "inherited": true
          }
        },
        "DELETE/:id": {
          "id": "DELETE/:id",
          "path": "/:id",
          "public": {
            "inherited": true
          },
          "showInDocumentation": {
            "inherited": true
          },
          "secreted": {
            "inherited": true
          },
          "acl": {
            "inherited": true
          },
          "backofficeAcl": {
            "inherited": true
          },
          "verb": "DELETE",
          "allowUnknownRequestContentType": {
            "inherited": true
          },
          "allowUnknownResponseContentType": {
            "inherited": true
          },
          "preDecorators": [],
          "postDecorators": [],
          "rateLimit": {
            "inherited": true
          }
        },
        "DELETE/": {
          "id": "DELETE/",
          "path": "/",
          "public": {
            "inherited": true
          },
          "showInDocumentation": {
            "inherited": true
          },
          "secreted": {
            "inherited": true
          },
          "acl": {
            "inherited": true
          },
          "backofficeAcl": {
            "inherited": true
          },
          "verb": "DELETE",
          "allowUnknownRequestContentType": {
            "inherited": true
          },
          "allowUnknownResponseContentType": {
            "inherited": true
          },
          "preDecorators": [],
          "postDecorators": [],
          "rateLimit": {
            "inherited": true
          }
        },
        "PATCH/:id": {
          "id": "PATCH/:id",
          "path": "/:id",
          "public": {
            "inherited": true
          },
          "showInDocumentation": {
            "inherited": true
          },
          "secreted": {
            "inherited": true
          },
          "acl": {
            "inherited": true
          },
          "backofficeAcl": {
            "inherited": true
          },
          "verb": "PATCH",
          "allowUnknownRequestContentType": {
            "inherited": true
          },
          "allowUnknownResponseContentType": {
            "inherited": true
          },
          "preDecorators": [],
          "postDecorators": [],
          "rateLimit": {
            "inherited": true
          }
        },
        "PATCH/": {
          "id": "PATCH/",
          "path": "/",
          "public": {
            "inherited": true
          },
          "showInDocumentation": {
            "inherited": true
          },
          "secreted": {
            "inherited": true
          },
          "acl": {
            "inherited": true
          },
          "backofficeAcl": {
            "inherited": true
          },
          "verb": "PATCH",
          "allowUnknownRequestContentType": {
            "inherited": true
          },
          "allowUnknownResponseContentType": {
            "inherited": true
          },
          "preDecorators": [],
          "postDecorators": [],
          "rateLimit": {
            "inherited": true
          }
        },
        "GET/count": {
          "id": "GET/count",
          "path": "/count",
          "public": {
            "inherited": true
          },
          "showInDocumentation": {
            "inherited": true
          },
          "secreted": {
            "inherited": true
          },
          "acl": {
            "inherited": true
          },
          "backofficeAcl": {
            "inherited": true
          },
          "verb": "GET",
          "allowUnknownRequestContentType": {
            "inherited": true
          },
          "allowUnknownResponseContentType": {
            "inherited": true
          },
          "preDecorators": [],
          "postDecorators": [],
          "rateLimit": {
            "inherited": true
          }
        },
        "POST/bulk": {
          "id": "POST/bulk",
          "path": "/bulk",
          "public": {
            "inherited": true
          },
          "showInDocumentation": {
            "inherited": true
          },
          "secreted": {
            "inherited": true
          },
          "acl": {
            "inherited": true
          },
          "backofficeAcl": {
            "inherited": true
          },
          "verb": "POST",
          "allowUnknownRequestContentType": {
            "inherited": true
          },
          "allowUnknownResponseContentType": {
            "inherited": true
          },
          "preDecorators": [],
          "postDecorators": [],
          "rateLimit": {
            "inherited": true
          }
        },
        "POST/upsert-one": {
          "id": "POST/upsert-one",
          "path": "/upsert-one",
          "public": {
            "inherited": true
          },
          "showInDocumentation": {
            "inherited": true
          },
          "secreted": {
            "inherited": true
          },
          "acl": {
            "inherited": true
          },
          "backofficeAcl": {
            "inherited": true
          },
          "verb": "POST",
          "allowUnknownRequestContentType": {
            "inherited": true
          },
          "allowUnknownResponseContentType": {
            "inherited": true
          },
          "preDecorators": [],
          "postDecorators": [],
          "rateLimit": {
            "inherited": true
          }
        },
        "PATCH/bulk": {
          "id": "PATCH/bulk",
          "path": "/bulk",
          "public": {
            "inherited": true
          },
          "showInDocumentation": {
            "inherited": true
          },
          "secreted": {
            "inherited": true
          },
          "acl": {
            "inherited": true
          },
          "backofficeAcl": {
            "inherited": true
          },
          "verb": "PATCH",
          "allowUnknownRequestContentType": {
            "inherited": true
          },
          "allowUnknownResponseContentType": {
            "inherited": true
          },
          "preDecorators": [],
          "postDecorators": [],
          "rateLimit": {
            "inherited": true
          }
        },
        "POST/:id/state": {
          "id": "POST/:id/state",
          "path": "/:id/state",
          "public": {
            "inherited": true
          },
          "showInDocumentation": {
            "inherited": true
          },
          "secreted": {
            "inherited": true
          },
          "acl": {
            "inherited": true
          },
          "backofficeAcl": {
            "inherited": true
          },
          "verb": "POST",
          "allowUnknownRequestContentType": {
            "inherited": true
          },
          "allowUnknownResponseContentType": {
            "inherited": true
          },
          "preDecorators": [],
          "postDecorators": [],
          "rateLimit": {
            "inherited": true
          }
        },
        "POST/state": {
          "id": "POST/state",
          "path": "/state",
          "public": {
            "inherited": true
          },
          "showInDocumentation": {
            "inherited": true
          },
          "secreted": {
            "inherited": true
          },
          "acl": {
            "inherited": true
          },
          "backofficeAcl": {
            "inherited": true
          },
          "verb": "POST",
          "allowUnknownRequestContentType": {
            "inherited": true
          },
          "allowUnknownResponseContentType": {
            "inherited": true
          },
          "preDecorators": [],
          "postDecorators": [],
          "rateLimit": {
            "inherited": true
          }
        }
      },
      "type": "crud",
      "public": true,
      "showInDocumentation": true,
      "secreted": false,
      "acl": "true",
      "pathName": "/",
      "collectionId": "rules",
      "pathRewrite": "/rules",
      "description": "Endpoint /adaptive-checkout",
      "tags": [
        "crud"
      ],
      "backofficeAcl": {
        "inherited": true
      },
      "allowUnknownRequestContentType": false,
      "allowUnknownResponseContentType": false,
      "forceMicroserviceGatewayProxy": false,
      "listeners": {
        "frontend": true
      }
    },
    "/api/charts/dashboards": {
      "basePath": "/api/charts/dashboards",
      "type": "custom",
      "public": true,
      "showInDocumentation": true,
      "secreted": false,
      "acl": "true",
      "service": "data-visualization-backend",
      "port": "80",
      "pathRewrite": "/",
      "description": "Endpoint /api/charts/dashboards",
      "tags": [
        "data-visualization-backend"
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
    },
    "/data-visualization": {
      "basePath": "/data-visualization",
      "type": "custom",
      "public": true,
      "showInDocumentation": true,
      "secreted": false,
      "acl": "true",
      "service": "data-visualization-frontend",
      "port": "80",
      "pathRewrite": "/",
      "description": "Endpoint /data-visualization",
      "tags": [
        "data-visualization-frontend"
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
    },
    "/export": {
      "basePath": "/export",
      "type": "custom",
      "public": true,
      "showInDocumentation": true,
      "secreted": true,
      "acl": "true",
      "service": "export-service",
      "port": "80",
      "pathRewrite": "/export",
      "description": "Endpoint /export",
      "tags": [
        "export-service"
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
    },
    "/fm": {
      "basePath": "/fm",
      "type": "custom",
      "public": true,
      "showInDocumentation": true,
      "secreted": true,
      "acl": "true",
      "service": "flow-manager-service",
      "port": "80",
      "pathRewrite": "/",
      "description": "Endpoint /fm",
      "tags": [
        "flow-manager-service"
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
    },
    "/demo": {
      "basePath": "/demo",
      "type": "custom",
      "public": true,
      "showInDocumentation": true,
      "secreted": false,
      "acl": "true",
      "service": "payment-front-end",
      "port": "80",
      "pathRewrite": "/",
      "description": "Endpoint /demo",
      "tags": [
        "payment-front-end"
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
    },
    "/callback-adyen": {
      "basePath": "/callback-adyen",
      "type": "custom",
      "public": true,
      "showInDocumentation": true,
      "secreted": false,
      "acl": "true",
      "service": "payment-gateway-manager",
      "port": "80",
      "pathRewrite": "/v3/adyen/callback",
      "description": "Endpoint /callback-adyen",
      "tags": [
        "payment-gateway-manager"
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
    },
    "/callback-axerve": {
      "basePath": "/callback-axerve",
      "type": "custom",
      "public": true,
      "showInDocumentation": true,
      "secreted": false,
      "acl": "true",
      "service": "payment-gateway-manager",
      "port": "80",
      "pathRewrite": "/v3/axerve/callback",
      "description": "Endpoint /callback-axerve",
      "tags": [
        "payment-gateway-manager"
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
    },
    "/callback-braintree": {
      "basePath": "/callback-braintree",
      "type": "custom",
      "public": true,
      "showInDocumentation": true,
      "secreted": false,
      "acl": "true",
      "service": "payment-gateway-manager",
      "port": "80",
      "pathRewrite": "/v3/braintree/callback",
      "description": "Endpoint /callback-braintree",
      "tags": [
        "payment-gateway-manager"
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
    },
    "/callback-flowpay": {
      "basePath": "/callback-flowpay",
      "type": "custom",
      "public": true,
      "showInDocumentation": true,
      "secreted": false,
      "acl": "true",
      "service": "payment-gateway-manager",
      "port": "80",
      "pathRewrite": "/v3/flowpay/callback",
      "description": "Endpoint /callback-flowpay",
      "tags": [
        "payment-gateway-manager"
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
    },
    "/callback-nexi": {
      "basePath": "/callback-nexi",
      "type": "custom",
      "public": true,
      "showInDocumentation": true,
      "secreted": false,
      "acl": "true",
      "service": "payment-gateway-manager",
      "port": "80",
      "pathRewrite": "/v3/nexi/callback",
      "description": "Endpoint /callback-nexi",
      "tags": [
        "payment-gateway-manager"
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
    },
    "/callback-satispay": {
      "basePath": "/callback-satispay",
      "type": "custom",
      "public": true,
      "showInDocumentation": true,
      "secreted": false,
      "acl": "true",
      "service": "payment-gateway-manager",
      "port": "80",
      "pathRewrite": "/v3/satispay/callback",
      "description": "Endpoint /callback-satispay",
      "tags": [
        "payment-gateway-manager"
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
    },
    "/callback-scalapay": {
      "basePath": "/callback-scalapay",
      "type": "custom",
      "public": true,
      "showInDocumentation": true,
      "secreted": false,
      "acl": "true",
      "service": "payment-gateway-manager",
      "port": "80",
      "pathRewrite": "/v3/scalapay/callback",
      "description": "Endpoint /callback-scalapay",
      "tags": [
        "payment-gateway-manager"
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
    },
    "/callback-soisy": {
      "basePath": "/callback-soisy",
      "type": "custom",
      "public": true,
      "showInDocumentation": true,
      "secreted": false,
      "acl": "true",
      "service": "payment-gateway-manager",
      "port": "80",
      "pathRewrite": "/v3/soisy/callback",
      "description": "Endpoint /callback-soisy",
      "tags": [
        "payment-gateway-manager"
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
    },
    "/callback-stripe": {
      "basePath": "/callback-stripe",
      "type": "custom",
      "public": true,
      "showInDocumentation": true,
      "secreted": false,
      "acl": "true",
      "service": "payment-gateway-manager",
      "port": "80",
      "pathRewrite": "/v3/stripe/callback",
      "description": "Endpoint /callback-stripe",
      "tags": [
        "payment-gateway-manager"
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
    },
    "/": {
      "basePath": "/",
      "type": "custom",
      "public": true,
      "showInDocumentation": true,
      "secreted": true,
      "acl": "true",
      "service": "pgm-bff",
      "port": "80",
      "pathRewrite": "/",
      "description": "Endpoint /",
      "tags": [
        "pgm-bff"
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
    },
    "/mfe-application": {
      "basePath": "/mfe-application",
      "type": "custom",
      "public": true,
      "showInDocumentation": false,
      "secreted": false,
      "acl": "true",
      "service": "micro-lc",
      "port": "80",
      "pathRewrite": "/public",
      "description": "Endpoint /mfe-application",
      "tags": [
        "microfrontend"
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
    },
    "/micro-lc-configurations": {
      "basePath": "/micro-lc-configurations",
      "type": "custom",
      "public": true,
      "showInDocumentation": false,
      "secreted": false,
      "acl": "true",
      "service": "micro-lc",
      "port": "80",
      "pathRewrite": "/configurations",
      "description": "Endpoint /micro-lc-configurations",
      "tags": [
        "backoffice"
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
    },
    "/libraries": {
      "basePath": "/libraries",
      "routes": {
        "GET/": {
          "id": "GET/",
          "path": "/",
          "public": {
            "inherited": true
          },
          "showInDocumentation": {
            "inherited": true
          },
          "secreted": {
            "inherited": true
          },
          "acl": {
            "inherited": true
          },
          "backofficeAcl": {
            "inherited": true
          },
          "verb": "GET",
          "allowUnknownRequestContentType": {
            "inherited": true
          },
          "allowUnknownResponseContentType": {
            "inherited": true
          },
          "preDecorators": [],
          "postDecorators": [],
          "rateLimit": {
            "inherited": true
          }
        },
        "GET/export": {
          "id": "GET/export",
          "path": "/export",
          "public": {
            "inherited": true
          },
          "showInDocumentation": {
            "inherited": true
          },
          "secreted": {
            "inherited": true
          },
          "acl": {
            "inherited": true
          },
          "backofficeAcl": {
            "inherited": true
          },
          "verb": "GET",
          "allowUnknownRequestContentType": {
            "inherited": true
          },
          "allowUnknownResponseContentType": {
            "inherited": false,
            "value": true
          },
          "preDecorators": [],
          "postDecorators": [],
          "rateLimit": {
            "inherited": true
          }
        },
        "GET/:id": {
          "id": "GET/:id",
          "path": "/:id",
          "public": {
            "inherited": true
          },
          "showInDocumentation": {
            "inherited": true
          },
          "secreted": {
            "inherited": true
          },
          "acl": {
            "inherited": true
          },
          "backofficeAcl": {
            "inherited": true
          },
          "verb": "GET",
          "allowUnknownRequestContentType": {
            "inherited": true
          },
          "allowUnknownResponseContentType": {
            "inherited": true
          },
          "preDecorators": [],
          "postDecorators": [],
          "rateLimit": {
            "inherited": true
          }
        },
        "GET/count": {
          "id": "GET/count",
          "path": "/count",
          "public": {
            "inherited": true
          },
          "showInDocumentation": {
            "inherited": true
          },
          "secreted": {
            "inherited": true
          },
          "acl": {
            "inherited": true
          },
          "backofficeAcl": {
            "inherited": true
          },
          "verb": "GET",
          "allowUnknownRequestContentType": {
            "inherited": true
          },
          "allowUnknownResponseContentType": {
            "inherited": true
          },
          "preDecorators": [],
          "postDecorators": [],
          "rateLimit": {
            "inherited": true
          }
        }
      },
      "type": "fast-data-single-view",
      "public": true,
      "showInDocumentation": true,
      "secreted": false,
      "acl": "true",
      "pathName": "/",
      "internalEndpoint": "/sv-libraries",
      "description": "Endpoint /libraries",
      "tags": [
        "fast-data-single-view"
      ],
      "backofficeAcl": {
        "inherited": true
      },
      "allowUnknownRequestContentType": false,
      "allowUnknownResponseContentType": false,
      "forceMicroserviceGatewayProxy": false,
      "listeners": {
        "frontend": true
      }
    }
  },
  "collections": {
    "fm_subscriptions": {
      "id": "fm_subscriptions",
      "name": "fm_subscriptions",
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
          "name": "sagaId",
          "type": "string",
          "required": true,
          "nullable": false,
          "description": ""
        },
        {
          "name": "metadata",
          "type": "RawObject",
          "required": true,
          "nullable": false,
          "sensitivityValue": 0,
          "encryptionEnabled": false,
          "encryptionSearchable": false,
          "schema": {
            "properties": {
              "additionalData": {
                "type": "object"
              },
              "amount": {
                "type": "number"
              },
              "currency": {
                "type": "string"
              },
              "expirationDate": {
                "type": "string"
              },
              "expireRequested": {
                "type": "boolean"
              },
              "interval": {
                "type": "string"
              },
              "intervalCount": {
                "type": "number"
              },
              "nextPaymentDate": {
                "nullable": true,
                "type": "string"
              },
              "paymentMethod": {
                "type": "string"
              },
              "provider": {
                "type": "string"
              },
              "providerData": {
                "type": "object"
              },
              "shopSubscriptionId": {
                "type": "string"
              },
              "transactions": {
                "items": {
                  "type": "string"
                },
                "type": "array"
              }
            }
          }
        },
        {
          "name": "isFinal",
          "type": "boolean",
          "required": true,
          "nullable": false,
          "description": ""
        },
        {
          "name": "currentState",
          "type": "string",
          "required": true,
          "nullable": false,
          "description": ""
        },
        {
          "name": "latestEvent",
          "type": "RawObject",
          "required": true,
          "nullable": false,
          "description": ""
        },
        {
          "name": "associatedEntityId",
          "type": "string",
          "required": true,
          "nullable": false,
          "description": ""
        },
        {
          "name": "events",
          "type": "Array_string",
          "required": false,
          "nullable": false,
          "description": ""
        },
        {
          "name": "history",
          "type": "RawObject",
          "required": false,
          "nullable": false,
          "description": ""
        },
        {
          "name": "businessStateId",
          "type": "string",
          "required": true,
          "nullable": false,
          "description": ""
        },
        {
          "name": "businessStateDescription",
          "type": "string",
          "required": false,
          "nullable": false,
          "description": ""
        }
      ],
      "internalEndpoints": [
        {
          "basePath": "/fm-subscriptions",
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
      "description": "Collection of fm_subscriptions",
      "tags": [
        "collection"
      ]
    },
    "fm_transactions": {
      "id": "fm_transactions",
      "name": "fm_transactions",
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
          "name": "sagaId",
          "type": "string",
          "required": true,
          "nullable": false,
          "description": ""
        },
        {
          "name": "metadata",
          "type": "RawObject",
          "required": true,
          "nullable": false,
          "sensitivityValue": 0,
          "encryptionEnabled": false,
          "encryptionSearchable": false,
          "schema": {
            "properties": {
              "additionalData": {
                "properties": {
                  "channel": {
                    "type": "string"
                  },
                  "items": {
                    "items": {
                      "properties": {
                        "amount": {
                          "type": "number"
                        },
                        "description": {
                          "type": "string"
                        },
                        "itemId": {
                          "type": "string"
                        },
                        "quantity": {
                          "type": "number"
                        }
                      },
                      "type": "object"
                    },
                    "type": "array"
                  }
                },
                "type": "object"
              },
              "amount": {
                "type": "number"
              },
              "buyer": {
                "type": "object"
              },
              "currency": {
                "type": "string"
              },
              "isRecurrent": {
                "type": "boolean"
              },
              "paymentID": {
                "type": "string"
              },
              "paymentMethod": {
                "type": "string"
              },
              "paymentToken": {
                "type": "string"
              },
              "payRequestData": {
                "type": "object"
              },
              "provider": {
                "type": "string"
              },
              "providerData": {
                "type": "object"
              },
              "recurrenceDetails": {
                "type": "object"
              },
              "refundDetails": {
                "type": "object"
              },
              "refundRequestData": {
                "type": "object"
              },
              "sessionToken": {
                "type": "string"
              },
              "shopTransactionID": {
                "type": "string"
              },
              "subscriptionId": {
                "type": "string"
              }
            }
          }
        },
        {
          "name": "isFinal",
          "type": "boolean",
          "required": true,
          "nullable": false,
          "description": ""
        },
        {
          "name": "currentState",
          "type": "string",
          "required": true,
          "nullable": false,
          "description": ""
        },
        {
          "name": "latestEvent",
          "type": "RawObject",
          "required": true,
          "nullable": false,
          "description": ""
        },
        {
          "name": "associatedEntityId",
          "type": "string",
          "required": true,
          "nullable": false,
          "description": ""
        },
        {
          "name": "events",
          "type": "Array_string",
          "required": false,
          "nullable": false,
          "description": ""
        },
        {
          "name": "history",
          "type": "RawObject",
          "required": false,
          "nullable": false,
          "description": ""
        },
        {
          "name": "businessStateId",
          "type": "string",
          "required": true,
          "nullable": false,
          "description": ""
        },
        {
          "name": "businessStateDescription",
          "type": "string",
          "required": false,
          "nullable": false,
          "description": ""
        }
      ],
      "internalEndpoints": [
        {
          "basePath": "/fm-transactions",
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
      "description": "Collection of fm_transactions",
      "tags": [
        "collection"
      ]
    },
    "invoices": {
      "id": "invoices",
      "name": "invoices",
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
          "required": true,
          "nullable": false,
          "sensitivityValue": 0,
          "encryptionEnabled": false,
          "encryptionSearchable": false
        },
        {
          "name": "file",
          "type": "string",
          "required": true,
          "nullable": false,
          "sensitivityValue": 0,
          "encryptionEnabled": false,
          "encryptionSearchable": false
        },
        {
          "name": "size",
          "type": "number",
          "required": true,
          "nullable": false,
          "sensitivityValue": 0,
          "encryptionEnabled": false,
          "encryptionSearchable": false
        },
        {
          "name": "location",
          "type": "string",
          "required": true,
          "nullable": false,
          "sensitivityValue": 0,
          "encryptionEnabled": false,
          "encryptionSearchable": false
        },
        {
          "name": "sagaId",
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
          "basePath": "/invoices",
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
      "description": "Collection of invoices",
      "tags": [
        "collection"
      ]
    },
    "notification_templates": {
      "id": "notification_templates",
      "name": "notification_templates",
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
        },
        {
          "name": "emailTitle",
          "type": "string",
          "required": false,
          "nullable": false,
          "sensitivityValue": 0,
          "encryptionEnabled": false,
          "encryptionSearchable": false
        },
        {
          "name": "emailMessage",
          "type": "string",
          "required": false,
          "nullable": false,
          "sensitivityValue": 0,
          "encryptionEnabled": false,
          "encryptionSearchable": false
        },
        {
          "name": "emailHtmlMessage",
          "type": "string",
          "required": false,
          "nullable": false,
          "sensitivityValue": 0,
          "encryptionEnabled": false,
          "encryptionSearchable": false
        },
        {
          "name": "smsMessage",
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
          "basePath": "/notification-templates",
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
      "description": "Collection of notification_templates",
      "tags": [
        "collection"
      ]
    },
    "rules": {
      "id": "rules",
      "name": "rules",
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
          "name": "priority",
          "type": "number",
          "required": true,
          "nullable": false,
          "sensitivityValue": 0,
          "encryptionEnabled": false,
          "encryptionSearchable": false
        },
        {
          "name": "ruleId",
          "type": "string",
          "required": true,
          "nullable": false,
          "sensitivityValue": 0,
          "encryptionEnabled": false,
          "encryptionSearchable": false
        },
        {
          "name": "type",
          "type": "string",
          "required": true,
          "nullable": false,
          "sensitivityValue": 0,
          "encryptionEnabled": false,
          "encryptionSearchable": false
        },
        {
          "name": "rules",
          "type": "Array_RawObject",
          "required": true,
          "nullable": false,
          "sensitivityValue": 0,
          "encryptionEnabled": false,
          "encryptionSearchable": false
        },
        {
          "name": "response",
          "type": "Array_RawObject",
          "required": true,
          "nullable": false,
          "sensitivityValue": 0,
          "encryptionEnabled": false,
          "encryptionSearchable": false
        }
      ],
      "internalEndpoints": [
        {
          "basePath": "/rules",
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
      "description": "Collection of rules",
      "tags": [
        "collection"
      ]
    },
    "users": {
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
          "name": "emailAddress",
          "type": "string",
          "required": false,
          "nullable": false,
          "sensitivityValue": 0,
          "encryptionEnabled": false,
          "encryptionSearchable": false
        },
        {
          "name": "phoneNumber",
          "type": "string",
          "required": false,
          "nullable": false,
          "sensitivityValue": 0,
          "encryptionEnabled": false,
          "encryptionSearchable": false
        },
        {
          "name": "clusters",
          "type": "Array_string",
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
    },
    "mongodbviewtest": {
      "id": "mongodbviewtest",
      "name": "mongodbviewtest",
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
        }
      ],
      "internalEndpoints": [
        {
          "basePath": "/mongodbviewtest",
          "defaultState": "PUBLIC"
        }
      ],
      "type": "view",
      "source": "invoices",
      "pipeline": [
        {
          "$match": {
            "__STATE__": "PUBLIC"
          }
        }
      ],
      "description": "View of invoices",
      "tags": [
        "mongo-view"
      ]
    },
    "rbac-bindings": {
      "id": "rbac-bindings",
      "name": "rbac-bindings",
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
          "name": "bindingId",
          "type": "string",
          "required": true,
          "nullable": false,
          "description": "binding unique identifier "
        },
        {
          "name": "groups",
          "type": "Array_string",
          "required": false,
          "nullable": false,
          "description": "list of user groups subject to this binding"
        },
        {
          "name": "subjects",
          "type": "Array_string",
          "required": false,
          "nullable": false,
          "description": "list of subjects of the binding"
        },
        {
          "name": "roles",
          "type": "Array_string",
          "required": false,
          "nullable": false,
          "description": "list of roles identifiers that subjects will inherit from the binding"
        },
        {
          "name": "permissions",
          "type": "Array_string",
          "required": false,
          "nullable": false,
          "description": "list of specific permissions that will be inherited by the subjects of the bindings"
        },
        {
          "name": "resource",
          "type": "RawObject",
          "required": false,
          "nullable": false,
          "description": "resource on which the role permissions are evaluated from the binding"
        }
      ],
      "internalEndpoints": [
        {
          "basePath": "/rbac-bindings",
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
          "name": "uniqueBindingId",
          "type": "normal",
          "unique": true,
          "fields": [
            {
              "name": "bindingId",
              "order": 1
            }
          ]
        }
      ],
      "description": "Collection rbac-bindings created by RBAC Manager plugin for bindings management",
      "tags": [
        "rbac-manager-plugin"
      ],
      "owners": [
        {
          "owner": "rbac-manager-plugin"
        }
      ]
    },
    "rbac-roles": {
      "id": "rbac-roles",
      "name": "rbac-roles",
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
          "name": "roleId",
          "type": "string",
          "required": true,
          "nullable": false,
          "description": "unique role identifier"
        },
        {
          "name": "name",
          "type": "string",
          "required": true,
          "nullable": false,
          "description": "human readable role name"
        },
        {
          "name": "description",
          "type": "string",
          "required": false,
          "nullable": false
        },
        {
          "name": "permissions",
          "type": "Array_string",
          "required": true,
          "nullable": false,
          "description": "list of permissions composing the role"
        }
      ],
      "internalEndpoints": [
        {
          "basePath": "/rbac-roles",
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
          "name": "uniqueRoleId",
          "type": "normal",
          "unique": true,
          "fields": [
            {
              "name": "roleId",
              "order": 1
            }
          ]
        }
      ],
      "description": "Collection rbac-roles created by RBAC Manager plugin for bindings management",
      "tags": [
        "rbac-manager-plugin"
      ],
      "owners": [
        {
          "owner": "rbac-manager-plugin"
        }
      ]
    },
    "projection-a": {
      "id": "projection-a",
      "name": "projection-a",
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
          "name": "title",
          "type": "string",
          "required": false,
          "nullable": false
        },
        {
          "name": "bookid",
          "type": "string",
          "required": false,
          "nullable": false
        }
      ],
      "internalEndpoints": [
        {
          "basePath": "/projection-a",
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
          "name": "mia_primary_key_index",
          "type": "normal",
          "unique": true,
          "fields": [
            {
              "name": "bookid",
              "order": 1
            }
          ]
        },
        {
          "name": "mia_internal_counter_index",
          "type": "normal",
          "unique": false,
          "fields": [
            {
              "name": "bookid",
              "order": 1
            },
            {
              "name": "__internal__counter",
              "order": 1
            },
            {
              "name": "__internal__counterType",
              "order": 1
            }
          ]
        },
        {
          "name": "mia_internal_counter_type_index",
          "type": "normal",
          "unique": false,
          "fields": [
            {
              "name": "bookid",
              "order": 1
            },
            {
              "name": "__internal__counterType",
              "order": 1
            }
          ]
        },
        {
          "name": "mia_state_index",
          "type": "normal",
          "unique": false,
          "fields": [
            {
              "name": "bookid",
              "order": 1
            },
            {
              "name": "__STATE__",
              "order": 1
            }
          ]
        }
      ],
      "description": "Collection of projection-a",
      "hidden": true,
      "owners": [
        {
          "owner": "fast-data"
        }
      ]
    },
    "prj-library": {
      "id": "prj-library",
      "name": "prj-library",
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
          "nullable": false
        },
        {
          "name": "libraryid",
          "type": "string",
          "required": false,
          "nullable": false
        }
      ],
      "internalEndpoints": [
        {
          "basePath": "/prj-library",
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
          "name": "mia_primary_key_index",
          "type": "normal",
          "unique": true,
          "fields": [
            {
              "name": "libraryid",
              "order": 1
            }
          ]
        },
        {
          "name": "mia_internal_counter_index",
          "type": "normal",
          "unique": false,
          "fields": [
            {
              "name": "libraryid",
              "order": 1
            },
            {
              "name": "__internal__counter",
              "order": 1
            },
            {
              "name": "__internal__counterType",
              "order": 1
            }
          ]
        },
        {
          "name": "mia_internal_counter_type_index",
          "type": "normal",
          "unique": false,
          "fields": [
            {
              "name": "libraryid",
              "order": 1
            },
            {
              "name": "__internal__counterType",
              "order": 1
            }
          ]
        },
        {
          "name": "mia_state_index",
          "type": "normal",
          "unique": false,
          "fields": [
            {
              "name": "libraryid",
              "order": 1
            },
            {
              "name": "__STATE__",
              "order": 1
            }
          ]
        }
      ],
      "description": "Collection of prj-library",
      "hidden": true,
      "owners": [
        {
          "owner": "fast-data"
        }
      ]
    },
    "sv-libraries": {
      "id": "sv-libraries",
      "name": "sv-libraries",
      "fields": [
        {
          "name": "_id",
          "type": "ObjectId",
          "required": true,
          "nullable": false,
          "description": "_id",
          "sensitivityValue": 0
        },
        {
          "name": "creatorId",
          "type": "string",
          "required": true,
          "nullable": false,
          "description": "creatorId",
          "sensitivityValue": 0
        },
        {
          "name": "createdAt",
          "type": "Date",
          "required": true,
          "nullable": false,
          "description": "createdAt",
          "sensitivityValue": 0
        },
        {
          "name": "updaterId",
          "type": "string",
          "required": true,
          "nullable": false,
          "description": "updaterId",
          "sensitivityValue": 0
        },
        {
          "name": "updatedAt",
          "type": "Date",
          "required": true,
          "nullable": false,
          "description": "updatedAt",
          "sensitivityValue": 0
        },
        {
          "name": "__STATE__",
          "type": "string",
          "required": true,
          "nullable": false,
          "description": "__STATE__",
          "sensitivityValue": 0
        },
        {
          "name": "librarier",
          "type": "RawObject",
          "required": false,
          "nullable": false,
          "sensitivityValue": 0,
          "schema": {
            "properties": {
              "libraryId": {
                "type": "string",
                "description": "Unique identifier for the library",
                "pattern": "^[a-fA-F0-9]{24}$"
              },
              "name": {
                "type": "string",
                "description": "Name of the library"
              },
              "location": {
                "type": "object",
                "properties": {
                  "address": {
                    "type": "string",
                    "description": "Street address of the library"
                  },
                  "city": {
                    "type": "string",
                    "description": "City where the library is located"
                  },
                  "state": {
                    "type": "string",
                    "description": "State where the library is located"
                  },
                  "zipCode": {
                    "type": "string",
                    "description": "Postal code for the library location",
                    "pattern": "^[0-9]{5}(?:-[0-9]{4})?$"
                  }
                },
                "required": [
                  "address",
                  "city",
                  "state",
                  "zipCode"
                ]
              },
              "books": {
                "type": "array",
                "description": "List of books available in the library",
                "items": {
                  "type": "object",
                  "properties": {
                    "bookId": {
                      "type": "string",
                      "description": "Unique identifier for the book",
                      "pattern": "^[a-fA-F0-9]{24}$"
                    },
                    "title": {
                      "type": "string",
                      "description": "Title of the book"
                    },
                    "author": {
                      "type": "string",
                      "description": "Author of the book"
                    },
                    "publishedYear": {
                      "type": "integer",
                      "description": "Year the book was published",
                      "minimum": 1450,
                      "maximum": 2023
                    }
                  },
                  "required": [
                    "bookId",
                    "title",
                    "author"
                  ]
                }
              },
              "metadata": {
                "type": "object",
                "additionalProperties": true,
                "nullable": true,
                "description": "Additional metadata related to the library"
              }
            },
            "required": [
              "libraryId",
              "name",
              "location",
              "books"
            ],
            "type": "object"
          }
        }
      ],
      "internalEndpoints": [
        {
          "basePath": "/sv-libraries",
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
        }
      ],
      "description": "Collection of sv-libraries",
      "hidden": true,
      "owners": [
        {
          "owner": "fast-data"
        }
      ]
    }
  },
  "groups": [],
  "secrets": [
    {
      "secret": "BsdZzsS6flMtDcXJX6ywMnPzpRpHiDdL",
      "active": true,
      "clientType": "fe",
      "description": "description of fe"
    }
  ],
  "cmsCategories": {},
  "cmsSettings": {
    "accessGroupsExpression": ""
  },
  "cmsAnalytics": {},
  "cmsDashboard": [],
  "decorators": {
    "preDecorators": {},
    "postDecorators": {}
  },
  "services": {
    "api-gateway": {
      "type": "custom",
      "advanced": false,
      "name": "api-gateway",
      "dockerImage": "envoyproxy/envoy:v1.32.1",
      "replicas": 1,
      "serviceAccountName": "api-gateway",
      "logParser": "mia-json",
      "description": "Envoy API Gateway to route requests to the correct service and verify the need of authentication",
      "environment": [
        {
          "name": "LOG_LEVEL",
          "valueType": "plain",
          "value": "{{LOG_LEVEL}}"
        },
        {
          "name": "MICROSERVICE_GATEWAY_SERVICE_NAME",
          "valueType": "plain",
          "value": "microservice-gateway"
        },
        {
          "name": "TRUSTED_PROXIES",
          "valueType": "plain",
          "value": "10.0.0.0/8,172.16.0.0/12,192.168.0.0/16"
        },
        {
          "name": "HTTP_PORT",
          "valueType": "plain",
          "value": "3000"
        },
        {
          "name": "USERID_HEADER_KEY",
          "valueType": "plain",
          "value": "miauserid"
        },
        {
          "name": "GROUPS_HEADER_KEY",
          "valueType": "plain",
          "value": "miausergroups"
        },
        {
          "name": "CLIENTTYPE_HEADER_KEY",
          "valueType": "plain",
          "value": "client-type"
        },
        {
          "name": "BACKOFFICE_HEADER_KEY",
          "valueType": "plain",
          "value": "isbackoffice"
        },
        {
          "name": "USER_PROPERTIES_HEADER_KEY",
          "valueType": "plain",
          "value": "miauserproperties"
        }
      ],
      "annotations": [
        {
          "name": "mia-platform.eu/version",
          "value": "14.0.0",
          "description": "Version of Mia-Platform used by the project",
          "readOnly": true
        },
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
          "value": "api-gateway",
          "description": "Name of the microservice, in the service selector",
          "readOnly": true,
          "isSelector": false
        },
        {
          "name": "app.kubernetes.io/name",
          "value": "api-gateway",
          "description": "Name of the microservice",
          "readOnly": true,
          "isSelector": false
        },
        {
          "name": "app.kubernetes.io/version",
          "value": "v1.32.1",
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
          "value": "all-config",
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
          "value": "6b38a8ec-816c-487c-986d-c59edb294ea6",
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
          "max": "200m",
          "min": "150m"
        },
        "memoryLimits": {
          "max": "250Mi",
          "min": "150Mi"
        }
      },
      "probes": {
        "liveness": {
          "path": "/healthz",
          "port": "frontend",
          "initialDelaySeconds": 15,
          "periodSeconds": 20,
          "timeoutSeconds": 1,
          "failureThreshold": 3
        },
        "readiness": {
          "path": "/healthz",
          "port": "frontend",
          "initialDelaySeconds": 5,
          "periodSeconds": 10,
          "timeoutSeconds": 1,
          "successThreshold": 1,
          "failureThreshold": 3
        },
        "startup": {}
      },
      "tags": [
        "custom"
      ],
      "swaggerPath": "",
      "configMaps": [
        {
          "name": "api-gateway-envoy-config",
          "mountPath": "/etc/envoy",
          "viewAsReadOnly": true,
          "link": {
            "targetSection": "endpoints"
          }
        }
      ],
      "sourceComponentId": "api-gateway-envoy",
      "createdAt": "2025-04-27T08:02:37.608Z",
      "containerPorts": [
        {
          "name": "frontend",
          "from": 8080,
          "to": 8080
        },
        {
          "name": "backoffice",
          "from": 8081,
          "to": 8081
        },
        {
          "name": "admin",
          "from": 9901,
          "to": 9901
        }
      ],
      "execPreStop": [
        "bash",
        "-c",
        "echo -e 'POST /drain_listeners?graceful HTTP/1.1\r\nHost: localhost:9901\r\n\r' > /dev/tcp/localhost/9901 && sleep 55s"
      ],
      "args": [
        "-c",
        "/etc/envoy/envoy.json",
        "-l",
        "{{LOG_LEVEL}}",
        "--log-format",
        "{\"level\":\"%l\",\"time\":\"%Y-%m-%dT%T.%fZ\",\"scope\":\"%n\",\"message\":\"%j\"}",
        "--drain-time-s",
        "50"
      ],
      "terminationGracePeriodSeconds": 60
    },
    "adaptive-approval": {
      "type": "custom",
      "advanced": false,
      "name": "adaptive-approval",
      "dockerImage": "nexus.mia-platform.eu/fintech/adaptive-approval:0.0.2",
      "replicas": 1,
      "serviceAccountName": "adaptive-approval",
      "logParser": "mia-json",
      "description": "This service allow to define and verify rules",
      "environment": [
        {
          "name": "HTTP_PORT",
          "valueType": "plain",
          "value": "8080"
        },
        {
          "name": "CRUD_URL",
          "valueType": "plain",
          "value": "http://crud-service/rules/"
        },
        {
          "name": "FLOW_MANAGER_URL",
          "valueType": "plain",
          "value": "http://flow-manager-service"
        }
      ],
      "annotations": [
        {
          "name": "mia-platform.eu/version",
          "value": "14.0.0",
          "description": "Version of Mia-Platform used by the project",
          "readOnly": true
        },
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
          "value": "adaptive-approval",
          "description": "Name of the microservice, in the service selector",
          "readOnly": true,
          "isSelector": false
        },
        {
          "name": "app.kubernetes.io/name",
          "value": "adaptive-approval",
          "description": "Name of the microservice",
          "readOnly": true,
          "isSelector": false
        },
        {
          "name": "app.kubernetes.io/version",
          "value": "0.0.2",
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
          "value": "all-config",
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
          "value": "6b38a8ec-816c-487c-986d-c59edb294ea6",
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
      "probes": {
        "liveness": {
          "path": "/-/healthz",
          "port": "http",
          "initialDelaySeconds": 15,
          "periodSeconds": 20,
          "timeoutSeconds": 1,
          "failureThreshold": 3
        },
        "readiness": {
          "path": "/-/ready",
          "port": "http",
          "initialDelaySeconds": 5,
          "periodSeconds": 10,
          "timeoutSeconds": 1,
          "successThreshold": 1,
          "failureThreshold": 3
        },
        "startup": {}
      },
      "tags": [
        "custom"
      ],
      "swaggerPath": "/documentation/json",
      "createdAt": "2025-04-27T08:02:37.878Z",
      "containerPorts": [
        {
          "name": "http",
          "from": 80,
          "to": 8080,
          "protocol": "TCP"
        }
      ],
      "terminationGracePeriodSeconds": 30
    },
    "analytics-transactions": {
      "type": "custom",
      "advanced": false,
      "name": "analytics-transactions",
      "dockerImage": "nexus.mia-platform.eu/core/mongodb-reader:{{ANALYTICS_TRANSACTIONS_VERSION}}",
      "replicas": 1,
      "serviceAccountName": "analytics-transactions",
      "logParser": "mia-json",
      "description": "Provide MongoDB aggregation pipelines as REST API.",
      "environment": [
        {
          "name": "LOG_LEVEL",
          "valueType": "plain",
          "value": "{{LOG_LEVEL}}"
        },
        {
          "name": "HTTP_PORT",
          "valueType": "plain",
          "value": "8080"
        },
        {
          "name": "USERID_HEADER_KEY",
          "valueType": "plain",
          "value": "miauserid"
        },
        {
          "name": "GROUPS_HEADER_KEY",
          "valueType": "plain",
          "value": "miausergroups"
        },
        {
          "name": "CLIENTTYPE_HEADER_KEY",
          "valueType": "plain",
          "value": "client-type"
        },
        {
          "name": "BACKOFFICE_HEADER_KEY",
          "valueType": "plain",
          "value": "isbackoffice"
        },
        {
          "name": "MICROSERVICE_GATEWAY_SERVICE_NAME",
          "valueType": "plain",
          "value": "microservice-gateway"
        },
        {
          "name": "MONGODB_URL",
          "valueType": "plain",
          "value": "{{MONGODB_URL}}"
        },
        {
          "name": "PROFILE_DIR",
          "valueType": "plain",
          "value": "/home/node/app/profiles"
        }
      ],
      "annotations": [
        {
          "name": "mia-platform.eu/version",
          "value": "14.0.0",
          "description": "Version of Mia-Platform used by the project",
          "readOnly": true
        },
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
          "value": "analytics-transactions",
          "description": "Name of the microservice, in the service selector",
          "readOnly": true,
          "isSelector": false
        },
        {
          "name": "app.kubernetes.io/name",
          "value": "analytics-transactions",
          "description": "Name of the microservice",
          "readOnly": true,
          "isSelector": false
        },
        {
          "name": "app.kubernetes.io/version",
          "value": "{{ANALYTICS_TRANSACTIONS_VERSION}}",
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
          "value": "all-config",
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
          "value": "6b38a8ec-816c-487c-986d-c59edb294ea6",
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
          "min": "10m"
        },
        "memoryLimits": {
          "max": "150Mi",
          "min": "50Mi"
        }
      },
      "probes": {
        "liveness": {
          "path": "/-/healthz",
          "port": "http",
          "initialDelaySeconds": 15,
          "periodSeconds": 20,
          "timeoutSeconds": 1,
          "failureThreshold": 3
        },
        "readiness": {
          "path": "/-/ready",
          "port": "http",
          "initialDelaySeconds": 5,
          "periodSeconds": 10,
          "timeoutSeconds": 1,
          "successThreshold": 1,
          "failureThreshold": 3
        },
        "startup": {}
      },
      "tags": [
        "custom"
      ],
      "swaggerPath": "/documentation/json",
      "configMaps": [
        {
          "name": "transactions-analytics",
          "mountPath": "/home/node/app/profiles",
          "viewAsReadOnly": false
        }
      ],
      "createdAt": "2025-04-27T08:02:38.074Z",
      "containerPorts": [
        {
          "name": "http",
          "from": 80,
          "to": 8080,
          "protocol": "TCP"
        }
      ],
      "terminationGracePeriodSeconds": 30
    },
    "crud-service": {
      "type": "custom",
      "advanced": false,
      "name": "crud-service",
      "dockerImage": "miaplatform/crud-service:{{CRUD_SERVICE_VERSION}}",
      "replicas": 1,
      "serviceAccountName": "crud-service",
      "logParser": "mia-json",
      "additionalContainers": [
        {
          "name": "rbac-service",
          "dockerImage": "ghcr.io/rond-authz/rond:latest",
          "environment": [
            {
              "name": "HTTP_PORT",
              "valueType": "plain",
              "value": "9876"
            },
            {
              "name": "TARGET_SERVICE_HOST",
              "valueType": "plain",
              "value": "localhost:3000"
            },
            {
              "name": "LOG_LEVEL",
              "valueType": "plain",
              "value": "{{LOG_LEVEL}}"
            },
            {
              "name": "TARGET_SERVICE_OAS_PATH",
              "valueType": "plain",
              "value": "/documentation/json"
            },
            {
              "name": "OPA_MODULES_DIRECTORY",
              "valueType": "plain",
              "value": "/configurations/opa"
            },
            {
              "name": "API_PERMISSIONS_FILE_PATH",
              "valueType": "plain",
              "value": "/configurations/oas/crud-service-permissions.json"
            },
            {
              "name": "MONGODB_URL",
              "valueType": "plain",
              "value": "{{MONGODB_URL}}"
            },
            {
              "name": "ROLES_COLLECTION_NAME",
              "valueType": "plain",
              "value": "rbac-roles"
            },
            {
              "name": "BINDINGS_COLLECTION_NAME",
              "valueType": "plain",
              "value": "rbac-bindings"
            }
          ],
          "resources": {
            "cpuLimits": {
              "max": "100m",
              "min": "100m"
            },
            "memoryLimits": {
              "max": "300Mi",
              "min": "50Mi"
            }
          },
          "probes": {
            "liveness": {
              "path": "/-/rbac-healthz",
              "port": "rbac-service"
            },
            "readiness": {
              "path": "/-/rbac-ready",
              "port": "rbac-service"
            }
          },
          "configMaps": [
            {
              "name": "rbac-sidecar-svc-opa-policies-config",
              "mountPath": "/configurations/opa",
              "viewAsReadOnly": true
            },
            {
              "name": "rbac-sidecar-svc-oas-permissions-config",
              "mountPath": "/configurations/oas",
              "subPaths": [
                "crud-service-permissions.json"
              ],
              "viewAsReadOnly": true
            }
          ],
          "owners": [
            {
              "owner": "rbac-manager-plugin"
            }
          ],
          "containerPorts": [
            {
              "name": "rbac-service",
              "from": 80,
              "to": 9876
            }
          ],
          "monitoring": {
            "endpoints": [
              {
                "path": "/-/rond/metrics",
                "port": "rbac-service",
                "interval": "60s"
              }
            ]
          },
          "exclusiveServiceExposure": true
        }
      ],
      "environment": [
        {
          "name": "MONGODB_URL",
          "valueType": "plain",
          "value": "{{MONGODB_URL}}"
        },
        {
          "name": "COLLECTION_DEFINITION_FOLDER",
          "valueType": "plain",
          "value": "/home/node/app/collections"
        },
        {
          "name": "HTTP_PORT",
          "valueType": "plain",
          "value": "3000"
        },
        {
          "name": "LOG_LEVEL",
          "valueType": "plain",
          "value": "{{LOG_LEVEL}}"
        },
        {
          "name": "SERVICE_PREFIX",
          "valueType": "plain",
          "value": "/"
        },
        {
          "name": "USER_ID_HEADER_KEY",
          "valueType": "plain",
          "value": "miauserid"
        },
        {
          "name": "TRUSTED_PROXIES",
          "valueType": "plain",
          "value": "10.0.0.0/8,172.16.0.0/12,192.168.0.0/16"
        },
        {
          "name": "CRUD_LIMIT_CONSTRAINT_ENABLED",
          "valueType": "plain",
          "value": "{{CRUD_LIMIT_CONSTRAINT_ENABLED}}"
        },
        {
          "name": "EXPOSE_METRICS",
          "valueType": "plain",
          "value": "false"
        }
      ],
      "annotations": [
        {
          "name": "mia-platform.eu/version",
          "value": "14.0.0",
          "description": "Version of Mia-Platform used by the project",
          "readOnly": true
        },
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
          "value": "crud-service",
          "description": "Name of the microservice, in the service selector",
          "readOnly": true,
          "isSelector": false
        },
        {
          "name": "app.kubernetes.io/name",
          "value": "crud-service",
          "description": "Name of the microservice",
          "readOnly": true,
          "isSelector": false
        },
        {
          "name": "app.kubernetes.io/version",
          "value": "{{CRUD_SERVICE_VERSION}}",
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
          "value": "all-config",
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
          "value": "6b38a8ec-816c-487c-986d-c59edb294ea6",
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
          "min": "50m"
        },
        "memoryLimits": {
          "max": "250Mi",
          "min": "70Mi"
        }
      },
      "probes": {
        "liveness": {
          "path": "/-/healthz",
          "port": "http",
          "initialDelaySeconds": 15,
          "periodSeconds": 20,
          "timeoutSeconds": 1,
          "failureThreshold": 3
        },
        "readiness": {
          "path": "/-/ready",
          "port": "http",
          "initialDelaySeconds": 5,
          "periodSeconds": 10,
          "timeoutSeconds": 1,
          "successThreshold": 1,
          "failureThreshold": 3
        },
        "startup": {}
      },
      "tags": [
        "custom"
      ],
      "swaggerPath": "/documentation/json",
      "configMaps": [
        {
          "name": "crud-service-collections",
          "mountPath": "/home/node/app/collections",
          "viewAsReadOnly": true,
          "link": {
            "targetSection": "collections"
          }
        }
      ],
      "sourceComponentId": "crud-service",
      "mapEnvVarToMountPath": {
        "collections": {
          "type": "folder",
          "envName": "COLLECTION_DEFINITION_FOLDER"
        }
      },
      "createdAt": "2025-04-27T08:02:38.279Z",
      "containerPorts": [
        {
          "name": "http",
          "from": 80,
          "to": 3000,
          "protocol": "TCP"
        }
      ],
      "terminationGracePeriodSeconds": 30
    },
    "data-visualization-backend": {
      "type": "custom",
      "advanced": false,
      "name": "data-visualization-backend",
      "dockerImage": "nexus.mia-platform.eu/core/charts-service:{{DATA_VIZ_BE_VERSION}}",
      "replicas": 1,
      "serviceAccountName": "data-visualization-backend",
      "logParser": "mia-json",
      "description": "This is a backend for frontend to be used to configure Data Visualization dashboards.",
      "environment": [
        {
          "name": "LOG_LEVEL",
          "valueType": "plain",
          "value": "{{LOG_LEVEL}}"
        },
        {
          "name": "HTTP_PORT",
          "valueType": "plain",
          "value": "8080"
        },
        {
          "name": "USERID_HEADER_KEY",
          "valueType": "plain",
          "value": "miauserid"
        },
        {
          "name": "GROUPS_HEADER_KEY",
          "valueType": "plain",
          "value": "miausergroups"
        },
        {
          "name": "CLIENTTYPE_HEADER_KEY",
          "valueType": "plain",
          "value": "client-type"
        },
        {
          "name": "BACKOFFICE_HEADER_KEY",
          "valueType": "plain",
          "value": "isbackoffice"
        },
        {
          "name": "USER_PROPERTIES_HEADER_KEY",
          "valueType": "plain",
          "value": "miauserproperties"
        },
        {
          "name": "MICROSERVICE_GATEWAY_SERVICE_NAME",
          "valueType": "plain",
          "value": "microservice-gateway"
        },
        {
          "name": "DASHBOARD_AND_CHARTS_CONFIG_PATH",
          "valueType": "plain",
          "value": "/home/node/app/data-visualization/config.json"
        }
      ],
      "annotations": [
        {
          "name": "mia-platform.eu/version",
          "value": "14.0.0",
          "description": "Version of Mia-Platform used by the project",
          "readOnly": true
        },
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
          "value": "data-visualization-backend",
          "description": "Name of the microservice, in the service selector",
          "readOnly": true,
          "isSelector": false
        },
        {
          "name": "app.kubernetes.io/name",
          "value": "data-visualization-backend",
          "description": "Name of the microservice",
          "readOnly": true,
          "isSelector": false
        },
        {
          "name": "app.kubernetes.io/version",
          "value": "{{DATA_VIZ_BE_VERSION}}",
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
          "value": "all-config",
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
          "value": "6b38a8ec-816c-487c-986d-c59edb294ea6",
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
          "min": "10m"
        },
        "memoryLimits": {
          "max": "150Mi",
          "min": "50Mi"
        }
      },
      "probes": {
        "liveness": {
          "path": "/-/healthz",
          "port": "http",
          "initialDelaySeconds": 15,
          "periodSeconds": 20,
          "timeoutSeconds": 1,
          "failureThreshold": 3
        },
        "readiness": {
          "path": "/-/ready",
          "port": "http",
          "initialDelaySeconds": 5,
          "periodSeconds": 10,
          "timeoutSeconds": 1,
          "successThreshold": 1,
          "failureThreshold": 3
        },
        "startup": {}
      },
      "tags": [
        "custom"
      ],
      "swaggerPath": "/documentation/json",
      "configMaps": [
        {
          "name": "data-visualization-backend",
          "mountPath": "/home/node/app/data-visualization",
          "viewAsReadOnly": false
        }
      ],
      "createdAt": "2025-04-27T08:02:38.715Z",
      "containerPorts": [
        {
          "name": "http",
          "from": 80,
          "to": 8080,
          "protocol": "TCP"
        }
      ],
      "terminationGracePeriodSeconds": 30
    },
    "data-visualization-frontend": {
      "type": "custom",
      "advanced": false,
      "name": "data-visualization-frontend",
      "dockerImage": "nexus.mia-platform.eu/backoffice/data-visualization:{{DATA_VIZ_FE_VERSION}}",
      "replicas": 1,
      "serviceAccountName": "data-visualization-frontend",
      "logParser": "mia-json",
      "description": "A customizable frontend to display your data in beautiful dashboards. Use it with Data Visualization Backend.",
      "environment": [
        {
          "name": "HTTP_PORT",
          "valueType": "plain",
          "value": "8080"
        }
      ],
      "annotations": [
        {
          "name": "mia-platform.eu/version",
          "value": "14.0.0",
          "description": "Version of Mia-Platform used by the project",
          "readOnly": true
        },
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
          "value": "data-visualization-frontend",
          "description": "Name of the microservice, in the service selector",
          "readOnly": true,
          "isSelector": false
        },
        {
          "name": "app.kubernetes.io/name",
          "value": "data-visualization-frontend",
          "description": "Name of the microservice",
          "readOnly": true,
          "isSelector": false
        },
        {
          "name": "app.kubernetes.io/version",
          "value": "{{DATA_VIZ_FE_VERSION}}",
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
          "value": "all-config",
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
          "value": "6b38a8ec-816c-487c-986d-c59edb294ea6",
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
          "min": "10m"
        },
        "memoryLimits": {
          "max": "150Mi",
          "min": "50Mi"
        }
      },
      "probes": {
        "liveness": {
          "path": "/-/healthz",
          "port": "http",
          "initialDelaySeconds": 15,
          "periodSeconds": 20,
          "timeoutSeconds": 1,
          "failureThreshold": 3
        },
        "readiness": {
          "path": "/-/ready",
          "port": "http",
          "initialDelaySeconds": 5,
          "periodSeconds": 10,
          "timeoutSeconds": 1,
          "successThreshold": 1,
          "failureThreshold": 3
        },
        "startup": {}
      },
      "tags": [
        "custom"
      ],
      "swaggerPath": "",
      "createdAt": "2025-04-27T08:02:38.942Z",
      "containerPorts": [
        {
          "name": "http",
          "from": 80,
          "to": 8080,
          "protocol": "TCP"
        }
      ],
      "terminationGracePeriodSeconds": 30
    },
    "export-service": {
      "type": "custom",
      "advanced": false,
      "name": "export-service",
      "dockerImage": "nexus.mia-platform.eu/core/export-service:2.0.2",
      "replicas": 1,
      "serviceAccountName": "export-service",
      "logParser": "mia-json",
      "description": "This service helps you manage Excel, CSV or JSON export from other services using jsonl.",
      "environment": [
        {
          "name": "LOG_LEVEL",
          "valueType": "plain",
          "value": "{{LOG_LEVEL}}"
        },
        {
          "name": "HTTP_PORT",
          "valueType": "plain",
          "value": "3000"
        },
        {
          "name": "USERID_HEADER_KEY",
          "valueType": "plain",
          "value": "miauserid"
        },
        {
          "name": "GROUPS_HEADER_KEY",
          "valueType": "plain",
          "value": "miausergroups"
        },
        {
          "name": "CLIENTTYPE_HEADER_KEY",
          "valueType": "plain",
          "value": "miaclienttype"
        },
        {
          "name": "BACKOFFICE_HEADER_KEY",
          "valueType": "plain",
          "value": "isbackoffice"
        },
        {
          "name": "MICROSERVICE_GATEWAY_SERVICE_NAME",
          "valueType": "plain",
          "value": "microservice-gateway"
        }
      ],
      "annotations": [
        {
          "name": "mia-platform.eu/version",
          "value": "14.0.0",
          "description": "Version of Mia-Platform used by the project",
          "readOnly": true
        },
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
          "value": "export-service",
          "description": "Name of the microservice, in the service selector",
          "readOnly": true,
          "isSelector": false
        },
        {
          "name": "app.kubernetes.io/name",
          "value": "export-service",
          "description": "Name of the microservice",
          "readOnly": true,
          "isSelector": false
        },
        {
          "name": "app.kubernetes.io/version",
          "value": "2.0.2",
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
          "value": "all-config",
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
          "value": "6b38a8ec-816c-487c-986d-c59edb294ea6",
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
          "min": "10m"
        },
        "memoryLimits": {
          "max": "300Mi",
          "min": "150Mi"
        }
      },
      "probes": {
        "liveness": {
          "path": "/-/healthz",
          "port": "http",
          "initialDelaySeconds": 40,
          "periodSeconds": 15,
          "timeoutSeconds": 1,
          "successThreshold": 1,
          "failureThreshold": 3
        },
        "readiness": {
          "path": "/-/ready",
          "port": "http",
          "initialDelaySeconds": 5,
          "periodSeconds": 10,
          "timeoutSeconds": 1,
          "successThreshold": 1,
          "failureThreshold": 3
        },
        "startup": {}
      },
      "tags": [
        "custom"
      ],
      "swaggerPath": "/documentation/json",
      "createdAt": "2025-04-27T08:02:39.169Z",
      "containerPorts": [
        {
          "name": "http",
          "from": 80,
          "to": 3000,
          "protocol": "TCP"
        }
      ],
      "terminationGracePeriodSeconds": 30
    },
    "files-service": {
      "type": "custom",
      "advanced": false,
      "name": "files-service",
      "dockerImage": "nexus.mia-platform.eu/plugins/files-service:2.10.1",
      "replicas": 1,
      "serviceAccountName": "files-service",
      "logParser": "mia-json",
      "description": "Upload, download and handle your files using MongoDB, S3 or Google Storage.",
      "environment": [
        {
          "name": "LOG_LEVEL",
          "valueType": "plain",
          "value": "{{LOG_LEVEL}}"
        },
        {
          "name": "HTTP_PORT",
          "valueType": "plain",
          "value": "3000"
        },
        {
          "name": "CRUD_URL",
          "valueType": "plain",
          "value": "http://crud-service/invoices/"
        },
        {
          "name": "CONFIG_FILE_PATH",
          "valueType": "plain",
          "value": "/file-service-config/db-config.json"
        },
        {
          "name": "HEADERS_TO_PROXY",
          "valueType": "plain",
          "value": "miauserid,miausergroups"
        },
        {
          "name": "PROJECT_HOSTNAME",
          "valueType": "plain",
          "value": "https://{{PROJECT_HOST}}/"
        },
        {
          "name": "ADDITIONAL_FUNCTION_CASTER_FILE_PATH",
          "valueType": "plain",
          "value": "/file-service-config/caster-file.js"
        }
      ],
      "annotations": [
        {
          "name": "mia-platform.eu/version",
          "value": "14.0.0",
          "description": "Version of Mia-Platform used by the project",
          "readOnly": true
        },
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
          "value": "files-service",
          "description": "Name of the microservice, in the service selector",
          "readOnly": true,
          "isSelector": false
        },
        {
          "name": "app.kubernetes.io/name",
          "value": "files-service",
          "description": "Name of the microservice",
          "readOnly": true,
          "isSelector": false
        },
        {
          "name": "app.kubernetes.io/version",
          "value": "2.10.1",
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
          "value": "all-config",
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
          "value": "6b38a8ec-816c-487c-986d-c59edb294ea6",
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
          "min": "10m"
        },
        "memoryLimits": {
          "max": "150Mi",
          "min": "100Mi"
        }
      },
      "probes": {
        "liveness": {
          "path": "/-/healthz",
          "port": "http",
          "initialDelaySeconds": 15,
          "periodSeconds": 20,
          "timeoutSeconds": 1,
          "failureThreshold": 3
        },
        "readiness": {
          "path": "/-/ready",
          "port": "http",
          "initialDelaySeconds": 5,
          "periodSeconds": 10,
          "timeoutSeconds": 1,
          "successThreshold": 1,
          "failureThreshold": 3
        },
        "startup": {}
      },
      "tags": [
        "custom"
      ],
      "swaggerPath": "",
      "configMaps": [
        {
          "name": "file-sevice-config",
          "mountPath": "/file-service-config",
          "viewAsReadOnly": false
        }
      ],
      "createdAt": "2025-04-27T08:02:39.385Z",
      "containerPorts": [
        {
          "name": "http",
          "from": 80,
          "to": 3000,
          "protocol": "TCP"
        }
      ],
      "terminationGracePeriodSeconds": 30
    },
    "flow-manager-service": {
      "type": "custom",
      "advanced": false,
      "name": "flow-manager-service",
      "dockerImage": "nexus.mia-platform.eu/core/flow-manager:2.6.5",
      "replicas": 1,
      "serviceAccountName": "flow-manager-service",
      "logParser": "mia-json",
      "description": "The Flow Manager is a saga orchestrator, capable to manage flows structured by using the Architectural pattern named Saga Pattern",
      "environment": [
        {
          "name": "LOG_LEVEL",
          "valueType": "plain",
          "value": "{{LOG_LEVEL}}"
        },
        {
          "name": "HTTP_PORT",
          "valueType": "plain",
          "value": "3000"
        },
        {
          "name": "USERID_HEADER_KEY",
          "valueType": "plain",
          "value": "miauserid"
        },
        {
          "name": "GROUPS_HEADER_KEY",
          "valueType": "plain",
          "value": "miausergroups"
        },
        {
          "name": "CLIENTTYPE_HEADER_KEY",
          "valueType": "plain",
          "value": "miaclienttype"
        },
        {
          "name": "BACKOFFICE_HEADER_KEY",
          "valueType": "plain",
          "value": "isbackoffice"
        },
        {
          "name": "USER_PROPERTIES_HEADER_KEY",
          "valueType": "plain",
          "value": "miauserproperties"
        },
        {
          "name": "MICROSERVICE_GATEWAY_SERVICE_NAME",
          "valueType": "plain",
          "value": "microservice-gateway"
        },
        {
          "name": "CONFIGURATIONS_FILE_PATH",
          "valueType": "plain",
          "value": "/configuration/saga.json"
        },
        {
          "name": "SAGA_ID_PREFIX",
          "valueType": "plain",
          "value": "payment"
        }
      ],
      "annotations": [
        {
          "name": "mia-platform.eu/version",
          "value": "14.0.0",
          "description": "Version of Mia-Platform used by the project",
          "readOnly": true
        },
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
          "value": "flow-manager-service",
          "description": "Name of the microservice, in the service selector",
          "readOnly": true,
          "isSelector": false
        },
        {
          "name": "app.kubernetes.io/name",
          "value": "flow-manager-service",
          "description": "Name of the microservice",
          "readOnly": true,
          "isSelector": false
        },
        {
          "name": "app.kubernetes.io/version",
          "value": "2.6.5",
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
          "value": "all-config",
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
          "value": "6b38a8ec-816c-487c-986d-c59edb294ea6",
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
          "min": "10m"
        },
        "memoryLimits": {
          "max": "150Mi",
          "min": "100Mi"
        }
      },
      "probes": {
        "liveness": {
          "path": "/-/healthz",
          "port": "http",
          "initialDelaySeconds": 15,
          "periodSeconds": 20,
          "timeoutSeconds": 1,
          "failureThreshold": 3
        },
        "readiness": {
          "path": "/-/ready",
          "port": "http",
          "initialDelaySeconds": 5,
          "periodSeconds": 10,
          "timeoutSeconds": 1,
          "successThreshold": 1,
          "failureThreshold": 3
        },
        "startup": {}
      },
      "tags": [
        "custom"
      ],
      "swaggerPath": "/documentation/json",
      "configMaps": [
        {
          "name": "flow-configuration",
          "mountPath": "/configuration",
          "viewAsReadOnly": true,
          "link": {
            "targetSection": "flow-manager"
          }
        }
      ],
      "sourceComponentId": "flow-manager",
      "createdAt": "2025-04-27T08:02:39.574Z",
      "containerPorts": [
        {
          "name": "http",
          "from": 80,
          "to": 3000,
          "protocol": "TCP"
        }
      ],
      "terminationGracePeriodSeconds": 30
    },
    "frullino-service": {
      "type": "custom",
      "advanced": false,
      "name": "frullino-service",
      "dockerImage": "nexus.mia-platform.eu/plugins/frullino:{{FRULLINO_VERSION}}",
      "replicas": 1,
      "serviceAccountName": "frullino-service",
      "logParser": "mia-json",
      "environment": [
        {
          "name": "HTTP_PORT",
          "valueType": "plain",
          "value": "8080"
        },
        {
          "name": "CRUD_SERVICE_URL",
          "valueType": "plain",
          "value": "http://crud-service/payment-pending-view"
        },
        {
          "name": "PGM_URL",
          "valueType": "plain",
          "value": "http://payment-gateway-manager"
        },
        {
          "name": "FLOW_MANAGER_URL",
          "valueType": "plain",
          "value": "http://flow-manager-service"
        },
        {
          "name": "REDIS_HOST",
          "valueType": "plain",
          "value": "redis://{{REDIS_HOSTS}}"
        },
        {
          "name": "THREAD_NUMBER",
          "valueType": "plain",
          "value": "2"
        },
        {
          "name": "LOG_LEVEL",
          "valueType": "plain",
          "value": "{{LOGS}}"
        },
        {
          "name": "FRULLINO_RUNNING_INTERVAL_CRON",
          "valueType": "plain",
          "value": "30s"
        }
      ],
      "annotations": [
        {
          "name": "mia-platform.eu/version",
          "value": "14.0.0",
          "description": "Version of Mia-Platform used by the project",
          "readOnly": true
        },
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
          "value": "frullino-service",
          "description": "Name of the microservice, in the service selector",
          "readOnly": true,
          "isSelector": false
        },
        {
          "name": "app.kubernetes.io/name",
          "value": "frullino-service",
          "description": "Name of the microservice",
          "readOnly": true,
          "isSelector": false
        },
        {
          "name": "app.kubernetes.io/version",
          "value": "{{FRULLINO_VERSION}}",
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
          "value": "all-config",
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
          "value": "6b38a8ec-816c-487c-986d-c59edb294ea6",
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
          "min": "30m"
        },
        "memoryLimits": {
          "max": "400Mi",
          "min": "200Mi"
        }
      },
      "probes": {
        "liveness": {
          "path": "/-/healthz",
          "port": "http",
          "initialDelaySeconds": 15,
          "periodSeconds": 20,
          "timeoutSeconds": 1,
          "failureThreshold": 3
        },
        "readiness": {
          "path": "/-/ready",
          "port": "http",
          "initialDelaySeconds": 15,
          "periodSeconds": 10,
          "timeoutSeconds": 1,
          "successThreshold": 1,
          "failureThreshold": 3
        },
        "startup": {}
      },
      "tags": [
        "custom"
      ],
      "swaggerPath": "/documentation/json",
      "createdAt": "2025-04-27T08:02:39.791Z",
      "containerPorts": [
        {
          "name": "http",
          "from": 80,
          "to": 8080,
          "protocol": "TCP"
        }
      ],
      "terminationGracePeriodSeconds": 30
    },
    "invoice-service": {
      "type": "custom",
      "advanced": false,
      "name": "invoice-service",
      "dockerImage": "nexus.mia-platform.eu/plugins/invoice-service:1.0.3",
      "replicas": 1,
      "serviceAccountName": "invoice-service",
      "logParser": "mia-json",
      "environment": [
        {
          "name": "USERID_HEADER_KEY",
          "valueType": "plain",
          "value": "miauserid"
        },
        {
          "name": "HTTP_PORT",
          "valueType": "plain",
          "value": "3000"
        },
        {
          "name": "GROUPS_HEADER_KEY",
          "valueType": "plain",
          "value": "miausergroups"
        },
        {
          "name": "CLIENTTYPE_HEADER_KEY",
          "valueType": "plain",
          "value": "client_type"
        },
        {
          "name": "BACKOFFICE_HEADER_KEY",
          "valueType": "plain",
          "value": "isBackoffice"
        },
        {
          "name": "MICROSERVICE_GATEWAY_SERVICE_NAME",
          "valueType": "plain",
          "value": "microservice-gateway"
        },
        {
          "name": "COMPANY_DATA_PATH",
          "valueType": "plain",
          "value": "/config/company-data.json"
        }
      ],
      "annotations": [
        {
          "name": "mia-platform.eu/version",
          "value": "14.0.0",
          "description": "Version of Mia-Platform used by the project",
          "readOnly": true
        },
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
          "value": "invoice-service",
          "description": "Name of the microservice, in the service selector",
          "readOnly": true,
          "isSelector": false
        },
        {
          "name": "app.kubernetes.io/name",
          "value": "invoice-service",
          "description": "Name of the microservice",
          "readOnly": true,
          "isSelector": false
        },
        {
          "name": "app.kubernetes.io/version",
          "value": "1.0.3",
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
          "value": "all-config",
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
          "value": "6b38a8ec-816c-487c-986d-c59edb294ea6",
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
          "min": "30m"
        },
        "memoryLimits": {
          "max": "150Mi",
          "min": "80Mi"
        }
      },
      "probes": {
        "liveness": {
          "path": "/-/healthz",
          "port": "http",
          "initialDelaySeconds": 15,
          "periodSeconds": 20,
          "timeoutSeconds": 2,
          "successThreshold": 1,
          "failureThreshold": 3
        },
        "readiness": {
          "path": "/-/ready",
          "port": "http",
          "initialDelaySeconds": 15,
          "periodSeconds": 10,
          "timeoutSeconds": 2,
          "successThreshold": 1,
          "failureThreshold": 3
        },
        "startup": {}
      },
      "tags": [
        "custom"
      ],
      "swaggerPath": "/documentation/json",
      "configMaps": [
        {
          "name": "config",
          "mountPath": "/config",
          "viewAsReadOnly": false
        }
      ],
      "sourceComponentId": "invoice-service",
      "createdAt": "2025-04-27T08:02:39.990Z",
      "containerPorts": [
        {
          "name": "http",
          "from": 80,
          "to": 3000,
          "protocol": "TCP"
        }
      ],
      "terminationGracePeriodSeconds": 30
    },
    "messaging-service": {
      "type": "custom",
      "advanced": false,
      "name": "messaging-service",
      "dockerImage": "nexus.mia-platform.eu/plugins/messaging-service:{{MESSAGING_SERVICE_VERSION}}",
      "replicas": 1,
      "serviceAccountName": "messaging-service",
      "logParser": "mia-json",
      "description": "Service used to send notification through various medium",
      "environment": [
        {
          "name": "LOG_LEVEL",
          "valueType": "plain",
          "value": "{{LOGS}}"
        },
        {
          "name": "TRUSTED_PROXIES",
          "valueType": "plain",
          "value": "10.0.0.0/8,172.16.0.0/12,192.168.0.0/16"
        },
        {
          "name": "HTTP_PORT",
          "valueType": "plain",
          "value": "3000"
        },
        {
          "name": "USERID_HEADER_KEY",
          "valueType": "plain",
          "value": "miauserid"
        },
        {
          "name": "GROUPS_HEADER_KEY",
          "valueType": "plain",
          "value": "miausergroups"
        },
        {
          "name": "CLIENTTYPE_HEADER_KEY",
          "valueType": "plain",
          "value": "client-type"
        },
        {
          "name": "BACKOFFICE_HEADER_KEY",
          "valueType": "plain",
          "value": "isbackoffice"
        },
        {
          "name": "MICROSERVICE_GATEWAY_SERVICE_NAME",
          "valueType": "plain",
          "value": "microservice-gateway"
        },
        {
          "name": "USER_PROPERTIES_HEADER_KEY",
          "valueType": "plain",
          "value": "miauserproperties"
        },
        {
          "name": "CRUD_SERVICE_NAME",
          "valueType": "plain",
          "value": "crud-service"
        },
        {
          "name": "USERS_CRUD_NAME",
          "valueType": "plain",
          "value": "users"
        },
        {
          "name": "TEMPLATES_CRUD_NAME",
          "valueType": "plain",
          "value": "notification-templates"
        },
        {
          "name": "CONFIGURATION_PATH",
          "valueType": "plain",
          "value": "/home/node/app/messaging-service/config.json"
        },
        {
          "name": "MAIL_SERVICE_NAME",
          "valueType": "plain",
          "value": "smtp-mail-notification-service"
        },
        {
          "name": "SMS_SERVICE_NAME",
          "valueType": "plain",
          "value": "sms-service"
        }
      ],
      "annotations": [
        {
          "name": "mia-platform.eu/version",
          "value": "14.0.0",
          "description": "Version of Mia-Platform used by the project",
          "readOnly": true
        },
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
          "value": "messaging-service",
          "description": "Name of the microservice, in the service selector",
          "readOnly": true,
          "isSelector": false
        },
        {
          "name": "app.kubernetes.io/name",
          "value": "messaging-service",
          "description": "Name of the microservice",
          "readOnly": true,
          "isSelector": false
        },
        {
          "name": "app.kubernetes.io/version",
          "value": "{{MESSAGING_SERVICE_VERSION}}",
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
          "value": "all-config",
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
          "value": "6b38a8ec-816c-487c-986d-c59edb294ea6",
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
          "min": "10m"
        },
        "memoryLimits": {
          "max": "150Mi",
          "min": "50Mi"
        }
      },
      "probes": {
        "liveness": {
          "path": "/-/healthz",
          "port": "http",
          "initialDelaySeconds": 15,
          "periodSeconds": 20,
          "timeoutSeconds": 1,
          "failureThreshold": 3
        },
        "readiness": {
          "path": "/-/ready",
          "port": "http",
          "initialDelaySeconds": 5,
          "periodSeconds": 10,
          "timeoutSeconds": 1,
          "successThreshold": 1,
          "failureThreshold": 3
        },
        "startup": {}
      },
      "tags": [
        "custom"
      ],
      "swaggerPath": "/documentation/json",
      "configMaps": [
        {
          "name": "messaging-configuration",
          "mountPath": "/home/node/app/messaging-service",
          "viewAsReadOnly": false
        }
      ],
      "createdAt": "2025-04-27T08:02:40.176Z",
      "containerPorts": [
        {
          "name": "http",
          "from": 80,
          "to": 3000
        }
      ],
      "terminationGracePeriodSeconds": 30
    },
    "payment-front-end": {
      "type": "custom",
      "advanced": false,
      "name": "payment-front-end",
      "dockerImage": "nexus.mia-platform.eu/plugins/payments-front-end:{{PAYMENT_FRONTEND_VERSION}}",
      "replicas": 1,
      "serviceAccountName": "payment-front-end",
      "logParser": "mia-json",
      "environment": [
        {
          "name": "HTTP_PORT",
          "valueType": "plain",
          "value": "8080"
        },
        {
          "name": "BASE_PATH",
          "valueType": "plain",
          "value": "/demo/"
        },
        {
          "name": "VITE_AXERVE_API_KEY",
          "valueType": "plain",
          "value": "{{AXERVE_API_KEY}}"
        },
        {
          "name": "VITE_AXERVE_SHOPLOGIN",
          "valueType": "plain",
          "value": "{{AXERVE_SHOP_LOGIN}}"
        },
        {
          "name": "VITE_ADYEN_KEY",
          "valueType": "plain",
          "value": "CHANGE ME"
        },
        {
          "name": "VITE_BRAINTREE_KEY",
          "valueType": "plain",
          "value": "{{BRAINTREE_TOKENIZATION_KEY}}"
        },
        {
          "name": "VITE_GOOGLE_MERCHANT_ID",
          "valueType": "plain",
          "value": "CHANGE ME"
        },
        {
          "name": "VITE_GOOGLE_MERCHANT_NAME",
          "valueType": "plain",
          "value": "CHANGE ME"
        },
        {
          "name": "VITE_POLLING_INTERVAL",
          "valueType": "plain",
          "value": "10000"
        },
        {
          "name": "CSP_HEADER",
          "valueType": "plain",
          "value": "\"default-src 'self'; script-src 'self' *.adyen.com/checkoutshopper/v2/analytics/id pay.google.com js.braintreegateway.com assets.braintreegateway.com www.paypalobjects.com c.paypal.com applepay.cdn-apple.com; object-src 'none'; style-src 'self' 'unsafe-inline'; img-src 'self' www.gstatic.com assets.braintreegateway.com checkout.paypal.com data: https://checkoutshopper-test.adyen.com; font-src 'self' applepay.cdn-apple.com; child-src 'self' assets.braintreegateway.com c.paypal.com; frame-src 'self' pay.google.com assets.braintreegateway.com c.paypal.com checkout.paypal.com *.cardinalcommerce.com https://checkoutshopper-test.adyen.com; connect-src 'self' https://sandbox.gestpay.net/api/v1/shop/token api.sandbox.braintreegateway.com client-analytics.sandbox.braintreegateway.com *.braintree-api.com *.adyen.com/checkoutshopper/v2/analytics/log *.adyen.com/checkoutshopper/v2/analytics/id *.adyen.com/checkoutshopper/v3/bin/binLookup\""
        },
        {
          "name": "VITE_DEMO_API_KEY",
          "valueType": "plain",
          "value": "CHANGE ME"
        }
      ],
      "annotations": [
        {
          "name": "mia-platform.eu/version",
          "value": "14.0.0",
          "description": "Version of Mia-Platform used by the project",
          "readOnly": true
        },
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
          "value": "payment-front-end",
          "description": "Name of the microservice, in the service selector",
          "readOnly": true,
          "isSelector": false
        },
        {
          "name": "app.kubernetes.io/name",
          "value": "payment-front-end",
          "description": "Name of the microservice",
          "readOnly": true,
          "isSelector": false
        },
        {
          "name": "app.kubernetes.io/version",
          "value": "{{PAYMENT_FRONTEND_VERSION}}",
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
          "value": "all-config",
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
          "value": "6b38a8ec-816c-487c-986d-c59edb294ea6",
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
          "min": "10m"
        },
        "memoryLimits": {
          "max": "150Mi",
          "min": "50Mi"
        }
      },
      "probes": {
        "liveness": {
          "path": "/-/healthz",
          "port": "http",
          "initialDelaySeconds": 15,
          "periodSeconds": 20,
          "timeoutSeconds": 1,
          "failureThreshold": 3
        },
        "readiness": {
          "path": "/-/ready",
          "port": "http",
          "initialDelaySeconds": 5,
          "periodSeconds": 10,
          "timeoutSeconds": 1,
          "successThreshold": 1,
          "failureThreshold": 3
        }
      },
      "tags": [
        "custom"
      ],
      "swaggerPath": "/documentation/json",
      "configMaps": [
        {
          "name": "payment-front-end",
          "mountPath": "/usr/static/config",
          "viewAsReadOnly": false
        }
      ],
      "createdAt": "2025-04-27T08:02:40.395Z",
      "containerPorts": [
        {
          "name": "http",
          "from": 80,
          "to": 8080,
          "protocol": "TCP"
        }
      ],
      "terminationGracePeriodSeconds": 30
    },
    "payment-gateway-manager": {
      "type": "custom",
      "advanced": false,
      "name": "payment-gateway-manager",
      "dockerImage": "nexus.mia-platform.eu/plugins/payment-gateway-manager:{{PGM_VERSION}}",
      "replicas": 1,
      "serviceAccountName": "payment-gateway-manager",
      "logParser": "mia-json",
      "environment": [
        {
          "name": "LOG_LEVEL",
          "valueType": "plain",
          "value": "{{LOG_LEVEL}}"
        },
        {
          "name": "HTTP_PORT",
          "valueType": "plain",
          "value": "3000"
        },
        {
          "name": "LOG_CONFIG_FILE",
          "valueType": "plain",
          "value": "./prod-logback.xml"
        },
        {
          "name": "ENABLED_PROVIDERS",
          "valueType": "plain",
          "value": "CHANGE ME"
        },
        {
          "name": "PAYMENT_CALLBACK_URL",
          "valueType": "plain",
          "value": "CHANGE ME"
        },
        {
          "name": "STRIPE_BASE_URL",
          "valueType": "plain",
          "value": "https://api.stripe.com"
        },
        {
          "name": "STRIPE_PRIVATE_KEY",
          "valueType": "plain",
          "value": "{{STRIPE_PRIVATE_KEY}}"
        },
        {
          "name": "SATISPAY_IS_SANDBOX",
          "valueType": "plain",
          "value": "CHANGE ME"
        },
        {
          "name": "SATISPAY_KEY_ID",
          "valueType": "plain",
          "value": "{{SATISPAY_KEY_ID}}"
        },
        {
          "name": "SATISPAY_PRIVATE_KEY",
          "valueType": "plain",
          "value": "{{SATISPAY_PRIVATE_KEY}}"
        },
        {
          "name": "SATISPAY_AFTER_BUY_WEB_REDIRECT_URL",
          "valueType": "plain",
          "value": "CHANGE ME"
        },
        {
          "name": "SATISPAY_AFTER_BUY_MOBILE_REDIRECT_URL",
          "valueType": "plain",
          "value": "CHANGE ME"
        },
        {
          "name": "SATISPAY_WAITING_SECONDS",
          "valueType": "plain",
          "value": "0"
        },
        {
          "name": "PGM_PUBLIC_URL",
          "valueType": "plain",
          "value": "https://{{PROJECT_HOST}}/payment-gateway-manager"
        },
        {
          "name": "FLOW_MANAGER_URL",
          "valueType": "plain",
          "value": "http://flow-manager-service"
        },
        {
          "name": "SAGA_CRUD_URL",
          "valueType": "plain",
          "value": "http://crud-service/fm-transactions/"
        },
        {
          "name": "BRAINTREE_MERCHANT_ID",
          "valueType": "plain",
          "value": "CHANGE ME"
        },
        {
          "name": "BRAINTREE_MERCHANT_ACCOUNT_ID",
          "valueType": "plain",
          "value": "CHANGE ME"
        },
        {
          "name": "BRAINTREE_PUBLIC_KEY",
          "valueType": "plain",
          "value": "CHANGE ME"
        },
        {
          "name": "BRAINTREE_PRIVATE_KEY",
          "valueType": "plain",
          "value": "{{BRAINTREE_PRIVATE_KEY}}"
        },
        {
          "name": "BRAINTREE_IS_SANDBOX",
          "valueType": "plain",
          "value": "CHANGE ME"
        },
        {
          "name": "SCALAPAY_BASE_PATH",
          "valueType": "plain",
          "value": "https://integration.api.scalapay.com/"
        },
        {
          "name": "SCALAPAY_API_KEY",
          "valueType": "plain",
          "value": "{{SCALAPAY_API_KEY}}"
        },
        {
          "name": "SCALAPAY_SUCCESS_REDIRECT_URL",
          "valueType": "plain",
          "value": "CHANGE ME"
        },
        {
          "name": "SCALAPAY_FAILURE_REDIRECT_URL",
          "valueType": "plain",
          "value": "CHANGE ME"
        },
        {
          "name": "SOISY_SHOP_ID",
          "valueType": "plain",
          "value": "CHANGE ME"
        },
        {
          "name": "SOISY_PARTNER_KEY",
          "valueType": "plain",
          "value": "{{SOISY_PARTNER_KEY}}"
        },
        {
          "name": "SOISY_BASE_URL",
          "valueType": "plain",
          "value": "CHANGE ME"
        },
        {
          "name": "HTTP_LOG_LEVEL",
          "valueType": "plain",
          "value": "BASIC"
        },
        {
          "name": "ADAPTIVE_CHECKOUT_CACHE_EXPIRE_MIN",
          "valueType": "plain",
          "value": "1"
        },
        {
          "name": "AXERVE_IS_SANDBOX",
          "valueType": "plain",
          "value": "CHANGE ME"
        },
        {
          "name": "AXERVE_SHOP_LOGIN",
          "valueType": "plain",
          "value": "{{AXERVE_SHOP_LOGIN}}"
        },
        {
          "name": "AXERVE_API_KEY",
          "valueType": "plain",
          "value": "{{AXERVE_API_KEY}}"
        },
        {
          "name": "EXTERNAL_PROVIDERS_CONFIG",
          "valueType": "plain",
          "value": "/config/external-providers.json"
        },
        {
          "name": "ADYEN_IS_TEST",
          "valueType": "plain",
          "value": "CHANGE ME"
        },
        {
          "name": "ADYEN_MERCHANT_ACCOUNT",
          "valueType": "plain",
          "value": "CHANGE ME"
        },
        {
          "name": "ADYEN_HMAC_KEY",
          "valueType": "plain",
          "value": "CHANGE ME"
        },
        {
          "name": "ADYEN_PRIVATE_KEY",
          "valueType": "plain",
          "value": "{{ADYEN_PRIVATE_KEY}}"
        },
        {
          "name": "SATISPAY_CALLBACK_URL",
          "valueType": "plain",
          "value": "https://{{PROJECT_HOST}}/callback-satispay"
        },
        {
          "name": "SUBSCRIPTION_HANDLER_URL",
          "valueType": "plain",
          "value": "http://subscription-handler-service"
        },
        {
          "name": "NEXI_BASE_URL",
          "valueType": "plain",
          "value": "https://stg-ta.nexigroup.com"
        },
        {
          "name": "NEXI_API_KEY",
          "valueType": "plain",
          "value": "{{NEXI_API_KEY}}"
        },
        {
          "name": "NEXI_CALLBACK_URL",
          "valueType": "plain",
          "value": "https://{{PROJECT_HOST}}/callback-nexi"
        },
        {
          "name": "FLOWPAY_API_BASE_URL",
          "valueType": "plain",
          "value": "https://core.c2c-development.flowpay.it"
        },
        {
          "name": "FLOWPAY_CORE_BASE_URL",
          "valueType": "plain",
          "value": "https://core.c2c-development.flowpay.it"
        },
        {
          "name": "FLOWPAY_CLIENT_ID",
          "valueType": "plain",
          "value": "{{FLOWPAY_CLIENT_ID}}"
        },
        {
          "name": "FLOWPAY_CLIENT_SECRET",
          "valueType": "plain",
          "value": "{{FLOWPAY_CLIENT_SECRET}}"
        },
        {
          "name": "FLOWPAY_PUBLIC_KEY",
          "valueType": "plain",
          "value": "{{FLOWPAY_PUBLIC_KEY}}"
        },
        {
          "name": "FLOWPAY_CHECKOUT_BASE_URL",
          "valueType": "plain",
          "value": "https://checkout.c2c-development.flowpay.it"
        },
        {
          "name": "FLOWPAY_CALLBACK_URL",
          "valueType": "plain",
          "value": "https://{{PROJECT_HOST}}/callback-flowpay"
        }
      ],
      "annotations": [
        {
          "name": "mia-platform.eu/version",
          "value": "14.0.0",
          "description": "Version of Mia-Platform used by the project",
          "readOnly": true
        },
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
          "value": "payment-gateway-manager",
          "description": "Name of the microservice, in the service selector",
          "readOnly": true,
          "isSelector": false
        },
        {
          "name": "app.kubernetes.io/name",
          "value": "payment-gateway-manager",
          "description": "Name of the microservice",
          "readOnly": true,
          "isSelector": false
        },
        {
          "name": "app.kubernetes.io/version",
          "value": "{{PGM_VERSION}}",
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
          "value": "all-config",
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
          "value": "6b38a8ec-816c-487c-986d-c59edb294ea6",
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
          "min": "50m"
        },
        "memoryLimits": {
          "max": "300Mi",
          "min": "150Mi"
        }
      },
      "probes": {
        "liveness": {
          "path": "/-/healthz",
          "port": "http",
          "initialDelaySeconds": 15,
          "periodSeconds": 20,
          "timeoutSeconds": 5,
          "successThreshold": 1,
          "failureThreshold": 3
        },
        "readiness": {
          "path": "/-/ready",
          "port": "http",
          "initialDelaySeconds": 5,
          "periodSeconds": 10,
          "timeoutSeconds": 5,
          "successThreshold": 1,
          "failureThreshold": 3
        },
        "startup": {}
      },
      "tags": [
        "custom"
      ],
      "swaggerPath": "/documentation/openapi.json",
      "configMaps": [
        {
          "name": "pgm-config",
          "mountPath": "/config",
          "viewAsReadOnly": false
        }
      ],
      "sourceComponentId": "payment-gateway-manager",
      "createdAt": "2025-04-27T08:02:40.610Z",
      "containerPorts": [
        {
          "name": "http",
          "from": 80,
          "to": 3000,
          "protocol": "TCP"
        }
      ],
      "terminationGracePeriodSeconds": 30
    },
    "pgm-bff": {
      "type": "custom",
      "advanced": false,
      "name": "pgm-bff",
      "dockerImage": "nexus.mia-platform.eu/fintech/pgm-bff:{{BFF_VERSION}}",
      "replicas": 1,
      "serviceAccountName": "pgm-bff",
      "logParser": "mia-json",
      "environment": [
        {
          "name": "HTTP_PORT",
          "valueType": "plain",
          "value": "8080"
        },
        {
          "name": "FLOW_MANAGER_URL",
          "valueType": "plain",
          "value": "http://flow-manager-service"
        },
        {
          "name": "PAYMENT_OK_REDIRECT_URL",
          "valueType": "plain",
          "value": "https://{{PROJECT_HOST}}/demo/result"
        },
        {
          "name": "PAYMENT_KO_REDIRECT_URL",
          "valueType": "plain",
          "value": "https://{{PROJECT_HOST}}/demo/result"
        },
        {
          "name": "PGM_URL",
          "valueType": "plain",
          "value": "http://payment-gateway-manager"
        },
        {
          "name": "INVOICE_SERVICE_URL",
          "valueType": "plain",
          "value": "http://invoice-service"
        },
        {
          "name": "FILES_SERVICE_URL",
          "valueType": "plain",
          "value": "http://files-service"
        },
        {
          "name": "SAGA_CRUD_URL",
          "valueType": "plain",
          "value": "http://crud-service/fm-transactions"
        },
        {
          "name": "INVOICE_CRUD_URL",
          "valueType": "plain",
          "value": "http://crud-service/invoices"
        },
        {
          "name": "PAYMENT_PENDING_REDIRECT_URL",
          "valueType": "plain",
          "value": "https://{{PROJECT_HOST}}/demo/pending"
        },
        {
          "name": "USERID_HEADER_KEY",
          "valueType": "plain",
          "value": "userid"
        },
        {
          "name": "GROUPS_HEADER_KEY",
          "valueType": "plain",
          "value": "usergroups"
        },
        {
          "name": "CLIENTTYPE_HEADER_KEY",
          "valueType": "plain",
          "value": "clienttype"
        },
        {
          "name": "BACKOFFICE_HEADER_KEY",
          "valueType": "plain",
          "value": "isbackoffice"
        },
        {
          "name": "MICROSERVICE_GATEWAY_SERVICE_NAME",
          "valueType": "plain",
          "value": "microservice-gateway"
        },
        {
          "name": "USER_PROPERTIES_HEADER_KEY",
          "valueType": "plain",
          "value": "userproperties"
        },
        {
          "name": "SUBSCRIPTION_HANDLER_SERVICE",
          "valueType": "plain",
          "value": "http://subscription-handler-service"
        },
        {
          "name": "PAY_BY_LINK_PROVIDER",
          "valueType": "plain",
          "value": "{{PROVIDER_PAY_BY_LINK}}"
        },
        {
          "name": "USERS_CRUD_URL",
          "valueType": "plain",
          "value": "http://crud-service/users"
        },
        {
          "name": "SAGA_SUBSCRIPTION_CRUD_URL",
          "valueType": "plain",
          "value": "http://crud-service/fm-subscriptions"
        },
        {
          "name": "ADAPTIVE_CHECKOUT_URL",
          "valueType": "plain",
          "value": "http://adaptive-approval"
        }
      ],
      "annotations": [
        {
          "name": "mia-platform.eu/version",
          "value": "14.0.0",
          "description": "Version of Mia-Platform used by the project",
          "readOnly": true
        },
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
          "value": "pgm-bff",
          "description": "Name of the microservice, in the service selector",
          "readOnly": true,
          "isSelector": false
        },
        {
          "name": "app.kubernetes.io/name",
          "value": "pgm-bff",
          "description": "Name of the microservice",
          "readOnly": true,
          "isSelector": false
        },
        {
          "name": "app.kubernetes.io/version",
          "value": "{{BFF_VERSION}}",
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
          "value": "all-config",
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
          "value": "6b38a8ec-816c-487c-986d-c59edb294ea6",
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
          "min": "10m"
        },
        "memoryLimits": {
          "max": "150Mi",
          "min": "100Mi"
        }
      },
      "probes": {
        "liveness": {
          "path": "/-/healthz",
          "port": "http",
          "initialDelaySeconds": 15,
          "periodSeconds": 20,
          "timeoutSeconds": 1,
          "failureThreshold": 3
        },
        "readiness": {
          "path": "/-/ready",
          "port": "http",
          "initialDelaySeconds": 5,
          "periodSeconds": 10,
          "timeoutSeconds": 1,
          "successThreshold": 1,
          "failureThreshold": 3
        }
      },
      "tags": [
        "custom"
      ],
      "swaggerPath": "/documentation/json",
      "createdAt": "2025-04-27T08:02:41.210Z",
      "containerPorts": [
        {
          "name": "http",
          "from": 80,
          "to": 8080,
          "protocol": "TCP"
        }
      ],
      "terminationGracePeriodSeconds": 30
    },
    "sms-service": {
      "type": "custom",
      "advanced": false,
      "name": "sms-service",
      "dockerImage": "nexus.mia-platform.eu/plugins/sms-service:1.2.1",
      "replicas": 1,
      "serviceAccountName": "sms-service",
      "logParser": "mia-json",
      "environment": [
        {
          "name": "LOG_LEVEL",
          "valueType": "plain",
          "value": "{{LOGS}}"
        },
        {
          "name": "TRUSTED_PROXIES",
          "valueType": "plain",
          "value": "10.0.0.0/8,172.16.0.0/12,192.168.0.0/16"
        },
        {
          "name": "HTTP_PORT",
          "valueType": "plain",
          "value": "3000"
        },
        {
          "name": "USERID_HEADER_KEY",
          "valueType": "plain",
          "value": "miauserid"
        },
        {
          "name": "GROUPS_HEADER_KEY",
          "valueType": "plain",
          "value": "miausergroups"
        },
        {
          "name": "CLIENTTYPE_HEADER_KEY",
          "valueType": "plain",
          "value": "client-type"
        },
        {
          "name": "BACKOFFICE_HEADER_KEY",
          "valueType": "plain",
          "value": "isbackoffice"
        },
        {
          "name": "MICROSERVICE_GATEWAY_SERVICE_NAME",
          "valueType": "plain",
          "value": "microservice-gateway"
        },
        {
          "name": "USER_PROPERTIES_HEADER_KEY",
          "valueType": "plain",
          "value": "miauserproperties"
        },
        {
          "name": "SERVICE_PROVIDER",
          "valueType": "plain",
          "value": "twilio"
        },
        {
          "name": "TWILIO_ACCOUNT_SID",
          "valueType": "plain",
          "value": "CHANGE ME"
        },
        {
          "name": "TWILIO_AUTH_TOKEN",
          "valueType": "plain",
          "value": "{{SMS_AUTH_TOKEN}}"
        },
        {
          "name": "TWILIO_EMPTY_BALANCE_CHECK",
          "valueType": "plain",
          "value": "true"
        },
        {
          "name": "RATE_LIMIT_MAX_REQUESTS",
          "valueType": "plain",
          "value": "3"
        },
        {
          "name": "RATE_LIMIT_TIME_WINDOW",
          "valueType": "plain",
          "value": "60000"
        }
      ],
      "annotations": [
        {
          "name": "mia-platform.eu/version",
          "value": "14.0.0",
          "description": "Version of Mia-Platform used by the project",
          "readOnly": true
        },
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
          "value": "sms-service",
          "description": "Name of the microservice, in the service selector",
          "readOnly": true,
          "isSelector": false
        },
        {
          "name": "app.kubernetes.io/name",
          "value": "sms-service",
          "description": "Name of the microservice",
          "readOnly": true,
          "isSelector": false
        },
        {
          "name": "app.kubernetes.io/version",
          "value": "1.2.1",
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
          "value": "all-config",
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
          "value": "6b38a8ec-816c-487c-986d-c59edb294ea6",
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
          "min": "10m"
        },
        "memoryLimits": {
          "max": "150Mi",
          "min": "50Mi"
        }
      },
      "probes": {
        "liveness": {
          "path": "/-/healthz",
          "port": "http",
          "initialDelaySeconds": 15,
          "periodSeconds": 20,
          "timeoutSeconds": 1,
          "failureThreshold": 3
        },
        "readiness": {
          "path": "/-/ready",
          "port": "http",
          "initialDelaySeconds": 5,
          "periodSeconds": 10,
          "timeoutSeconds": 1,
          "successThreshold": 1,
          "failureThreshold": 3
        },
        "startup": {}
      },
      "tags": [
        "custom"
      ],
      "swaggerPath": "/documentation/json",
      "createdAt": "2025-04-27T08:02:41.443Z",
      "containerPorts": [
        {
          "name": "http",
          "from": 80,
          "to": 3000
        }
      ],
      "terminationGracePeriodSeconds": 30
    },
    "smtp-mail-notification-service": {
      "type": "custom",
      "advanced": false,
      "name": "smtp-mail-notification-service",
      "dockerImage": "nexus.mia-platform.eu/plugins/smtp-mail-notification-service:3.3.0",
      "replicas": 1,
      "serviceAccountName": "smtp-mail-notification-service",
      "logParser": "mia-json",
      "environment": [
        {
          "name": "HOST",
          "valueType": "plain",
          "value": "CHANGE ME"
        },
        {
          "name": "PORT",
          "valueType": "plain",
          "value": "CHANGE ME"
        },
        {
          "name": "AUTH_TYPE",
          "valueType": "plain",
          "value": "login"
        },
        {
          "name": "AUTH_USER",
          "valueType": "plain",
          "value": "{{EMAIL_SENDER}}"
        },
        {
          "name": "AUTH_PASS",
          "valueType": "plain",
          "value": "{{EMAIL_AUTH_PASSWORD}}"
        },
        {
          "name": "TLS_SECURE",
          "valueType": "plain",
          "value": "true"
        },
        {
          "name": "TLS_IGNORE",
          "valueType": "plain",
          "value": "true"
        }
      ],
      "annotations": [
        {
          "name": "mia-platform.eu/version",
          "value": "14.0.0",
          "description": "Version of Mia-Platform used by the project",
          "readOnly": true
        },
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
          "value": "smtp-mail-notification-service",
          "description": "Name of the microservice, in the service selector",
          "readOnly": true,
          "isSelector": false
        },
        {
          "name": "app.kubernetes.io/name",
          "value": "smtp-mail-notification-service",
          "description": "Name of the microservice",
          "readOnly": true,
          "isSelector": false
        },
        {
          "name": "app.kubernetes.io/version",
          "value": "3.3.0",
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
          "value": "all-config",
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
          "value": "6b38a8ec-816c-487c-986d-c59edb294ea6",
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
          "min": "10m"
        },
        "memoryLimits": {
          "max": "150Mi",
          "min": "50Mi"
        }
      },
      "probes": {
        "liveness": {
          "path": "/-/healthz",
          "port": "http",
          "initialDelaySeconds": 15,
          "periodSeconds": 20,
          "timeoutSeconds": 5,
          "successThreshold": 1,
          "failureThreshold": 3
        },
        "readiness": {
          "path": "/-/ready",
          "port": "http",
          "initialDelaySeconds": 5,
          "periodSeconds": 10,
          "timeoutSeconds": 5,
          "successThreshold": 1,
          "failureThreshold": 3
        },
        "startup": {}
      },
      "tags": [
        "custom"
      ],
      "swaggerPath": "/documentation/json",
      "sourceComponentId": "smtp-mail-notification-service",
      "createdAt": "2025-04-27T08:02:41.633Z",
      "containerPorts": [
        {
          "name": "http",
          "from": 80,
          "to": 3000,
          "protocol": "TCP"
        }
      ],
      "terminationGracePeriodSeconds": 30
    },
    "subscription-handler-service": {
      "type": "custom",
      "advanced": false,
      "name": "subscription-handler-service",
      "dockerImage": "nexus.mia-platform.eu/fintech/subscription-handler:{{SUB_HANDLER_VERSION}}",
      "replicas": 1,
      "serviceAccountName": "subscription-handler-service",
      "logParser": "mia-json",
      "description": "Handles the entire subscriptions' lifecycle ",
      "environment": [
        {
          "name": "HTTP_PORT",
          "valueType": "plain",
          "value": "8080"
        },
        {
          "name": "LOG_LEVEL",
          "valueType": "plain",
          "value": "{{LOGS}}"
        },
        {
          "name": "USERID_HEADER_KEY",
          "valueType": "plain",
          "value": "miauserid"
        },
        {
          "name": "USER_PROPERTIES_HEADER_KEY",
          "valueType": "plain",
          "value": "miauserproperties"
        },
        {
          "name": "GROUPS_HEADER_KEY",
          "valueType": "plain",
          "value": "miausergroups"
        },
        {
          "name": "CLIENTTYPE_HEADER_KEY",
          "valueType": "plain",
          "value": "client-type"
        },
        {
          "name": "BACKOFFICE_HEADER_KEY",
          "valueType": "plain",
          "value": "isbackoffice"
        },
        {
          "name": "MICROSERVICE_GATEWAY_SERVICE_NAME",
          "valueType": "plain",
          "value": "microservice-gateway"
        },
        {
          "name": "ADDITIONAL_HEADERS_TO_PROXY",
          "valueType": "plain",
          "value": ""
        },
        {
          "name": "SUBSCRIPTIONS_FLOW_MANAGER_URL",
          "valueType": "plain",
          "value": "http://subscription-saga"
        },
        {
          "name": "PAYMENTS_FLOW_MANAGER_URL",
          "valueType": "plain",
          "value": "http://flow-manager-service"
        },
        {
          "name": "PAYMENTS_CRUD_URL",
          "valueType": "plain",
          "value": "http://crud-service/fm-transactions"
        },
        {
          "name": "SUBSCRIPTIONS_CRUD_URL",
          "valueType": "plain",
          "value": "http://crud-service/fm-subscriptions"
        },
        {
          "name": "RUNNING_INTERVAL_CRON",
          "valueType": "plain",
          "value": "120s"
        },
        {
          "name": "ENABLED_STATES",
          "valueType": "plain",
          "value": "ACTIVE,PAYMENT_FAILED"
        },
        {
          "name": "MANUAL_PROVIDERS",
          "valueType": "plain",
          "value": "satispay,axerve,adyen"
        },
        {
          "name": "PGM_URL",
          "valueType": "plain",
          "value": "http://payment-gateway-manager"
        }
      ],
      "annotations": [
        {
          "name": "mia-platform.eu/version",
          "value": "14.0.0",
          "description": "Version of Mia-Platform used by the project",
          "readOnly": true
        },
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
          "value": "subscription-handler-service",
          "description": "Name of the microservice, in the service selector",
          "readOnly": true,
          "isSelector": false
        },
        {
          "name": "app.kubernetes.io/name",
          "value": "subscription-handler-service",
          "description": "Name of the microservice",
          "readOnly": true,
          "isSelector": false
        },
        {
          "name": "app.kubernetes.io/version",
          "value": "{{SUB_HANDLER_VERSION}}",
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
          "value": "all-config",
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
          "value": "6b38a8ec-816c-487c-986d-c59edb294ea6",
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
          "min": "10m"
        },
        "memoryLimits": {
          "max": "100Mi",
          "min": "50Mi"
        }
      },
      "probes": {
        "liveness": {
          "path": "/-/healthz",
          "port": "http",
          "initialDelaySeconds": 15,
          "periodSeconds": 20,
          "timeoutSeconds": 1,
          "failureThreshold": 3
        },
        "readiness": {
          "path": "/-/ready",
          "port": "http",
          "initialDelaySeconds": 5,
          "periodSeconds": 10,
          "timeoutSeconds": 1,
          "successThreshold": 1,
          "failureThreshold": 3
        }
      },
      "tags": [
        "custom"
      ],
      "swaggerPath": "/documentation/json",
      "createdAt": "2025-04-27T08:02:41.882Z",
      "containerPorts": [
        {
          "name": "http",
          "from": 80,
          "to": 8080,
          "protocol": "TCP"
        }
      ],
      "terminationGracePeriodSeconds": 30
    },
    "subscription-saga": {
      "type": "custom",
      "advanced": false,
      "name": "subscription-saga",
      "dockerImage": "nexus.mia-platform.eu/core/flow-manager:2.6.5",
      "replicas": 1,
      "serviceAccountName": "subscription-saga",
      "logParser": "mia-json",
      "description": "The Flow Manager is a saga orchestrator, capable to manage flows structured by using the Architectural pattern named Saga Pattern",
      "environment": [
        {
          "name": "LOG_LEVEL",
          "valueType": "plain",
          "value": "{{LOG_LEVEL}}"
        },
        {
          "name": "HTTP_PORT",
          "valueType": "plain",
          "value": "3000"
        },
        {
          "name": "USERID_HEADER_KEY",
          "valueType": "plain",
          "value": "miauserid"
        },
        {
          "name": "GROUPS_HEADER_KEY",
          "valueType": "plain",
          "value": "miausergroups"
        },
        {
          "name": "CLIENTTYPE_HEADER_KEY",
          "valueType": "plain",
          "value": "miaclienttype"
        },
        {
          "name": "BACKOFFICE_HEADER_KEY",
          "valueType": "plain",
          "value": "isbackoffice"
        },
        {
          "name": "USER_PROPERTIES_HEADER_KEY",
          "valueType": "plain",
          "value": "miauserproperties"
        },
        {
          "name": "MICROSERVICE_GATEWAY_SERVICE_NAME",
          "valueType": "plain",
          "value": "microservice-gateway"
        },
        {
          "name": "CONFIGURATIONS_FILE_PATH",
          "valueType": "plain",
          "value": "/configuration/saga.json"
        },
        {
          "name": "SAGA_ID_PREFIX",
          "valueType": "plain",
          "value": "sb"
        }
      ],
      "annotations": [
        {
          "name": "mia-platform.eu/version",
          "value": "14.0.0",
          "description": "Version of Mia-Platform used by the project",
          "readOnly": true
        },
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
          "value": "subscription-saga",
          "description": "Name of the microservice, in the service selector",
          "readOnly": true,
          "isSelector": false
        },
        {
          "name": "app.kubernetes.io/name",
          "value": "subscription-saga",
          "description": "Name of the microservice",
          "readOnly": true,
          "isSelector": false
        },
        {
          "name": "app.kubernetes.io/version",
          "value": "2.6.5",
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
          "value": "all-config",
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
          "value": "6b38a8ec-816c-487c-986d-c59edb294ea6",
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
          "min": "10m"
        },
        "memoryLimits": {
          "max": "150Mi",
          "min": "100Mi"
        }
      },
      "probes": {
        "liveness": {
          "path": "/-/healthz",
          "port": "http",
          "initialDelaySeconds": 15,
          "periodSeconds": 20,
          "timeoutSeconds": 1,
          "failureThreshold": 3
        },
        "readiness": {
          "path": "/-/ready",
          "port": "http",
          "initialDelaySeconds": 5,
          "periodSeconds": 10,
          "timeoutSeconds": 1,
          "successThreshold": 1,
          "failureThreshold": 3
        },
        "startup": {}
      },
      "tags": [
        "custom"
      ],
      "swaggerPath": "/documentation/json",
      "configMaps": [
        {
          "name": "subscription-saga-configuration",
          "mountPath": "/configuration",
          "viewAsReadOnly": false
        }
      ],
      "sourceComponentId": "flow-manager",
      "createdAt": "2025-04-27T08:02:42.091Z",
      "containerPorts": [
        {
          "name": "http",
          "from": 80,
          "to": 3000,
          "protocol": "TCP"
        }
      ],
      "terminationGracePeriodSeconds": 30
    },
    "my-lambda-function": {
      "name": "my-lambda-function",
      "type": "custom-resource",
      "meta": {
        "kind": "LambdaTemplateGenerator",
        "apiVersion": "custom-generator.console.mia-platform.eu/v1"
      },
      "spec": {
        "memorySize": 1024,
        "role": "my-function-role",
        "targetRuntime": "nodejs20.x",
        "timeout": 60,
        "zipCode": "'use strict';\nexports.handler = async (event) => {\n  console.log('Received event:', JSON.stringify(event, null, 2));\n  return { statusCode: 200, body: JSON.stringify('Hello from Lambda!') };\n};\n"
      },
      "generatedFrom": {
        "_id": "663e28a2ffe0f520ec6d7047"
      },
      "sourceMarketplaceItem": {
        "itemId": "lambda-function-template",
        "version": "NA",
        "tenantId": "6b38a8ec-816c-487c-986d-c59edb294ea6"
      }
    },
    "testproxy": {
      "name": "testproxy",
      "url": "https://www.google.com",
      "type": "external",
      "headers": [
        {
          "name": "HEADER",
          "value": "value",
          "description": "Test Header"
        }
      ]
    },
    "micro-lc": {
      "type": "custom",
      "advanced": false,
      "name": "micro-lc",
      "dockerImage": "nexus.mia-platform.eu/microlc/middleware:3.4.0",
      "replicas": 1,
      "serviceAccountName": "micro-lc",
      "logParser": "mia-json",
      "description": "micro-lc config server.",
      "environment": [
        {
          "name": "HTTP_PORT",
          "valueType": "plain",
          "value": "3000"
        },
        {
          "name": "LOG_LEVEL",
          "valueType": "plain",
          "value": "{{LOG_LEVEL}}"
        },
        {
          "name": "MICROSERVICE_GATEWAY_SERVICE_NAME",
          "valueType": "plain",
          "value": "microservice-gateway"
        },
        {
          "name": "TRUSTED_PROXIES",
          "valueType": "plain",
          "value": "10.0.0.0/8,172.16.0.0/12,192.168.0.0/16"
        },
        {
          "name": "USERID_HEADER_KEY",
          "valueType": "plain",
          "value": "miauserid"
        },
        {
          "name": "GROUPS_HEADER_KEY",
          "valueType": "plain",
          "value": "miausergroups"
        },
        {
          "name": "CLIENTTYPE_HEADER_KEY",
          "valueType": "plain",
          "value": "client-type"
        },
        {
          "name": "BACKOFFICE_HEADER_KEY",
          "valueType": "plain",
          "value": "isbackoffice"
        },
        {
          "name": "USER_PROPERTIES_HEADER_KEY",
          "valueType": "plain",
          "value": "miauserproperties"
        }
      ],
      "annotations": [
        {
          "name": "mia-platform.eu/version",
          "value": "14.0.0",
          "description": "Version of Mia-Platform used by the project",
          "readOnly": true
        },
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
          "value": "micro-lc",
          "description": "Name of the microservice, in the service selector",
          "readOnly": true,
          "isSelector": false
        },
        {
          "name": "app.kubernetes.io/name",
          "value": "micro-lc",
          "description": "Name of the microservice",
          "readOnly": true,
          "isSelector": false
        },
        {
          "name": "app.kubernetes.io/version",
          "value": "3.4.0",
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
          "value": "all-config",
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
          "value": "6b38a8ec-816c-487c-986d-c59edb294ea6",
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
          "min": "20m"
        },
        "memoryLimits": {
          "max": "150Mi",
          "min": "60Mi"
        }
      },
      "probes": {
        "liveness": {
          "path": "/-/healthz",
          "port": "http",
          "initialDelaySeconds": 15,
          "periodSeconds": 20,
          "timeoutSeconds": 5,
          "failureThreshold": 3
        },
        "readiness": {
          "path": "/-/ready",
          "port": "http",
          "initialDelaySeconds": 5,
          "periodSeconds": 10,
          "timeoutSeconds": 5,
          "successThreshold": 1,
          "failureThreshold": 3
        },
        "startup": {}
      },
      "tags": [
        "custom"
      ],
      "swaggerPath": "",
      "configMaps": [
        {
          "name": "micro-lc-static-files",
          "mountPath": "/usr/static/public",
          "viewAsReadOnly": true,
          "link": {
            "targetSection": "microfrontend-composer/micro-lc"
          }
        },
        {
          "name": "micro-lc-configurations",
          "mountPath": "/usr/static/configurations",
          "viewAsReadOnly": true,
          "link": {
            "targetSection": "microfrontend-composer/micro-lc"
          }
        },
        {
          "name": "micro-lc-server-configuration",
          "mountPath": "/usr/src/app/config",
          "viewAsReadOnly": true,
          "link": {
            "targetSection": "microfrontend-composer/micro-lc"
          }
        },
        {
          "name": "micro-lc-assets",
          "mountPath": "/usr/static/public/assets"
        }
      ],
      "sourceComponentId": "backoffice-backend",
      "links": [
        {
          "label": "Microfrontend Composer",
          "enableIf": "ENABLE_BACKOFFICE_CONFIGURATOR",
          "targetSection": "microfrontend-composer"
        }
      ],
      "createdAt": "2025-04-27T08:10:25.363Z",
      "containerPorts": [
        {
          "name": "http",
          "from": 80,
          "to": 3000,
          "protocol": "TCP"
        }
      ],
      "terminationGracePeriodSeconds": 30
    }
  },
  "applications": {
    "payment-integration-hub": {
      "name": "payment-integration-hub",
      "description": "This application provides a backoffice instance with two pages already configured for manage and monitoring payments created with all micro services needed to start and managed payments, such as payment gateway manager, notification service and invoice download service.",
      "generatedFrom": "63ee651d108aa129a0dd5266",
      "resources": {
        "services": {
          "api-gateway": {
            "name": "api-gateway"
          },
          "adaptive-approval": {
            "name": "adaptive-approval"
          },
          "analytics-transactions": {
            "name": "analytics-transactions"
          },
          "crud-service": {
            "name": "crud-service"
          },
          "data-visualization-backend": {
            "name": "data-visualization-backend"
          },
          "data-visualization-frontend": {
            "name": "data-visualization-frontend"
          },
          "export-service": {
            "name": "export-service"
          },
          "files-service": {
            "name": "files-service"
          },
          "flow-manager-service": {
            "name": "flow-manager-service"
          },
          "frullino-service": {
            "name": "frullino-service"
          },
          "invoice-service": {
            "name": "invoice-service"
          },
          "messaging-service": {
            "name": "messaging-service"
          },
          "payment-front-end": {
            "name": "payment-front-end"
          },
          "payment-gateway-manager": {
            "name": "payment-gateway-manager"
          },
          "pgm-bff": {
            "name": "pgm-bff"
          },
          "sms-service": {
            "name": "sms-service"
          },
          "smtp-mail-notification-service": {
            "name": "smtp-mail-notification-service"
          },
          "subscription-handler-service": {
            "name": "subscription-handler-service"
          },
          "subscription-saga": {
            "name": "subscription-saga"
          }
        },
        "endpoints": {
          "/analytics": {
            "basePath": "/analytics",
            "service": "analytics-transactions"
          },
          "/adaptive-checkout": {
            "basePath": "/adaptive-checkout",
            "service": "crud-service"
          },
          "/api/charts/dashboards": {
            "basePath": "/api/charts/dashboards",
            "service": "data-visualization-backend"
          },
          "/data-visualization": {
            "basePath": "/data-visualization",
            "service": "data-visualization-frontend"
          },
          "/export": {
            "basePath": "/export",
            "service": "export-service"
          },
          "/fm": {
            "basePath": "/fm",
            "service": "flow-manager-service"
          },
          "/demo": {
            "basePath": "/demo",
            "service": "payment-front-end"
          },
          "/callback-adyen": {
            "basePath": "/callback-adyen",
            "service": "payment-gateway-manager"
          },
          "/callback-axerve": {
            "basePath": "/callback-axerve",
            "service": "payment-gateway-manager"
          },
          "/callback-braintree": {
            "basePath": "/callback-braintree",
            "service": "payment-gateway-manager"
          },
          "/callback-flowpay": {
            "basePath": "/callback-flowpay",
            "service": "payment-gateway-manager"
          },
          "/callback-nexi": {
            "basePath": "/callback-nexi",
            "service": "payment-gateway-manager"
          },
          "/callback-satispay": {
            "basePath": "/callback-satispay",
            "service": "payment-gateway-manager"
          },
          "/callback-scalapay": {
            "basePath": "/callback-scalapay",
            "service": "payment-gateway-manager"
          },
          "/callback-soisy": {
            "basePath": "/callback-soisy",
            "service": "payment-gateway-manager"
          },
          "/callback-stripe": {
            "basePath": "/callback-stripe",
            "service": "payment-gateway-manager"
          },
          "/": {
            "basePath": "/",
            "service": "pgm-bff"
          }
        },
        "collections": {
          "fm_subscriptions": {
            "name": "fm_subscriptions"
          },
          "fm_transactions": {
            "name": "fm_transactions"
          },
          "invoices": {
            "name": "invoices"
          },
          "notification_templates": {
            "name": "notification_templates"
          },
          "rules": {
            "name": "rules"
          },
          "users": {
            "name": "users"
          }
        },
        "unsecretedVariables": {
          "ANALYTICS_TRANSACTIONS_VERSION": {
            "name": "ANALYTICS_TRANSACTIONS_VERSION"
          },
          "BFF_VERSION": {
            "name": "BFF_VERSION"
          },
          "CRUD_SERVICE_VERSION": {
            "name": "CRUD_SERVICE_VERSION"
          },
          "DATA_VIZ_BE_VERSION": {
            "name": "DATA_VIZ_BE_VERSION"
          },
          "DATA_VIZ_FE_VERSION": {
            "name": "DATA_VIZ_FE_VERSION"
          },
          "EMAIL_SENDER": {
            "name": "EMAIL_SENDER"
          },
          "FRULLINO_VERSION": {
            "name": "FRULLINO_VERSION"
          },
          "LOGS": {
            "name": "LOGS"
          },
          "MESSAGING_SERVICE_VERSION": {
            "name": "MESSAGING_SERVICE_VERSION"
          },
          "NOTIFICATION_TEMPLATE_IDS": {
            "name": "NOTIFICATION_TEMPLATE_IDS"
          },
          "PAYMENT_FRONTEND_VERSION": {
            "name": "PAYMENT_FRONTEND_VERSION"
          },
          "PGM_VERSION": {
            "name": "PGM_VERSION"
          },
          "PROJECT_HOST": {
            "name": "PROJECT_HOST"
          },
          "PROVIDER_PAY_BY_LINK": {
            "name": "PROVIDER_PAY_BY_LINK"
          },
          "SUB_HANDLER_VERSION": {
            "name": "SUB_HANDLER_VERSION"
          }
        }
      }
    },
    "microfrontend-composer-toolkit": {
      "name": "microfrontend-composer-toolkit",
      "description": "Use this application to set up Microfrontend Composer to build your frontend in a few clicks",
      "generatedFrom": "6569c63b8e27423597fce41f",
      "resources": {
        "services": {
          "api-gateway": {
            "name": "api-gateway"
          },
          "micro-lc": {
            "name": "micro-lc"
          }
        },
        "endpoints": {
          "/mfe-application": {
            "basePath": "/mfe-application",
            "service": "micro-lc"
          },
          "/micro-lc-configurations": {
            "basePath": "/micro-lc-configurations",
            "service": "micro-lc"
          }
        },
        "unsecretedVariables": {
          "BACK_KIT_VERSION": {
            "name": "BACK_KIT_VERSION"
          }
        }
      }
    }
  },
  "listeners": {
    "frontend": {
      "name": "frontend",
      "port": 8080,
      "description": "Default listener for frontend API",
      "selectedByDefault": true
    }
  },
  "apiVersions": [],
  "version": "0.61.0",
  "platformVersion": "14.0.0",
  "lastConfigFileCommitId": "21f2c602-dace-42cf-93c6-bab28a99a046",
  "lastCommitAuthor": "Giulio Roggero",
  "commitId": "21f2c602-dace-42cf-93c6-bab28a99a046",
  "committedDate": "2025-04-27T08:12:00.393Z",
  "configMaps": {
    "api-gateway-envoy-config": {
      "name": "api-gateway-envoy-config",
      "files": []
    },
    "transactions-analytics": {
      "name": "transactions-analytics",
      "files": [
        {
          "name": "amount-transactions-by-day-last-year.js",
          "content": "\"use strict\";  module.exports = {   tags: [\"Profiles\"],   name: \"amount-transactions-by-day-last-year\",   parameters: [],   inputFormatter: function t(query, params) {     return { ...query, ...params }       },   query: {     collectionName: \"fm_transactions\",     aggregationFunction: function t(params) {       return [         {           $match: {             __STATE__: \"PUBLIC\",              createdAt: {               $lt: new Date(new Date() - 1000*60*60*24*365),                $gt: new Date(new Date() - 1000*60*60*24*365*2)             },             businessStateDescription: \"PAYMENT_PAID\"           }         }, {           $project: {             dateToGroup: {               $dateToString: {                 format: \"%Y-%m-%d\",                  date: \"$createdAt\"               }             },              amount: \"$metadata.amount\"           }         }, {           $group: {             _id: \"$dateToGroup\",              total: {               $sum: \"$amount\"             }           }         }, {           $sort: {             _id: 1           }         }, {           $project: {             total: {               $divide: [                 \"$total\",                 100               ]             },              fakeTimestamp: {               $toLong: {                 $dateAdd: {                   startDate: {                     $toDate: \"$_id\"                   },                    unit: \"year\",                    amount: 1                 }               }             }           }         }       ]     }   },   castInterpolatedPipeline: function t(pipeline) {     return pipeline   },   outputFormatter: function t(doc, format, input) {     return [doc.fakeTimestamp, doc.total]   } };"
        },
        {
          "name": "amount-transactions-by-day-this-year.js",
          "content": "\"use strict\";  module.exports = {   tags: [\"Profiles\"],   name: \"amount-transactions-by-day-this-year\",   parameters: [],   inputFormatter: function t(query, params) {     return { ...query, ...params }       },   query: {     collectionName: \"fm_transactions\",     aggregationFunction: function t(params) {       return [         {           $match: {             __STATE__: \"PUBLIC\",              createdAt: {               $gt: new Date(new Date() - 1000*60*60*24*365)             },             businessStateDescription: \"PAYMENT_PAID\"           }         }, {           $project: {             dateToGroup: {               $dateToString: {                 format: \"%Y-%m-%d\",                  date: \"$createdAt\"               }             },              amount: \"$metadata.amount\"           }         }, {           $group: {             _id: \"$dateToGroup\",              total: {               $sum: \"$amount\"             }           }         }, {           $sort: {             _id: 1           }         }, {           $project: {             total: {               $divide: [                 \"$total\",                 100               ]             },              timestamp: {               $toLong: {                 $toDate: \"$_id\"               }             }           }         }       ]     }   },   castInterpolatedPipeline: function t(pipeline) {     return pipeline   },   outputFormatter: function t(doc, format, input) {     return [doc.timestamp, doc.total]   } };"
        },
        {
          "name": "amount-by-method.js",
          "content": "\"use strict\";  module.exports = {   tags: [\"Profiles\"],   name: \"amount-by-method\",   parameters: [{     type: \"string\",     name: \"transactionDateFrom\",     required: false   }, {     type: \"string\",     name: \"transactionDateTo\",     required: false   }],   inputFormatter: function t(query, params) {     return { ...query, ...params }   },   query: {     collectionName: \"fm_transactions\",     aggregationFunction: function t(params) {       return [{         $match: {           __STATE__: \"PUBLIC\",           businessStateDescription: \"PAYMENT_PAID\"         }       }, {         '#matchWithFilters#': [{           requiredParameters: [\"transactionDateFrom\", \"transactionDateTo\"],           query: {             createdAt: {               $gt: new Date(params.transactionDateFrom),               $lt: new Date(params.transactionDateTo)             }           }         }]       }, {         $group: {           _id: \"$metadata.paymentMethod\",           total: {             $sum: \"$metadata.amount\"           }         }       }, {         $set: {           total: {             $divide: [               \"$total\",               100             ]           },           method: {             $switch: {               branches: [                 {                   case: {                     $eq: [\"$_id\", \"applepay\"]                   },                   then: \"Apple Pay\"                 },                 {                   case: {                     $eq: [\"$_id\", \"credit-cards\"]                   },                   then: \"Credit Card\"                 },                 {                   case: {                     $eq: [\"$_id\", \"googlepay\"]                   },                   then: \"Google Pay\"                 },                 {                   case: {                     $eq: [\"$_id\", \"pay-pal\"]                   },                   then: \"PayPal\"                 },                 {                   case: {                     $eq: [\"$_id\", \"safecharge\"]                   },                   then: \"Safecharge\"                 },                 {                   case: {                     $eq: [\"$_id\", \"satispay\"]                   },                   then: \"Satispay\"                 },                 {                   case: {                     $eq: [\"$_id\", \"scalapay\"]                   },                   then: \"Scalapay\"                 },                 {                   case: {                     $eq: [\"$_id\", \"soisy\"]                   },                   then: \"Soisy\"                 },               ],               default: \"$_id\"             }           }         }       }, {         $sort: {           method: 1         }       }]     }   },   castInterpolatedPipeline: function t(pipeline) {     return pipeline   },   outputFormatter: function t(doc, format, input) {     return [doc.method, doc.total]   } };"
        },
        {
          "name": "amount-by-channel.js",
          "content": "\"use strict\";  module.exports = {   tags: [\"Profiles\"],   name: \"amount-by-channel\",   parameters: [{     type: \"string\",     name: \"transactionDateFrom\",     required: false   }, {     type: \"string\",     name: \"transactionDateTo\",     required: false   }],   inputFormatter: function t(query, params) {     return { ...query, ...params }   },   query: {     collectionName: \"fm_transactions\",     aggregationFunction: function t(params) {       return [{         $match: {           __STATE__: \"PUBLIC\",           businessStateDescription: \"PAYMENT_PAID\"         }       }, {         '#matchWithFilters#': [{           requiredParameters: [\"transactionDateFrom\", \"transactionDateTo\"],           query: {             createdAt: {               $gt: new Date(params.transactionDateFrom),               $lt: new Date(params.transactionDateTo)             }           }         }]       }, {         $group: {           _id: \"$metadata.additionalData.channel\",           total: {             $sum: \"$metadata.amount\"           }         }       }, {         $set: {           total: {             $divide: [               \"$total\",               100             ]           },           channel: {             $switch: {               branches: [                 {                   case: {                     $eq: [\"$_id\", null]                   },                   then: \"unknown\"                 }               ],               default: \"$_id\"             }           }         }       }, {         $sort: {           channel: 1         }       }]     }   },   castInterpolatedPipeline: function t(pipeline) {     return pipeline   },   outputFormatter: function t(doc, format, input) {     return [doc.channel, doc.total]   } };"
        },
        {
          "name": "percentage-by-status.js",
          "content": "\"use strict\";  module.exports = {   tags: [\"Profiles\"],   name: \"percentage-by-status\",   parameters: [{     type: \"string\",     name: \"transactionDateFrom\",     required: false   }, {     type: \"string\",     name: \"transactionDateTo\",     required: false   }],   inputFormatter: function t(query, params) {     return { ...query, ...params }       },   query: {     collectionName: \"fm_transactions\",     aggregationFunction: function t(params) {       return [{         $match: {           __STATE__: \"PUBLIC\"         }       }, {         '#matchWithFilters#': [{           requiredParameters: [\"transactionDateFrom\", \"transactionDateTo\"],           query: {             createdAt: {               $gt: new Date(params.transactionDateFrom),               $lt: new Date(params.transactionDateTo)             }           }         }]       }, {         $facet: {           nDocs: [             {               \"$count\": \"nDocs\"             }           ],           groupValues: [             {               \"$group\": {                 \"_id\": \"$businessStateDescription\",                 \"total\": {                   \"$sum\": 1                 }               }             },           ]         }       }, {         $unwind: {           path: '$groupValues',           includeArrayIndex: 'string',           preserveNullAndEmptyArrays: true         }       }, {         $project: {           status: '$groupValues._id',           percentage: {             $round: [               {                 $multiply: [                   {                     $divide: [ \"$groupValues.total\", {                       $getField: {                         field: 'nDocs',                         input: { $arrayElemAt: ['$nDocs', 0] }                       }                     } ]                   },                   100                 ]               },               2             ]           }         }       }, {         $set: {           state: {             $switch: {               branches: [                 {                   case: {                     $eq: [\"$status\", \"PAYMENT_PAID\"]                   },                   then: \"Payment Paid\"                 },                 {                   case: {                     $eq: [\"$status\", \"PAYMENT_CREATED\"]                   },                   then: \"Payment Created\"                 },                 {                   case: {                     $eq: [\"$status\", \"PAYMENT_PARTIALLY_REFUNDED\"]                   },                   then: \"Payment Partially Refunded\"                 },                 {                   case: {                     $eq: [\"$status\", \"PAYMENT_TOTALLY_REFUNDED\"]                   },                   then: \"Payment Totally Refunded\"                 },                 {                   case: {                     $eq: [\"$status\", \"PAYMENT_FAILED\"]                   },                   then: \"Payment Failed\"                 },               ],               default: \"$status\"             }           }         }       }]     }   },   castInterpolatedPipeline: function t(pipeline) {     return pipeline   },   outputFormatter: function t(doc, format, input) {     return [doc.state, doc.percentage]   } };"
        }
      ]
    },
    "crud-service-collections": {
      "name": "crud-service-collections",
      "files": []
    },
    "data-visualization-backend": {
      "name": "data-visualization-backend",
      "files": [
        {
          "name": "config.json",
          "content": "{   \"charts\": {     \"percentageByStatus\": {       \"id\": \"percentageByStatus\",       \"constructorType\": \"chart\",       \"options\": {         \"chart\": {           \"plotBackgroundColor\": null,           \"plotBorderWidth\": null,           \"plotShadow\": false,           \"type\": \"pie\"         },         \"title\": {           \"text\": \"Percentage of transactions by state\"         },         \"tooltip\": {           \"pointFormat\": \"{series.name}: <b>{point.percentage:.1f}%</b>\"         },         \"accessibility\": {           \"point\": {             \"valueSuffix\": \"%\"           }         },         \"plotOptions\": {           \"pie\": {             \"allowPointSelect\": true,             \"cursor\": \"pointer\",             \"dataLabels\": {               \"enabled\": true,               \"format\": \"<b>{point.name}</b>: {point.percentage:.2f} %\"             },             \"colors\": [               \"#EA5159\",               \"#FAA0A0\",               \"#800020\",               \"#4A0404\"             ]           }         },         \"series\": [           {             \"id\": \"serie1\",             \"name\": \"Percentage of transactions: \",             \"colorByPoint\": true,             \"endpointData\": \"/analytics/percentage-by-status/json\"           }         ]       },       \"filters\": {         \"dateFilter\": {           \"type\": \"DATERANGE\",           \"placeholder\": \"Date\",           \"fieldName\": \"transactionDate\",           \"title\": \"Date\",           \"description\": \"Creation Date\"         }       }     },     \"transactionsbyChannel\": {       \"id\": \"transactionsbyChannel\",       \"constructorType\": \"chart\",       \"filters\": {         \"dateFilter\": {           \"type\": \"DATERANGE\",           \"placeholder\": \"Date\",           \"fieldName\": \"transactionDate\",           \"title\": \"Date\",           \"description\": \"Creation Date\"         }       },       \"options\": {         \"title\": {           \"text\": \"Transactions by Channel\"         },         \"subtitle\": {           \"text\": \"Number of transactions\"         },         \"chart\": {           \"alignTicks\": false,           \"type\": \"bar\"         },         \"legend\": {           \"enabled\": true         },         \"xAxis\": {           \"type\": \"category\",           \"labels\": {             \"style\": {               \"fontSize\": \"12px\",               \"fontFamily\": \"Verdana, sans-serif\"             }           }         },         \"yAxis\": [           {             \"title\": {               \"text\": \"Revenues\"             }           },           {             \"title\": {               \"text\": \"Transactions\"             }           }         ],         \"tooltip\": {           \"shared\": true         },         \"series\": [           {             \"id\": \"serie2\",             \"name\": \"Number\",             \"endpointData\": \"/analytics/number-transactions-by-channel/json\",             \"type\": \"column\",             \"color\": \"#EA5159\",             \"yAxis\": 0           }         ]       }     },     \"transactionComparisonLastYear\": {       \"id\": \"transactionComparisonLastYear\",       \"constructorType\": \"stockChart\",       \"options\": {         \"title\": {           \"text\": \"Transactions trend\"         },         \"subtitle\": {           \"text\": \"Amount by day\"         },         \"chart\": {           \"alignTicks\": false         },         \"legend\": {           \"enabled\": true         },         \"xAxis\": {           \"type\": \"datetime\"         },         \"yAxis\": [           {             \"title\": {               \"text\": \"Amount\"             }           }         ],         \"series\": [           {             \"id\": \"amount-transactions-by-day-last-year\",             \"name\": \"Last year\",             \"endpointData\": \"/analytics/amount-transactions-by-day-last-year/json\",             \"color\": \"#C0C0C0\",             \"tooltip\": {               \"valuePrefix\": \"€ \"             },             \"fill\": {               \"granularity\": \"days\",               \"untilNow\": true,               \"value\": 0             },             \"yAxis\": 0,             \"xAxis\": 0,             \"dashStyle\": \"ShortDot\"           },           {             \"id\": \"amount-transactions-by-day-this-year\",             \"name\": \"This year\",             \"endpointData\": \"/analytics/amount-transactions-by-day-this-year/json\",             \"color\": \"#EA5159\",             \"tooltip\": {               \"valuePrefix\": \"€ \"             },             \"fill\": {               \"granularity\": \"days\",               \"untilNow\": true,               \"value\": 0             },             \"yAxis\": 0,             \"xAxis\": 0           }         ]       }     },     \"amountByMethod\": {       \"id\": \"amountByMethod\",       \"constructorType\": \"chart\",       \"filters\": {         \"dateFilter\": {           \"type\": \"DATERANGE\",           \"placeholder\": \"Date\",           \"fieldName\": \"transactionDate\",           \"title\": \"Date\",           \"description\": \"Creation Date\"         }       },       \"options\": {         \"title\": {           \"text\": \"Amount by payment method\"         },         \"chart\": {           \"alignTicks\": false,           \"type\": \"bar\"         },         \"legend\": {           \"enabled\": true         },         \"xAxis\": {           \"type\": \"category\"         },         \"yAxis\": [           {             \"title\": {               \"text\": \"Revenues\"             }           }         ],         \"tooltip\": {           \"shared\": true         },         \"series\": [           {             \"id\": \"amount-by-method\",             \"name\": \"Amount\",             \"endpointData\": \"/analytics/amount-by-method/json\",             \"type\": \"column\",             \"tooltip\": {               \"valuePrefix\": \"€ \"             },             \"color\": \"#EA5159\",             \"yAxis\": 0           }         ]       }     },     \"amountByChannel\": {       \"id\": \"amountByChannel\",       \"constructorType\": \"chart\",       \"filters\": {         \"dateFilter\": {           \"type\": \"DATERANGE\",           \"placeholder\": \"Date\",           \"fieldName\": \"transactionDate\",           \"title\": \"Date\",           \"description\": \"Creation Date\"         }       },       \"options\": {         \"title\": {           \"text\": \"Amount by payment channel\"         },         \"chart\": {           \"alignTicks\": false,           \"type\": \"bar\"         },         \"legend\": {           \"enabled\": true         },         \"xAxis\": {           \"type\": \"category\"         },         \"yAxis\": [           {             \"title\": {               \"text\": \"Revenues\"             }           }         ],         \"tooltip\": {           \"shared\": true         },         \"series\": [           {             \"id\": \"amount-by-channel\",             \"name\": \"Amount\",             \"endpointData\": \"/analytics/amount-by-channel/json\",             \"type\": \"column\",             \"tooltip\": {               \"valuePrefix\": \"€ \"             },             \"color\": \"#EA5159\",             \"yAxis\": 0           }         ]       }     }   },   \"dashboard\": {     \"dashboard-1\": {       \"rows\": [         {           \"charts\": [             {               \"id\": \"transactionComparisonLastYear\"             }           ]         },         {           \"charts\": [             {               \"id\": \"amountByMethod\"             },             {               \"id\": \"amountByChannel\"             }           ]         },         {           \"charts\": [             {               \"id\": \"percentageByStatus\"             }           ]         }       ]     }   } }"
        }
      ]
    },
    "file-sevice-config": {
      "name": "file-sevice-config",
      "files": [
        {
          "name": "db-config.json",
          "content": "CHANGE ME"
        },
        {
          "name": "caster-file.js",
          "content": "'use strict'\nmodule.exports = function caster(doc) {   return {     sagaId: doc.sagaId || undefined,   } }\nmodule.exports.additionalPropertiesValidator = {   sagaId: { type: 'string' }, }"
        }
      ]
    },
    "flow-configuration": {
      "name": "flow-configuration",
      "files": [
        {
          "name": "saga.json",
          "content": "{\"communicationProtocols\":[{\"configurations\":{\"endpoint\":\"payment-gateway-manager\",\"method\":\"POST\",\"path\":\"/saga/pay\",\"port\":80,\"protocol\":\"http\"},\"id\":\"pay\",\"type\":\"rest\"},{\"configurations\":{\"endpoint\":\"payment-gateway-manager\",\"method\":\"POST\",\"path\":\"/saga/pay-by-link\",\"port\":80,\"protocol\":\"http\"},\"id\":\"createLink\",\"type\":\"rest\"},{\"configurations\":{\"endpoint\":\"payment-gateway-manager\",\"method\":\"POST\",\"path\":\"/saga/subscription/schedule\",\"port\":80,\"protocol\":\"http\"},\"id\":\"subscriptionScheduledRequested\",\"type\":\"rest\"},{\"configurations\":{\"endpoint\":\"payment-gateway-manager\",\"method\":\"POST\",\"path\":\"/saga/subscription/start\",\"port\":80,\"protocol\":\"http\"},\"id\":\"subscriptionStart\",\"type\":\"rest\"},{\"configurations\":{\"endpoint\":\"payment-gateway-manager\",\"method\":\"POST\",\"path\":\"/saga/subscription/pay\",\"port\":80,\"protocol\":\"http\"},\"id\":\"subscriptionPaymentRequested\",\"type\":\"rest\"},{\"configurations\":{\"endpoint\":\"payment-gateway-manager\",\"method\":\"POST\",\"path\":\"/saga/subscription/authorization\",\"port\":80,\"protocol\":\"http\"},\"id\":\"getAuthorization\",\"type\":\"rest\"},{\"configurations\":{\"endpoint\":\"payment-gateway-manager\",\"method\":\"POST\",\"path\":\"/saga/refund\",\"port\":80,\"protocol\":\"http\"},\"id\":\"refund\",\"type\":\"rest\"},{\"configurations\":{\"endpoint\":\"subscription-handler-service\",\"method\":\"POST\",\"path\":\"/notify\",\"port\":80,\"protocol\":\"http\"},\"id\":\"subscription-notify\",\"type\":\"rest\"},{\"configurations\":{\"endpoint\":\"messaging-service\",\"method\":\"POST\",\"path\":\"/saga/send\",\"port\":80,\"protocol\":\"http\"},\"id\":\"notify\",\"type\":\"rest\"}],\"machineDefinition\":{\"businessEvents\":[{\"description\":\"paymentCreated\",\"id\":0},{\"description\":\"paymentPaid\",\"id\":1},{\"description\":\"paymentPartiallyRefunded\",\"id\":2},{\"description\":\"paymentTotallyRefunded\",\"id\":3},{\"description\":\"paymentFailed\",\"id\":1000}],\"businessStates\":[{\"description\":\"PAYMENT_CREATED\",\"id\":0},{\"description\":\"PAYMENT_PAID\",\"id\":1},{\"description\":\"PAYMENT_PARTIALLY_REFUNDED\",\"id\":2},{\"description\":\"PAYMENT_TOTALLY_REFUNDED\",\"id\":3},{\"description\":\"PAYMENT_FAILED\",\"id\":1000}],\"creationEvent\":\"paymentCreated\",\"initialState\":\"PAYMENT_CREATED\",\"states\":[{\"businessStateId\":0,\"description\":\"payment created on CRUD\",\"id\":\"PAYMENT_CREATED\",\"isFinal\":false,\"outgoingTransitions\":[{\"businessEventId\":0,\"inputEvent\":\"scheduleRequested\",\"targetState\":\"PAYMENT_SCHEDULE_REQUESTED\"},{\"businessEventId\":0,\"inputEvent\":\"subscriptionScheduledRequested\",\"targetState\":\"SUBSCRIPTION_SCHEDULED_REQUESTED\"},{\"businessEventId\":0,\"inputEvent\":\"subscriptionStart\",\"targetState\":\"SUBSCRIPTION_STARTED\"},{\"businessEventId\":0,\"inputEvent\":\"subscriptionPaymentRequested\",\"targetState\":\"SUBSCRIPTION_PAYMENT_REQUESTED\"},{\"businessEventId\":0,\"inputEvent\":\"authorizationRequested\",\"targetState\":\"AUTHORIZATION_REQUESTED\"},{\"businessEventId\":0,\"inputEvent\":\"linkRequested\",\"targetState\":\"LINK_REQUESTED\"},{\"businessEventId\":1,\"inputEvent\":\"paymentExecuted\",\"targetState\":\"PAYMENT_EXECUTED\"},{\"businessEventId\":1000,\"inputEvent\":\"paymentFailed\",\"targetState\":\"PAYMENT_FAILED\"}]},{\"businessStateId\":0,\"description\":\"Link has been requested\",\"id\":\"LINK_REQUESTED\",\"isFinal\":false,\"outgoingTransitions\":[{\"businessEventId\":0,\"inputEvent\":\"linkCreated\",\"targetState\":\"LINK_CREATED\"},{\"businessEventId\":1000,\"inputEvent\":\"paymentFailed\",\"targetState\":\"PAYMENT_FAILED\"}],\"outputCommand\":{\"channel\":\"createLink\",\"label\":\"createLink\"}},{\"businessStateId\":0,\"description\":\"Link has been created\",\"id\":\"LINK_CREATED\",\"isFinal\":false,\"outgoingTransitions\":[{\"businessEventId\":0,\"inputEvent\":\"notificationSent\",\"targetState\":\"PAYMENT_PENDING\"},{\"businessEventId\":1000,\"inputEvent\":\"paymentFailed\",\"targetState\":\"PAYMENT_FAILED\"}]},{\"businessStateId\":0,\"description\":\"authorization has been requested\",\"id\":\"AUTHORIZATION_REQUESTED\",\"isFinal\":false,\"outgoingTransitions\":[{\"businessEventId\":0,\"inputEvent\":\"authorizationScheduled\",\"targetState\":\"AUTHORIZATION_PENDING\"}],\"outputCommand\":{\"channel\":\"getAuthorization\",\"label\":\"getAuthorization\"}},{\"businessStateId\":0,\"description\":\"waiting for authorization\",\"id\":\"AUTHORIZATION_PENDING\",\"isFinal\":false,\"outgoingTransitions\":[{\"businessEventId\":0,\"inputEvent\":\"subscriptionStart\",\"targetState\":\"SUBSCRIPTION_STARTED\"},{\"businessEventId\":0,\"inputEvent\":\"subscriptionPaymentRequested\",\"targetState\":\"SUBSCRIPTION_PAYMENT_REQUESTED\"},{\"businessEventId\":1000,\"inputEvent\":\"paymentFailed\",\"targetState\":\"PAYMENT_FAILED\"}]},{\"businessStateId\":0,\"description\":\"payment schedule has been requested\",\"id\":\"PAYMENT_SCHEDULE_REQUESTED\",\"isFinal\":false,\"outgoingTransitions\":[{\"businessEventId\":0,\"inputEvent\":\"paymentScheduled\",\"targetState\":\"PAYMENT_PENDING\"},{\"businessEventId\":1,\"inputEvent\":\"paymentExecuted\",\"targetState\":\"PAYMENT_EXECUTED\"},{\"businessEventId\":1,\"inputEvent\":\"paymentExecutedBySystem\",\"targetState\":\"PAYMENT_EXECUTED\"},{\"businessEventId\":1000,\"inputEvent\":\"paymentFailed\",\"targetState\":\"PAYMENT_FAILED\"},{\"businessEventId\":1000,\"inputEvent\":\"paymentFailedBySystem\",\"targetState\":\"PAYMENT_FAILED\"}],\"outputCommand\":{\"channel\":\"pay\",\"label\":\"paymentScheduled\"}},{\"businessStateId\":0,\"description\":\"subscription schedule has been requested\",\"id\":\"SUBSCRIPTION_SCHEDULED_REQUESTED\",\"isFinal\":false,\"outgoingTransitions\":[{\"businessEventId\":0,\"inputEvent\":\"paymentScheduled\",\"targetState\":\"PAYMENT_PENDING\"},{\"businessEventId\":1,\"inputEvent\":\"paymentExecuted\",\"targetState\":\"PAYMENT_EXECUTED\"},{\"businessEventId\":1,\"inputEvent\":\"paymentExecutedBySystem\",\"targetState\":\"PAYMENT_EXECUTED\"},{\"businessEventId\":1000,\"inputEvent\":\"paymentFailed\",\"targetState\":\"PAYMENT_FAILED\"},{\"businessEventId\":1000,\"inputEvent\":\"paymentFailedBySystem\",\"targetState\":\"PAYMENT_FAILED\"}],\"outputCommand\":{\"channel\":\"subscriptionScheduledRequested\",\"label\":\"subscriptionScheduledRequested\"}},{\"businessStateId\":0,\"description\":\"subscription's first payment has been requested\",\"id\":\"SUBSCRIPTION_STARTED\",\"isFinal\":false,\"outgoingTransitions\":[{\"businessEventId\":0,\"inputEvent\":\"paymentScheduled\",\"targetState\":\"PAYMENT_PENDING\"},{\"businessEventId\":1,\"inputEvent\":\"paymentExecuted\",\"targetState\":\"PAYMENT_EXECUTED\"},{\"businessEventId\":1,\"inputEvent\":\"paymentExecutedBySystem\",\"targetState\":\"PAYMENT_EXECUTED\"},{\"businessEventId\":1000,\"inputEvent\":\"paymentFailed\",\"targetState\":\"PAYMENT_FAILED\"},{\"businessEventId\":1000,\"inputEvent\":\"paymentFailedBySystem\",\"targetState\":\"PAYMENT_FAILED\"}],\"outputCommand\":{\"channel\":\"subscriptionStart\",\"label\":\"subscriptionStart\"}},{\"businessStateId\":0,\"description\":\"subscription's payment has been requested\",\"id\":\"SUBSCRIPTION_PAYMENT_REQUESTED\",\"isFinal\":false,\"outgoingTransitions\":[{\"businessEventId\":0,\"inputEvent\":\"paymentScheduled\",\"targetState\":\"PAYMENT_PENDING\"},{\"businessEventId\":1,\"inputEvent\":\"paymentExecuted\",\"targetState\":\"PAYMENT_EXECUTED\"},{\"businessEventId\":1,\"inputEvent\":\"paymentExecutedBySystem\",\"targetState\":\"PAYMENT_EXECUTED\"},{\"businessEventId\":1000,\"inputEvent\":\"paymentFailed\",\"targetState\":\"PAYMENT_FAILED\"},{\"businessEventId\":1000,\"inputEvent\":\"paymentFailedBySystem\",\"targetState\":\"PAYMENT_FAILED\"}],\"outputCommand\":{\"channel\":\"subscriptionPaymentRequested\",\"label\":\"subscriptionPaymentRequested\"}},{\"businessStateId\":0,\"description\":\"payment created on provider's system\",\"id\":\"PAYMENT_PENDING\",\"isFinal\":false,\"outgoingTransitions\":[{\"businessEventId\":0,\"inputEvent\":\"update\",\"targetState\":\"PAYMENT_PENDING\"},{\"businessEventId\":1,\"inputEvent\":\"paymentExecuted\",\"targetState\":\"PAYMENT_EXECUTED\"},{\"businessEventId\":1,\"inputEvent\":\"paymentExecutedBySystem\",\"targetState\":\"PAYMENT_EXECUTED\"},{\"businessEventId\":1000,\"inputEvent\":\"paymentFailed\",\"targetState\":\"PAYMENT_FAILED\"},{\"businessEventId\":1000,\"inputEvent\":\"paymentFailedBySystem\",\"targetState\":\"PAYMENT_FAILED\"}]},{\"businessStateId\":1,\"description\":\"payment has been paid\",\"id\":\"PAYMENT_EXECUTED\",\"isFinal\":false,\"outgoingTransitions\":[{\"businessEventId\":1,\"inputEvent\":\"refundRequested\",\"targetState\":\"REFUND_REQUESTED\"},{\"businessEventId\":1,\"inputEvent\":\"sendNotification\",\"targetState\":\"PAYMENT_EXECUTED\"}]},{\"businessStateId\":1,\"description\":\"payment refund has been requested\",\"id\":\"REFUND_REQUESTED\",\"isFinal\":false,\"outgoingTransitions\":[{\"businessEventId\":1,\"inputEvent\":\"refundFailed\",\"targetState\":\"REFUND_FAILED\"},{\"businessEventId\":2,\"inputEvent\":\"partialRefundExecuted\",\"targetState\":\"PARTIALLY_REFUNDED\"},{\"businessEventId\":3,\"inputEvent\":\"totalRefundExecuted\",\"targetState\":\"TOTALLY_REFUNDED\"}],\"outputCommand\":{\"channel\":\"refund\",\"label\":\"refundRequested\"}},{\"businessStateId\":1,\"description\":\"payment refund failed\",\"id\":\"REFUND_FAILED\",\"isFinal\":false,\"outgoingTransitions\":[{\"businessEventId\":1,\"inputEvent\":\"refundRequested\",\"targetState\":\"REFUND_REQUESTED\"}]},{\"businessStateId\":2,\"description\":\"payment has been partially refunded\",\"id\":\"PARTIALLY_REFUNDED\",\"isFinal\":false,\"outgoingTransitions\":[{\"businessEventId\":2,\"inputEvent\":\"refundRequested\",\"targetState\":\"SUBSEQUENT_REFUND_REQUESTED\"},{\"businessEventId\":1,\"inputEvent\":\"sendNotification\",\"targetState\":\"PARTIALLY_REFUNDED\"}]},{\"businessStateId\":2,\"description\":\"payment refund has been requested again\",\"id\":\"SUBSEQUENT_REFUND_REQUESTED\",\"isFinal\":false,\"outgoingTransitions\":[{\"businessEventId\":2,\"inputEvent\":\"partialRefundExecuted\",\"targetState\":\"PARTIALLY_REFUNDED\"},{\"businessEventId\":2,\"inputEvent\":\"refundFailed\",\"targetState\":\"SUBSEQUENT_REFUND_FAILED\"},{\"businessEventId\":3,\"inputEvent\":\"totalRefundExecuted\",\"targetState\":\"TOTALLY_REFUNDED\"}],\"outputCommand\":{\"channel\":\"refund\",\"label\":\"refundRequested\"}},{\"businessStateId\":2,\"description\":\"subsequent payment refund failed\",\"id\":\"SUBSEQUENT_REFUND_FAILED\",\"isFinal\":false,\"outgoingTransitions\":[{\"businessEventId\":2,\"inputEvent\":\"refundRequested\",\"targetState\":\"SUBSEQUENT_REFUND_REQUESTED\"}]},{\"businessStateId\":3,\"description\":\"payment has been totally refunded\",\"id\":\"TOTALLY_REFUNDED\",\"isFinal\":false,\"outgoingTransitions\":[{\"businessEventId\":1,\"inputEvent\":\"sendNotification\",\"targetState\":\"TOTALLY_REFUNDED\"}]},{\"businessStateId\":1000,\"description\":\"payment could not be performed\",\"id\":\"PAYMENT_FAILED\",\"isFinal\":false,\"outgoingTransitions\":[{\"businessEventId\":1,\"inputEvent\":\"sendNotification\",\"targetState\":\"PAYMENT_FAILED\"}]}]},\"persistencyManagement\":{\"configurations\":{\"collectionName\":\"fm-transactions\",\"host\":\"crud-service\",\"port\":80,\"protocol\":\"http\"},\"type\":\"crud\"},\"settings\":{\"deepMergeMetadata\":{\"enabled\":true,\"hook\":{\"content\":\"\",\"encoding\":\"base64\",\"type\":\"file\"}}}}"
        }
      ]
    },
    "config": {
      "name": "config",
      "files": [
        {
          "name": "company-data.json",
          "content": "{   \"companyName\": \"CHANGE ME\",   \"address\": \"CHANGE ME\",   \"telephoneNumber\": \"Tel. CHANGE ME\",   \"logo\": \"CHANGE ME\" }"
        }
      ]
    },
    "messaging-configuration": {
      "name": "messaging-configuration",
      "files": [
        {
          "name": "config.json",
          "content": "{   \"activeChannels\": [     \"email\",     \"sms\"   ],   \"sender\": {     \"email\": \"{{EMAIL_SENDER}}\",     \"sms\": \"CHANGE ME\"   },   \"flowManagerConfiguration\": {     \"serviceUrl\": \"http://flow-manager-service\",     \"successEventLabel\": \"notificationSent\",     \"failEventLabel\": \"paymentFailed\",     \"getTemplateIdFilePath\": \"/home/node/app/messaging-service/getTemplateId.js\",     \"getDataFilePath\": \"/home/node/app/messaging-service/getData.js\",     \"metadataSchema\": {       \"channels\": \"additionalData.notificationChannels\",       \"recipients\": \"additionalData.buyer.id\"     }   } }"
        },
        {
          "name": "getData.js",
          "content": "function amountToDecimal(amount, currency) {   if (isNaN(amount)) return undefined   \nswitch (currency.toLocaleLowerCase()) {     case 'eur':       return (amount / 100).toFixed(2)\ndefault:       return amount   } }  function currencyToSymbol(currency) {   switch (currency.toLocaleLowerCase()) {     case 'eur':       return '€'     \ndefault:       return currency   } }  function mapStatus(status) {     switch (status) {         case 'PAYMENT_EXECUTED':             return 'Payment Paid'         \ncase 'PAYMENT_FAILED':             return 'Payment Failed'         \ncase 'PARTIAL_REFUND_EXECUTED':             return 'Payment Partially Refunded'         \ncase 'TOTAL_REFUND_EXECUTED':             return 'Payment Totally Refunded'         \ndefault:             return status     } }  \nmodule.exports = function getData(event) {   return {     ...event,     value: {       messageLabel: mapStatus(event.value.messageLabel),       messagePayload: {         ...event.value.messagePayload,         amount: amountToDecimal(event.value.messagePayload.amount, event.value.messagePayload.currency),         currency: currencyToSymbol(event.value.messagePayload.currency),         refundRequestData: {           ...event.value.messagePayload.refundRequestData,           amount: amountToDecimal(event.value.messagePayload.refundRequestData?.amount, event.value.messagePayload.currency),         },         refundDetails: {           ...event.value.messagePayload.refundDetails,           totalRefundedAmount: amountToDecimal(event.value.messagePayload.refundDetails?.totalRefundedAmount, event.value.messagePayload.currency),           refundedAmounts: event.value.messagePayload.refundDetails?.refundedAmounts?.map(a => amountToDecimal(a, event.value.messagePayload.currency)),         },       },     },   } } "
        },
        {
          "name": "getTemplateId.js",
          "content": "module.exports = function getTemplateId(event) {   const mapIds = new Map(JSON.parse('{{NOTIFICATION_TEMPLATE_IDS}}'))   \nreturn mapIds.get(event.value.messageLabel) ?? event.value.messageLabel } "
        }
      ]
    },
    "payment-front-end": {
      "name": "payment-front-end",
      "files": [
        {
          "name": "env.json",
          "content": "{   \"primaryColor\": \"#EA5159\",   \"backgroundColor\": \"#ffffff\",   \"bodyColor\": \"#F4F4F4\",   \"fontColor\": \"#555555\",   \"logo\": \"./logo.webp\",   \"favicon\": \"./favicon.webp\",   \"title\": \"Payment\",   \"pages\": {     \"home\": \"/demo/checkout\",     \"checkout\": \"/demo/checkout\",     \"subscription\": \"/demo/subscription\",     \"buyer\": \"/demo/buyer\",     \"pay\": \"/demo/pay\",     \"result\": \"/demo/result\",     \"error\": \"/demo/error\",     \"pending\": \"/demo/pending\"   },   \"endpoint\": {     \"pay\": \"/pay\",     \"paySubscription\": \"/pay-recurrent\",     \"payPolling\": \"/pay-polling\",     \"payByLink\": \"/pay-by-link\",     \"downloadInvoice\": \"/invoice-download\",     \"checkout\": \"/fm/saga\",     \"checkoutSubscription\": \"/create\",     \"paymentDetail\": \"/payment-info\",     \"paymentMethods\": \"/payment/{id}/methods\",     \"axerveCreditToken\": \"https://sandbox.gestpay.net/api/v1/shop/token\",     \"applePaySession\": \"/apple-pay-session\",     \"paymentTokenization\": \"/tokenization\"   },   \"googlepay\": {     \"environment\": \"TEST\",     \"countryCode\": \"IT\"   },   \"applePay\": {     \"merchantIdentifier\": \"CHANGE ME\",     \"domain\": \"{{PROJECT_HOST}}\",     \"displayName\": \"CHANGE ME\"   },   \"pollingInterval\": 2000 }"
        }
      ]
    },
    "pgm-config": {
      "name": "pgm-config",
      "files": [
        {
          "name": "external-providers.json",
          "content": "{   \"externalServices\": [     {       \"externalService\": \"CHANGE ME\",       \"baseUrl\": \"CHANGE ME\"     }     ] }"
        }
      ]
    },
    "subscription-saga-configuration": {
      "name": "subscription-saga-configuration",
      "files": [
        {
          "name": "saga.json",
          "content": "{   \"machineDefinition\": {     \"initialState\": \"CREATED\",     \"creationEvent\": \"create\",     \"states\": [       {         \"id\": \"CREATED\",         \"description\": \"Subscription created on CRUD\",         \"isFinal\": false,         \"businessStateId\": 0,         \"outgoingTransitions\": [           {             \"inputEvent\": \"update\",             \"targetState\": \"CREATED\",             \"businessEventId\": 0           },           {             \"inputEvent\": \"start\",             \"targetState\": \"PAYMENT_PENDING\",             \"businessEventId\": 1           },           {             \"inputEvent\": \"expire\",             \"targetState\": \"EXPIRED\",             \"businessEventId\": 1000           },           {             \"inputEvent\": \"abort\",             \"targetState\": \"ABORTED\",             \"businessEventId\": 1001           }         ]       },       {         \"id\": \"PAYMENT_PENDING\",         \"description\": \"A payment is processing\",         \"isFinal\": false,         \"businessStateId\": 1,         \"outgoingTransitions\": [           {             \"inputEvent\": \"update\",             \"targetState\": \"PAYMENT_PENDING\",             \"businessEventId\": 1           },           {             \"inputEvent\": \"paymentExecuted\",             \"targetState\": \"ACTIVE\",             \"businessEventId\": 1           },           {             \"inputEvent\": \"paymentFailed\",             \"targetState\": \"PAYMENT_FAILED\",             \"businessEventId\": 10           },           {             \"inputEvent\": \"expire\",             \"targetState\": \"EXPIRED\",             \"businessEventId\": 1000           },           {             \"inputEvent\": \"abort\",             \"targetState\": \"ABORTED\",             \"businessEventId\": 1001           }         ]       },       {         \"id\": \"ACTIVE\",         \"description\": \"Subscription is active\",         \"isFinal\": false,         \"businessStateId\": 1,         \"outgoingTransitions\": [           {             \"inputEvent\": \"update\",             \"targetState\": \"ACTIVE\",             \"businessEventId\": 1           },           {             \"inputEvent\": \"scheduleNextPayment\",             \"targetState\": \"PAYMENT_PENDING\",             \"businessEventId\": 1           },           {             \"inputEvent\": \"expire\",             \"targetState\": \"EXPIRED\",             \"businessEventId\": 1000           },           {             \"inputEvent\": \"abort\",             \"targetState\": \"ABORTED\",             \"businessEventId\": 1001           }         ]       },       {         \"id\": \"PAYMENT_FAILED\",         \"description\": \"A payment has failed\",         \"isFinal\": false,         \"businessStateId\": 10,         \"outgoingTransitions\": [           {             \"inputEvent\": \"update\",             \"targetState\": \"PAYMENT_FAILED\",             \"businessEventId\": 10           },           {             \"inputEvent\": \"scheduleNextPayment\",             \"targetState\": \"PAYMENT_PENDING\",             \"businessEventId\": 1           },           {             \"inputEvent\": \"expire\",             \"targetState\": \"EXPIRED\",             \"businessEventId\": 1000           },           {             \"inputEvent\": \"abort\",             \"targetState\": \"ABORTED\",             \"businessEventId\": 1001           }         ]       },       {         \"id\": \"EXPIRED\",         \"description\": \"Subscription expired\",         \"isFinal\": true,         \"businessStateId\": 1000       },       {         \"id\": \"ABORTED\",         \"description\": \"Subscription aborted after several failure\",         \"isFinal\": true,         \"businessStateId\": 1001       }     ],     \"businessStates\": [       {         \"id\": 0,         \"description\": \"CREATED\"       },       {         \"id\": 1,         \"description\": \"ACTIVE\"       },       {         \"id\": 10,         \"description\": \"ON_HOLD\"       },       {         \"id\": 1000,         \"description\": \"EXPIRED\"       },       {         \"id\": 1001,         \"description\": \"ABORTED\"       }     ],     \"businessEvents\": [       {         \"id\": 0,         \"description\": \"created\"       },       {         \"id\": 1,         \"description\": \"activated\"       },       {         \"id\": 10,         \"description\": \"on_hold\"       },       {         \"id\": 1000,         \"description\": \"expired\"       },       {         \"id\": 1001,         \"description\": \"abort\"       }     ]   },   \"communicationProtocols\": [],   \"persistencyManagement\": {     \"type\": \"crud\",     \"configurations\": {       \"collectionName\": \"fm-subscriptions\"     }   },   \"settings\": {     \"deepMergeMetadata\": {       \"enabled\": true     }   } }"
        }
      ]
    },
    "micro-lc-static-files": {
      "name": "micro-lc-static-files",
      "files": [
        {
          "name": "index.html",
          "content": "<!DOCTYPE html>\n<html lang=\"en\">\n\n<head>\n  <base href=\"/mfe-application/\" target=\"_blank\" />\n\n  <title>Microfrontend composer</title>\n\n  <link rel=\"icon\" type=\"image/png\" href=\"https://www.mia-platform.eu/static/img/favicon/apple-icon-60x60.png\" />\n  <link rel=\"stylesheet\" nonce=\"**CSP_NONCE**\" href=\"./assets/style.css\" />\n\n  <script\n    type=\"module\"\n    nonce=\"**CSP_NONCE**\"\n    src=\"https://cdn.mia-platform.eu/backoffice/bk-web-components/{{BACK_KIT_VERSION}}/dist/bk-loading-animation.esm.js\"\n  ></script>\n\n  <script\n    type=\"module\"\n    nonce=\"**CSP_NONCE**\"\n    src=\"https://cdn.mia-platform.eu/micro-lc/orchestrator/2.4.3/dist/micro-lc.production.js\"\n  ></script>\n</head>\n\n<body>\n  <bk-loading-animation primary-color=\"#1890ff\">\n    <micro-lc config-src=\"/micro-lc-configurations/config.json\" fallback-language=\"en\"></micro-lc>\n  </bk-loading-animation>\n</body>\n\n</html>\n"
        }
      ]
    },
    "micro-lc-configurations": {
      "name": "micro-lc-configurations",
      "files": [
        {
          "name": "config.json",
          "content": "{\"applications\":{\"home\":{\"config\":{\"content\":{\"attributes\":{\"style\":\"width: 100%; height: 100%; display: flex; flex-direction: column; justify-content: center; align-items: center; row-gap: 24px\"},\"content\":[{\"content\":\"Welcome to your new frontend! 👋\",\"tag\":\"span\"},{\"attributes\":{\"href\":\"https://docs.mia-platform.eu/docs/microfrontend-composer/overview\",\"target\":\"_blank\"},\"content\":\"Get started with the official documentation!\",\"tag\":\"a\"}],\"tag\":\"div\"}},\"integrationMode\":\"compose\",\"route\":\"./home\"},\"libraries\":{\"integrationMode\":\"compose\",\"route\":\"./pages/library\",\"config\":\"/micro-lc-configurations/libraries.config.json\"}},\"layout\":{\"content\":[{\"properties\":{\"logo\":{\"altText\":\"Change me\",\"url\":\"https://www.mia-platform.eu/static/img/logo.svg\"},\"menuItems\":[{\"icon\":{\"library\":\"@ant-design/icons-svg\",\"selector\":\"HomeOutlined\"},\"id\":\"home\",\"label\":\"Home\",\"type\":\"application\"}],\"mode\":\"fixedSideBar\"},\"tag\":\"bk-layout\"},{\"properties\":{\"primaryColor\":\"#1890ff\",\"varsPrefix\":[\"micro-lc\",\"microlc\",\"back-kit\",\"ant\"]},\"tag\":\"bk-antd-theme-manager\"}],\"sources\":[\"https://cdn.mia-platform.eu/backoffice/bk-web-components/{{BACK_KIT_VERSION}}/dist/bk-web-components.esm.js\"]},\"settings\":{\"defaultUrl\":\"./home\"},\"version\":2}"
        },
        {
          "name": "libraries.config.json",
          "content": "{\"definitions\":{\"dataSchema\":{\"type\":\"object\",\"required\":[\"priority\",\"ruleId\",\"type\",\"rules\",\"response\"],\"properties\":{\"_id\":{\"formOptions\":{\"hiddenOnInsert\":true,\"readOnlyOnUpdate\":true},\"type\":\"string\"},\"creatorId\":{\"formOptions\":{\"hiddenOnInsert\":true,\"readOnlyOnUpdate\":true},\"type\":\"string\"},\"createdAt\":{\"formOptions\":{\"hiddenOnInsert\":true,\"readOnlyOnUpdate\":true},\"dateOptions\":{\"displayFormat\":\"YYYY-MM-DD hh:mm\"},\"format\":\"date-time\",\"type\":\"string\"},\"updaterId\":{\"formOptions\":{\"hiddenOnInsert\":true,\"readOnlyOnUpdate\":true},\"type\":\"string\"},\"updatedAt\":{\"formOptions\":{\"hiddenOnInsert\":true,\"readOnlyOnUpdate\":true},\"dateOptions\":{\"displayFormat\":\"YYYY-MM-DD hh:mm\"},\"format\":\"date-time\",\"type\":\"string\"},\"__STATE__\":{\"enum\":[\"PUBLIC\",\"DRAFT\",\"TRASH\",\"DELETED\"],\"formOptions\":{\"readOnlyOnUpdate\":true},\"type\":\"string\"},\"priority\":{\"type\":\"number\"},\"ruleId\":{\"type\":\"string\"},\"type\":{\"type\":\"string\"},\"rules\":{\"type\":\"array\",\"items\":{\"type\":\"object\",\"required\":[],\"additionalProperties\":true}},\"response\":{\"type\":\"array\",\"items\":{\"type\":\"object\",\"required\":[],\"additionalProperties\":true}}}}},\"content\":{\"content\":[{\"content\":[{\"tag\":\"div\",\"content\":[{\"properties\":{\"content\":\"Page title\"},\"tag\":\"bk-title\"},{\"tag\":\"bk-refresh-button\",\"attributes\":{\"style\":\"margin-left: 14px; align-self: end;\"}},{\"tag\":\"div\",\"attributes\":{\"style\":\"flex-grow: 1;\"}},{\"properties\":{\"placeholder\":\"Search...\"},\"tag\":\"bk-search-bar\"},{\"properties\":{\"iconId\":\"DownloadOutlined\",\"content\":\"Export\",\"clickConfig\":{\"type\":\"event\",\"actionConfig\":{\"label\":\"export-data\",\"payload\":{}}}},\"tag\":\"bk-button\"},{\"tag\":\"bk-add-new-button\"},{\"properties\":{\"content\":\"\",\"clickConfig\":{\"type\":\"event\",\"actionConfig\":{\"label\":\"filter\",\"payload\":{}}},\"type\":\"outlined\",\"iconId\":\"FunnelPlotOutlined\"},\"tag\":\"bk-button\"}],\"attributes\":{\"style\":\"display: flex; flex-direction: row; gap: 10px; padding: 0 20px;\"}},{\"tag\":\"div\",\"attributes\":{\"style\":\"width: 100%; display: flex; justify-content: space-between;\"},\"content\":[{\"attributes\":{\"style\":\"flex-grow: 1;\"},\"properties\":{\"tabs\":[{\"key\":\"tab-1\",\"title\":\"Tab 1\"}]},\"tag\":\"bk-tabs\"},{\"attributes\":{\"style\":\"margin-right: 4px\"},\"properties\":{\"dataSchema\":{\"$ref\":\"#/definitions/dataSchema\"},\"filters\":[]},\"tag\":\"bk-filters-manager\"}]}],\"tag\":\"header\",\"attributes\":{\"style\":\"display: flex; flex-direction: column; padding-top: 10px; background-color: white;\"}},{\"content\":[{\"properties\":{\"dataSchema\":{\"$ref\":\"#/definitions/dataSchema\"},\"maxLines\":10,\"customActions\":[{\"tag\":\"bk-button\",\"properties\":{\"iconId\":\"DeleteOutlined\",\"content\":\"\",\"type\":\"ghost\",\"action\":{\"type\":\"event\",\"config\":{\"events\":{\"label\":\"require-confirm\",\"payload\":{\"content\":{\"en\":\"Do you want to confirm this action?\",\"it\":\"Vuoi confermare questa azione?\"},\"configOk\":{\"properties\":{\"action\":{\"type\":\"event\",\"config\":{\"events\":{\"label\":\"delete-data\",\"payload\":\"{{rawObject args.[1]}}\"}}}}}}}}}}},{\"tag\":\"bk-button\",\"properties\":{\"content\":{\"en\":\"Details\",\"it\":\"Dettaglio\"},\"iconId\":\"fas fa-arrow-right\",\"iconPlacement\":\"right\",\"clickConfig\":{\"type\":\"push\",\"actionConfig\":{\"url\":\"./details-page-route/{{args.[1]._id}}\"}}}}]},\"tag\":\"bk-table\"},{\"properties\":{\"requireConfirm\":{\"onClose\":true,\"onSave\":true},\"dataSchema\":{\"$ref\":\"#/definitions/dataSchema\"},\"width\":\"70vw\"},\"tag\":\"bk-form-modal\"},{\"tag\":\"bk-confirmation-modal\"},{\"properties\":{\"rootElementSelectors\":\"main.micro-lc-layout-content\",\"successEventMap\":{\"create-data\":{\"title\":\"Success\",\"content\":\"Data successfully created\",\"type\":\"success\"},\"update-data\":{\"title\":\"Success\",\"content\":\"Data successfully updated\",\"type\":\"success\"},\"delete-data\":{\"title\":\"Success\",\"content\":\"Data successfully deleted\",\"type\":\"success\"}},\"errorEventMap\":{\"create-data\":{\"title\":\"Error\",\"content\":\"An error occurred during order creation\",\"type\":\"error\"},\"update-data\":{\"title\":\"Error\",\"content\":\"An error occurred during order updated\",\"type\":\"error\"},\"delete-data\":{\"title\":\"Error\",\"content\":\"An error occurred during order deletion\",\"type\":\"error\"}}},\"tag\":\"bk-notifications\",\"attributes\":{}}],\"tag\":\"main\",\"attributes\":{\"style\":\"flex-grow: 1; background-color: #f0f2f5; padding: 20px; overflow-y: auto;\"}},{\"content\":[{\"properties\":{\"dataSchema\":{\"$ref\":\"#/definitions/dataSchema\"},\"width\":\"40vw\"},\"tag\":\"bk-filter-drawer\"}],\"tag\":\"aside\"},{\"content\":[{\"tag\":\"bk-bulk-delete\"},{\"tag\":\"bk-bulk-actions\",\"properties\":{\"dataSchema\":{\"$ref\":\"#/definitions/dataSchema\"}}},{\"tag\":\"div\",\"attributes\":{\"style\":\"flex-grow: 1;\"}},{\"tag\":\"bk-footer\",\"attributes\":{\"style\":\"display: flex; justify-content: end; align-items: center;\"}},{\"tag\":\"bk-pagination\",\"properties\":{\"pageSize\":10}}],\"tag\":\"footer\",\"attributes\":{\"style\":\"display: flex; flex-direction: row; flex-wrap: wrap; padding: 10px 20px; background-color: white; gap: 10px; position: sticky; bottom: 0; z-index: 10\"}},{\"properties\":{\"basePath\":\"/v2/adaptive-checkout\",\"dataSchema\":{\"$ref\":\"#/definitions/dataSchema\"}},\"tag\":\"bk-crud-client\"},{\"properties\":{\"basePath\":\"/data-source-endpoint/export\",\"streamSaverIFrameSrc\":\"https://cdn.mia-platform.eu/backoffice/bk-web-components/{{BACK_KIT_VERSION}}/dist/export-service-worker.html\",\"dataSchema\":{\"$ref\":\"#/definitions/dataSchema\"}},\"tag\":\"bk-export\"}],\"tag\":\"div\",\"attributes\":{\"style\":\"width: 100%; height: 100%; display: flex; flex-direction: column; position: relative;\"}},\"sources\":[\"https://cdn.mia-platform.eu/backoffice/bk-web-components/{{BACK_KIT_VERSION}}/dist/bk-web-components.esm.js\"]}"
        }
      ]
    },
    "micro-lc-server-configuration": {
      "name": "micro-lc-server-configuration",
      "files": [
        {
          "name": "config.json",
          "content": "{\"publicHeadersMap\":{\"/public/index.html\":{\"content-security-policy\":[[\"script-src 'nonce-**CSP_NONCE**' 'strict-dynamic' 'unsafe-eval'\",\"style-src 'self' 'unsafe-inline'\",\"img-src 'self' https:\",\"object-src 'none'\",\"font-src 'self'\",\"worker-src 'self' blob:\",\"base-uri 'self'\"]],\"link\":[\"</mfe-application/assets/style.css>; rel=preload; as=style; nonce=**CSP_NONCE**\",\"<https://cdn.mia-platform.eu/micro-lc/orchestrator/2.4.3/dist/micro-lc.production.js>; rel=modulepreload; as=script; nonce=**CSP_NONCE**\",\"<https://cdn.mia-platform.eu/micro-lc/orchestrator/2.4.3/dist/assets/composer.js>; rel=preload; as=fetch; crossorigin\",\"<https://cdn.mia-platform.eu/backoffice/bk-web-components/{{BACK_KIT_VERSION}}/dist/bk-web-components.esm.js>; rel=preload; as=fetch; crossorigin\",\"<https://cdn.mia-platform.eu/backoffice/bk-web-components/{{BACK_KIT_VERSION}}/dist/bk-loading-animation.esm.js; rel=preload; as=fetch; crossorigin\"]}}}"
        }
      ]
    },
    "micro-lc-assets": {
      "name": "micro-lc-assets",
      "files": [
        {
          "name": "style.css",
          "content": "html,\nbody {\n  position: relative;\n  width: 100%;\n  height: 100%;\n  margin: 0;\n  padding: 0;\n  overflow: hidden;\n}\n"
        }
      ]
    },
    "rbac-sidecar-svc-opa-policies-config": {
      "name": "rbac-sidecar-svc-opa-policies-config",
      "files": [
        {
          "name": "policies.rego",
          "content": "package policies\n\nallow_all {\n  true\n}"
        }
      ]
    },
    "rbac-sidecar-svc-oas-permissions-config": {
      "name": "rbac-sidecar-svc-oas-permissions-config",
      "files": [
        {
          "name": "crud-service-permissions.json",
          "content": "{\"paths\":{\"/fm-subscriptions/\":{\"get\":{\"x-permission\":{\"allow\":\"allow_all\"}}}}}"
        }
      ],
      "gitFilesFolder": "rbac-sidecar-svc-configurations"
    }
  },
  "serviceSecrets": {},
  "serviceAccounts": {
    "api-gateway": {
      "name": "api-gateway"
    },
    "adaptive-approval": {
      "name": "adaptive-approval"
    },
    "analytics-transactions": {
      "name": "analytics-transactions"
    },
    "crud-service": {
      "name": "crud-service"
    },
    "data-visualization-backend": {
      "name": "data-visualization-backend"
    },
    "data-visualization-frontend": {
      "name": "data-visualization-frontend"
    },
    "export-service": {
      "name": "export-service"
    },
    "files-service": {
      "name": "files-service"
    },
    "flow-manager-service": {
      "name": "flow-manager-service"
    },
    "frullino-service": {
      "name": "frullino-service"
    },
    "invoice-service": {
      "name": "invoice-service"
    },
    "messaging-service": {
      "name": "messaging-service"
    },
    "payment-front-end": {
      "name": "payment-front-end"
    },
    "payment-gateway-manager": {
      "name": "payment-gateway-manager"
    },
    "pgm-bff": {
      "name": "pgm-bff"
    },
    "sms-service": {
      "name": "sms-service"
    },
    "smtp-mail-notification-service": {
      "name": "smtp-mail-notification-service"
    },
    "subscription-handler-service": {
      "name": "subscription-handler-service"
    },
    "subscription-saga": {
      "name": "subscription-saga"
    },
    "testproxy": {
      "name": "testproxy"
    },
    "micro-lc": {
      "name": "micro-lc"
    }
  },
  "unsecretedVariables": [
    {
      "name": "ANALYTICS_TRANSACTIONS_VERSION",
      "environments": {
        "PROD": {
          "value": "2.1.0"
        },
        "DEV": {
          "value": "2.1.0"
        }
      }
    },
    {
      "name": "BFF_VERSION",
      "environments": {
        "PROD": {
          "value": "2.3.0"
        },
        "DEV": {
          "value": "2.3.0"
        }
      }
    },
    {
      "name": "CRUD_SERVICE_VERSION",
      "environments": {
        "PROD": {
          "value": "7.2.0"
        },
        "DEV": {
          "value": "7.2.0"
        }
      }
    },
    {
      "name": "DATA_VIZ_BE_VERSION",
      "environments": {
        "PROD": {
          "value": "2.0.1"
        },
        "DEV": {
          "value": "2.0.1"
        }
      }
    },
    {
      "name": "DATA_VIZ_FE_VERSION",
      "environments": {
        "PROD": {
          "value": "1.8.2"
        },
        "DEV": {
          "value": "1.8.2"
        }
      }
    },
    {
      "name": "EMAIL_SENDER",
      "environments": {
        "PROD": {
          "value": "CHANGE ME"
        },
        "DEV": {
          "value": "CHANGE ME"
        }
      }
    },
    {
      "name": "FRULLINO_VERSION",
      "environments": {
        "PROD": {
          "value": "2.1.0"
        },
        "DEV": {
          "value": "2.1.0"
        }
      }
    },
    {
      "name": "LOGS",
      "environments": {
        "PROD": {
          "value": "info"
        },
        "DEV": {
          "value": "debug"
        }
      }
    },
    {
      "name": "MESSAGING_SERVICE_VERSION",
      "environments": {
        "PROD": {
          "value": "1.5.0"
        },
        "DEV": {
          "value": "1.5.0"
        }
      }
    },
    {
      "name": "NOTIFICATION_TEMPLATE_IDS",
      "environments": {
        "PROD": {
          "value": "[ [\"PAY_BY_LINK\", \"CHANGE ME\"], [\"PAYMENT_EXECUTED\", \"CHANGE ME\"], [\"PAYMENT_FAILED\", \"CHANGE ME\"], [\"PARTIAL_REFUND_EXECUTED\", \"CHANGE ME\"], [\"TOTAL_REFUND_EXECUTED\", \"CHANGE ME\"] ]"
        },
        "DEV": {
          "value": "[ [\"PAY_BY_LINK\", \"CHANGE ME\"], [\"PAYMENT_EXECUTED\", \"CHANGE ME\"], [\"PAYMENT_FAILED\", \"CHANGE ME\"], [\"PARTIAL_REFUND_EXECUTED\", \"CHANGE ME\"], [\"TOTAL_REFUND_EXECUTED\", \"CHANGE ME\"] ]"
        }
      }
    },
    {
      "name": "PAYMENT_FRONTEND_VERSION",
      "environments": {
        "PROD": {
          "value": "1.4.0"
        },
        "DEV": {
          "value": "1.4.0"
        }
      }
    },
    {
      "name": "PGM_VERSION",
      "environments": {
        "PROD": {
          "value": "3.5.0"
        },
        "DEV": {
          "value": "3.5.0"
        }
      }
    },
    {
      "name": "PROJECT_HOST",
      "environments": {
        "PROD": {
          "value": "CHANGE ME"
        },
        "DEV": {
          "value": "CHANGE ME"
        }
      }
    },
    {
      "name": "PROVIDER_PAY_BY_LINK",
      "environments": {
        "PROD": {
          "value": "CHANGE ME"
        },
        "DEV": {
          "value": "CHANGE ME"
        }
      }
    },
    {
      "name": "SUB_HANDLER_VERSION",
      "environments": {
        "PROD": {
          "value": "1.1.1"
        },
        "DEV": {
          "value": "1.1.1"
        }
      }
    },
    {
      "name": "BACK_KIT_VERSION",
      "environments": {
        "PROD": {
          "value": "1.5.16"
        },
        "DEV": {
          "value": "1.5.16"
        }
      }
    }
  ],
  "fastDataConfig": {
    "version": "2.2.0",
    "lastCommitId": "21f2c602-dace-42cf-93c6-bab28a99a046",
    "updatedAt": "2025-04-27T08:12:00.393Z",
    "systems": {
      "system-of-record-a": {
        "systemId": "system-of-record-a",
        "dataSourceType": "kafka",
        "kafka": {
          "messageAdapter": "debezium"
        },
        "projections": {
          "projection-a": {
            "projectionId": "projection-a",
            "topics": {
              "type": "advanced",
              "ingestionTopicName": "6b38a8ec-816c-487c-986d-c59edb294ea6.all-config.system-of-record-a.projection-a.ingestion",
              "prUpdateTopicName": "6b38a8ec-816c-487c-986d-c59edb294ea6.all-config.system-of-record-a.projection-a.pr-update"
            },
            "fields": [
              {
                "name": "_id",
                "type": "ObjectId",
                "nullable": false,
                "required": true,
                "custom": false,
                "description": "_id",
                "sensitivityValue": 0
              },
              {
                "name": "creatorId",
                "type": "string",
                "nullable": false,
                "required": true,
                "custom": false,
                "description": "creatorId",
                "sensitivityValue": 0
              },
              {
                "name": "createdAt",
                "type": "Date",
                "nullable": false,
                "required": true,
                "custom": false,
                "description": "createdAt",
                "sensitivityValue": 0
              },
              {
                "name": "updaterId",
                "type": "string",
                "nullable": false,
                "required": true,
                "custom": false,
                "description": "updaterId",
                "sensitivityValue": 0
              },
              {
                "name": "updatedAt",
                "type": "Date",
                "nullable": false,
                "required": true,
                "custom": false,
                "description": "updatedAt",
                "sensitivityValue": 0
              },
              {
                "name": "__STATE__",
                "type": "string",
                "nullable": false,
                "required": true,
                "custom": false,
                "description": "__STATE__",
                "sensitivityValue": 0
              },
              {
                "name": "title",
                "type": "string",
                "castFunction": "defaultIdentity",
                "nullable": false,
                "required": false,
                "primaryKey": false,
                "custom": true,
                "sensitivityValue": 0
              },
              {
                "name": "bookid",
                "type": "string",
                "castFunction": "defaultIdentity",
                "nullable": false,
                "required": false,
                "primaryKey": true,
                "custom": true,
                "sensitivityValue": 0
              }
            ],
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
                "name": "mia_primary_key_index",
                "type": "normal",
                "unique": true,
                "fields": [
                  {
                    "name": "bookid",
                    "order": 1
                  }
                ]
              },
              {
                "name": "mia_internal_counter_index",
                "type": "normal",
                "unique": false,
                "fields": [
                  {
                    "name": "bookid",
                    "order": 1
                  },
                  {
                    "name": "__internal__counter",
                    "order": 1
                  },
                  {
                    "name": "__internal__counterType",
                    "order": 1
                  }
                ]
              },
              {
                "name": "mia_internal_counter_type_index",
                "type": "normal",
                "unique": false,
                "fields": [
                  {
                    "name": "bookid",
                    "order": 1
                  },
                  {
                    "name": "__internal__counterType",
                    "order": 1
                  }
                ]
              },
              {
                "name": "mia_state_index",
                "type": "normal",
                "unique": false,
                "fields": [
                  {
                    "name": "bookid",
                    "order": 1
                  },
                  {
                    "name": "__STATE__",
                    "order": 1
                  }
                ]
              }
            ],
            "primaryKeyIndex": {
              "automatic": true
            }
          }
        },
        "isLowCode": true
      },
      "system-of-record-b": {
        "systemId": "system-of-record-b",
        "dataSourceType": "kafka",
        "kafka": {
          "messageAdapter": "basic"
        },
        "projections": {
          "prj-library": {
            "projectionId": "prj-library",
            "topics": {
              "type": "advanced",
              "ingestionTopicName": "6b38a8ec-816c-487c-986d-c59edb294ea6.all-config.system-of-record-b.prj-library.ingestion",
              "prUpdateTopicName": "6b38a8ec-816c-487c-986d-c59edb294ea6.all-config.system-of-record-b.prj-library.pr-update"
            },
            "fields": [
              {
                "name": "_id",
                "type": "ObjectId",
                "nullable": false,
                "required": true,
                "custom": false,
                "description": "_id",
                "sensitivityValue": 0
              },
              {
                "name": "creatorId",
                "type": "string",
                "nullable": false,
                "required": true,
                "custom": false,
                "description": "creatorId",
                "sensitivityValue": 0
              },
              {
                "name": "createdAt",
                "type": "Date",
                "nullable": false,
                "required": true,
                "custom": false,
                "description": "createdAt",
                "sensitivityValue": 0
              },
              {
                "name": "updaterId",
                "type": "string",
                "nullable": false,
                "required": true,
                "custom": false,
                "description": "updaterId",
                "sensitivityValue": 0
              },
              {
                "name": "updatedAt",
                "type": "Date",
                "nullable": false,
                "required": true,
                "custom": false,
                "description": "updatedAt",
                "sensitivityValue": 0
              },
              {
                "name": "__STATE__",
                "type": "string",
                "nullable": false,
                "required": true,
                "custom": false,
                "description": "__STATE__",
                "sensitivityValue": 0
              },
              {
                "name": "name",
                "type": "string",
                "castFunction": "defaultIdentity",
                "nullable": false,
                "required": false,
                "primaryKey": false,
                "custom": true,
                "sensitivityValue": 0
              },
              {
                "name": "libraryid",
                "type": "string",
                "castFunction": "defaultIdentity",
                "nullable": false,
                "required": false,
                "primaryKey": true,
                "custom": true,
                "sensitivityValue": 0
              }
            ],
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
                "name": "mia_primary_key_index",
                "type": "normal",
                "unique": true,
                "fields": [
                  {
                    "name": "libraryid",
                    "order": 1
                  }
                ]
              },
              {
                "name": "mia_internal_counter_index",
                "type": "normal",
                "unique": false,
                "fields": [
                  {
                    "name": "libraryid",
                    "order": 1
                  },
                  {
                    "name": "__internal__counter",
                    "order": 1
                  },
                  {
                    "name": "__internal__counterType",
                    "order": 1
                  }
                ]
              },
              {
                "name": "mia_internal_counter_type_index",
                "type": "normal",
                "unique": false,
                "fields": [
                  {
                    "name": "libraryid",
                    "order": 1
                  },
                  {
                    "name": "__internal__counterType",
                    "order": 1
                  }
                ]
              },
              {
                "name": "mia_state_index",
                "type": "normal",
                "unique": false,
                "fields": [
                  {
                    "name": "libraryid",
                    "order": 1
                  },
                  {
                    "name": "__STATE__",
                    "order": 1
                  }
                ]
              }
            ],
            "primaryKeyIndex": {
              "automatic": true
            }
          }
        },
        "isLowCode": true
      }
    },
    "castFunctions": {
      "defaultIdentity": {
        "castFunctionId": "defaultIdentity",
        "name": "defaultIdentity",
        "dataType": "all",
        "casting": "module.exports = function castIdentity (value, fieldName, logger) {\n  return value\n}",
        "type": "default"
      },
      "defaultCastToString": {
        "castFunctionId": "defaultCastToString",
        "name": "defaultCastToString",
        "dataType": "string",
        "casting": "module.exports = function castToString (value, fieldName, logger) {\n  if (value === null) {return null}\n  if (value === undefined) {return undefined}\n  if (typeof value === 'object') {return JSON.stringify(value)}\n  return String(value)\n}\n",
        "type": "default"
      },
      "defaultCastToInteger": {
        "castFunctionId": "defaultCastToInteger",
        "name": "defaultCastToInteger",
        "dataType": "number",
        "casting": "module.exports = function castToInt (value, fieldName, logger) {\n  if (value === null) {return null}\n  if (value === undefined) {return undefined}\n  const number = Number(value)\n  if (Number.isNaN(number)) {\n    logger.debug({fieldName}, 'is invalid, will be casted to undefined')\n    return undefined\n  }\n  return parseInt(number, 10)\n}\n",
        "type": "default"
      },
      "defaultCastToFloat": {
        "castFunctionId": "defaultCastToFloat",
        "name": "defaultCastToFloat",
        "dataType": "number",
        "casting": "module.exports = function castToFloat (value, fieldName, logger) {\n  if (value === null) {return null}\n  if (value === undefined) {return undefined}\n  const number = Number(value)\n  if (Number.isNaN(number)) {\n    logger.debug({fieldName}, 'is invalid, will be casted to undefined')\n    return undefined\n  }\n  return number\n}\n",
        "type": "default"
      },
      "defaultCastUnitTimestampToISOString": {
        "castFunctionId": "defaultCastUnitTimestampToISOString",
        "name": "defaultCastUnitTimestampToISOString",
        "dataType": "string",
        "casting": "module.exports = function castUnitTimestampToISOString (value, fieldName, logger) {\n  if (value === null) {return null}\n  if (value === undefined) {return undefined}\n  const date = new Date(value)\n  if (date.toString() !== 'Invalid Date') {return date.toISOString()}\n  logger.debug({fieldName}, 'is invalid, will be casted to undefined')\n  return undefined\n}\n",
        "type": "default"
      },
      "defaultCastStringToBoolean": {
        "castFunctionId": "defaultCastStringToBoolean",
        "name": "defaultCastStringToBoolean",
        "dataType": "boolean",
        "casting": "module.exports = function castStringToBoolean (value, fieldName, logger) {\n  if (value === 'false') {return false}\n  if (value === 'true') {return true}\n  if (value === null) {return null}\n  if (value === undefined) {return undefined}\n  logger.debug({fieldName}, 'is invalid, will be casted to undefined')\n  return undefined\n}\n",
        "type": "default"
      },
      "defaultCastToDate": {
        "castFunctionId": "defaultCastToDate",
        "name": "defaultCastToDate",
        "dataType": "Date",
        "casting": "module.exports = function castToDate (value, fieldName, logger) {\n  if (value === null) {return null}\n  const date = new Date(value)\n  if (date.toString() !== 'Invalid Date') {\n    return date\n  }\n  logger.debug({fieldName}, 'is invalid, will be casted to undefined')\n  return undefined\n}",
        "type": "default"
      },
      "defaultCastToObject": {
        "castFunctionId": "defaultCastToObject",
        "name": "defaultCastToObject",
        "dataType": "RawObject",
        "casting": "module.exports = function castToObject (value, fieldName, logger) {\n  if (value === null) {return null}\n  let valueToCast = value\n  try {\n    if(typeof valueToCast === 'string') {valueToCast = JSON.parse(valueToCast)}\n  } catch(e) {\n    logger.debug({fieldName}, 'is invalid, will be casted to undefined')\n    return undefined\n  }\n  if (typeof valueToCast !== 'object' || valueToCast.constructor !== Object) {\n    logger.debug({fieldName}, 'is invalid, will be casted to undefined')\n    return undefined\n  }\n  return valueToCast\n}",
        "type": "default"
      },
      "defaultCastToArrayOfObject": {
        "castFunctionId": "defaultCastToArrayOfObject",
        "name": "defaultCastToArrayOfObject",
        "dataType": "Array_RawObject",
        "casting": "module.exports = function castToArrayOfObject (value, fieldName, logger) {\n  if (value === null) { return null }\n  let valueToCast = value\n  try {\n    if(typeof valueToCast === 'string') {valueToCast = JSON.parse(valueToCast)}\n  } catch(e) {\n    logger.debug({fieldName}, 'is invalid, will be casted to undefined')\n    return undefined\n  }\n  if (typeof valueToCast !== 'object' || valueToCast.constructor !== Array ||\n  valueToCast.some(element => typeof element !== 'object' || element.constructor !== Object)) {\n    logger.debug({fieldName}, 'is invalid, will be casted to undefined')\n    return undefined\n  }\n  return valueToCast\n}",
        "type": "default"
      }
    },
    "singleViews": {
      "sv-libraries": {
        "singleViewId": "sv-libraries",
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
          }
        ],
        "internalEndpoints": [
          {
            "basePath": "/sv-libraries",
            "defaultState": "PUBLIC"
          }
        ],
        "fields": [
          {
            "name": "_id",
            "type": "ObjectId",
            "required": true,
            "nullable": false,
            "description": "_id",
            "sensitivityValue": 0
          },
          {
            "name": "creatorId",
            "type": "string",
            "required": true,
            "nullable": false,
            "description": "creatorId",
            "sensitivityValue": 0
          },
          {
            "name": "createdAt",
            "type": "Date",
            "required": true,
            "nullable": false,
            "description": "createdAt",
            "sensitivityValue": 0
          },
          {
            "name": "updaterId",
            "type": "string",
            "required": true,
            "nullable": false,
            "description": "updaterId",
            "sensitivityValue": 0
          },
          {
            "name": "updatedAt",
            "type": "Date",
            "required": true,
            "nullable": false,
            "description": "updatedAt",
            "sensitivityValue": 0
          },
          {
            "name": "__STATE__",
            "type": "string",
            "required": true,
            "nullable": false,
            "description": "__STATE__",
            "sensitivityValue": 0
          },
          {
            "name": "librarier",
            "type": "RawObject",
            "required": false,
            "nullable": false,
            "sensitivityValue": 0,
            "schema": {
              "properties": {
                "libraryId": {
                  "type": "string",
                  "description": "Unique identifier for the library",
                  "pattern": "^[a-fA-F0-9]{24}$"
                },
                "name": {
                  "type": "string",
                  "description": "Name of the library"
                },
                "location": {
                  "type": "object",
                  "properties": {
                    "address": {
                      "type": "string",
                      "description": "Street address of the library"
                    },
                    "city": {
                      "type": "string",
                      "description": "City where the library is located"
                    },
                    "state": {
                      "type": "string",
                      "description": "State where the library is located"
                    },
                    "zipCode": {
                      "type": "string",
                      "description": "Postal code for the library location",
                      "pattern": "^[0-9]{5}(?:-[0-9]{4})?$"
                    }
                  },
                  "required": [
                    "address",
                    "city",
                    "state",
                    "zipCode"
                  ]
                },
                "books": {
                  "type": "array",
                  "description": "List of books available in the library",
                  "items": {
                    "type": "object",
                    "properties": {
                      "bookId": {
                        "type": "string",
                        "description": "Unique identifier for the book",
                        "pattern": "^[a-fA-F0-9]{24}$"
                      },
                      "title": {
                        "type": "string",
                        "description": "Title of the book"
                      },
                      "author": {
                        "type": "string",
                        "description": "Author of the book"
                      },
                      "publishedYear": {
                        "type": "integer",
                        "description": "Year the book was published",
                        "minimum": 1450,
                        "maximum": 2023
                      }
                    },
                    "required": [
                      "bookId",
                      "title",
                      "author"
                    ]
                  }
                },
                "metadata": {
                  "type": "object",
                  "additionalProperties": true,
                  "nullable": true,
                  "description": "Additional metadata related to the library"
                }
              },
              "required": [
                "libraryId",
                "name",
                "location",
                "books"
              ],
              "type": "object"
            }
          }
        ],
        "services": []
      }
    },
    "erSchemas": {
      "book-libraries": {
        "name": "book-libraries",
        "content": "{\n  \"config\": {\n    \"projection-a\": {\n      \"outgoing\": {\n        \"prj-library\": {\n          \"conditions\": {\n            \"projection-a__to__prj-library_0\": {\n              \"condition\": {\n                \"libraryid\": \"bookid\"\n              },\n              \"oneToMany\": false\n            }\n          }\n        }\n      }\n    },\n    \"prj-library\": {\n      \"outgoing\": {\n        \"projection-a\": {\n          \"conditions\": {\n            \"prj-library__to__projection-a_0\": {\n              \"condition\": {\n                \"bookid\": \"libraryid\"\n              },\n              \"oneToMany\": false\n            }\n          }\n        }\n      }\n    }\n  },\n  \"version\": \"1.0.0\"\n}"
      }
    }
  },
  "microfrontendPluginsConfig": {
    "flowManagerConfigurations": {
      "flows": {
        "flow-manager-service": {
          "commands": {
            "d52fbaeb-b6db-44ce-b9ad-063e0f45cdeb": {
              "label": "createLink",
              "protocol": "createLink"
            },
            "7e7e3ffe-7f61-49f7-a6ee-5c61c5a7695e": {
              "label": "getAuthorization",
              "protocol": "getAuthorization"
            },
            "ac06bcbe-db36-4ade-b363-185b78783553": {
              "label": "paymentScheduled",
              "protocol": "pay"
            },
            "fbb3be8d-b54f-4abf-81e2-7af96c573637": {
              "label": "subscriptionScheduledRequested",
              "protocol": "subscriptionScheduledRequested"
            },
            "37d5adda-092a-4af8-8248-a7955c939258": {
              "label": "subscriptionStart",
              "protocol": "subscriptionStart"
            },
            "aac2a672-9046-4fb5-b1ed-71f56acbe2c4": {
              "label": "subscriptionPaymentRequested",
              "protocol": "subscriptionPaymentRequested"
            },
            "35e03f54-91e0-4c5b-a2eb-f626350efb25": {
              "label": "refundRequested",
              "protocol": "refund"
            }
          },
          "configuratorSettings": {},
          "creationNode": {
            "canvasPosition": {
              "x": 125,
              "y": 795
            },
            "initialEvent": {
              "canvasPosition": {
                "x": 0,
                "y": 0
              },
              "name": "paymentCreated",
              "targetState": "7663ecb7-ed8d-4852-af1c-81eae039ada8"
            }
          },
          "eventGroups": {
            "0": {
              "color": "#EE308D",
              "description": "paymentCreated",
              "name": "paymentCreated"
            },
            "1": {
              "color": "#EB4F25",
              "description": "paymentPaid",
              "name": "paymentPaid"
            },
            "2": {
              "color": "#CF6D1C",
              "description": "paymentPartiallyRefunded",
              "name": "paymentPartiallyRefunded"
            },
            "3": {
              "color": "#85910D",
              "description": "paymentTotallyRefunded",
              "name": "paymentTotallyRefunded"
            },
            "1000": {
              "color": "#3FA11F",
              "description": "paymentFailed",
              "name": "paymentFailed"
            }
          },
          "events": {
            "888badc1-5c4a-4f86-8132-12f80ab90f70": {
              "canvasPosition": {
                "x": 0,
                "y": 0
              },
              "group": 0,
              "name": "scheduleRequested",
              "sourceState": "7663ecb7-ed8d-4852-af1c-81eae039ada8",
              "targetState": "174bd984-aadc-4905-9ec4-70ef67339e0a"
            },
            "88df48ae-108b-47a5-acc9-8aa0cb8ed998": {
              "canvasPosition": {
                "x": 0,
                "y": 0
              },
              "group": 0,
              "name": "subscriptionScheduledRequested",
              "sourceState": "7663ecb7-ed8d-4852-af1c-81eae039ada8",
              "targetState": "15a8d019-c7ce-43d7-abf1-f128fef4318d"
            },
            "f5888953-838c-4ba8-85aa-48bccab45555": {
              "canvasPosition": {
                "x": 0,
                "y": 0
              },
              "group": 0,
              "name": "subscriptionStart",
              "sourceState": "7663ecb7-ed8d-4852-af1c-81eae039ada8",
              "targetState": "b46ea930-8f28-4c08-992b-e87041d0e98d"
            },
            "3e229223-3787-401a-a1fc-0d3ea9598227": {
              "canvasPosition": {
                "x": 0,
                "y": 0
              },
              "group": 0,
              "name": "subscriptionPaymentRequested",
              "sourceState": "7663ecb7-ed8d-4852-af1c-81eae039ada8",
              "targetState": "e7ac0bbc-a64a-4b74-88d4-2c8c83c741c7"
            },
            "9e96561a-c9a6-498c-803d-8241a18d2589": {
              "canvasPosition": {
                "x": 0,
                "y": 0
              },
              "group": 0,
              "name": "authorizationRequested",
              "sourceState": "7663ecb7-ed8d-4852-af1c-81eae039ada8",
              "targetState": "5c2aaae3-2c69-47e0-86ec-0bfc2b12e345"
            },
            "00b9f0f6-919b-4674-aa60-24c9216f1d44": {
              "canvasPosition": {
                "x": 0,
                "y": 0
              },
              "group": 0,
              "name": "linkRequested",
              "sourceState": "7663ecb7-ed8d-4852-af1c-81eae039ada8",
              "targetState": "50ace07b-dc25-4418-a2e7-10784b3effe8"
            },
            "b16dde13-c709-4d08-8711-a991b577ec83": {
              "canvasPosition": {
                "x": 0,
                "y": 0
              },
              "group": 1,
              "name": "paymentExecuted",
              "sourceState": "7663ecb7-ed8d-4852-af1c-81eae039ada8",
              "targetState": "9f9a743c-5798-4074-94ed-f18f60b501f4"
            },
            "4f10e77c-ee78-45fd-9ce0-f5aa0b472ecf": {
              "canvasPosition": {
                "x": 0,
                "y": 0
              },
              "group": 1000,
              "name": "paymentFailed",
              "sourceState": "7663ecb7-ed8d-4852-af1c-81eae039ada8",
              "targetState": "0201cdd1-9b4f-420c-8ac6-3c04c9eab09b"
            },
            "0145bc0b-28d3-48f1-ab93-c2f84247465f": {
              "canvasPosition": {
                "x": 0,
                "y": 0
              },
              "group": 0,
              "name": "linkCreated",
              "sourceState": "50ace07b-dc25-4418-a2e7-10784b3effe8",
              "targetState": "1161d643-6236-48d0-9406-0116b1bc77fe"
            },
            "930f86a3-ee92-4410-8a12-df6af0f7b521": {
              "canvasPosition": {
                "x": 0,
                "y": 0
              },
              "group": 1000,
              "name": "paymentFailed",
              "sourceState": "50ace07b-dc25-4418-a2e7-10784b3effe8",
              "targetState": "0201cdd1-9b4f-420c-8ac6-3c04c9eab09b"
            },
            "1a355d96-e85d-42a1-aec2-b4024bf9fef0": {
              "canvasPosition": {
                "x": 0,
                "y": 0
              },
              "group": 0,
              "name": "notificationSent",
              "sourceState": "1161d643-6236-48d0-9406-0116b1bc77fe",
              "targetState": "329758a6-8386-4a6a-8ee6-362a96bb7190"
            },
            "1b364d05-9ef2-4bf4-bed6-b53a95ea3cd7": {
              "canvasPosition": {
                "x": 0,
                "y": 0
              },
              "group": 1000,
              "name": "paymentFailed",
              "sourceState": "1161d643-6236-48d0-9406-0116b1bc77fe",
              "targetState": "0201cdd1-9b4f-420c-8ac6-3c04c9eab09b"
            },
            "b0b62c45-2797-4b16-84de-83f3641f06cb": {
              "canvasPosition": {
                "x": 0,
                "y": 0
              },
              "group": 0,
              "name": "authorizationScheduled",
              "sourceState": "5c2aaae3-2c69-47e0-86ec-0bfc2b12e345",
              "targetState": "5c60c09a-084f-495f-885f-415a1ede85ee"
            },
            "5f6a497a-ad8e-4736-a92f-803d3db614de": {
              "canvasPosition": {
                "x": 0,
                "y": 0
              },
              "group": 0,
              "name": "subscriptionStart",
              "sourceState": "5c60c09a-084f-495f-885f-415a1ede85ee",
              "targetState": "b46ea930-8f28-4c08-992b-e87041d0e98d"
            },
            "81047f24-5aec-4df3-9eeb-f2e3d35a61ba": {
              "canvasPosition": {
                "x": 0,
                "y": 0
              },
              "group": 0,
              "name": "subscriptionPaymentRequested",
              "sourceState": "5c60c09a-084f-495f-885f-415a1ede85ee",
              "targetState": "e7ac0bbc-a64a-4b74-88d4-2c8c83c741c7"
            },
            "896c07b3-0bd6-4e8c-8cc6-0af0aeca4183": {
              "canvasPosition": {
                "x": 0,
                "y": 0
              },
              "group": 1000,
              "name": "paymentFailed",
              "sourceState": "5c60c09a-084f-495f-885f-415a1ede85ee",
              "targetState": "0201cdd1-9b4f-420c-8ac6-3c04c9eab09b"
            },
            "25284c86-08e2-445c-bea3-cbcbd02ca935": {
              "canvasPosition": {
                "x": 0,
                "y": 0
              },
              "group": 0,
              "name": "paymentScheduled",
              "sourceState": "174bd984-aadc-4905-9ec4-70ef67339e0a",
              "targetState": "329758a6-8386-4a6a-8ee6-362a96bb7190"
            },
            "a6a8657d-0063-40ea-b244-4c454fc5d035": {
              "canvasPosition": {
                "x": 0,
                "y": 0
              },
              "group": 1,
              "name": "paymentExecuted",
              "sourceState": "174bd984-aadc-4905-9ec4-70ef67339e0a",
              "targetState": "9f9a743c-5798-4074-94ed-f18f60b501f4"
            },
            "7ba6a5e4-8085-416c-a7ed-dfe4d127691f": {
              "canvasPosition": {
                "x": 0,
                "y": 0
              },
              "group": 1,
              "name": "paymentExecutedBySystem",
              "sourceState": "174bd984-aadc-4905-9ec4-70ef67339e0a",
              "targetState": "9f9a743c-5798-4074-94ed-f18f60b501f4"
            },
            "080b2d8c-4754-48a7-83c8-944f89655c86": {
              "canvasPosition": {
                "x": 0,
                "y": 0
              },
              "group": 1000,
              "name": "paymentFailed",
              "sourceState": "174bd984-aadc-4905-9ec4-70ef67339e0a",
              "targetState": "0201cdd1-9b4f-420c-8ac6-3c04c9eab09b"
            },
            "dbb2d6e7-ad9f-4ae2-8e3e-1a811800e1fe": {
              "canvasPosition": {
                "x": 0,
                "y": 0
              },
              "group": 1000,
              "name": "paymentFailedBySystem",
              "sourceState": "174bd984-aadc-4905-9ec4-70ef67339e0a",
              "targetState": "0201cdd1-9b4f-420c-8ac6-3c04c9eab09b"
            },
            "6bae9ca6-d8ce-44d5-a1a0-dc41685a5cc2": {
              "canvasPosition": {
                "x": 0,
                "y": 0
              },
              "group": 0,
              "name": "paymentScheduled",
              "sourceState": "15a8d019-c7ce-43d7-abf1-f128fef4318d",
              "targetState": "329758a6-8386-4a6a-8ee6-362a96bb7190"
            },
            "06964321-46f7-4b43-9ad2-272de66de608": {
              "canvasPosition": {
                "x": 0,
                "y": 0
              },
              "group": 1,
              "name": "paymentExecuted",
              "sourceState": "15a8d019-c7ce-43d7-abf1-f128fef4318d",
              "targetState": "9f9a743c-5798-4074-94ed-f18f60b501f4"
            },
            "71e599da-34dc-4778-b965-3c815834e606": {
              "canvasPosition": {
                "x": 0,
                "y": 0
              },
              "group": 1,
              "name": "paymentExecutedBySystem",
              "sourceState": "15a8d019-c7ce-43d7-abf1-f128fef4318d",
              "targetState": "9f9a743c-5798-4074-94ed-f18f60b501f4"
            },
            "f95c83a0-7db7-4f42-96ae-b7dc6b8f907b": {
              "canvasPosition": {
                "x": 0,
                "y": 0
              },
              "group": 1000,
              "name": "paymentFailed",
              "sourceState": "15a8d019-c7ce-43d7-abf1-f128fef4318d",
              "targetState": "0201cdd1-9b4f-420c-8ac6-3c04c9eab09b"
            },
            "43ab7ce1-3f7b-4416-933f-e50affb56ef3": {
              "canvasPosition": {
                "x": 0,
                "y": 0
              },
              "group": 1000,
              "name": "paymentFailedBySystem",
              "sourceState": "15a8d019-c7ce-43d7-abf1-f128fef4318d",
              "targetState": "0201cdd1-9b4f-420c-8ac6-3c04c9eab09b"
            },
            "3837831b-a9b8-467d-a931-e90fd7b77f65": {
              "canvasPosition": {
                "x": 0,
                "y": 0
              },
              "group": 0,
              "name": "paymentScheduled",
              "sourceState": "b46ea930-8f28-4c08-992b-e87041d0e98d",
              "targetState": "329758a6-8386-4a6a-8ee6-362a96bb7190"
            },
            "93b2655d-faa5-4fb8-99b0-235c86387d05": {
              "canvasPosition": {
                "x": 0,
                "y": 0
              },
              "group": 1,
              "name": "paymentExecuted",
              "sourceState": "b46ea930-8f28-4c08-992b-e87041d0e98d",
              "targetState": "9f9a743c-5798-4074-94ed-f18f60b501f4"
            },
            "ff5f47f4-106d-4962-9789-1c1b50e95a85": {
              "canvasPosition": {
                "x": 0,
                "y": 0
              },
              "group": 1,
              "name": "paymentExecutedBySystem",
              "sourceState": "b46ea930-8f28-4c08-992b-e87041d0e98d",
              "targetState": "9f9a743c-5798-4074-94ed-f18f60b501f4"
            },
            "d231a0b4-5c94-4360-8ee2-4d90add488fb": {
              "canvasPosition": {
                "x": 0,
                "y": 0
              },
              "group": 1000,
              "name": "paymentFailed",
              "sourceState": "b46ea930-8f28-4c08-992b-e87041d0e98d",
              "targetState": "0201cdd1-9b4f-420c-8ac6-3c04c9eab09b"
            },
            "787e5f89-3f9a-485f-b3cf-cb6dbbf40964": {
              "canvasPosition": {
                "x": 0,
                "y": 0
              },
              "group": 1000,
              "name": "paymentFailedBySystem",
              "sourceState": "b46ea930-8f28-4c08-992b-e87041d0e98d",
              "targetState": "0201cdd1-9b4f-420c-8ac6-3c04c9eab09b"
            },
            "0a29ef44-ef9f-4257-84c8-bcc836e82a6b": {
              "canvasPosition": {
                "x": 0,
                "y": 0
              },
              "group": 0,
              "name": "paymentScheduled",
              "sourceState": "e7ac0bbc-a64a-4b74-88d4-2c8c83c741c7",
              "targetState": "329758a6-8386-4a6a-8ee6-362a96bb7190"
            },
            "58c0d6fe-ea81-4ca4-880b-1580990d5b15": {
              "canvasPosition": {
                "x": 0,
                "y": 0
              },
              "group": 1,
              "name": "paymentExecuted",
              "sourceState": "e7ac0bbc-a64a-4b74-88d4-2c8c83c741c7",
              "targetState": "9f9a743c-5798-4074-94ed-f18f60b501f4"
            },
            "cb5902cb-4239-4f3e-b287-be771b6df8e8": {
              "canvasPosition": {
                "x": 0,
                "y": 0
              },
              "group": 1,
              "name": "paymentExecutedBySystem",
              "sourceState": "e7ac0bbc-a64a-4b74-88d4-2c8c83c741c7",
              "targetState": "9f9a743c-5798-4074-94ed-f18f60b501f4"
            },
            "cd582863-a321-4776-ada7-5ad7a54f2dac": {
              "canvasPosition": {
                "x": 0,
                "y": 0
              },
              "group": 1000,
              "name": "paymentFailed",
              "sourceState": "e7ac0bbc-a64a-4b74-88d4-2c8c83c741c7",
              "targetState": "0201cdd1-9b4f-420c-8ac6-3c04c9eab09b"
            },
            "8a965dba-13b8-42e3-bf45-ba6b42d06aac": {
              "canvasPosition": {
                "x": 0,
                "y": 0
              },
              "group": 1000,
              "name": "paymentFailedBySystem",
              "sourceState": "e7ac0bbc-a64a-4b74-88d4-2c8c83c741c7",
              "targetState": "0201cdd1-9b4f-420c-8ac6-3c04c9eab09b"
            },
            "ba5f9817-5e49-47fd-87b0-6df761936c41": {
              "canvasPosition": {
                "x": 0,
                "y": 0
              },
              "group": 0,
              "name": "update",
              "sourceState": "329758a6-8386-4a6a-8ee6-362a96bb7190",
              "targetState": "329758a6-8386-4a6a-8ee6-362a96bb7190"
            },
            "8afc3df7-c41b-4318-a855-14446cc84c2e": {
              "canvasPosition": {
                "x": 0,
                "y": 0
              },
              "group": 1,
              "name": "paymentExecuted",
              "sourceState": "329758a6-8386-4a6a-8ee6-362a96bb7190",
              "targetState": "9f9a743c-5798-4074-94ed-f18f60b501f4"
            },
            "7735e6d9-eee3-494f-a910-c6492a5fa158": {
              "canvasPosition": {
                "x": 0,
                "y": 0
              },
              "group": 1,
              "name": "paymentExecutedBySystem",
              "sourceState": "329758a6-8386-4a6a-8ee6-362a96bb7190",
              "targetState": "9f9a743c-5798-4074-94ed-f18f60b501f4"
            },
            "4a8bae50-3696-4037-9e60-18f0b21ef3bd": {
              "canvasPosition": {
                "x": 0,
                "y": 0
              },
              "group": 1000,
              "name": "paymentFailed",
              "sourceState": "329758a6-8386-4a6a-8ee6-362a96bb7190",
              "targetState": "0201cdd1-9b4f-420c-8ac6-3c04c9eab09b"
            },
            "b406ce29-5b2b-489f-bb9d-d2ac52bb98d8": {
              "canvasPosition": {
                "x": 0,
                "y": 0
              },
              "group": 1000,
              "name": "paymentFailedBySystem",
              "sourceState": "329758a6-8386-4a6a-8ee6-362a96bb7190",
              "targetState": "0201cdd1-9b4f-420c-8ac6-3c04c9eab09b"
            },
            "11ef5856-82c5-4999-9131-8a473320044a": {
              "canvasPosition": {
                "x": 0,
                "y": 0
              },
              "group": 1,
              "name": "refundRequested",
              "sourceState": "9f9a743c-5798-4074-94ed-f18f60b501f4",
              "targetState": "628b22cc-3f43-4a30-be62-d52543850c52"
            },
            "6414f8c2-056a-4cad-9ee4-625626c18d7f": {
              "canvasPosition": {
                "x": 0,
                "y": 0
              },
              "group": 1,
              "name": "sendNotification",
              "sourceState": "9f9a743c-5798-4074-94ed-f18f60b501f4",
              "targetState": "9f9a743c-5798-4074-94ed-f18f60b501f4"
            },
            "a933d4b4-49bd-4d03-adc9-e65979e94df0": {
              "canvasPosition": {
                "x": 0,
                "y": 0
              },
              "group": 1,
              "name": "refundFailed",
              "sourceState": "628b22cc-3f43-4a30-be62-d52543850c52",
              "targetState": "fd304f62-def6-4c8e-a6af-e221cda2b25e"
            },
            "68c148d5-43ad-492e-b0f2-2cdd9a75df10": {
              "canvasPosition": {
                "x": 0,
                "y": 0
              },
              "group": 2,
              "name": "partialRefundExecuted",
              "sourceState": "628b22cc-3f43-4a30-be62-d52543850c52",
              "targetState": "b21283b7-0b20-43c4-87e3-b0720815f3d7"
            },
            "b6febd66-3eda-4042-8b0d-8db76616c59d": {
              "canvasPosition": {
                "x": 0,
                "y": 0
              },
              "group": 3,
              "name": "totalRefundExecuted",
              "sourceState": "628b22cc-3f43-4a30-be62-d52543850c52",
              "targetState": "eaf40fce-0592-4b7e-a5ee-abec2e554da3"
            },
            "30677de8-7579-43bf-b8e2-e0fc952ea33e": {
              "canvasPosition": {
                "x": 0,
                "y": 0
              },
              "group": 1,
              "name": "refundRequested",
              "sourceState": "fd304f62-def6-4c8e-a6af-e221cda2b25e",
              "targetState": "628b22cc-3f43-4a30-be62-d52543850c52"
            },
            "9f5edbef-4237-4e0c-a406-e82065863769": {
              "canvasPosition": {
                "x": 0,
                "y": 0
              },
              "group": 2,
              "name": "refundRequested",
              "sourceState": "b21283b7-0b20-43c4-87e3-b0720815f3d7",
              "targetState": "d251c865-e2e3-4cdb-acf2-7be80c58fa77"
            },
            "63c93dca-8697-472e-b0df-59ba79ad2a19": {
              "canvasPosition": {
                "x": 0,
                "y": 0
              },
              "group": 1,
              "name": "sendNotification",
              "sourceState": "b21283b7-0b20-43c4-87e3-b0720815f3d7",
              "targetState": "b21283b7-0b20-43c4-87e3-b0720815f3d7"
            },
            "852fd760-64c6-49aa-b0f2-53968cd40246": {
              "canvasPosition": {
                "x": 0,
                "y": 0
              },
              "group": 2,
              "name": "partialRefundExecuted",
              "sourceState": "d251c865-e2e3-4cdb-acf2-7be80c58fa77",
              "targetState": "b21283b7-0b20-43c4-87e3-b0720815f3d7"
            },
            "36e69d55-de40-4d31-8c3f-cd9b275e7059": {
              "canvasPosition": {
                "x": 0,
                "y": 0
              },
              "group": 2,
              "name": "refundFailed",
              "sourceState": "d251c865-e2e3-4cdb-acf2-7be80c58fa77",
              "targetState": "4e23e1e4-68ee-47b9-8e48-fe9ae3d7c6dd"
            },
            "b0661c35-b184-4396-b145-3364d126d9bb": {
              "canvasPosition": {
                "x": 0,
                "y": 0
              },
              "group": 3,
              "name": "totalRefundExecuted",
              "sourceState": "d251c865-e2e3-4cdb-acf2-7be80c58fa77",
              "targetState": "eaf40fce-0592-4b7e-a5ee-abec2e554da3"
            },
            "365b28db-686d-4d8b-bdb3-c9c5637a395a": {
              "canvasPosition": {
                "x": 0,
                "y": 0
              },
              "group": 2,
              "name": "refundRequested",
              "sourceState": "4e23e1e4-68ee-47b9-8e48-fe9ae3d7c6dd",
              "targetState": "d251c865-e2e3-4cdb-acf2-7be80c58fa77"
            },
            "a12e7146-c1b1-4bea-8130-acbc12fd0705": {
              "canvasPosition": {
                "x": 0,
                "y": 0
              },
              "group": 1,
              "name": "sendNotification",
              "sourceState": "eaf40fce-0592-4b7e-a5ee-abec2e554da3",
              "targetState": "eaf40fce-0592-4b7e-a5ee-abec2e554da3"
            },
            "a46a6ceb-6ebc-4c3c-a5d7-aef8490dc665": {
              "canvasPosition": {
                "x": 0,
                "y": 0
              },
              "group": 1,
              "name": "sendNotification",
              "sourceState": "0201cdd1-9b4f-420c-8ac6-3c04c9eab09b",
              "targetState": "0201cdd1-9b4f-420c-8ac6-3c04c9eab09b"
            }
          },
          "hooks": {},
          "persistencyManagement": {
            "collectionName": "fm-transactions",
            "host": "crud-service",
            "port": 80,
            "protocol": "http",
            "type": "crud"
          },
          "protocols": {
            "pay": {
              "endpoint": "payment-gateway-manager",
              "method": "POST",
              "name": "pay",
              "path": "/saga/pay",
              "port": 80,
              "protocol": "http",
              "type": "rest"
            },
            "createLink": {
              "endpoint": "payment-gateway-manager",
              "method": "POST",
              "name": "createLink",
              "path": "/saga/pay-by-link",
              "port": 80,
              "protocol": "http",
              "type": "rest"
            },
            "subscriptionScheduledRequested": {
              "endpoint": "payment-gateway-manager",
              "method": "POST",
              "name": "subscriptionScheduledRequested",
              "path": "/saga/subscription/schedule",
              "port": 80,
              "protocol": "http",
              "type": "rest"
            },
            "subscriptionStart": {
              "endpoint": "payment-gateway-manager",
              "method": "POST",
              "name": "subscriptionStart",
              "path": "/saga/subscription/start",
              "port": 80,
              "protocol": "http",
              "type": "rest"
            },
            "subscriptionPaymentRequested": {
              "endpoint": "payment-gateway-manager",
              "method": "POST",
              "name": "subscriptionPaymentRequested",
              "path": "/saga/subscription/pay",
              "port": 80,
              "protocol": "http",
              "type": "rest"
            },
            "getAuthorization": {
              "endpoint": "payment-gateway-manager",
              "method": "POST",
              "name": "getAuthorization",
              "path": "/saga/subscription/authorization",
              "port": 80,
              "protocol": "http",
              "type": "rest"
            },
            "refund": {
              "endpoint": "payment-gateway-manager",
              "method": "POST",
              "name": "refund",
              "path": "/saga/refund",
              "port": 80,
              "protocol": "http",
              "type": "rest"
            },
            "subscription-notify": {
              "endpoint": "subscription-handler-service",
              "method": "POST",
              "name": "subscription-notify",
              "path": "/notify",
              "port": 80,
              "protocol": "http",
              "type": "rest"
            },
            "notify": {
              "endpoint": "messaging-service",
              "method": "POST",
              "name": "notify",
              "path": "/saga/send",
              "port": 80,
              "protocol": "http",
              "type": "rest"
            }
          },
          "settings": {
            "deepMergeMetadata": {
              "enabled": true
            }
          },
          "sideEffects": {},
          "stateGroups": {
            "0": {
              "color": "#EE308D",
              "description": "PAYMENT_CREATED",
              "name": "PAYMENT_CREATED"
            },
            "1": {
              "color": "#EB4F25",
              "description": "PAYMENT_PAID",
              "name": "PAYMENT_PAID"
            },
            "2": {
              "color": "#CF6D1C",
              "description": "PAYMENT_PARTIALLY_REFUNDED",
              "name": "PAYMENT_PARTIALLY_REFUNDED"
            },
            "3": {
              "color": "#85910D",
              "description": "PAYMENT_TOTALLY_REFUNDED",
              "name": "PAYMENT_TOTALLY_REFUNDED"
            },
            "1000": {
              "color": "#3FA11F",
              "description": "PAYMENT_FAILED",
              "name": "PAYMENT_FAILED"
            }
          },
          "states": {
            "7663ecb7-ed8d-4852-af1c-81eae039ada8": {
              "canvasPosition": {
                "x": 450,
                "y": 795
              },
              "description": "payment created on CRUD",
              "group": 0,
              "isFinal": false,
              "logicBlock": {
                "commandCanvasPosition": {
                  "x": 0,
                  "y": 0
                },
                "executorCanvasPosition": {
                  "x": 850,
                  "y": 795
                },
                "type": "wait-for"
              },
              "name": "PAYMENT_CREATED"
            },
            "50ace07b-dc25-4418-a2e7-10784b3effe8": {
              "canvasPosition": {
                "x": 2050,
                "y": 1335
              },
              "description": "Link has been requested",
              "group": 0,
              "isFinal": false,
              "logicBlock": {
                "commandCanvasPosition": {
                  "x": 0,
                  "y": 0
                },
                "executorCanvasPosition": {
                  "x": 2450,
                  "y": 1335
                },
                "command": "d52fbaeb-b6db-44ce-b9ad-063e0f45cdeb",
                "type": "command"
              },
              "name": "LINK_REQUESTED"
            },
            "1161d643-6236-48d0-9406-0116b1bc77fe": {
              "canvasPosition": {
                "x": 2850,
                "y": 1237.5
              },
              "description": "Link has been created",
              "group": 0,
              "isFinal": false,
              "logicBlock": {
                "commandCanvasPosition": {
                  "x": 0,
                  "y": 0
                },
                "executorCanvasPosition": {
                  "x": 3250,
                  "y": 1237.5
                },
                "type": "wait-for"
              },
              "name": "LINK_CREATED"
            },
            "5c2aaae3-2c69-47e0-86ec-0bfc2b12e345": {
              "canvasPosition": {
                "x": 1250,
                "y": 495
              },
              "description": "authorization has been requested",
              "group": 0,
              "isFinal": false,
              "logicBlock": {
                "commandCanvasPosition": {
                  "x": 0,
                  "y": 0
                },
                "executorCanvasPosition": {
                  "x": 1650,
                  "y": 495
                },
                "command": "7e7e3ffe-7f61-49f7-a6ee-5c61c5a7695e",
                "type": "command"
              },
              "name": "AUTHORIZATION_REQUESTED"
            },
            "5c60c09a-084f-495f-885f-415a1ede85ee": {
              "canvasPosition": {
                "x": 2050,
                "y": 495
              },
              "description": "waiting for authorization",
              "group": 0,
              "isFinal": false,
              "logicBlock": {
                "commandCanvasPosition": {
                  "x": 0,
                  "y": 0
                },
                "executorCanvasPosition": {
                  "x": 2450,
                  "y": 495
                },
                "type": "wait-for"
              },
              "name": "AUTHORIZATION_PENDING"
            },
            "174bd984-aadc-4905-9ec4-70ef67339e0a": {
              "canvasPosition": {
                "x": 2850,
                "y": 987.5
              },
              "description": "payment schedule has been requested",
              "group": 0,
              "isFinal": false,
              "logicBlock": {
                "commandCanvasPosition": {
                  "x": 0,
                  "y": 0
                },
                "executorCanvasPosition": {
                  "x": 3250,
                  "y": 987.5
                },
                "command": "ac06bcbe-db36-4ade-b363-185b78783553",
                "type": "command"
              },
              "name": "PAYMENT_SCHEDULE_REQUESTED"
            },
            "15a8d019-c7ce-43d7-abf1-f128fef4318d": {
              "canvasPosition": {
                "x": 2850,
                "y": 630
              },
              "description": "subscription schedule has been requested",
              "group": 0,
              "isFinal": false,
              "logicBlock": {
                "commandCanvasPosition": {
                  "x": 0,
                  "y": 0
                },
                "executorCanvasPosition": {
                  "x": 3250,
                  "y": 630
                },
                "command": "fbb3be8d-b54f-4abf-81e2-7af96c573637",
                "type": "command"
              },
              "name": "SUBSCRIPTION_SCHEDULED_REQUESTED"
            },
            "b46ea930-8f28-4c08-992b-e87041d0e98d": {
              "canvasPosition": {
                "x": 2850,
                "y": 350
              },
              "description": "subscription's first payment has been requested",
              "group": 0,
              "isFinal": false,
              "logicBlock": {
                "commandCanvasPosition": {
                  "x": 0,
                  "y": 0
                },
                "executorCanvasPosition": {
                  "x": 3250,
                  "y": 350
                },
                "command": "37d5adda-092a-4af8-8248-a7955c939258",
                "type": "command"
              },
              "name": "SUBSCRIPTION_STARTED"
            },
            "e7ac0bbc-a64a-4b74-88d4-2c8c83c741c7": {
              "canvasPosition": {
                "x": 2850,
                "y": 100
              },
              "description": "subscription's payment has been requested",
              "group": 0,
              "isFinal": false,
              "logicBlock": {
                "commandCanvasPosition": {
                  "x": 0,
                  "y": 0
                },
                "executorCanvasPosition": {
                  "x": 3250,
                  "y": 100
                },
                "command": "aac2a672-9046-4fb5-b1ed-71f56acbe2c4",
                "type": "command"
              },
              "name": "SUBSCRIPTION_PAYMENT_REQUESTED"
            },
            "329758a6-8386-4a6a-8ee6-362a96bb7190": {
              "canvasPosition": {
                "x": 3650,
                "y": 640
              },
              "description": "payment created on provider's system",
              "group": 0,
              "isFinal": false,
              "logicBlock": {
                "commandCanvasPosition": {
                  "x": 0,
                  "y": 0
                },
                "executorCanvasPosition": {
                  "x": 4050,
                  "y": 640
                },
                "type": "wait-for"
              },
              "name": "PAYMENT_PENDING"
            },
            "9f9a743c-5798-4074-94ed-f18f60b501f4": {
              "canvasPosition": {
                "x": 4450,
                "y": 215
              },
              "description": "payment has been paid",
              "group": 1,
              "isFinal": false,
              "logicBlock": {
                "commandCanvasPosition": {
                  "x": 0,
                  "y": 0
                },
                "executorCanvasPosition": {
                  "x": 4850,
                  "y": 215
                },
                "type": "wait-for"
              },
              "name": "PAYMENT_EXECUTED"
            },
            "628b22cc-3f43-4a30-be62-d52543850c52": {
              "canvasPosition": {
                "x": 5250,
                "y": 215
              },
              "description": "payment refund has been requested",
              "group": 1,
              "isFinal": false,
              "logicBlock": {
                "commandCanvasPosition": {
                  "x": 0,
                  "y": 0
                },
                "executorCanvasPosition": {
                  "x": 5650,
                  "y": 455
                },
                "command": "35e03f54-91e0-4c5b-a2eb-f626350efb25",
                "type": "command"
              },
              "name": "REFUND_REQUESTED"
            },
            "fd304f62-def6-4c8e-a6af-e221cda2b25e": {
              "canvasPosition": {
                "x": 6050,
                "y": 330
              },
              "description": "payment refund failed",
              "group": 1,
              "isFinal": false,
              "logicBlock": {
                "commandCanvasPosition": {
                  "x": 0,
                  "y": 0
                },
                "executorCanvasPosition": {
                  "x": 6450,
                  "y": 195
                },
                "type": "wait-for"
              },
              "name": "REFUND_FAILED"
            },
            "b21283b7-0b20-43c4-87e3-b0720815f3d7": {
              "canvasPosition": {
                "x": 6050,
                "y": 580
              },
              "description": "payment has been partially refunded",
              "group": 2,
              "isFinal": false,
              "logicBlock": {
                "commandCanvasPosition": {
                  "x": 0,
                  "y": 0
                },
                "executorCanvasPosition": {
                  "x": 6450,
                  "y": 647.5
                },
                "type": "wait-for"
              },
              "name": "PARTIALLY_REFUNDED"
            },
            "d251c865-e2e3-4cdb-acf2-7be80c58fa77": {
              "canvasPosition": {
                "x": 6850,
                "y": 647.5
              },
              "description": "payment refund has been requested again",
              "group": 2,
              "isFinal": false,
              "logicBlock": {
                "commandCanvasPosition": {
                  "x": 0,
                  "y": 0
                },
                "executorCanvasPosition": {
                  "x": 7250,
                  "y": 465
                },
                "command": "35e03f54-91e0-4c5b-a2eb-f626350efb25",
                "type": "command"
              },
              "name": "SUBSEQUENT_REFUND_REQUESTED"
            },
            "4e23e1e4-68ee-47b9-8e48-fe9ae3d7c6dd": {
              "canvasPosition": {
                "x": 7650,
                "y": 465
              },
              "description": "subsequent payment refund failed",
              "group": 2,
              "isFinal": false,
              "logicBlock": {
                "commandCanvasPosition": {
                  "x": 0,
                  "y": 0
                },
                "executorCanvasPosition": {
                  "x": 8050,
                  "y": 330
                },
                "type": "wait-for"
              },
              "name": "SUBSEQUENT_REFUND_FAILED"
            },
            "eaf40fce-0592-4b7e-a5ee-abec2e554da3": {
              "canvasPosition": {
                "x": 7650,
                "y": 715
              },
              "description": "payment has been totally refunded",
              "group": 3,
              "isFinal": false,
              "logicBlock": {
                "commandCanvasPosition": {
                  "x": 0,
                  "y": 0
                },
                "executorCanvasPosition": {
                  "x": 8050,
                  "y": 715
                },
                "type": "wait-for"
              },
              "name": "TOTALLY_REFUNDED"
            },
            "0201cdd1-9b4f-420c-8ac6-3c04c9eab09b": {
              "canvasPosition": {
                "x": 4450,
                "y": 997.5
              },
              "description": "payment could not be performed",
              "group": 1000,
              "isFinal": false,
              "logicBlock": {
                "commandCanvasPosition": {
                  "x": 0,
                  "y": 0
                },
                "executorCanvasPosition": {
                  "x": 4850,
                  "y": 997.5
                },
                "type": "wait-for"
              },
              "name": "PAYMENT_FAILED"
            }
          }
        }
      },
      "version": "2.3.1",
      "unlinkedFlows": {}
    },
    "rbacManagerConfig": {
      "enabledServices": {
        "crud-service": {
          "enableRBAC": true,
          "resources": {
            "cpuLimits": {
              "min": "100m",
              "max": "100m"
            },
            "memoryLimits": {
              "min": "50Mi",
              "max": "300Mi"
            }
          },
          "monitoringEnabled": true,
          "routes": {
            "/fm-subscriptions/": {
              "get": {
                "x-permission": {
                  "allow": "allow_all"
                }
              }
            }
          }
        }
      },
      "imageName": "ghcr.io/rond-authz/rond:latest",
      "permissions": {
        "policyFileConfigName": "rbac-sidecar-svc-opa-policies-config",
        "policyFileContent": "package policies\n\nallow_all {\n  true\n}",
        "testFileContent": "package policies\n\ntest_allow_all {\n  allow_all == true\n}"
      },
      "rbacStorage": {
        "mongoDBURL": "{{MONGODB_URL}}",
        "bindingsCollection": "rbac-bindings",
        "rolesCollection": "rbac-roles"
      },
      "version": "0.1.0"
    },
    "backofficeConfigurations": {
      "services": {
        "micro-lc": {
          "microLcConfig": {
            "applications": {
              "home": {
                "config": {
                  "content": {
                    "attributes": {
                      "style": "width: 100%; height: 100%; display: flex; flex-direction: column; justify-content: center; align-items: center; row-gap: 24px"
                    },
                    "content": [
                      {
                        "content": "Welcome to your new frontend! 👋",
                        "tag": "span"
                      },
                      {
                        "attributes": {
                          "href": "https://docs.mia-platform.eu/docs/microfrontend-composer/overview",
                          "target": "_blank"
                        },
                        "content": "Get started with the official documentation!",
                        "tag": "a"
                      }
                    ],
                    "tag": "div"
                  }
                },
                "integrationMode": "compose",
                "route": "./home"
              },
              "libraries": {
                "integrationMode": "compose",
                "route": "./pages/library",
                "config": "/micro-lc-configurations/libraries.config.json"
              }
            },
            "layout": {
              "content": [
                {
                  "properties": {
                    "logo": {
                      "altText": "Change me",
                      "url": "https://www.mia-platform.eu/static/img/logo.svg"
                    },
                    "menuItems": [
                      {
                        "icon": {
                          "library": "@ant-design/icons-svg",
                          "selector": "HomeOutlined"
                        },
                        "id": "home",
                        "label": "Home",
                        "type": "application"
                      }
                    ],
                    "mode": "fixedSideBar"
                  },
                  "tag": "bk-layout"
                },
                {
                  "properties": {
                    "primaryColor": "#1890ff",
                    "varsPrefix": [
                      "micro-lc",
                      "microlc",
                      "back-kit",
                      "ant"
                    ]
                  },
                  "tag": "bk-antd-theme-manager"
                }
              ],
              "sources": [
                "https://cdn.mia-platform.eu/backoffice/bk-web-components/{{BACK_KIT_VERSION}}/dist/bk-web-components.esm.js"
              ]
            },
            "settings": {
              "defaultUrl": "./home"
            },
            "version": 2
          },
          "pagesConfigs": {
            "libraries.config.json": {
              "definitions": {
                "dataSchema": {
                  "type": "object",
                  "required": [
                    "priority",
                    "ruleId",
                    "type",
                    "rules",
                    "response"
                  ],
                  "properties": {
                    "_id": {
                      "formOptions": {
                        "hiddenOnInsert": true,
                        "readOnlyOnUpdate": true
                      },
                      "type": "string"
                    },
                    "creatorId": {
                      "formOptions": {
                        "hiddenOnInsert": true,
                        "readOnlyOnUpdate": true
                      },
                      "type": "string"
                    },
                    "createdAt": {
                      "formOptions": {
                        "hiddenOnInsert": true,
                        "readOnlyOnUpdate": true
                      },
                      "dateOptions": {
                        "displayFormat": "YYYY-MM-DD hh:mm"
                      },
                      "format": "date-time",
                      "type": "string"
                    },
                    "updaterId": {
                      "formOptions": {
                        "hiddenOnInsert": true,
                        "readOnlyOnUpdate": true
                      },
                      "type": "string"
                    },
                    "updatedAt": {
                      "formOptions": {
                        "hiddenOnInsert": true,
                        "readOnlyOnUpdate": true
                      },
                      "dateOptions": {
                        "displayFormat": "YYYY-MM-DD hh:mm"
                      },
                      "format": "date-time",
                      "type": "string"
                    },
                    "__STATE__": {
                      "enum": [
                        "PUBLIC",
                        "DRAFT",
                        "TRASH",
                        "DELETED"
                      ],
                      "formOptions": {
                        "readOnlyOnUpdate": true
                      },
                      "type": "string"
                    },
                    "priority": {
                      "type": "number"
                    },
                    "ruleId": {
                      "type": "string"
                    },
                    "type": {
                      "type": "string"
                    },
                    "rules": {
                      "type": "array",
                      "items": {
                        "type": "object",
                        "required": [],
                        "additionalProperties": true
                      }
                    },
                    "response": {
                      "type": "array",
                      "items": {
                        "type": "object",
                        "required": [],
                        "additionalProperties": true
                      }
                    }
                  }
                }
              },
              "content": {
                "content": [
                  {
                    "content": [
                      {
                        "tag": "div",
                        "content": [
                          {
                            "properties": {
                              "content": "Page title"
                            },
                            "tag": "bk-title"
                          },
                          {
                            "tag": "bk-refresh-button",
                            "attributes": {
                              "style": "margin-left: 14px; align-self: end;"
                            }
                          },
                          {
                            "tag": "div",
                            "attributes": {
                              "style": "flex-grow: 1;"
                            }
                          },
                          {
                            "properties": {
                              "placeholder": "Search..."
                            },
                            "tag": "bk-search-bar"
                          },
                          {
                            "properties": {
                              "iconId": "DownloadOutlined",
                              "content": "Export",
                              "clickConfig": {
                                "type": "event",
                                "actionConfig": {
                                  "label": "export-data",
                                  "payload": {}
                                }
                              }
                            },
                            "tag": "bk-button"
                          },
                          {
                            "tag": "bk-add-new-button"
                          },
                          {
                            "properties": {
                              "content": "",
                              "clickConfig": {
                                "type": "event",
                                "actionConfig": {
                                  "label": "filter",
                                  "payload": {}
                                }
                              },
                              "type": "outlined",
                              "iconId": "FunnelPlotOutlined"
                            },
                            "tag": "bk-button"
                          }
                        ],
                        "attributes": {
                          "style": "display: flex; flex-direction: row; gap: 10px; padding: 0 20px;"
                        }
                      },
                      {
                        "tag": "div",
                        "attributes": {
                          "style": "width: 100%; display: flex; justify-content: space-between;"
                        },
                        "content": [
                          {
                            "attributes": {
                              "style": "flex-grow: 1;"
                            },
                            "properties": {
                              "tabs": [
                                {
                                  "key": "tab-1",
                                  "title": "Tab 1"
                                }
                              ]
                            },
                            "tag": "bk-tabs"
                          },
                          {
                            "attributes": {
                              "style": "margin-right: 4px"
                            },
                            "properties": {
                              "dataSchema": {
                                "$ref": "#/definitions/dataSchema"
                              },
                              "filters": []
                            },
                            "tag": "bk-filters-manager"
                          }
                        ]
                      }
                    ],
                    "tag": "header",
                    "attributes": {
                      "style": "display: flex; flex-direction: column; padding-top: 10px; background-color: white;"
                    }
                  },
                  {
                    "content": [
                      {
                        "properties": {
                          "dataSchema": {
                            "$ref": "#/definitions/dataSchema"
                          },
                          "maxLines": 10,
                          "customActions": [
                            {
                              "tag": "bk-button",
                              "properties": {
                                "iconId": "DeleteOutlined",
                                "content": "",
                                "type": "ghost",
                                "action": {
                                  "type": "event",
                                  "config": {
                                    "events": {
                                      "label": "require-confirm",
                                      "payload": {
                                        "content": {
                                          "en": "Do you want to confirm this action?",
                                          "it": "Vuoi confermare questa azione?"
                                        },
                                        "configOk": {
                                          "properties": {
                                            "action": {
                                              "type": "event",
                                              "config": {
                                                "events": {
                                                  "label": "delete-data",
                                                  "payload": "{{rawObject args.[1]}}"
                                                }
                                              }
                                            }
                                          }
                                        }
                                      }
                                    }
                                  }
                                }
                              }
                            },
                            {
                              "tag": "bk-button",
                              "properties": {
                                "content": {
                                  "en": "Details",
                                  "it": "Dettaglio"
                                },
                                "iconId": "fas fa-arrow-right",
                                "iconPlacement": "right",
                                "clickConfig": {
                                  "type": "push",
                                  "actionConfig": {
                                    "url": "./details-page-route/{{args.[1]._id}}"
                                  }
                                }
                              }
                            }
                          ]
                        },
                        "tag": "bk-table"
                      },
                      {
                        "properties": {
                          "requireConfirm": {
                            "onClose": true,
                            "onSave": true
                          },
                          "dataSchema": {
                            "$ref": "#/definitions/dataSchema"
                          },
                          "width": "70vw"
                        },
                        "tag": "bk-form-modal"
                      },
                      {
                        "tag": "bk-confirmation-modal"
                      },
                      {
                        "properties": {
                          "rootElementSelectors": "main.micro-lc-layout-content",
                          "successEventMap": {
                            "create-data": {
                              "title": "Success",
                              "content": "Data successfully created",
                              "type": "success"
                            },
                            "update-data": {
                              "title": "Success",
                              "content": "Data successfully updated",
                              "type": "success"
                            },
                            "delete-data": {
                              "title": "Success",
                              "content": "Data successfully deleted",
                              "type": "success"
                            }
                          },
                          "errorEventMap": {
                            "create-data": {
                              "title": "Error",
                              "content": "An error occurred during order creation",
                              "type": "error"
                            },
                            "update-data": {
                              "title": "Error",
                              "content": "An error occurred during order updated",
                              "type": "error"
                            },
                            "delete-data": {
                              "title": "Error",
                              "content": "An error occurred during order deletion",
                              "type": "error"
                            }
                          }
                        },
                        "tag": "bk-notifications",
                        "attributes": {}
                      }
                    ],
                    "tag": "main",
                    "attributes": {
                      "style": "flex-grow: 1; background-color: #f0f2f5; padding: 20px; overflow-y: auto;"
                    }
                  },
                  {
                    "content": [
                      {
                        "properties": {
                          "dataSchema": {
                            "$ref": "#/definitions/dataSchema"
                          },
                          "width": "40vw"
                        },
                        "tag": "bk-filter-drawer"
                      }
                    ],
                    "tag": "aside"
                  },
                  {
                    "content": [
                      {
                        "tag": "bk-bulk-delete"
                      },
                      {
                        "tag": "bk-bulk-actions",
                        "properties": {
                          "dataSchema": {
                            "$ref": "#/definitions/dataSchema"
                          }
                        }
                      },
                      {
                        "tag": "div",
                        "attributes": {
                          "style": "flex-grow: 1;"
                        }
                      },
                      {
                        "tag": "bk-footer",
                        "attributes": {
                          "style": "display: flex; justify-content: end; align-items: center;"
                        }
                      },
                      {
                        "tag": "bk-pagination",
                        "properties": {
                          "pageSize": 10
                        }
                      }
                    ],
                    "tag": "footer",
                    "attributes": {
                      "style": "display: flex; flex-direction: row; flex-wrap: wrap; padding: 10px 20px; background-color: white; gap: 10px; position: sticky; bottom: 0; z-index: 10"
                    }
                  },
                  {
                    "properties": {
                      "basePath": "/v2/adaptive-checkout",
                      "dataSchema": {
                        "$ref": "#/definitions/dataSchema"
                      }
                    },
                    "tag": "bk-crud-client"
                  },
                  {
                    "properties": {
                      "basePath": "/data-source-endpoint/export",
                      "streamSaverIFrameSrc": "https://cdn.mia-platform.eu/backoffice/bk-web-components/{{BACK_KIT_VERSION}}/dist/export-service-worker.html",
                      "dataSchema": {
                        "$ref": "#/definitions/dataSchema"
                      }
                    },
                    "tag": "bk-export"
                  }
                ],
                "tag": "div",
                "attributes": {
                  "style": "width: 100%; height: 100%; display: flex; flex-direction: column; position: relative;"
                }
              },
              "sources": [
                "https://cdn.mia-platform.eu/backoffice/bk-web-components/{{BACK_KIT_VERSION}}/dist/bk-web-components.esm.js"
              ]
            }
          },
          "webserver": {
            "microLcIndex": "<!DOCTYPE html>\n<html lang=\"en\">\n\n<head>\n  <base href=\"/mfe-application/\" target=\"_blank\" />\n\n  <title>Microfrontend composer</title>\n\n  <link rel=\"icon\" type=\"image/png\" href=\"https://www.mia-platform.eu/static/img/favicon/apple-icon-60x60.png\" />\n  <link rel=\"stylesheet\" nonce=\"**CSP_NONCE**\" href=\"./assets/style.css\" />\n\n  <script\n    type=\"module\"\n    nonce=\"**CSP_NONCE**\"\n    src=\"https://cdn.mia-platform.eu/backoffice/bk-web-components/{{BACK_KIT_VERSION}}/dist/bk-loading-animation.esm.js\"\n  ></script>\n\n  <script\n    type=\"module\"\n    nonce=\"**CSP_NONCE**\"\n    src=\"https://cdn.mia-platform.eu/micro-lc/orchestrator/2.4.3/dist/micro-lc.production.js\"\n  ></script>\n</head>\n\n<body>\n  <bk-loading-animation primary-color=\"#1890ff\">\n    <micro-lc config-src=\"/micro-lc-configurations/config.json\" fallback-language=\"en\"></micro-lc>\n  </bk-loading-animation>\n</body>\n\n</html>\n",
            "publicHeadersMap": {
              "/public/index.html": {
                "content-security-policy": [
                  [
                    "script-src 'nonce-**CSP_NONCE**' 'strict-dynamic' 'unsafe-eval'",
                    "style-src 'self' 'unsafe-inline'",
                    "img-src 'self' https:",
                    "object-src 'none'",
                    "font-src 'self'",
                    "worker-src 'self' blob:",
                    "base-uri 'self'"
                  ]
                ],
                "link": [
                  "</mfe-application/assets/style.css>; rel=preload; as=style; nonce=**CSP_NONCE**",
                  "<https://cdn.mia-platform.eu/micro-lc/orchestrator/2.4.3/dist/micro-lc.production.js>; rel=modulepreload; as=script; nonce=**CSP_NONCE**",
                  "<https://cdn.mia-platform.eu/micro-lc/orchestrator/2.4.3/dist/assets/composer.js>; rel=preload; as=fetch; crossorigin",
                  "<https://cdn.mia-platform.eu/backoffice/bk-web-components/{{BACK_KIT_VERSION}}/dist/bk-web-components.esm.js>; rel=preload; as=fetch; crossorigin",
                  "<https://cdn.mia-platform.eu/backoffice/bk-web-components/{{BACK_KIT_VERSION}}/dist/bk-loading-animation.esm.js; rel=preload; as=fetch; crossorigin"
                ]
              }
            }
          },
          "meta": {
            "pages": {
              "libraries": {
                "sharedPropertiesTypeMap": {
                  "dataSchema": "back-kit/data-schema"
                }
              }
            }
          }
        }
      },
      "version": "1.8.0"
    }
  },
  "extensionsConfig": {
    "files": {}
  },
  "enabledFeatures": {
    "visualize": true,
    "replicas": true,
    "api-gateway": true,
    "api-gateway-envoy": true,
    "crud-service": true,
    "flow-manager": true,
    "rbac-manager": true,
    "fast-data": true,
    "backoffice": true
  }
}
```

----------------------------
Deploy

curl 'https://demo.console.gcp.mia-platform.eu/api/deploy/projects/680cacfc25e7a18172e9c11d/environments/DEV/deployments/' \
  --data-raw '{"deployType":"smart_deploy","forceDeployWhenNoSemver":false}'

  ```json
  {
  "id": 891494,
  "url": "https://git.tools.mia-platform.eu/clients/mia-platform/demo/demo-companies/digital-platform-c/test-project-giulio/Configurations/-/pipelines/891494"
}
  ```

  curl 'https://demo.console.gcp.mia-platform.eu/api/deploy/projects/680cacfc25e7a18172e9c11d/pipelines/891494/status/?environment=DEV' \

  ```json
  {"id":891494,"status":"pending"}
  ```

  curl 'https://demo.console.gcp.mia-platform.eu/api/deploy/projects/680cacfc25e7a18172e9c11d/deployment/?page=1&per_page=1&scope=success&environment=DEV' \


  ```json
  [
  {
    "id": "208072",
    "status": "success",
    "ref": "DEV",
    "commit": {
      "url": "https://git.tools.mia-platform.eu/clients/mia-platform/demo/demo-companies/digital-platform-c/test-project-giulio/Configurations/commit/4a303c7ef0fecdc2b390485e0cd5b0f3088a737e",
      "authorName": "Giulio Roggero",
      "committedDate": "2025-04-26T09:58:15.000+00:00",
      "avatarUrl": "/api/backend/users/avatar/?email=giulio.roggero@mia-platform.eu",
      "sha": "4a303c7e",
      "ref": "master"
    },
    "user": {
      "name": "Giulio Roggero"
    },
    "deployType": "smart_deploy",
    "webUrl": "https://git.tools.mia-platform.eu/clients/mia-platform/demo/demo-companies/digital-platform-c/test-project-giulio/Configurations/-/jobs/3472130",
    "duration": 10.058238,
    "finishedAt": "2025-04-26T09:58:29.245Z",
    "env": "DEV",
    "environmentInfo": {
      "envId": "DEV",
      "label": "Development"
    },
    "resources": {
      "configuration": {
        "changesId": "3974b476-01b2-4f46-94c3-c392c0fe4ffe",
        "refType": "environment",
        "refName": "DEV"
      }
    }
  }
]
```

--------------------
## Runtime

curl 'https://demo.console.gcp.mia-platform.eu/api/backend/projects/680cacfc25e7a18172e9c11d/' \


  ```json
  {
  "_id": "680cacfc25e7a18172e9c11d",
  "availableNamespaces": [],
  "configurationGitPath": "clients/mia-platform/demo/demo-companies/digital-platform-c/test-project-giulio/configurations",
  "containerRegistries": [
    {
      "hostname": "orca-ghcr.com",
      "id": "349a921b-21e6-4349-878b-5b5b5a820781",
      "imagePullSecretName": "orca-ghcr",
      "isDefault": false,
      "name": "orca-ghcr"
    },
    {
      "hostname": "orca-google-registry.com",
      "id": "60273517-df65-4faf-bb8c-f998adfd67e2",
      "imagePullSecretName": "orca-google-registry",
      "isDefault": false,
      "name": "orca-google-registry"
    },
    {
      "hostname": "ghcr.io",
      "id": "1636736a-2907-4d2c-8f5e-738e27e19a03",
      "isDefault": false,
      "name": "ghcr.io"
    },
    {
      "hostname": "nexus.mia-platform.eu",
      "id": "cd6ae8c5-feb0-4e5c-beec-39cf8290d3d7",
      "isDefault": true,
      "name": "mia-platform-nexus"
    }
  ],
  "defaultBranch": "main",
  "deploy": {
    "runnerTool": "mlp",
    "strategy": "push"
  },
  "description": "This is the project description",
  "dockerImageNameSuggestion": {
    "type": "PROJECT_ID"
  },
  "enabledSecurityFeatures": {
    "appArmor": true,
    "hostProperties": true,
    "privilegedPod": true,
    "seccompProfile": true
  },
  "enabledServices": {
    "api-gateway": false,
    "api-portal": false,
    "auth0-client": false,
    "authorization-service": false,
    "cms-backend": false,
    "cms-site": false,
    "crud-service": false,
    "microservice-gateway": false,
    "oauth-login-site": false,
    "swagger-aggregator": false,
    "v1-adapter": false
  },
  "environments": [
    {
      "cluster": {
        "clusterId": "67111f327c27d260a21c1c52",
        "namespace": "test-project-giulio-dev"
      },
      "dashboards": [
        {
          "category": {
            "label": "API"
          },
          "id": "fdecb702-a6a8-4646-8d34-d420530b4999",
          "label": "Responses Details",
          "type": "iframe",
          "url": "https://grafana.mia-platform.eu/d/dfNsc-jnz/api-gateway-apis?orgId=131\u0026var-cluster=miademo\u0026var-namespace=test-project-giulio-dev\u0026var-loki=Loki\u0026var-prometheus=Prometheus\u0026from=now-1d\u0026theme=light\u0026kiosk=tv"
        },
        {
          "category": {
            "label": "Resources"
          },
          "id": "resource-util-per-pod",
          "label": "Pods Resources",
          "type": "iframe",
          "url": "https://grafana.mia-platform.eu/d/6581e46e4e5c7ba40a07646395ef7b23/kubernetes-compute-resources-pod?orgId=131\u0026refresh=15s\u0026var-datasource=default\u0026var-cluster=miademo\u0026var-namespace=test-project-giulio-dev\u0026theme=light\u0026kiosk=tv"
        },
        {
          "category": {
            "label": "Resources"
          },
          "id": "resource-util-per-ns",
          "label": "Runtime Summary",
          "type": "iframe",
          "url": "https://grafana.mia-platform.eu/d/a87fb0d919ec0ea5f6543124e16c42a5/kubernetes-compute-resources-namespace-workloads?orgId=131\u0026refresh=15s\u0026var-datasource=default\u0026var-cluster=miademo\u0026var-namespace=test-project-giulio-dev\u0026theme=light\u0026kiosk=tv"
        },
        {
          "category": {
            "label": "Fast Data"
          },
          "id": "kafka-consumer-group",
          "label": "Projections",
          "type": "iframe",
          "url": "https://grafana.mia-platform.eu/d/3397b707-4324-48f5-bf48-05949e3fecb0/kafka-messages-dashboard?var-cluster=miademo\u0026var-namespace=test-project-giulio-dev\u0026var-consumer_group=demo.development.warehouse\u0026var-consumergroup_subscribed_topics=All\u0026var-topic=demo.development.pr-articles-json\u0026orgId=131\u0026theme=light\u0026\u0026kiosk=tv"
        },
        {
          "category": {
            "label": "Fast Data"
          },
          "id": "fast-data-svc-creator",
          "label": "Single Views",
          "type": "iframe",
          "url": "https://grafana.mia-platform.eu/d/9a041f86-6f82-44c0-8416-80e377985015/fast-data-single-views?orgId=131\u0026refresh=10s\u0026var-datasource=Prometheus\u0026var-cluster=miademo\u0026var-namespace=test-project-giulio-dev\u0026var-portfolioOrigin=articles\u0026var-svType=All\u0026var-svcDeployment=All\u0026theme=light\u0026kiosk=tv"
        },
        {
          "category": {
            "label": "Logs"
          },
          "id": "container-logs-k8s",
          "label": "Container Logs",
          "type": "iframe",
          "url": "https://grafana.mia-platform.eu/explore?orgId=131\u0026left=%7B%22datasource%22:%226RF5EkK4z%22,%22queries%22:%5B%7B%22refId%22:%22A%22,%22expr%22:%22%7Bnamespace%3D%5C%22test-project-giulio-dev%5C%22%7D%20%7C%3D%20%60%60%22,%22queryType%22:%22range%22,%22datasource%22:%7B%22type%22:%22loki%22,%22uid%22:%226RF5EkK4z%22%7D,%22editorMode%22:%22builder%22%7D%5D,%22range%22:%7B%22from%22:%22now-7d%22,%22to%22:%22now%22%7D%7D\u0026theme=light\u0026kiosk=tv"
        }
      ],
      "deploy": {
        "providerId": "digital-platform-c-gitlab",
        "runnerTool": "mlp",
        "strategy": "push",
        "type": "gitlab-ci"
      },
      "envId": "DEV",
      "envPrefix": "DEV",
      "hosts": [
        {
          "host": "test-project-giulio-test.mia-demo-re5gu6.gcp.mia-platform.eu",
          "isBackoffice": false,
          "scheme": "https"
        }
      ],
      "isProduction": false,
      "label": "Development",
      "links": [],
      "type": "runtime"
    },
    {
      "cluster": {
        "clusterId": "67111f327c27d260a21c1c52",
        "namespace": "test-project-giulio-prod"
      },
      "dashboards": [
        {
          "category": {
            "label": "API"
          },
          "id": "fdecb702-a6a8-4646-8d34-d420530b4999",
          "label": "Responses Details",
          "type": "iframe",
          "url": "https://grafana.mia-platform.eu/d/dfNsc-jnz/api-gateway-apis?orgId=131\u0026var-cluster=miademo\u0026var-namespace=test-project-giulio-prod\u0026var-loki=Loki\u0026var-prometheus=Prometheus\u0026from=now-1d\u0026theme=light\u0026kiosk=tv"
        },
        {
          "category": {
            "label": "Resources"
          },
          "id": "resource-util-per-pod",
          "label": "Pods Resources",
          "type": "iframe",
          "url": "https://grafana.mia-platform.eu/d/6581e46e4e5c7ba40a07646395ef7b23/kubernetes-compute-resources-pod?orgId=131\u0026refresh=15s\u0026var-datasource=default\u0026var-cluster=miademo\u0026var-namespace=test-project-giulio-prod\u0026theme=light\u0026kiosk=tv"
        },
        {
          "category": {
            "label": "Resources"
          },
          "id": "resource-util-per-ns",
          "label": "Runtime Summary",
          "type": "iframe",
          "url": "https://grafana.mia-platform.eu/d/a87fb0d919ec0ea5f6543124e16c42a5/kubernetes-compute-resources-namespace-workloads?orgId=131\u0026refresh=15s\u0026var-datasource=default\u0026var-cluster=miademo\u0026var-namespace=test-project-giulio-prod\u0026theme=light\u0026kiosk=tv"
        },
        {
          "category": {
            "label": "Fast Data"
          },
          "id": "kafka-consumer-group",
          "label": "Projections",
          "type": "iframe",
          "url": "https://grafana.mia-platform.eu/d/3397b707-4324-48f5-bf48-05949e3fecb0/kafka-messages-dashboard?var-cluster=miademo\u0026var-namespace=test-project-giulio-prod\u0026var-consumer_group=demo.development.warehouse\u0026var-consumergroup_subscribed_topics=All\u0026var-topic=demo.development.pr-articles-json\u0026orgId=131\u0026theme=light\u0026\u0026kiosk=tv"
        },
        {
          "category": {
            "label": "Fast Data"
          },
          "id": "fast-data-svc-creator",
          "label": "Single Views",
          "type": "iframe",
          "url": "https://grafana.mia-platform.eu/d/9a041f86-6f82-44c0-8416-80e377985015/fast-data-single-views?orgId=131\u0026refresh=10s\u0026var-datasource=Prometheus\u0026var-cluster=miademo\u0026var-namespace=test-project-giulio-prod\u0026var-portfolioOrigin=articles\u0026var-svType=All\u0026var-svcDeployment=All\u0026theme=light\u0026kiosk=tv"
        },
        {
          "category": {
            "label": "Logs"
          },
          "id": "container-logs-k8s",
          "label": "Container Logs",
          "type": "iframe",
          "url": "https://grafana.mia-platform.eu/explore?orgId=131\u0026left=%7B%22datasource%22:%226RF5EkK4z%22,%22queries%22:%5B%7B%22refId%22:%22A%22,%22expr%22:%22%7Bnamespace%3D%5C%22test-project-giulio-prod%5C%22%7D%20%7C%3D%20%60%60%22,%22queryType%22:%22range%22,%22datasource%22:%7B%22type%22:%22loki%22,%22uid%22:%226RF5EkK4z%22%7D,%22editorMode%22:%22builder%22%7D%5D,%22range%22:%7B%22from%22:%22now-7d%22,%22to%22:%22now%22%7D%7D\u0026theme=light\u0026kiosk=tv"
        }
      ],
      "deploy": {
        "providerId": "digital-platform-c-gitlab",
        "runnerTool": "mlp",
        "strategy": "push",
        "type": "gitlab-ci"
      },
      "envId": "PROD",
      "envPrefix": "PROD",
      "hosts": [
        {
          "host": "test-project-giulio.mia-demo-re5gu6.gcp.mia-platform.eu",
          "isBackoffice": false,
          "scheme": "https"
        }
      ],
      "isProduction": true,
      "label": "Production",
      "links": [],
      "type": "runtime"
    }
  ],
  "environmentsVariables": {
    "baseUrl": "https://git.tools.mia-platform.eu",
    "providerId": "digital-platform-c-gitlab",
    "storage": {
      "path": "clients/mia-platform/demo/demo-companies/digital-platform-c/test-project-giulio",
      "type": "groups"
    },
    "type": "gitlab"
  },
  "flavor": "application",
  "info": {
    "projectOwner": "Giulio Roggero",
    "teamContact": "giulio.roggero@mia-platform.eu"
  },
  "name": "Test Project Giulio",
  "originalTemplate": {
    "id": "b3f09625-9389-4c81-84ce-0159b24ee264",
    "name": "Mia-Platform Enhanced Workflow Basic Template Experiments"
  },
  "pipelines": {
    "providerId": "digital-platform-c-gitlab",
    "type": "gitlab-ci"
  },
  "projectId": "test-project-giulio",
  "projectNamespaceVariable": "{{KUBE_NAMESPACE}}",
  "repository": {
    "provider": {
      "providerId": "digital-platform-c-gitlab",
      "type": "gitlab"
    },
    "providerId": "digital-platform-c-gitlab"
  },
  "repositoryUrl": "https://git.tools.mia-platform.eu/clients/mia-platform/demo/demo-companies/digital-platform-c/test-project-giulio/configurations",
  "tenantId": "b933f1ef-5b8e-4adf-a346-24a3b03d13e8"
}
```

------------------------
## Software Catalog


curl 'https://demo.console.gcp.mia-platform.eu/api/marketplace?includeTenantId=b933f1ef-5b8e-4adf-a346-24a3b03d13e8&name=node&page=1&perPage=25&sort=name&types=application%2Cexample%2Ccustom-resource%2Cplugin%2Cproxy%2Csidecar%2Ctemplate%2Cinfrastructure-component-runtime' 

```json
[
  {
    "_id": "66607338f33323bc3ac9841a",
    "itemId": "google-hello-node-sample-function",
    "lifecycleStatus": "published",
    "name": "Google Hello Node Sample Function",
    "releaseDate": "2024-06-05T14:16:24.208Z",
    "tenantId": "b933f1ef-5b8e-4adf-a346-24a3b03d13e8",
    "type": "custom-resource",
    "category": {
      "id": "serverless",
      "label": "Core Plugins - Serverless"
    },
    "componentsIds": [],
    "description": "Google Hello Node Sample Function",
    "imageUrl": "/v2/files/download/1bf86f4f-5a00-49bb-8af3-887a73048f64.png",
    "isLatest": true,
    "supportedByImageUrl": "/v2/files/download/eb1bfe5c-0662-4260-b06b-9738796cdaa1.png"
  },
  {
    "_id": "67a4ed58d38aa6c26d280214",
    "itemId": "node-js-flow-manager-client",
    "lifecycleStatus": "published",
    "name": "Node.js 16 Flow Manager Client",
    "releaseDate": "2025-02-20T16:47:48.009Z",
    "tenantId": "mia-platform",
    "type": "template",
    "category": {
      "id": "orchestrators",
      "label": "Core Plugins - Orchestrators"
    },
    "componentsIds": [],
    "description": "Flow Manager Client Node.js 16 Template",
    "documentation": {
      "type": "markdown",
      "url": "https://raw.githubusercontent.com/mia-platform-marketplace/Node.js-Flow-Manager-Client-Template/refs/heads/16.x/README.md"
    },
    "imageUrl": "/v2/files/download/47f5095e-537e-4da8-8fe3-1edec94946e7.png",
    "isLatest": true,
    "repositoryUrl": "https://github.com/mia-platform-marketplace/Node.js-Flow-Manager-Client-Template/tree/16.x",
    "supportedBy": "Mia-Platform",
    "supportedByImageUrl": "/v2/files/download/ba717d35-36a7-4794-9405-8ff69adec98d.png",
    "version": {
      "name": "1.0.0",
      "releaseNote": "-"
    },
    "visibility": {
      "allTenants": false,
      "public": true
    }
  },
  {
    "_id": "67a4ed58d38aa6c26d28026e",
    "itemId": "node-js-helloworld-microservice-example",
    "lifecycleStatus": "published",
    "name": "Node.js 16 HelloWorld Microservice Example",
    "releaseDate": "2025-02-20T16:47:48.039Z",
    "tenantId": "mia-platform",
    "type": "example",
    "category": {
      "id": "nodejs",
      "label": "Start From Code - Node.js"
    },
    "componentsIds": [],
    "description": "Example of a simple Node.js 16 application. \nIt contains example of tests too.",
    "documentation": {
      "type": "markdown",
      "url": "https://raw.githubusercontent.com/mia-platform-marketplace/Node.js-Hello-World-Microservice-Example/refs/heads/16.x/README.md"
    },
    "imageUrl": "/v2/files/download/907b67c1-1ee2-418a-bc49-a3b5a2132546.png",
    "isLatest": true,
    "repositoryUrl": "https://github.com/mia-platform-marketplace/Node.js-Hello-World-Microservice-Example/tree/16.x",
    "supportedBy": "Mia-Platform",
    "supportedByImageUrl": "/v2/files/download/ba717d35-36a7-4794-9405-8ff69adec98d.png",
    "version": {
      "name": "1.0.0",
      "releaseNote": "-"
    },
    "visibility": {
      "allTenants": false,
      "public": true
    }
  },
  {
    "_id": "67a4ed58d38aa6c26d280215",
    "itemId": "node-js-template",
    "lifecycleStatus": "published",
    "name": "Node.js 16 Template",
    "releaseDate": "2025-02-20T16:47:48.010Z",
    "tenantId": "mia-platform",
    "type": "template",
    "category": {
      "id": "nodejs",
      "label": "Start From Code - Node.js"
    },
    "componentsIds": [],
    "description": "This is the best template to start creating a service in Node.js 16 integrated inside the platform",
    "documentation": {
      "type": "markdown",
      "url": "https://raw.githubusercontent.com/mia-platform-marketplace/Node.js-Custom-Plugin-Template/refs/heads/16.x/README.md"
    },
    "imageUrl": "/v2/files/download/81e7fd1d-90ab-46da-9f7d-29641133b460.png",
    "isLatest": true,
    "repositoryUrl": "https://github.com/mia-platform-marketplace/Node.js-Custom-Plugin-Template/tree/16.x",
    "supportedBy": "Mia-Platform",
    "supportedByImageUrl": "/v2/files/download/ba717d35-36a7-4794-9405-8ff69adec98d.png",
    "version": {
      "name": "1.0.0",
      "releaseNote": "-"
    },
    "visibility": {
      "allTenants": false,
      "public": true
    }
  },
  {
    "_id": "67a4ed58d38aa6c26d280216",
    "itemId": "typescript-template",
    "lifecycleStatus": "published",
    "name": "Node.js 16 TypeScript Template",
    "releaseDate": "2025-02-20T16:47:48.009Z",
    "tenantId": "mia-platform",
    "type": "template",
    "category": {
      "id": "nodejs",
      "label": "Start From Code - Node.js"
    },
    "componentsIds": [],
    "description": "This is the best template to start creating a service in Node.js 16 with TypeScript integrated with Mia-Platform",
    "documentation": {
      "type": "markdown",
      "url": "https://raw.githubusercontent.com/mia-platform-marketplace/Typescript-LC39-Template/refs/heads/16.x/README.md"
    },
    "imageUrl": "/v2/files/download/3ee6cef4-7c22-4a90-867b-f045d811820b.png",
    "isLatest": true,
    "repositoryUrl": "https://github.com/mia-platform-marketplace/Typescript-LC39-Template/tree/16.x",
    "supportedBy": "Mia-Platform",
    "supportedByImageUrl": "/v2/files/download/ba717d35-36a7-4794-9405-8ff69adec98d.png",
    "version": {
      "name": "1.0.0",
      "releaseNote": "-"
    },
    "visibility": {
      "allTenants": false,
      "public": true
    }
  },
  {
    "_id": "6808feabbf266a9fee1cb0f8",
    "itemId": "node-js-call-crud-example",
    "lifecycleStatus": "archived",
    "name": "Node.js Call CRUD Example",
    "releaseDate": "2025-04-03T13:02:52.082Z",
    "tenantId": "mia-platform",
    "type": "example",
    "category": {
      "id": "nodejs",
      "label": "Start From Code - Node.js"
    },
    "componentsIds": [],
    "description": "Example of using our Custom Plugin to access the CRUD. \nIt contains example of tests too.",
    "documentation": {
      "type": "markdown",
      "url": "https://raw.githubusercontent.com/mia-platform-marketplace/Node.js-Call-CRUD-Example/master/README.md"
    },
    "imageUrl": "/v2/files/download/0f8b5ce7-5e8e-48bc-89d9-d3d853b455b8.png",
    "isLatest": true,
    "supportedBy": "Mia-Platform",
    "supportedByImageUrl": "/v2/files/download/ba717d35-36a7-4794-9405-8ff69adec98d.png",
    "version": {
      "name": "1.0.0",
      "releaseNote": "-"
    },
    "visibility": {
      "allTenants": false,
      "public": true
    }
  },
  {
    "_id": "6808feabbf266a9fee1cb0fa",
    "itemId": "node-js-custom-plugin-with-mongo-example",
    "lifecycleStatus": "archived",
    "name": "Node.js Custom Plugin with Mongo Example",
    "releaseDate": "2025-04-03T13:02:52.081Z",
    "tenantId": "mia-platform",
    "type": "example",
    "category": {
      "id": "nodejs",
      "label": "Start From Code - Node.js"
    },
    "componentsIds": [],
    "description": "Example of using our Custom Plugin to access Mongo. \nIt contains example of tests too.",
    "documentation": {
      "type": "markdown",
      "url": "https://raw.githubusercontent.com/mia-platform-marketplace/Node.js-Custom-Plugin-Mongo-Example/master/README.md"
    },
    "imageUrl": "/v2/files/download/491a7460-37d3-484f-999a-8b7d6f7489d8.png",
    "isLatest": true,
    "supportedBy": "Mia-Platform",
    "supportedByImageUrl": "/v2/files/download/ba717d35-36a7-4794-9405-8ff69adec98d.png",
    "version": {
      "name": "1.0.0",
      "releaseNote": "-"
    },
    "visibility": {
      "allTenants": false,
      "public": true
    }
  },
  {
    "_id": "6808feaabf266a9fee1cb0c3",
    "itemId": "node-js-daemon-template",
    "lifecycleStatus": "archived",
    "name": "Node.js Daemon Template",
    "releaseDate": "2025-04-03T13:02:51.864Z",
    "tenantId": "mia-platform",
    "type": "template",
    "category": {
      "id": "nodejs",
      "label": "Start From Code - Node.js"
    },
    "componentsIds": [],
    "description": "A Node.js basic template to start developing a daemon service.",
    "documentation": {
      "type": "markdown",
      "url": "https://raw.githubusercontent.com/mia-platform-marketplace/node.js-daemon-template/main/README.md"
    },
    "imageUrl": "/v2/files/download/fc95c993-c99a-4acc-8d07-8d45afce12a8.png",
    "isLatest": true,
    "repositoryUrl": "https://github.com/mia-platform-marketplace/node.js-daemon-template",
    "supportedBy": "Mia-Platform",
    "supportedByImageUrl": "/v2/files/download/ba717d35-36a7-4794-9405-8ff69adec98d.png",
    "version": {
      "name": "1.0.0",
      "releaseNote": "-"
    },
    "visibility": {
      "allTenants": false,
      "public": true
    }
  }
]
```

List all versions of a microservice

curl 'https://demo.console.gcp.mia-platform.eu/api/tenants/mia-platform/marketplace/items/node-js-helloworld-microservice-example/versions' 

```json
[
  {
    "description": "Example of a simple Node.js 16 application. \nIt contains example of tests too.",
    "lifecycleStatus": "published",
    "name": "Node.js 16 HelloWorld Microservice Example",
    "reference": "67a4ed58d38aa6c26d28026e",
    "releaseDate": "2025-02-20T16:47:48.039Z",
    "releaseNote": "-",
    "version": "1.0.0",
    "isLatest": true,
    "security": false,
    "visibility": {
      "allTenants": false,
      "public": true
    }
  },
  {
    "description": "Example of a simple Node.js 16 application. \nIt contains example of tests too.",
    "lifecycleStatus": "archived",
    "name": "Node.js 16 HelloWorld Microservice Example",
    "reference": "67a9cd575697f282a30f45cd",
    "releaseDate": "2020-02-12T10:44:46.459Z",
    "releaseNote": "-",
    "version": "NA",
    "security": false,
    "visibility": {
      "allTenants": false,
      "public": true
    }
  }
]
```

Get the information of a version of a catalog item
curl 'https://demo.console.gcp.mia-platform.eu/api/tenants/mia-platform/marketplace/items/node-js-helloworld-microservice-example/versions/1.0.0' 

```json
{
  "_id": "67a4ed58d38aa6c26d28026e",
  "category": {
    "id": "nodejs",
    "label": "Start From Code - Node.js"
  },
  "componentsIds": [],
  "description": "Example of a simple Node.js 16 application. \nIt contains example of tests too.",
  "documentation": {
    "type": "markdown",
    "url": "https://raw.githubusercontent.com/mia-platform-marketplace/Node.js-Hello-World-Microservice-Example/refs/heads/16.x/README.md"
  },
  "imageUrl": "/v2/files/download/907b67c1-1ee2-418a-bc49-a3b5a2132546.png",
  "isLatest": true,
  "itemId": "node-js-helloworld-microservice-example",
  "lifecycleStatus": "published",
  "name": "Node.js 16 HelloWorld Microservice Example",
  "releaseDate": "2025-02-20T16:47:48.039Z",
  "repositoryUrl": "https://github.com/mia-platform-marketplace/Node.js-Hello-World-Microservice-Example/tree/16.x",
  "resources": {
    "services": {
      "nodejs-16-helloworld-microservice-example": {
        "type": "example",
        "name": "nodejs-16-helloworld-microservice-example",
        "description": "Example of a simple Node.js 16 application. \nIt contains example of tests too.",
        "archiveUrl": "https://github.com/mia-platform-marketplace/Node.js-Hello-World-Microservice-Example/archive/refs/heads/16.x.tar.gz",
        "pipelines": {
          "gitlab-ci": {
            "path": "/projects/platform%2Fpipelines-templates/repository/files/console-pipeline%2Fnode-hello-world.gitlab-ci.yml/raw"
          },
          "webhook": {
            "url": "https://example.com",
            "token": "test-token"
          }
        },
        "containerPorts": [
          {
            "name": "http",
            "from": 80,
            "to": 3000,
            "protocol": "TCP"
          }
        ]
      }
    }
  },
  "supportedBy": "Mia-Platform",
  "supportedByImageUrl": "/v2/files/download/ba717d35-36a7-4794-9405-8ff69adec98d.png",
  "tenantId": "mia-platform",
  "type": "example",
  "version": {
    "name": "1.0.0",
    "releaseNote": "-"
  },
  "visibility": {
    "public": true
  }
}
```



