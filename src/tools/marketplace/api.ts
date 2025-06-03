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

import { APIClient } from '../../lib/client'

import { CatalogItem, CatalogItemRelease, CatalogVersionedItem } from '@mia-platform/console-types'

const listMarketplacePath = '/api/marketplace/'
const listMarketplaceItemVersions = (tenantId: string, marketplaceId: string) => {
  return `/api/tenants/${tenantId}/marketplace/items/${marketplaceId}/versions`
}
const marketplaceItemVersionInfo = (tenantId: string, marketplaceId: string, version: string) => {
  return `/api/tenants/${tenantId}/marketplace/items/${marketplaceId}/versions/${version}`
}

export async function listMarketplaceItems (client: APIClient, tenantId?: string, type?: string, search?: string) {
  const params = new URLSearchParams()
  if (tenantId) {
    params.set('includeTenantId', tenantId)
  }
  if (type) {
    params.set('types', type)
  }
  if (search) {
    params.set('name', search)
  }

  return await client.getPaginated<CatalogItem>(listMarketplacePath, params)
}

export async function listMarketPlaceItemVersions (client: APIClient, itemId: string, tenantId: string) {
  return await client.getPaginated<CatalogItemRelease>(listMarketplaceItemVersions(tenantId, itemId))
}

export async function getMarketplaceItemVersionInfo (client: APIClient, itemId: string, tenantId: string, version: string) {
  return await client.get<CatalogVersionedItem>(marketplaceItemVersionInfo(tenantId, itemId, version))
}
