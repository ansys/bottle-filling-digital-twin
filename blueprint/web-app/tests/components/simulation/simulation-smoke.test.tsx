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

import { render } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import '@testing-library/jest-dom';

// Import simulation components that were previously skipped
import FluentCalculationsContainer from '@/components/simulation/FluentCalculations/FluentCalculationsContainer.tsx';
import FluentSolutionVariables from '@/components/simulation/FluentSolutionVariables/FluentSolutionVariables.tsx';
import FluentSolutionVariablesContainer from '@/components/simulation/FluentSolutionVariables/FluentSolutionVariablesContainer.tsx';
import SolverSetup from '@/components/simulation/SolverSetup/SolverSetup.tsx';
import SolverSetupContainer from '@/components/simulation/SolverSetup/SolverSetupContainer.tsx';
import Results from '@/components/simulation/Results/Results.tsx';
import ResultsContainer from '@/components/simulation/Results/ResultsContainer.tsx';
import SolvedCases from '@/components/simulation/SolvedCases/SolvedCases.tsx';
import SolvedCasesContainer from '@/components/simulation/SolvedCases/SolvedCasesContainer.tsx';

// Minimal mock reducers to satisfy connected containers
const mockSimulationReducer = (state = {
  selectedDesignFile: null,
  simulationStatus: 'idle',
  simulationProgress: 0,
  isSimulationRunning: false,
  error: null,
  canInitialize: false,
  canRun: false,
  isLoading: false,
  statusText: '',
  // Add solutionVariables and selectedSolutionVariable so connected components have expected props
  solutionVariables: [],
  selectedSolutionVariable: null,
  // Add designFiles and selectedResolution for SolverSetupContainer
  designFiles: [
    { name: 'Select Design', url: '' },
    { name: '500ml Water Bottle', url: '/500mlWaterBottle/500-ml-water-bottle' },
  ],
  selectedResolution: '400k',
}) => state;

const mockFluentReducer = (state = {
  calculationParams: null,
  isCalculating: false,
  calculationStatus: null,
  calculationError: null,
  calculationResults: null,
}) => state;

const mockStore = configureStore({ reducer: { simulation: mockSimulationReducer, fluent: mockFluentReducer } });

describe('Simulation components smoke imports', () => {
  it('imports and renders simulation content components', () => {
    // Render plain components that don't need store (wrap connected ones with Provider)
    render(
      <Provider store={mockStore}>
        <FluentCalculationsContainer width={400} />
      </Provider>
    );
    render(
      <FluentSolutionVariables
        width={300}
        fluentSolutionVariables={[{ name: 'SV1', sv: 'sv1' }]}
        onSelectFluentSolutionVariables={() => {}}
        onVisualize={() => {}}
        enabled={false}
      />
    );
    // Render FluentSolutionVariables pure component (no store needed) above
    render(
      <SolverSetup
        designFiles={[]}
        selectedDesignFileId={null}
        selectedResolution={'400k'}
        isLoading={false}
        isOpening={false}
        onSelectDesignFile={() => {}}
        onSelectResolution={() => {}}
        onOpenDesignFile={() => {}}
      />
    );
    render(<Results />);
    render(<SolvedCases />);

    // Render connected containers with a mock Provider
    render(
      <Provider store={mockStore}>
        <FluentSolutionVariablesContainer />
      </Provider>
    );

    render(
      <Provider store={mockStore}>
        <SolverSetupContainer />
      </Provider>
    );

    render(
      <Provider store={mockStore}>
        <ResultsContainer />
      </Provider>
    );

    render(
      <Provider store={mockStore}>
        <SolvedCasesContainer />
      </Provider>
    );
  });
});
