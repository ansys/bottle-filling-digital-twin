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

/**
 * Test the complete stored results state management flow
 */
import { configureStore } from '@reduxjs/toolkit';
import simulationSlice, {
  setStoredResults,
  setSelectedStoredResult,
} from '@/store/slices/simulationSlice.ts';

// Define the store type for testing
type TestStore = ReturnType<
  typeof configureStore<{
    simulation: ReturnType<typeof simulationSlice>;
  }>
>;

describe('Stored Results State Management', () => {
  let store: TestStore;

  beforeEach(() => {
    store = configureStore({
      reducer: {
        simulation: simulationSlice,
      },
    });
  });

  it('initializes with empty stored results', () => {
    const state = store.getState();
    expect(state.simulation.storedResults).toEqual([]);
    expect(state.simulation.selectedStoredResult).toBe(null);
  });

  it('handles setStoredResults action', () => {
    const results = ['result1.usd', 'result2.usd', 'result3.usd'];

    store.dispatch(setStoredResults(results));

    const state = store.getState();
    expect(state.simulation.storedResults).toEqual(results);
  });

  it('handles setSelectedStoredResult action', () => {
    const selectedResult = 'result2.usd';

    store.dispatch(setSelectedStoredResult(selectedResult));

    const state = store.getState();
    expect(state.simulation.selectedStoredResult).toBe(selectedResult);
  });

  it('handles complete workflow: set results then select one', () => {
    const results = ['case1.usd', 'case2.usd', 'case3.usd'];

    // Set available results
    store.dispatch(setStoredResults(results));

    // Select one result
    store.dispatch(setSelectedStoredResult('case2.usd'));

    const state = store.getState();
    expect(state.simulation.storedResults).toEqual(results);
    expect(state.simulation.selectedStoredResult).toBe('case2.usd');
  });
});
