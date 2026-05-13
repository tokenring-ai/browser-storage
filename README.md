# @tokenring-ai/browser-storage

Provides browser-based agent state storage for the TokenRing ecosystem using localStorage for persistent checkpoint
management.

## Overview

The Browser Agent Storage package implements a browser-based storage provider for TokenRing AI agents, providing
persistent state management through the browser's localStorage API. This implementation enables agents to store and
retrieve their state checkpoints locally within the browser environment.

### Key Features

- **Browser-based Storage**: Uses localStorage for persistent agent state storage
- **Checkpoint Management**: Full CRUD operations for agent state checkpoints
- **TokenRing Integration**: Seamlessly integrates with the TokenRing checkpoint system via the `AgentCheckpointStorage`
  interface
- **Agent-specific Storage**: Supports multiple agents with configurable storage isolation via prefixes
- **Cross-platform Compatibility**: Works across all modern browsers supporting localStorage
- **Type-safe Implementation**: Full TypeScript support with Zod schema validation
- **Error Handling**: Graceful handling of storage errors, data corruption, and quota exceeded scenarios
- **Performance Optimized**: Efficient storage and retrieval operations with batch support

## Installation

```bash
bun install @tokenring-ai/browser-storage
```

## Package Structure

```text
pkg/browser-storage/
├── BrowserStorageService.ts     # Core storage implementation
├── index.ts                     # Module exports
├── plugin.ts                    # TokenRing plugin integration
├── schema.ts                    # Configuration schema
├── package.json                 # Package configuration
├── vitest.config.ts             # Test configuration
├── BrowserStorageService.test.ts # Unit tests
└── integration.test.ts          # Integration tests
```

## Core Components

### BrowserStorageService

The main storage class that implements the `AgentCheckpointStorage` interface for browser-based storage:

```typescript
import { BrowserStorageService } from '@tokenring-ai/browser-storage';

const storage = new BrowserStorageService({
  storageKeyPrefix: 'myApp_', // Optional custom prefix
});
```

#### Constructor Options

| Property         | Type   | Required | Default      | Description                                                                   |
|------------------|--------|----------|--------------|-------------------------------------------------------------------------------|
| storageKeyPrefix | string | No       | `tokenring:` | Custom prefix for localStorage keys to achieve isolation between applications |

#### Storage Structure

All checkpoints are stored in a single localStorage entry under the key: `{prefix}checkpoints`

The storage contains an array of checkpoints. Each checkpoint has the following structure:

| Property  | Type   | Description                                              |
|-----------|--------|----------------------------------------------------------|
| id        | string | Unique identifier (UUID v4)                              |
| agentId   | string | The agent identifier                                     |
| agentType | string | The type of agent (e.g., 'developer', 'content-creator') |
| sessionId | string | Optional session identifier                              |
| name      | string | Checkpoint name                                          |
| state     | object | Agent state data                                         |
| createdAt | number | Timestamp of checkpoint creation                         |

**Important Notes:**

- All agents share the same storage when using the same prefix
- Use different prefixes to isolate data between applications
- Storage is limited by browser localStorage constraints (typically 5-10MB per domain)

## Types and Exports

The package exports the following types and interfaces:

```typescript
// Main class
import { BrowserStorageService } from '@tokenring-ai/browser-storage';

// Zod schema for validation
import { BrowserStorageServiceConfigSchema } from '@tokenring-ai/browser-storage';

// Configuration type
import type { ParsedBrowserStorageConfig } from '@tokenring-ai/browser-storage';

// Checkpoint types from @tokenring-ai/checkpoint
import type {
  NamedAgentCheckpoint,
  StoredAgentCheckpoint,
  AgentCheckpointListItem,
  AgentCheckpointStorage,
} from '@tokenring-ai/checkpoint/AgentCheckpointStorage';
```

### Type Definitions

#### NamedAgentCheckpoint

