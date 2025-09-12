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

import { randomBytes, randomUUID } from 'crypto'

import { ClientCredentials } from './types'

export class ClientCredentialsManager {
  private credentials: Map<string, ClientCredentials> = new Map<string, ClientCredentials>()
  private readonly EXPIRY_DURATION = 60 * 1000

  generateCredentials (providedClientId?: string): ClientCredentials {
    const clientId = providedClientId ?? this.generateClientId()
    const clientSecret = this.generateClientSecret()
    const createdAt = Date.now()
    const expiresAt = createdAt + this.EXPIRY_DURATION

    const clientCredential: ClientCredentials = {
      clientId,
      clientSecret,
      createdAt,
      expiresAt,
    }

    this.credentials.set(clientId, clientCredential)

    this.cleanupExpired()

    return clientCredential
  }

  getCredentials (clientId: string): Pick<ClientCredentials, 'clientId' | 'clientSecret'> | null {
    const credentials = this.credentials.get(clientId)
    if (!credentials || this.isExpired(credentials)) {
      this.credentials.delete(clientId)
      return null
    }

    return { clientId: credentials.clientId, clientSecret: credentials.clientSecret }
  }

  addState (clientId: string, state: string): boolean {
    const credential = this.credentials.get(clientId)
    if (!credential || this.isExpired(credential)) {
      this.credentials.delete(clientId)
      return false
    }

    if (credential.state) {
      return false
    }

    credential.state = state
    return true
  }

  getStoredClientIdAndState (clientId: string): Pick<ClientCredentials, 'clientId' | 'state'> | null {
    const credential = this.credentials.get(clientId)
    if (!credential || this.isExpired(credential) || !credential.state) {
      this.credentials.delete(clientId)
      return null
    }

    return { clientId: credential.clientId, state: credential.state }
  }

  private generateClientId (): string {
    return randomUUID().replace(/-/g, '')
  }

  private generateClientSecret (): string {
    return randomBytes(32).toString('base64url')
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
