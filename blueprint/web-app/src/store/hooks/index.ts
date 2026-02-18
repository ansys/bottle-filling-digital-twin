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
 * Redux Store Hooks
 *
 * Custom hooks for interacting with the Redux store
 */

import { useSelector, useDispatch } from 'react-redux';
import type { RootState, AppDispatch } from '../index.ts';

// Example: Application State Hook
export const useApplicationState = () => {
  const dispatch = useDispatch<AppDispatch>();

  const applicationState = useSelector((state: RootState) => ({
    currentForm: state.application.currentForm,
    streamStatus: state.application.streamStatus,
    selectedApplicationId: state.application.selectedApplicationId,
    selectedApplicationVersion: state.application.selectedApplicationVersion,
    selectedApplicationProfile: state.application.selectedApplicationProfile,
    isLoadingApplications: state.application.isLoadingApplications,
    error: state.application.error,
  }));

  const actions = {
    setCurrentForm: (form: string) =>
      dispatch({
        type: 'application/setCurrentForm',
        payload: form,
      }),
    setStreamStatus: (status: string) =>
      dispatch({
        type: 'application/setStreamStatus',
        payload: status,
      }),
    setSelectedApplication: (app: string) =>
      dispatch({
        type: 'application/setSelectedApplication',
        payload: app,
      }),
    setLoading: (loading: boolean) =>
      dispatch({
        type: 'application/setLoading',
        payload: loading,
      }),
    setError: (error: string | null) =>
      dispatch({
        type: 'application/setError',
        payload: error,
      }),
  };

  return { ...applicationState, actions };
};

// Example: Streaming State Hook
export const useStreamingState = () => {
  const dispatch = useDispatch<AppDispatch>();

  const streamingState = useSelector((state: RootState) => ({
    isConnecting: state.streaming.isConnecting,
    isConnected: state.streaming.isConnected,
    connectionError: state.streaming.connectionError,
    signalingServer: state.streaming.signalingServer,
    signalingPort: state.streaming.signalingPort,
    connectionQuality: state.streaming.connectionQuality,
    latency: state.streaming.latency,
  }));

  const actions = {
    startConnection: () =>
      dispatch({
        type: 'streaming/startConnection',
      }),
    setConnected: (connected: boolean) =>
      dispatch({
        type: 'streaming/setConnected',
        payload: connected,
      }),
    setConnectionError: (error: string | null) =>
      dispatch({
        type: 'streaming/setConnectionError',
        payload: error,
      }),
    updateQualityMetrics: (metrics: Record<string, number>) =>
      dispatch({
        type: 'streaming/updateQualityMetrics',
        payload: metrics,
      }),
  };

  return { ...streamingState, actions };
};

// Example: Form Navigation Hook
export const useFormNavigation = () => {
  const dispatch = useDispatch<AppDispatch>();

  const formState = useSelector((state: RootState) => ({
    currentStep: state.form.currentStep,
    totalSteps: state.form.totalSteps,
    canGoBack: state.form.canGoBack,
    canGoForward: state.form.canGoForward,
    isSubmitting: state.form.isSubmitting,
    submitError: state.form.submitError,
  }));

  const actions = {
    nextStep: () => dispatch({ type: 'form/nextStep' }),
    previousStep: () => dispatch({ type: 'form/previousStep' }),
    goToStep: (step: number) =>
      dispatch({
        type: 'form/goToStep',
        payload: step,
      }),
    resetForm: () => dispatch({ type: 'form/resetForm' }),
  };

  return { ...formState, actions };
};

// Example: UI State Hook
export const useUIState = () => {
  const dispatch = useDispatch<AppDispatch>();
  const uiState = useSelector((state: RootState) => ({
    // sidebarCollapsed removed from UI state
    theme: state.ui?.theme ?? 'light',
    notifications: state.ui?.notifications ?? [],
    timestep: state.ui?.timestep ?? 0,
    showSettings: state.ui?.showSettings ?? false,
  }));

  const actions = {
    // sidebar toggle removed - map toggleSidebar to toggleFullscreen for compatibility
    toggleSidebar: () =>
      dispatch({
        type: 'ui/toggleFullscreen',
      }),
    setActivePanel: (panel: string) =>
      dispatch({
        type: 'ui/setActivePanel',
        payload: panel,
      }),
    setTheme: (theme: string) =>
      dispatch({
        type: 'ui/setTheme',
        payload: theme,
      }),
    addNotification: (notification: {
      id: string;
      message: string;
      type: string;
    }) =>
      dispatch({
        type: 'ui/addNotification',
        payload: notification,
      }),
  };

  return { ...uiState, actions };
};

// Example: Server Management Hook
export const useServerState = () => {
  const dispatch = useDispatch<AppDispatch>();

  const serverState = useSelector((state: RootState) => ({
    streamServer: state.server.streamServer,
    streamServerStatus: state.server.streamServerStatus,
    streamServerHealth: state.server.streamServerHealth,
    recentServers: state.server.recentServers,
    lastError: state.server.lastError,
  }));

  const actions = {
    setCurrentServer: (server: { url: string; name: string }) =>
      dispatch({
        type: 'server/setCurrentServer',
        payload: server,
      }),
    updateConnectionStatus: (status: string) =>
      dispatch({
        type: 'server/updateConnectionStatus',
        payload: status,
      }),
    updateHealthStatus: (health: { status: string; lastCheck: number }) =>
      dispatch({
        type: 'server/updateHealthStatus',
        payload: health,
      }),
    addRecentServer: (server: {
      url: string;
      name: string;
      lastUsed: number;
    }) =>
      dispatch({
        type: 'server/addRecentServer',
        payload: server,
      }),
  };

  return { ...serverState, actions };
};
