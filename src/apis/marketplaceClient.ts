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
import {
  MarketplaceApplyItemsRequest,
  MarketplaceApplyItemsResponse,
  MarketplaceUploadFileResponse,
  SoftwareCatalogCategory,
} from './types/marketplace'

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

  async listMarketplaceItemTypeDefinitions (namespace?: string, name?: string, displayName?: string): Promise<CatalogItemTypeDefinition[]> {
    const params = new URLSearchParams({
      perPage: '200',
      ...namespace && { namespace },
      ...name && { name },
      ...displayName && { displayName },
    })

    return this.#client.getPaginated<CatalogItemTypeDefinition>(this.#itemTypeDefinitionsPath(), params)
  }

  async marketplaceItemTypeDefinitionInfo (tenantID: string, name: string): Promise<CatalogItemTypeDefinition> {
    return this.#client.get<CatalogItemTypeDefinition>(this.#itemTypeDefinitionInfoPath(tenantID, name))
  }

  async getMarketplaceCategories (): Promise<SoftwareCatalogCategory[]> {
    return this.#client.get<SoftwareCatalogCategory[]>(this.#categoriesPath())
  }

  async applyMarketplaceItems (tenantID: string, items: MarketplaceApplyItemsRequest): Promise<MarketplaceApplyItemsResponse> {
    return this.#client.post<MarketplaceApplyItemsResponse>(this.#applyItemsPath(tenantID), items)
  }

  async upsertItemTypeDefinition (tenantID: string, definition: CatalogItemTypeDefinition): Promise<CatalogItemTypeDefinition> {
    return this.#client.put<CatalogItemTypeDefinition>(this.#itemTypeDefinitionsUpsertPath(tenantID), definition)
  }

  async uploadMarketplaceFile (_tenantID: string, _formData: FormData): Promise<MarketplaceUploadFileResponse> {
    // Note: This method would need special handling for multipart/form-data
    // For now, we'll implement a simple version that assumes the formData is properly formatted
    // The HTTPClient would need to be extended to support FormData
    throw new Error('File upload not yet implemented - requires multipart/form-data support')
  }

  #marketplacePath (): string {
    return '/api/marketplace/'
  }

  #itemVersionsPath (tenantID: string, itemID: string): string {
    return `/api/tenants/${tenantID}/marketplace/items/${itemID}/versions`
  }

  #itemInfoPath (tenantID: string, itemID: string, version: string): string {
    return `/api/tenants/${tenantID}/marketplace/items/${itemID}/versions/${version}`
  }

  #itemTypeDefinitionsPath (): string {
    return '/api/marketplace/item-type-definitions'
  }

  #itemTypeDefinitionInfoPath (tenantID: string, name: string): string {
    return `/api/tenants/${tenantID}/marketplace/item-type-definitions/${name}`
  }

  #categoriesPath (): string {
    return '/api/marketplace/categories'
  }

  #applyItemsPath (tenantID: string): string {
    return `/api/tenants/${tenantID}/marketplace/items`
  }

  #itemTypeDefinitionsUpsertPath (tenantID: string): string {
    return `/api/tenants/${tenantID}/marketplace/item-type-definitions`
  }
}
