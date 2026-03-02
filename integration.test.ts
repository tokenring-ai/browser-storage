import type {NamedAgentCheckpoint, StoredAgentCheckpoint,} from '@tokenring-ai/checkpoint/AgentCheckpointProvider';
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import BrowserStorageService from './BrowserStorageService';

// Mock localStorage for integration tests
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

describe('BrowserAgentStateStorage Integration Tests', () => {
  let storage: BrowserStorageService;
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
  });

  afterEach(() => {
    // Restore original localStorage
    globalThis.localStorage = originalLocalStorage;
    
    // Clear all data
    mockStorageData = {};
    vi.clearAllMocks();
  });

  describe('Real-world usage scenarios', () => {
    beforeEach(() => {
      storage = new BrowserStorageService({});
    });

    it('should handle agent development workflow', async () => {
      // Simulate a typical development workflow with multiple checkpoints
      
      // 1. Initial development state
      const initialCheckpoint: NamedAgentCheckpoint = {
        agentId: 'dev-agent-001',
        name: 'initial-development',
        config: { 
          model: 'gpt-4',
          temperature: 0.7,
          maxTokens: 2048,
        },
        state: {
          messages: [],
          context: {
            project: 'todo-app',
            phase: 'initialization',
          },
        },
        createdAt: Date.now() - 3600000, // 1 hour ago
      };

      const initialId = await storage.storeCheckpoint(initialCheckpoint);
      expect(initialId).toMatch(/-/);

      // 2. Feature implementation checkpoint
      const featureCheckpoint: NamedAgentCheckpoint = {
        agentId: 'dev-agent-001',
        name: 'feature-implementation',
        config: { 
          model: 'gpt-4',
          temperature: 0.8,
          maxTokens: 4096,
        },
        state: {
          messages: [
            { role: 'user', content: 'Implement todo feature' },
            { role: 'assistant', content: 'Generated todo component' },
          ],
          context: {
            project: 'todo-app',
            phase: 'feature-development',
            features: ['create', 'read', 'update', 'delete'],
          },
        },
        createdAt: Date.now() - 1800000, // 30 minutes ago
      };

      const featureId = await storage.storeCheckpoint(featureCheckpoint);

      // 3. Testing phase checkpoint
      const testingCheckpoint: NamedAgentCheckpoint = {
        agentId: 'dev-agent-001',
        name: 'testing-phase',
        config: { 
          model: 'gpt-4',
          temperature: 0.3,
          maxTokens: 1024,
        },
        state: {
          messages: [
            { role: 'user', content: 'Run tests' },
            { role: 'assistant', content: 'All tests passed' },
          ],
          context: {
            project: 'todo-app',
            phase: 'testing',
            testResults: 'passed',
            coverage: 85,
          },
        },
        createdAt: Date.now() - 600000, // 10 minutes ago
      };

      const testingId = await storage.storeCheckpoint(testingCheckpoint);

      // Verify all checkpoints are stored
      const allCheckpoints = await storage.listCheckpoints();
      expect(allCheckpoints).toHaveLength(3);

      // Verify they are ordered by creation time (newest first)
      expect(allCheckpoints[0].createdAt).toBe(testingCheckpoint.createdAt);
      expect(allCheckpoints[1].createdAt).toBe(featureCheckpoint.createdAt);
      expect(allCheckpoints[2].createdAt).toBe(initialCheckpoint.createdAt);

      // Verify individual checkpoint retrieval
      const retrievedTesting = await storage.retrieveCheckpoint(testingId);
      expect(retrievedTesting).not.toBeNull();
      expect(retrievedTesting!.name).toBe('testing-phase');
      expect(retrievedTesting!.config.temperature).toBe(0.3);
      expect(retrievedTesting!.state.context.phase).toBe('testing');

      // Simulate removing outdated checkpoints
      const deleted = await storage.deleteCheckpoint(initialId);
      expect(deleted).toBe(true);

      const remainingCheckpoints = await storage.listCheckpoints();
      expect(remainingCheckpoints).toHaveLength(2);
    });

    it('should handle content creation workflow', async () => {
      // Simulate a content creation agent workflow
      
      const planningCheckpoint: NamedAgentCheckpoint = {
        agentId: 'content-agent-001',
        name: 'content-planning',
        config: { 
          model: 'gpt-4',
          temperature: 0.9,
          maxTokens: 2048,
        },
        state: {
          messages: [],
          context: {
            project: 'blog-series',
            topic: 'AI development',
            plannedArticles: 5,
          },
        },
        createdAt: Date.now() - 7200000, // 2 hours ago
      };

      const draftingCheckpoint: NamedAgentCheckpoint = {
        agentId: 'content-agent-001',
        name: 'drafting-article-1',
        config: { 
          model: 'gpt-4',
          temperature: 0.8,
          maxTokens: 4096,
        },
        state: {
          messages: [
            { role: 'user', content: 'Write introduction' },
            { role: 'assistant', content: 'Drafted introduction paragraph' },
          ],
          context: {
            project: 'blog-series',
            article: 'getting-started-with-ai',
            wordCount: 1200,
            status: 'draft',
          },
        },
        createdAt: Date.now() - 3600000, // 1 hour ago
      };

      const finalizingCheckpoint: NamedAgentCheckpoint = {
        agentId: 'content-agent-001',
        name: 'finalizing-article',
        config: { 
          model: 'gpt-4',
          temperature: 0.6,
          maxTokens: 2048,
        },
        state: {
          messages: [
            { role: 'user', content: 'Review and finalize' },
            { role: 'assistant', content: 'Finalized content ready for publication' },
          ],
          context: {
            project: 'blog-series',
            article: 'getting-started-with-ai',
            wordCount: 1850,
            status: 'final',
            reviewed: true,
          },
        },
        createdAt: Date.now() - 600000, // 10 minutes ago
      };

      const planningId = await storage.storeCheckpoint(planningCheckpoint);
      const draftingId = await storage.storeCheckpoint(draftingCheckpoint);
      const finalizingId = await storage.storeCheckpoint(finalizingCheckpoint);

      // Verify workflow progression
      const checkpoints = await storage.listCheckpoints();
      expect(checkpoints).toHaveLength(3);

      // Verify the progression through phases
      const retrievedFinal = await storage.retrieveCheckpoint(finalizingId);
      expect(retrievedFinal!.state.context.status).toBe('final');

      const retrievedDraft = await storage.retrieveCheckpoint(draftingId);
      expect(retrievedDraft!.state.context.status).toBe('draft');
    });

    it('should handle multiple agents with different prefixes', async () => {
      const devStorage = new BrowserStorageService({
        storageKeyPrefix: 'dev_agents_',
      });

      const contentStorage = new BrowserStorageService({
        storageKeyPrefix: 'content_agents_',
      });

      const devCheckpoint: NamedAgentCheckpoint = {
        agentId: 'dev-001',
        name: 'dev-checkpoint',
        config: { model: 'gpt-4' },
        state: { messages: [], context: { project: 'api' } },
        createdAt: Date.now() - 1800000,
      };

      const contentCheckpoint: NamedAgentCheckpoint = {
        agentId: 'content-001',
        name: 'content-checkpoint',
        config: { model: 'gpt-4' },
        state: { messages: [], context: { project: 'blog' } },
        createdAt: Date.now() - 900000,
      };

      const devId = await devStorage.storeCheckpoint(devCheckpoint);
      const contentId = await contentStorage.storeCheckpoint(contentCheckpoint);

      // Verify isolation
      const devCheckpoints = await devStorage.listCheckpoints();
      const contentCheckpoints = await contentStorage.listCheckpoints();

      expect(devCheckpoints).toHaveLength(1);
      expect(contentCheckpoints).toHaveLength(1);
      expect(devCheckpoints[0].id).toBe(devId);
      expect(contentCheckpoints[0].id).toBe(contentId);

      // Verify cross-storage retrieval returns null
      const devInContent = await contentStorage.retrieveCheckpoint(devId);
      const contentInDev = await devStorage.retrieveCheckpoint(contentId);

      expect(devInContent).toBeNull();
      expect(contentInDev).toBeNull();
    });

    it('should handle large data storage', async () => {
      // Simulate storing large checkpoint data
      const largeCheckpoint: NamedAgentCheckpoint = {
        agentId: 'large-data-agent',
        name: 'large-data-checkpoint',
        config: { 
          model: 'gpt-4',
          temperature: 0.7,
          maxTokens: 8192,
        },
        state: {
          messages: Array(100).fill(0).map((_, i) => ({
            role: i % 2 === 0 ? 'user' : 'assistant',
            content: `Message ${i}: ${'x'.repeat(100)}`, // 100 chars per message
          })),
          context: {
            largeData: Array(1000).fill(0).map((_, i) => ({
              id: i,
              data: 'x'.repeat(200),
              metadata: { timestamp: Date.now() + i },
            })),
            nested: {
              level1: {
                level2: {
                  level3: {
                    value: 'deeply nested data',
                  },
                },
              },
            },
          },
        },
        createdAt: Date.now(),
      };

      const id = await storage.storeCheckpoint(largeCheckpoint);
      expect(id).toMatch(/-/);

      const retrieved = await storage.retrieveCheckpoint(id);
      expect(retrieved).not.toBeNull();
      expect(retrieved!.state.messages).toHaveLength(100);
      expect(retrieved!.state.context.largeData).toHaveLength(1000);
      expect(retrieved!.state.context.nested.level1.level2.level3.value).toBe('deeply nested data');
    });

    it('should handle storage quota scenarios', async () => {
      // Simulate quota exceeded scenarios by mocking setItem to throw
      localStorageMock.setItem.mockImplementation(() => {
        throw new Error('QuotaExceededError: The quota has been exceeded.');
      });

      const checkpoint: NamedAgentCheckpoint = {
        agentId: 'quota-test-agent',
        name: 'quota-test-checkpoint',
        config: { model: 'gpt-4' },
        state: { messages: [] },
        createdAt: Date.now(),
      };

      // Should handle quota exceeded gracefully
      const id = await storage.storeCheckpoint(checkpoint);
      
      // Verify checkpoint wasn't stored due to quota error
      const checkpoints = await storage.listCheckpoints();
      expect(checkpoints).toHaveLength(0);
    });

    it('should handle data corruption recovery', async () => {
      // Simulate corrupted data in localStorage
      mockStorageData['tokenRingAgentState_v1_checkpoints'] = 'corrupted-json-data';

      const checkpoints = await storage.listCheckpoints();
      expect(checkpoints).toEqual([]);

      const checkpoint: NamedAgentCheckpoint = {
        agentId: 'recovery-test-agent',
        name: 'recovery-test-checkpoint',
        config: { model: 'gpt-4' },
        state: { messages: [] },
        createdAt: Date.now(),
      };

      const id = await storage.storeCheckpoint(checkpoint);
      expect(id).toMatch(/-/);

      const retrieved = await storage.retrieveCheckpoint(id);
      expect(retrieved).not.toBeNull();
      expect(retrieved!.name).toBe('recovery-test-checkpoint');
    });

    it('should maintain data consistency across operations', async () => {
      const checkpoint: NamedAgentCheckpoint = {
        agentId: 'consistency-test-agent',
        name: 'consistency-test-checkpoint',
        config: { model: 'gpt-4', temperature: 0.8 },
        state: { messages: ['msg1', 'msg2'], context: { key: 'value' } },
        createdAt: 1234567890,
      };

      // Store checkpoint
      const id = await storage.storeCheckpoint(checkpoint);
      
      // Retrieve and verify
      const retrieved = await storage.retrieveCheckpoint(id);
      expect(retrieved).not.toBeNull();
      
      // Update data and verify consistency
      const updatedCheckpoint: StoredAgentCheckpoint = {
        ...retrieved!,
        state: { messages: ['msg1', 'msg2', 'msg3'], context: { key: 'updated-value' } },
      };

      // Store updated version
      const updateId = await storage.storeCheckpoint({
        agentId: updatedCheckpoint.agentId,
        name: updatedCheckpoint.name,
        config: updatedCheckpoint.config,
        state: updatedCheckpoint.state,
        createdAt: updatedCheckpoint.createdAt,
      });

      // Verify both versions exist
      const original = await storage.retrieveCheckpoint(id);
      const updated = await storage.retrieveCheckpoint(updateId);

      expect(original).not.toBeNull();
      expect(updated).not.toBeNull();
      expect(original!.id).toBe(id);
      expect(updated!.id).toBe(updateId);
      expect(original!.state.messages).toHaveLength(2);
      expect(updated!.state.messages).toHaveLength(3);
    });
  });

  describe('Performance scenarios', () => {
    it('should handle rapid checkpoint creation', async () => {
      storage = new BrowserStorageService({});

      const startTime = Date.now();
      const checkpointIds: string[] = [];

      // Create 50 checkpoints rapidly
      for (let i = 0; i < 50; i++) {
        const checkpoint: NamedAgentCheckpoint = {
          agentId: 'perf-test-agent',
          name: `rapid-checkpoint-${i}`,
          config: { model: 'gpt-4' },
          state: { messages: [`message-${i}`], iteration: i },
          createdAt: startTime + i,
        };

        const id = await storage.storeCheckpoint(checkpoint);
        checkpointIds.push(id);
      }

      // Verify all checkpoints were created
      const allCheckpoints = await storage.listCheckpoints();
      expect(allCheckpoints).toHaveLength(50);

      // Verify they are ordered correctly (newest first)
      expect(allCheckpoints[0].createdAt).toBe(startTime + 49);
      expect(allCheckpoints[49].createdAt).toBe(startTime);

      // Verify we can retrieve random checkpoints
      const randomId = checkpointIds[25];
      const randomCheckpoint = await storage.retrieveCheckpoint(randomId);
      expect(randomCheckpoint).not.toBeNull();
      expect(randomCheckpoint!.name).toBe('rapid-checkpoint-25');
    });

    it('should handle batch operations efficiently', async () => {
      storage = new BrowserStorageService({
        storageKeyPrefix: 'batch_test_',
      });

      // Create checkpoints for different agents
      const agentIds = ['agent-1', 'agent-2', 'agent-3'];
      const checkpointData = [];

      for (const agentId of agentIds) {
        for (let i = 0; i < 10; i++) {
          checkpointData.push({
            agentId,
            name: `checkpoint-${i}`,
            config: { model: 'gpt-4', version: i },
            state: { messages: [], iteration: i },
            createdAt: Date.now() + i,
          });
        }
      }

      // Store all checkpoints
      const ids: string[] = [];
      for (const checkpoint of checkpointData) {
        const id = await storage.storeCheckpoint(checkpoint);
        ids.push(id);
      }

      expect(ids).toHaveLength(30);

      // Verify batch retrieval
      const allCheckpoints = await storage.listCheckpoints();
      expect(allCheckpoints).toHaveLength(30);

      // Verify agent-specific filtering by manual inspection
      const agent1Checkpoints = allCheckpoints.filter(cp => cp.agentId === 'agent-1');
      const agent2Checkpoints = allCheckpoints.filter(cp => cp.agentId === 'agent-2');
      const agent3Checkpoints = allCheckpoints.filter(cp => cp.agentId === 'agent-3');

      expect(agent1Checkpoints).toHaveLength(10);
      expect(agent2Checkpoints).toHaveLength(10);
      expect(agent3Checkpoints).toHaveLength(10);
    });
  });
});