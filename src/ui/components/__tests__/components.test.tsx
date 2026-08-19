import { fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';
import { SEED_EXERCISES } from '../../../data/seedExercises';
import { ExerciseCard } from '../exerciseCard';
import { MuscleDiagram } from '../muscleDiagram';
import { PrCelebration } from '../prCelebration';
import { ProgressChart, WeeklyBars } from '../progressChart';
import { RestTimerOverlay } from '../restTimer';
import { RpePicker } from '../rpePicker';
import { Stepper } from '../stepper';

describe('RestTimerOverlay', () => {
  const props = {
    secondsRemaining: 90,
    totalSeconds: 120,
    nextUp: 'Set 3 · Bench Press',
    onAdjust: jest.fn(),
    onSkip: jest.fn(),
  };

  it('renders the countdown as m:ss and the next-up cue', async () => {
    await render(<RestTimerOverlay {...props} />);
    expect(screen.getByTestId('rest-timer-clock')).toHaveTextContent('1:30');
    expect(screen.getByText(/Next: Set 3/)).toBeOnTheScreen();
  });

  it('adjusts and skips rest on the fly', async () => {
    await render(<RestTimerOverlay {...props} />);
    await fireEvent.press(screen.getByTestId('rest-timer-plus'));
    expect(props.onAdjust).toHaveBeenCalledWith(15);
    await fireEvent.press(screen.getByTestId('rest-timer-minus'));
    expect(props.onAdjust).toHaveBeenCalledWith(-15);
    await fireEvent.press(screen.getByTestId('rest-timer-skip'));
    expect(props.onSkip).toHaveBeenCalled();
  });

  it('never renders negative time', async () => {
    await render(<RestTimerOverlay {...props} secondsRemaining={-3} />);
    expect(screen.getByTestId('rest-timer-clock')).toHaveTextContent('0:00');
  });

  it('shows the coach encouragement line when provided', async () => {
    await render(<RestTimerOverlay {...props} encouragement="Good set. Big breaths." />);
    expect(screen.getByTestId('rest-timer-encouragement')).toHaveTextContent(
      'Good set. Big breaths.',
    );
  });

  it('warms up the label in the final seconds', async () => {
    await render(<RestTimerOverlay {...props} secondsRemaining={8} />);
    expect(screen.getByText('Almost go')).toBeOnTheScreen();
  });
});

describe('Stepper', () => {
  it('respects min/max bounds', async () => {
    const onChange = jest.fn();
    await render(<Stepper label="Reps" value={100} step={1} max={100} onChange={onChange} testID="s" />);
    await fireEvent.press(screen.getByTestId('s-increment'));
    expect(onChange).not.toHaveBeenCalled();
    await fireEvent.press(screen.getByTestId('s-decrement'));
    expect(onChange).toHaveBeenCalledWith(99);
  });
});

describe('RpePicker', () => {
  it('supports RIR mode with its own scale', async () => {
    const onChange = jest.fn();
    await render(<RpePicker mode="rir" value={undefined} onChange={onChange} testID="rir" />);
    await fireEvent.press(screen.getByTestId('rir-2'));
    expect(onChange).toHaveBeenCalledWith(2);
  });

  it('steps through the RPE scale and can clear', async () => {
    const onChange = jest.fn();
    const Harness = () => {
      const [value, setValue] = React.useState<number | undefined>(undefined);
      return (
        <RpePicker
          mode="rpe"
          value={value}
          onChange={(next) => {
            onChange(next);
            setValue(next);
          }}
          testID="rpe"
        />
      );
    };
    await render(<Harness />);
    await fireEvent.press(screen.getByTestId('rpe-increment'));
    expect(onChange).toHaveBeenLastCalledWith(6);
    await fireEvent.press(screen.getByTestId('rpe-increment'));
    expect(onChange).toHaveBeenLastCalledWith(7);
    await fireEvent.press(screen.getByTestId('rpe-decrement'));
    await fireEvent.press(screen.getByTestId('rpe-decrement'));
    expect(onChange).toHaveBeenLastCalledWith(undefined);
  });
});

describe('ExerciseCard', () => {
  const bench = SEED_EXERCISES.find((e) => e.id === 'bench-press')!;

  it('shows name, muscles, equipment, and difficulty', async () => {
    await render(
      <ExerciseCard exercise={bench} isFavorite={false} onPress={jest.fn()} onToggleFavorite={jest.fn()} />,
    );
    expect(screen.getByText(/Barbell Bench Press/)).toBeOnTheScreen();
    expect(screen.getByText(/Chest/)).toBeOnTheScreen();
    expect(screen.getByText('intermediate')).toBeOnTheScreen();
  });

  it('opens detail and toggles favorite independently', async () => {
    const onPress = jest.fn();
    const onToggleFavorite = jest.fn();
    await render(
      <ExerciseCard exercise={bench} isFavorite onPress={onPress} onToggleFavorite={onToggleFavorite} />,
    );
    await fireEvent.press(screen.getByTestId('exercise-card-bench-press-favorite'));
    expect(onToggleFavorite).toHaveBeenCalled();
    expect(onPress).not.toHaveBeenCalled();
    await fireEvent.press(screen.getByTestId('exercise-card-bench-press'));
    expect(onPress).toHaveBeenCalled();
  });
});

describe('ProgressChart', () => {
  it('renders a friendly empty state without data', async () => {
    await render(<ProgressChart points={[]} unitLabel="Estimated 1RM (kg)" />);
    expect(screen.getByTestId('progress-chart-empty')).toBeOnTheScreen();
  });

  it('renders the chart with data', async () => {
    await render(
      <ProgressChart
        points={[
          { date: '2026-08-01', value: 100 },
          { date: '2026-08-08', value: 105 },
        ]}
        unitLabel="Estimated 1RM (kg)"
      />,
    );
    expect(screen.getByTestId('progress-chart')).toBeOnTheScreen();
    expect(screen.getByText('Estimated 1RM (kg)')).toBeOnTheScreen();
  });
});

describe('WeeklyBars', () => {
  it('renders one bar per week', async () => {
    await render(
      <WeeklyBars
        data={[
          { label: 'w1', value: 2 },
          { label: 'w2', value: 0 },
        ]}
      />,
    );
    expect(screen.getByTestId('weekly-bars')).toBeOnTheScreen();
  });
});

describe('MuscleDiagram', () => {
  it('describes targeted muscles for assistive tech', async () => {
    await render(<MuscleDiagram primary={['chest']} secondary={['triceps']} />);
    expect(screen.getByTestId('muscle-diagram')).toHaveProp(
      'accessibilityLabel',
      expect.stringContaining('Primary: chest'),
    );
  });
});

describe('PrCelebration', () => {
  const record = {
    exerciseId: 'bench-press',
    kind: 'estimated_1rm' as const,
    valueKg: 110,
    reps: 5,
    achievedAt: '2026-08-19T10:00:00.000Z',
    sessionId: 's1',
  };

  it('celebrates with the exercise name and value, and dismisses', async () => {
    const onDismiss = jest.fn();
    await render(
      <PrCelebration
        records={[record]}
        exerciseNames={{ 'bench-press': 'Barbell Bench Press' }}
        unit="kg"
        onDismiss={onDismiss}
      />,
    );
    expect(screen.getByText(/new personal record/i)).toBeOnTheScreen();
    expect(screen.getByText(/Estimated 1RM: 110 kg/)).toBeOnTheScreen();
    await fireEvent.press(screen.getByTestId('pr-celebration-dismiss'));
    expect(onDismiss).toHaveBeenCalled();
  });

  it('renders nothing without records', async () => {
    await render(
      <PrCelebration records={[]} exerciseNames={{}} unit="kg" onDismiss={jest.fn()} />,
    );
    expect(screen.queryByTestId('pr-celebration')).toBeNull();
  });
});
