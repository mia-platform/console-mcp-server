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
import { CatalogItemRelease, CatalogItemTypeDefinition, CatalogVersionedItem } from '@mia-platform/console-types'

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
  // #internal: boolean

  constructor (client: HTTPClient, _internal = false) {
    this.#client = client
    // this.#internal = internal
  }

  async listMarketplaceItems (tenantId?: string, type?: string, search?: string): Promise<Record<string, unknown>[]> {
    const params = new URLSearchParams({
      ...tenantId && { includeTenantId: tenantId },
      ...type && { types: type },
      ...search && { name: search },
    })

    return this.#client.getPaginated<Record<string, unknown>>(this.#marketplacePath(), params)
  }

  async marketplaceItemVersions (tenantId: string, itemID: string): Promise<CatalogItemRelease[]> {
    return this.#client.getPaginated<CatalogItemRelease>(this.#itemVersionsPath(tenantId, itemID))
  }

  async marketplaceItemInfo (tenantId: string, itemID: string, version?: string): Promise<CatalogVersionedItem> {
    let itemVersion = version
    if (!itemVersion) {
      const versions = await this.marketplaceItemVersions(tenantId, itemID)
      if (versions.length === 0) {
        throw new Error(`No versions found for marketplace item ${itemID} in tenant ${tenantId}`)
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

    return this.#client.get<CatalogVersionedItem>(this.#itemInfoPath(tenantId, itemID, itemVersion))
  }

  async listMarketplaceItemTypeDefinitions (namespace?: string, name?: string, displayName?: string): Promise<CatalogItemTypeDefinition[]> {
    const params = new URLSearchParams({
      perPage: '200',
      ...namespace && { namespace },
      ...name && { name },
      ...displayName && { displayName },
    })

    return this.#client.getPaginated<CatalogItemTypeDefinition>(this.#itemTypeDefinitionsPath(), params)
  }

  async marketplaceItemTypeDefinitionInfo (tenantId: string, name: string): Promise<CatalogItemTypeDefinition> {
    return this.#client.get<CatalogItemTypeDefinition>(this.#itemTypeDefinitionInfoPath(tenantId, name))
  }

  #marketplacePath (): string {
    return '/api/marketplace/'
  }

  #itemVersionsPath (tenantId: string, itemID: string): string {
    return `/api/tenants/${tenantId}/marketplace/items/${itemID}/versions`
  }

  #itemInfoPath (tenantId: string, itemID: string, version: string): string {
    return `/api/tenants/${tenantId}/marketplace/items/${itemID}/versions/${version}`
  }

  #itemTypeDefinitionsPath (): string {
    return '/api/marketplace/item-type-definitions'
  }

  #itemTypeDefinitionInfoPath (tenantId: string, name: string): string {
    return `/api/tenants/${tenantId}/marketplace/item-type-definitions/${name}`
  }
}
