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

implement a new tool called get-project-blueprint to retrive the project templates, the available environments, the configurationGitPah

use the same approach of get-projects

the api request and the response is the following, parse the response in formatted Text

# Raw Curl
-------------------------------------

curl for creating a project

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
        "_id": "6638b1534d8e60aa53f82e40",
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
        "name": "Deployment Orchestrator Ext",
        "projectId": "deployment-orchestrator-ext"
      },
      {
        "_id": "663902054d8e60aa53f82f15",
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
        "name": "AWS Project Demo",
        "projectId": "aws-project-demo"
      },
      {
        "_id": "664462f80ab66695d4addfae",
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
        "name": "Ephemeral Environments Omar",
        "projectId": "ephemeral-environments-omar"
      },
      {
        "_id": "6656ebc3b01978d04f4690e1",
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
        "name": "Stefano Test 1",
        "projectId": "stefano-test-1"
      },
      {
        "_id": "6656fb50b01978d04f4690ee",
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
        "name": "Loyalty Trenord",
        "projectId": "loyalty-trenord"
      },
      {
        "_id": "66606454f33323bc3ac983f2",
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
        "name": "Gilda Mia Experiments CRD",
        "projectId": "gilda-mia-experiments-crd"
      },
      {
        "_id": "66696547d78467373c8844b6",
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
        "name": "CRD Experiments",
        "projectId": "crd-experiments"
      },
      {
        "_id": "66757d967cef61ee400457c6",
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
        "name": "Mediolanum Demo",
        "projectId": "mediolanum-demo"
      },
      {
        "_id": "6687e6a3a3efed59c68821cc",
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
        "name": "VUHL - Demo",
        "projectId": "vuhl-api-portal"
      },
      {
        "_id": "66aa1083e36dcd07663980b9",
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
        "name": "RAG Application Demo",
        "projectId": "rag-application-demo"
      },
      {
        "_id": "66acaa485a0d8e4d6977a1b0",
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
        "name": "Helm Orchestrator Generator",
        "projectId": "helm-orchestrator-generator"
      },
      {
        "_id": "66e01dc467cc336506104c21",
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
        "name": "Eolo - Simplified deploy flow",
        "projectId": "eolo-simplified-deploy-flow"
      },
      {
        "_id": "66e1b0aa67cc336506104cbc",
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
        "name": "Demo Flow Manager",
        "projectId": "ufi-demo-flow-manager"
      },
      {
        "_id": "66ffaabc732f495e521b6f71",
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
        "name": "Omar Manual Approval Deploy",
        "projectId": "omar-manual-approval-deploy"
      },
      {
        "_id": "670547f2732f495e521b71b7",
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
        "name": "Graz - Ingressroute test 4",
        "projectId": "graz-ingressroute-test-4"
      },
      {
        "_id": "671a522b7c27d260a21c20ec",
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
        "name": "Volvo MFE",
        "projectId": "volvo-mfe"
      },
      {
        "_id": "674987740b1401a1a7b6786c",
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
        "name": "Jamstack",
        "projectId": "jamstack"
      },
      {
        "_id": "6759ba9f90e6c408b949af53",
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
        "name": "Ansible test",
        "projectId": "ansible-test"
      },
      {
        "_id": "67698663098a7036351f04f1",
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
        "name": "UFI - Flow Manager dipendenti",
        "projectId": "ufi-flow-manager-dipendenti"
      },
      {
        "_id": "678105e7098a7036351f09b8",
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
        "name": "A2A Approval Portal",
        "projectId": "a2a-approval-portal"
      },
      {
        "_id": "67811f3a098a7036351f09d5",
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
        "name": "VM Monitoring",
        "projectId": "vm-monitoring"
      },
      {
        "_id": "678545a9098a7036351f0b4e",
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
        "name": "EOL - Unified deploy",
        "projectId": "eol-unified-deploy"
      },
      {
        "_id": "67a5cd28fa909e3dff000703",
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
        "name": "test-constant-2",
        "projectId": "test-constant-2"
      },
      {
        "_id": "67a5d1befa909e3dff00070a",
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
        "name": "Api portal test",
        "projectId": "test-api-portal"
      },
      {
        "_id": "67a70a08fa909e3dff00079a",
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
        "name": "AI Code Assistant Console Ext",
        "projectId": "ai-code-assistant-console-ext"
      },
      {
        "_id": "67a914b9fa909e3dff00089c",
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
        "name": "Demo WebApp via AI",
        "projectId": "demo-webapp-via-ai"
      },
      {
        "_id": "67ab1387fa909e3dff0009ce",
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
        "name": "Omar NestJS Template",
        "projectId": "omar-nestjs-template"
      },
      {
        "_id": "67acbb61fa909e3dff000b19",
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
        "name": "CDC Mongo",
        "projectId": "cdc-mongo"
      },
      {
        "_id": "67adf651fa909e3dff000bc6",
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
        "name": "AI Code Assistant Live Preview",
        "projectId": "ai-code-assistant-live-preview"
      },
      {
        "_id": "67af801afa909e3dff000cf2",
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
        "name": "Azure Functions Scanner",
        "projectId": "azure-functions-scanner"
      },
      {
        "_id": "67b1d982fa909e3dff000cfe",
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
        "name": "Demo App AI GitHub",
        "projectId": "demo-app-ai-github"
      },
      {
        "_id": "67b48807fa909e3dff000ed5",
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
        "name": "Demo graphql asyncapi",
        "projectId": "demo-graphql-asyncapi"
      },
      {
        "_id": "67b48e10fa909e3dff000f0f",
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
        "name": "EXAH - Data Integration",
        "projectId": "exah-data-integration"
      },
      {
        "_id": "67b75672fa909e3dff001170",
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
        "name": "Test Jamstack",
        "projectId": "test-jamstack"
      },
      {
        "_id": "67bda4acd162d5a883ac36a4",
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
        "name": "Project2PBC",
        "projectId": "project2pbc"
      },
      {
        "_id": "67c1ca9dd162d5a883ac3911",
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
        "name": "Omar Doc Application",
        "projectId": "omar-doc-application"
      },
      {
        "_id": "67c9565cd162d5a883ac3d22",
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
        "name": "AI App Composer",
        "projectId": "ai-app-composer"
      },
      {
        "_id": "67cb19ba1501b181576bdb8c",
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
        "name": "Unisys - Quality evaluation",
        "projectId": "unisys-quality-evaluation"
      },
      {
        "_id": "67d1b1f91501b181576bde3c",
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
        "name": "Sample enhanced Stefano",
        "projectId": "sample-enhanced-stefano"
      },
      {
        "_id": "67d2edc31501b181576bdec4",
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
        "name": "AI Code Demo Project",
        "projectId": "ai-code-demo-project"
      },
      {
        "_id": "67d309991501b181576bdf01",
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
        "name": "test-iac-20250313",
        "projectId": "test-iac-20250313"
      },
      {
        "_id": "67d557521501b181576be13a",
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
        "name": "AI Agent Template Builder",
        "projectId": "ai-agent-template-builder"
      },
      {
        "_id": "67d993261501b181576be338",
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
        "name": "BCG",
        "projectId": "bcg"
      },
      {
        "_id": "67dbeed21501b181576be430",
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
        "name": "demo20250320bcg",
        "projectId": "demo20250320bcg"
      },
      {
        "_id": "67e195459b904686bb3972ad",
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
        "name": "Patient Table",
        "projectId": "patient-table"
      },
      {
        "_id": "67e284b99b904686bb3972fb",
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
        "name": "Test Pessina",
        "projectId": "test-pessina"
      },
      {
        "_id": "67e3cdd89b904686bb397392",
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
        "name": "Aviitam Workshop",
        "projectId": "aviitam-workshop"
      },
      {
        "_id": "67e580559b904686bb397886",
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
        "name": "DemoMichOfficeHours",
        "projectId": "demomichofficehours"
      },
      {
        "_id": "67e675899b904686bb3978f7",
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
        "name": "test-demo-care",
        "projectId": "test-demo-care"
      },
      {
        "_id": "67e6e9709b904686bb397a87",
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
        "name": "MakeItApp Numix Game",
        "projectId": "makeitapp-numix-game"
      },
      {
        "_id": "67e7d7039b904686bb397a94",
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
        "name": "Mia-Plartform MCP Server PoC",
        "projectId": "mia-plartform-mcp-server-poc"
      },
      {
        "_id": "67ea5fd79b904686bb397ab1",
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
        "name": "test-dave-demo-1",
        "projectId": "test-dave-demo-1"
      },
      {
        "_id": "67ea9bfc9b904686bb398ac0",
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
        "name": "Federica_test",
        "projectId": "federica-test"
      },
      {
        "_id": "67eab85d9b904686bb398b11",
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
        "name": "Taeggi_Playground",
        "projectId": "taeggi-playground"
      },
      {
        "_id": "67eba8d59b904686bb398b81",
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
        "name": "Fari-test-AI-10",
        "projectId": "fari-test-ai-10"
      },
      {
        "_id": "67ebb7939b904686bb398bab",
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
        "name": "Discovery-AI-Demo",
        "projectId": "discovery-ai-demo"
      },
      {
        "_id": "67ebd7ec9b904686bb398bbf",
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
        "name": "Prod-AI-Test",
        "projectId": "prod-ai-test"
      },
      {
        "_id": "67ebe5419b904686bb398bcd",
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
        "name": "AI-Coder-Application",
        "projectId": "ai-coder-application"
      },
      {
        "_id": "67ebed259b904686bb398bf1",
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
        "name": "snake1v1",
        "projectId": "snake1v1"
      },
      {
        "_id": "67ebf2c89b904686bb398c1c",
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
        "name": "Application-test-AI",
        "projectId": "application-test-ai"
      },
      {
        "_id": "67ecfa149b904686bb39914a",
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
        "name": "TestFileService",
        "projectId": "testfileservice"
      },
      {
        "_id": "67ed09469b904686bb399160",
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
        "name": "demo20250402",
        "projectId": "demo20250402"
      },
      {
        "_id": "67ed3d259b904686bb3991ab",
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
        "name": "Nico-Calendar",
        "projectId": "nico-calendar"
      },
      {
        "_id": "67ed3f529b904686bb3991b7",
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
        "name": "Nico-Calendar-2",
        "projectId": "nico-calendar-2"
      },
      {
        "_id": "67ed53679b904686bb3991ca",
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
        "name": "PLD Experiments",
        "projectId": "pld-experiments"
      },
      {
        "_id": "67ed55189b904686bb3991d1",
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
        "name": "AI Coder PLD Demo",
        "projectId": "ai-coder-pld-demo"
      },
      {
        "_id": "67ee399a9b904686bb3991ef",
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
        "name": "Supermarket Price Recognition",
        "projectId": "supermarket-price-recognition"
      },
      {
        "_id": "67ee661f9b904686bb39924f",
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
        "name": "Fari-Demo-1",
        "projectId": "fari-demo-1"
      },
      {
        "_id": "67ee6b829b904686bb399267",
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
        "name": "Fari-Demo-2",
        "projectId": "fari-demo-2"
      },
      {
        "_id": "67ee703e9b904686bb39927b",
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
        "name": "Fari-Demo-3",
        "projectId": "fari-demo-3"
      },
      {
        "_id": "67ee894f9b904686bb3992a0",
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
        "name": "Demo-test-dave",
        "projectId": "demo-test-dave"
      },
      {
        "_id": "67ee8fd39b904686bb3992af",
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
        "name": "Demo-Discovery-1",
        "projectId": "demo-discovery-1"
      },
      {
        "_id": "67ee96de9b904686bb3992c4",
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
        "name": "PLD - Sinistri AI Coder",
        "projectId": "pld-sinistri-ai-coder"
      },
      {
        "_id": "67efac4cc9dfc7ba2f000b1c",
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
        "name": "Demo Task mng",
        "projectId": "demo-task-mng"
      },
      {
        "_id": "67efca62c9dfc7ba2f000b4f",
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
        "name": "AI Agents Federico",
        "projectId": "ai-agents-federico"
      },
      {
        "_id": "67efeb42c9dfc7ba2f000b72",
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
        "name": "Esempio EY",
        "projectId": "esempio-ey"
      },
      {
        "_id": "67f01ac9c9dfc7ba2f000b9d",
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
        "name": "Task Manager Demo FE",
        "projectId": "task-manager-demo-fe"
      },
      {
        "_id": "67f3bfb2c9dfc7ba2f000c2e",
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
        "name": "test-composer",
        "projectId": "test-composer"
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
      },
      {
        "_id": "67f501e4c9dfc7ba2f000da2",
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
        "name": "Loyalty Program Demo",
        "projectId": "loyalty-program-demo"
      },
      {
        "_id": "67f79c0ac9dfc7ba2f000e53",
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
        "name": "Demo AI Agent CNH",
        "projectId": "demo-ai-agent-cnh"
      },
      {
        "_id": "67f7f7aac9dfc7ba2f000e9e",
        "linkedEnvironments": [
          {
            "envId": "DEV-AZ",
            "label": "Development Azure"
          }
        ],
        "name": "Demo Multi Cloud",
        "projectId": "demo-multi-cloud"
      },
      {
        "_id": "67f8f3f2c9dfc7ba2f000ee3",
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
        "name": "scrabble-scoreboard",
        "projectId": "scrabble-scoreboard"
      },
      {
        "_id": "67f91cbcc9dfc7ba2f000efd",
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
        "name": "Crea Appuntamento",
        "projectId": "crea-appuntamento"
      },
      {
        "_id": "67f98b24c9dfc7ba2f000f54",
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
        "name": "Form Mobility",
        "projectId": "form-mobility"
      },
      {
        "_id": "67fcb953c9dfc7ba2f000f92",
        "linkedEnvironments": [
          {
            "envId": "DEV",
            "label": "Development"
          }
        ],
        "name": "Demo Routing",
        "projectId": "demo-routing"
      },
      {
        "_id": "67fcccc0c9dfc7ba2f000fc4",
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
        "name": "Stefano AI test",
        "projectId": "stefano-ai-test"
      },
      {
        "_id": "67fcd30ec9dfc7ba2f000fd1",
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
        "name": "NextJS Mobility Example",
        "projectId": "nextjs-mobility-example"
      },
      {
        "_id": "67fcdb60c9dfc7ba2f001004",
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
        "name": "Mobility Event Sample",
        "projectId": "mobility-event-sample"
      },
      {
        "_id": "67fd0790c9dfc7ba2f001062",
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
        "name": "Test-AI-Empty-Project",
        "projectId": "test-ai-empty-project"
      },
      {
        "_id": "67fe6935c9dfc7ba2f0010f1",
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
        "name": "Test eeded",
        "projectId": "test-eeded"
      },
      {
        "_id": "67fe9a32c9dfc7ba2f001112",
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
        "name": "Riconoscitore Documenti Falsi",
        "projectId": "riconoscitore-documenti-falsi"
      },
      {
        "_id": "67fedf4fc9dfc7ba2f00114d",
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
        "name": "Crud Service Agent",
        "projectId": "crud-service-agent"
      },
      {
        "_id": "67ff8176c9dfc7ba2f0011aa",
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
        "name": "Test Config Manager",
        "projectId": "test-config-manager"
      },
      {
        "_id": "67ffb204c9dfc7ba2f0011e8",
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
        "name": "repro serviceaccount bug",
        "projectId": "repro-serviceaccount-bug"
      },
      {
        "_id": "67ffc8ebc9dfc7ba2f0011fd",
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
        "name": "Transiti EMV per Customer Care",
        "projectId": "transiti-emv-per-customer-care"
      },
      {
        "_id": "6800cec8c9dfc7ba2f00127d",
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
        "name": "Primo-demo",
        "projectId": "primo-demo"
      },
      {
        "_id": "680104c5c9dfc7ba2f00129e",
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
        "name": "Task Mng demo",
        "projectId": "task-mng-demo"
      },
      {
        "_id": "68025e32c9dfc7ba2f0012f0",
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
        "name": "AAUiusahbjska",
        "projectId": "aauiusahbjska"
      },
      {
        "_id": "68026253c9dfc7ba2f0012fd",
        "linkedEnvironments": [
          {
            "envId": "DEV",
            "label": "Development"
          }
        ],
        "name": "Jenkins",
        "projectId": "jenkins"
      },
      {
        "_id": "680514e8c9dfc7ba2f001392",
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
        "name": "Microlc AI Builder",
        "projectId": "microlc-ai-builder"
      },
      {
        "_id": "68064a5ac9dfc7ba2f0013d7",
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
        "name": "Minecraft AI Agent",
        "projectId": "minecraft-ai-agent"
      },
      {
        "_id": "6807916b3774338c82458053",
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
        "name": "DD Demo",
        "projectId": "dd-demo"
      },
      {
        "_id": "680791793774338c8245805f",
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
        "name": "AI Agent Demo",
        "projectId": "ai-agent-demo"
      },
      {
        "_id": "6808f1733774338c824580d2",
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
        "name": "Test Card Game",
        "projectId": "test-card-game"
      },
      {
        "_id": "680a349825e7a18172e9c0aa",
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
        "name": "AI AGtent GGA",
        "projectId": "ai-agtent-gga"
      },
      {
        "_id": "680a3a1825e7a18172e9c0c0",
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
        "name": "create-test-project-dave",
        "projectId": "create-test-project-dave"
      },
      {
        "_id": "680a3b3925e7a18172e9c0cd",
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
        "name": "create-project-test-dave-2",
        "projectId": "create-project-test-dave-2"
      },
      {
        "_id": "680cacfc25e7a18172e9c11d",
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
        "name": "Test Project Giulio",
        "projectId": "test-project-giulio"
      },
      {
        "_id": "680cb96d25e7a18172e9c13b",
        "linkedEnvironments": [
          {
            "envId": "DEV",
            "label": "Development"
          }
        ],
        "name": "Test GGGGGG 333",
        "projectId": "testggg777"
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
  -H 'sec-ch-ua: "Google Chrome";v="135", "Not-A.Brand";v="8", "Chromium";v="135"' \
  -H 'sec-ch-ua-mobile: ?0' \
  -H 'secret: Jh3cQ4bJYh^xyXSN@D94adEZ' \
  -H 'User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36' \
  -H 'Accept: application/json' \
  -H 'Content-Type: application/json' \
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
Create microservice
curl 'https://demo.console.gcp.mia-platform.eu/api/backend/configuration-management/projects/680cacfc25e7a18172e9c11d/microservices/draft' \
  -H 'sec-ch-ua-platform: "macOS"' \
  -H 'Referer: https://demo.console.gcp.mia-platform.eu/projects/680cacfc25e7a18172e9c11d/design/environments/DEV/config/services/custom/create?resourceId=67a4ed58d38aa6c26d28026e&resourceItemId=node-js-helloworld-microservice-example&resourceTenantId=mia-platform' \
  -H 'sec-ch-ua: "Google Chrome";v="135", "Not-A.Brand";v="8", "Chromium";v="135"' \
  -H 'sec-ch-ua-mobile: ?0' \
  -H 'secret: Jh3cQ4bJYh^xyXSN@D94adEZ' \
  -H 'User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36' \
  -H 'Accept: application/json' \
  -H 'Content-Type: application/json' \
  --data-raw '{"name":"nodejs-16-helloworld-microservice-example","type":"custom","annotations":[],"labels":[],"environmentVariables":[]}'

  ```json
  {
  "annotations": [
    {
      "name": "mia-platform.eu/version",
      "value": "This will contain the platform version",
      "description": "Version of Mia-Platform used by the project",
      "readOnly": true
    },
    {
      "name": "fluentbit.io/parser",
      "value": "This will depend on your log parser",
      "description": "Pino parser annotation for Fluent Bit",
      "readOnly": true
    }
  ],
  "labels": [
    {
      "name": "app",
      "value": "nodejs-16-helloworld-microservice-example",
      "description": "Name of the microservice, in the service selector",
      "readOnly": true
    },
    {
      "name": "app.kubernetes.io/name",
      "value": "nodejs-16-helloworld-microservice-example",
      "description": "Name of the microservice",
      "readOnly": true
    },
    {
      "name": "app.kubernetes.io/version",
      "value": "This will depend on your Docker Image tag",
      "description": "Tag of the Docker image",
      "readOnly": true
    },
    {
      "name": "app.kubernetes.io/component",
      "value": "custom",
      "description": "Microservice kind, for the Console",
      "readOnly": true
    },
    {
      "name": "app.kubernetes.io/part-of",
      "value": "test-project-giulio",
      "description": "Project that own the microservice",
      "readOnly": true
    },
    {
      "name": "app.kubernetes.io/managed-by",
      "value": "mia-platform",
      "description": "Identify who manage the service",
      "readOnly": true
    },
    {
      "name": "mia-platform.eu/stage",
      "value": "{{STAGE_TO_DEPLOY}}",
      "description": "Environment used for the deploy",
      "readOnly": true
    },
    {
      "name": "mia-platform.eu/tenant",
      "value": "b933f1ef-5b8e-4adf-a346-24a3b03d13e8",
      "description": "Tenant owner of the project",
      "readOnly": true
    },
    {
      "name": "mia-platform.eu/log-type",
      "value": "This will depend on your log parser",
      "description": "Format of logs for the microservice",
      "readOnly": true
    }
  ],
  "environmentVariables": []
}
```

curl 'https://demo.console.gcp.mia-platform.eu/api/backend/projects/680cacfc25e7a18172e9c11d/service' \
  -H 'sec-ch-ua-platform: "macOS"' \
  -H 'Referer: https://demo.console.gcp.mia-platform.eu/projects/680cacfc25e7a18172e9c11d/design/environments/DEV/config/services/custom/create?resourceId=67a4ed58d38aa6c26d28026e&resourceItemId=node-js-helloworld-microservice-example&resourceTenantId=mia-platform' \
  -H 'sec-ch-ua: "Google Chrome";v="135", "Not-A.Brand";v="8", "Chromium";v="135"' \
  -H 'sec-ch-ua-mobile: ?0' \
  -H 'secret: Jh3cQ4bJYh^xyXSN@D94adEZ' \
  -H 'User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36' \
  -H 'Accept: application/json' \
  -H 'Content-Type: application/json' \
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


  curl 'https://demo.console.gcp.mia-platform.eu/api/backend/marketplace/tenants/mia-platform/resources/node-js-helloworld-microservice-example/versions/1.0.0' \
  -H 'sec-ch-ua-platform: "macOS"' \
  -H 'secret: Jh3cQ4bJYh^xyXSN@D94adEZ' \
  -H 'Referer: https://demo.console.gcp.mia-platform.eu/projects/680cacfc25e7a18172e9c11d/design/environments/DEV/config/services/custom/nodejs-16-helloworld-microservice-example/' \
  -H 'User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36' \
  -H 'Accept: application/json' \
  -H 'sec-ch-ua: "Google Chrome";v="135", "Not-A.Brand";v="8", "Chromium";v="135"' \
  -H 'sec-ch-ua-mobile: ?0'

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
  -H 'sec-ch-ua-platform: "macOS"' \
  -H 'Referer: https://demo.console.gcp.mia-platform.eu/projects/680cacfc25e7a18172e9c11d/design/environments/DEV/config/services/custom/nodejs-16-helloworld-microservice-example/' \
  -H 'sec-ch-ua: "Google Chrome";v="135", "Not-A.Brand";v="8", "Chromium";v="135"' \
  -H 'sec-ch-ua-mobile: ?0' \
  -H 'secret: Jh3cQ4bJYh^xyXSN@D94adEZ' \
  -H 'User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36' \
  -H 'Accept: application/json' \
  -H 'Content-Type: application/json' \
  --data-raw $'{"title":"change: serviceAccounts: nodejs-16-helloworld-microservic...","deletedElements":{},"fastDataConfig":{"systems":{},"castFunctions":{"defaultIdentity":{"castFunctionId":"defaultIdentity","name":"defaultIdentity","dataType":"all","casting":"module.exports = function castIdentity (value, fieldName, logger) {\\n  return value\\n}","type":"default"},"defaultCastToString":{"castFunctionId":"defaultCastToString","name":"defaultCastToString","dataType":"string","casting":"module.exports = function castToString (value, fieldName, logger) {\\n  if (value === null) {return null}\\n  if (value === undefined) {return undefined}\\n  if (typeof value === \'object\') {return JSON.stringify(value)}\\n  return String(value)\\n}\\n","type":"default"},"defaultCastToInteger":{"castFunctionId":"defaultCastToInteger","name":"defaultCastToInteger","dataType":"number","casting":"module.exports = function castToInt (value, fieldName, logger) {\\n  if (value === null) {return null}\\n  if (value === undefined) {return undefined}\\n  const number = Number(value)\\n  if (Number.isNaN(number)) {\\n    logger.debug({fieldName}, \'is invalid, will be casted to undefined\')\\n    return undefined\\n  }\\n  return parseInt(number, 10)\\n}\\n","type":"default"},"defaultCastToFloat":{"castFunctionId":"defaultCastToFloat","name":"defaultCastToFloat","dataType":"number","casting":"module.exports = function castToFloat (value, fieldName, logger) {\\n  if (value === null) {return null}\\n  if (value === undefined) {return undefined}\\n  const number = Number(value)\\n  if (Number.isNaN(number)) {\\n    logger.debug({fieldName}, \'is invalid, will be casted to undefined\')\\n    return undefined\\n  }\\n  return number\\n}\\n","type":"default"},"defaultCastUnitTimestampToISOString":{"castFunctionId":"defaultCastUnitTimestampToISOString","name":"defaultCastUnitTimestampToISOString","dataType":"string","casting":"module.exports = function castUnitTimestampToISOString (value, fieldName, logger) {\\n  if (value === null) {return null}\\n  if (value === undefined) {return undefined}\\n  const date = new Date(value)\\n  if (date.toString() \u0021== \'Invalid Date\') {return date.toISOString()}\\n  logger.debug({fieldName}, \'is invalid, will be casted to undefined\')\\n  return undefined\\n}\\n","type":"default"},"defaultCastStringToBoolean":{"castFunctionId":"defaultCastStringToBoolean","name":"defaultCastStringToBoolean","dataType":"boolean","casting":"module.exports = function castStringToBoolean (value, fieldName, logger) {\\n  if (value === \'false\') {return false}\\n  if (value === \'true\') {return true}\\n  if (value === null) {return null}\\n  if (value === undefined) {return undefined}\\n  logger.debug({fieldName}, \'is invalid, will be casted to undefined\')\\n  return undefined\\n}\\n","type":"default"},"defaultCastToDate":{"castFunctionId":"defaultCastToDate","name":"defaultCastToDate","dataType":"Date","casting":"module.exports = function castToDate (value, fieldName, logger) {\\n  if (value === null) {return null}\\n  const date = new Date(value)\\n  if (date.toString() \u0021== \'Invalid Date\') {\\n    return date\\n  }\\n  logger.debug({fieldName}, \'is invalid, will be casted to undefined\')\\n  return undefined\\n}","type":"default"},"defaultCastToObject":{"castFunctionId":"defaultCastToObject","name":"defaultCastToObject","dataType":"RawObject","casting":"module.exports = function castToObject (value, fieldName, logger) {\\n  if (value === null) {return null}\\n  let valueToCast = value\\n  try {\\n    if(typeof valueToCast === \'string\') {valueToCast = JSON.parse(valueToCast)}\\n  } catch(e) {\\n    logger.debug({fieldName}, \'is invalid, will be casted to undefined\')\\n    return undefined\\n  }\\n  if (typeof valueToCast \u0021== \'object\' || valueToCast.constructor \u0021== Object) {\\n    logger.debug({fieldName}, \'is invalid, will be casted to undefined\')\\n    return undefined\\n  }\\n  return valueToCast\\n}","type":"default"},"defaultCastToArrayOfObject":{"castFunctionId":"defaultCastToArrayOfObject","name":"defaultCastToArrayOfObject","dataType":"Array_RawObject","casting":"module.exports = function castToArrayOfObject (value, fieldName, logger) {\\n  if (value === null) { return null }\\n  let valueToCast = value\\n  try {\\n    if(typeof valueToCast === \'string\') {valueToCast = JSON.parse(valueToCast)}\\n  } catch(e) {\\n    logger.debug({fieldName}, \'is invalid, will be casted to undefined\')\\n    return undefined\\n  }\\n  if (typeof valueToCast \u0021== \'object\' || valueToCast.constructor \u0021== Array ||\\n  valueToCast.some(element => typeof element \u0021== \'object\' || element.constructor \u0021== Object)) {\\n    logger.debug({fieldName}, \'is invalid, will be casted to undefined\')\\n    return undefined\\n  }\\n  return valueToCast\\n}","type":"default"}},"singleViews":{},"deletedElements":{},"version":"2.2.0","lastCommitId":"","updatedAt":"","erSchemas":{}},"microfrontendPluginsConfig":{},"extensionsConfig":{"files":{}},"config":{"applications":{},"collections":{},"endpoints":{},"groups":[],"secrets":[],"cmsCategories":{},"cmsSettings":{"accessGroupsExpression":"isBackoffice && groups.admin"},"cmsAnalytics":{},"cmsDashboard":[],"decorators":{},"serviceAccounts":{"nodejs-16-helloworld-microservice-example":{"name":"nodejs-16-helloworld-microservice-example"}},"services":{"nodejs-16-helloworld-microservice-example":{"name":"nodejs-16-helloworld-microservice-example","type":"custom","tags":["custom"],"advanced":false,"environment":[{"name":"LOG_LEVEL","value":"{{LOG_LEVEL}}","valueType":"plain"},{"name":"MICROSERVICE_GATEWAY_SERVICE_NAME","value":"microservice-gateway","valueType":"plain"},{"name":"TRUSTED_PROXIES","value":"10.0.0.0/8,172.16.0.0/12,192.168.0.0/16","valueType":"plain"},{"name":"HTTP_PORT","value":"3000","valueType":"plain"},{"name":"USERID_HEADER_KEY","value":"miauserid","valueType":"plain"},{"name":"GROUPS_HEADER_KEY","value":"miausergroups","valueType":"plain"},{"name":"CLIENTTYPE_HEADER_KEY","value":"client-type","valueType":"plain"},{"name":"BACKOFFICE_HEADER_KEY","value":"isbackoffice","valueType":"plain"},{"name":"USER_PROPERTIES_HEADER_KEY","value":"miauserproperties","valueType":"plain"}],"description":"Example of a simple Node.js 16 application. \\nIt contains example of tests too.","resources":{"memoryLimits":{"max":"150Mi","min":"150Mi"},"cpuLimits":{"max":"100m","min":"100m"}},"probes":{"liveness":{"port":"http","path":"/-/healthz","initialDelaySeconds":15,"periodSeconds":20,"timeoutSeconds":1,"failureThreshold":3},"readiness":{"port":"http","path":"/-/ready","initialDelaySeconds":5,"periodSeconds":10,"timeoutSeconds":1,"successThreshold":1,"failureThreshold":3}},"terminationGracePeriodSeconds":30,"logParser":"mia-json","dockerImage":"nexus.mia-platform.eu/test-project-giulio/nodejs-16-helloworld-microservice-example","repoUrl":"https://git.tools.mia-platform.eu/clients/mia-platform/demo/demo-companies/digital-platform-c/test-project-giulio/services/nodejs-16-helloworld-microservice-example","sshUrl":"git@git.tools.mia-platform.eu:clients/mia-platform/demo/demo-companies/digital-platform-c/test-project-giulio/services/nodejs-16-helloworld-microservice-example.git","createdAt":"2025-04-26T09:54:59.480Z","generatedFrom":{"_id":"67a4ed58d38aa6c26d28026e"},"replicas":1,"annotations":[{"name":"mia-platform.eu/version","value":"This will contain the platform version","description":"Version of Mia-Platform used by the project","readOnly":true},{"name":"fluentbit.io/parser","value":"This will depend on your log parser","description":"Pino parser annotation for Fluent Bit","readOnly":true}],"labels":[{"name":"app","value":"nodejs-16-helloworld-microservice-example","description":"Name of the microservice, in the service selector","readOnly":true},{"name":"app.kubernetes.io/name","value":"nodejs-16-helloworld-microservice-example","description":"Name of the microservice","readOnly":true},{"name":"app.kubernetes.io/version","value":"This will depend on your Docker Image tag","description":"Tag of the Docker image","readOnly":true},{"name":"app.kubernetes.io/component","value":"custom","description":"Microservice kind, for the Console","readOnly":true},{"name":"app.kubernetes.io/part-of","value":"test-project-giulio","description":"Project that own the microservice","readOnly":true},{"name":"app.kubernetes.io/managed-by","value":"mia-platform","description":"Identify who manage the service","readOnly":true},{"name":"mia-platform.eu/stage","value":"{{STAGE_TO_DEPLOY}}","description":"Environment used for the deploy","readOnly":true},{"name":"mia-platform.eu/tenant","value":"b933f1ef-5b8e-4adf-a346-24a3b03d13e8","description":"Tenant owner of the project","readOnly":true},{"name":"mia-platform.eu/log-type","value":"This will depend on your log parser","description":"Format of logs for the microservice","readOnly":true}],"serviceAccountName":"nodejs-16-helloworld-microservice-example","swaggerPath":"/documentation/json","containerPorts":[{"from":80,"name":"http","protocol":"TCP","to":3000}],"sourceMarketplaceItem":{"itemId":"node-js-helloworld-microservice-example","version":"1.0.0","tenantId":"mia-platform"},"containerRegistryId":"cd6ae8c5-feb0-4e5c-beec-39cf8290d3d7"}},"configMaps":{},"serviceSecrets":{},"apiVersions":[],"unsecretedVariables":[],"listeners":{},"version":"0.61.0"}}'


  ```json
  {"id":"3974b476-01b2-4f46-94c3-c392c0fe4ffe","upgraded":false}
  ```

  curl 'https://demo.console.gcp.mia-platform.eu/api/projects/680cacfc25e7a18172e9c11d/environments/DEV/configuration' \
  -H 'sec-ch-ua-platform: "macOS"' \
  -H 'secret: Jh3cQ4bJYh^xyXSN@D94adEZ' \
  -H 'Referer: https://demo.console.gcp.mia-platform.eu/projects/680cacfc25e7a18172e9c11d/design/environments/DEV/config/services/custom/nodejs-16-helloworld-microservice-example/' \
  -H 'User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36' \
  -H 'Accept: application/json' \
  -H 'sec-ch-ua: "Google Chrome";v="135", "Not-A.Brand";v="8", "Chromium";v="135"' \
  -H 'sec-ch-ua-mobile: ?0'

  ```json
  {
  "endpoints": {},
  "collections": {},
  "groups": [],
  "secrets": [],
  "cmsCategories": {},
  "cmsSettings": {
    "accessGroupsExpression": "isBackoffice && groups.admin"
  },
  "cmsAnalytics": {},
  "cmsDashboard": [],
  "decorators": {
    "preDecorators": {},
    "postDecorators": {}
  },
  "services": {
    "nodejs-16-helloworld-microservice-example": {
      "type": "custom",
      "advanced": false,
      "name": "nodejs-16-helloworld-microservice-example",
      "dockerImage": "nexus.mia-platform.eu/test-project-giulio/nodejs-16-helloworld-microservice-example",
      "replicas": 1,
      "serviceAccountName": "nodejs-16-helloworld-microservice-example",
      "logParser": "mia-json",
      "description": "Example of a simple Node.js 16 application. \nIt contains example of tests too.",
      "repoUrl": "https://git.tools.mia-platform.eu/clients/mia-platform/demo/demo-companies/digital-platform-c/test-project-giulio/services/nodejs-16-helloworld-microservice-example",
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
          "value": "nodejs-16-helloworld-microservice-example",
          "description": "Name of the microservice, in the service selector",
          "readOnly": true,
          "isSelector": false
        },
        {
          "name": "app.kubernetes.io/name",
          "value": "nodejs-16-helloworld-microservice-example",
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
          "value": "test-project-giulio",
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
          "value": "b933f1ef-5b8e-4adf-a346-24a3b03d13e8",
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
        }
      },
      "tags": [
        "custom"
      ],
      "generatedFrom": {
        "_id": "67a4ed58d38aa6c26d28026e"
      },
      "swaggerPath": "/documentation/json",
      "sshUrl": "git@git.tools.mia-platform.eu:clients/mia-platform/demo/demo-companies/digital-platform-c/test-project-giulio/services/nodejs-16-helloworld-microservice-example.git",
      "sourceMarketplaceItem": {
        "itemId": "node-js-helloworld-microservice-example",
        "version": "1.0.0",
        "tenantId": "mia-platform"
      },
      "createdAt": "2025-04-26T09:54:59.480Z",
      "containerPorts": [
        {
          "name": "http",
          "from": 80,
          "to": 3000,
          "protocol": "TCP"
        }
      ],
      "terminationGracePeriodSeconds": 30,
      "containerRegistryId": "cd6ae8c5-feb0-4e5c-beec-39cf8290d3d7"
    }
  },
  "applications": {},
  "listeners": {},
  "apiVersions": [],
  "version": "0.61.0",
  "platformVersion": "14.0.0",
  "lastConfigFileCommitId": "3974b476-01b2-4f46-94c3-c392c0fe4ffe",
  "lastCommitAuthor": "Giulio Roggero",
  "commitId": "3974b476-01b2-4f46-94c3-c392c0fe4ffe",
  "committedDate": "2025-04-26T09:57:00.567Z",
  "configMaps": {},
  "serviceSecrets": {},
  "serviceAccounts": {
    "nodejs-16-helloworld-microservice-example": {
      "name": "nodejs-16-helloworld-microservice-example"
    }
  },
  "unsecretedVariables": [],
  "fastDataConfig": {
    "version": "2.2.0",
    "lastCommitId": "3974b476-01b2-4f46-94c3-c392c0fe4ffe",
    "updatedAt": "2025-04-26T09:57:00.567Z",
    "systems": {},
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
    "singleViews": {},
    "erSchemas": {}
  },
  "extensionsConfig": {
    "files": {}
  },
  "enabledFeatures": {
    "visualize": true,
    "replicas": true
  }
}
```

----------------------------
Deploy

curl 'https://demo.console.gcp.mia-platform.eu/api/deploy/projects/680cacfc25e7a18172e9c11d/environments/DEV/deployments/' \
  -H 'sec-ch-ua-platform: "macOS"' \
  -H 'Referer: https://demo.console.gcp.mia-platform.eu/projects/680cacfc25e7a18172e9c11d/deploy' \
  -H 'sec-ch-ua: "Google Chrome";v="135", "Not-A.Brand";v="8", "Chromium";v="135"' \
  -H 'sec-ch-ua-mobile: ?0' \
  -H 'secret: Jh3cQ4bJYh^xyXSN@D94adEZ' \
  -H 'User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36' \
  -H 'Accept: application/json' \
  -H 'Content-Type: application/json' \
  --data-raw '{"deployType":"smart_deploy","forceDeployWhenNoSemver":false}'

  ```json
  {
  "id": 891494,
  "url": "https://git.tools.mia-platform.eu/clients/mia-platform/demo/demo-companies/digital-platform-c/test-project-giulio/Configurations/-/pipelines/891494"
}
  ```

  curl 'https://demo.console.gcp.mia-platform.eu/api/deploy/projects/680cacfc25e7a18172e9c11d/pipelines/891494/status/?environment=DEV' \
  -H 'sec-ch-ua-platform: "macOS"' \
  -H 'secret: Jh3cQ4bJYh^xyXSN@D94adEZ' \
  -H 'Referer: https://demo.console.gcp.mia-platform.eu/projects/680cacfc25e7a18172e9c11d/deploy' \
  -H 'User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36' \
  -H 'Accept: application/json' \
  -H 'sec-ch-ua: "Google Chrome";v="135", "Not-A.Brand";v="8", "Chromium";v="135"' \
  -H 'sec-ch-ua-mobile: ?0'

  ```json
  {"id":891494,"status":"pending"}
  ```

  curl 'https://demo.console.gcp.mia-platform.eu/api/deploy/projects/680cacfc25e7a18172e9c11d/deployment/?page=1&per_page=1&scope=success&environment=DEV' \
  -H 'sec-ch-ua-platform: "macOS"' \
  -H 'secret: Jh3cQ4bJYh^xyXSN@D94adEZ' \
  -H 'Referer: https://demo.console.gcp.mia-platform.eu/projects/680cacfc25e7a18172e9c11d/deploy' \
  -H 'User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36' \
  -H 'Accept: application/json' \
  -H 'sec-ch-ua: "Google Chrome";v="135", "Not-A.Brand";v="8", "Chromium";v="135"' \
  -H 'sec-ch-ua-mobile: ?0'

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
Runtime

curl 'https://demo.console.gcp.mia-platform.eu/api/backend/projects/680cacfc25e7a18172e9c11d/' \
  -H 'sec-ch-ua-platform: "macOS"' \
  -H 'secret: Jh3cQ4bJYh^xyXSN@D94adEZ' \
  -H 'Referer: https://demo.console.gcp.mia-platform.eu/projects/680cacfc25e7a18172e9c11d/monitoring/environments/DEV' \
  -H 'User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36' \
  -H 'Accept: application/json' \
  -H 'sec-ch-ua: "Google Chrome";v="135", "Not-A.Brand";v="8", "Chromium";v="135"' \
  -H 'sec-ch-ua-mobile: ?0'

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