import { renderHook, act } from '@testing-library/react';
import { useTabWorkflow } from '../../src/hooks/useTabWorkflow';
import type { WorkflowStep, WorkflowStepId } from '../../src/hooks/useTabWorkflow';

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
