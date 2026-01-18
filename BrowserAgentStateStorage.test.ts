import type {NamedAgentCheckpoint, StoredAgentCheckpoint,} from '@tokenring-ai/checkpoint/AgentCheckpointProvider';
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import BrowserAgentStateStorage from './BrowserAgentStateStorage';

// Mock localStorage for testing
interface LocalStorageMock {
  getItem: ReturnType<typeof vi.fn>;
  setItem: ReturnType<typeof vi.fn>;
  removeItem: ReturnType<typeof vi.fn>;
  clear: ReturnType<typeof vi.fn>;
  key: ReturnType<typeof vi.fn>;
  length: number;
  [key: string]: any;
}

const localStorageMock: LocalStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  key: vi.fn(),
  length: 0,
} as any;

// Store the original localStorage
const originalLocalStorage = globalThis.localStorage;

describe('BrowserAgentStateStorage', () => {
  let storage: BrowserAgentStateStorage;
  let mockStorageData: Record<string, string>;

  beforeEach(() => {
    // Setup localStorage mock
    mockStorageData = {};
    localStorageMock.getItem.mockImplementation((key: string) => {
      return mockStorageData[key] || null;
    });
    localStorageMock.setItem.mockImplementation((key: string, value: string) => {
      mockStorageData[key] = value;
    });
    localStorageMock.removeItem.mockImplementation((key: string) => {
      delete mockStorageData[key];
    });
    
    // Replace global localStorage with our mock
    globalThis.localStorage = localStorageMock;
    
    // Clear all mocks
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Restore original localStorage
    globalThis.localStorage = originalLocalStorage;
  });

  describe('constructor', () => {
    it('should initialize with default prefix', () => {
      storage = new BrowserAgentStateStorage({});
      expect(storage.storageKeyPrefix).toBe('tokenRingAgentState_v1_');
      expect(storage.name).toBe('BrowserAgentStateStorage');
    });

    it('should initialize with custom prefix', () => {
      storage = new BrowserAgentStateStorage({
        storageKeyPrefix: 'custom_prefix_',
      });
      expect(storage.storageKeyPrefix).toBe('custom_prefix_');
      expect(storage.name).toBe('BrowserAgentStateStorage');
    });
  });

  describe('_getStorageKey', () => {
    beforeEach(() => {
      storage = new BrowserAgentStateStorage({});
    });

    it('should return correct storage key with default prefix', () => {
      const key = (storage as any)._getStorageKey();
      expect(key).toBe('tokenRingAgentState_v1_checkpoints');
    });

    it('should return correct storage key with custom prefix', () => {
      storage = new BrowserAgentStateStorage({
        storageKeyPrefix: 'custom_prefix_',
      });
      const key = (storage as any)._getStorageKey();
      expect(key).toBe('custom_prefix_checkpoints');
    });
  });

  describe('_getAllCheckpoints', () => {
    beforeEach(() => {
      storage = new BrowserAgentStateStorage({});
    });

    it('should return empty array when no data stored', () => {
      vi.mocked(localStorageMock.getItem).mockReturnValue(null);
      const checkpoints = (storage as any)._getAllCheckpoints();
      expect(checkpoints).toEqual([]);
    });

    it('should return empty array when localStorage throws error', () => {
      vi.mocked(localStorageMock.getItem).mockImplementation(() => {
        throw new Error('Storage error');
      });
      const checkpoints = (storage as any)._getAllCheckpoints();
      expect(checkpoints).toEqual([]);
    });

    it('should parse and return stored checkpoints', () => {
      const storedData = [
        {
          id: 'agent1_1234567890',
          agentId: 'agent1',
          name: 'checkpoint1',
          config: { model: 'gpt-4' },
          state: { messages: [] },
          createdAt: 1234567890,
        },
      ];
      vi.mocked(localStorageMock.getItem).mockReturnValue(
        JSON.stringify(storedData)
      );
      const checkpoints = (storage as any)._getAllCheckpoints();
      expect(checkpoints).toEqual(storedData);
    });
  });

  describe('_saveAllCheckpoints', () => {
    beforeEach(() => {
      storage = new BrowserAgentStateStorage({});
    });

    it('should save checkpoints to localStorage', () => {
      const checkpoints: StoredAgentCheckpoint[] = [
        {
          id: 'agent1_1234567890',
          agentId: 'agent1',
          name: 'checkpoint1',
          config: { model: 'gpt-4' },
          state: { messages: [] },
          createdAt: 1234567890,
        },
      ];
      (storage as any)._saveAllCheckpoints(checkpoints);
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'tokenRingAgentState_v1_checkpoints',
        JSON.stringify(checkpoints)
      );
    });

    it('should handle storage errors gracefully', () => {
      vi.mocked(localStorageMock.setItem).mockImplementation(() => {
        throw new Error('Storage quota exceeded');
      });
      const checkpoints: StoredAgentCheckpoint[] = [];
      expect(() => (storage as any)._saveAllCheckpoints(checkpoints)).not.toThrow();
    });
  });

  describe('storeCheckpoint', () => {
    beforeEach(() => {
      storage = new BrowserAgentStateStorage({});
    });

    it('should store checkpoint and return generated ID', async () => {
      const checkpoint: NamedAgentCheckpoint = {
        agentId: 'agent1',
        name: 'test-checkpoint',
        config: { model: 'gpt-4', temperature: 0.7 },
        state: { messages: [], context: {} },
        createdAt: 1234567890,
      };

      const id = await storage.storeCheckpoint(checkpoint);
      expect(id).toMatch(/-/);
      
      // Verify checkpoint was stored
      const storedCheckpoints = (storage as any)._getAllCheckpoints();
      expect(storedCheckpoints).toHaveLength(1);
      expect(storedCheckpoints[0]).toMatchObject({
        id,
        agentId: 'agent1',
        name: 'test-checkpoint',
        config: checkpoint.config,
        state: checkpoint.state,
        createdAt: 1234567890,
      });
    });

    it('should handle multiple checkpoints for same agent', async () => {
      const checkpoint1: NamedAgentCheckpoint = {
        agentId: 'agent1',
        name: 'checkpoint1',
        config: { model: 'gpt-4' },
        state: { messages: [] },
        createdAt: 1234567890,
      };

      const checkpoint2: NamedAgentCheckpoint = {
        agentId: 'agent1',
        name: 'checkpoint2',
        config: { model: 'gpt-3.5' },
        state: { messages: ['msg1'] },
        createdAt: 1234567891,
      };

      const id1 = await storage.storeCheckpoint(checkpoint1);
      const id2 = await storage.storeCheckpoint(checkpoint2);

      expect(id1).not.toBe(id2);
      const storedCheckpoints = (storage as any)._getAllCheckpoints();
      expect(storedCheckpoints).toHaveLength(2);
    });

    it('should use current time when createdAt not provided', async () => {
      const checkpoint: NamedAgentCheckpoint = {
        agentId: 'agent1',
        name: 'test-checkpoint',
        config: { model: 'gpt-4' },
        state: { messages: [] },
        // createdAt not provided
      };

      const id = await storage.storeCheckpoint(checkpoint);
      const storedCheckpoints = (storage as any)._getAllCheckpoints();
      
      expect(storedCheckpoints[0].createdAt).toBeGreaterThan(0);
      expect(id).toMatch(/-/);
    });
  });

  describe('retrieveCheckpoint', () => {
    beforeEach(() => {
      storage = new BrowserAgentStateStorage({});
    });

    it('should return null for non-existent checkpoint', async () => {
      const result = await storage.retrieveCheckpoint('non-existent-id');
      expect(result).toBeNull();
    });

    it('should retrieve stored checkpoint', async () => {
      const checkpoint: NamedAgentCheckpoint = {
        agentId: 'agent1',
        name: 'test-checkpoint',
        config: { model: 'gpt-4' },
        state: { messages: [] },
        createdAt: 1234567890,
      };

      const id = await storage.storeCheckpoint(checkpoint);
      const result = await storage.retrieveCheckpoint(id);

      expect(result).not.toBeNull();
      expect(result!.id).toBe(id);
      expect(result!.agentId).toBe('agent1');
      expect(result!.name).toBe('test-checkpoint');
      expect(result!.config).toEqual({ model: 'gpt-4' });
      expect(result!.state).toEqual({ messages: [] });
      expect(result!.createdAt).toBe(1234567890);
    });
  });

  describe('listCheckpoints', () => {
    beforeEach(() => {
      storage = new BrowserAgentStateStorage({});
    });

    it('should return empty array when no checkpoints stored', async () => {
      const result = await storage.listCheckpoints();
      expect(result).toEqual([]);
    });

    it('should list all checkpoints ordered by creation time (newest first)', async () => {
      const checkpoint1: NamedAgentCheckpoint = {
        agentId: 'agent1',
        name: 'checkpoint1',
        config: { model: 'gpt-4' },
        state: { messages: [] },
        createdAt: 1234567890,
      };

      const checkpoint2: NamedAgentCheckpoint = {
        agentId: 'agent2',
        name: 'checkpoint2',
        config: { model: 'gpt-3.5' },
        state: { messages: [] },
        createdAt: 1234567892,
      };

      const checkpoint3: NamedAgentCheckpoint = {
        agentId: 'agent3',
        name: 'checkpoint3',
        config: { model: 'gpt-4' },
        state: { messages: [] },
        createdAt: 1234567891,
      };

      await storage.storeCheckpoint(checkpoint1);
      await storage.storeCheckpoint(checkpoint2);
      await storage.storeCheckpoint(checkpoint3);

      const result = await storage.listCheckpoints();
      
      expect(result).toHaveLength(3);
      // Should be ordered by createdAt descending (newest first)
      expect(result[0].createdAt).toBe(1234567892);
      expect(result[1].createdAt).toBe(1234567891);
      expect(result[2].createdAt).toBe(1234567890);
      
      // Verify list items have correct structure
      expect(result[0]).toMatchObject({
        id: expect.stringMatching(/-/),
        name: 'checkpoint2',
        agentId: 'agent2',
        config: { model: 'gpt-3.5' },
        createdAt: 1234567892,
      });
    });
  });

  describe('deleteCheckpoint', () => {
    beforeEach(() => {
      storage = new BrowserAgentStateStorage({});
    });

    it('should return false for non-existent checkpoint', async () => {
      const result = await storage.deleteCheckpoint('non-existent-id');
      expect(result).toBe(false);
    });

    it('should delete existing checkpoint and return true', async () => {
      const checkpoint: NamedAgentCheckpoint = {
        agentId: 'agent1',
        name: 'test-checkpoint',
        config: { model: 'gpt-4' },
        state: { messages: [] },
        createdAt: 1234567890,
      };

      const id = await storage.storeCheckpoint(checkpoint);
      expect((storage as any)._getAllCheckpoints()).toHaveLength(1);

      const result = await storage.deleteCheckpoint(id);
      expect(result).toBe(true);
      expect((storage as any)._getAllCheckpoints()).toHaveLength(0);
    });

    it('should not affect other checkpoints when deleting one', async () => {
      const checkpoint1: NamedAgentCheckpoint = {
        agentId: 'agent1',
        name: 'checkpoint1',
        config: { model: 'gpt-4' },
        state: { messages: [] },
        createdAt: 1234567890,
      };

      const checkpoint2: NamedAgentCheckpoint = {
        agentId: 'agent2',
        name: 'checkpoint2',
        config: { model: 'gpt-3.5' },
        state: { messages: [] },
        createdAt: 1234567891,
      };

      const id1 = await storage.storeCheckpoint(checkpoint1);
      const id2 = await storage.storeCheckpoint(checkpoint2);

      await storage.deleteCheckpoint(id1);
      
      const remaining = (storage as any)._getAllCheckpoints();
      expect(remaining).toHaveLength(1);
      expect(remaining[0].id).toBe(id2);
    });
  });

  describe('clearAllCheckpoints', () => {
    beforeEach(() => {
      storage = new BrowserAgentStateStorage({});
    });

    it('should clear all checkpoints', async () => {
      const checkpoint1: NamedAgentCheckpoint = {
        agentId: 'agent1',
        name: 'checkpoint1',
        config: { model: 'gpt-4' },
        state: { messages: [] },
        createdAt: 1234567890,
      };

      const checkpoint2: NamedAgentCheckpoint = {
        agentId: 'agent2',
        name: 'checkpoint2',
        config: { model: 'gpt-3.5' },
        state: { messages: [] },
        createdAt: 1234567891,
      };

      await storage.storeCheckpoint(checkpoint1);
      await storage.storeCheckpoint(checkpoint2);
      expect((storage as any)._getAllCheckpoints()).toHaveLength(2);

      await storage.clearAllCheckpoints();
      expect((storage as any)._getAllCheckpoints()).toHaveLength(0);
    });
  });

  describe('close', () => {
    beforeEach(() => {
      storage = new BrowserAgentStateStorage({});
    });

    it('should be a no-op method', () => {
      expect(() => storage.close()).not.toThrow();
      // Verify no side effects after close
      expect(storage.name).toBe('BrowserAgentStateStorage');
      expect(storage.storageKeyPrefix).toBe('tokenRingAgentState_v1_');
    });
  });

  describe('Integration scenarios', () => {
    beforeEach(() => {
      storage = new BrowserAgentStateStorage({
        storageKeyPrefix: 'test_app_',
      });
    });

    it('should handle complete checkpoint lifecycle', async () => {
      // Store checkpoint
      const checkpoint: NamedAgentCheckpoint = {
        agentId: 'test-agent',
        name: 'integration-test',
        config: { model: 'gpt-4', temperature: 0.8 },
        state: { messages: ['Hello'], context: { user: 'test' } },
        createdAt: 1234567890,
      };

      const id = await storage.storeCheckpoint(checkpoint);

      // Retrieve checkpoint
      const retrieved = await storage.retrieveCheckpoint(id);
      expect(retrieved).not.toBeNull();
      expect(retrieved!.name).toBe('integration-test');
      expect(retrieved!.config).toEqual({ model: 'gpt-4', temperature: 0.8 });
      expect(retrieved!.state).toEqual({ messages: ['Hello'], context: { user: 'test' } });

      // List checkpoints
      const listed = await storage.listCheckpoints();
      expect(listed).toHaveLength(1);
      expect(listed[0]).toMatchObject({
        id,
        name: 'integration-test',
        agentId: 'test-agent',
        config: checkpoint.config,
        createdAt: 1234567890,
      });

      // Delete checkpoint
      const deleted = await storage.deleteCheckpoint(id);
      expect(deleted).toBe(true);

      // Verify deletion
      const retrievedAfterDelete = await storage.retrieveCheckpoint(id);
      expect(retrievedAfterDelete).toBeNull();
    });

    it('should isolate data with different prefixes', async () => {
      const storage1 = new BrowserAgentStateStorage({
        storageKeyPrefix: 'app1_',
      });
      const storage2 = new BrowserAgentStateStorage({
        storageKeyPrefix: 'app2_',
      });

      const checkpoint1: NamedAgentCheckpoint = {
        agentId: 'agent1',
        name: 'checkpoint1',
        config: { model: 'gpt-4' },
        state: { messages: [] },
        createdAt: 1234567890,
      };

      const checkpoint2: NamedAgentCheckpoint = {
        agentId: 'agent1',
        name: 'checkpoint2',
        config: { model: 'gpt-3.5' },
        state: { messages: [] },
        createdAt: 1234567891,
      };

      // Store in storage1
      const id1 = await storage1.storeCheckpoint(checkpoint1);
      
      // Store in storage2
      const id2 = await storage2.storeCheckpoint(checkpoint2);

      // Verify isolation
      expect(await storage1.listCheckpoints()).toHaveLength(1);
      expect(await storage2.listCheckpoints()).toHaveLength(1);
      
      expect(await storage1.retrieveCheckpoint(id1)).not.toBeNull();
      expect(await storage1.retrieveCheckpoint(id2)).toBeNull();
      
      expect(await storage2.retrieveCheckpoint(id2)).not.toBeNull();
      expect(await storage2.retrieveCheckpoint(id1)).toBeNull();
    });
  });

  describe('Error handling', () => {
    beforeEach(() => {
      storage = new BrowserAgentStateStorage({});
    });

    it('should handle localStorage quota exceeded', async () => {
      vi.mocked(localStorageMock.setItem).mockImplementation(() => {
        throw new Error('QuotaExceededError: The quota has been exceeded.');
      });

      const checkpoint: NamedAgentCheckpoint = {
        agentId: 'agent1',
        name: 'test-checkpoint',
        config: { model: 'gpt-4' },
        state: { messages: [] },
        createdAt: 1234567890,
      };

      // Should not throw error, but checkpoint won't be stored
      const id = await storage.storeCheckpoint(checkpoint);
      
      // Verify checkpoint wasn't stored due to error
      const storedCheckpoints = (storage as any)._getAllCheckpoints();
      expect(storedCheckpoints).toHaveLength(0);
    });

    it('should handle malformed JSON in localStorage', () => {
      vi.mocked(localStorageMock.getItem).mockReturnValue('invalid-json');
      
      const checkpoints = (storage as any)._getAllCheckpoints();
      expect(checkpoints).toEqual([]);
    });

    it('should handle localStorage unavailable', () => {
      // Mock localStorage unavailable
      globalThis.localStorage = undefined as any;
      
      expect(() => {
        storage = new BrowserAgentStateStorage({});
      }).not.toThrow();
    });
  });
});