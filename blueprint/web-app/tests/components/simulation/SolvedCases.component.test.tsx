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

jest.mock('@nvidia/omniverse-webrtc-streaming-library', () => ({
  AppStreamer: { sendMessage: jest.fn() },
}));

import SolvedCases from '@/components/simulation/SolvedCases/SolvedCases.tsx';
import { AppStreamer } from '@nvidia/omniverse-webrtc-streaming-library';

describe('SolvedCases component', () => {
  afterEach(() => jest.clearAllMocks());

  it('shows fallback when no solved results and calls sendGetStoredResults on focus', () => {
    const onRequestStoredResults = jest.fn();
    render(
      <SolvedCases
        solvedResults={[]}
        selectedSolvedResults={undefined}
        onRequestStoredResults={onRequestStoredResults}
      />
    );

    // fallback option
    expect(screen.getByText('Select a USD File')).toBeInTheDocument();

    // focus should trigger container callback
    const select = screen.getByRole('combobox');
    fireEvent.focus(select);
    expect(onRequestStoredResults).toHaveBeenCalled();
  });

  it('visualize sends AppStreamer message and calls onVisualize', () => {
    const onVisualize = jest.fn();
    render(
      <SolvedCases
        solvedResults={["case1.usd"]}
        selectedSolvedResults={undefined}
        onVisualize={onVisualize}
      />
    );

    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: 'case1.usd' } });

    const openButton = screen.getByRole('button', { name: /Open/i });
    fireEvent.click(openButton);

    expect(onVisualize).toHaveBeenCalledWith('case1.usd');
    expect(AppStreamer.sendMessage).toHaveBeenCalled();
  });
});
