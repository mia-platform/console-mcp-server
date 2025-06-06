# Setup

## Installation

### Prerequisites

1. To run the server in a container, you will need to have [Docker] installed.
1. Once Docker is installed, you will also need to ensure Docker is running.
1. Lastly you will need to a way ot authenticate to your Mia-Platform Console installation, you either have to:
    - [Create a Mia-Platform Service Account] with `Client Secret Basic`
    authorization mode (the only one supported at this time)
  the `Client Secret Basic` one.
    - Use miactl authentication: if you have [`miactl`][miactl] installed you can run any command to login,
     the same session will then be used by the mcp server to authenticate.

### VS Code

For manual installation, add the following JSON block to your User Settings (JSON) file in VS Code. You can do this by
pressing `Ctrl + Shift + P` and typing `Preferences: Open User Settings (JSON)`. Optionally, you can add it to a file
called `.vscode/mcp.json` in your workspace.

Once you have done it, toggle Agent mode (located by the Copilot Chat text input) and the server will start.

:::note
The `mcp` key is not needed in the `.vscode/mcp.json` file.  
Also note that you can change the host of the Console instance to your custom installation
:::

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
      }
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
          "MIA_PLATFORM_CLIENT_SECRET": "${input:mia_client_secret}"
        }
      }
    }
  }
}
```

:::tip
If you want to use User-based authentication with [`miactl`][miactl] you have to omit from the env object:

- `MIA_PLATFORM_CLIENT_ID`
- `MIA_PLATFORM_CLIENT_SECRET`

:::

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
        "MIA_PLATFORM_CLIENT_SECRET": "<YOUR_CLIEND_SECRET>"
      }
    }
  }
}
```

[Docker]: https://www.docker.com/
[miactl]: https://github.com/mia-platform/miactl
[VS Code's agent mode documentation]: https://code.visualstudio.com/docs/copilot/chat/mcp-servers
