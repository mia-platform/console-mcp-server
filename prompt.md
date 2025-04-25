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


