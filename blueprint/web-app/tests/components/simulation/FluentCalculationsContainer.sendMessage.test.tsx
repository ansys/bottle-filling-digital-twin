import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';

jest.mock('@nvidia/omniverse-webrtc-streaming-library', () => ({
  AppStreamer: {
    sendMessage: jest.fn(),
  },
}));

import ConnectedFluentCalculationsContainer from '../../../src/components/simulation/FluentCalculations/FluentCalculationsContainer';
import { configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import simulationReducer from '../../../src/store/slices/simulationSlice';
import fluentReducer from '../../../src/store/slices/fluentSlice';
import { AppStreamer } from '@nvidia/omniverse-webrtc-streaming-library';

describe('FluentCalculationsContainer integration', () => {
  it('sends runCalculations message and sets loading/status', () => {
    const store = configureStore({
      reducer: { simulation: simulationReducer, fluent: fluentReducer },
    });
    // enable canRun in store so container renders as enabled
    store.dispatch({ type: 'simulation/setCanRun', payload: true });

    render(
      <Provider store={store}>
        <ConnectedFluentCalculationsContainer width={600} />
      </Provider>
    );

    // Find Run button and click
    const runButton = screen.getByRole('button', { name: /Run/i });
    fireEvent.click(runButton);

    expect(AppStreamer.sendMessage).toHaveBeenCalled();

    const simState = store.getState().simulation;
    expect(simState.isLoading).toBe(true);
    expect(simState.simulationStatus).toBe('running');
  });
});
