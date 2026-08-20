import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Syncable } from './localdb';
import type { RemoteStore, SyncChange, SyncEntity } from './sync';

/**
 * Supabase remote for the sync engine.
 *
 * Auth: Clerk is the identity provider. The Supabase client is created
 * with an `accessToken` callback that returns the Clerk session JWT, so
 * every PostgREST request carries it and RLS policies key off
 * `auth.jwt() ->> 'sub'` (the Clerk user id). See supabase/migrations.
 *
 * Sync protocol: the client syncs document-shaped payloads; Postgres
 * functions/views (`upsert_workout_session`, `workout_session_documents`)
 * unpack them into the normalized `workout_sessions` / `workout_exercises`
 * / `sets` tables so SQL analytics and future surfaces stay relational.
 */

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  getClerkToken: () => Promise<string | null>;
}

export const readSupabaseEnv = (): { url: string; anonKey: string } | undefined => {
  const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return undefined;
  return { url, anonKey };
};

export const createSupabaseClient = (config: SupabaseConfig): SupabaseClient =>
  createClient(config.url, config.anonKey, {
    accessToken: config.getClerkToken,
    auth: { persistSession: false },
  });

const TABLE_BY_ENTITY: Record<SyncEntity, string> = {
  profile: 'profiles',
  session: 'workout_sessions',
  custom_exercise: 'exercises',
  favorite: 'favorites',
};

export class SupabaseRemote implements RemoteStore {
  constructor(private readonly client: SupabaseClient) {}

  async push(userId: string, change: SyncChange): Promise<void> {
    if (change.entity === 'session') {
      if (change.op === 'delete') {
        const { error } = await this.client
          .from('workout_sessions')
          .delete()
          .eq('id', change.entityId);
        if (error) throw new Error(error.message);
        return;
      }
      const { error } = await this.client.rpc('upsert_workout_session', {
        session_document: change.payload,
      });
      if (error) throw new Error(error.message);
      return;
    }

    const table = TABLE_BY_ENTITY[change.entity];
    if (change.op === 'delete') {
      const { error } = await this.client.from(table).delete().eq('id', change.entityId);
      if (error) throw new Error(error.message);
      return;
    }
    const { error } = await this.client
      .from(table)
      .upsert({ ...toRow(change.entity, change.payload), user_id: userId });
    if (error) throw new Error(error.message);
  }

  async pull(userId: string, entity: SyncEntity, since: string | undefined): Promise<Syncable[]> {
    const source = entity === 'session' ? 'workout_session_documents' : TABLE_BY_ENTITY[entity];
    let query = this.client
      .from(source)
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: true })
      .limit(500);
    if (since) query = query.gt('updated_at', since);
    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return (data ?? []).map((row) => fromRow(entity, row as Record<string, unknown>));
  }
}

/** Map a camelCase sync payload onto the snake_case Postgres row. */
const toRow = (entity: SyncEntity, payload: unknown): Record<string, unknown> => {
  const doc = payload as Record<string, unknown>;
  switch (entity) {
    case 'profile':
      return {
        id: doc.id,
        display_name: doc.displayName ?? null,
        goal: doc.goal,
        experience: doc.experience,
        equipment: doc.equipment,
        limitations: doc.limitations,
        avoid_muscles: doc.avoidMuscles,
        unit: doc.unit,
        preferred_session_minutes: doc.preferredSessionMinutes,
        bodyweight_history: doc.bodyweightHistory,
        onboarding_completed_at: doc.onboardingCompletedAt ?? null,
        updated_at: doc.updatedAt,
      };
    case 'custom_exercise':
      return {
        id: doc.id,
        name: doc.name,
        description: doc.description,
        instructions: doc.instructions,
        primary_muscles: doc.primaryMuscles,
        secondary_muscles: doc.secondaryMuscles,
        equipment: doc.equipment,
        difficulty: doc.difficulty,
        movement_pattern: doc.movementPattern,
        animation_url: doc.animationUrl ?? null,
        video_url: doc.videoUrl ?? null,
        is_custom: true,
        updated_at: doc.updatedAt,
      };
    case 'favorite':
      return {
        id: doc.id,
        exercise_id: doc.exerciseId,
        deleted: doc.deleted,
        updated_at: doc.updatedAt,
      };
    case 'session':
      return doc; // handled via RPC, never reaches here
  }
};

const fromRow = (entity: SyncEntity, row: Record<string, unknown>): Syncable => {
  switch (entity) {
    case 'session':
      // The view returns the reassembled camelCase document.
      return row.document as Syncable;
    case 'profile':
      return {
        userId: row.id,
        id: row.id,
        displayName: row.display_name ?? undefined,
        goal: row.goal,
        experience: row.experience,
        equipment: row.equipment,
        limitations: row.limitations,
        avoidMuscles: row.avoid_muscles,
        unit: row.unit,
        preferredSessionMinutes: row.preferred_session_minutes,
        bodyweightHistory: row.bodyweight_history,
        onboardingCompletedAt: row.onboarding_completed_at ?? undefined,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      } as unknown as Syncable;
    case 'custom_exercise':
      return {
        id: row.id,
        name: row.name,
        description: row.description,
        instructions: row.instructions,
        primaryMuscles: row.primary_muscles,
        secondaryMuscles: row.secondary_muscles,
        equipment: row.equipment,
        difficulty: row.difficulty,
        movementPattern: row.movement_pattern,
        animationUrl: row.animation_url ?? undefined,
        videoUrl: row.video_url ?? undefined,
        isCustom: true,
        createdBy: row.user_id,
        updatedAt: row.updated_at,
      } as unknown as Syncable;
    case 'favorite':
      return {
        id: row.id,
        exerciseId: row.exercise_id,
        deleted: row.deleted,
        updatedAt: row.updated_at,
      } as unknown as Syncable;
  }
};
