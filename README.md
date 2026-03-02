# Browser Agent Storage

Provides browser-based agent state storage for the TokenRing ecosystem using localStorage for persistent checkpoint management.

## Overview

The Browser Agent Storage package implements a browser-based storage provider for TokenRing AI agents, providing persistent state management through the browser's localStorage API. This implementation enables agents to store and retrieve their state checkpoints locally within the browser environment.

### Key Features

- **Browser-based Storage**: Uses localStorage for persistent agent state storage
- **Checkpoint Management**: Full CRUD operations for agent state checkpoints
- **TokenRing Integration**: Seamlessly integrates with the TokenRing checkpoint system via the `AgentCheckpointProvider` interface
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

```
pkg/browser-storage/
├── BrowserAgentStateStorage.ts      # Core storage implementation
├── index.ts                         # Module exports
├── plugin.ts                        # TokenRing plugin integration
├── package.json                     # Package configuration
├── vitest.config.ts                 # Test configuration
├── BrowserAgentStateStorage.test.ts # Unit tests
└── integration.test.ts              # Integration tests
```

## Core Components

### BrowserAgentStateStorage

The main storage class that implements the `AgentCheckpointProvider` interface for browser-based storage:

```typescript
import { BrowserAgentStateStorage } from '@tokenring-ai/browser-storage';

const storage = new BrowserAgentStateStorage({
  storageKeyPrefix: 'myApp_', // Optional custom prefix
});
```

#### Constructor Options

| Property | Type | Required | Default | Description |
|----------|------|----------|---------|-------------|
| storageKeyPrefix | string | No | `tokenRingAgentState_v1_` | Custom prefix for localStorage keys to achieve isolation between applications |

#### Storage Structure

All checkpoints are stored in a single localStorage entry under the key: `{prefix}checkpoints`

The storage contains an array of checkpoints. Each checkpoint has the following structure:

| Property | Type | Description |
|----------|------|-------------|
| id | string | Unique identifier (UUID v4) |
| agentId | string | The agent identifier |
| name | string | Checkpoint name |
| config | object | Agent configuration at checkpoint time |
| state | object | Agent state data |
| createdAt | number | Timestamp of checkpoint creation |

**Important Notes:**
- All agents share the same storage when using the same prefix
- Use different prefixes to isolate data between applications
- Storage is limited by browser localStorage constraints (typically 5-10MB per domain)

## Types and Exports

The package exports the following types and interfaces:

```typescript
// Main class
import BrowserAgentStateStorage from '@tokenring-ai/browser-storage';

// Zod schema for validation
import { BrowserAgentStateStorageOptionsSchema } from '@tokenring-ai/browser-storage';

// Checkpoint types from @tokenring-ai/checkpoint
import type {
  NamedAgentCheckpoint,
  StoredAgentCheckpoint,
  AgentCheckpointListItem,
  AgentCheckpointProvider,
} from '@tokenring-ai/checkpoint/AgentCheckpointProvider';
```

### Type Definitions

#### NamedAgentCheckpoint

```typescript
interface NamedAgentCheckpoint extends AgentCheckpointData {
  name: string;
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
type AgentCheckpointListItem = Omit<StoredAgentCheckpoint, "state" | "config">;
```

## Usage Examples

### Basic Storage Operations

```typescript
import { BrowserAgentStateStorage } from '@tokenring-ai/browser-storage';

// Initialize storage with default prefix
const storage = new BrowserAgentStateStorage({});

// Create a checkpoint
const checkpoint = {
  agentId: 'agent-123',
  name: 'initial-state',
  config: { model: 'gpt-4', temperature: 0.7 },
  state: { messages: [], context: {} },
  createdAt: Date.now(),
};

const checkpointId = await storage.storeCheckpoint(checkpoint);
console.log('Stored checkpoint:', checkpointId);

// Retrieve a checkpoint
const retrieved = await storage.retrieveCheckpoint(checkpointId);
console.log('Retrieved checkpoint:', retrieved);

// List all checkpoints (newest first)
const allCheckpoints = await storage.listCheckpoints();
console.log('All checkpoints:', allCheckpoints);

// Delete a specific checkpoint
const deleted = await storage.deleteCheckpoint(checkpointId);
console.log('Deleted:', deleted);
```

