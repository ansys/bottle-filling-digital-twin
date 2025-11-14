import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';

// Mock AppStreamer with a successful send
jest.mock('@nvidia/omniverse-webrtc-streaming-library', () => ({
  AppStreamer: { sendMessage: jest.fn() },
}));

import FluentCalculationsContainer from '../../../src/components/simulation/FluentCalculations/FluentCalculationsContainer';
import simulationReducer, { setCanRun } from '../../../src/store/slices/simulationSlice';
import fluentReducer from '../../../src/store/slices/fluentSlice';
import { AppStreamer } from '@nvidia/omniverse-webrtc-streaming-library';

describe('FluentCalculationsContainer success path', () => {
  it('sends message and sets simulation status to running', () => {
    const store = configureStore({
      reducer: { simulation: simulationReducer, fluent: fluentReducer },
    });

    // enable running
    store.dispatch(setCanRun(true));

    render(
      <Provider store={store}>
        <FluentCalculationsContainer width={600} />
      </Provider>
    );

    const runButton = screen.getByRole('button', { name: /Run/i });
    fireEvent.click(runButton);

    const state = store.getState();
    expect(state.simulation.isLoading).toBe(true);
    expect(state.simulation.simulationStatus).toBe('running');

  expect(AppStreamer.sendMessage).toHaveBeenCalled();
  });
});
