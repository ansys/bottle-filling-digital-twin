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

import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';

import SolvedCasesContainer from '@/components/simulation/SolvedCases/SolvedCasesContainer.tsx';
import simulationReducer, { setStoredResults } from '@/store/slices/simulationSlice.ts';

describe('SolvedCasesContainer connected', () => {
  it('renders options from store and calls visualize callback', () => {
    const store = configureStore({ reducer: { simulation: simulationReducer } });
    store.dispatch(setStoredResults(['case1', 'case2', 'case3']));

    const onVisualize = jest.fn();

    render(
      <Provider store={store}>
        <SolvedCasesContainer onVisualize={onVisualize} />
      </Provider>
    );

    const select = screen.getByLabelText(/Select Solved Case/i) as HTMLSelectElement;
    expect(select.value).toBe('case1');
  });
});
