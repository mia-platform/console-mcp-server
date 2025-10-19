# Marketplace Item Versioning Examples

This document demonstrates how to properly handle versioned and non-versioned marketplace items in the MCP server.

## Understanding Item Type Definition Versioning

Item Type Definitions (ITDs) can either support versioning or not, based on the `spec.isVersioningSupported` field:

### Versioned Item Type Definition Example (e.g., plugin)
```json
{
  "spec": {
    "isVersioningSupported": true,
    // ... other fields
  }
}
```

### Non-Versioned Item Type Definition Example (e.g., ai-prompt)
```json
{
  "spec": {
    // No isVersioningSupported field or set to false
    // ... other fields
  }
}
```

## Creating Marketplace Items

### 1. For Versioned Items (like plugins)

```json
{
  "resources": [
    {
      "itemId": "my-plugin",
      "name": "My Plugin",
      "description": "A custom plugin",
      "itemTypeDefinitionRef": {
        "name": "plugin",
        "namespace": "tenant-id"
      },
      "lifecycleStatus": "published",
      "type": "plugin",
      "tenantId": "tenant-id",
      "version": {
        "name": "1.0.0",
        "releaseDate": "2025-01-18T00:00:00.000Z",
        "lifecycleStatus": "published",
        "releaseNote": "Initial release"
      },
      "resources": {
        // Plugin-specific resources
      },
      "tags": ["custom", "plugin"]
    }
  ]
}
```

### 2. For Non-Versioned Items (like ai-prompt)

```json
{
  "resources": [
    {
      "itemId": "hello-world-prompt",
      "name": "Hello World AI Prompt",
      "description": "A simple hello world prompt",
      "itemTypeDefinitionRef": {
        "name": "ai-prompt",
        "namespace": "tenant-id"
      },
      "lifecycleStatus": "published",
      "type": "ai-prompt",
      "tenantId": "tenant-id",
      "resources": {
        "promptGoal": "Generate a friendly hello world greeting",
        "promptText": "You are a helpful AI assistant..."
      },
      "tags": ["ai", "prompt", "hello-world"]
    }
  ]
}
```

## Best Practices

### 1. Check Item Type Definition First

Before creating marketplace items, always check if the Item Type Definition supports versioning:

```typescript
// Use the marketplace_item_type_definition_info tool
const itd = await client.marketplaceItemTypeDefinitionInfo(tenantId, 'ai-prompt')
const supportsVersioning = itd.spec?.isVersioningSupported === true
```

### 2. Use Validation Utilities

The MCP server now includes validation utilities to help catch common mistakes:

```typescript
import { 
  isVersioningSupported, 
  validateMarketplaceItemStructure, 
  createMarketplaceItemTemplate 
} from './utils'

// Check if ITD supports versioning
const supportsVersioning = isVersioningSupported(itemTypeDefinition)

// Validate item structure
const errors = validateMarketplaceItemStructure(item, itemTypeDefinition)

// Create a template with correct structure
const template = createMarketplaceItemTemplate(
  itemTypeDefinition, 
  'item-id', 
  'Item Name', 
  'tenant-id'
)
```

### 3. Error Handling

The MCP server will now provide clearer error messages:

- ✅ "Item Type Definition 'ai-prompt' does not support versioning but a version object was provided. Remove the version object."
- ✅ "Item Type Definition 'plugin' supports versioning but no version object was provided. Include version with name, releaseDate, lifecycleStatus, and releaseNote."

## Common Mistakes to Avoid

### ❌ Wrong: Adding version to non-versioned items
```json
{
  "itemId": "my-prompt",
  "type": "ai-prompt",
  "version": {  // ❌ This will cause an error
    "name": "1.0.0"
  }
}
```

### ✅ Correct: No version for non-versioned items
```json
{
  "itemId": "my-prompt",
  "type": "ai-prompt"
  // ✅ No version object
}
```

### ❌ Wrong: Missing version for versioned items
```json
{
  "itemId": "my-plugin",
  "type": "plugin"
  // ❌ Missing required version object
}
```

### ✅ Correct: Include version for versioned items
```json
{
  "itemId": "my-plugin",
  "type": "plugin",
  "version": {  // ✅ Required for versioned items
    "name": "1.0.0",
    "releaseDate": "2025-01-18T00:00:00.000Z",
    "lifecycleStatus": "published",
    "releaseNote": "Initial release"
  }
}
```
