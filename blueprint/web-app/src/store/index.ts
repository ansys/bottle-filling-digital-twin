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
 * Redux Store Configuration
 *
 * This file sets up the main Redux store with all slices and middleware
 */

import { configureStore } from '@reduxjs/toolkit';
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';

// Import all slice reducers
import applicationReducer from './slices/applicationSlice.ts';
import streamingReducer from './slices/streamingSlice.ts';
import uiReducer from './slices/uiSlice.ts';
import formReducer from './slices/formSlice.ts';
import serverReducer from './slices/serverSlice.ts';
import simulationReducer from './slices/simulationSlice.ts';
import fluentReducer from './slices/fluentSlice.ts';
import solverReducer from './slices/solverSlice.ts';
import viewportReducer from './slices/viewportSlice.ts';

// Configure the store with all reducers
export const store = configureStore({
  reducer: {
    application: applicationReducer,
    streaming: streamingReducer,
    ui: uiReducer,
    form: formReducer,
    server: serverReducer,
    simulation: simulationReducer,
    fluent: fluentReducer,
    solver: solverReducer,
    viewport: viewportReducer,
  },
  middleware: getDefaultMiddleware =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these action types for serialization check
        ignoredActions: [
          'streaming/setStreamInstance',
          'viewport/setCameraState',
        ],
        // Ignore these field paths in all actions
        ignoredActionsPaths: ['payload.streamInstance', 'payload.camera'],
        // Ignore these paths in the state
        ignoredPaths: [
          'streaming.streamInstance',
          'simulation.resultsData',
          'fluent.calculationResults',
          'solver.solverResults',
          'viewport.camera',
        ],
      },
    }),
  devTools: import.meta.env.DEV,
});

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// Use throughout your app instead of plain `useDispatch` and `useSelector`
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

// Export store as default
export default store;
