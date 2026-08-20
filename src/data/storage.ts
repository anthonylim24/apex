import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Minimal async JSON key-value abstraction. AsyncStorage is the durable
 * on-device store that makes every core logging path work fully offline;
 * the interface is injectable so tests and the sync engine can swap in
 * an in-memory implementation.
 */
export interface KeyValueStore {
  get<T>(key: string): Promise<T | undefined>;
  set<T>(key: string, value: T): Promise<void>;
  remove(key: string): Promise<void>;
}

export const asyncKeyValueStore: KeyValueStore = {
  async get<T>(key: string): Promise<T | undefined> {
    const raw = await AsyncStorage.getItem(key);
    if (raw === null) return undefined;
    return JSON.parse(raw) as T;
  },
  async set<T>(key: string, value: T): Promise<void> {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  },
  async remove(key: string): Promise<void> {
    await AsyncStorage.removeItem(key);
  },
};

export const createMemoryStore = (): KeyValueStore => {
  const map = new Map<string, string>();
  return {
    async get<T>(key: string): Promise<T | undefined> {
      const raw = map.get(key);
      return raw === undefined ? undefined : (JSON.parse(raw) as T);
    },
    async set<T>(key: string, value: T): Promise<void> {
      map.set(key, JSON.stringify(value));
    },
    async remove(key: string): Promise<void> {
      map.delete(key);
    },
  };
};
