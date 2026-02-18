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

import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';

// Mock AppStreamer with a successful send
jest.mock('@nvidia/omniverse-webrtc-streaming-library', () => ({
  AppStreamer: { sendMessage: jest.fn() },
}));

import FluentCalculationsContainer from '@/components/simulation/FluentCalculations/FluentCalculationsContainer.tsx';
import simulationReducer, { setCanRun } from '@/store/slices/simulationSlice.ts';
import fluentReducer from '@/store/slices/fluentSlice.ts';
import { AppStreamer } from '@nvidia/omniverse-webrtc-streaming-library';

describe('FluentCalculationsContainer success path', () => {
  it('sends message and sets simulation status to running', () => {
    const store = configureStore({
      reducer: { simulation: simulationReducer, fluent: fluentReducer },
    });

    // enable running
    store.dispatch(setCanRun(true));

    render(
      <Provider store={store}>
        <FluentCalculationsContainer width={600} />
      </Provider>
    );

    const runButton = screen.getByRole('button', { name: /Run/i });
    fireEvent.click(runButton);

    const state = store.getState();
    expect(state.simulation.isLoading).toBe(true);
    expect(state.simulation.simulationStatus).toBe('running');

  expect(AppStreamer.sendMessage).toHaveBeenCalled();
  });
});
