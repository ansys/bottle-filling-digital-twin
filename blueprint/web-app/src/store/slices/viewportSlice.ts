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
 * Viewport Slice
 *
 * Manages 3D viewport state, Omniverse integration, and visualization controls
 */

import { createSlice, PayloadAction } from '@reduxjs/toolkit';

// Types
export interface ViewportSettings {
  width: number;
  height: number;
  renderQuality: 'low' | 'medium' | 'high' | 'ultra';
  antiAliasing: boolean;
  shadowQuality: 'off' | 'low' | 'medium' | 'high';
  frameRate: number;
}

export interface CameraState {
  position: [number, number, number];
  target: [number, number, number];
  fov: number;
  near: number;
  far: number;
}

export interface ViewportState {
  // Viewport configuration
  settings: ViewportSettings;

  // Camera state
  camera: CameraState;

  // Omniverse connection
  isOmniverseConnected: boolean;
  omniverseConnectionStatus:
    | 'disconnected'
    | 'connecting'
    | 'connected'
    | 'error';
  omniverseError: string | null;

  // Viewport control
  isViewportActive: boolean;
  isFullscreen: boolean;
  showGrid: boolean;
  showAxes: boolean;
  showBoundingBox: boolean;

  // Rendering state
  isRendering: boolean;
  renderProgress: number;
  lastRenderTime: number;
  frameCount: number;
  averageFPS: number;

  // Visualization options
  visualizationMode: 'solid' | 'wireframe' | 'transparent' | 'textured';
  colorBy: 'material' | 'pressure' | 'velocity' | 'temperature' | 'custom';
  showVelocityVectors: boolean;
  showStreamlines: boolean;
  showContours: boolean;

  // Scene objects
  selectedObjects: string[];
  visibleObjects: string[];
  hiddenObjects: string[];

  // Animation
  isAnimating: boolean;
  animationSpeed: number;
  currentFrame: number;
  totalFrames: number;

  // UI state
  isLoading: boolean;
  error: string | null;
}

// Initial state
const initialState: ViewportState = {
  settings: {
    width: 1920,
    height: 1080,
    renderQuality: 'medium',
    antiAliasing: true,
    shadowQuality: 'medium',
    frameRate: 60,
  },

  camera: {
    position: [0, 0, 10],
    target: [0, 0, 0],
    fov: 45,
    near: 0.1,
    far: 1000,
  },

  isOmniverseConnected: false,
  omniverseConnectionStatus: 'disconnected',
  omniverseError: null,

  isViewportActive: false,
  isFullscreen: false,
  showGrid: true,
  showAxes: true,
  showBoundingBox: false,

  isRendering: false,
  renderProgress: 0,
  lastRenderTime: 0,
  frameCount: 0,
  averageFPS: 0,

  visualizationMode: 'solid',
  colorBy: 'material',
  showVelocityVectors: false,
  showStreamlines: false,
  showContours: false,

  selectedObjects: [],
  visibleObjects: [],
  hiddenObjects: [],

  isAnimating: false,
  animationSpeed: 1.0,
  currentFrame: 0,
  totalFrames: 0,

  isLoading: false,
  error: null,
};

