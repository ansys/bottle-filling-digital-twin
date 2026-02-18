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

import { render, screen } from './utils/test-utils.tsx';

// Mock the store module to avoid import.meta issues
jest.mock('@/store', () => ({
  store: {
    dispatch: jest.fn(),
    getState: jest.fn(() => ({})),
    subscribe: jest.fn(),
    replaceReducer: jest.fn(),
  },
  RootState: {},
  AppDispatch: {},
}));

// Mock all the problematic modules before importing the App
jest.mock('@/constants', () => ({
  APP_CONFIG: {
    name: 'Bottle Filling Digital Twin',
    version: '0.0.1',
    company: 'Ansys',
  },
  API_ENDPOINTS: {
    base: 'http://localhost:8080/api',
    simulation: '/simulation',
    fluent: '/fluent',
    omniverse: '/omniverse',
    designs: '/designs',
    results: '/results',
  },
  BOTTLE_DESIGNS: {
    DESIGN_A_DINO: 'DesignA_Dino',
    DESIGN_B_MINERAL_WATER: 'DesignB_MineralWater',
    DESIGN_C_DIAMOND: 'DesignC_Diamond',
    DESIGN_D_ASIA: 'DesignD_Asia',
    DESIGN_E_TINY: 'DesignE_Tiny',
  },
  SIMULATION_STATUS: {
    IDLE: 'idle',
    RUNNING: 'running',
    COMPLETED: 'completed',
    ERROR: 'error',
  },
  ROUTES: {
    WORKFLOW: '/workflow',
    SIMULATION: '/simulation',
    REVIEWER: '/reviewer',
    DESIGN: '/design',
    RESULTS: '/results',
    SETTINGS: '/settings',
  },
}));

// Mock the Loading component
jest.mock('@/components/Loading', () => {
  return function MockLoading({ message }: { message?: string }) {
    return <div data-testid='loading'>{message || 'Loading...'}</div>;
  };
});

// Mock the WorkflowPage
jest.mock('@/pages/WorkflowPage', () => ({
  __esModule: true,
  default: () => <div data-testid='workflow-page'>Workflow Page</div>,
}));

// Mock the SimulationPage
jest.mock('@/pages/SimulationPage', () => ({
  __esModule: true,
  default: () => <div data-testid='simulation-page'>Simulation Page</div>,
}));

// Mock the ReviewerPage
jest.mock('@/pages/ReviewerPage', () => ({
  __esModule: true,
  default: () => <div data-testid='reviewer-page'>Reviewer Page</div>,
}));

// Now import the App component after all mocks are set up
import App from '@/App.tsx';

describe('App Component', () => {
  it('renders without crashing', async () => {
    render(<App />);

    // Since the component uses Suspense, we should wait for it to resolve
    const workflowPageElement = await screen.findByTestId('workflow-page');
    expect(workflowPageElement).toBeInTheDocument();
  });

  it('has proper app container structure', () => {
    render(<App />);

    const appContainer = document.querySelector('.app');
    expect(appContainer).toBeInTheDocument();
  });

  it('renders the workflow page by default', async () => {
    render(<App />);

    const workflowPageElement = await screen.findByTestId('workflow-page');
    expect(workflowPageElement).toBeInTheDocument();
  });

  it('wraps content in Router', () => {
    // Test that router context is available by checking if we can render without errors
    expect(() => render(<App />)).not.toThrow();

    // Verify router functionality by checking that navigation works
    const workflowPageElement = screen.getByTestId('workflow-page');
    expect(workflowPageElement).toBeInTheDocument();
  });
});
