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

import { OmniverseMessageHandler } from '@/services/OmniverseMessageHandler.ts';
import { AppDispatch } from '@/store';
import {
  updateSimulationProgress,
  setSimulationStatus,
  setSelectedDesignFile,
  setCanInitialize,
  setLoading,
  setCanRun,
  setStoredResults,
  setError,
} from '@/store/slices/simulationSlice.ts';

describe('OmniverseMessageHandler', () => {
  let dispatch: jest.MockedFunction<AppDispatch>;
  let handler: OmniverseMessageHandler;

  beforeEach(() => {
    dispatch = jest.fn();
    handler = new OmniverseMessageHandler(dispatch);
  });

  test('handles simulation_progress by dispatching updateSimulationProgress', () => {
    handler.handleCustomEvent({ type: 'simulation_progress', payload: { progress: 42 } });
    expect(dispatch).toHaveBeenCalledWith(updateSimulationProgress(42));
  });

  test('handles valid simulation_status', () => {
    handler.handleCustomEvent({ type: 'simulation_status', payload: { status: 'running' } });
    expect(dispatch).toHaveBeenCalledWith(setSimulationStatus('running'));
  });

  test('ignores invalid/unknown event shapes', () => {
    // no type/type empty
    handler.handleCustomEvent({});
    expect(dispatch).not.toHaveBeenCalled();
  });

  test('handles design_file_loaded by setting selected design file', () => {
    handler.handleCustomEvent({ type: 'design_file_loaded', payload: { designFile: 'Bottle1' } });
    expect(dispatch).toHaveBeenCalledWith(
      setSelectedDesignFile({ name: 'Bottle1', url: '/designs/Bottle1' })
    );
  });

  test('handles loadDesignFileResponse success and failure', () => {
    dispatch.mockClear();
    handler.handleCustomEvent({ type: 'loadDesignFileResponse', payload: { result: 'success' } });
    expect(dispatch).toHaveBeenCalledWith(setCanInitialize(true));
    expect(dispatch).toHaveBeenCalledWith(setLoading(false));
    expect(dispatch).toHaveBeenCalledWith(setSimulationStatus('idle'));

    dispatch.mockClear();
    handler.handleCustomEvent({ type: 'loadDesignFileResponse', payload: { result: 'fail' } });
    expect(dispatch).toHaveBeenCalledWith(setError('Error loading design file'));
  });

  test('handles postProcessResponse success and failure', () => {
    dispatch.mockClear();
    handler.handleCustomEvent({ type: 'postProcessSolutionVariableResponse', payload: { result: 'success' } });
    expect(dispatch).toHaveBeenCalledWith(setCanRun(true));
    expect(dispatch).toHaveBeenCalledWith(setLoading(false));
    expect(dispatch).toHaveBeenCalledWith(setSimulationStatus('idle'));

    dispatch.mockClear();
    handler.handleCustomEvent({ type: 'postProcessSolutionVariableResponse', payload: { result: 'bad' } });
    expect(dispatch).toHaveBeenCalledWith(setError('Error post-processing solution variable'));
  });

  test('handles storedResultsResponse array and success string', () => {
    dispatch.mockClear();
    handler.handleCustomEvent({ type: 'storedResultsResponse', payload: { storedResults: ['a', 'b'] } });
    expect(dispatch).toHaveBeenCalledWith(setStoredResults(['a', 'b']));
    expect(dispatch).toHaveBeenCalledWith(setLoading(false));

    dispatch.mockClear();
    handler.handleCustomEvent({ type: 'storedResultsResponse', payload: { storedResults: 'success' } });
    expect(dispatch).toHaveBeenCalledWith(setLoading(false));
  });

  test('handles instance healthy and unhealthy responses', () => {
    dispatch.mockClear();
    handler.handleCustomEvent({ type: 'isInstanceHealthyResponse', payload: { isHealthy: true } });
    expect(dispatch).toHaveBeenCalledWith(setLoading(false));
    expect(dispatch).toHaveBeenCalledWith(setError(null));
    expect(dispatch).toHaveBeenCalledWith(setSimulationStatus('idle'));

    dispatch.mockClear();
    handler.handleCustomEvent({ type: 'isInstanceHealthyResponse', payload: { isHealthy: false } });
    expect(dispatch).toHaveBeenCalledWith(setSimulationStatus('error'));
    expect(dispatch).toHaveBeenCalledWith(setError('Fluent License Required!'));
    expect(dispatch).toHaveBeenCalledWith(setLoading(false));
  });

  test('handles error event by dispatching setError', () => {
    dispatch.mockClear();
    handler.handleCustomEvent({ type: 'error', payload: { error: 'boom' } });
    expect(dispatch).toHaveBeenCalledWith(setError('boom'));
  });
});
