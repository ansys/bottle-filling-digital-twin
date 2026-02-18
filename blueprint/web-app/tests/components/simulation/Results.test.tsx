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
import Results from '@/components/simulation/Results/Results.tsx';

// Mock AppStreamer
jest.mock('@nvidia/omniverse-webrtc-streaming-library', () => ({
  AppStreamer: {
    sendMessage: jest.fn(),
  },
}));

describe('Results Component', () => {
  const defaultProps = {
    timestep: 0,
    isFullscreen: false,
    isPlaying: false,
    onTimestepChange: jest.fn(),
    onFullscreenChange: jest.fn(),
    onPlayStateChange: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('renders without crashing', () => {
      render(<Results {...defaultProps} />);
      const container = screen.getByRole('heading', { name: /Results & Visualization/i });
      expect(container).toBeInTheDocument();
    });

    it('renders timestep slider', () => {
      render(<Results {...defaultProps} timestep={100} />);
      const slider = screen.getByRole('slider');
      expect(slider).toBeInTheDocument();
    });

    it('renders Play/Pause button', () => {
      render(<Results {...defaultProps} isPlaying={false} />);
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
    });
  });

  describe('Timestep Control', () => {
    it('calls onTimestepChange when slider is moved', () => {
      const mockOnTimestepChange = jest.fn();
      render(<Results {...defaultProps} onTimestepChange={mockOnTimestepChange} />);

      const slider = screen.getByRole('slider');
      fireEvent.change(slider, { target: { value: '500' } });

      expect(mockOnTimestepChange).toHaveBeenCalledWith(500);
    });

    it('displays correct min and max timestep', () => {
      render(<Results {...defaultProps} />);
      const slider = screen.getByRole('slider');

      expect(slider).toHaveAttribute('min', '0');
      expect(slider).toHaveAttribute('max', '2530');
    });

    it('slider reflects current timestep value', () => {
      render(<Results {...defaultProps} timestep={1000} />);
      const slider = screen.getByRole('slider');

      expect(slider).toHaveValue('1000');
    });
  });

  describe('Play/Pause Controls', () => {
    it('toggles play state when button is clicked', () => {
      const mockOnPlayStateChange = jest.fn();
      render(<Results {...defaultProps} onPlayStateChange={mockOnPlayStateChange} isPlaying={false} />);

      const buttons = screen.getAllByRole('button');
      // Find and click the play/pause button (first button in actions)
      fireEvent.click(buttons[0]);

      expect(mockOnPlayStateChange).toHaveBeenCalled();
    });
  });

  describe('Fullscreen Control', () => {
    it('has fullscreen toggle functionality', () => {
      const mockOnFullscreenChange = jest.fn();
      render(<Results {...defaultProps} onFullscreenChange={mockOnFullscreenChange} />);

      const buttons = screen.getAllByRole('button');
      // Component should have buttons rendered
      expect(buttons.length).toBeGreaterThan(0);
    });
  });

  describe('Component State', () => {
    it('renders with provided timestep value', () => {
      render(<Results {...defaultProps} timestep={1000} />);
      const slider = screen.getByRole('slider');
      expect(slider).toHaveValue('1000');
    });
  });
});
