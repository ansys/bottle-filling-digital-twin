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

import { renderHook, act } from '@testing-library/react';
import { useTabWorkflow } from '@/hooks/useTabWorkflow.ts';
import type { WorkflowStep, WorkflowStepId } from '@/hooks/useTabWorkflow.ts';

const steps: WorkflowStep[] = [
  { id: 'solver-setup' as WorkflowStepId, title: 'Solver', stepNumber: 1, dependencies: [] },
  { id: 'initial-conditions' as WorkflowStepId, title: 'Init', stepNumber: 2, dependencies: ['solver-setup' as WorkflowStepId] },
  { id: 'calculations' as WorkflowStepId, title: 'Calc', stepNumber: 3, dependencies: ['initial-conditions' as WorkflowStepId] },
];

describe('useTabWorkflow', () => {
  test('initializes tab states and toggles', () => {
    const { result } = renderHook(() => useTabWorkflow({ steps }));
    const { tabStates, toggleTab } = result.current;
    expect(tabStates['solver-setup'].isOpen).toBe(true);
    act(() => toggleTab('solver-setup'));
    expect(result.current.tabStates['solver-setup'].isOpen).toBe(false);
  });

  test('completeStep marks and opens next enabled step', () => {
    const onCompleted = jest.fn();
    const { result } = renderHook(() => useTabWorkflow({ steps, onStepCompleted: onCompleted }));
    act(() => result.current.completeStep('solver-setup'));
    expect(result.current.tabStates['solver-setup'].isCompleted).toBe(true);
    expect(onCompleted).toHaveBeenCalledWith('solver-setup');
    // initial-conditions depends on solver-setup so should become enabled/open
    expect(result.current.tabStates['initial-conditions'].isEnabled).toBe(true);
  });
});
