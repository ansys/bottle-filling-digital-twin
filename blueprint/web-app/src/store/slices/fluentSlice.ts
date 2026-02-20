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

/**
 * Fluent Slice
 *
 * Manages Fluent-specific calculation parameters and simulation state
 */

import { createSlice, PayloadAction } from '@reduxjs/toolkit';

// Types
export interface FluentCalculationParams {
  numTimesteps: number;
  viscosity: number;
  bottlesPerHour: number;
  tolerance: number;
}

export interface FluentState {
  // Calculation parameters
  calculationParams: FluentCalculationParams;

  // Calculation state
  isCalculating: boolean;
  calculationProgress: number;
  calculationStatus: 'idle' | 'running' | 'completed' | 'error';
  calculationError: string | null;

  // Results
  calculationResults: Record<string, unknown> | null;
  lastCalculationTime: number | null;

  // Enable/disable state
  calculationsEnabled: boolean;

  // UI state
  isLoading: boolean;
  error: string | null;
}

// Initial state
const initialState: FluentState = {
  calculationParams: {
    numTimesteps: 1,
    viscosity: 0.002,
    bottlesPerHour: 50000,
    tolerance: 0,
  },

  isCalculating: false,
  calculationProgress: 0,
  calculationStatus: 'idle',
  calculationError: null,

  calculationResults: null,
  lastCalculationTime: null,

  calculationsEnabled: false,

  isLoading: false,
  error: null,
};

// Slice
const fluentSlice = createSlice({
  name: 'fluent',
  initialState,
  reducers: {
    // Parameter updates
    setNumTimesteps: (state, action: PayloadAction<number>) => {
      state.calculationParams.numTimesteps = action.payload;
    },

    setViscosity: (state, action: PayloadAction<number>) => {
      state.calculationParams.viscosity = action.payload;
    },

    setBottlesPerHour: (state, action: PayloadAction<number>) => {
      state.calculationParams.bottlesPerHour = action.payload;
    },

    setTolerance: (state, action: PayloadAction<number>) => {
      state.calculationParams.tolerance = action.payload;
    },

    setCalculationParams: (
      state,
      action: PayloadAction<FluentCalculationParams>
    ) => {
      state.calculationParams = action.payload;
    },

    // Calculation control
    startCalculation: state => {
      state.isCalculating = true;
      state.calculationStatus = 'running';
      state.calculationProgress = 0;
      state.calculationError = null;
    },

    updateCalculationProgress: (state, action: PayloadAction<number>) => {
      state.calculationProgress = action.payload;
    },

    completeCalculation: (
      state,
      action: PayloadAction<Record<string, unknown>>
    ) => {
      state.isCalculating = false;
      state.calculationStatus = 'completed';
      state.calculationProgress = 100;
      state.calculationResults = action.payload;
      state.lastCalculationTime = Date.now();
    },

    failCalculation: (state, action: PayloadAction<string>) => {
      state.isCalculating = false;
      state.calculationStatus = 'error';
      state.calculationError = action.payload;
    },

    resetCalculation: state => {
      state.isCalculating = false;
      state.calculationProgress = 0;
      state.calculationStatus = 'idle';
      state.calculationError = null;
      state.calculationResults = null;
    },

    // Enable/disable calculations
    setCalculationsEnabled: (state, action: PayloadAction<boolean>) => {
      state.calculationsEnabled = action.payload;
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
  setNumTimesteps,
  setViscosity,
  setBottlesPerHour,
  setTolerance,
  setCalculationParams,
  startCalculation,
  updateCalculationProgress,
  completeCalculation,
  failCalculation,
  resetCalculation,
  setCalculationsEnabled,
  setError,
  clearError,
  setLoading,
} = fluentSlice.actions;

// Export reducer
export default fluentSlice.reducer;
