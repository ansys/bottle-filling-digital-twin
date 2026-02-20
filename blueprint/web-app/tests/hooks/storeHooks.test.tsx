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

/* eslint-disable @typescript-eslint/no-explicit-any */
import { renderHook, act } from '@testing-library/react';

// We'll mock react-redux to control useSelector and useDispatch behavior
jest.mock('react-redux', () => ({
  useSelector: jest.fn(),
  useDispatch: jest.fn(),
}));

import * as reactRedux from 'react-redux';
import {
  useApplicationState,
  useStreamingState,
  useFormNavigation,
  useUIState,
  useServerState,
} from '@/store/hooks';

describe('store hooks (index)', () => {
  const mockDispatch = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (reactRedux.useDispatch as unknown as jest.Mock).mockReturnValue(mockDispatch);
  });

  test('useApplicationState returns expected shape and dispatches actions', () => {
    const fakeState = {
      application: {
        currentForm: 'FORM_A',
        streamStatus: 'IDLE',
        selectedApplicationId: 'app1',
        selectedApplicationVersion: 'v1',
        selectedApplicationProfile: 'p',
        isLoadingApplications: false,
        error: null,
      },
    } as any;

    (reactRedux.useSelector as unknown as jest.Mock).mockImplementation(selector => selector(fakeState));

    const { result } = renderHook(() => useApplicationState());
    expect(result.current.currentForm).toBe('FORM_A');

    act(() => {
      result.current.actions.setCurrentForm('X');
    });

    expect(mockDispatch).toHaveBeenCalledWith({ type: 'application/setCurrentForm', payload: 'X' });
  });

  test('useStreamingState actions dispatch correctly', () => {
    const fakeState = { streaming: { isConnecting: false, isConnected: true, connectionError: null, signalingServer: '', signalingPort: 0, connectionQuality: 1, latency: 10 } } as any;
    (reactRedux.useSelector as unknown as jest.Mock).mockImplementation(selector => selector(fakeState));

    const { result } = renderHook(() => useStreamingState());
    expect(result.current.isConnected).toBe(true);

    act(() => {
      result.current.actions.setConnected(false);
    });

    expect(mockDispatch).toHaveBeenCalledWith({ type: 'streaming/setConnected', payload: false });
  });

  test('useFormNavigation dispatches navigation actions', () => {
    const fakeState = { form: { currentStep: 1, totalSteps: 3, canGoBack: true, canGoForward: true, isSubmitting: false, submitError: null } } as any;
    (reactRedux.useSelector as unknown as jest.Mock).mockImplementation(selector => selector(fakeState));

  const { result } = renderHook(() => useFormNavigation());
  act(() => result.current.actions.goToStep(2));
  expect(mockDispatch).toHaveBeenCalledWith({ type: 'form/goToStep', payload: 2 });
  });

  test('useUIState exposes state and actions', () => {
    const fakeState = { ui: { theme: 'dark', notifications: [], timestep: 0, showSettings: false } } as any;
    (reactRedux.useSelector as unknown as jest.Mock).mockImplementation(selector => selector(fakeState));

  const { result } = renderHook(() => useUIState());
  expect(result.current.theme).toBe('dark');

  act(() => result.current.actions.toggleSidebar());
  // toggleSidebar now mapped to toggleFullscreen for compatibility
  expect(mockDispatch).toHaveBeenCalledWith({ type: 'ui/toggleFullscreen' });
  });

  test('useServerState dispatches server actions', () => {
    const fakeState = { server: { streamServer: 's', streamServerStatus: 'ok', streamServerHealth: {}, recentServers: [], lastError: null } } as any;
    (reactRedux.useSelector as unknown as jest.Mock).mockImplementation(selector => selector(fakeState));

  const { result } = renderHook(() => useServerState());
  act(() => result.current.actions.updateConnectionStatus('new'));
  expect(mockDispatch).toHaveBeenCalledWith({ type: 'server/updateConnectionStatus', payload: 'new' });
  });
});
/* eslint-enable @typescript-eslint/no-explicit-any */
