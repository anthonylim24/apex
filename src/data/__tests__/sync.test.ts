import { makeSession, makeSet } from '../../domain/__tests__/factories';
import type { WorkoutSession } from '../../domain/types';
import { Repository } from '../repository';
import { createMemoryStore } from '../storage';
import { InMemoryRemote } from '../sync';

const sessionAt = (id: string, iso: string): WorkoutSession =>
  makeSession({ id, startedAt: iso, updatedAt: iso, createdAt: iso });

describe('offline-first repository', () => {
  it('persists writes locally with no remote configured (pure offline mode)', async () => {
    const repo = new Repository(createMemoryStore(), 'user-1');
    await repo.saveSession(sessionAt('s1', '2026-08-10T10:00:00.000Z'));
    expect(await repo.listSessions()).toHaveLength(1);
    const result = await repo.sync();
    expect(result).toMatchObject({ pushed: 0, pulled: 0, remaining: 1 });
    // Data is still there — sync is never required for reads.
    expect((await repo.getSession('s1'))?.id).toBe('s1');
  });

  it('queues every mutation and flushes when the network returns', async () => {
    const remote = new InMemoryRemote();
    const repo = new Repository(createMemoryStore(), 'user-1', remote);

    remote.failNextPushes = 99; // dead network
    await repo.saveSession(sessionAt('s1', '2026-08-10T10:00:00.000Z'));
    await repo.toggleFavorite('bench');
    const offline = await repo.sync();
    expect(offline.pushed).toBe(0);
    expect(offline.error).toBe('network unavailable');
    expect(await repo.pendingChanges()).toBe(2);

    remote.failNextPushes = 0; // network back
    const online = await repo.sync();
    expect(online.pushed).toBe(2);
    expect(online.remaining).toBe(0);
    expect(remote.rows.get('session')?.has('s1')).toBe(true);
  });

  it('coalesces repeated edits of the same entity into one outbox row', async () => {
    const repo = new Repository(createMemoryStore(), 'user-1', new InMemoryRemote());
    const session = sessionAt('s1', '2026-08-10T10:00:00.000Z');
    await repo.saveSession(session);
    await repo.saveSession({ ...session, name: 'Renamed' });
    await repo.saveSession({ ...session, name: 'Renamed again' });
    expect(await repo.pendingChanges()).toBe(1);
    await repo.sync();
    const pushed = repo && (await repo.listSessions());
    expect(pushed[0].name).toBe('Renamed again');
  });

  it('survives a mid-flush failure without losing queued changes', async () => {
    const remote = new InMemoryRemote();
    const repo = new Repository(createMemoryStore(), 'user-1', remote);
    await repo.saveSession(sessionAt('s1', '2026-08-10T10:00:00.000Z'));
    await repo.saveSession(sessionAt('s2', '2026-08-11T10:00:00.000Z'));
    await repo.saveSession(sessionAt('s3', '2026-08-12T10:00:00.000Z'));

    remote.failNextPushes = 0;
    // First push succeeds, second dies mid-flight.
    let calls = 0;
    const originalPush = remote.push.bind(remote);
    remote.push = async (userId, change) => {
      calls += 1;
      if (calls === 2) throw new Error('connection reset');
      return originalPush(userId, change);
    };

    const result = await repo.sync();
    expect(result.pushed).toBe(1);
    expect(result.remaining).toBe(2);
    expect(await repo.pendingChanges()).toBe(2);

    remote.push = originalPush;
    const retry = await repo.sync();
    expect(retry.pushed).toBe(2);
    expect(await repo.pendingChanges()).toBe(0);
  });

  it('pulls remote changes and converges two devices (last write wins)', async () => {
    const remote = new InMemoryRemote();
    const phone = new Repository(createMemoryStore(), 'user-1', remote);
    const tablet = new Repository(createMemoryStore(), 'user-1', remote);

    await phone.saveSession(sessionAt('s1', '2026-08-10T10:00:00.000Z'));
    await phone.sync();

    await tablet.sync();
    expect((await tablet.getSession('s1'))?.id).toBe('s1');

    // Tablet edits the shared session later; phone edited it earlier.
    const base = (await tablet.getSession('s1'))!;
    await new Promise((r) => setTimeout(r, 5));
    await tablet.saveSession({ ...base, name: 'Tablet edit' });
    await tablet.sync();
    await phone.sync();
    expect((await phone.getSession('s1'))?.name).toBe('Tablet edit');
  });

  it('does not clobber newer local edits with older remote rows', async () => {
    const remote = new InMemoryRemote();
    const repo = new Repository(createMemoryStore(), 'user-1', remote);
    // Remote holds an old copy.
    remote.rows.set(
      'session',
      new Map([
        ['s1', { ...sessionAt('s1', '2026-08-01T10:00:00.000Z'), name: 'Old remote' }],
      ]),
    );
    // Local has a newer edit queued.
    await repo.saveSession({ ...sessionAt('s1', '2026-08-10T10:00:00.000Z'), name: 'New local' });
    await repo.sync();
    expect((await repo.getSession('s1'))?.name).toBe('New local');
  });

  it('incremental pulls only fetch rows newer than the checkpoint', async () => {
    const remote = new InMemoryRemote();
    const repo = new Repository(createMemoryStore(), 'user-1', remote);
    remote.rows.set(
      'session',
      new Map([['s1', sessionAt('s1', '2026-08-10T10:00:00.000Z')]]),
    );
    const first = await repo.sync();
    expect(first.pulled).toBe(1);
    const second = await repo.sync();
    expect(second.pulled).toBe(0);
  });

  it('round-trips a full workout with logged sets', async () => {
    const remote = new InMemoryRemote();
    const phone = new Repository(createMemoryStore(), 'user-1', remote);
    const session = makeSession({
      id: 'full',
      exercises: [
        {
          id: 'se1',
          exerciseId: 'bench',
          order: 0,
          targetSets: 3,
          targetRepsMin: 6,
          targetRepsMax: 8,
          restSeconds: 120,
          sets: [makeSet({ weightKg: 80, reps: 8, rpe: 7.5 })],
        },
      ],
    });
    await phone.saveSession(session);
    await phone.sync();

    const laptop = new Repository(createMemoryStore(), 'user-1', remote);
    await laptop.sync();
    const pulled = await laptop.getSession('full');
    expect(pulled?.exercises[0].sets[0]).toMatchObject({ weightKg: 80, reps: 8, rpe: 7.5 });
  });
});