// Slice
const viewportSlice = createSlice({
  name: 'viewport',
  initialState,
  reducers: {
    // Viewport settings
    setViewportSettings: (state, action: PayloadAction<ViewportSettings>) => {
      state.settings = action.payload;
    },

    setViewportSize: (
      state,
      action: PayloadAction<{ width: number; height: number }>
    ) => {
      state.settings.width = action.payload.width;
      state.settings.height = action.payload.height;
    },

    setRenderQuality: (
      state,
      action: PayloadAction<'low' | 'medium' | 'high' | 'ultra'>
    ) => {
      state.settings.renderQuality = action.payload;
    },

    setFrameRate: (state, action: PayloadAction<number>) => {
      state.settings.frameRate = action.payload;
    },

    // Camera controls
    setCameraState: (state, action: PayloadAction<CameraState>) => {
      state.camera = action.payload;
    },

    setCameraPosition: (
      state,
      action: PayloadAction<[number, number, number]>
    ) => {
      state.camera.position = action.payload;
    },

    setCameraTarget: (
      state,
      action: PayloadAction<[number, number, number]>
    ) => {
      state.camera.target = action.payload;
    },

    setFieldOfView: (state, action: PayloadAction<number>) => {
      state.camera.fov = action.payload;
    },

    // Omniverse connection
    setOmniverseConnectionStatus: (
      state,
      action: PayloadAction<ViewportState['omniverseConnectionStatus']>
    ) => {
      state.omniverseConnectionStatus = action.payload;
      state.isOmniverseConnected = action.payload === 'connected';
    },

    setOmniverseError: (state, action: PayloadAction<string | null>) => {
      state.omniverseError = action.payload;
      if (action.payload) {
        state.omniverseConnectionStatus = 'error';
        state.isOmniverseConnected = false;
      }
    },

    // Viewport control
    setViewportActive: (state, action: PayloadAction<boolean>) => {
      state.isViewportActive = action.payload;
    },

    setFullscreen: (state, action: PayloadAction<boolean>) => {
      state.isFullscreen = action.payload;
    },

    toggleGrid: state => {
      state.showGrid = !state.showGrid;
    },

    toggleAxes: state => {
      state.showAxes = !state.showAxes;
    },

    toggleBoundingBox: state => {
      state.showBoundingBox = !state.showBoundingBox;
    },

    // Rendering state
    startRendering: state => {
      state.isRendering = true;
      state.renderProgress = 0;
    },

    updateRenderProgress: (state, action: PayloadAction<number>) => {
      state.renderProgress = action.payload;
    },

    completeRendering: state => {
      state.isRendering = false;
      state.renderProgress = 100;
      state.lastRenderTime = Date.now();
      state.frameCount += 1;
    },

    updateFPS: (state, action: PayloadAction<number>) => {
      state.averageFPS = action.payload;
    },

    // Visualization options
    setVisualizationMode: (
      state,
      action: PayloadAction<ViewportState['visualizationMode']>
    ) => {
      state.visualizationMode = action.payload;
    },

    setColorBy: (state, action: PayloadAction<ViewportState['colorBy']>) => {
      state.colorBy = action.payload;
    },

    toggleVelocityVectors: state => {
      state.showVelocityVectors = !state.showVelocityVectors;
    },

    toggleStreamlines: state => {
      state.showStreamlines = !state.showStreamlines;
    },

    toggleContours: state => {
      state.showContours = !state.showContours;
    },

    // Scene object management
    selectObjects: (state, action: PayloadAction<string[]>) => {
      state.selectedObjects = action.payload;
    },

    addSelectedObject: (state, action: PayloadAction<string>) => {
      if (!state.selectedObjects.includes(action.payload)) {
        state.selectedObjects.push(action.payload);
      }
    },

    removeSelectedObject: (state, action: PayloadAction<string>) => {
      state.selectedObjects = state.selectedObjects.filter(
        id => id !== action.payload
      );
    },

    setVisibleObjects: (state, action: PayloadAction<string[]>) => {
      state.visibleObjects = action.payload;
    },

    hideObject: (state, action: PayloadAction<string>) => {
      if (!state.hiddenObjects.includes(action.payload)) {
        state.hiddenObjects.push(action.payload);
      }
      state.visibleObjects = state.visibleObjects.filter(
        id => id !== action.payload
      );
    },

    showObject: (state, action: PayloadAction<string>) => {
      state.hiddenObjects = state.hiddenObjects.filter(
        id => id !== action.payload
      );
      if (!state.visibleObjects.includes(action.payload)) {
        state.visibleObjects.push(action.payload);
      }
    },

    // Animation controls
    startAnimation: state => {
      state.isAnimating = true;
    },

    stopAnimation: state => {
      state.isAnimating = false;
    },

    setAnimationSpeed: (state, action: PayloadAction<number>) => {
      state.animationSpeed = action.payload;
    },

    setCurrentFrame: (state, action: PayloadAction<number>) => {
      state.currentFrame = Math.max(
        0,
        Math.min(action.payload, state.totalFrames - 1)
      );
    },

    setTotalFrames: (state, action: PayloadAction<number>) => {
      state.totalFrames = action.payload;
    },

    nextFrame: state => {
      if (state.currentFrame < state.totalFrames - 1) {
        state.currentFrame += 1;
      }
    },

    previousFrame: state => {
      if (state.currentFrame > 0) {
        state.currentFrame -= 1;
      }
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

    resetViewport: () => {
      return { ...initialState };
    },
  },
});

// Export actions
export const {
  setViewportSettings,
  setViewportSize,
  setRenderQuality,
  setFrameRate,
  setCameraState,
  setCameraPosition,
  setCameraTarget,
  setFieldOfView,
  setOmniverseConnectionStatus,
  setOmniverseError,
  setViewportActive,
  setFullscreen,
  toggleGrid,
  toggleAxes,
  toggleBoundingBox,
  startRendering,
  updateRenderProgress,
  completeRendering,
  updateFPS,
  setVisualizationMode,
  setColorBy,
  toggleVelocityVectors,
  toggleStreamlines,
  toggleContours,
  selectObjects,
  addSelectedObject,
  removeSelectedObject,
  setVisibleObjects,
  hideObject,
  showObject,
  startAnimation,
  stopAnimation,
  setAnimationSpeed,
  setCurrentFrame,
  setTotalFrames,
  nextFrame,
  previousFrame,
  setError,
  clearError,
  setLoading,
  resetViewport,
} = viewportSlice.actions;

// Export reducer
export default viewportSlice.reducer;
