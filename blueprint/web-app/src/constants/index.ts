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

export const APP_CONFIG = {
  name: 'Bottle Filling Digital Twin',
  version: '0.0.1',
  company: 'Ansys',
} as const;

export const API_ENDPOINTS = {
  base: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api',
  simulation: '/simulation',
  fluent: '/fluent',
  omniverse: '/omniverse',
  designs: '/designs',
  results: '/results',
} as const;

export const BOTTLE_DESIGNS = {
  DESIGN_A_DINO: 'DesignA_Dino',
  DESIGN_B_MINERAL_WATER: 'DesignB_MineralWater',
  DESIGN_C_DIAMOND: 'DesignC_Diamond',
  DESIGN_D_ASIA: 'DesignD_Asia',
  DESIGN_E_TINY: 'DesignE_Tiny',
} as const;

export const SIMULATION_STATUS = {
  IDLE: 'idle',
  RUNNING: 'running',
  COMPLETED: 'completed',
  ERROR: 'error',
} as const;

export const ROUTES = {
  HOME: '/',
  WORKFLOW: '/workflow',
  SIMULATION: '/simulation',
  STREAMING: '/streaming',
  REVIEWER: '/reviewer',
  DESIGN: '/design',
  RESULTS: '/results',
  SETTINGS: '/settings',
  EXAMPLE: '/example',
} as const;
