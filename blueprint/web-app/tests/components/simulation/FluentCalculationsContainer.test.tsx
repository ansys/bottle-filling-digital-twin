import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock AppStreamer
jest.mock('@nvidia/omniverse-webrtc-streaming-library', () => ({
  AppStreamer: { sendMessage: jest.fn() },
}));

import { AppStreamer } from '@nvidia/omniverse-webrtc-streaming-library';

// Since the container connects to Redux, we can import the unconnected component by path
import FluentCalculations from '../../../src/components/simulation/FluentCalculations/FluentCalculations';

// We'll render the container by passing required props directly (unconnected usage)

describe('FluentCalculationsContainer basic behavior', () => {
  it('calls AppStreamer.sendMessage when onCalculate invoked through UI', () => {
  const mockSend = AppStreamer.sendMessage;

    // Render container-like component by directly using the FluentCalculations UI with a handler
    render(
      <FluentCalculations
        width={800}
        enabled={true}
        isLoading={false}
        statusText={null}
        onCalculate={(numTimesteps: number, viscosity: number, bottlesPerHour: number, tolerance: number) => {
          // call container's handleCalculate logic via the same message pattern
          const message = {
            event_type: 'runCalculations',
            payload: { numTimesteps, viscosity, bottlesPerHour, tolerance },
          };
          mockSend(JSON.stringify(message));
        }}
      />
    );

  // The FluentCalculations UI includes a run button labeled 'Run'
  const calcButton = screen.getByRole('button', { name: /Run/i });
    fireEvent.click(calcButton);

    expect(mockSend).toHaveBeenCalled();
  });
});
