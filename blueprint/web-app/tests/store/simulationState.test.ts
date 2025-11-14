/**
 * Test the complete stored results state management flow
 */
import { configureStore } from '@reduxjs/toolkit';
import simulationSlice, {
  setStoredResults,
  setSelectedStoredResult,
} from '../../src/store/slices/simulationSlice';

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
