import { render, screen } from '@testing-library/react-native';
import React from 'react';
import { PoseGlyph } from '../poseGlyph';

describe('PoseGlyph', () => {
  it('renders a squat with barbell', async () => {
    await render(<PoseGlyph pattern="squat" equipment={['barbell']} testID="pose-squat" />);
    expect(screen.getByTestId('pose-squat')).toBeOnTheScreen();
  });

  it('renders a bench (horizontal_push) with barbell', async () => {
    await render(
      <PoseGlyph pattern="horizontal_push" equipment={['barbell']} testID="pose-bench" />,
    );
    expect(screen.getByTestId('pose-bench')).toBeOnTheScreen();
  });
});
