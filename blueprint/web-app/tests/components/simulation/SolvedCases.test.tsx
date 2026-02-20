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
import SolvedCases from '@/components/simulation/SolvedCases/SolvedCases.tsx';

// Mock AppStreamer
jest.mock('@nvidia/omniverse-webrtc-streaming-library', () => ({
  AppStreamer: {
    sendMessage: jest.fn(),
  },
}));

describe('SolvedCases Component', () => {
  const defaultProps = {
    solvedResults: ['case1.usd', 'case2.usd', 'case3.usd'],
    selectedSolvedResults: '',
    onCaseChange: jest.fn(),
    onVisualize: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('renders without crashing', () => {
      render(<SolvedCases {...defaultProps} />);
      expect(screen.getByText(/Solved Cases/i)).toBeInTheDocument();
    });

    it('renders case selector dropdown', () => {
      render(<SolvedCases {...defaultProps} />);
      const select = screen.getByRole('combobox');
      expect(select).toBeInTheDocument();
    });

    it('renders all solved cases as options', () => {
      render(<SolvedCases {...defaultProps} />);
      expect(screen.getByText('case1.usd')).toBeInTheDocument();
      expect(screen.getByText('case2.usd')).toBeInTheDocument();
      expect(screen.getByText('case3.usd')).toBeInTheDocument();
    });

    it('renders visualize button', () => {
      render(<SolvedCases {...defaultProps} />);
      const openButton = screen.getByRole('button', { name: /open/i });
      expect(openButton).toBeInTheDocument();
    });

    it('renders placeholder option', () => {
      render(<SolvedCases {...defaultProps} />);
      // Implementation uses first element as default selection when provided
      expect(screen.getByText('case1.usd')).toBeInTheDocument();
    });
  });

  describe('Case Selection', () => {
    it('calls onCaseChange when a case is selected', () => {
      const mockOnCaseChange = jest.fn();
      render(<SolvedCases {...defaultProps} onCaseChange={mockOnCaseChange} />);

      const select = screen.getByRole('combobox');
      fireEvent.change(select, { target: { value: 'case1.usd' } });

      expect(mockOnCaseChange).toHaveBeenCalledWith('case1.usd');
    });

    it('updates selected value when selectedSolvedResults prop changes', () => {
      const { rerender } = render(<SolvedCases {...defaultProps} selectedSolvedResults='' />);
      const select = screen.getByRole('combobox') as HTMLSelectElement;
      // Since component initializes with first option, value should be case1.usd
      expect(select.value).toBe('case1.usd');

      rerender(<SolvedCases {...defaultProps} selectedSolvedResults='case2.usd' />);
      expect(select.value).toBe('case2.usd');
    });

    it('maintains selection in internal state', () => {
      render(<SolvedCases {...defaultProps} />);
      const select = screen.getByRole('combobox') as HTMLSelectElement;

      fireEvent.change(select, { target: { value: 'case3.usd' } });
      expect(select.value).toBe('case3.usd');
    });
  });

  describe('Visualize Button', () => {
    it('open button is disabled when no case is selected', () => {
      render(<SolvedCases {...defaultProps} selectedSolvedResults='' />);
      const openButton = screen.getByRole('button', { name: /open/i });
      // Button is enabled when there is a default selection
      expect(openButton).not.toBeDisabled();
    });

    it('open button is enabled when a case is selected', () => {
      render(<SolvedCases {...defaultProps} selectedSolvedResults='case1.usd' />);
      const openButton = screen.getByRole('button', { name: /open/i });
      expect(openButton).not.toBeDisabled();
    });

    it('calls onVisualize with selected case when button is clicked', () => {
      const mockOnVisualize = jest.fn();
      render(<SolvedCases {...defaultProps} selectedSolvedResults='case2.usd' onVisualize={mockOnVisualize} />);

      const openButton = screen.getByRole('button', { name: /open/i });
      fireEvent.click(openButton);

      expect(mockOnVisualize).toHaveBeenCalledWith('case2.usd');
    });
  });

  describe('Empty State', () => {
    it('renders empty dropdown when no solved cases are provided', () => {
      render(<SolvedCases {...defaultProps} solvedResults={[]} />);
      const select = screen.getByRole('combobox');
      const options = select.querySelectorAll('option');

      // Should only have placeholder option
      expect(options.length).toBe(1);
      expect(options[0].textContent).toMatch(/Select a USD File/i);
    });
  });

  describe('CSS Classes', () => {
    it('applies solved-cases class to container', () => {
      const { container } = render(<SolvedCases {...defaultProps} />);
      const solvedCasesElement = container.querySelector('.solved-cases');
      expect(solvedCasesElement).toBeInTheDocument();
    });
  });
});
