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

jest.mock('@nvidia/omniverse-webrtc-streaming-library', () => ({
  AppStreamer: {
    sendMessage: jest.fn(),
  },
}));

import ConnectedFluentCalculationsContainer from '@/components/simulation/FluentCalculations/FluentCalculationsContainer.tsx';
import { configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import simulationReducer from '@/store/slices/simulationSlice.ts';
import fluentReducer from '@/store/slices/fluentSlice.ts';
import { AppStreamer } from '@nvidia/omniverse-webrtc-streaming-library';

describe('FluentCalculationsContainer integration', () => {
  it('sends runCalculations message and sets loading/status', () => {
    const store = configureStore({
      reducer: { simulation: simulationReducer, fluent: fluentReducer },
    });
    // enable canRun in store so container renders as enabled
    store.dispatch({ type: 'simulation/setCanRun', payload: true });

    render(
      <Provider store={store}>
        <ConnectedFluentCalculationsContainer width={600} />
      </Provider>
    );

    // Find Run button and click
    const runButton = screen.getByRole('button', { name: /Run/i });
    fireEvent.click(runButton);

    expect(AppStreamer.sendMessage).toHaveBeenCalled();

    const simState = store.getState().simulation;
    expect(simState.isLoading).toBe(true);
    expect(simState.simulationStatus).toBe('running');
  });
});
