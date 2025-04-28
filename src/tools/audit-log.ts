// Copyright Mia srl
// SPDX-License-Identifier: Apache-2.0

// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at

//     http://www.apache.org/licenses/LICENSE-2.0

// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import { CallToolResult } from '@modelcontextprotocol/sdk/types.js'
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'

import { APIClient } from '../lib/client'

// API Paths
const auditLogsPath = '/api/tenants/${tenantId}/audit-logs'

// Format audit logs data
function formatAuditLogs(feature: AuditLogsFeature): string {
  return [
    `Aggregation ID: ${feature.aggregationId}`,
    `Timestamp: ${feature.timestamp}`,
    `Tenant ID: ${feature.tenantId}`,
    `Request Path: ${feature.request.path}`,
    `Request Verb: ${feature.request.verb}`,
    `Request User-Agent: ${feature.request.userAgent}`,
    `Subject ID: ${feature.subject.id}`,
    `Subject Name: ${feature.subject.name}`,
    `Subject Email: ${feature.subject.email}`,
    `Subject Type: ${feature.subject.type}`,
    `Action ID: ${feature.actionId}`,
    `Action Type: ${feature.actionType}`,
    `Resource Name: ${feature.resource.name}`,
    `Resource Type: ${feature.resource.type}`,
    `Scope Tenant ID: ${feature.scope.tenantId}`,
    `Scope Tenant Name: ${feature.scope.tenantName}`,
    "---",
  ].join("\n");
}

interface AuditLogsFeature {
  aggregationId: string;
  timestamp: number;
  tenantId: string;
  request: {
    path: string;
    verb: string;
    userAgent: string;
  };
  subject: {
    id: string;
    name: string;
    email: string;
    type: string;
  };
  actionId: string;
  actionType: string;
  resource: {
    name: string;
    type: string;
  };
  scope: {
    tenantId: string;
    tenantName: string;
  };
}


/**
 * Register audit log tools with the MCP server
 * 
 * @param server - The MCP Server instance
 * @param client - The API client
 * @returns void
 */
export function auditLogTools(server: McpServer, client: APIClient) {
  // Tool: Get Audit Logs
  server.tool(
    'get-audit-logs',
    'Get audit logs for various actions in the console',
    {
      tenantId: z.string().describe('Filter logs for a specific tenant'),
    },
    async ({ tenantId }): Promise<CallToolResult> => {
      try {

      const endpoint = auditLogsPath.replace('{tenantId}', tenantId || 'all')
      
      const audit = await client.get(endpoint)

      if (!audit) {
        return {
          content: [
            {
              type: "text",
              text: "Failed to retrieve Audit Logs",
            },
          ],
        };
      }

      if (!Array.isArray(audit) || audit.length === 0) {
        return {
          content: [
            {
              type: "text",
              text: `No Audit Logs found.`,
            },
          ],
        };
      }

      const formattedAuditLogs = audit.map(formatAuditLogs);
      const auditLogsText = `Audit Logs:\n\n${formattedAuditLogs.join("\n")}`;

      return {
        content: [
          {
            type: "text",
            text: auditLogsText,
          },
        ],
      };


      } catch (error) {
        const err = error as Error
        return {
          content: [
            {
              type: 'text',
              text: `Error fetching audit logs: ${err.message}`,
            },
          ],
        }
      }
    }
  )
}
