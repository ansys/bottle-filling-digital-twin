/**
 * WorkflowPage Component Tests (Forms.APP_ONLY cases)
 *
 * Tests specifically focused on the WorkflowPage component when currentForm is APP_ONLY
 */

import React from 'react';
import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import '@testing-library/jest-dom';

import WorkflowPage from '../../src/pages/WorkflowPage';
import {
  Forms,
  StreamStatus,
  setCurrentForm,
  setUseSimulationUI,
  setCreatingSession,
  setLoadingApplications,
  setLoadingVersions,
  setLoadingProfiles,
  setError,
} from '../../src/store/slices/applicationSlice';
import applicationReducer from '../../src/store/slices/applicationSlice';
import streamingReducer from '../../src/store/slices/streamingSlice';
import uiReducer from '../../src/store/slices/uiSlice';
import serverReducer from '../../src/store/slices/serverSlice';
import formReducer from '../../src/store/slices/formSlice';

// Mock the constants to avoid import.meta.env issues
jest.mock('../../src/constants', () => ({
  ROUTES: {
    WORKFLOW: '/workflow',
    SIMULATION: '/simulation',
    REVIEWER: '/reviewer',
    DESIGN: '/design',
    RESULTS: '/results',
    SETTINGS: '/settings',
  },
  APP_CONFIG: {
    name: 'Bottle Filling Digital Twin',
    version: '0.0.1',
    company: 'Ansys',
  },
}));

// Mock React Router navigation
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  Navigate: ({ to }: { to: string }) => (
    <div data-testid='navigate' data-to={to}>
      Navigate to {to}
    </div>
  ),
}));

// Mock ErrorBoundary to avoid import.meta.env issues
jest.mock('../../src/components/ErrorBoundary', () => ({
  __esModule: true,
  default: ({
    children,
  }: {
    children: React.ReactNode;
    fallback?: React.ReactNode;
  }) => {
    return <div data-testid='error-boundary'>{children}</div>;
  },
}));

// Type for test store initial state
interface TestStoreState {
  application?: Partial<{
    currentForm: Forms;
    useSimulationUI: boolean;
    isCreatingSession: boolean;
    isLoadingApplications: boolean;
    isLoadingVersions: boolean;
    isLoadingProfiles: boolean;
    streamStatus: StreamStatus;
    error: string | null;
  }>;
  streaming?: Record<string, unknown>;
  ui?: Record<string, unknown>;
  server?: Record<string, unknown>;
  form?: Record<string, unknown>;
}

// Test store factory
const createTestStore = (initialState: TestStoreState = {}) => {
  const store = configureStore({
    reducer: {
      application: applicationReducer,
      streaming: streamingReducer,
      ui: uiReducer,
      server: serverReducer,
      form: formReducer,
    },
  });

  // Set default APP_ONLY form
  store.dispatch(setCurrentForm(Forms.APP_ONLY));
  store.dispatch(setUseSimulationUI(false));

  // Apply any custom application state after store creation
  if (initialState.application) {
    if (initialState.application.currentForm !== undefined) {
      store.dispatch(setCurrentForm(initialState.application.currentForm));
    }
    if (initialState.application.useSimulationUI !== undefined) {
      store.dispatch(
        setUseSimulationUI(initialState.application.useSimulationUI)
      );
    }
    if (initialState.application.isCreatingSession !== undefined) {
      store.dispatch(
        setCreatingSession(initialState.application.isCreatingSession)
      );
    }
    if (initialState.application.isLoadingApplications !== undefined) {
      store.dispatch(
        setLoadingApplications(initialState.application.isLoadingApplications)
      );
    }
    if (initialState.application.isLoadingVersions !== undefined) {
      store.dispatch(
        setLoadingVersions(initialState.application.isLoadingVersions)
      );
    }
    if (initialState.application.isLoadingProfiles !== undefined) {
      store.dispatch(
        setLoadingProfiles(initialState.application.isLoadingProfiles)
      );
    }
    if (
      initialState.application.error !== undefined &&
      initialState.application.error !== null
    ) {
      store.dispatch(setError(initialState.application.error));
    }
  }

  return store;
};

