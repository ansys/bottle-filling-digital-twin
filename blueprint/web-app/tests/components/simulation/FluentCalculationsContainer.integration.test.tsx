import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';

// Mock AppStreamer to throw to exercise the error path in the container
jest.mock('@nvidia/omniverse-webrtc-streaming-library', () => ({
  AppStreamer: { sendMessage: jest.fn(() => { throw new Error('send failed'); }) },
}));

import FluentCalculationsContainer from '../../../src/components/simulation/FluentCalculations/FluentCalculationsContainer';
import simulationReducer, { setCanRun } from '../../../src/store/slices/simulationSlice';
import fluentReducer from '../../../src/store/slices/fluentSlice';

describe('FluentCalculationsContainer integration', () => {
  it('handles AppStreamer.sendMessage failure and updates simulation state', () => {
    const store = configureStore({
      reducer: {
        simulation: simulationReducer,
        fluent: fluentReducer,
      },
    });

    // Enable running in the simulation slice so the Run button is enabled
    store.dispatch(setCanRun(true));

    render(
      <Provider store={store}>
        {/* Render the connected container which will render the FluentCalculations UI */}
        <FluentCalculationsContainer width={600} />
      </Provider>
    );

    // Find the Run button from the UI and click it to trigger the container's handleCalculate
    const runButton = screen.getByRole('button', { name: /Run/i });
    fireEvent.click(runButton);

    // After the failure, the container should have dispatched setLoading(false) and setSimulationStatus('error')
    const state = store.getState();
    expect(state.simulation.isLoading).toBe(false);
    expect(state.simulation.simulationStatus).toBe('error');
  });
});
