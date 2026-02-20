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

import { render, fireEvent } from '@testing-library/react';
import FluentSolutionVariables from '@/components/simulation/FluentSolutionVariables/FluentSolutionVariables.tsx';

const sampleVars = [
  { name: 'Velocity', sv: 'SV_V' },
  { name: 'Volume of Fluids', sv: 'SV_VOF' },
];

describe('FluentSolutionVariables', () => {
  it('initializes selected index from selectedSolutionVariable prop', () => {
    const { getByLabelText } = render(
      <FluentSolutionVariables
        width={300}
        fluentSolutionVariables={sampleVars}
        selectedSolutionVariable={'SV_VOF'}
        onSelectFluentSolutionVariables={() => {}}
        onVisualize={() => {}}
        enabled={true}
      />
    );

    const select = getByLabelText('Select solution variable') as HTMLSelectElement;
    // selected index should be 1 (second item)
    expect(select.value).toBe('1');
  });

  it('calls onSelectFluentSolutionVariables when selection changes', () => {
    const onSelect = jest.fn();
    const { getByLabelText } = render(
      <FluentSolutionVariables
        width={300}
        fluentSolutionVariables={sampleVars}
        selectedSolutionVariable={undefined}
        onSelectFluentSolutionVariables={onSelect}
        onVisualize={() => {}}
        enabled={true}
      />
    );

    const select = getByLabelText('Select solution variable') as HTMLSelectElement;
    fireEvent.change(select, { target: { value: '0' } });
    expect(onSelect).toHaveBeenCalled();
  });

  it('componentDidUpdate updates state when selectedSolutionVariable prop changes', () => {
    const { rerender, getByLabelText } = render(
      <FluentSolutionVariables
        width={300}
        fluentSolutionVariables={sampleVars}
        selectedSolutionVariable={undefined}
        onSelectFluentSolutionVariables={() => {}}
        onVisualize={() => {}}
        enabled={true}
      />
    );

    rerender(
      <FluentSolutionVariables
        width={300}
        fluentSolutionVariables={sampleVars}
        selectedSolutionVariable={'SV_V'}
        onSelectFluentSolutionVariables={() => {}}
        onVisualize={() => {}}
        enabled={true}
      />
    );

    const select = getByLabelText('Select solution variable') as HTMLSelectElement;
    expect(select.value).toBe('0');
  });

  it('onVisualize calls onVisualize with selected sv or falls back to first', () => {
    const onVisualize = jest.fn();
    const { getByText } = render(
      <FluentSolutionVariables
        width={300}
        fluentSolutionVariables={sampleVars}
        selectedSolutionVariable={undefined}
        onSelectFluentSolutionVariables={() => {}}
        onVisualize={onVisualize}
        enabled={true}
      />
    );

    const button = getByText('Initialize') as HTMLButtonElement;
    fireEvent.click(button);
    expect(onVisualize).toHaveBeenCalled();
  });
});
