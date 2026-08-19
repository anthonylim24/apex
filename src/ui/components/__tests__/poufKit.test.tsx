import { fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';
import { Callout, ProgressPips, Switch } from '../poufKit';

describe('Pouf kit', () => {
  it('toggles a clay switch', async () => {
    const onValueChange = jest.fn();
    await render(<Switch label="Favorites only" value={false} onValueChange={onValueChange} testID="sw" />);
    await fireEvent.press(screen.getByTestId('sw'));
    expect(onValueChange).toHaveBeenCalledWith(true);
  });

  it('exposes pip progress to assistive tech', async () => {
    await render(<ProgressPips total={5} current={2} testID="pips" />);
    expect(screen.getByTestId('pips')).toHaveProp('accessibilityRole', 'progressbar');
    expect(screen.getByTestId('pips')).toHaveProp('accessibilityValue', { min: 1, max: 5, now: 3 });
  });

  it('renders a callout title and body', async () => {
    await render(
      <Callout tone="mint" title="Coach's note" testID="note">
        Soft landings.
      </Callout>,
    );
    expect(screen.getByTestId('note')).toHaveTextContent(/Coach's note/);
    expect(screen.getByTestId('note')).toHaveTextContent(/Soft landings/);
  });
});
