# Mia-Platform Console MCP Server

[![pipeline status][build-svg]][pipeline-link]
[![license][license-svg]](./LICENSE)

## Introduction

The Mia-Platform Console MCP Server is a [Model Context Protocol (MCP)] server that provides seamless integration
with Mia-Platform Console APIs, enabling advanced automation and interaction capabilities for developers and tools.

## Prerequisites

1. To run the server in a container, you will need to have [Docker] installed.
1. Once Docker is installed, you will also need to ensure Docker is running.
1. Lastly you will need to [Create a Mia-Platform Service Account]. For now the only authentication method supported is
  the `Client Secret Basic` one.

## Installation

### VS Code

For manual installation, add the following JSON block to your User Settings (JSON) file in VS Code. You can do this by
pressing `Ctrl + Shift + P` and typing `Preferences: Open User Settings (JSON)`. Optionally, you can add it to a file
called `.vscode/mcp.json` in your workspace.

Once you have done it, toggle Agent mode (located by the Copilot Chat text input) and the server will start.

> Note that the `mcp` key is not needed in the `.vscode/mcp.json` file.
>
> Also note that you can change the host of the Console instance to your custom installation

```json
{
  "mcp": {
    "inputs": [
      {
        "type": "promptString",
        "id": "mia_client_id",
        "description": "Mia-Platform Client ID",
        "password": false
      },
      {
        "type": "promptString",
        "id": "mia_client_secret",
        "description": "Mia-Platform Client Secret",
        "password": true
      },
    ],
    "servers": {
      "mia-platform-console": {
        "command": "docker",
        "args": [
          "run",
          "-i",
          "--rm",
          "-e",
          "MIA_PLATFORM_CLIENT_ID",
          "-e",
          "MIA_PLATFORM_CLIENT_SECRET",
          "ghcr.io/mia-platform/console-mcp-server",
          "mcp-server",
          "start",
          "--stdio",
          "--host=https://console.cloud.mia-platform.eu"
        ],
        "env": {
          "MIA_PLATFORM_CLIENT_ID": "${input:mia_client_id}",
          "MIA_PLATFORM_CLIENT_SECRET": "${input:mia_client_secret}",
        }
      }
    }
  }
}
```

