/**
 * Simulation Slice
 *
 * Manages overall simulation state including design files, solver configuration, and execution status
 */

import { createSlice, PayloadAction } from '@reduxjs/toolkit';

// Types
export interface DesignFile {
  name: string;
  url: string;
}

export interface SolutionVariable {
  name: string;
  sv: string;
}

export interface SolvedCase {
  name: string;
  url: string;
}

export interface SimulationState {
  // Design files and assets
  designFiles: DesignFile[];
  selectedDesignFile: DesignFile | null;
  selectedAssetUrl: string | null;

  // Solver configuration
  selectedSolver: string;
  selectedResolution: string;

  // Solution variables and results
  solutionVariables: SolutionVariable[];
  selectedSolutionVariable: SolutionVariable | null;

  // Solved cases
  solvedCases: SolvedCase[];
  selectedSolvedCase: SolvedCase | null;

  // Stored results
  storedResults: string[];
  selectedStoredResult: string | null;

  // Simulation execution state
  isSimulationRunning: boolean;
  simulationProgress: number;
  simulationStatus:
    | 'idle'
    | 'initializing'
    | 'running'
    | 'completed'
    | 'error'
    | 'cancelled';
  simulationError: string | null;

  // Results and data
  resultsReady: boolean;
  resultsData: Record<string, unknown> | null;

  // Enable/disable state (like old frontend)
  canInitialize: boolean;
  canRun: boolean;

  // UI state
  isLoading: boolean;
  error: string | null;
  statusText: string | null; // Progress text from Omniverse Kit
  lastUpdated: number | null;
}

// Initial state
const initialState: SimulationState = {
  designFiles: [
    {
      name: '500ml Water Bottle',
      url: '/500mlWaterBottle/500-ml-water-bottle',
    },
    {
      name: '2000ml Water Bottle',
      url: '/2000mlWaterBottle/2000-ml-water-bottle',
    },
  ],
  selectedDesignFile: null,
  selectedAssetUrl: null,

  selectedSolver: 'fluent',
  selectedResolution: '400k',

  solutionVariables: [
    { name: 'Velocity', sv: 'SV_V' },
    { name: 'Volume of Fluids', sv: 'SV_VOF' },
  ],
  selectedSolutionVariable: null,

  solvedCases: [],
  selectedSolvedCase: null,

  storedResults: [],
  selectedStoredResult: null,

  isSimulationRunning: false,
  simulationProgress: 0,
  simulationStatus: 'idle',
  simulationError: null,

  resultsReady: false,
  resultsData: null,

  canInitialize: false,
  canRun: false,

  isLoading: false,
  error: null,
  statusText: null,
  lastUpdated: null,
};

// Slice
const simulationSlice = createSlice({
  name: 'simulation',
  initialState,
  reducers: {
    // Design file actions
    setSelectedDesignFile: (state, action: PayloadAction<DesignFile>) => {
      state.selectedDesignFile = action.payload;
      state.selectedAssetUrl = action.payload.url;
    },

    setSelectedAssetUrl: (state, action: PayloadAction<string>) => {
      state.selectedAssetUrl = action.payload;
    },

    // Solver configuration actions
    setSelectedSolver: (state, action: PayloadAction<string>) => {
      state.selectedSolver = action.payload;
    },

    setSelectedResolution: (state, action: PayloadAction<string>) => {
      state.selectedResolution = action.payload;
    },

    // Solution variable actions
    setSelectedSolutionVariable: (
      state,
      action: PayloadAction<SolutionVariable>
    ) => {
      state.selectedSolutionVariable = action.payload;
    },

    // Solved case actions
    setSelectedSolvedCase: (state, action: PayloadAction<SolvedCase>) => {
      state.selectedSolvedCase = action.payload;
    },

    // Data loading actions
    setDesignFiles: (state, action: PayloadAction<DesignFile[]>) => {
      state.designFiles = action.payload;
    },

    setSolutionVariables: (
      state,
      action: PayloadAction<SolutionVariable[]>
    ) => {
      state.solutionVariables = action.payload;
    },

    setSolvedCases: (state, action: PayloadAction<SolvedCase[]>) => {
      state.solvedCases = action.payload;
    },

    // Stored results actions
    setStoredResults: (state, action: PayloadAction<string[]>) => {
      state.storedResults = action.payload;
    },

    setSelectedStoredResult: (state, action: PayloadAction<string>) => {
      state.selectedStoredResult = action.payload;
    },

    // Simulation execution actions
    startSimulation: state => {
      state.isSimulationRunning = true;
      state.simulationStatus = 'initializing';
      state.simulationProgress = 0;
      state.simulationError = null;
    },

    updateSimulationProgress: (state, action: PayloadAction<number>) => {
      state.simulationProgress = action.payload;
      if (action.payload > 0 && state.simulationStatus === 'initializing') {
        state.simulationStatus = 'running';
      }
    },

    completeSimulation: (
      state,
      action: PayloadAction<Record<string, unknown> | null>
    ) => {
      state.isSimulationRunning = false;
      state.simulationStatus = 'completed';
      state.simulationProgress = 100;
      state.resultsReady = true;
      state.resultsData = action.payload;
      state.lastUpdated = Date.now();
    },

    failSimulation: (state, action: PayloadAction<string>) => {
      state.isSimulationRunning = false;
      state.simulationStatus = 'error';
      state.simulationError = action.payload;
    },

    cancelSimulation: state => {
      state.isSimulationRunning = false;
      state.simulationStatus = 'cancelled';
    },

    resetSimulation: state => {
      state.isSimulationRunning = false;
      state.simulationProgress = 0;
      state.simulationStatus = 'idle';
      state.simulationError = null;
      state.resultsReady = false;
      state.resultsData = null;
    },

    // Enable/disable actions (like old frontend)
    setCanInitialize: (state, action: PayloadAction<boolean>) => {
      state.canInitialize = action.payload;
    },

    setCanRun: (state, action: PayloadAction<boolean>) => {
      state.canRun = action.payload;
    },

    // General actions
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },

    setStatusText: (state, action: PayloadAction<string | null>) => {
      state.statusText = action.payload;
      state.lastUpdated = Date.now();
    },

    clearError: state => {
      state.error = null;
    },

    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },

    setSimulationStatus: (
      state,
      action: PayloadAction<SimulationState['simulationStatus']>
    ) => {
      state.simulationStatus = action.payload;
    },
  },
});

// Export actions
export const {
  setSelectedDesignFile,
  setSelectedAssetUrl,
  setSelectedSolver,
  setSelectedResolution,
  setSelectedSolutionVariable,
  setSelectedSolvedCase,
  setDesignFiles,
  setSolutionVariables,
  setSolvedCases,
  setStoredResults,
  setSelectedStoredResult,
  startSimulation,
  updateSimulationProgress,
  completeSimulation,
  failSimulation,
  cancelSimulation,
  resetSimulation,
  setCanInitialize,
  setCanRun,
  setError,
  setStatusText,
  clearError,
  setLoading,
  setSimulationStatus,
} = simulationSlice.actions;

// Export reducer
export default simulationSlice.reducer;
