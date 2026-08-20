import { fireEvent, render, screen } from '@testing-library/react-native';
import React, { useState } from 'react';
import type { SetDraft } from '../setLogger';
import { SetLogger } from '../setLogger';

const baseDraft: SetDraft = {
  weightKg: 80,
  reps: 8,
  effort: undefined,
  isWarmup: false,
  isFailure: false,
  isDropSet: false,
};

/** Stateful harness mirroring how the Workout Player drives SetLogger. */
const Harness = ({
  initial = baseDraft,
  previous,
  unit = 'kg' as const,
  onLog = jest.fn(),
}: {
  initial?: SetDraft;
  previous?: { weightKg: number; reps: number; rpe?: number };
  unit?: 'kg' | 'lb';
  onLog?: () => void;
}) => {
  const [draft, setDraft] = useState(initial);
  return (
    <SetLogger
      setNumber={1}
      draft={draft}
      previous={previous}
      unit={unit}
      effortMode="rpe"
      weightStep={2.5}
      onChange={setDraft}
      onLog={onLog}
    />
  );
};

describe('SetLogger', () => {
  it('shows the previous performance cue next to the inputs', async () => {
    await render(<Harness previous={{ weightKg: 80, reps: 8, rpe: 7 }} />);
    expect(screen.getByTestId('set-logger-previous')).toHaveTextContent(
      'Last time: 80 kg × 8 @ RPE 7',
    );
  });

  it('guides first-timers when there is no history', async () => {
    await render(<Harness />);
    expect(screen.getByTestId('set-logger-previous')).toHaveTextContent(/first time/i);
  });

  it('steps weight by the equipment increment', async () => {
    await render(<Harness />);
    await fireEvent.press(screen.getByTestId('set-logger-weight-increment'));
    expect(screen.getByTestId('set-logger-weight-value')).toHaveTextContent('82.5');
    await fireEvent.press(screen.getByTestId('set-logger-weight-decrement'));
    await fireEvent.press(screen.getByTestId('set-logger-weight-decrement'));
    expect(screen.getByTestId('set-logger-weight-value')).toHaveTextContent('77.5');
  });

  it('steps reps by one and never below zero', async () => {
    await render(<Harness initial={{ ...baseDraft, reps: 1 }} />);
    await fireEvent.press(screen.getByTestId('set-logger-reps-decrement'));
    expect(screen.getByTestId('set-logger-reps-value')).toHaveTextContent('0');
    await fireEvent.press(screen.getByTestId('set-logger-reps-decrement'));
    expect(screen.getByTestId('set-logger-reps-value')).toHaveTextContent('0');
  });

  it('displays weight in the user\u2019s unit (lb)', async () => {
    await render(<Harness unit="lb" initial={{ ...baseDraft, weightKg: 102.058 }} />);
    expect(screen.getByTestId('set-logger-weight-value')).toHaveTextContent('225');
  });

  it('selects and deselects RPE', async () => {
    await render(<Harness />);
    await fireEvent.press(screen.getByTestId('set-logger-effort-8'));
    expect(screen.getByText(/2 reps left/i)).toBeOnTheScreen();
    await fireEvent.press(screen.getByTestId('set-logger-effort-8'));
    expect(screen.getByText(/optional/i)).toBeOnTheScreen();
  });

  it('tags failure and drop sets with one tap', async () => {
    await render(<Harness />);
    await fireEvent.press(screen.getByTestId('set-logger-tag-failure'));
    expect(screen.getByRole('switch', { name: 'To failure', checked: true })).toBeOnTheScreen();
    await fireEvent.press(screen.getByTestId('set-logger-tag-dropset'));
    expect(screen.getByRole('switch', { name: 'Drop set', checked: true })).toBeOnTheScreen();
  });

  it('re-titles the header for warm-up sets', async () => {
    await render(<Harness initial={{ ...baseDraft, isWarmup: true }} />);
    expect(screen.getByText('Warm-up set')).toBeOnTheScreen();
  });

  it('logs with a single tap when pre-filled', async () => {
    const onLog = jest.fn();
    await render(<Harness onLog={onLog} />);
    await fireEvent.press(screen.getByTestId('set-logger-log'));
    expect(onLog).toHaveBeenCalledTimes(1);
  });

  it('blocks logging zero reps', async () => {
    const onLog = jest.fn();
    await render(<Harness initial={{ ...baseDraft, reps: 0 }} onLog={onLog} />);
    await fireEvent.press(screen.getByTestId('set-logger-log'));
    expect(onLog).not.toHaveBeenCalled();
  });
});
