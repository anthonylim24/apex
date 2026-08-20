import { render, screen } from '@testing-library/react-native';
import React from 'react';
import type { MovementPattern } from '../../../domain/types';
import { CHOREOGRAPHIES, poseAt } from '../exerciseAnimation/choreography';
import { ExerciseAnimation, heldEquipmentFor } from '../exerciseAnimation';

const PATTERNS = Object.keys(CHOREOGRAPHIES) as MovementPattern[];

describe('choreography data', () => {
  it('defines a loop for every movement pattern', () => {
    expect(PATTERNS).toHaveLength(10);
    for (const pattern of PATTERNS) {
      const { frames } = CHOREOGRAPHIES[pattern];
      expect(frames.length).toBeGreaterThanOrEqual(2);
      expect(frames[0].at).toBe(0);
      // Frames are ordered and inside the loop.
      for (let i = 1; i < frames.length; i += 1) {
        expect(frames[i].at).toBeGreaterThan(frames[i - 1].at);
        expect(frames[i].at).toBeLessThan(1);
      }
    }
  });

  it('keeps every joint on the 200x200 stage above the ground line', () => {
    for (const pattern of PATTERNS) {
      for (const t of [0, 0.2, 0.45, 0.7, 0.95]) {
        const pose = poseAt(CHOREOGRAPHIES[pattern], t);
        for (const pt of [
          pose.head, pose.shoulder, pose.hip, pose.elbow, pose.wrist,
          pose.kneeNear, pose.ankleNear, pose.kneeFar, pose.ankleFar,
        ]) {
          expect(pt[0]).toBeGreaterThanOrEqual(0);
          expect(pt[0]).toBeLessThanOrEqual(200);
          expect(pt[1]).toBeGreaterThanOrEqual(0);
          expect(pt[1]).toBeLessThanOrEqual(182); // nothing below the floor
        }
      }
    }
  });

  it('interpolates between keyframes and wraps the loop seamlessly', () => {
    const squat = CHOREOGRAPHIES.squat;
    const top = poseAt(squat, 0);
    const bottom = poseAt(squat, 0.5);
    expect(bottom.hip[1]).toBeGreaterThan(top.hip[1]); // hips drop at depth
    const mid = poseAt(squat, 0.225);
    expect(mid.hip[1]).toBeGreaterThan(top.hip[1]);
    expect(mid.hip[1]).toBeLessThan(bottom.hip[1]);
    // End of loop returns to the start pose.
    const wrapped = poseAt(squat, 0.999);
    expect(wrapped.hip[1]).toBeCloseTo(top.hip[1], 0);
  });

  it('derives the head along the torso direction', () => {
    const plank = poseAt(CHOREOGRAPHIES.core, 0);
    // In a plank the shoulder is left of the hip, so the head extends further left.
    expect(plank.head[0]).toBeLessThan(plank.shoulder[0]);
    const stand = poseAt(CHOREOGRAPHIES.vertical_push, 0);
    expect(stand.head[1]).toBeLessThan(stand.shoulder[1]); // above when upright
  });
});

describe('heldEquipmentFor', () => {
  it('never draws held weights for hanging or plank patterns', () => {
    expect(heldEquipmentFor('vertical_pull', ['pullup_bar', 'bodyweight'])).toBeUndefined();
    expect(heldEquipmentFor('core', ['bodyweight'])).toBeUndefined();
  });

  it('prefers barbell, then dumbbell, then kettlebell', () => {
    expect(heldEquipmentFor('squat', ['barbell', 'dumbbell'])).toBe('barbell');
    expect(heldEquipmentFor('lunge', ['dumbbell', 'bench'])).toBe('dumbbell');
    expect(heldEquipmentFor('hinge', ['kettlebell'])).toBe('kettlebell');
    expect(heldEquipmentFor('squat', ['bodyweight'])).toBeUndefined();
  });

  it('shows a handle for machine/cable work', () => {
    expect(heldEquipmentFor('isolation', ['cable'])).toBe('dumbbell');
  });
});

describe('ExerciseAnimation component', () => {
  it.each(PATTERNS)('renders the %s pattern (static under reduced motion)', async (pattern) => {
    await render(<ExerciseAnimation pattern={pattern} equipment={['barbell']} />);
    expect(screen.getByTestId('exercise-animation')).toHaveProp(
      'accessibilityLabel',
      expect.stringContaining(pattern.replace(/_/g, ' ')),
    );
  });

  it('shows an optional caption', async () => {
    await render(<ExerciseAnimation pattern="squat" caption="Squat pattern · coached tempo" />);
    expect(screen.getByText('Squat pattern · coached tempo')).toBeOnTheScreen();
  });
});
