/**
 * Solver Slice
 *
 * Manages solver setup, configuration, and execution state
 */

import { createSlice, PayloadAction } from '@reduxjs/toolkit';

// Types
export interface SolverConfiguration {
  solver: string;
  resolution: string;
  meshQuality: 'coarse' | 'medium' | 'fine';
  timeStep: number;
  maxIterations: number;
}

export interface SolverState {
  // Solver configuration
  configuration: SolverConfiguration;

  // Solver execution state
  isSolverRunning: boolean;
  solverProgress: number;
  solverStatus:
    | 'idle'
    | 'initializing'
    | 'meshing'
    | 'solving'
    | 'post-processing'
    | 'completed'
    | 'error';
  solverError: string | null;
  currentStep: string;

  // Solver results
  solverResults: Record<string, unknown> | null;
  convergenceData: number[];
  residuals: Record<string, number[]>;

  // Solver capabilities
  availableSolvers: string[];
  supportedResolutions: string[];

  // Performance metrics
  solverStartTime: number | null;
  solverEndTime: number | null;
  solutionTime: number; // in seconds
  memoryUsage: number; // in MB
  cpuUsage: number; // percentage

  // UI state
  isLoading: boolean;
  error: string | null;
}

// Initial state
const initialState: SolverState = {
  configuration: {
    solver: 'fluent',
    resolution: '400k',
    meshQuality: 'medium',
    timeStep: 0.001,
    maxIterations: 1000,
  },

  isSolverRunning: false,
  solverProgress: 0,
  solverStatus: 'idle',
  solverError: null,
  currentStep: '',

  solverResults: null,
  convergenceData: [],
  residuals: {},

  availableSolvers: ['fluent', 'cfx', 'rocky'],
  supportedResolutions: ['100k', '200k', '400k', '800k', '1.6M'],

  solverStartTime: null,
  solverEndTime: null,
  solutionTime: 0,
  memoryUsage: 0,
  cpuUsage: 0,

  isLoading: false,
  error: null,
};

// Slice
const solverSlice = createSlice({
  name: 'solver',
  initialState,
  reducers: {
    // Configuration updates
    setSolverConfiguration: (
      state,
      action: PayloadAction<SolverConfiguration>
    ) => {
      state.configuration = action.payload;
    },

    setSolver: (state, action: PayloadAction<string>) => {
      state.configuration.solver = action.payload;
    },

    setResolution: (state, action: PayloadAction<string>) => {
      state.configuration.resolution = action.payload;
    },

    setMeshQuality: (
      state,
      action: PayloadAction<'coarse' | 'medium' | 'fine'>
    ) => {
      state.configuration.meshQuality = action.payload;
    },

    setTimeStep: (state, action: PayloadAction<number>) => {
      state.configuration.timeStep = action.payload;
    },

    setMaxIterations: (state, action: PayloadAction<number>) => {
      state.configuration.maxIterations = action.payload;
    },

    // Solver execution control
    startSolver: state => {
      state.isSolverRunning = true;
      state.solverStatus = 'initializing';
      state.solverProgress = 0;
      state.solverError = null;
      state.solverStartTime = Date.now();
      state.currentStep = 'Initializing solver...';
    },

    updateSolverProgress: (
      state,
      action: PayloadAction<{ progress: number; step: string }>
    ) => {
      state.solverProgress = action.payload.progress;
      state.currentStep = action.payload.step;
    },

    setSolverStatus: (
      state,
      action: PayloadAction<SolverState['solverStatus']>
    ) => {
      state.solverStatus = action.payload;
    },

    completeSolver: (state, action: PayloadAction<Record<string, unknown>>) => {
      state.isSolverRunning = false;
      state.solverStatus = 'completed';
      state.solverProgress = 100;
      state.solverResults = action.payload;
      state.solverEndTime = Date.now();
      if (state.solverStartTime) {
        state.solutionTime =
          (state.solverEndTime - state.solverStartTime) / 1000;
      }
      state.currentStep = 'Solution completed';
    },

    failSolver: (state, action: PayloadAction<string>) => {
      state.isSolverRunning = false;
      state.solverStatus = 'error';
      state.solverError = action.payload;
      state.solverEndTime = Date.now();
      state.currentStep = 'Solver failed';
    },

    cancelSolver: state => {
      state.isSolverRunning = false;
      state.solverStatus = 'idle';
      state.solverEndTime = Date.now();
      state.currentStep = 'Solver cancelled';
    },

    resetSolver: state => {
      state.isSolverRunning = false;
      state.solverProgress = 0;
      state.solverStatus = 'idle';
      state.solverError = null;
      state.currentStep = '';
      state.solverResults = null;
      state.convergenceData = [];
      state.residuals = {};
      state.solverStartTime = null;
      state.solverEndTime = null;
      state.solutionTime = 0;
    },

    // Convergence and results
    updateConvergenceData: (state, action: PayloadAction<number[]>) => {
      state.convergenceData = action.payload;
    },

    updateResiduals: (
      state,
      action: PayloadAction<Record<string, number[]>>
    ) => {
      state.residuals = action.payload;
    },

    // Performance metrics
    updatePerformanceMetrics: (
      state,
      action: PayloadAction<{ memoryUsage: number; cpuUsage: number }>
    ) => {
      state.memoryUsage = action.payload.memoryUsage;
      state.cpuUsage = action.payload.cpuUsage;
    },

    // Available options
    setAvailableSolvers: (state, action: PayloadAction<string[]>) => {
      state.availableSolvers = action.payload;
    },

    setSupportedResolutions: (state, action: PayloadAction<string[]>) => {
      state.supportedResolutions = action.payload;
    },

    // General actions
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },

    clearError: state => {
      state.error = null;
    },

    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
  },
});

// Export actions
export const {
  setSolverConfiguration,
  setSolver,
  setResolution,
  setMeshQuality,
  setTimeStep,
  setMaxIterations,
  startSolver,
  updateSolverProgress,
  setSolverStatus,
  completeSolver,
  failSolver,
  cancelSolver,
  resetSolver,
  updateConvergenceData,
  updateResiduals,
  updatePerformanceMetrics,
  setAvailableSolvers,
  setSupportedResolutions,
  setError,
  clearError,
  setLoading,
} = solverSlice.actions;

// Export reducer
export default solverSlice.reducer;
