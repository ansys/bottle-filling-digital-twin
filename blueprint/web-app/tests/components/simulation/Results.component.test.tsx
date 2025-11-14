import { render, screen, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom';

jest.useFakeTimers();

jest.mock('@nvidia/omniverse-webrtc-streaming-library', () => ({
  AppStreamer: { sendMessage: jest.fn() },
}));

import Results from '../../../src/components/simulation/Results/Results';
import { AppStreamer } from '@nvidia/omniverse-webrtc-streaming-library';

describe('Results component', () => {
  afterEach(() => {
    jest.clearAllTimers();
    jest.clearAllMocks();
  });

  it('changes timestep and sends message', () => {
    render(<Results width={300} />);

    const slider = screen.getByRole('slider');
    act(() => {
      fireEvent.change(slider, { target: { value: '10' } });
    });

  expect(AppStreamer.sendMessage).toHaveBeenCalled();
  // range input exposes its value, not text content
  expect(screen.getByLabelText(/Timestep:/)).toHaveValue('10');
  });

  it('toggles renderer and control panel and starts/stops animation', () => {
    const onPlay = jest.fn();
    const onFullscreen = jest.fn();
    const onRenderer = jest.fn();

    render(
      <Results
        width={300}
        onPlayStateChange={onPlay}
        onFullscreenChange={onFullscreen}
        onRendererChange={onRenderer}
      />
    );

    // renderer checkbox
    const rendererCheckbox = screen.getByRole('checkbox', { name: /Path-Tracing/i });
    fireEvent.click(rendererCheckbox);
    expect(onRenderer).toHaveBeenCalledWith(true);
    expect(AppStreamer.sendMessage).toHaveBeenCalled();

    // control panel
    const controlCheckbox = screen.getByRole('checkbox', { name: /Show control panel/i });
    fireEvent.click(controlCheckbox);
    expect(onFullscreen).toHaveBeenCalledWith(true);
    expect(AppStreamer.sendMessage).toHaveBeenCalled();

    // play button
    const playButton = screen.getByRole('button', { name: /Play/i });
    act(() => {
      fireEvent.click(playButton);
      jest.advanceTimersByTime(350);
    });
    expect(onPlay).toHaveBeenCalledWith(true);

    // stop
    const stopButton = screen.getByRole('button', { name: /Stop/i });
    act(() => {
      fireEvent.click(stopButton);
    });
    expect(onPlay).toHaveBeenCalledWith(false);
  });
});