describe('profile and favorites', () => {
  it('saves and re-reads the profile locally', async () => {
    const repo = new Repository(createMemoryStore(), 'user-1');
    await repo.saveProfile({
      userId: 'user-1',
      goal: 'hypertrophy',
      experience: 'intermediate',
      equipment: ['barbell'],
      limitations: '',
      avoidMuscles: [],
      unit: 'kg',
      preferredSessionMinutes: 60,
      bodyweightHistory: [{ date: '2026-08-10', weightKg: 82 }],
      createdAt: '2026-08-10T10:00:00.000Z',
      updatedAt: '2026-08-10T10:00:00.000Z',
    });
    const profile = await repo.getProfile();
    expect(profile?.goal).toBe('hypertrophy');
    expect(profile?.bodyweightHistory).toHaveLength(1);
  });

  it('toggles favorites with tombstones that sync cleanly', async () => {
    const remote = new InMemoryRemote();
    const repo = new Repository(createMemoryStore(), 'user-1', remote);
    expect(await repo.toggleFavorite('bench')).toBe(true);
    expect(await repo.listFavoriteIds()).toEqual(['bench']);
    expect(await repo.toggleFavorite('bench')).toBe(false);
    expect(await repo.listFavoriteIds()).toEqual([]);
    await repo.sync();

    const other = new Repository(createMemoryStore(), 'user-1', remote);
    await other.sync();
    expect(await other.listFavoriteIds()).toEqual([]);
  });

  it('stores custom exercises owned by the user', async () => {
    const repo = new Repository(createMemoryStore(), 'user-1');
    await repo.saveCustomExercise({
      id: 'custom-1',
      name: 'Landmine Press',
      description: 'Angled press',
      instructions: ['Wedge bar', 'Press'],
      primaryMuscles: ['shoulders'],
      secondaryMuscles: ['chest'],
      equipment: ['barbell'],
      difficulty: 'beginner',
      movementPattern: 'vertical_push',
      isCustom: true,
    });
    const list = await repo.listCustomExercises();
    expect(list).toHaveLength(1);
    expect(list[0].createdBy).toBe('user-1');
  });
});
