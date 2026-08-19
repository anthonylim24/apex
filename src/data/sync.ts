import { Collection, collectionKey, type Syncable } from './localdb';
import type { KeyValueStore } from './storage';

/**
 * Outbox-based offline sync.
 *
 * Every local mutation appends a change to a durable outbox. When the
 * device is online, `flush()` pushes changes oldest-first; failures stop
 * the flush and leave the remainder queued (nothing is lost). `pull()`
 * merges remote rows using last-write-wins on `updatedAt`, so two devices
 * converge without a coordination server.
 *
 * The remote is an interface: production uses Supabase, tests use an
 * in-memory (optionally flaky) implementation, and the app degrades to
 * local-only mode when no backend is configured.
 */

export type SyncEntity = 'profile' | 'session' | 'custom_exercise' | 'favorite';

export interface SyncChange {
  id: string;
  entity: SyncEntity;
  entityId: string;
  op: 'upsert' | 'delete';
  payload: unknown;
  changedAt: string;
}

export interface RemoteStore {
  push(userId: string, change: SyncChange): Promise<void>;
  /** Return rows of `entity` modified after `since` (ISO), oldest first. */
  pull(userId: string, entity: SyncEntity, since: string | undefined): Promise<Syncable[]>;
}

interface SyncMeta extends Syncable {
  lastPulledAt?: Partial<Record<SyncEntity, string>>;
}

export interface SyncResult {
  pushed: number;
  pulled: number;
  remaining: number;
  error?: string;
}

const ENTITIES: SyncEntity[] = ['profile', 'session', 'custom_exercise', 'favorite'];

export class SyncEngine {
  private readonly outbox: Collection<SyncChange & Syncable>;
  private readonly meta: Collection<SyncMeta>;
  private flushing = false;

  constructor(
    private readonly store: KeyValueStore,
    private readonly userId: string,
    private readonly remote: RemoteStore | undefined,
    private readonly mergeEntity: (entity: SyncEntity, row: Syncable) => Promise<boolean>,
  ) {
    this.outbox = new Collection(store, collectionKey(userId, 'outbox'));
    this.meta = new Collection(store, collectionKey(userId, 'sync-meta'));
  }

  /** Record a local mutation. Always succeeds — works fully offline. */
  async enqueue(change: Omit<SyncChange, 'id' | 'changedAt'>, now: Date = new Date()): Promise<void> {
    const changedAt = now.toISOString();
    await this.outbox.upsert({
      ...change,
      // One outbox row per entity: newer local edits supersede older
      // unsent ones, so we never push stale intermediate states.
      id: `${change.entity}:${change.entityId}`,
      changedAt,
      updatedAt: changedAt,
    });
  }

  async pendingCount(): Promise<number> {
    return (await this.outbox.list()).length;
  }

  /** Push queued changes, then pull remote updates. Never throws. */
  async sync(): Promise<SyncResult> {
    if (!this.remote) {
      return { pushed: 0, pulled: 0, remaining: await this.pendingCount() };
    }
    if (this.flushing) {
      return { pushed: 0, pulled: 0, remaining: await this.pendingCount(), error: 'sync already running' };
    }
    this.flushing = true;
    try {
      const pushResult = await this.push(this.remote);
      const pulled = pushResult.error ? 0 : await this.pull(this.remote);
      return { ...pushResult, pulled };
    } finally {
      this.flushing = false;
    }
  }

  private async push(remote: RemoteStore): Promise<Omit<SyncResult, 'pulled'>> {
    const queued = [...(await this.outbox.list())].sort((a, b) =>
      a.changedAt.localeCompare(b.changedAt),
    );
    let pushed = 0;
    for (const change of queued) {
      try {
        await remote.push(this.userId, change);
        await this.outbox.remove(change.id);
        pushed += 1;
      } catch (error) {
        return {
          pushed,
          remaining: queued.length - pushed,
          error: error instanceof Error ? error.message : 'push failed',
        };
      }
    }
    return { pushed, remaining: 0 };
  }

  private async pull(remote: RemoteStore): Promise<number> {
    const meta = (await this.meta.get('meta')) ?? {
      id: 'meta',
      updatedAt: new Date(0).toISOString(),
      lastPulledAt: {},
    };
    let merged = 0;
    for (const entity of ENTITIES) {
      try {
        const since = meta.lastPulledAt?.[entity];
        const rows = await remote.pull(this.userId, entity, since);
        for (const row of rows) {
          if (await this.mergeEntity(entity, row)) merged += 1;
          meta.lastPulledAt = { ...meta.lastPulledAt, [entity]: row.updatedAt };
        }
      } catch {
        // Pull failures are non-fatal: local data remains authoritative.
      }
    }
    meta.updatedAt = new Date().toISOString();
    await this.meta.upsert(meta);
    return merged;
  }
}

/** In-memory remote for tests and local development without a backend. */
export class InMemoryRemote implements RemoteStore {
  readonly rows = new Map<SyncEntity, Map<string, Syncable>>();
  /** When set, the next N pushes throw to simulate a dead network. */
  failNextPushes = 0;

  async push(_userId: string, change: SyncChange): Promise<void> {
    if (this.failNextPushes > 0) {
      this.failNextPushes -= 1;
      throw new Error('network unavailable');
    }
    const table = this.rows.get(change.entity) ?? new Map<string, Syncable>();
    if (change.op === 'delete') table.delete(change.entityId);
    else table.set(change.entityId, change.payload as Syncable);
    this.rows.set(change.entity, table);
  }

  async pull(_userId: string, entity: SyncEntity, since: string | undefined): Promise<Syncable[]> {
    const table = this.rows.get(entity);
    if (!table) return [];
    return [...table.values()]
      .filter((row) => !since || row.updatedAt > since)
      .sort((a, b) => a.updatedAt.localeCompare(b.updatedAt));
  }
}
