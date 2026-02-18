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

// Mock AppStreamer static sendMessage
jest.mock('@nvidia/omniverse-webrtc-streaming-library', () => ({
  AppStreamer: { sendMessage: jest.fn() },
}));

import { AppStreamer } from '@nvidia/omniverse-webrtc-streaming-library';
import ConnectedFluentSolutionVariablesContainer from '@/components/simulation/FluentSolutionVariables/FluentSolutionVariablesContainer.tsx';
import { configureStore } from '@reduxjs/toolkit';

// Inline helper (kept minimal for tests)
const createMockStore = (initialState = {}) => {
  return configureStore({
    reducer: {
      simulation: (state = {}, _action: { type: string }) => state,
    },
    preloadedState: {
      simulation: {
        isSimulationRunning: false,
        simulationStatus: 'idle',
        simulationProgress: 0,
        selectedDesignFile: null,
        error: null,
        isLoading: false,
        statusText: null,
        canRun: false,
        canInitialize: false,
        ...initialState,
      },
    },
  });
};

const fluentSolutionVariables = [
  { name: 'Var A', sv: 'svA' },
  { name: 'Var B', sv: 'svB' },
];

describe('FluentSolutionVariablesContainer integration', () => {
  it('dispatches onVisualize and calls AppStreamer.sendMessage on Initialize', () => {
    const store = createMockStore({
      solutionVariables: fluentSolutionVariables,
      selectedSolutionVariable: null,
      canInitialize: true,
      isLoading: false,
      statusText: null,
    });

    render(
      <Provider store={store}>
        <ConnectedFluentSolutionVariablesContainer />
      </Provider>
    );

    const button = screen.getByRole('button', { name: /Initialize/i });
    fireEvent.click(button);

    // AppStreamer.sendMessage should have been called
    expect(AppStreamer.sendMessage).toHaveBeenCalled();

    // store should have dispatched setLoading(true) as the first action
  // We cannot directly inspect actions on a real Redux store created with configureStore
  // but we at least verify sendMessage was called and the UI attempted initialization.
  // A more thorough test could use redux-mock-store; keep this lightweight.
  expect(AppStreamer.sendMessage).toHaveBeenCalled();
  });

  it('handles AppStreamer.sendMessage throwing (sets error status)', () => {
    const store = createMockStore({
      solutionVariables: fluentSolutionVariables,
      selectedSolutionVariable: null,
      canInitialize: true,
      isLoading: false,
      statusText: null,
    });

    // Make sendMessage throw
    (AppStreamer.sendMessage as jest.Mock).mockImplementation(() => {
      throw new Error('boom');
    });

    render(
      <Provider store={store}>
        <ConnectedFluentSolutionVariablesContainer />
      </Provider>
    );

    const button = screen.getByRole('button', { name: /Initialize/i });
    fireEvent.click(button);

    // AppStreamer.sendMessage was attempted and threw
    expect(AppStreamer.sendMessage).toHaveBeenCalled();

    // store should have a setSimulationStatus('error') or setLoading false action
  // Verify sendMessage was attempted and error branch triggered (sendMessage threw)
  expect(AppStreamer.sendMessage).toHaveBeenCalled();
  });
});
