import type { KeyValueStore } from './storage';

/** Every synced entity carries an id and a last-modified timestamp used
 * for last-write-wins conflict resolution. */
export interface Syncable {
  id: string;
  updatedAt: string;
}

/**
 * A named, per-user collection persisted as a single JSON document.
 * The local database is the source of truth: reads never wait on the
 * network, and writes succeed immediately (offline-first).
 */
export class Collection<T extends Syncable> {
  constructor(
    private readonly store: KeyValueStore,
    private readonly key: string,
  ) {}

  async list(): Promise<T[]> {
    return (await this.store.get<T[]>(this.key)) ?? [];
  }

  async get(id: string): Promise<T | undefined> {
    return (await this.list()).find((item) => item.id === id);
  }

  async upsert(item: T): Promise<void> {
    const items = await this.list();
    const index = items.findIndex((existing) => existing.id === item.id);
    if (index === -1) items.push(item);
    else items[index] = item;
    await this.store.set(this.key, items);
  }

  /** Merge a remote item only if it is newer than the local copy. */
  async mergeRemote(item: T): Promise<boolean> {
    const existing = await this.get(item.id);
    if (existing && existing.updatedAt >= item.updatedAt) return false;
    await this.upsert(item);
    return true;
  }

  async remove(id: string): Promise<void> {
    const items = (await this.list()).filter((item) => item.id !== id);
    await this.store.set(this.key, items);
  }

  async clear(): Promise<void> {
    await this.store.remove(this.key);
  }
}

export const collectionKey = (userId: string, name: string): string =>
  `apex/${userId}/${name}`;
