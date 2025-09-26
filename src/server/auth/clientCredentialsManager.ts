// Copyright Mia srl
// SPDX-License-Identifier: Apache-2.0
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import { randomUUID } from 'crypto'

import { ClientCredentials } from './types'

/**
 * This is a class to handle the client credentials generated during the Dynamic Client Registration flow
 * of the OAuth2 authentication process to the Mia-Platform MCP Server. The credentials are stored in memory
 * and have a short expiration time (configurable via env var; default: 5 minutes) to enhance security. The manager caches the credentials
 * that are going to be used to authenticate using Mia-Platform authentication server.
 */
export class ClientCredentialsManager {
  private credentials: Map<string, ClientCredentials> = new Map<string, ClientCredentials>()
  expiryDuration: number = 300 * 1000

  constructor (expiryDuration?: number) {
    if (expiryDuration) {
      this.expiryDuration = expiryDuration * 1000
    }
  }

  generateCredentials (providedClientId?: string): ClientCredentials {
    const clientId = providedClientId ?? this.generateClientId()
    const createdAt = Date.now()
    const expiresAt = createdAt + this.expiryDuration

    const clientCredential: ClientCredentials = {
      clientId,
      createdAt,
      expiresAt,
    }

    this.credentials.set(clientId, clientCredential)

    this.cleanupExpired()

    return clientCredential
  }

  getCredentials (clientId: string): Pick<ClientCredentials, 'clientId'> | null {
    const credentials = this.credentials.get(clientId)
    if (!credentials || this.isExpired(credentials)) {
      this.credentials.delete(clientId)
      return null
    }

    return { clientId: credentials.clientId }
  }

  private generateClientId (): string {
    return randomUUID().replace(/-/g, '')
  }

  private isExpired (credential: ClientCredentials): boolean {
    return Date.now() > credential.expiresAt
  }

  private cleanupExpired (): void {
    for (const [ clientId, credential ] of this.credentials.entries()) {
      if (this.isExpired(credential)) {
        this.credentials.delete(clientId)
      }
    }
  }

  destroy (): void {
    this.credentials.clear()
  }
}
