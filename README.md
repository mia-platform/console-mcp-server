# Mia-Platform Console MCP Server

[![pipeline status][build-svg]][pipeline-link]
[![license][license-svg]](./LICENSE)

## Introduction

The Mia-Platform Console MCP Server is a [Model Context Protocol (MCP)] server that provides seamless integration
with Mia-Platform Console APIs, enabling advanced automation and interaction capabilities for developers and tools.

## Prerequisites

1. To run the server in a container, you will need to have [Docker] installed.
1. Once Docker is installed, you will also need to ensure Docker is running.
1. Lastly you will need to a way ot authenticate to your Mia-Platform Console installation, you either have to:
    - [Create a Mia-Platform Service Account] with `Client Secret Basic`
    authorization mode (the only one supported at this time)
  the `Client Secret Basic` one.
    - Use miactl authentication: if you have [`miactl`][miactl] installed you can run any command to login,
     the same session will then be used by the mcp server to authenticate.

> [!WARNING]
> When using miactl session, auto-refresh by the MCP Server is not currently supported,
> once the session created with miactl expires you have to refresh it with miactl again.
---
> [!IMPORTANT]
> When using miactl session, the host you provide to the MCP Server **MUST** be the exact same as the one
> you have logged in with miactl, including scheme and any possible trailing slash.

### How to Run

To run the MCP server on your machine you can follow the instructions in the [Setup Documentation]

### Run from sources

If you don't have Docker installed, you can use NPM and Node.js for running it locally. Once you have cloned the
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
        ],
        "env": {
          "MIA_PLATFORM_CLIENT_ID": "<YOUR_CLIENT_ID>",
          "MIA_PLATFORM_CLIENT_SECRET": "<YOUR_CLIEND_SECRET>"
        }
      }
    }
  }
}
```

> [!TIP]
> If you have a `.env` file configured with your credentials, you can omit the `env` section from the configuration above as the server will automatically load the environment variables.

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
[Model Context Protocol (MCP)]: https://modelcontextprotocol.io/introduction
[Docker]: https://www.docker.com/
[Setup Documentation]: /docs/20_setup.md
[Create a Mia-Platform Service Account]: https://docs.mia-platform.eu/docs/development_suite/identity-and-access-management/manage-service-accounts
[nvm]: https://github.com/nvm-sh/nvm
[mise]: https://mise.jdx.dev
[miactl]: https://github.com/mia-platform/miactl
