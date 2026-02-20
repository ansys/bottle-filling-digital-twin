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

jest.useFakeTimers();

jest.mock('@nvidia/omniverse-webrtc-streaming-library', () => ({
  AppStreamer: { sendMessage: jest.fn() },
}));

import Results from '@/components/simulation/Results/Results.tsx';
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
