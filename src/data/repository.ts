import type { Exercise, Profile, WorkoutSession } from '../domain/types';
import { Collection, collectionKey, type Syncable } from './localdb';
import type { KeyValueStore } from './storage';
import { SyncEngine, type RemoteStore, type SyncEntity, type SyncResult } from './sync';

interface FavoriteRow extends Syncable {
  exerciseId: string;
  deleted: boolean;
}

type ProfileRow = Profile & Syncable & { id: string };

/**
 * The single data API the UI talks to. Every write lands in local storage
 * first (instant, offline-safe) and is queued for background sync.
 */
export class Repository {
  private readonly profiles: Collection<ProfileRow>;
  private readonly sessions: Collection<WorkoutSession & Syncable>;
  private readonly customExercises: Collection<Exercise & Syncable>;
  private readonly favorites: Collection<FavoriteRow>;
  readonly syncEngine: SyncEngine;

  constructor(
    store: KeyValueStore,
    readonly userId: string,
    remote?: RemoteStore,
    private readonly now: () => Date = () => new Date(),
  ) {
    this.profiles = new Collection(store, collectionKey(userId, 'profile'));
    this.sessions = new Collection(store, collectionKey(userId, 'sessions'));
    this.customExercises = new Collection(store, collectionKey(userId, 'custom-exercises'));
    this.favorites = new Collection(store, collectionKey(userId, 'favorites'));
    this.syncEngine = new SyncEngine(store, userId, remote, (entity, row) =>
      this.mergeRemote(entity, row),
    );
  }

  // --- Profile ---

  async getProfile(): Promise<Profile | undefined> {
    return this.profiles.get(this.userId);
  }

  async saveProfile(profile: Profile): Promise<Profile> {
    const row: ProfileRow = { ...profile, id: this.userId, updatedAt: this.now().toISOString() };
    await this.profiles.upsert(row);
    await this.syncEngine.enqueue(
      { entity: 'profile', entityId: this.userId, op: 'upsert', payload: row },
      this.now(),
    );
    return row;
  }

  // --- Sessions ---

  async listSessions(): Promise<WorkoutSession[]> {
    const rows = await this.sessions.list();
    return rows.sort((a, b) => b.startedAt.localeCompare(a.startedAt));
  }

  async getSession(id: string): Promise<WorkoutSession | undefined> {
    return this.sessions.get(id);
  }

  async saveSession(session: WorkoutSession): Promise<WorkoutSession> {
    const row = { ...session, updatedAt: this.now().toISOString() };
    await this.sessions.upsert(row);
    await this.syncEngine.enqueue(
      { entity: 'session', entityId: session.id, op: 'upsert', payload: row },
      this.now(),
    );
    return row;
  }

  async deleteSession(id: string): Promise<void> {
    await this.sessions.remove(id);
    await this.syncEngine.enqueue(
      { entity: 'session', entityId: id, op: 'delete', payload: undefined },
      this.now(),
    );
  }

  // --- Custom exercises ---

  async listCustomExercises(): Promise<Exercise[]> {
    return this.customExercises.list();
  }

  async saveCustomExercise(exercise: Exercise): Promise<Exercise> {
    const row = { ...exercise, isCustom: true, createdBy: this.userId, updatedAt: this.now().toISOString() };
    await this.customExercises.upsert(row);
    await this.syncEngine.enqueue(
      { entity: 'custom_exercise', entityId: exercise.id, op: 'upsert', payload: row },
      this.now(),
    );
    return row;
  }

  // --- Favorites ---

  async listFavoriteIds(): Promise<string[]> {
    const rows = await this.favorites.list();
    return rows.filter((r) => !r.deleted).map((r) => r.exerciseId);
  }

  async toggleFavorite(exerciseId: string): Promise<boolean> {
    const existing = await this.favorites.get(exerciseId);
    const nowIso = this.now().toISOString();
    const row: FavoriteRow = {
      id: exerciseId,
      exerciseId,
      deleted: existing ? !existing.deleted : false,
      updatedAt: nowIso,
    };
    await this.favorites.upsert(row);
    await this.syncEngine.enqueue(
      { entity: 'favorite', entityId: exerciseId, op: 'upsert', payload: row },
      this.now(),
    );
    return !row.deleted;
  }

  // --- Sync ---

  async sync(): Promise<SyncResult> {
    return this.syncEngine.sync();
  }

  async pendingChanges(): Promise<number> {
    return this.syncEngine.pendingCount();
  }

  private async mergeRemote(entity: SyncEntity, row: Syncable): Promise<boolean> {
    switch (entity) {
      case 'profile':
        return this.profiles.mergeRemote(row as ProfileRow);
      case 'session':
        return this.sessions.mergeRemote(row as WorkoutSession & Syncable);
      case 'custom_exercise':
        return this.customExercises.mergeRemote(row as Exercise & Syncable);
      case 'favorite':
        return this.favorites.mergeRemote(row as FavoriteRow);
    }
  }
}
