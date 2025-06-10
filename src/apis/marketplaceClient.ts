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

import { UndiciHeaders } from 'undici/types/dispatcher'

import { HTTPClient } from './http-client'
import { CatalogItemRelease, CatalogVersionedItem } from '@mia-platform/console-types'

export const internalEndpoint = process.env.MARKETPLACE_INTERNAL_ENDPOINT || 'http://internal.local:3000'

export function MarketplaceClientInternal (
  clientID?: string,
  clientSecret?: string,
  additionalHeaders: UndiciHeaders = {},
): MarketplaceClient {
  const client = new HTTPClient(internalEndpoint, clientID, clientSecret, additionalHeaders)
  return new MarketplaceClient(client, true)
}

export class MarketplaceClient {
  #client: HTTPClient
  #internal: boolean

  constructor (client: HTTPClient, internal = false) {
    this.#client = client
    this.#internal = internal
  }

  async listMarketplaceItems (tenantID?: string, type?: string, search?: string): Promise<Record<string, unknown>[]> {
    const params = new URLSearchParams({
      ...tenantID && { includeTenantId: tenantID },
      ...type && { types: type },
      ...search && { name: search },
    })

    return this.#client.getPaginated<Record<string, unknown>>(this.#marketplacePath(), params)
  }

  async marketplaceItemVersions (tenantID: string, itemID: string): Promise<CatalogItemRelease[]> {
    return this.#client.getPaginated<CatalogItemRelease>(this.#itemVersionsPath(tenantID, itemID))
  }

  async marketplaceItemInfo (tenantID: string, itemID: string, version?: string): Promise<CatalogVersionedItem> {
    let itemVersion = version
    if (!itemVersion) {
      const versions = await this.marketplaceItemVersions(tenantID, itemID)
      if (versions.length === 0) {
        throw new Error(`No versions found for marketplace item ${itemID} in tenant ${tenantID}`)
      }
      for (const version of versions) {
        if (version.isLatest) {
          itemVersion = version.version
          break
        }
      }
      if (!itemVersion) {
        throw new Error(`No latest version found for marketplace item ${itemID}`)
      }
    }

    return this.#client.get<CatalogVersionedItem>(this.#itemInfoPath(tenantID, itemID, itemVersion))
  }

  #marketplacePath (): string {
    if (this.#internal) {
      return '/marketplace/'
    }

    return '/api/marketplace/'
  }

  #itemVersionsPath (tenantID: string, itemID: string): string {
    if (this.#internal) {
      return `/tenants/${tenantID}/marketplace/items/${itemID}/versions`
    }

    return `/api/tenants/${tenantID}/marketplace/items/${itemID}/versions`
  }

  #itemInfoPath (tenantID: string, itemID: string, version: string): string {
    if (this.#internal) {
      return `/tenants/${tenantID}/marketplace/items/${itemID}/versions/${version}`
    }

    return `/api/tenants/${tenantID}/marketplace/items/${itemID}/versions/${version}`
  }
}
