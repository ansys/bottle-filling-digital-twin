/**
 * Redux Store Configuration
 *
 * This file sets up the main Redux store with all slices and middleware
 */

import { configureStore } from '@reduxjs/toolkit';
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';

// Import all slice reducers
import applicationReducer from './slices/applicationSlice';
import streamingReducer from './slices/streamingSlice';
import uiReducer from './slices/uiSlice';
import formReducer from './slices/formSlice';
import serverReducer from './slices/serverSlice';
import simulationReducer from './slices/simulationSlice';
import fluentReducer from './slices/fluentSlice';
import solverReducer from './slices/solverSlice';
import viewportReducer from './slices/viewportSlice';

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
