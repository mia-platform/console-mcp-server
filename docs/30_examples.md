# Examples

Here you can see some propmts that you can ask to the `mcp-server`.  
Remember to change the values inside the curly braces `{}` with your specific information.

```txt
In {projectName} project, create an endpoint /foo which exposes the service with name echo and docker image
davidebianchi/echo-service. If the service not exists, create it.
```

```txt
Create a Mia-Platform Project named {projectName} in the {companyName} company using the {templateName} template
```

```txt
Create a Mia-Platform Project named {projectName} in the {companyName} company using the {templateName} template. Configure three environments: DEV, STAGING, and PRODUCTION
```

```txt
Create a microservice named {microserviceName} using the template {templateName} in the project {projectName}
```

```txt
Which are the current configurations of the project {projectName}? Provide a table that lists all workloads, replicas, status and if it's source code, a container, or a resource.
List also all endpoints exposed and if they are protected or public and which microservice exposes that endpoint
```

```txt
Analyze the logs of microservice {microserviceName} in project {projectName} from the last 24 hours. Identify any recurring errors and suggest fixes
```

```txt
Service {serviceName} in project {projectName} is crashing on startup. Review the logs, identify the root cause, and provide a solution
```

```txt
Publish the endpoint /hello-world exposed by the microservice {microserviceName} and protect it with OAuth2. Only admin users can call that endpoint, configure authorization accordingly
```

```txt
Create a public API endpoint /products in the {projectName} project that allows GET requests without authentication but requires OAuth2 authentication for POST, PUT and DELETE operations
```

```txt
Implement rate limiting on the /api/v1/users endpoint in project {projectName} to prevent abuse. Allow 100 requests per minute for authenticated users and 10 requests per minute for anonymous users
```

```txt
Configure cross-origin resource sharing (CORS) for all API endpoints in project {projectName} to allow requests from the domain example.com
```

```txt
Create a CRUD Service with the following collections:
  - customers
  - products
  - payments
  - shipping
Add the properties needed to describe all domains
```

```txt
Create a CRUD Service for an inventory management system with the following collections:
  - items (with fields for SKU, name, description, quantity, location, supplier)
  - suppliers (with fields for name, contact information, payment terms)
  - purchase_orders (with fields for order date, supplier, items, status, delivery date)
  - inventory_movements (with fields for item, quantity, direction, timestamp, reason)

Add appropriate indexes for optimizing common queries and configure validation rules
```

```txt
Add a new collection named 'reviews' to the existing CRUD Service in project {projectName}. Include fields for product_id, user_id, rating, comment, and date. Create a projection that joins reviews with products
```

```txt
Configure full-text search on the 'products' collection in project {projectName} to allow users to search by name and description. Implement sorting options by price and popularity
```

```txt
Starting from project {originProjectName} in the tenant {originTenantName} create another project named {targetProjectName} in the tenant {targetTenantName} with the same configurations of {originProjectName}
```

```txt
List all collections in the CRUD service of project {projectName} with their schemas, indexes, and relationships
```

```txt
List all available APIs in project {projectName} with their endpoints, methods, request parameters, and response formats
```

```txt
Show me all endpoints in project {projectName} that handle customer data and verify if they are properly secured
```

```txt
Generate an audit report for all configuration changes in project {projectName} over the last month, including who made each change and when
```

```txt
List all users who have accessed sensitive data in project {projectName} in the last 30 days and what actions they performed
```

```txt
Verify that all services in project {projectName} comply with the company's security policy requirements for authentication, authorization, and data protection
```

```txt
How can I configure the authentication service?
```

```txt
Provide step-by-step documentation on how to implement rate limiting for APIs in a Mia-Platform project
```

```txt
Generate comprehensive documentation for project {projectName}, including architecture diagrams, API references, and deployment instructions
```

```txt
Show me the logs for microservice {microserviceName} in project {projectName} from the last hour filtered to only show error messages
```

```txt
Clone the microservice in vscode and add the endpoint /hello-mia
```
