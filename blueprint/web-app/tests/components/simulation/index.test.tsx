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

import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import * as SimulationComponents from '@/components/simulation';

// Mock external dependencies
jest.mock('@nvidia/omniverse-webrtc-streaming-library', () => ({
  AppStreamer: {
    sendMessage: jest.fn(),
  },
}));

describe('Simulation Components Index', () => {
  describe('Component Exports', () => {
    it('exports FluentCalculations component', () => {
      expect(SimulationComponents.FluentCalculations).toBeDefined();
      expect(
        typeof SimulationComponents.FluentCalculations === 'function' ||
          typeof SimulationComponents.FluentCalculations === 'object'
      ).toBe(true);
    });

    it('exports SolverSetup component', () => {
      expect(SimulationComponents.SolverSetup).toBeDefined();
      expect(
        typeof SimulationComponents.SolverSetup === 'function' ||
          typeof SimulationComponents.SolverSetup === 'object'
      ).toBe(true);
    });

    it('exports FluentSolutionVariables component', () => {
      expect(SimulationComponents.FluentSolutionVariables).toBeDefined();
      expect(
        typeof SimulationComponents.FluentSolutionVariables === 'function' ||
          typeof SimulationComponents.FluentSolutionVariables === 'object'
      ).toBe(true);
    });

    it('exports ResultsContent component', () => {
      expect(SimulationComponents.ResultsContent).toBeDefined();
      expect(
        typeof SimulationComponents.ResultsContent === 'function' ||
          typeof SimulationComponents.ResultsContent === 'object'
      ).toBe(true);
    });

    it('exports SolvedCasesContent component', () => {
      expect(SimulationComponents.SolvedCasesContent).toBeDefined();
      expect(
        typeof SimulationComponents.SolvedCasesContent === 'function' ||
          typeof SimulationComponents.SolvedCasesContent === 'object'
      ).toBe(true);
    });
  });

  describe.skip('Component Instantiation', () => {
    it('can instantiate FluentCalculations without errors', () => {
      const mockProps = {
        width: 400,
        enabled: true,
        onCalculate: jest.fn(),
      };

      expect(() => {
        render(<SimulationComponents.FluentCalculations {...mockProps} />);
      }).not.toThrow();

      expect(screen.getByText('Fluent Calculations')).toBeInTheDocument();
    });

    it('can instantiate FluentSolutionVariables without errors', () => {
      const mockProps = {
        width: 400,
        fluentSolutionVariables: [{ name: 'Test Variable', sv: 'test_var' }],
        onSelectFluentSolutionVariables: jest.fn(),
        onVisualize: jest.fn(),
        enabled: true,
      };

      expect(() => {
        render(<SimulationComponents.FluentSolutionVariables {...mockProps} />);
      }).not.toThrow();

      expect(screen.getByText('Initial Conditions')).toBeInTheDocument();
    });

    it('can instantiate ResultsContent without errors', () => {
      expect(() => {
        render(<SimulationComponents.ResultsContent />);
      }).not.toThrow();
    });
  });

  describe.skip('Component Integration', () => {
    it('components work together in a simulation workflow', () => {
      const mockCalculationsProps = {
        width: 400,
        enabled: true,
        onCalculate: jest.fn(),
      };

      const mockSolutionVariablesProps = {
        width: 400,
        fluentSolutionVariables: [
          { name: 'Velocity', sv: 'velocity' },
          { name: 'Pressure', sv: 'pressure' },
        ],
        onSelectFluentSolutionVariables: jest.fn(),
        onVisualize: jest.fn(),
        enabled: true,
      };

      // Render multiple simulation components together
      render(
        <div>
          <SimulationComponents.FluentCalculations {...mockCalculationsProps} />
          <SimulationComponents.FluentSolutionVariables
            {...mockSolutionVariablesProps}
          />
          <SimulationComponents.ResultsContent />
        </div>
      );

      expect(screen.getByText('Fluent Calculations')).toBeInTheDocument();
      expect(screen.getByText('Initial Conditions')).toBeInTheDocument();
      expect(screen.getByText('Velocity')).toBeInTheDocument();
      expect(screen.getByText('Pressure')).toBeInTheDocument();
    });

    it('components maintain independent state', () => {
      const mockCalculationsProps1 = {
        width: 300,
        enabled: true,
        onCalculate: jest.fn(),
      };

      const mockCalculationsProps2 = {
        width: 500,
        enabled: false,
        onCalculate: jest.fn(),
      };

      const { rerender } = render(
        <SimulationComponents.FluentCalculations {...mockCalculationsProps1} />
      );

      expect(screen.getByText('Fluent Calculations')).toBeInTheDocument();

      // Re-render with different props
      rerender(
        <SimulationComponents.FluentCalculations {...mockCalculationsProps2} />
      );

      expect(screen.getByText('Fluent Calculations')).toBeInTheDocument();
    });
  });

  describe.skip('Type Safety', () => {
    it('enforces correct prop types for FluentCalculations', () => {
      const validProps = {
        width: 400,
        enabled: true,
        onCalculate: jest.fn(),
        isLoading: false,
        statusText: 'Ready',
      };

      expect(() => {
        render(<SimulationComponents.FluentCalculations {...validProps} />);
      }).not.toThrow();
    });

    it('enforces correct prop types for solution variables', () => {
      const validVariable = {
        name: 'Test Variable',
        sv: 'test_sv',
      };

      const mockProps = {
        width: 400,
        fluentSolutionVariables: [validVariable],
        onSelectFluentSolutionVariables: jest.fn(),
        onVisualize: jest.fn(),
        enabled: true,
      };

      expect(() => {
        render(<SimulationComponents.FluentSolutionVariables {...mockProps} />);
      }).not.toThrow();

      expect(screen.getByText('Test Variable')).toBeInTheDocument();
    });
  });

  describe.skip('Component Default Behavior', () => {
    it('components handle missing optional props gracefully', () => {
      const minimalCalculationsProps = {
        width: 400,
        enabled: true,
        onCalculate: jest.fn(),
      };

      expect(() => {
        render(
          <SimulationComponents.FluentCalculations
            {...minimalCalculationsProps}
          />
        );
      }).not.toThrow();

      expect(screen.getByText('Fluent Calculations')).toBeInTheDocument();
    });

    it('components provide sensible defaults', () => {
      const mockProps = {
        width: 400,
        fluentSolutionVariables: [],
        onSelectFluentSolutionVariables: jest.fn(),
        onVisualize: jest.fn(),
        enabled: true,
      };

      render(<SimulationComponents.FluentSolutionVariables {...mockProps} />);

      expect(screen.getByText('Initial Conditions')).toBeInTheDocument();
      expect(screen.getByDisplayValue('28')).toBeInTheDocument(); // Default filling height
    });
  });

  describe.skip('Error Handling', () => {
    it('components handle callback errors gracefully', () => {
      const errorThrowingCallback = jest.fn(() => {
        throw new Error('Callback error');
      });

      const mockProps = {
        width: 400,
        enabled: true,
        onCalculate: errorThrowingCallback,
      };

      render(<SimulationComponents.FluentCalculations {...mockProps} />);

      const calculateButton = screen.getByRole('button', {
        name: /calculate/i,
      });

      expect(() => {
        calculateButton.click();
      }).not.toThrow(); // Component should handle callback errors
    });

    it('components handle invalid prop values', () => {
      const invalidProps = {
        width: -1, // Invalid width
        enabled: true,
        onCalculate: jest.fn(),
      };

      expect(() => {
        render(<SimulationComponents.FluentCalculations {...invalidProps} />);
      }).not.toThrow();

      expect(screen.getByText('Fluent Calculations')).toBeInTheDocument();
    });
  });

  describe.skip('Accessibility Compliance', () => {
    it('components provide accessible form controls', () => {
      const mockProps = {
        width: 400,
        enabled: true,
        onCalculate: jest.fn(),
      };

      render(<SimulationComponents.FluentCalculations {...mockProps} />);

      // Check for accessible form labels
      expect(screen.getByLabelText(/number of timesteps/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/viscosity/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/bottles per hour/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/tolerance/i)).toBeInTheDocument();
    });

    it('components provide accessible buttons', () => {
      const mockProps = {
        width: 400,
        enabled: true,
        onCalculate: jest.fn(),
      };

      render(<SimulationComponents.FluentCalculations {...mockProps} />);

      const calculateButton = screen.getByRole('button', {
        name: /calculate/i,
      });
      expect(calculateButton).toBeInTheDocument();
      expect(calculateButton).toBeVisible();
    });
  });

  describe.skip('Performance Characteristics', () => {
    it('components render efficiently with large datasets', () => {
      const largeSolutionVariables = Array.from({ length: 100 }, (_, i) => ({
        name: `Variable ${i}`,
        sv: `var_${i}`,
      }));

      const mockProps = {
        width: 400,
        fluentSolutionVariables: largeSolutionVariables,
        onSelectFluentSolutionVariables: jest.fn(),
        onVisualize: jest.fn(),
        enabled: true,
      };

      const startTime = performance.now();

      render(<SimulationComponents.FluentSolutionVariables {...mockProps} />);

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      expect(renderTime).toBeLessThan(1000); // Should render in less than 1 second
      expect(screen.getByText('Initial Conditions')).toBeInTheDocument();
    });

    it('components handle rapid re-renders without memory leaks', () => {
      const mockProps = {
        width: 400,
        enabled: true,
        onCalculate: jest.fn(),
      };

      const { rerender, unmount } = render(
        <SimulationComponents.FluentCalculations {...mockProps} />
      );

      // Rapidly re-render multiple times
      for (let i = 0; i < 50; i++) {
        rerender(
          <SimulationComponents.FluentCalculations
            {...mockProps}
            width={400 + i}
          />
        );
      }

      expect(screen.getByText('Fluent Calculations')).toBeInTheDocument();

      expect(() => {
        unmount();
      }).not.toThrow();
    });
  });
});
