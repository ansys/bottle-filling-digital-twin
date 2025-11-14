import { OmniverseMessageHandler } from '../../src/services/OmniverseMessageHandler';
import { AppDispatch } from '../../src/store';
import {
  setSelectedDesignFile,
  updateSimulationProgress,
  setSimulationStatus,
  setError,
  setCanInitialize,
  setCanRun,
  setLoading,
  setStatusText,
  setStoredResults,
} from '../../src/store/slices/simulationSlice';

describe('OmniverseMessageHandler', () => {
  let dispatch: jest.MockedFunction<AppDispatch>;
  let handler: OmniverseMessageHandler;

  beforeEach(() => {
    dispatch = jest.fn();
    handler = new OmniverseMessageHandler(dispatch);
    jest.clearAllMocks();
  });

  test('ignores invalid event structure', () => {
    handler.handleCustomEvent({});
    expect(dispatch).not.toHaveBeenCalled();
  });

  test('handles simulation_progress', () => {
    handler.handleCustomEvent({ event_type: 'simulation_progress', payload: { progress: 42 } });
    expect(dispatch).toHaveBeenCalledWith(updateSimulationProgress(42));
  });

  test('handles simulation_status valid and invalid', () => {
    handler.handleCustomEvent({ event_type: 'simulation_status', payload: { status: 'running' } });
    expect(dispatch).toHaveBeenCalledWith(setSimulationStatus('running'));

    dispatch.mockClear();
    handler.handleCustomEvent({ event_type: 'simulation_status', payload: { status: 'bogus' } });
    expect(dispatch).not.toHaveBeenCalled();
  });

  test('handles design_file_loaded', () => {
    handler.handleCustomEvent({ event_type: 'design_file_loaded', payload: { designFile: 'fileA' } });
    expect(dispatch).toHaveBeenCalledWith(setSelectedDesignFile({ name: 'fileA', url: '/designs/fileA' }));
  });

  test('handles loadDesignFileResponse success and failure', () => {
    handler.handleCustomEvent({ event_type: 'loadDesignFileResponse', payload: { result: 'success' } });
    expect(dispatch).toHaveBeenCalledWith(setCanInitialize(true));
    expect(dispatch).toHaveBeenCalledWith(setLoading(false));
    expect(dispatch).toHaveBeenCalledWith(setSimulationStatus('idle'));

    dispatch.mockClear();
    handler.handleCustomEvent({ event_type: 'loadDesignFileResponse', payload: { result: 'failure' } });
    expect(dispatch).toHaveBeenCalledWith(setError('Error loading design file'));
  });

  test('handles postProcessResponse success and failure', () => {
    handler.handleCustomEvent({ event_type: 'postProcessSolutionVariableResponse', payload: { result: 'success' } });
    expect(dispatch).toHaveBeenCalledWith(setCanRun(true));
    expect(dispatch).toHaveBeenCalledWith(setLoading(false));
    expect(dispatch).toHaveBeenCalledWith(setSimulationStatus('idle'));

    dispatch.mockClear();
    handler.handleCustomEvent({ event_type: 'postProcessSolutionVariableResponse', payload: { result: 'nope' } });
    expect(dispatch).toHaveBeenCalledWith(setError('Error post-processing solution variable'));
  });

  test('handles updateStatusText', () => {
    handler.handleCustomEvent({ event_type: 'updateStatusText', payload: { text: 'hello' } });
    expect(dispatch).toHaveBeenCalledWith(setStatusText('hello'));
  });

  test('handles runCalculationsResponse success and failure', () => {
    handler.handleCustomEvent({ event_type: 'runCalculationsResponse', payload: { result: 'success' } });
    expect(dispatch).toHaveBeenCalledWith(setCanInitialize(true));
    expect(dispatch).toHaveBeenCalledWith(setCanRun(true));
    expect(dispatch).toHaveBeenCalledWith(setLoading(false));
    expect(dispatch).toHaveBeenCalledWith(setSimulationStatus('completed'));
    expect(dispatch).toHaveBeenCalledWith(setStatusText(null));

    dispatch.mockClear();
    handler.handleCustomEvent({ event_type: 'runCalculationsResponse', payload: { result: 'bad' } });
    expect(dispatch).toHaveBeenCalledWith(setError('Error during calculations'));
    expect(dispatch).toHaveBeenCalledWith(setLoading(false));
    expect(dispatch).toHaveBeenCalledWith(setSimulationStatus('error'));
  });

  test('handles openSolvedCaseResponse success and failure', () => {
    handler.handleCustomEvent({ event_type: 'openSolvedCaseResponse', payload: { result: 'success' } });
    expect(dispatch).toHaveBeenCalledWith(setLoading(false));
    expect(dispatch).toHaveBeenCalledWith(setStatusText('Solved case loaded successfully'));

    dispatch.mockClear();
    handler.handleCustomEvent({ event_type: 'openSolvedCaseResponse', payload: { result: 'fail' } });
    expect(dispatch).toHaveBeenCalledWith(setLoading(false));
    expect(dispatch).toHaveBeenCalledWith(setStatusText('Failed to load solved case'));
  });

  test('handles storedResultsResponse array and success and missing', () => {
    handler.handleCustomEvent({ event_type: 'storedResultsResponse', payload: { storedResults: ['a', 'b'] } });
    expect(dispatch).toHaveBeenCalledWith(setStoredResults(['a', 'b']));
    expect(dispatch).toHaveBeenCalledWith(setLoading(false));
    expect(dispatch).toHaveBeenCalledWith(setStatusText('Stored results loaded successfully'));

    dispatch.mockClear();
    handler.handleCustomEvent({ event_type: 'storedResultsResponse', payload: { storedResults: 'success' } });
    expect(dispatch).toHaveBeenCalledWith(setLoading(false));
    expect(dispatch).toHaveBeenCalledWith(setStatusText('Loaded Stored successfully'));

    dispatch.mockClear();
    handler.handleCustomEvent({ event_type: 'storedResultsResponse', payload: {} });
    expect(dispatch).toHaveBeenCalledWith(setLoading(false));
    expect(dispatch).toHaveBeenCalledWith(setStatusText('Failed to load stored results'));
  });

  test('handles isInstanceHealthyResponse true and false', () => {
    handler.handleCustomEvent({ event_type: 'isInstanceHealthyResponse', payload: { isHealthy: true } });
    expect(dispatch).toHaveBeenCalledWith(setLoading(false));
    expect(dispatch).toHaveBeenCalledWith(setError(null));
    expect(dispatch).toHaveBeenCalledWith(setSimulationStatus('idle'));

    dispatch.mockClear();
    handler.handleCustomEvent({ event_type: 'isInstanceHealthyResponse', payload: { isHealthy: false } });
    expect(dispatch).toHaveBeenCalledWith(setSimulationStatus('error'));
    expect(dispatch).toHaveBeenCalledWith(setError('Fluent License Required!'));
    expect(dispatch).toHaveBeenCalledWith(setLoading(false));
  });

  test('handles error event', () => {
    handler.handleCustomEvent({ event_type: 'error', payload: { error: 'oops' } });
    expect(dispatch).toHaveBeenCalledWith(setError('oops'));
  });
});