// Test wrapper component
const TestWrapper: React.FC<{
  store: ReturnType<typeof createTestStore>;
  children: React.ReactNode;
}> = ({ store, children }) => (
  <Provider store={store}>
    <MemoryRouter>{children}</MemoryRouter>
  </Provider>
);

// Mock performance API for NVIDIA library
Object.defineProperty(global, 'performance', {
  value: {
    mark: jest.fn(),
    measure: jest.fn(),
    now: jest.fn(() => Date.now()),
    getEntriesByName: jest.fn(() => []),
    getEntriesByType: jest.fn(() => []),
  },
  writable: true,
});

// Mock NVIDIA Omniverse library
jest.mock('@nvidia/omniverse-webrtc-streaming-library', () => ({
  AppStreamer: jest.fn().mockImplementation(() => ({
    connect: jest.fn(),
    disconnect: jest.fn(),
    on: jest.fn(),
    off: jest.fn(),
  })),
}));

describe('WorkflowPage Component - Forms.APP_ONLY Cases', () => {
  let mockStore: ReturnType<typeof createTestStore>;

  beforeEach(() => {
    mockStore = createTestStore({
      application: { currentForm: Forms.APP_ONLY },
    });
    jest.clearAllMocks();
    mockNavigate.mockClear();
  });

  describe('Rendering with APP_ONLY Form', () => {
    it('should render WorkflowPage with Header and AppOnlyForm when currentForm is APP_ONLY', () => {
      render(
        <TestWrapper store={mockStore}>
          <WorkflowPage />
        </TestWrapper>
      );

      // Check that Header is rendered
      expect(screen.getByRole('banner')).toBeInTheDocument();

      // Check that AppOnlyForm content is rendered
      expect(screen.getByText('Choose Your Journey')).toBeInTheDocument();
      expect(
        screen.getByText('I am a Simulation Engineer')
      ).toBeInTheDocument();
      expect(screen.getByText('I am a Reviewer')).toBeInTheDocument();
    });

    it('should render Header with correct app name and options', () => {
      render(
        <TestWrapper store={mockStore}>
          <WorkflowPage />
        </TestWrapper>
      );

      // Verify Header is present (Header component has its own tests for detailed verification)
      expect(screen.getByRole('banner')).toBeInTheDocument();

      // Verify buttons are present (basic verification)
      expect(screen.getByRole('button', { name: /help/i })).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /settings/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /user profile/i })
      ).toBeInTheDocument();
    });

    it('should not render error banner when there is no error', () => {
      render(
        <TestWrapper store={mockStore}>
          <WorkflowPage />
        </TestWrapper>
      );

      expect(screen.queryByText(/Error:/)).not.toBeInTheDocument();
    });

    it('should render error banner when there is an error', () => {
      const storeWithError = createTestStore({
        application: {
          currentForm: Forms.APP_ONLY,
          error: 'Test error message',
        },
      });

      render(
        <TestWrapper store={storeWithError}>
          <WorkflowPage />
        </TestWrapper>
      );

      expect(screen.getByText('Error: Test error message')).toBeInTheDocument();
    });

    it('should render Loading component when isLoading is true', () => {
      const loadingStore = createTestStore({
        application: {
          currentForm: Forms.APP_ONLY,
          isCreatingSession: true,
        },
      });

      render(
        <TestWrapper store={loadingStore}>
          <WorkflowPage />
        </TestWrapper>
      );

      expect(screen.getByText('Processing...')).toBeInTheDocument();
      // AppOnlyForm content should not be visible when loading
      expect(screen.queryByText('Choose Your Journey')).not.toBeInTheDocument();
    });

    it('should render Loading when any loading state is true', () => {
      const loadingStates = [
        { isCreatingSession: true },
        { isLoadingApplications: true },
        { isLoadingVersions: true },
        { isLoadingProfiles: true },
      ];

      loadingStates.forEach(loadingState => {
        const store = createTestStore({
          application: {
            currentForm: Forms.APP_ONLY,
            ...loadingState,
          },
        });

        const { unmount } = render(
          <TestWrapper store={store}>
            <WorkflowPage />
          </TestWrapper>
        );

        expect(screen.getByText('Processing...')).toBeInTheDocument();
        unmount();
      });
    });
  });

  describe('Header Interactions in APP_ONLY Context', () => {
    it('should handle settings button click', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      render(
        <TestWrapper store={mockStore}>
          <WorkflowPage />
        </TestWrapper>
      );

      const settingsButton = screen.getByRole('button', { name: /settings/i });
      fireEvent.click(settingsButton);

      expect(consoleSpy).toHaveBeenCalledWith('Settings clicked');
      consoleSpy.mockRestore();
    });

    it('should handle help button click', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      render(
        <TestWrapper store={mockStore}>
          <WorkflowPage />
        </TestWrapper>
      );

      const helpButton = screen.getByRole('button', { name: /help/i });
      fireEvent.click(helpButton);

      expect(consoleSpy).toHaveBeenCalledWith('Help clicked');
      consoleSpy.mockRestore();
    });

    it('should handle profile button click', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      render(
        <TestWrapper store={mockStore}>
          <WorkflowPage />
        </TestWrapper>
      );

      const profileButton = screen.getByRole('button', {
        name: /user profile/i,
      });
      fireEvent.click(profileButton);

      expect(consoleSpy).toHaveBeenCalledWith('Profile clicked');
      consoleSpy.mockRestore();
    });
  });

  describe('AppOnlyForm Integration in WorkflowPage', () => {
    it('should integrate with AppOnlyForm and handle persona selection through Redux', async () => {
      const store = createTestStore({
        application: { currentForm: Forms.APP_ONLY },
      });

      render(
        <TestWrapper store={store}>
          <WorkflowPage />
        </TestWrapper>
      );

      // Verify AppOnlyForm is rendered
      expect(screen.getByText('Choose Your Journey')).toBeInTheDocument();

      // Select simulation engineer persona
      const simulationCard = screen.getByLabelText(
        'Select Simulation Engineer persona'
      );
      fireEvent.click(simulationCard);

      // Should show Start Simulation button
      await waitFor(() => {
        expect(screen.getByText('Start Simulation')).toBeInTheDocument();
      });

      // Click Start Simulation to trigger form navigation
      const startButton = screen.getByText('Start Simulation');
      fireEvent.click(startButton);

      // The form should change from APP_ONLY to SIMULATION
      // Note: The actual form change would be visible through Redux state
      await waitFor(() => {
        const state = store.getState();
        expect(state.application.currentForm).toBe(Forms.SIMULATION);
      });
    });

    it('should handle reviewer persona selection and navigation', async () => {
      const store = createTestStore({
        application: { currentForm: Forms.APP_ONLY },
      });

      render(
        <TestWrapper store={store}>
          <WorkflowPage />
        </TestWrapper>
      );

      // Select reviewer persona
      const reviewerCard = screen.getByLabelText('Select Reviewer persona');
      fireEvent.click(reviewerCard);

      // Should show View Results button
      await waitFor(() => {
        expect(screen.getByText('View Results')).toBeInTheDocument();
      });

      // Click View Results
      const viewButton = screen.getByText('View Results');
      fireEvent.click(viewButton);

      // Verify Redux state changes and navigation
      await waitFor(() => {
        const state = store.getState();
        expect(state.application.useSimulationUI).toBe(false);
        // Should navigate to reviewer route instead of changing form
        expect(mockNavigate).toHaveBeenCalledWith('/reviewer');
      });
    });

    it('should maintain consistent state between WorkflowPage and AppOnlyForm', () => {
      const storeWithSimulationUI = createTestStore({
        application: {
          currentForm: Forms.APP_ONLY,
          useSimulationUI: true,
        },
      });

      render(
        <TestWrapper store={storeWithSimulationUI}>
          <WorkflowPage />
        </TestWrapper>
      );

      // Should show Start Simulation button since useSimulationUI is true
      expect(screen.getByText('Start Simulation')).toBeInTheDocument();
      expect(screen.queryByText('View Results')).not.toBeInTheDocument();
    });
  });

  describe('Form State Management', () => {
    it('should render only APP_ONLY form when currentForm is APP_ONLY', () => {
      render(
        <TestWrapper store={mockStore}>
          <WorkflowPage />
        </TestWrapper>
      );

      // Should render AppOnlyForm content
      expect(screen.getByText('Choose Your Journey')).toBeInTheDocument();

      // Should not render other form placeholders
      expect(screen.queryByText('Server URLs Form')).not.toBeInTheDocument();
      expect(screen.queryByText('Applications Form')).not.toBeInTheDocument();
      expect(screen.queryByText('Versions Form')).not.toBeInTheDocument();
      expect(screen.queryByText('Profiles Form')).not.toBeInTheDocument();
      expect(screen.queryByText('Streaming View')).not.toBeInTheDocument();
    });

    it('should properly pass Redux state to AppOnlyForm', () => {
      const storeWithCustomState = createTestStore({
        application: {
          currentForm: Forms.APP_ONLY,
          useSimulationUI: true,
          isCreatingSession: true,
        },
      });

      render(
        <TestWrapper store={storeWithCustomState}>
          <WorkflowPage />
        </TestWrapper>
      );

      // Should show loading state
      expect(screen.getByText('Processing...')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should display error banner above the form content', () => {
      const errorStore = createTestStore({
        application: {
          currentForm: Forms.APP_ONLY,
          error: 'Network connection failed',
        },
      });

      render(
        <TestWrapper store={errorStore}>
          <WorkflowPage />
        </TestWrapper>
      );

      // Error should be displayed
      expect(
        screen.getByText('Error: Network connection failed')
      ).toBeInTheDocument();

      // Form should still be rendered below the error
      expect(screen.getByText('Choose Your Journey')).toBeInTheDocument();
    });

    it('should handle multiple error states properly', () => {
      const errorStore = createTestStore({
        application: {
          currentForm: Forms.APP_ONLY,
          error: 'Multiple errors occurred',
        },
      });

      render(
        <TestWrapper store={errorStore}>
          <WorkflowPage />
        </TestWrapper>
      );

      const errorBanner = screen.getByText('Error: Multiple errors occurred');
      expect(errorBanner).toBeInTheDocument();
      expect(errorBanner.closest('.errorBanner')).toBeInTheDocument();
    });
  });

  describe('Component Structure and Layout', () => {
    it('should have proper component hierarchy', () => {
      render(
        <TestWrapper store={mockStore}>
          <WorkflowPage />
        </TestWrapper>
      );

      // Check the main structure
      const workflowPage = screen.getByRole('banner').closest('.workflowPage');
      expect(workflowPage).toBeInTheDocument();

      // Header should be present
      expect(screen.getByRole('banner')).toBeInTheDocument();

      // Main content area should be present
      const mainContent = screen.getByRole('main');
      expect(mainContent).toBeInTheDocument();
      expect(mainContent).toHaveClass('content');
    });

    it('should maintain accessibility standards', () => {
      render(
        <TestWrapper store={mockStore}>
          <WorkflowPage />
        </TestWrapper>
      );

      // Check for semantic HTML structure
      expect(screen.getByRole('banner')).toBeInTheDocument(); // Header
      expect(screen.getByRole('main')).toBeInTheDocument(); // Main content

      // Check heading hierarchy (from AppOnlyForm)
      expect(screen.getByRole('heading', { level: 2 })).toBeInTheDocument();
    });
  });

  describe('Performance and Optimization', () => {
    it('should render efficiently without unnecessary re-renders', () => {
      const { rerender } = render(
        <TestWrapper store={mockStore}>
          <WorkflowPage />
        </TestWrapper>
      );

      // Initial render should work
      expect(screen.getByText('Choose Your Journey')).toBeInTheDocument();

      // Re-render with same props should not cause issues
      rerender(
        <TestWrapper store={mockStore}>
          <WorkflowPage />
        </TestWrapper>
      );

      expect(screen.getByText('Choose Your Journey')).toBeInTheDocument();
    });

    it('should handle store updates gracefully', async () => {
      const store = createTestStore({
        application: { currentForm: Forms.APP_ONLY },
      });

      render(
        <TestWrapper store={store}>
          <WorkflowPage />
        </TestWrapper>
      );

      // Initially should show View Results (useSimulationUI: false by default)
      expect(screen.getByText('View Results')).toBeInTheDocument();

      // Update store state to enable simulation UI
      await act(async () => {
        store.dispatch({
          type: 'application/setUseSimulationUI',
          payload: true,
        });
      });

      // Check that Redux state was updated correctly
      await waitFor(() => {
        const state = store.getState();
        expect(state.application.useSimulationUI).toBe(true);
      });
    });
  });
});