### Custom Storage Prefix

```typescript
import { BrowserAgentStateStorage } from '@tokenring-ai/browser-storage';

// Use custom prefix for isolation between applications
const storage = new BrowserAgentStateStorage({
  storageKeyPrefix: 'myapp_v2_',
});

// This will store data under keys starting with 'myapp_v2_'
// Example: 'myapp_v2_checkpoints'
```

### Multiple Agents with Isolation

```typescript
import { BrowserAgentStateStorage } from '@tokenring-ai/browser-storage';

// Development agents
const devStorage = new BrowserAgentStateStorage({
  storageKeyPrefix: 'dev_agents_',
});

// Content creation agents
const contentStorage = new BrowserAgentStateStorage({
  storageKeyPrefix: 'content_agents_',
});

// Store checkpoints for different agents
const devCheckpoint = {
  agentId: 'dev-001',
  name: 'dev-checkpoint',
  config: { model: 'gpt-4' },
  state: { messages: [], context: { project: 'api' } },
  createdAt: Date.now(),
};

const contentCheckpoint = {
  agentId: 'content-001',
  name: 'content-checkpoint',
  config: { model: 'gpt-4' },
  state: { messages: [], context: { project: 'blog' } },
  createdAt: Date.now(),
};

const devId = await devStorage.storeCheckpoint(devCheckpoint);
const contentId = await contentStorage.storeCheckpoint(contentCheckpoint);

// Verify isolation - each storage only sees its own checkpoints
const devCheckpoints = await devStorage.listCheckpoints(); // 1 checkpoint
const contentCheckpoints = await contentStorage.listCheckpoints(); // 1 checkpoint

// Cross-storage retrieval returns null
const devInContent = await contentStorage.retrieveCheckpoint(devId); // null
const contentInDev = await devStorage.retrieveCheckpoint(contentId); // null
```

### Integration with TokenRing

The plugin automatically registers the browser storage provider when configured:

```typescript
// In your TokenRing app configuration
const app = new TokenRingApp({
  checkpoint: {
    provider: {
      type: "browser",
      storageKeyPrefix: "myapp_"
    }
  }
});

// The BrowserAgentStateStorage will be automatically registered
// with the AgentCheckpointService
```

### Real-world Development Workflow

```typescript
import { BrowserAgentStateStorage } from '@tokenring-ai/browser-storage';

const storage = new BrowserAgentStateStorage({});

// Simulate a typical development workflow
const initialCheckpoint = {
  agentId: 'dev-agent-001',
  name: 'initial-development',
  config: { model: 'gpt-4', temperature: 0.7 },
  state: { 
    messages: [], 
    context: { project: 'todo-app', phase: 'initialization' } 
  },
  createdAt: Date.now() - 3600000, // 1 hour ago
};

const featureCheckpoint = {
  agentId: 'dev-agent-001',
  name: 'feature-implementation',
  config: { model: 'gpt-4', temperature: 0.8 },
  state: {
    messages: [{ role: 'user', content: 'Implement todo feature' }],
    context: { project: 'todo-app', phase: 'feature-development' }
  },
  createdAt: Date.now() - 1800000, // 30 minutes ago
};

const testingCheckpoint = {
  agentId: 'dev-agent-001',
  name: 'testing-phase',
  config: { model: 'gpt-4', temperature: 0.3 },
  state: {
    messages: [{ role: 'user', content: 'Run tests' }],
    context: { project: 'todo-app', phase: 'testing', testResults: 'passed' }
  },
  createdAt: Date.now() - 600000, // 10 minutes ago
};

// Store checkpoints
const initialId = await storage.storeCheckpoint(initialCheckpoint);
const featureId = await storage.storeCheckpoint(featureCheckpoint);
const testingId = await storage.storeCheckpoint(testingCheckpoint);

// List checkpoints (newest first)
const checkpoints = await storage.listCheckpoints();
// Order: testing-phase, feature-implementation, initial-development

// Retrieve specific checkpoint
const current = await storage.retrieveCheckpoint(testingId);

// Remove outdated checkpoint
await storage.deleteCheckpoint(initialId);

// Clear all checkpoints
await storage.clearAllCheckpoints();
```

