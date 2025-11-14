import { useState, useCallback } from 'react';

export type WorkflowStepId =
  | 'solver-setup'
  | 'initial-conditions'
  | 'calculations'
  | 'results'
  | 'solved-cases';

export interface WorkflowStep {
  id: WorkflowStepId;
  title: string;
  stepNumber: number;
  dependencies: WorkflowStepId[];
}

export interface TabState {
  isOpen: boolean;
  isEnabled: boolean;
  isCompleted: boolean;
  isLoading: boolean;
  statusText?: string;
}

export interface UseTabWorkflowProps {
  steps: WorkflowStep[];
  initialOpenStep?: WorkflowStepId;
  onStepCompleted?: (stepId: WorkflowStepId) => void;
}

export interface UseTabWorkflowReturn {
  tabStates: Record<WorkflowStepId, TabState>;
  toggleTab: (stepId: WorkflowStepId) => void;
  setTabLoading: (
    stepId: WorkflowStepId,
    loading: boolean,
    statusText?: string
  ) => void;
  completeStep: (stepId: WorkflowStepId) => void;
  enableTab: (stepId: WorkflowStepId) => void;
}

export const useTabWorkflow = ({
  steps,
  initialOpenStep,
  onStepCompleted,
}: UseTabWorkflowProps): UseTabWorkflowReturn => {
  const [tabStates, setTabStates] = useState<Record<WorkflowStepId, TabState>>(
    () => {
      const initialStates: Record<string, TabState> = {};
      steps.forEach((step, index) => {
        initialStates[step.id] = {
          isOpen: step.id === (initialOpenStep || steps[0]?.id),
          isEnabled: index === 0, // Only the first step is enabled initially
          isCompleted: false,
          isLoading: false,
        };
      });
      return initialStates as Record<WorkflowStepId, TabState>;
    }
  );

  const toggleTab = useCallback(
    (stepId: WorkflowStepId) => {
      setTabStates(prev => {
        const newStates = { ...prev };
        steps.forEach(step => {
          if (step.id !== stepId) {
            newStates[step.id] = { ...newStates[step.id], isOpen: false };
          }
        });
        newStates[stepId] = {
          ...newStates[stepId],
          isOpen: !prev[stepId]?.isOpen,
        };
        return newStates;
      });
    },
    [steps]
  );

  const setTabLoading = useCallback(
    (stepId: WorkflowStepId, loading: boolean, statusText?: string) => {
      setTabStates(prev => ({
        ...prev,
        [stepId]: { ...prev[stepId], isLoading: loading, statusText },
      }));
    },
    []
  );

  const completeStep = useCallback(
    (stepId: WorkflowStepId) => {
      setTabStates(prev => {
        const newStates = { ...prev };
        newStates[stepId] = {
          ...newStates[stepId],
          isCompleted: true,
          isLoading: false,
          statusText: undefined,
        };

        steps.forEach(step => {
          if (step.dependencies.includes(stepId)) {
            const allDepsCompleted = step.dependencies.every(
              depId => depId === stepId || newStates[depId]?.isCompleted
            );
            if (allDepsCompleted) {
              newStates[step.id] = { ...newStates[step.id], isEnabled: true };
            }
          }
        });

        const currentStepIndex = steps.findIndex(s => s.id === stepId);
        const nextSteps = steps.slice(currentStepIndex + 1);

        for (const nextStep of nextSteps) {
          const nextState = newStates[nextStep.id];
          const isNextEnabled = nextStep.dependencies.every(
            depId => newStates[depId]?.isCompleted
          );
          if (isNextEnabled && !nextState?.isCompleted) {
            newStates[stepId] = { ...newStates[stepId], isOpen: false };
            newStates[nextStep.id] = {
              ...newStates[nextStep.id],
              isOpen: true,
            };
            break;
          }
        }

        return newStates;
      });

      if (onStepCompleted) {
        onStepCompleted(stepId);
      }
    },
    [steps, onStepCompleted]
  );

  const enableTab = useCallback((stepId: WorkflowStepId) => {
    setTabStates(prev => ({
      ...prev,
      [stepId]: { ...prev[stepId], isEnabled: true },
    }));
  }, []);

  return { tabStates, toggleTab, setTabLoading, completeStep, enableTab };
};