More about using MCP server tools in [VS Code's agent mode documentation].

### Claude Desktop

```json
{
  "mcpServers": {
    "mia-platform-console": {
      "command": "docker",
      "args": [
        "run",
        "-i",
        "--rm",
        "-e",
        "MIA_PLATFORM_CLIENT_ID",
        "-e",
        "MIA_PLATFORM_CLIENT_SECRET",
        "ghcr.io/mia-platform/console-mcp-server",
        "mcp-server",
        "start",
        "--stdio",
        "--host=https://console.cloud.mia-platform.eu"
      ],
      "env": {
        "MIA_PLATFORM_CLIENT_ID": "<YOUR_CLIENT_ID>",
        "MIA_PLATFORM_CLIENT_SECRET": "<YOUR_CLIEND_SECRET>",
      }
    }
  }
}
```

### Run from sources

If you don't have Docker installed, you can use NPM and Node.js for running it locally. Once you have cloned the
project you can run the commands:

```sh
npm ci
npm run build
```

These commands will install all the dependencies and then transpile the typescript code in the `build` folder.  
Once these steps are completed you can setup the MCP server using the `node` command like the following:

```json
{
  "mcp": {
    "servers": {
      "mia-platform-console": {
        "command": "node",
        "args": [
          "${workspaceFolder}/mcp-server",
          "start",
          "--stdio",
          "--host=https://console.cloud.mia-platform.eu"
        ],
        "env": {
          "MIA_PLATFORM_CLIENT_ID": "<YOUR_CLIENT_ID>",
          "MIA_PLATFORM_CLIENT_SECRET": "<YOUR_CLIEND_SECRET>",
        }
      }
    }
  }
}
```

## Local Development

To help with the development of the server you need Node.js installed on your machine.  
The reccomended way is to use a version manager like [nvm] or [mise].

Once you have setup your environment with the correct Node.js version declared inside the `.nvmrc` file you can run the
following command:

```sh
npm ci
```

Once has finished you will have all the dependencies installed on the project, then you have to prepare an environent
file by copying the default.env file and edit it accordingly.

```sh
cp default.env .env
```

Finally to verify everything works, run:

```sh
set -a && source .env
npm run local:test
```

If you are not targeting the Console Cloud installation you can use the `--host` flag and specify your own host

```sh
npm run local:test  -- --host https://CONSOLE_HOST
```

This command will download and launch the MCP inspector on `http://localhost:6274` where you can test if the
implementation will work correctly testing the tools discovery and calls without the needs of a working llm environmnet.

To run tests for new implementations you can use:

```sh
npm test
```

Or running a test for a single file run:

```sh
node --test --import tsx <FILE_PATH>
```

### Example prompts

Configuration changes:

```txt
In {projectName} project, create an endpoint /foo which exposes the service with name echo and docker image davidebianchi/echo-service. If the service not exists, create it.
```

### Work in progress prompts

Here is a set of prompts that we are testing just right now and will be stable soon. You can try! If you provide use feedbacks to improve them it will be really appreciated. 

Rember to change the values inside {}.

#### End-to-End Walking Skelethon

```txt
Create a Mia-Platform project named {projectName} that implement an e-commerce for selling items. Use the {projectBlueprint} template and the tenant {tenantName}

Reuse all items in the marketplace/software catalog in order to maximize the reuse and the source code writte from scratch.

Design the architecture with the following paradigm and add in the project the following items:

- a frontend in react;
- a backend for frontend in nodejs;
- a CRUD service
- an API Gateway

Configure the CRUD service with collections useful to browse items, add to cart, calculate price, create order, pay the order using electronic payments, receive an email notification with the order confirmation and shipping.

The user can see in the personal area the order and the shippings.

Protect the personal area and the payment with OpenID Connect.

Scale all microservice from 2 to max 10.

Once all is create deploy in in DEV Environment and provide me the status of all services when everythin is up and running.

Finally provide the link of the application created.
```

#### Project Creation

``` txt
Create a Mia-Platform Project named {projectName} using the default project blueprint in the tenant {tenantName}
```

#### Microservice Creation

``` txt
Create a Mia-Platform Project named {projectName} using the default project blueprint in the tenant {tenantName}
```

#### Resource Creation

``` txt
Create a microservice named {microserviceName} using the template {templateName} in the project {projectName}
```

```txt
Create a microservice for a backend for frontend using the template in software catalog in the current project
```

#### Runtime Environments and Workload discovery

```txt
Which are the current configuration of the project {projectName}? Provide a table that list all workloads, replica, status and if is a source code, a container or a resource.
List also all endpoints exposed and if are protected or public and which microservice expose that endpoint
```

```txt
Check all project in the tenant {tenantName} and verify if the are code dubplication and if are properly reused the items in the marketplace/software catalog
```

#### Workloads troubleshooting and coding

```txt
Check in Prod environment all containers and if there is some error. If there is an error highilight it and clone the source code of the service. Provide a code snippet to fix that code.
```

#### API Management, Authentication and Authorization

```txt 
Publish the endpoint /hello-wolrd expose by the microservice {microserviceName} and protect it with OAuth2. Only admin users can call that endpoint, configure authorization accordlying.
```

#### CRUD Service Management

```txt 
Create a CRUD Service with the following collections:
  - customers
  - products
  - payments
  - shipping
Add the properties needed the describe all domain.
```

#### Microservice Orchestration (Flow Manager)

```txt 
Orchestrate a Saga for purchasing orchestrating the following microservices
  - CartService, command AddToCart, event ItemAdded
  - PriceCalculatorService,  command CalculatePrice, event PriceCalculated
  - PayService, command Pay, event Payed
Check the API exposed by each service and configure the FlowManger accordling
```

#### Data Pipelines Management (Fast Data)

```txt 
Create a Fast Data Pipeline that aggregate information about Customer from system of record {sysofrecordName1} and system of record {sysofrecordName2}. Call that single view customer_sv.
Inside customer_sv list:
  - customer information
  - orders
  - preferences
```

#### Microfrontend Orchestration (micro-lc)

```txt 
Create an internal tool (backoffice) using micro-lc and micro frontend composer.
The backoffice should visualize:
  - customers
  - produtcs
  - payments
  - shippings
Create the pages accordling usind the CRUD services exposed in the project {projectName}
```


#### Blueprints Creation

```txt 
Create a project blueprint staring from project {projectName} in the tenant {tenantName}
```

```txt
Add to Software Catalog the microservice {microserviceName} in the project {projectName} converting to placehoders the real values inside ENV Vars and Config Maps. Call this item {itemName} and provide a proper description
```

#### DevOps Tools Integration

```txt 
Which are the available pipelines in gitlab repository connect to tenant {tenantName}?
```

#### Infrastructure Tools Integration

```txt 
Describe the status of the cluster {clusterName} connected to tenant {tenantName}
```

#### Project Migration

```txt 
Starting from project {originProjectName} in the tenanet {originiTenantName} create another project named {targetProjectName} in the tenant {targetTenantName} with the same configurations of {originProjectName}
```

#### Workload Scaling and Optimization

```txt 
The number of replicas of the microservice {microserviceName} in project {projectName} are correct in production environment?
```

#### Data Discovery

Some example, change the names accordling

```txt 
Which are the properties of the Purchase Data Product? Who puplish it? Who consume it?
```

#### API Discovery

Some example, change the names accordling

```txt 
How I can retrieve the information about logged user via API?
```

#### Legacy Systems modernization

```txt 
Staring from this repository {repoName} analize the code, split in microservice and create a Mia-PLatform project with the splitted microservices.
```

#### Metrics

```txt
Which are the DORA metrics of the project {projectName} in last 30 days?
```

#### Compliance

```txt
Who have done the last releases in production in the last 7 days for the project {projectName}
```

#### Concierge

```txt
Which are my tasks of today?
```

#### Documentation

```txt
How I can configure authnetication service?
```

### Example of conversations

You may start with a prompt and tham within the context continue the conversations. Some examples

```txt
Create the project Demo Projects in my preferred tenant using all defaults
```

```txt
What I can do now?
```

```txt
Create a microservice to test the coding DevX. Choose you what is better.
```

```txt
Clone the microservice in vscode and add the endpoint /hello-mia
```

```txt
Test and push the code
```

```txt
Deploy that microservice in dev environment
```

```txt
Check the status, is up and running?
```

```txt
Add the endpoint /hello-mia using the API Gateway and deploy that configuration
```

```tx
It's all up and running? If yes provide me the link to call that endpoit
```

[pipeline-link]: https://github.com/mia-platform/console-mcp-server/actions
[build-svg]: https://img.shields.io/github/actions/workflow/status/mia-platform/console-mcp-server/build-and-test.yaml
[license-svg]: https://img.shields.io/github/license/mia-platform/console-mcp-server

[Model Context Protocol (MCP)]: https://modelcontextprotocol.io/introduction
[Docker]: https://www.docker.com/
[Create a Mia-Platform Service Account]: https://docs.mia-platform.eu/docs/development_suite/identity-and-access-management/manage-service-accounts
[VS Code's agent mode documentation]: https://code.visualstudio.com/docs/copilot/chat/mcp-servers
[nvm]: https://github.com/nvm-sh/nvm
[mise]: https://mise.jdx.dev
