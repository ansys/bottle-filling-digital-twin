import reducer, {
  setUseSimulationUI,
  setApplications,
  setSelectedApplication,
  setSessionId,
  setLoadingApplications,
  setLoadingVersions,
  setError,
  clearError,
  resetApplicationState,
  resetToInitialForm,
  Forms,
  selectIsLoading,
} from '../../src/store/slices/applicationSlice';
import type { ApplicationState } from '../../src/store/slices/applicationSlice';

describe('applicationSlice reducer', () => {
  const initial = reducer(undefined, { type: '@@INIT' }) as ApplicationState;

  test('setError and clearError set lastError and clear fields', () => {
    let state = reducer(initial, setError('bad stuff'));
    expect(state.error).toBe('bad stuff');
    expect(state.lastError).toBeDefined();

    state = reducer(state, clearError());
    expect(state.error).toBeNull();
  });

  test('setApplications resets loading and error', () => {
    let state = reducer(initial, setLoadingApplications(true));
    state = reducer(state, setApplications([{ id: 'a', name: 'A' }] as any));
    expect(state.applications.length).toBe(1);
    expect(state.isLoadingApplications).toBe(false);
    expect(state.error).toBeNull();
  });

  test('selection setters reset dependent fields', () => {
    let state = reducer(initial, setApplications([{ id: 'a', name: 'A' }] as any));
    state = reducer(state, setSelectedApplication('a'));
    expect(state.selectedApplicationId).toBe('a');
    expect(state.selectedApplicationVersion).toBe('');
  });

  test('resetApplicationState preserves useSimulationUI', () => {
    let state = reducer(initial, setUseSimulationUI(false));
    state = reducer(state, setError('err'));
    const reset = reducer(state, resetApplicationState());
    expect(reset.useSimulationUI).toBe(false);
    expect(reset.error).toBeNull();
  });

  test('resetToInitialForm clears selections and session', () => {
    let state = reducer(initial, setSelectedApplication('a'));
    state = reducer(state, setSessionId('s1'));
    state = reducer(state, resetToInitialForm());
    expect(state.selectedApplicationId).toBe('');
    expect(state.sessionId).toBe('');
    expect(state.currentForm).toBe(Forms.APP_ONLY);
  });

  test('loading selectors compute correctly', () => {
    let state = reducer(initial, setLoadingApplications(true));
    state = reducer(state, setLoadingVersions(false));
    const full = { application: state } as any;
    expect(selectIsLoading(full)).toBe(true);
  });
});
