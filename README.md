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
      "github": {
        "command": "node",
        "args": [
          "/path/to/the/project/mcp-server",
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

Once has finished you will have all the dependencies installed on the project, then you can run:

```sh
npm run local:test
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

[pipeline-link]: https://github.com/mia-platform/console-mcp-server/actions
[build-svg]: https://img.shields.io/github/actions/workflow/status/mia-platform/console-mcp-server/build-and-test.yaml
[license-svg]: https://img.shields.io/github/license/mia-platform/console-mcp-server

[Model Context Protocol (MCP)]: https://modelcontextprotocol.io/introduction
[Docker]: https://www.docker.com/
[Create a Mia-Platform Service Account]: https://docs.mia-platform.eu/docs/development_suite/identity-and-access-management/manage-service-accounts
[VS Code's agent mode documentation]: https://code.visualstudio.com/docs/copilot/chat/mcp-servers
[nvm]: https://github.com/nvm-sh/nvm
[mise]: https://mise.jdx.dev