```typescript
interface NamedAgentCheckpoint {
  agentId: string;
  agentType?: string;
  sessionId?: string;
  name: string;
  state: Record<string, any>;
  createdAt?: number;
}
```

#### StoredAgentCheckpoint

```typescript
interface StoredAgentCheckpoint extends NamedAgentCheckpoint {
  id: string;
}
```

#### AgentCheckpointListItem

```typescript
interface AgentCheckpointListItem {
  id: string;
  name: string;
  agentId: string;
  agentType?: string;
  sessionId?: string;
  createdAt: number;
}
```

## Usage Examples

### Basic Storage Operations

```typescript
import {BrowserStorageService} from '@tokenring-ai/browser-storage';

// Initialize storage with default prefix
const storage = new BrowserStorageService({});

// Create a checkpoint
const checkpoint = {
  agentId: 'agent-123',
  agentType: 'developer',
  name: 'initial-state',
  state: { messages: [], context: {} },
  createdAt: Date.now(),
};

const checkpointId = storage.storeAgentCheckpoint(checkpoint);
console.log('Stored checkpoint:', checkpointId);

// Retrieve a checkpoint
const retrieved = storage.retrieveAgentCheckpoint(checkpointId);
console.log('Retrieved checkpoint:', retrieved);

// List all checkpoints (newest first)
const allCheckpoints = storage.listAgentCheckpoints();
console.log('All checkpoints:', allCheckpoints);

// Delete a specific checkpoint
const deleted = storage.deleteCheckpoint(checkpointId);
console.log('Deleted:', deleted);
```

### Custom Storage Prefix

```typescript
import { BrowserStorageService } from '@tokenring-ai/browser-storage';

// Use custom prefix for isolation between applications
const storage = new BrowserStorageService({
  storageKeyPrefix: 'myapp_v2_',
});

// This will store data under keys starting with 'myapp_v2_'
// Example: 'myapp_v2_checkpoints'
```

### Multiple Agents with Isolation

```typescript
import { BrowserStorageService } from '@tokenring-ai/browser-storage';

// Development agents
const devStorage = new BrowserStorageService({
  storageKeyPrefix: 'dev_agents_',
});

// Content creation agents
const contentStorage = new BrowserStorageService({
  storageKeyPrefix: 'content_agents_',
});

// Store checkpoints for different agents
const devCheckpoint = {
  agentId: 'dev-001',
  agentType: 'developer',
  name: 'dev-checkpoint',
  state: { messages: [], context: { project: 'api' } },
  createdAt: Date.now(),
};

const contentCheckpoint = {
  agentId: 'content-001',
  agentType: 'content-creator',
  name: 'content-checkpoint',
  state: { messages: [], context: { project: 'blog' } },
  createdAt: Date.now(),
};

const devId = devStorage.storeAgentCheckpoint(devCheckpoint);
const contentId = contentStorage.storeAgentCheckpoint(contentCheckpoint);

// Verify isolation - each storage only sees its own checkpoints
const devCheckpoints = devStorage.listAgentCheckpoints(); // 1 checkpoint
const contentCheckpoints = contentStorage.listAgentCheckpoints(); // 1 checkpoint

// Cross-storage retrieval returns null
const devInContent = contentStorage.retrieveAgentCheckpoint(devId); // null
const contentInDev = devStorage.retrieveAgentCheckpoint(contentId); // null
```

### Integration with TokenRing

The plugin automatically registers the browser storage provider when configured:

```typescript
// In your TokenRing app configuration
const app = new TokenRingApp({
  plugins: [
    BrowserAgentStoragePlugin({
      browserStorage: {
        storageKeyPrefix: "myapp_"
      }
    })
  ]
});

// The BrowserStorageService will be automatically registered
// with the AgentCheckpointService
```

### Real-world Development Workflow