### Error Handling

```typescript
import { BrowserAgentStateStorage } from '@tokenring-ai/browser-storage';

const storage = new BrowserAgentStateStorage({});

try {
  const checkpoint = {
    agentId: 'agent-123',
    name: 'test-checkpoint',
    config: { model: 'gpt-4' },
    state: { messages: [] },
    createdAt: Date.now(),
  };

  const id = await storage.storeCheckpoint(checkpoint);
  console.log('Checkpoint stored:', id);
} catch (error) {
  console.error('Failed to store checkpoint:', error);
  // The implementation handles errors gracefully and logs them
  // Operations will fail silently with error logging to console
}

// Retrieving non-existent checkpoint returns null
const nonExistent = await storage.retrieveCheckpoint('non-existent-id');
console.log(nonExistent); // null
```

## Plugin Integration

### Plugin Configuration

The package includes a TokenRing plugin that automatically registers the browser storage provider. The plugin configuration schema is:

```typescript
import {z} from "zod";
import {CheckpointConfigSchema} from "@tokenring-ai/checkpoint";

const packageConfigSchema = z.object({
  checkpoint: CheckpointConfigSchema.optional(),
});

// CheckpointConfigSchema from @tokenring-ai/checkpoint:
const checkpointConfigSchema = z.object({
  provider: z.looseObject({
    type: z.string()
  })
});
```

### Plugin Registration

The plugin is automatically loaded when using the TokenRing package manager. To use it manually:

```typescript
import BrowserAgentStoragePlugin from '@tokenring-ai/browser-storage/plugin';

const app = new TokenRingApp({
  plugins: [
    BrowserAgentStoragePlugin({
      checkpoint: {
        provider: {
          type: "browser",
          storageKeyPrefix: "myapp_"
        }
      }
    })
  ]
});
```

### Plugin Properties

| Property | Type | Description |
|----------|------|-------------|
| name | string | Plugin name (`"@tokenring-ai/browser-storage"`) |
| version | string | Package version (`"0.2.0"`) |
| description | string | Package description |
| config | ZodSchema | Plugin configuration schema |

### Automatic Registration

When the plugin is installed with a browser provider configuration:

1. The plugin waits for the `AgentCheckpointService` to be available
2. Creates a `BrowserAgentStateStorage` instance with the configured options
3. Registers the provider with the checkpoint service via `setCheckpointProvider()`

## API Reference

### BrowserAgentStateStorage

#### Properties

| Property | Type | Description |
|----------|------|-------------|
| name | string | Storage provider name (`"BrowserAgentStateStorage"`) |
| storageKeyPrefix | string | Configured prefix for localStorage keys |

#### Methods

##### storeCheckpoint

Stores a new checkpoint for an agent.

```typescript
async storeCheckpoint(checkpoint: NamedAgentCheckpoint): Promise<string>
```

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| checkpoint | NamedAgentCheckpoint | Checkpoint data including agentId, name, config, state, and createdAt |

**Returns:** `Promise<string>` - The UUID v4 ID of the stored checkpoint

**Example:**

```typescript
const id = await storage.storeCheckpoint({
  agentId: 'agent-123',
  name: 'my-checkpoint',
  config: { model: 'gpt-4' },
  state: { messages: [] },
  createdAt: Date.now(),
});
// Returns: "550e8400-e29b-41d4-a716-446655440000"
```

##### retrieveCheckpoint

Retrieves a checkpoint by its ID.

```typescript
async retrieveCheckpoint(checkpointId: string): Promise<StoredAgentCheckpoint | null>
```

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| checkpointId | string | The checkpoint identifier |

**Returns:** `Promise<StoredAgentCheckpoint | null>` - The retrieved checkpoint or null if not found

**Example:**

