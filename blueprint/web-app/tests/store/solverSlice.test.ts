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
  setSolver,
  setResolution,
  setMeshQuality,
  setTimeStep,
  setMaxIterations,
  startSolver,

  completeSolver,
  failSolver,
  resetSolver,
  updateConvergenceData,
  updateResiduals,
  updatePerformanceMetrics,
  setAvailableSolvers,
  setSupportedResolutions,
  setError,
  clearError,
  setLoading,
} from '@/store/slices/solverSlice.ts';

describe('solverSlice reducer', () => {
  test('setSolver and setResolution update configuration', () => {
    let state = undefined as any;
    state = reducer(state, setSolver('cfx'));
    expect(state.configuration.solver).toBe('cfx');

    state = reducer(state, setResolution('800k'));
    expect(state.configuration.resolution).toBe('800k');
  });

  test('mesh quality, timestep and iterations setters', () => {
    let state = undefined as any;
    state = reducer(state, setMeshQuality('fine'));
    expect(state.configuration.meshQuality).toBe('fine');

    state = reducer(state, setTimeStep(0.005));
    expect(state.configuration.timeStep).toBe(0.005);

    state = reducer(state, setMaxIterations(5000));
    expect(state.configuration.maxIterations).toBe(5000);
  });

  test('startSolver initializes timing and state, completeSolver finalizes and computes solution time', () => {
  jest.useFakeTimers();
    const now = 1650000000000;
    jest.setSystemTime(now);

    let state = reducer(undefined as any, startSolver());
    expect(state.isSolverRunning).toBe(true);
    expect(state.solverStatus).toBe('initializing');
    expect(state.solverProgress).toBe(0);
    expect(state.currentStep).toMatch(/Initializing/);
    expect(state.solverStartTime).toBe(now);

    // Advance time and complete
    jest.setSystemTime(now + 4500);
    state = reducer(state, completeSolver({ result: 'ok' } as any));
    expect(state.isSolverRunning).toBe(false);
    expect(state.solverStatus).toBe('completed');
    expect(state.solverProgress).toBe(100);
    expect(state.solverResults).toEqual({ result: 'ok' });
    // solutionTime should be approx 4.5 seconds
    expect(state.solutionTime).toBeCloseTo(4.5, 1);

    jest.useRealTimers();
  });

  test('failSolver sets error and marks stopped', () => {
    let state = reducer(undefined as any, startSolver());
    state = reducer(state, failSolver('boom'));
    expect(state.isSolverRunning).toBe(false);
    expect(state.solverStatus).toBe('error');
    expect(state.solverError).toBe('boom');
    expect(state.currentStep).toMatch(/failed/i);
  });

  test('resetSolver clears results and metrics', () => {
    let state = reducer(undefined as any, startSolver());
    state = reducer(state, updateConvergenceData([1, 2, 3]));
    state = reducer(state, updateResiduals({ a: [0.1] }));
    state = reducer(state, setLoading(true));
    state = reducer(state, resetSolver());

    expect(state.isSolverRunning).toBe(false);
    expect(state.solverResults).toBeNull();
    expect(state.convergenceData).toEqual([]);
    expect(state.residuals).toEqual({});
  // resetSolver does not touch isLoading in the current implementation,
  // so the flag remains as previously set (true)
  expect(state.isLoading).toBe(true);
  });

  test('updatePerformanceMetrics and available options setters', () => {
    let state = reducer(undefined as any, updatePerformanceMetrics({ memoryUsage: 128, cpuUsage: 12 }));
    expect(state.memoryUsage).toBe(128);
    expect(state.cpuUsage).toBe(12);

    state = reducer(state, setAvailableSolvers(['a', 'b']));
    expect(state.availableSolvers).toEqual(['a', 'b']);

    state = reducer(state, setSupportedResolutions(['10k']));
    expect(state.supportedResolutions).toEqual(['10k']);
  });

  test('setError and clearError', () => {
    let state = reducer(undefined as any, setError('uh oh'));
    expect(state.error).toBe('uh oh');
    state = reducer(state, clearError());
    expect(state.error).toBeNull();
  });
});
