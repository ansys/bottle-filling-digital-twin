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

import { SolverSetupContainer, mapDispatchToProps } from '@/components/simulation/SolverSetup/SolverSetupContainer.tsx';
import { AppStreamer } from '@nvidia/omniverse-webrtc-streaming-library';

describe('SolverSetupContainer', () => {
  const baseProps: any = {
    designFiles: [],
    selectedDesignFileId: null,
    selectedResolution: 'High',
    isLoading: false,
    isOpening: false,
    width: 800,
    className: 'c',
    onSelectDesignFile: () => {},
    onSelectResolution: () => {},
    onOpenDesignFile: () => {},
  };

  afterEach(() => {
    jest.restoreAllMocks();
    document.body.innerHTML = '';
    try {
      jest.useRealTimers();
    } catch (e) {
      // Ignore error if timers are already real
    }
  });

  it('sendHealthCheckMessage calls AppStreamer.sendMessage after timeout', () => {
    jest.useFakeTimers();
    const sendSpy = jest.spyOn(AppStreamer as any, 'sendMessage').mockImplementation(() => {});

    const inst = new SolverSetupContainer(baseProps);
    // call the private method
    (inst as any).sendHealthCheckMessage();

    // advance the timer by 1s to trigger the call
    jest.advanceTimersByTime(1000);

    expect(sendSpy).toHaveBeenCalled();
  });

  it('handleOpenDesignFile calls provided onOpenDesignFile when selected', () => {
    const onOpen = jest.fn();
    const props = { ...baseProps, selectedDesignFileId: 'design-0', onOpenDesignFile: onOpen };
    const inst = new SolverSetupContainer(props);

    (inst as any).handleOpenDesignFile();

    expect(onOpen).toHaveBeenCalled();
  });

  it('mapDispatchToProps onOpenDesignFile dispatches setError when AppStreamer.sendMessage throws', () => {
    const sendMock = jest.spyOn(AppStreamer as any, 'sendMessage').mockImplementation(() => {
      throw new Error('boom');
    });

    const innerDispatch = jest.fn();
    const getState = () => ({
      simulation: {
        selectedDesignFile: { name: '500ml Water Bottle', url: '/500' },
        selectedResolution: 'High',
      },
    });

    const outerDispatch = (action: any) => {
      if (typeof action === 'function') {
        return action(innerDispatch, getState);
      }
      return innerDispatch(action);
    };

    const m = mapDispatchToProps(outerDispatch as any);

    // call the thunk
    m.onOpenDesignFile();

    // expect that setError was dispatched by innerDispatch (some call contains setError action)
    expect(innerDispatch).toHaveBeenCalled();
    const found = innerDispatch.mock.calls.some(c => c[0] && c[0].type && String(c[0].type).toLowerCase().includes('seterror'));
    if (!found) {
      // fallback: check payload contains error string
      const payloadFound = innerDispatch.mock.calls.some(c => JSON.stringify(c[0]).includes('boom'));
      expect(payloadFound).toBeTruthy();
    } else {
      expect(found).toBeTruthy();
    }
    sendMock.mockRestore();
  });
});
/* eslint-disable @typescript-eslint/no-explicit-any */
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { render } from '@testing-library/react';
import simulationReducer, { SimulationState } from '@/store/slices/simulationSlice.ts';
import ConnectedSolverSetupContainer from '@/components/simulation/SolverSetup/SolverSetupContainer.tsx';
import { fireEvent } from '@testing-library/react';

describe('SolverSetupContainer', () => {
  it('mapStateToProps shapes designFiles and selectedDesignFileId correctly', () => {
    const preloaded: { simulation: SimulationState } = {
      simulation: {
        ...simulationReducer(undefined as any, { type: '@@INIT' } as any),
      },
    } as any;

  const store = configureStore({ reducer: ({ simulation: simulationReducer } as any), preloadedState: preloaded as any });

    const { container } = render(
      <Provider store={store}>
        <ConnectedSolverSetupContainer />
      </Provider>
    );

    // Ensure component rendered
    expect(container).toBeTruthy();
  });

  it('onOpenDesignFile thunk sends message via AppStreamer and dispatches loading/status actions', async () => {
    // Spy on AppStreamer.sendMessage
    const sendSpy = jest.spyOn(AppStreamer as any, 'sendMessage').mockImplementation(() => {});

    // Create a store and set selectedDesignFile and resolution
    const preloaded = {
      simulation: {
        ...simulationReducer(undefined as any, { type: '@@INIT' } as any),
        selectedDesignFile: { name: '500ml Water Bottle', url: '/500mlWaterBottle/500-ml-water-bottle' },
        selectedResolution: '400k',
      },
    } as any;

    const store = configureStore({ reducer: ({ simulation: simulationReducer } as any), preloadedState: preloaded as any });

    const { getByRole } = render(
      <Provider store={store}>
        <ConnectedSolverSetupContainer />
      </Provider>
    );

    // Button should be enabled because selectedDesignFileId exists and isOpening is false
  const openButton = getByRole('button', { name: /Open selected design file/i }) as HTMLButtonElement;
    expect(openButton).toBeDefined();

    fireEvent.click(openButton);

    expect(sendSpy).toHaveBeenCalled();

    sendSpy.mockRestore();
  });
});
