# Browser Agent Storage

Provides browser-based agent state storage for the TokenRing ecosystem using localStorage for persistent checkpoint management.

## Overview

The Browser Agent Storage package implements a browser-based storage provider for TokenRing AI agents, providing persistent state management through the browser's localStorage API. This implementation enables agents to store and retrieve their state checkpoints locally within the browser environment.

### Key Features

- **Browser-based Storage**: Uses localStorage for persistent agent state storage
- **Checkpoint Management**: Full CRUD operations for agent state checkpoints
- **TokenRing Integration**: Seamlessly integrates with the TokenRing checkpoint system
- **Agent-specific Storage**: Maintains isolated storage per agent with configurable prefixes
- **Cross-platform Compatibility**: Works across all modern browsers supporting localStorage
- **Type-safe Implementation**: Full TypeScript support with Zod schema validation
- **Error Handling**: Graceful handling of storage errors and data corruption
- **Performance Optimization**: Efficient storage and retrieval operations

## Installation

```bash
bun install @tokenring-ai/browser-agent-storage
```

## Package Structure

```
pkg/browser-agent-storage/
├── BrowserAgentStateStorage.ts      # Core storage implementation
├── index.ts                         # Module exports
├── plugin.ts                        # TokenRing plugin integration
├── package.json                     # Package configuration
└── vitest.config.ts                 # Test configuration
```

## Core Components

### BrowserAgentStateStorage

The main storage class that implements the `AgentCheckpointProvider` interface for browser-based storage:

```typescript
import { BrowserAgentStateStorage } from '@tokenring-ai/browser-agent-storage';

const storage = new BrowserAgentStateStorage({
  storageKeyPrefix: 'myApp_', // Optional custom prefix
});
```

#### Constructor Options

| Property | Type | Required | Default | Description |
|----------|------|----------|---------|-------------|
| storageKeyPrefix | string | No | `tokenRingAgentState_v1_` | Custom prefix for localStorage keys |

#### Storage Structure

Checkpoints are stored in localStorage under the key: `{prefix}checkpoints`

Each checkpoint contains:

| Property | Type | Description |
|----------|------|-------------|
| id | string | Unique identifier (UUID) |
| agentId | string | The agent identifier |
| name | string | Checkpoint name |
| config | object | Agent configuration at checkpoint time |
| state | object | Agent state data |
| createdAt | number | Timestamp of checkpoint creation |

## Usage Examples

### Basic Storage Operations

```typescript
import { BrowserAgentStateStorage } from '@tokenring-ai/browser-agent-storage';

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
import { BrowserAgentStateStorage } from '@tokenring-ai/browser-agent-storage';

// Use custom prefix for isolation between applications
const storage = new BrowserAgentStateStorage({
  storageKeyPrefix: 'myapp_v2_',
});

// This will store data under keys starting with 'myapp_v2_'
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
```

### Real-world Development Workflow

```typescript
import { BrowserAgentStateStorage } from '@tokenring-ai/browser-agent-storage';

const storage = new BrowserAgentStateStorage({});

// Simulate a typical development workflow
const initialCheckpoint = {
  agentId: 'dev-agent-001',
  name: 'initial-development',
  config: { model: 'gpt-4', temperature: 0.7 },
  state: { messages: [], context: { project: 'todo-app' } },
  createdAt: Date.now() - 3600000,
};

const featureCheckpoint = {
  agentId: 'dev-agent-001',
  name: 'feature-implementation',
  config: { model: 'gpt-4', temperature: 0.8 },
  state: {
    messages: [{ role: 'user', content: 'Implement todo feature' }],
    context: { project: 'todo-app', phase: 'feature-development' }
  },
  createdAt: Date.now() - 1800000,
};

// Store checkpoints
await storage.storeCheckpoint(initialCheckpoint);
await storage.storeCheckpoint(featureCheckpoint);

// List checkpoints (newest first)
const checkpoints = await storage.listCheckpoints();
console.log('Development checkpoints:', checkpoints);
```

## Plugin Integration

### Plugin Configuration

The package includes a TokenRing plugin that automatically registers the browser storage provider. The plugin configuration schema is:

```typescript
interface BrowserAgentStoragePluginConfig {
  checkpoint?: {
    provider?: {
      type: "browser";
      storageKeyPrefix?: string;
    };
  };
}
```

### Plugin Registration

The plugin is automatically loaded when using the TokenRing package manager. To use it manually:

```typescript
import BrowserAgentStoragePlugin from '@tokenring-ai/browser-agent-storage';

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
| name | string | Plugin name (`"@tokenring-ai/browser-agent-storage"`) |
| version | string | Package version (`"0.2.0"`) |
| description | string | Package description |
| config | ZodSchema | Plugin configuration schema |

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

**Returns:** `Promise<string>` - The ID of the stored checkpoint

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

##### listCheckpoints

Lists all stored checkpoints ordered by creation time (newest first).

```typescript
async listCheckpoints(): Promise<AgentCheckpointListItem[]>
```

**Returns:** `Promise<AgentCheckpointListItem[]>` - Array of checkpoint list items

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

##### clearAllCheckpoints

Clears all checkpoints from storage.

```typescript
async clearAllCheckpoints(): Promise<void>
```

**Returns:** `Promise<void>`

##### close

Closes any resources used by the service. No-op for browser implementation.

```typescript
close(): void
```

**Returns:** `void`

## Configuration

### BrowserAgentStateStorageOptions

```typescript
interface BrowserAgentStateStorageOptions {
  storageKeyPrefix?: string; // Optional, defaults to "tokenRingAgentState_v1_"
}
```

### TokenRing Integration

```typescript
interface TokenRingCheckpointConfig {
  checkpoint: {
    provider: {
      type: "browser";
      storageKeyPrefix?: string; // Optional custom prefix
    }
  }
}
```

## Development

### Testing

The package includes Vitest configuration for testing:

```bash
# Run tests
bun run test

# Run tests with coverage
bun run test:coverage

# Run tests in watch mode
bun run test:watch
```

### Building

```bash
bun run build
```

## Error Handling

The implementation includes robust error handling for common scenarios:

- **localStorage Quota Exceeded**: Handles storage quota errors gracefully
- **Data Corruption**: Recovers from malformed JSON in localStorage
- **Network Issues**: No network dependency, all operations are local
- **Browser Unavailability**: Gracefully handles environments where localStorage is unavailable

## Limitations

- **Browser-only**: Only works in browser environments with localStorage support
- **Storage Limits**: Limited by browser localStorage size constraints (typically 5-10MB)
- **No Cross-device Sync**: Data is tied to specific browser/domain
- **No Server-side Persistence**: All data remains in the browser

## Version History

| Version | Changes |
|---------|---------|
| 0.2.0 | Initial release with full checkpoint management, browser localStorage implementation, plugin system integration, TypeScript and Zod validation, comprehensive test suite |

## License

MIT License - see [LICENSE](./LICENSE) file for details.
