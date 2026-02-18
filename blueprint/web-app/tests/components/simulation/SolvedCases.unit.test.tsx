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

describe('SolvedCases component', () => {
  it('renders default option when no solvedResults provided and opens visualization', () => {
    const onVisualize = jest.fn();
    render(<SolvedCases onVisualize={onVisualize} />);

    // Default option should be present
    const select = screen.getByLabelText(/Select Solved Case/i) as HTMLSelectElement;
    expect(select).toBeInTheDocument();
    expect(select.value).toBe('Select a USD File');

    // Focus to trigger retrieveStoredCases -> sendGetStoredResults (AppStreamer)
    fireEvent.focus(select);

    // Choose option and click Open
    fireEvent.change(select, { target: { value: 'Select a USD File' } });
    const openBtn = screen.getByText(/Open/i);
    fireEvent.click(openBtn);

    expect(onVisualize).toHaveBeenCalledTimes(1);
  });
});
