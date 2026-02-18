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

import SolverSetup, { DesignFile } from '@/components/simulation/SolverSetup/SolverSetup.tsx';

describe('SolverSetup component', () => {
  it('renders disabled when loading and enables selects when files present', () => {
    const files: DesignFile[] = [
      { id: '1', name: 'Design A', url: 'http://a' },
    ];

    const onSelectDesignFile = jest.fn();
    const onSelectResolution = jest.fn();
    const onOpenDesignFile = jest.fn();

    const { rerender } = render(
      <SolverSetup
        designFiles={[]}
        selectedDesignFileId={null}
        selectedResolution={'400k'}
        isLoading={true}
        isOpening={false}
        onSelectDesignFile={onSelectDesignFile}
        onSelectResolution={onSelectResolution}
        onOpenDesignFile={onOpenDesignFile}
      />
    );

    // select should be disabled when loading
    const designSelect = screen.getByLabelText('Select design file');
    expect(designSelect).toBeDisabled();

    // now provide files and ensure selection works
    rerender(
      <SolverSetup
        designFiles={files}
        selectedDesignFileId={'1'}
        selectedResolution={'400k'}
        isLoading={false}
        isOpening={false}
        onSelectDesignFile={onSelectDesignFile}
        onSelectResolution={onSelectResolution}
        onOpenDesignFile={onOpenDesignFile}
      />
    );

    expect(screen.getByText('Design A')).toBeInTheDocument();

  // open button should be enabled - prefer aria-label
  const openButton = screen.getByLabelText('Open selected design file');
  expect(openButton).toBeEnabled();

  fireEvent.click(openButton);
  expect(onOpenDesignFile).toHaveBeenCalled();
  });
});
