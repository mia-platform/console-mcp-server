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

import { CatalogItemTypeDefinition } from '@mia-platform/console-types'

/**
 * Checks if an Item Type Definition supports versioning
 * @param itemTypeDefinition The Item Type Definition to check
 * @returns true if the Item Type Definition supports versioning, false otherwise
 */
export function isVersioningSupported (itemTypeDefinition: CatalogItemTypeDefinition): boolean {
  return itemTypeDefinition.spec?.isVersioningSupported === true
}

/**
 * Validates marketplace item structure based on Item Type Definition versioning support
 * @param item The marketplace item to validate
 * @param itemTypeDefinition The Item Type Definition to validate against
 * @returns An array of validation errors, empty if valid
 */
export function validateMarketplaceItemStructure (
  item: Record<string, unknown>,
  itemTypeDefinition: CatalogItemTypeDefinition,
): string[] {
  const errors: string[] = []
  const supportsVersioning = isVersioningSupported(itemTypeDefinition)

  if (supportsVersioning && !item.version) {
    errors.push(`Item Type Definition '${itemTypeDefinition.metadata?.name}' supports versioning but no version object was provided. Include version with name, releaseDate, lifecycleStatus, and releaseNote.`)
  }

  if (!supportsVersioning && item.version) {
    errors.push(`Item Type Definition '${itemTypeDefinition.metadata?.name}' does not support versioning but a version object was provided. Remove the version object.`)
  }

  return errors
}

/**
 * Creates a marketplace item structure template based on Item Type Definition
 * @param itemTypeDefinition The Item Type Definition to base the template on
 * @param itemId The item ID for the marketplace item
 * @param name The name for the marketplace item
 * @param tenantId The tenant ID
 * @returns A template marketplace item structure
 */
export function createMarketplaceItemTemplate (
  itemTypeDefinition: CatalogItemTypeDefinition,
  itemId: string,
  name: string,
  tenantId: string,
): Record<string, unknown> {
  const supportsVersioning = isVersioningSupported(itemTypeDefinition)

  const template: Record<string, unknown> = {
    itemId,
    name,
    tenantId,
    type: itemTypeDefinition.spec?.type || itemTypeDefinition.metadata?.name,
    itemTypeDefinitionRef: {
      name: itemTypeDefinition.metadata?.name,
      namespace: itemTypeDefinition.metadata?.namespace?.id,
    },
    lifecycleStatus: 'published',
    description: '',
    resources: {},
    tags: [],
  }

  if (supportsVersioning) {
    template.version = {
      name: '1.0.0',
      releaseDate: new Date().toISOString(),
      lifecycleStatus: 'published',
      releaseNote: 'Initial release',
    }
  }

  return template
}
