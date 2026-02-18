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
 * Application Slice
 *
 * Manages the main application state including forms, workflow, and general app state
 */

import { createSlice, PayloadAction } from '@reduxjs/toolkit';

// Enums for better type safety
export enum Forms {
  IDLE = 'IDLE',
  APP_ONLY = 'APP_ONLY',
  STREAM_URLS = 'STREAM_URLS',
  APPLICATIONS = 'APPLICATIONS',
  VERSIONS = 'VERSIONS',
  PROFILES = 'PROFILES',
  STREAM = 'STREAM',
  STREAM_ONLY = 'STREAM_ONLY',
  SIMULATION = 'SIMULATION',
}

export enum StreamStatus {
  IDLE = 'IDLE',
  INITIALIZING = 'INITIALIZING',
  INITIALIZED = 'INITIALIZED',
  CONNECTING = 'CONNECTING',
  CONNECTED = 'CONNECTED',
  ERROR = 'ERROR',
}

// Application data interfaces
export interface Application {
  id: string;
  name: string;
  description?: string;
  tags?: string[];
}

export interface ApplicationVersion {
  version: string;
  profiles: string[];
}

// Application state interface
export interface ApplicationState {
  // Workflow state
  currentForm: Forms;
  useSimulationUI: boolean;

  // Application data
  applications: Application[];
  applicationVersions: string[];
  applicationProfiles: string[];

  // Selected application data
  selectedApplicationId: string;
  selectedApplicationVersion: string;
  selectedApplicationProfile: string;

  // Stream status
  streamStatus: StreamStatus;
  connectionText: string;
  sessionId: string;

  // Loading states
  isLoadingApplications: boolean;
  isLoadingVersions: boolean;
  isLoadingProfiles: boolean;
  isCreatingSession: boolean;

  // Error handling
  error: string | null;
  lastError: {
    message: string;
    timestamp: number;
    context?: string;
  } | null;
}

// Initial state
const initialState: ApplicationState = {
  currentForm: Forms.APP_ONLY,
  useSimulationUI: true,

  applications: [],
  applicationVersions: [],
  applicationProfiles: [],

  selectedApplicationId: '',
  selectedApplicationVersion: '',
  selectedApplicationProfile: '',

  streamStatus: StreamStatus.IDLE,
  connectionText: '',
  sessionId: '',

  isLoadingApplications: false,
  isLoadingVersions: false,
  isLoadingProfiles: false,
  isCreatingSession: false,

  error: null,
  lastError: null,
};

// Create the slice
const applicationSlice = createSlice({
  name: 'application',
  initialState,
  reducers: {
    // Form navigation
    setCurrentForm: (state, action: PayloadAction<Forms>) => {
      state.currentForm = action.payload;
    },

    setUseSimulationUI: (state, action: PayloadAction<boolean>) => {
      state.useSimulationUI = action.payload;
    },

    // Application data management
    setApplications: (state, action: PayloadAction<Application[]>) => {
      state.applications = action.payload;
      state.isLoadingApplications = false;
      state.error = null;
    },

    setApplicationVersions: (state, action: PayloadAction<string[]>) => {
      state.applicationVersions = action.payload;
      state.isLoadingVersions = false;
      state.error = null;
    },

    setApplicationProfiles: (state, action: PayloadAction<string[]>) => {
      state.applicationProfiles = action.payload;
      state.isLoadingProfiles = false;
      state.error = null;
    },

    // Selection management
    setSelectedApplication: (state, action: PayloadAction<string>) => {
      state.selectedApplicationId = action.payload;
      // Reset dependent selections
      state.selectedApplicationVersion = '';
      state.selectedApplicationProfile = '';
      state.applicationVersions = [];
      state.applicationProfiles = [];
    },

    setSelectedApplicationVersion: (state, action: PayloadAction<string>) => {
      state.selectedApplicationVersion = action.payload;
      // Reset dependent selections
      state.selectedApplicationProfile = '';
      state.applicationProfiles = [];
    },

    setSelectedApplicationProfile: (state, action: PayloadAction<string>) => {
      state.selectedApplicationProfile = action.payload;
    },

    // Stream status management
    setStreamStatus: (state, action: PayloadAction<StreamStatus>) => {
      state.streamStatus = action.payload;
    },

    setConnectionText: (state, action: PayloadAction<string>) => {
      state.connectionText = action.payload;
    },

    setSessionId: (state, action: PayloadAction<string>) => {
      state.sessionId = action.payload;
    },

    // Loading states
    setLoadingApplications: (state, action: PayloadAction<boolean>) => {
      state.isLoadingApplications = action.payload;
      if (action.payload) state.error = null;
    },

    setLoadingVersions: (state, action: PayloadAction<boolean>) => {
      state.isLoadingVersions = action.payload;
      if (action.payload) state.error = null;
    },

    setLoadingProfiles: (state, action: PayloadAction<boolean>) => {
      state.isLoadingProfiles = action.payload;
      if (action.payload) state.error = null;
    },

    setCreatingSession: (state, action: PayloadAction<boolean>) => {
      state.isCreatingSession = action.payload;
      if (action.payload) state.error = null;
    },

    // Error handling
    setError: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
      state.lastError = {
        message: action.payload,
        timestamp: Date.now(),
      };
      // Reset loading states on error
      state.isLoadingApplications = false;
      state.isLoadingVersions = false;
      state.isLoadingProfiles = false;
      state.isCreatingSession = false;
    },

    clearError: state => {
      state.error = null;
    },

    // Reset application state
    resetApplicationState: state => {
      return {
        ...initialState,
        useSimulationUI: state.useSimulationUI, // Preserve UI preference
      };
    },

    // Reset to initial form
    resetToInitialForm: state => {
      state.currentForm = Forms.APP_ONLY;
      state.streamStatus = StreamStatus.IDLE;
      state.connectionText = '';
      state.sessionId = '';
      state.selectedApplicationId = '';
      state.selectedApplicationVersion = '';
      state.selectedApplicationProfile = '';
      state.error = null;
    },
  },
});

// Export actions
export const {
  setCurrentForm,
  setUseSimulationUI,
  setApplications,
  setApplicationVersions,
  setApplicationProfiles,
  setSelectedApplication,
  setSelectedApplicationVersion,
  setSelectedApplicationProfile,
  setStreamStatus,
  setConnectionText,
  setSessionId,
  setLoadingApplications,
  setLoadingVersions,
  setLoadingProfiles,
  setCreatingSession,
  setError,
  clearError,
  resetApplicationState,
  resetToInitialForm,
} = applicationSlice.actions;

// Export reducer
export default applicationSlice.reducer;

// Selectors for easy state access
export const selectCurrentForm = (state: { application: ApplicationState }) =>
  state.application.currentForm;
export const selectApplications = (state: { application: ApplicationState }) =>
  state.application.applications;
export const selectSelectedApplication = (state: {
  application: ApplicationState;
}) => {
  return state.application.applications.find(
    app => app.id === state.application.selectedApplicationId
  );
};
export const selectStreamStatus = (state: { application: ApplicationState }) =>
  state.application.streamStatus;
export const selectIsLoading = (state: { application: ApplicationState }) => {
  return (
    state.application.isLoadingApplications ||
    state.application.isLoadingVersions ||
    state.application.isLoadingProfiles ||
    state.application.isCreatingSession
  );
};
export const selectError = (state: { application: ApplicationState }) =>
  state.application.error;