```typescript
import {BrowserStorageService} from '@tokenring-ai/browser-storage';

const storage = new BrowserStorageService({});

// Simulate a typical development workflow
const initialCheckpoint = {
  agentId: 'dev-agent-001',
  agentType: 'developer',
  name: 'initial-development',
  state: {
    messages: [],
    context: { project: 'todo-app', phase: 'initialization' }
  },
  createdAt: Date.now() - 3600000, // 1 hour ago
};

const featureCheckpoint = {
  agentId: 'dev-agent-001',
  agentType: 'developer',
  name: 'feature-implementation',
  state: {
    messages: [{ role: 'user', content: 'Implement todo feature' }],
    context: { project: 'todo-app', phase: 'feature-development' }
  },
  createdAt: Date.now() - 1800000, // 30 minutes ago
};

const testingCheckpoint = {
  agentId: 'dev-agent-001',
  agentType: 'developer',
  name: 'testing-phase',
  state: {
    messages: [{ role: 'user', content: 'Run tests' }],
    context: { project: 'todo-app', phase: 'testing', testResults: 'passed' }
  },
  createdAt: Date.now() - 600000, // 10 minutes ago
};

// Store checkpoints
const initialId = storage.storeAgentCheckpoint(initialCheckpoint);
const featureId = storage.storeAgentCheckpoint(featureCheckpoint);
const testingId = storage.storeAgentCheckpoint(testingCheckpoint);

// List checkpoints (newest first)
const checkpoints = storage.listAgentCheckpoints();
// Order: testing-phase, feature-implementation, initial-development

// Retrieve specific checkpoint
const current = storage.retrieveAgentCheckpoint(testingId);

// Remove outdated checkpoint
storage.deleteCheckpoint(initialId);

// Clear all checkpoints
storage.clearAllCheckpoints();
```

### Error Handling

```typescript
import { BrowserStorageService } from '@tokenring-ai/browser-storage';

const storage = new BrowserStorageService({});

try {
  const checkpoint = {
    agentId: 'agent-123',
    agentType: 'developer',
    name: 'test-checkpoint',
    state: { messages: [] },
    createdAt: Date.now(),
  };

  const id = storage.storeAgentCheckpoint(checkpoint);
  console.log('Checkpoint stored:', id);
} catch (error) {
  console.error('Failed to store checkpoint:', error);
  // The implementation handles errors gracefully and logs them
  // Operations will fail silently with error logging to console
}

// Retrieving non-existent checkpoint returns null
const nonExistent = storage.retrieveAgentCheckpoint('non-existent-id');
console.log(nonExistent); // null
```

## Plugin Integration

### Plugin Configuration

The package includes a TokenRing plugin that automatically registers the browser storage provider. The plugin
configuration schema is:

```typescript
import { z } from "zod";
import { BrowserStorageServiceConfigSchema } from '@tokenring-ai/browser-storage';

const packageConfigSchema = z.object({
  browserStorage: BrowserStorageServiceConfigSchema,
});

// BrowserStorageServiceConfigSchema:
const BrowserStorageServiceConfigSchema = z.object({
  storageKeyPrefix: z.string().default('tokenring:'),
}).default({ storageKeyPrefix: 'tokenring:' });
```

### Plugin Registration

The plugin is automatically loaded when using the TokenRing package manager. To use it manually:

```typescript
import BrowserAgentStoragePlugin from '@tokenring-ai/browser-storage/plugin';

const app = new TokenRingApp({
  plugins: [
    BrowserAgentStoragePlugin({
      browserStorage: {
        storageKeyPrefix: "myapp_"
      }
    })
  ]
});
```

### Plugin Properties

| Property    | Type      | Description                                     |
|-------------|-----------|-------------------------------------------------|
| name        | string    | Plugin name (`"@tokenring-ai/browser-storage"`) |
| displayName | string    | Display name (`"Browser Storage"`)              |
| version     | string    | Package version (`"0.2.0"`)                     |
| description | string    | Package description                             |
| config      | ZodSchema | Plugin configuration schema                     |

### Automatic Registration

When the plugin is installed with a browser storage configuration:

