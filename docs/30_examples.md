# Examples

Here you can see some propmts that you can ask to the `mcp-server`.  
Remember to change the values inside the curly braces `{}` with your specific information.

## Project Creation

```txt
Create a Mia-Platform Project named {projectName} in the {companyName} company using the {templateName} template
```

## Microservice Creation

```txt
In {projectName} project, create an endpoint /foo which exposes the service with name echo and docker image
davidebianchi/echo-service. If the service not exists, create it.
```

```txt
Create a microservice named {microserviceName} using the template {templateName} in the project {projectName}
```

## Runtime Environments and Workload Discovery

```txt
Which are the current configurations of the project {projectName}? Provide a table that lists all workloads, replicas, status and if it's source code, a container, or a resource.
List also all endpoints exposed and if they are protected or public and which microservice exposes that endpoint
```

```txt
Check all projects in the tenant {tenantName} and verify if there is code duplication and if items in the marketplace/software catalog are properly reused
```

```txt
Show me the resource utilization of all services in project {projectName} in the PRODUCTION environment. Identify any services that are over-provisioned or under-provisioned
```

```txt
Compare the configurations between DEV and PRODUCTION environments for project {projectName} and highlight any inconsistencies or differences that could cause deployment issues
```

NOT WORKING

missing tool for adding/changin environments

```txt
Create a Mia-Platform Project named {projectName} in the {companyName} company using the {templateName} template. Configure three environments: DEV, STAGING, and PRODUCTION
```

missing express framework template

```txt
Add a new Node.js microservice named {microserviceName} to project {projectName}. Use the Express framework template and configure it with 2 replicas
```

wrong patching of the service, will try to also change cpu, tags, swagger path, and the liveness probe is alredy
configured by the template and it will try to change it with an allucinated path

```txt
Create a Java Spring Boot microservice named {microserviceName} in project {projectName}. Set up proper health checks and configure 3GB of memory but don't change anything else
```

do changes after creation withotu being asked

```txt
Create a microservice for a backend for frontend using the template in software catalog in the current Mia-Platform project
```

looping on the marketplace trying to find redis, and even if it can find it it cannot configure
persistance options

```txt
Add a Redis cache named {cacheName} to project {projectName} with 1GB memory and configure proper persistence options
```

don't know how to find existing mongodb instances

```txt
Add a Python FastAPI microservice named {microserviceName} to project {projectName}. Configure it to connect to the existing MongoDB instance and implement proper error handling
```

allucinate inexisting acl

```txt
Publish the endpoint /hello-world exposed by the microservice {microserviceName} in the {projectName} project and protect it with OAuth2. Only admin users can call that endpoint, configure authorization accordingly
```

allucinate inexisting acl

```txt
Create a public API endpoint /products in the {projectName} project that allows GET requests without authentication but requires OAuth2 authentication for POST, PUT and DELETE operations
```

allucinate configuration for a configmap

```txt
Configure cross-origin resource sharing (CORS) for all API endpoints in project {projectName} to allow requests from the domain example.com
```

Error in changing the endpoint because it cannot set the requestsPerSecond property where it is needed

```txt
Implement rate limiting on the /api/v1/users endpoint in project {projectName} to prevent abuse. Allow 100 requests per minute for authenticated users and 10 requests per minute for anonymous users
```
