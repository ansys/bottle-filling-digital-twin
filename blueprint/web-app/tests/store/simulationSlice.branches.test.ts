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

import simulationReducer, {
  SimulationState,
  startSimulation,
  updateSimulationProgress,
  completeSimulation,
  failSimulation,
  cancelSimulation,
  resetSimulation,
  setCanInitialize,
  setCanRun,
  setStatusText,
} from '@/store/slices/simulationSlice.ts';

describe('simulationSlice - branches and helpers', () => {
  it('start -> progress transitions to running', () => {
    let s = simulationReducer(undefined as unknown as SimulationState, startSimulation());
    expect(s.isSimulationRunning).toBe(true);
    expect(s.simulationStatus).toBe('initializing');

    s = simulationReducer(s, updateSimulationProgress(10));
    expect(s.simulationProgress).toBe(10);
    expect(s.simulationStatus).toBe('running');
  });

  it('completeSimulation sets results and lastUpdated', () => {
    const payload = { result: 'ok' } as Record<string, unknown>;
  const s = simulationReducer(undefined as unknown as SimulationState, completeSimulation(payload));
    expect(s.resultsReady).toBe(true);
    expect(s.resultsData).toEqual(payload);
    expect(s.simulationProgress).toBe(100);
    expect(s.lastUpdated).not.toBeNull();
  });

  it('failSimulation and cancelSimulation update status', () => {
  let s = simulationReducer(undefined as unknown as SimulationState, failSimulation('err'));
    expect(s.simulationStatus).toBe('error');
    expect(s.simulationError).toBe('err');

    s = simulationReducer(s, cancelSimulation());
    expect(s.simulationStatus).toBe('cancelled');
  });

  it('resetSimulation clears results and progress', () => {
  const s1 = simulationReducer(undefined as unknown as SimulationState, completeSimulation({ ok: true } as unknown as Record<string, unknown>));
    const s2 = simulationReducer(s1, resetSimulation());
    expect(s2.resultsReady).toBe(false);
    expect(s2.simulationProgress).toBe(0);
    expect(s2.simulationStatus).toBe('idle');
  });

  it('setCanInitialize and setCanRun toggle flags and setStatusText updates lastUpdated', () => {
  let s = simulationReducer(undefined as unknown as SimulationState, setCanInitialize(true));
    expect(s.canInitialize).toBe(true);
    s = simulationReducer(s, setCanRun(true));
    expect(s.canRun).toBe(true);

    const before = s.lastUpdated;
    s = simulationReducer(s, setStatusText('loading'));
    expect(s.statusText).toBe('loading');
    expect(s.lastUpdated).not.toBe(before);
  });
});