1. The plugin creates a `BrowserStorageService` instance with the configured options
2. Registers the service in the app's service registry
3. Waits for the `AgentCheckpointService` to be available
4. Sets the storage service as the checkpoint provider via `setCheckpointProvider()`

## API Reference

### BrowserStorageService API

#### Properties

| Property    | Type                       | Description                                          |
|-------------|----------------------------|------------------------------------------------------|
| name        | string                     | Storage provider name (`"BrowserAgentStateStorage"`) |
| description | string                     | Service description                                  |
| displayName | string                     | Display name including the configured prefix         |
| options     | ParsedBrowserStorageConfig | Configuration options                                |

#### Methods

##### storeAgentCheckpoint

Stores a new checkpoint for an agent.

```typescript
storeAgentCheckpoint(checkpoint: NamedAgentCheckpoint): string
```

**Parameters:**

| Parameter  | Type                 | Description                                                                         |
|------------|----------------------|-------------------------------------------------------------------------------------|
| checkpoint | NamedAgentCheckpoint | Checkpoint data including agentId, agentType, sessionId, name, state, and createdAt |

**Returns:** `string` - The UUID v4 ID of the stored checkpoint

**Example:**

```typescript
const id = storage.storeAgentCheckpoint({
  agentId: 'agent-123',
  agentType: 'developer',
  name: 'my-checkpoint',
  state: { messages: [] },
  createdAt: Date.now(),
});
// Returns: "550e8400-e29b-41d4-a716-446655440000"
```

##### retrieveAgentCheckpoint

Retrieves a checkpoint by its ID.

```typescript
retrieveAgentCheckpoint(checkpointId: string): StoredAgentCheckpoint | null
```

**Parameters:**

| Parameter    | Type   | Description               |
|--------------|--------|---------------------------|
| checkpointId | string | The checkpoint identifier |

**Returns:** `StoredAgentCheckpoint | null` - The retrieved checkpoint or null if not found

**Example:**

```typescript
const checkpoint = storage.retrieveAgentCheckpoint('550e8400-e29b-41d4-a716-446655440000');
// Returns: StoredAgentCheckpoint | null
```

##### listAgentCheckpoints

Lists all stored checkpoints ordered by creation time (newest first).

```typescript
listAgentCheckpoints(): AgentCheckpointListItem[]
```

**Returns:** `AgentCheckpointListItem[]` - Array of checkpoint list items sorted by createdAt descending

**Example:**

```typescript
const checkpoints = storage.listAgentCheckpoints();
// Returns: [
//   { id, name, config, agentId, agentType, sessionId, createdAt }, // newest
//   { id, name, config, agentId, agentType, sessionId, createdAt },
//   { id, name, config, agentId, agentType, sessionId, createdAt }  // oldest
// ]
```

##### deleteCheckpoint

Deletes a specific checkpoint by ID.

```typescript
deleteCheckpoint(checkpointId: string): boolean
```

**Parameters:**

| Parameter    | Type   | Description                         |
|--------------|--------|-------------------------------------|
| checkpointId | string | The checkpoint identifier to delete |

**Returns:** `boolean` - True if checkpoint was deleted, false if not found

**Example:**

```typescript
const deleted = storage.deleteCheckpoint('550e8400-e29b-41d4-a716-446655440000');
// Returns: true if deleted, false if not found
```

##### clearAllCheckpoints

Clears all checkpoints from storage.

```typescript
clearAllCheckpoints(): void
```

**Returns:** `void`

**Example:**

```typescript
storage.clearAllCheckpoints();
// All checkpoints are removed from localStorage
```

##### close

Closes any resources used by the service. No-op for browser implementation.

```typescript
close(): void
```

**Returns:** `void`

**Example:**

```typescript
storage.close();
// No-op for localStorage implementation
```

## Configuration

### BrowserStorageServiceConfigSchema

The package exports a Zod schema for validating storage options:

