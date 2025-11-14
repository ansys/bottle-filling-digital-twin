import reducer,
  {
    setNumTimesteps,
    setViscosity,
    setBottlesPerHour,
    setTolerance,
    setCalculationParams,
    startCalculation,
    updateCalculationProgress,
    completeCalculation,
    failCalculation,
    resetCalculation,
    setCalculationsEnabled,
    setError,
    clearError,
    setLoading,
  } from '../../src/store/slices/fluentSlice';

describe('fluentSlice reducer', () => {
  it('returns the initial state when passed an unknown action', () => {
    const state = reducer(undefined, { type: '@@INIT' } as any);
    expect(state).toBeDefined();
    expect(state.calculationParams.numTimesteps).toBe(1);
    expect(state.isCalculating).toBe(false);
    expect(state.calculationStatus).toBe('idle');
    expect(state.calculationResults).toBeNull();
  });

  it('updates individual calculation parameters', () => {
    let state = reducer(undefined, { type: '@@INIT' } as any);
    state = reducer(state, setNumTimesteps(42));
    expect(state.calculationParams.numTimesteps).toBe(42);

    state = reducer(state, setViscosity(0.123));
    expect(state.calculationParams.viscosity).toBeCloseTo(0.123);

    state = reducer(state, setBottlesPerHour(1234));
    expect(state.calculationParams.bottlesPerHour).toBe(1234);

    state = reducer(state, setTolerance(0.5));
    expect(state.calculationParams.tolerance).toBe(0.5);
  });

  it('replaces the full calculation params object', () => {
    const params = {
      numTimesteps: 10,
      viscosity: 0.01,
      bottlesPerHour: 1000,
      tolerance: 0.001,
    };
    const state = reducer(undefined, setCalculationParams(params));
    expect(state.calculationParams).toEqual(params);
  });

  it('handles calculation lifecycle actions', () => {
    let state = reducer(undefined, { type: '@@INIT' } as any);

    state = reducer(state, startCalculation());
    expect(state.isCalculating).toBe(true);
    expect(state.calculationStatus).toBe('running');
    expect(state.calculationProgress).toBe(0);

    state = reducer(state, updateCalculationProgress(55));
    expect(state.calculationProgress).toBe(55);

    // mock Date.now for stable test
    const nowSpy = jest.spyOn(Date, 'now').mockReturnValue(123456789);
    const results = { foo: 'bar' } as Record<string, unknown>;
    state = reducer(state, completeCalculation(results));
    expect(state.isCalculating).toBe(false);
    expect(state.calculationStatus).toBe('completed');
    expect(state.calculationProgress).toBe(100);
    expect(state.calculationResults).toBe(results);
    expect(state.lastCalculationTime).toBe(123456789);
    nowSpy.mockRestore();

    // failing
    state = reducer(state, failCalculation('bad'));
    expect(state.isCalculating).toBe(false);
    expect(state.calculationStatus).toBe('error');
    expect(state.calculationError).toBe('bad');

    // reset
    state = reducer(state, resetCalculation());
    expect(state.isCalculating).toBe(false);
    expect(state.calculationStatus).toBe('idle');
    expect(state.calculationResults).toBeNull();
  });

  it('toggles enable, error and loading flags', () => {
    let state = reducer(undefined, { type: '@@INIT' } as any);
    state = reducer(state, setCalculationsEnabled(true));
    expect(state.calculationsEnabled).toBe(true);

    state = reducer(state, setError('err'));
    expect(state.error).toBe('err');

    state = reducer(state, clearError());
    expect(state.error).toBeNull();

    state = reducer(state, setLoading(true));
    expect(state.isLoading).toBe(true);
  });
});
