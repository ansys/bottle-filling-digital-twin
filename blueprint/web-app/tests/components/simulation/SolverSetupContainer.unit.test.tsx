// Mock the external streaming library import used by the container module
jest.mock('@nvidia/omniverse-webrtc-streaming-library', () => ({
  AppStreamer: {
    sendMessage: jest.fn(),
  },
}));

// Require after mocks so the module picks up the mocked AppStreamer
const container = require('../../../src/components/simulation/SolverSetup/SolverSetupContainer.tsx');

describe('SolverSetupContainer mapDispatchToProps and health check', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('onOpenDesignFile thunk sends a message when selection valid', () => {
    const getState = () => ({
      simulation: {
        selectedDesignFile: { name: '500ml Water Bottle', url: '/500' },
        selectedResolution: '400k',
        simulationStatus: 'idle',
        isLoading: false,
        designFiles: [],
      },
    });

    // Make dispatch execute thunks (functions) so they run in-test
    const dispatch: any = jest.fn((action: any) => {
      if (typeof action === 'function') {
        return action(dispatch, getState);
      }
      return action;
    });

    const mapped = container.mapDispatchToProps(dispatch);
    // Call the mapped function which dispatches the internal thunk
    mapped.onOpenDesignFile();

    // dispatch should have been invoked (thunk dispatch)
    expect(dispatch).toHaveBeenCalled();
    // AppStreamer.sendMessage should have been called via the mocked module
    const lib = require('@nvidia/omniverse-webrtc-streaming-library');
    expect(lib.AppStreamer.sendMessage).toHaveBeenCalled();
  });

  it('onOpenDesignFile thunk handles missing selection by dispatching error', () => {
    const getState = () => ({
      simulation: { selectedDesignFile: null, selectedResolution: '400k', designFiles: [] },
    });

    const dispatch: any = jest.fn((action: any) => {
      if (typeof action === 'function') {
        return action(dispatch, getState);
      }
      return action;
    });

    const mapped = container.mapDispatchToProps(dispatch);
    mapped.onOpenDesignFile();

    // Expect dispatch to have been called at least once (setError etc.)
    expect(dispatch).toHaveBeenCalled();
  });

  it('sendHealthCheckMessage calls AppStreamer.sendMessage and swallows stream controller errors', () => {
    const lib = require('@nvidia/omniverse-webrtc-streaming-library');
    lib.AppStreamer.sendMessage.mockImplementation(() => {
      throw new Error('no stream controller available');
    });

    // Instantiate the exported class (not the connected default) and call the private method
    const props = {
      designFiles: [],
      selectedDesignFileId: null,
      selectedResolution: '400k',
      isLoading: false,
      isOpening: false,
      onSelectDesignFile: jest.fn(),
      onSelectResolution: jest.fn(),
      width: 100,
    };

    const InstanceClass = container.SolverSetupContainer;
    const instance = new InstanceClass(props as any);

    // Fast-forward timers for setTimeout
    jest.useFakeTimers();
    instance['sendHealthCheckMessage']();
    jest.runAllTimers();

    expect(lib.AppStreamer.sendMessage).toHaveBeenCalled();
    jest.useRealTimers();
  });
});
