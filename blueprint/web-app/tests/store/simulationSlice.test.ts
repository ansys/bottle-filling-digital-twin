import reducer, {
  startSimulation,
  updateSimulationProgress,
  completeSimulation,
  failSimulation,
  resetSimulation,
  setSelectedDesignFile,
  setSelectedResolution,
} from '../../src/store/slices/simulationSlice';

describe('simulationSlice reducer', () => {
  test('startSimulation sets running and status', () => {
    const state = reducer(undefined, startSimulation());
    expect(state.isSimulationRunning).toBe(true);
    expect(state.simulationStatus).toBe('initializing');
    expect(state.simulationProgress).toBe(0);
  });

  test('updateSimulationProgress moves status to running when >0', () => {
    const started = reducer(undefined, startSimulation());
    const updated = reducer(started, updateSimulationProgress(10));
    expect(updated.simulationProgress).toBe(10);
    expect(updated.simulationStatus).toBe('running');
  });

  test('completeSimulation stores results and sets flags', () => {
    const data = { a: 1 } as Record<string, unknown>;
    const done = reducer(undefined, completeSimulation(data));
    expect(done.isSimulationRunning).toBe(false);
    expect(done.simulationStatus).toBe('completed');
    expect(done.resultsReady).toBe(true);
    expect(done.resultsData).toEqual(data);
    expect(typeof done.lastUpdated).toBe('number');
  });

  test('failSimulation sets error state', () => {
    const err = reducer(undefined, failSimulation('boom'));
    expect(err.isSimulationRunning).toBe(false);
    expect(err.simulationStatus).toBe('error');
    expect(err.simulationError).toBe('boom');
  });

  test('resetSimulation clears results and flags', () => {
    const state = reducer(undefined, resetSimulation());
    expect(state.simulationStatus).toBe('idle');
    expect(state.resultsReady).toBe(false);
  });

  test('setSelectedDesignFile updates selectedDesignFile and asset url', () => {
    const file = { name: 'X', url: '/x' };
    const next = reducer(undefined, setSelectedDesignFile(file));
    expect(next.selectedDesignFile).toEqual(file);
    expect(next.selectedAssetUrl).toBe('/x');
  });

  test('setSelectedResolution updates resolution', () => {
    const next = reducer(undefined, setSelectedResolution('high'));
    expect(next.selectedResolution).toBe('high');
  });
});
