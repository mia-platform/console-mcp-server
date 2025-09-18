# Mia-Platform Console MCP Server

[![pipeline status][build-svg]][pipeline-link]
[![license][license-svg]](./LICENSE)

## Introduction

The Mia-Platform Console MCP Server is a [Model Context Protocol (MCP)](mcp-intro) server that provides seamless integration
with Mia-Platform Console APIs, enabling advanced automation and interaction capabilities for developers and tools.

## Prerequisites

To use the Mia-Platform Console MCP Server in your client (such as Visual Studio Code, Claude Desktop, Cursor, Gemini CLI or others), you first need to have a valid account on the Mia-Platform Console instance you want to communicate with. You will be required also to include the instance host address you in the environment variable named `CONSOLE_HOST`.

You may decide to access via:

- Service Account to perform machine-2-machine authentication and have full access to the MCP capabilities to perform operations on the Company where the S.A. has been created (for more information, visit [our official documentation on how to create a Mia-Platform Service Account](docs-create-service-account)). If you do so, you need to include the environment variables `MIA_PLATFORM_CLIENT_ID` and `MIA_PLATFORM_CLIENT_SECRET`.
- Using your own credentials: Mia-Platform Console MCP Server follows the [Model Context Protocol specifications on authentication](mcp-specs-auth) using OAuth2.1 and Dynamic Client Registration: clients that follow that specifications will be able to discover the authentication endpoints of the selected Mia-Platform instance you want to access to and guide you to perform the log in.

### How to Run

You can run stable versions of the Mia-Platform Console MCP Server using [Docker](Docker). You can get detailed guide using the [following guide](20-setup).

If you don't have Docker installed, or you simply wish to run it locally, you can use NPM and Node.js. Once you have cloned the
project you can run the commands:

```sh
npm ci
npm run build
```

These commands will install all the dependencies and then transpile the typescript code in the `build` folder.

> [!NOTE]
> The server automatically loads environment variables from a `.env` file if present in the project root. 
> You can create one by copying `default.env` to `.env` and updating the values as needed.

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
        ]
      }
    }
  }
}
```

:::tip

Alternatively, you start the service after the build with the following command:

```sh
node mcp-server start
```

Then add the mcp server to your client simply including the url. As example for VS Code:

```json
{
  "mcp": {
    "servers": {
      "mia-platform-console": {
        "type": "http",
        "url": "http://localhost:3000/console-mcp-server/mcp"
      }
    }
  }
}
```

Instead of `3000`, please include the port defined in the environment variable `PORT`. More detail in the [Environment Variables](#environment-variables) section.

:::

### Environment Variables

Environment variables located inside a file named `.env` are automatically included at service startup.

| Variable Name | Description | Required | Default Value |
|---------------|-------------|----------|---------------|
| `LOG_LEVEL` | Log level of the application | No | `info` |
| `PORT` | Port number for the HTTP server | No | `3000` |
| `CONSOLE_HOST` | The host address of the Mia-Platform Console instance | Yes | - |
| `MIA_PLATFORM_CLIENT_ID` | Client ID for Service Account authentication | No | - |
| `MIA_PLATFORM_CLIENT_SECRET` | Client secret for Service Account authentication | No | - |
| `CLIENT_EXPIRY_DURATION` | Duration in seconds of clients generated with the DCR authentication flow. After this time, the client will be expired and cannot be used anylonger. | No | `300` |


## Local Development

To help with the development of the server you need Node.js installed on your machine.  
The recommended way is to use a version manager like [nvm] or [mise].

Once you have setup your environment with the correct Node.js version declared inside the `.nvmrc` file you can run the
following command:

```sh
npm ci
```

Once has finished you will have all the dependencies installed on the project, then you have to prepare an environment
file by copying the default.env file and edit it accordingly.

```sh
cp default.env .env
```

Finally to verify everything works, run:

```sh
npm run local:test
```

If you are not targeting the Console Cloud installation you can use the `--host` flag and specify your own host

```sh
npm run local:test  -- --host https://CONSOLE_HOST
```

This command will download and launch the MCP inspector on `http://localhost:6274` where you can test if the
implementation will work correctly testing the tools discovery and calls without the needs of a working llm environment.

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
[mcp-intro]: https://modelcontextprotocol.io/introduction
[mcp-specs-auth]: https://modelcontextprotocol.io/specification/2025-06-18
[Docker]: https://www.docker.com/
[20-setup]: /docs/20_setup.md
[docs-create-service-account]: https://docs.mia-platform.eu/docs/development_suite/identity-and-access-management/manage-service-accounts
[nvm]: https://github.com/nvm-sh/nvm
[mise]: https://mise.jdx.dev
