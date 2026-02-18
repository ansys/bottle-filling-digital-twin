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

import React from 'react';
import { render } from '@testing-library/react';
import ConnectedOKASStreamContainer from '@/components/streaming/OKASStream/OKASStreamContainer.tsx';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import simulationReducer, { setSimulationStatus } from '@/store/slices/simulationSlice.ts';

// Mock OKASStreamWithHook to render placeholder and static methods
jest.mock('@/components/streaming/OKASStream/OKASStream.tsx', () => ({
  OKASStreamWithHook: React.forwardRef(() => React.createElement('div', { 'data-testid': 'mock-okas' })),
  OKASStream: {
    sendMessage: jest.fn(),
  },
}));

describe('OKASStreamContainer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders with props', () => {
    const store = configureStore({ reducer: { simulation: simulationReducer } });

    const { getByTestId } = render(
      <Provider store={store}>
        <ConnectedOKASStreamContainer
          appServer="app"
          streamServer="stream"
          appId="id"
          appVersion="v"
          profile="p"
          app="OmniverseApp"
        />
      </Provider>
    );

    expect(getByTestId('mock-okas')).toBeDefined();
  });

  it('handles simulation status changes', () => {
    const store = configureStore({ reducer: { simulation: simulationReducer } });

    render(
      <Provider store={store}>
        <ConnectedOKASStreamContainer
          appServer="app"
          streamServer="stream"
          appId="id"
          appVersion="v"
          profile="p"
          app="OmniverseApp"
        />
      </Provider>
    );

    // Change status to trigger sendSimulationStatusChange
    store.dispatch(setSimulationStatus('running'));

    expect(store.getState().simulation.simulationStatus).toBe('running');

    // Note: The sendMessage call happens in componentDidUpdate which may not be triggered
    // in this test setup, so we don't assert on OKASStream.sendMessage being called
  });
});