```typescript
const checkpoint = await storage.retrieveCheckpoint('550e8400-e29b-41d4-a716-446655440000');
// Returns: StoredAgentCheckpoint | null
```

##### listCheckpoints

Lists all stored checkpoints ordered by creation time (newest first).

```typescript
async listCheckpoints(): Promise<AgentCheckpointListItem[]>
```

**Returns:** `Promise<AgentCheckpointListItem[]>` - Array of checkpoint list items sorted by createdAt descending

**Example:**

```typescript
const checkpoints = await storage.listCheckpoints();
// Returns: [
//   { id, name, config, agentId, createdAt }, // newest
//   { id, name, config, agentId, createdAt },
//   { id, name, config, agentId, createdAt }  // oldest
// ]
```

##### deleteCheckpoint

Deletes a specific checkpoint by ID.

```typescript
async deleteCheckpoint(checkpointId: string): Promise<boolean>
```

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| checkpointId | string | The checkpoint identifier to delete |

**Returns:** `Promise<boolean>` - True if checkpoint was deleted, false if not found

**Example:**

```typescript
const deleted = await storage.deleteCheckpoint('550e8400-e29b-41d4-a716-446655440000');
// Returns: true if deleted, false if not found
```

##### clearAllCheckpoints

Clears all checkpoints from storage.

```typescript
async clearAllCheckpoints(): Promise<void>
```

**Returns:** `Promise<void>`

**Example:**

```typescript
await storage.clearAllCheckpoints();
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

### BrowserAgentStateStorageOptionsSchema

The package exports a Zod schema for validating storage options:

```typescript
import { BrowserAgentStateStorageOptionsSchema } from '@tokenring-ai/browser-storage';

// The schema validates storageKeyPrefix (optional, defaults to "tokenRingAgentState_v1_")
const validatedOptions = BrowserAgentStateStorageOptionsSchema.parse({
  storageKeyPrefix: 'custom_prefix_'
});
```

### TokenRing Integration

The package integrates with the TokenRing checkpoint system using the standard checkpoint configuration schema:

```typescript
import { CheckpointConfigSchema } from '@tokenring-ai/checkpoint';

// Checkpoint provider configuration
const checkpointConfig = CheckpointConfigSchema.parse({
  provider: {
    type: "browser",
    storageKeyPrefix: "myapp_"
  }
});
```

### AgentCheckpointProvider Interface

The package implements the `AgentCheckpointProvider` interface from `@tokenring-ai/checkpoint`:

```typescript
import type {
  NamedAgentCheckpoint,
  StoredAgentCheckpoint,
  AgentCheckpointListItem,
  AgentCheckpointProvider,
} from '@tokenring-ai/checkpoint/AgentCheckpointProvider';

// Provider interface
interface AgentCheckpointProvider {
  name: string;
  storeCheckpoint(checkpoint: NamedAgentCheckpoint): Promise<string>;
  retrieveCheckpoint(checkpointId: string): Promise<StoredAgentCheckpoint | null>;
  listCheckpoints(): Promise<AgentCheckpointListItem[]>;
  deleteCheckpoint(checkpointId: string): Promise<boolean>;
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

## Error Handling

The implementation includes robust error handling for common scenarios:

- **localStorage Quota Exceeded**: Handles storage quota errors gracefully with console logging
- **Data Corruption**: Recovers from malformed JSON in localStorage by returning empty arrays
- **Network Issues**: No network dependency, all operations are local
- **Browser Unavailability**: Gracefully handles environments where localStorage is unavailable

### Error Scenarios

| Scenario | Behavior |
|----------|----------|
| Quota exceeded | Error logged to console, checkpoint not stored |
| Malformed JSON | Empty array returned, operation continues |
| localStorage unavailable | Error logged to console, empty array returned |
| Non-existent checkpoint | Returns null (not an error) |

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

| Version | Changes |
|---------|---------|
| 0.2.0 | Initial release with full checkpoint management, browser localStorage implementation, plugin system integration, TypeScript and Zod validation, comprehensive test suite |

## License

MIT License - see [LICENSE](./LICENSE) file for details.
