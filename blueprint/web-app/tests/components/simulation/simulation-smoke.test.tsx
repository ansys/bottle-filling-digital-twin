import { render } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import '@testing-library/jest-dom';

// Import simulation components that were previously skipped
import FluentCalculationsContainer from '../../../src/components/simulation/FluentCalculations/FluentCalculationsContainer';
import FluentSolutionVariables from '../../../src/components/simulation/FluentSolutionVariables/FluentSolutionVariables';
import FluentSolutionVariablesContainer from '../../../src/components/simulation/FluentSolutionVariables/FluentSolutionVariablesContainer';
import SolverSetup from '../../../src/components/simulation/SolverSetup/SolverSetup';
import SolverSetupContainer from '../../../src/components/simulation/SolverSetup/SolverSetupContainer';
import Results from '../../../src/components/simulation/Results/Results';
import ResultsContainer from '../../../src/components/simulation/Results/ResultsContainer';
import SolvedCases from '../../../src/components/simulation/SolvedCases/SolvedCases';
import SolvedCasesContainer from '../../../src/components/simulation/SolvedCases/SolvedCasesContainer';

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
