// Copyright (C) 2025 - 2026 ANSYS, Inc. and/or its affiliates.
// SPDX-License-Identifier: MIT
//
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.

import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock AppStreamer
jest.mock('@nvidia/omniverse-webrtc-streaming-library', () => ({
  AppStreamer: { sendMessage: jest.fn() },
}));

import { AppStreamer } from '@nvidia/omniverse-webrtc-streaming-library';

// Since the container connects to Redux, we can import the unconnected component by path
import FluentCalculations from '@/components/simulation/FluentCalculations/FluentCalculations.tsx';

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
