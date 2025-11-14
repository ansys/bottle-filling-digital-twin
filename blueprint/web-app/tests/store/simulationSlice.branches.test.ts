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
} from '../../src/store/slices/simulationSlice';

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
