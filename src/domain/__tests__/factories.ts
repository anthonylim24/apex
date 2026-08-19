import type { Exercise, SetLog, WorkoutSession } from '../types';

let idCounter = 0;
const nextId = (): string => `test-${(idCounter += 1)}`;

export const makeSet = (overrides: Partial<SetLog> = {}): SetLog => ({
  id: nextId(),
  setNumber: 1,
  weightKg: 80,
  reps: 8,
  isWarmup: false,
  isFailure: false,
  isDropSet: false,
  autoDetected: false,
  completedAt: '2026-08-10T10:00:00.000Z',
  ...overrides,
});

export const makeExercise = (overrides: Partial<Exercise> = {}): Exercise => ({
  id: nextId(),
  name: 'Barbell Bench Press',
  description: 'Horizontal press',
  instructions: ['Set up', 'Press'],
  primaryMuscles: ['chest'],
  secondaryMuscles: ['triceps', 'shoulders'],
  equipment: ['barbell', 'bench'],
  difficulty: 'beginner',
  movementPattern: 'horizontal_push',
  isCustom: false,
  ...overrides,
});

export const makeSession = (overrides: Partial<WorkoutSession> = {}): WorkoutSession => ({
  id: nextId(),
  userId: 'user-1',
  name: 'Test session',
  status: 'completed',
  startedAt: '2026-08-10T10:00:00.000Z',
  completedAt: '2026-08-10T10:45:00.000Z',
  exercises: [],
  createdAt: '2026-08-10T10:00:00.000Z',
  updatedAt: '2026-08-10T10:45:00.000Z',
  ...overrides,
});
