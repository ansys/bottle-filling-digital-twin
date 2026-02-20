// Copyright (C) 2025 - 2026 ANSYS, Inc. and/or its affiliates.
// SPDX-License-Identifier: MIT
//
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.

import { render, screen, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import Results from '@/components/simulation/Results/Results.tsx';

jest.useFakeTimers();

// Mock AppStreamer
jest.mock('@nvidia/omniverse-webrtc-streaming-library', () => ({
  AppStreamer: {
    sendMessage: jest.fn(),
  },
}));

import { AppStreamer } from '@nvidia/omniverse-webrtc-streaming-library';

describe('Results component unit tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders and displays title and controls', () => {
    render(<Results />);
    // Check heading text exactly as rendered
    expect(screen.getByRole('heading', { name: /Results & Visualization/i })).toBeInTheDocument();
    expect(screen.getByRole('slider')).toBeInTheDocument();
  });

  it('changes timestep when slider moves and calls onTimestepChange', () => {
    const onTimestepChange = jest.fn();
    render(<Results onTimestepChange={onTimestepChange} timestep={10} />);

    const slider = screen.getByRole('slider') as HTMLInputElement;
    expect(slider.value).toBe('10');

    fireEvent.change(slider, { target: { value: '42' } });

    expect(onTimestepChange).toHaveBeenCalledWith(42);
    expect(slider.value).toBe('42');
  });

  it('starts and stops animation and sends messages', () => {
    const onPlayStateChange = jest.fn();
    const { getByText } = render(<Results onPlayStateChange={onPlayStateChange} />);

    const playButton = getByText(/Play/i);
    // click to start
    fireEvent.click(playButton);
    expect(onPlayStateChange).toHaveBeenCalledWith(true);

    // advance timers to let interval run a few times
    act(() => {
      jest.advanceTimersByTime(350);
    });

    // click to stop
    const stopButton = getByText(/Stop/i);
    fireEvent.click(stopButton);
    expect(onPlayStateChange).toHaveBeenCalledWith(false);
  });

  it('changes camera and palette and triggers sendMessage', () => {
    const onCameraChange = jest.fn();
    const onPaletteChange = jest.fn();
  const mockApp = AppStreamer;

    render(
      <Results
        onCameraChange={onCameraChange}
        onPaletteChange={onPaletteChange}
      />
    );

    const cameraSelect = screen.getByLabelText(/Select Camera/i) as HTMLSelectElement;
    fireEvent.change(cameraSelect, { target: { value: 'Top' } });
    expect(onCameraChange).toHaveBeenCalledWith('Top');

    const paletteSelect = screen.getByLabelText(/Color Palette/i) as HTMLSelectElement;
    fireEvent.change(paletteSelect, { target: { value: 'coolwarm' } });
    expect(onPaletteChange).toHaveBeenCalledWith('coolwarm');

  // AppStreamer.sendMessage should have been called for camera and palette changes
  expect(mockApp.sendMessage).toHaveBeenCalled();
  });

  it('toggles full screen and renderer and sends messages', () => {
    const onFullscreenChange = jest.fn();
    const onRendererChange = jest.fn();
  const mockApp = AppStreamer;

    render(
      <Results onFullscreenChange={onFullscreenChange} onRendererChange={onRendererChange} />
    );

    const pathCheckbox = screen.getByText(/Path-Tracing/i).previousSibling as HTMLInputElement;
    fireEvent.click(pathCheckbox);
    expect(onRendererChange).toHaveBeenCalled();

    const controlCheckbox = screen.getByText(/Show control panel/i).previousSibling as HTMLInputElement;
    fireEvent.click(controlCheckbox);
    expect(onFullscreenChange).toHaveBeenCalled();

  expect(mockApp.sendMessage).toHaveBeenCalled();
  });

  it('store button triggers store message when showStoreButton is true', () => {
  const mockApp = AppStreamer;
    render(<Results showStoreButton={true} />);

    const storeBtn = screen.getByText(/Store Current/i);
    fireEvent.click(storeBtn);

  expect(mockApp.sendMessage).toHaveBeenCalled();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });
});
