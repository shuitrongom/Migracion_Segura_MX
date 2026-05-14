import AsyncStorage from '@react-native-async-storage/async-storage';

const QUEUE_KEY = 'msm_sync_queue';

interface QueuedAction {
  id: string;
  type: string;
  endpoint: string;
  method: 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  createdAt: string;
}

interface ApiClient {
  request: (config: { method: string; url: string; data?: unknown }) => Promise<unknown>;
}

export const syncQueue = {
  async add(action: Omit<QueuedAction, 'id' | 'createdAt'>): Promise<void> {
    const queue = await this.getAll();
    queue.push({
      ...action,
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
      createdAt: new Date().toISOString(),
    });
    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  },

  async getAll(): Promise<QueuedAction[]> {
    const raw = await AsyncStorage.getItem(QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  },

  async remove(id: string): Promise<void> {
    const queue = await this.getAll();
    const filtered = queue.filter((a) => a.id !== id);
    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(filtered));
  },

  async clear(): Promise<void> {
    await AsyncStorage.removeItem(QUEUE_KEY);
  },

  async processQueue(apiClient: ApiClient): Promise<{ processed: number; failed: number }> {
    const queue = await this.getAll();
    let processed = 0;
    let failed = 0;

    for (const action of queue) {
      try {
        await apiClient.request({
          method: action.method,
          url: action.endpoint,
          data: action.body,
        });
        await this.remove(action.id);
        processed++;
      } catch {
        failed++;
      }
    }

    return { processed, failed };
  },
};
