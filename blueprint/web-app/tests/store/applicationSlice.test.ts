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

import reducer, {
  setUseSimulationUI,
  setApplications,
  setSelectedApplication,
  setSessionId,
  setLoadingApplications,
  setLoadingVersions,
  setError,
  clearError,
  resetApplicationState,
  resetToInitialForm,
  Forms,
  selectIsLoading,
} from '@/store/slices/applicationSlice.ts';
import type { ApplicationState } from '@/store/slices/applicationSlice.ts';

describe('applicationSlice reducer', () => {
  const initial = reducer(undefined, { type: '@@INIT' }) as ApplicationState;

  test('setError and clearError set lastError and clear fields', () => {
    let state = reducer(initial, setError('bad stuff'));
    expect(state.error).toBe('bad stuff');
    expect(state.lastError).toBeDefined();

    state = reducer(state, clearError());
    expect(state.error).toBeNull();
  });

  test('setApplications resets loading and error', () => {
    let state = reducer(initial, setLoadingApplications(true));
    state = reducer(state, setApplications([{ id: 'a', name: 'A' }] as any));
    expect(state.applications.length).toBe(1);
    expect(state.isLoadingApplications).toBe(false);
    expect(state.error).toBeNull();
  });

  test('selection setters reset dependent fields', () => {
    let state = reducer(initial, setApplications([{ id: 'a', name: 'A' }] as any));
    state = reducer(state, setSelectedApplication('a'));
    expect(state.selectedApplicationId).toBe('a');
    expect(state.selectedApplicationVersion).toBe('');
  });

  test('resetApplicationState preserves useSimulationUI', () => {
    let state = reducer(initial, setUseSimulationUI(false));
    state = reducer(state, setError('err'));
    const reset = reducer(state, resetApplicationState());
    expect(reset.useSimulationUI).toBe(false);
    expect(reset.error).toBeNull();
  });

  test('resetToInitialForm clears selections and session', () => {
    let state = reducer(initial, setSelectedApplication('a'));
    state = reducer(state, setSessionId('s1'));
    state = reducer(state, resetToInitialForm());
    expect(state.selectedApplicationId).toBe('');
    expect(state.sessionId).toBe('');
    expect(state.currentForm).toBe(Forms.APP_ONLY);
  });

  test('loading selectors compute correctly', () => {
    let state = reducer(initial, setLoadingApplications(true));
    state = reducer(state, setLoadingVersions(false));
    const full = { application: state } as any;
    expect(selectIsLoading(full)).toBe(true);
  });
});