```typescript
import { BrowserStorageServiceConfigSchema } from '@tokenring-ai/browser-storage';

// The schema validates storageKeyPrefix (optional, defaults to "tokenring:")
const validatedOptions = BrowserStorageServiceConfigSchema.parse({
  storageKeyPrefix: 'custom_prefix_'
});
```

### ParsedBrowserStorageConfig

```typescript
type ParsedBrowserStorageConfig = {
  storageKeyPrefix: string;
};
```

### AgentCheckpointStorage Interface

The package implements the `AgentCheckpointStorage` interface from `@tokenring-ai/checkpoint`:

```typescript
import type {
  NamedAgentCheckpoint,
  StoredAgentCheckpoint,
  AgentCheckpointListItem,
  AgentCheckpointStorage,
} from '@tokenring-ai/checkpoint/AgentCheckpointStorage';

// Provider interface
interface AgentCheckpointStorage {
  name: string;
  storeAgentCheckpoint(checkpoint: NamedAgentCheckpoint): string;
  retrieveAgentCheckpoint(checkpointId: string): StoredAgentCheckpoint | null;
  listAgentCheckpoints(): AgentCheckpointListItem[];
  deleteCheckpoint(checkpointId: string): boolean;
  clearAllCheckpoints(): void;
  close(): void;
}
```

## Development

### Testing

The package includes comprehensive Vitest configuration for testing:

```bash
# Run tests
bun run test

# Run tests with coverage
bun run test:coverage

# Run tests in watch mode
bun run test:watch
```

### Test Coverage

The package includes thorough test coverage for:

- **Constructor**: Default and custom prefix initialization
- **Storage Operations**: CRUD operations for checkpoints
- **Error Handling**: Quota exceeded, malformed JSON, localStorage unavailable
- **Integration**: Complete checkpoint lifecycle, data isolation
- **Performance**: Rapid checkpoint creation, batch operations
- **Real-world Scenarios**: Development workflows, content creation workflows

### Building

```bash
bun run build
```

## Error Handling and Recovery

The implementation includes robust error handling for common scenarios:

- **localStorage Quota Exceeded**: Handles storage quota errors gracefully with console logging
- **Data Corruption**: Recovers from malformed JSON in localStorage by returning empty arrays
- **Network Issues**: No network dependency, all operations are local
- **Browser Unavailability**: Gracefully handles environments where localStorage is unavailable

### Error Scenarios

| Scenario                 | Behavior                                       |
|--------------------------|------------------------------------------------|
| Quota exceeded           | Error logged to console, checkpoint not stored |
| Malformed JSON           | Empty array returned, operation continues      |
| localStorage unavailable | Error logged to console, empty array returned  |
| Non-existent checkpoint  | Returns null (not an error)                    |

## Limitations

- **Browser-only**: Only works in browser environments with localStorage support
- **Storage Limits**: Limited by browser localStorage size constraints (typically 5-10MB per domain)
- **No Cross-device Sync**: Data is tied to specific browser/domain
- **No Server-side Persistence**: All data remains in the browser
- **Single Storage Entry**: All checkpoints stored in a single localStorage entry
- **No Transaction Support**: Operations are not atomic

## Best Practices

1. **Use Descriptive Checkpoint Names**: Make checkpoint names meaningful for easy identification
2. **Implement Cleanup Logic**: Regularly delete outdated checkpoints to manage storage
3. **Monitor Storage Size**: Be aware of localStorage limits and implement cleanup when needed
4. **Use Prefixes for Isolation**: Use different prefixes for different applications
5. **Handle Errors Gracefully**: Always handle potential storage errors in production code
6. **Test in Target Browser**: Test storage behavior in all target browsers

## Version History

| Version | Changes                                                                                                                                                                  |
|---------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| 0.2.0   | Initial release with full checkpoint management, browser localStorage implementation, plugin system integration, TypeScript and Zod validation, comprehensive test suite |

## License

MIT License - see [LICENSE](./LICENSE) file for details.
