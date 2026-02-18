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

import { mapDispatchToProps } from '@/components/simulation/SolverSetup/SolverSetupContainer.tsx';

describe('SolverSetupContainer dispatch branches', () => {
  afterEach(() => jest.restoreAllMocks());

  it('onSelectDesignFile dispatches setSelectedDesignFile for valid id', () => {
    const dispatched: any[] = [];
    const dispatch = (a: any) => dispatched.push(a);

    const m = mapDispatchToProps(dispatch as any);
    m.onSelectDesignFile('design-0');

    expect(dispatched.length).toBeGreaterThan(0);
    const action = dispatched.find(a => a && a.type && String(a.type).includes('setSelectedDesignFile'));
    expect(action).toBeDefined();
  });

  it('onSelectDesignFile does nothing for invalid id', () => {
    const dispatched: any[] = [];
    const dispatch = (a: any) => dispatched.push(a);

    const m = mapDispatchToProps(dispatch as any);
    m.onSelectDesignFile('design-99');

    // should not dispatch setSelectedDesignFile
    const action = dispatched.find(a => a && a.type && String(a.type).includes('setSelectedDesignFile'));
    expect(action).toBeUndefined();
  });

  it('onOpenDesignFile dispatches setError when no selected design in state', () => {
    const innerDispatch = jest.fn();
    const getState = () => ({ simulation: { selectedDesignFile: null, selectedResolution: 'High' } });

    const outerDispatch = (action: any) => {
      if (typeof action === 'function') return action(innerDispatch, getState);
      return innerDispatch(action);
    };

    const m = mapDispatchToProps(outerDispatch as any);
    m.onOpenDesignFile();

    expect(innerDispatch).toHaveBeenCalled();
    const calledSetError = innerDispatch.mock.calls.some(c => c[0] && c[0].type && String(c[0].type).includes('setError'));
    expect(calledSetError).toBeTruthy();
  });
});
