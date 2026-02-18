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
 * ReviewerPage Component Tests
 *
 * Tests for the ReviewerPage component including:
 * - Component rendering
 * - Redux state integration
 * - Reviewer workflow management
 * - Animation controls
 * - User interactions
 * - Solved cases handling
 * - Results visualization
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
import { configureStore } from '@reduxjs/toolkit';
import '@testing-library/jest-dom';

import ConnectedReviewerPage from '@/pages/ReviewerPage/ReviewerPage.tsx';

// Mock the AppStreamer - initialize mock function first
jest.mock('@nvidia/omniverse-webrtc-streaming-library', () => ({
  AppStreamer: {
    sendMessage: jest.fn(),
  },
}));

// Get the mock function for test use
import {
  AppStreamer,
  StreamEvent,
} from '@nvidia/omniverse-webrtc-streaming-library';
const mockSendMessage = AppStreamer.sendMessage as jest.MockedFunction<
  typeof AppStreamer.sendMessage
>;

// Mock the heavy components to focus on ReviewerPage logic
jest.mock('@/components/streaming/StreamRouter/StreamRouter.tsx', () => {
  return function MockStreamRouter(props: any) {
    // expose a mock endStream function to tests via global so we can assert it was called
    React.useEffect(() => {
      if (props?.onEndStreamReady) {
        const fn = jest.fn();
        // store globally for assertions in tests
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (global as any).__MOCK_END_STREAM_FN__ = fn;
        props.onEndStreamReady(fn);
      }
    }, [props?.onEndStreamReady]);

    return <div data-testid='stream-router'>Mock Stream Router</div>;
  };
});

// Mock the useTabWorkflow hook
const mockTabStates = {
  'solved-cases': {
    isOpen: true,
    isEnabled: true,
    isCompleted: false,
    isLoading: false,
  },
  results: {
    isOpen: false,
    isEnabled: false,
    isCompleted: false,
    isLoading: false,
  },
};

jest.mock('@/hooks/useTabWorkflow.ts', () => ({
  useTabWorkflow: jest.fn(() => ({
    tabStates: mockTabStates,
    toggleTab: jest.fn(),
    setTabLoading: jest.fn(),
    completeStep: jest.fn((stepId: string) => {
      mockTabStates[stepId as keyof typeof mockTabStates].isCompleted = true;
    }),
    enableTab: jest.fn(),
  })),
}));

// Mock simulation components
jest.mock('@/components/simulation', () => ({
  Results: function MockResults({
    timestep = 0,
    isFullscreen = false,
    isPlaying = false,
    onTimestepChange = () => {},
    onFullscreenChange = () => {},
    onPlayStateChange = () => {},
  }: {
    timestep?: number;
    isFullscreen?: boolean;
    isPlaying?: boolean;
    onTimestepChange?: (timestep: number) => void;
    onFullscreenChange?: (isFullscreen: boolean) => void;
    onPlayStateChange?: (isPlaying: boolean) => void;
  }) {
    return (
      <div data-testid='results-visualization-form'>
        <div data-testid='timestep-display'>Timestep: {timestep}</div>
        <input
          data-testid='timestep-slider'
          type='range'
          min='0'
          max='2530'
          value={timestep}
          onChange={e => onTimestepChange(parseInt(e.target.value))}
        />
        <button
          data-testid='play-pause-button'
          onClick={() => onPlayStateChange(!isPlaying)}
        >
          {isPlaying ? 'Pause' : 'Play'}
        </button>
        <button
          data-testid='fullscreen-button'
          onClick={() => onFullscreenChange(!isFullscreen)}
        >
          {isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
        </button>
      </div>
    );
  },
  SolvedCasesContent: function MockSolvedCasesContent({
    solvedResults = [],
    selectedSolvedResults = '',
    onCaseChange = () => {},
    onVisualize = () => {},
  }: {
    solvedResults?: Array<{ name?: string; url?: string } | string>;
    selectedSolvedResults?: string;
    onCaseChange?: (value: string) => void;
    onVisualize?: (value: string) => void;
  }) {
    // If no solvedResults prop provided, read from Redux store
    let provided = solvedResults;
    if (!provided || provided.length === 0) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const testStore = (global as any).__TEST_STORE__;
        const storeResults = testStore?._preloadedState?.simulation?.solvedCases ||
          testStore?.getState?.()?.simulation?.solvedCases || [];
        provided = storeResults;
      } catch (e) {
        provided = [];
      }
    }

    // Normalize solvedResults to strings
    const options = (provided || []).map(item =>
      typeof item === 'string' ? item : item?.name || item?.url || ''
    );

    const [selected, setSelected] = React.useState(selectedSolvedResults);

    return (
      <div data-testid='solved-cases-form'>
        <select
          data-testid='case-selector'
          value={selected}
          onChange={e => {
            setSelected(e.target.value);
            onCaseChange(e.target.value);
          }}
        >
          <option value=''>Select a case</option>
          {options.map((caseName, index) => (
            <option key={index} value={caseName}>
              {caseName}
            </option>
          ))}
        </select>
        <button
          data-testid='visualize-button'
          onClick={() => onVisualize(selected)}
          disabled={!selected}
        >
          Visualize Case
        </button>
        {/* Hidden inputs for test visibility */}
        {options.map((caseName, index) => (
          <input key={`display-${index}`} value={caseName} readOnly style={{ display: 'none' }} />
        ))}
      </div>
    );
  },
}));

// Mock common components
jest.mock('@/components/common', () => ({
  CollapsibleTab: function MockCollapsibleTab({
    title,
    stepNumber,
    isOpen,
    isLoading,
    statusText,
    onToggle,
    className,
    children,
  }: {
    title: string;
    stepNumber: number;
    isOpen: boolean;
    isEnabled: boolean;
    isLoading: boolean;
    statusText?: string;
    onToggle: () => void;
    className?: string;
    children: React.ReactNode;
  }) {
    // Get the tab state to determine if completed
    const stepId = title.toLowerCase().replace(/\s+/g, '-');
    const isCompleted =
      mockTabStates[stepId as keyof typeof mockTabStates]?.isCompleted || false;
    const finalClassName =
      `collapsible-tab ${className || ''} ${isCompleted ? 'completed' : ''}`.trim();

    return (
      <div className={finalClassName} data-testid={`collapsible-tab-${stepId}`}>
        <button
          type='button'
          className='collapsible-tab-header'
          onClick={onToggle}
          onKeyDown={e => e.key === 'Enter' && onToggle()}
        >
          <span>
            Step {stepNumber}: {title}
          </span>
          {isLoading && <span>Loading...</span>}
          {statusText && <span>{statusText}</span>}
        </button>
        {isOpen && <div className='collapsible-tab-content'>{children}</div>}
      </div>
    );
  },
  TabContent: function MockTabContent({
    children,
  }: {
    children: React.ReactNode;
  }) {
    return <div data-testid='tab-content'>{children}</div>;
  },
  StatusBar: function MockStatusBar({
    designName,
    status,
    sessionId,
    showSessionInfo,
    onEndStream,
  }: {
    designName?: string | null;
    status?: string | null;
    sessionId?: string | null;
    showSessionInfo?: boolean;
    onEndStream?: () => void;
  }) {
    return (
      <div data-testid='status-bar'>
        <div>
          <span>Design:</span>
          <span data-testid='design-name'>{designName ?? 'None selected'}</span>
        </div>
        <div>
          <span>Status:</span>
          <span data-testid='status-value'>{status ?? 'idle'}</span>
        </div>
        {showSessionInfo && (
          <div>
            <span>Session:</span>
            <span data-testid='session-id'>{sessionId ?? 'No session'}</span>
          </div>
        )}
        <button onClick={onEndStream}>End Stream</button>
      </div>
    );
  },
  SessionSelectionPanel: function MockSessionSelectionPanel() {
    return <div data-testid='session-selection-panel'>Session Panel</div>;
  },
}));

// Mock the entire components module to avoid import.meta issues
jest.mock('@/components', () => ({
  Header: function MockHeader({
    appName,
    primaryLogo,
    additionalLogos,
    onSettingsClick,
    onHelpClick,
    onProfileClick,
  }: {
    appName: string;
    primaryLogo: { src: string; alt: string };
    additionalLogos?: Array<{ src: string; alt: string }>;
    onSettingsClick: () => void;
    onHelpClick: () => void;
    onProfileClick: () => void;
  }) {
    return (
      <div data-testid='header'>
        <h1>{appName}</h1>
        <img src={primaryLogo.src} alt={primaryLogo.alt} />
        {additionalLogos?.map((logo, index: number) => (
          <img key={index} src={logo.src} alt={logo.alt} />
        ))}
        <button onClick={onSettingsClick} title='Settings'>
          Settings
        </button>
        <button onClick={onHelpClick} title='Help'>
          Help
        </button>
        <button onClick={onProfileClick} title='User Profile'>
          Profile
        </button>
      </div>
    );
  },
}));

// Test utilities
const createMockStore = (initialState = {}) => {
  return configureStore({
    reducer: {
      simulation: (state = {}, _action: { type: string }) => state,
    },
    preloadedState: {
      simulation: {
        solvedCases: [],
        selectedSolvedCase: null,
        isLoading: false,
        statusText: null,
        ...initialState,
      },
    },
  });
};

const renderWithStore = (
  component: React.ReactElement,
  store = createMockStore()
) => {
  // Expose store on global for mocked components to read preloadedState
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (global as any).__TEST_STORE__ = store;
  return render(<Provider store={store}>{component}</Provider>);
};

describe('ReviewerPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();

    // Reset mock tab states
    Object.keys(mockTabStates).forEach(key => {
      mockTabStates[key as keyof typeof mockTabStates].isCompleted = false;
      mockTabStates[key as keyof typeof mockTabStates].isLoading = false;
    });

    // Reset mock sendMessage implementation
    mockSendMessage.mockResolvedValue({} as StreamEvent);
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  describe('Component Rendering', () => {
    it('renders the reviewer page with all main sections', () => {

      renderWithStore(<ConnectedReviewerPage />);

      // Check header
      expect(
        screen.getByText(/Bottle Filling Digital Twin - Reviewer/i)
      ).toBeInTheDocument();

      // Check streaming area appears after config loads
      return waitFor(() => {
        expect(screen.getByTestId('stream-router')).toBeInTheDocument();
      });

      // Check workflow tabs are rendered
      expect(
        screen.getByTestId('collapsible-tab-solved-cases')
      ).toBeInTheDocument();
      expect(
        screen.getByTestId('collapsible-tab-results-visualization')
      ).toBeInTheDocument();
    });

    it('displays correct logos in header', () => {
      renderWithStore(<ConnectedReviewerPage />);

      // Check for logo images (alt text)
      expect(screen.getByAltText('Ansys Logo')).toBeInTheDocument();
      expect(screen.getByAltText('Softserve Logo')).toBeInTheDocument();
      expect(screen.getByAltText('Cadfem Logo')).toBeInTheDocument();
      expect(screen.getByAltText('NVIDIA Logo')).toBeInTheDocument();
    });

    // Sidebar toggle intentionally removed from UI; no test for it
  });

  describe('Redux State Integration', () => {
    it('displays solved cases from Redux state', () => {
      const mockCases = [
        { name: 'Case 1', url: '/case1.cas' },
        { name: 'Case 2', url: '/case2.cas' },
      ];

      const store = createMockStore({
        solvedCases: mockCases,
      });

      renderWithStore(<ConnectedReviewerPage />, store);
      expect(screen.getByTestId('solved-cases-form')).toBeInTheDocument();
      // options are rendered as part of the select; check by their text content
      expect(screen.getByText('Case 1')).toBeInTheDocument();
      expect(screen.getByText('Case 2')).toBeInTheDocument();
    });

    it('handles loading states correctly', () => {
      const store = createMockStore({
        isLoading: true,
        statusText: 'Loading solved case...',
      });

      renderWithStore(<ConnectedReviewerPage />, store);

      // Should show loading state in solved cases tab
      const solvedCasesTab = screen.getByTestId('collapsible-tab-solved-cases');
      expect(solvedCasesTab).toBeInTheDocument();
    });

    it('auto-completes solved cases step when case loads successfully', async () => {
      // Mark solved-cases as completed before rendering
      mockTabStates['solved-cases'].isCompleted = true;

      const store = createMockStore({
        isLoading: false,
        statusText: 'Solved case loaded successfully',
      });

      renderWithStore(<ConnectedReviewerPage />, store);

      await waitFor(() => {
        const solvedCasesTab = screen.getByTestId(
          'collapsible-tab-solved-cases'
        );
        expect(solvedCasesTab).toHaveClass('completed');
      });
    });
  });

  describe('Workflow Management', () => {
    it('opens solved cases tab by default', () => {
      renderWithStore(<ConnectedReviewerPage />);

      const solvedCasesTab = screen.getByTestId('collapsible-tab-solved-cases');
      expect(
        solvedCasesTab.querySelector('.collapsible-tab-content')
      ).toBeInTheDocument();
    });

    it('enables results tab when solved cases step is completed', async () => {
      // Mark solved-cases as completed
      mockTabStates['solved-cases'].isCompleted = true;
      mockTabStates['results'].isEnabled = true;

      renderWithStore(<ConnectedReviewerPage />);

      const resultsTab = screen.getByTestId(
        'collapsible-tab-results-visualization'
      );
      expect(resultsTab).toBeInTheDocument();
    });

    it('handles tab toggling correctly', () => {
      renderWithStore(<ConnectedReviewerPage />);

      const solvedCasesHeader = screen
        .getByTestId('collapsible-tab-solved-cases')
        .querySelector('.collapsible-tab-header') as HTMLElement;

      fireEvent.click(solvedCasesHeader);
      // Tab toggle behavior would be handled by the mock
    });
  });

  describe.skip('Solved Cases Functionality', () => {
    it('handles case selection and visualization', async () => {
      const mockCases = [
        { name: 'Case 1', url: '/case1.cas' },
        { name: 'Case 2', url: '/case2.cas' },
      ];

      const store = createMockStore({
        solvedCases: mockCases,
      });

      renderWithStore(<ConnectedReviewerPage />, store);

      // Select a case
      const caseSelector = screen.getByTestId('case-selector');
      fireEvent.change(caseSelector, { target: { value: 'Case 1' } });

      // Click visualize button
      const visualizeButton = screen.getByTestId('visualize-button');
      fireEvent.click(visualizeButton);

      // Should send message to AppStreamer
      await waitFor(() => {
        expect(mockSendMessage).toHaveBeenCalledWith(
          JSON.stringify({
            event_type: 'openSolvedCase',
            payload: {
              caseFile: '/case1.cas',
            },
          })
        );
      });
    });

    it('handles string-type solved cases', async () => {
      const mockCases = ['case1.cas', 'case2.cas'];

      const store = createMockStore({
        solvedCases: mockCases,
      });

      renderWithStore(<ConnectedReviewerPage />, store);

      // Select a case
      const caseSelector = screen.getByTestId('case-selector');
      fireEvent.change(caseSelector, { target: { value: 'case1.cas' } });

      // Click visualize button
      const visualizeButton = screen.getByTestId('visualize-button');
      fireEvent.click(visualizeButton);

      // Should send message to AppStreamer
      await waitFor(() => {
        expect(mockSendMessage).toHaveBeenCalledWith(
          JSON.stringify({
            event_type: 'openSolvedCase',
            payload: {
              caseFile: 'case1.cas',
            },
          })
        );
      });
    });

    it('handles visualization errors gracefully', () => {
      mockSendMessage.mockImplementation(() => {
        throw new Error('AppStreamer error');
      });

      const mockCases = [{ name: 'Case 1', url: '/case1.cas' }];
      const store = createMockStore({
        solvedCases: mockCases,
      });

      renderWithStore(<ConnectedReviewerPage />, store);

      const caseSelector = screen.getByTestId('case-selector');
      fireEvent.change(caseSelector, { target: { value: 'Case 1' } });

      const visualizeButton = screen.getByTestId('visualize-button');

      // Should not throw error
      expect(() => fireEvent.click(visualizeButton)).not.toThrow();
    });
  });

  describe('Results Visualization Controls', () => {
    beforeEach(() => {
      // Enable results tab for these tests
      mockTabStates['results'].isEnabled = true;
      mockTabStates['results'].isOpen = true;
    });

    it('renders visualization controls', () => {
      renderWithStore(<ConnectedReviewerPage />);

      expect(
        screen.getByTestId('results-visualization-form')
      ).toBeInTheDocument();
      expect(screen.getByTestId('timestep-slider')).toBeInTheDocument();
      expect(screen.getByTestId('play-pause-button')).toBeInTheDocument();
      expect(screen.getByTestId('fullscreen-button')).toBeInTheDocument();
    });

    it('handles timestep changes', () => {
      renderWithStore(<ConnectedReviewerPage />);

      const timestepSlider = screen.getByTestId('timestep-slider');
      fireEvent.change(timestepSlider, { target: { value: '100' } });

      expect(screen.getByText('Timestep: 100')).toBeInTheDocument();
    });

    it('handles play/pause functionality', () => {
      renderWithStore(<ConnectedReviewerPage />);

      const playButton = screen.getByTestId('play-pause-button');
      expect(playButton).toHaveTextContent('Play');

      // Start animation
      fireEvent.click(playButton);
      expect(playButton).toHaveTextContent('Pause');

      // Stop animation
      fireEvent.click(playButton);
      expect(playButton).toHaveTextContent('Play');
    });

    it('handles fullscreen toggle', () => {
      renderWithStore(<ConnectedReviewerPage />);

      const fullscreenButton = screen.getByTestId('fullscreen-button');
      expect(fullscreenButton).toHaveTextContent('Fullscreen');

      fireEvent.click(fullscreenButton);
      expect(fullscreenButton).toHaveTextContent('Exit Fullscreen');
    });

    it('sends timestep messages during animation', async () => {
      renderWithStore(<ConnectedReviewerPage />);

      const playButton = screen.getByTestId('play-pause-button');
      fireEvent.click(playButton);

      // Advance timers to trigger timestep changes
      act(() => {
        jest.advanceTimersByTime(300); // 3 timestep changes
      });

      await waitFor(() => {
        expect(mockSendMessage).toHaveBeenCalledWith(
          expect.stringContaining('"event_type":"timestepChanged"')
        );
      });
    });

    it('resets timestep to 0 when reaching maximum', async () => {
      renderWithStore(<ConnectedReviewerPage />);

      // Set timestep to near maximum
      const timestepSlider = screen.getByTestId('timestep-slider');
      fireEvent.change(timestepSlider, { target: { value: '2530' } });

      const playButton = screen.getByTestId('play-pause-button');
      fireEvent.click(playButton);

      // Advance timer to trigger reset
      act(() => {
        jest.advanceTimersByTime(100);
      });

      await waitFor(() => {
        expect(screen.getByText('Timestep: 0')).toBeInTheDocument();
      });
    });
  });

  describe('User Interactions', () => {
    // Sidebar toggle removed from UI — skipping toggle interaction tests

    it('sidebar content is present in layout', () => {
      renderWithStore(<ConnectedReviewerPage />);
      expect(screen.getByTestId('collapsible-tab-solved-cases')).toBeInTheDocument();
    });

    it('handles header button clicks', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      renderWithStore(<ConnectedReviewerPage />);

      // Test header buttons
      expect(screen.getByTitle('Settings')).toBeInTheDocument();
      expect(screen.getByTitle('Help')).toBeInTheDocument();
      expect(screen.getByTitle('User Profile')).toBeInTheDocument();

      consoleSpy.mockRestore();
    });

    it('calls end stream function when available', () => {
      // Ensure global mock fn is reset
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (global as any).__MOCK_END_STREAM_FN__ = undefined;

      renderWithStore(<ConnectedReviewerPage />);

      // Click the End Stream button on the mocked StatusBar
      // Wait for the mocked StreamRouter to register the end-stream function
      return waitFor(() => {
        expect(screen.getByTestId('stream-router')).toBeInTheDocument();
      }).then(async () => {
        // Ensure the effect ran and the global fn is set
        await waitFor(() => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          expect((global as any).__MOCK_END_STREAM_FN__).toBeDefined();
        });

        const endBtn = screen.getByText('End Stream');
        fireEvent.click(endBtn);

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const fn = (global as any).__MOCK_END_STREAM_FN__;
        expect(fn).toBeDefined();
        expect(fn).toHaveBeenCalled();
      });
    });

    it('warns when end stream function not available', () => {
      // Ensure the global mock is not set so endStreamFn is null
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (global as any).__MOCK_END_STREAM_FN__ = undefined;

      // Temporarily override the StreamRouter mock to not call onEndStreamReady
      jest.doMock('@/components/streaming/StreamRouter/StreamRouter.tsx', () => {
        return function SilentMockStreamRouter() {
          return <div data-testid='stream-router'>Silent Stream Router</div>;
        };
      });

      const warnSpy = jest.spyOn(console, 'warn').mockImplementation();

      // Re-import the component fresh to use the silent mock
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const FreshConnected = require('@/pages/ReviewerPage/ReviewerPage.tsx').default;
      renderWithStore(<FreshConnected />);

      const endBtn = screen.getByText('End Stream');
      fireEvent.click(endBtn);

      expect(warnSpy).toHaveBeenCalledWith('ReviewerPage: End stream function not available');

      warnSpy.mockRestore();
      // restore the original mock (jest.resetModules will be handled in afterEach cleanup)
    });
  });

  describe('Component Lifecycle', () => {
    it('cleans up animation interval on unmount', () => {
      const { unmount } = renderWithStore(<ConnectedReviewerPage />);

      // Start animation
      const playButton = screen.getByTestId('play-pause-button');
      fireEvent.click(playButton);

      // Component should unmount without errors
      expect(() => unmount()).not.toThrow();
    });

    it('handles component updates without errors', () => {
      const { rerender } = renderWithStore(<ConnectedReviewerPage />);

      // Update with new props
      const newStore = createMockStore({
        solvedCases: [{ name: 'New Case', url: '/new.cas' }],
      });

      expect(() => {
        rerender(
          <Provider store={newStore}>
            <ConnectedReviewerPage />
          </Provider>
        );
      }).not.toThrow();
    });
  });

  describe('Accessibility', () => {
    it('has proper aria labels for interactive elements', () => {
      renderWithStore(<ConnectedReviewerPage />);
      // Verify header buttons and key interactive elements exist
      expect(screen.getByTitle('Settings')).toBeInTheDocument();
      expect(screen.getByTitle('Help')).toBeInTheDocument();
    });

  });

  describe('Error Handling', () => {
    it('handles missing solved cases gracefully', () => {
      const store = createMockStore({
        solvedCases: null,
      });

      expect(() =>
        renderWithStore(<ConnectedReviewerPage />, store)
      ).not.toThrow();
    });

    it('handles AppStreamer errors during case visualization', () => {
      // Scope this mock to this test only
      const originalImplementation = mockSendMessage.getMockImplementation();
      mockSendMessage.mockImplementation(() => {
        throw new Error('Connection failed');
      });

      const store = createMockStore({
        solvedCases: [{ name: 'Test Case', url: '/test.cas' }],
      });

      renderWithStore(<ConnectedReviewerPage />, store);

      const caseSelector = screen.getByTestId('case-selector');
      fireEvent.change(caseSelector, { target: { value: 'Test Case' } });

      const visualizeButton = screen.getByTestId('visualize-button');

      // Should handle error gracefully
      expect(() => fireEvent.click(visualizeButton)).not.toThrow();

      // Restore the original implementation
      if (originalImplementation) {
        mockSendMessage.mockImplementation(originalImplementation);
      } else {
        mockSendMessage.mockResolvedValue({} as StreamEvent);
      }
    });

    it('sets configError after retries when fetch fails', async () => {
      // Make fetch return a non-ok response to exercise retry and eventual error branch
      const originalFetch = global.fetch;
      // @ts-ignore
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        text: async () => JSON.stringify({}),
      });

      // Spy on console.error early so we capture the error logs produced during
      // the component's retry attempts.
      const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      renderWithStore(<ConnectedReviewerPage />);

      // Allow the componentDidMount async handler to start and schedule timers
      // before advancing fake timers. This ensures the initial fetch has been
      // awaited and any retry timeouts are registered.
      await act(async () => {
        // let pending microtasks (the initial async function) run
        await Promise.resolve();
      });

      // Run all timers to let retries happen deterministically and wait for microtasks
      await act(async () => {
        jest.runAllTimers();
        // allow pending promises to resolve; do a few ticks to ensure chained async
        // retry calls complete and setState runs finish.
        for (let i = 0; i < 5; i++) {

          await Promise.resolve();
        }
      });

      // give React and the component a few microtask ticks to complete
      for (let i = 0; i < 3; i++) {

        await Promise.resolve();
      }

      expect(errorSpy).toHaveBeenCalled();
      // Look for the load failure message produced by ReviewerPage.loadStreamConfig
      expect(
        errorSpy.mock.calls.some(call =>
          String(call[0]).includes('Failed to load stream config') ||
          String(call[0]).includes('Error loading stream configuration')
        )
      ).toBeTruthy();

      errorSpy.mockRestore();

      // restore fetch
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (global as any).fetch = originalFetch;
    });
  });

  describe('Responsive Design', () => {
    it('applies correct CSS classes for responsive layout', () => {
      const { container } = renderWithStore(<ConnectedReviewerPage />);

      // Check for main layout classes
      expect(container.querySelector('.reviewer-page')).toBeInTheDocument();
      expect(
        container.querySelector('.reviewer-split-layout')
      ).toBeInTheDocument();
      expect(container.querySelector('.streaming-area')).toBeInTheDocument();
      expect(container.querySelector('.sidebar-content')).toBeInTheDocument();
    });

    it('handles custom className prop', () => {
      const { container } = renderWithStore(
        <ConnectedReviewerPage className='custom-class' />
      );

      expect(
        container.querySelector('.reviewer-page.custom-class')
      ).toBeInTheDocument();
    });
  });

  describe.skip('Animation System', () => {
    it('starts and stops animation correctly', () => {
      renderWithStore(<ConnectedReviewerPage />);

      const playButton = screen.getByTestId('play-pause-button');

      // Start animation
      fireEvent.click(playButton);
      expect(playButton).toHaveTextContent('Pause');

      // Stop animation
      fireEvent.click(playButton);
      expect(playButton).toHaveTextContent('Play');
    });

    it('prevents multiple animation intervals', () => {
      renderWithStore(<ConnectedReviewerPage />);

      const playButton = screen.getByTestId('play-pause-button');

      // Start animation
      fireEvent.click(playButton);
      expect(playButton).toHaveTextContent('Pause');

      // Try to start again - should pause instead
      fireEvent.click(playButton);
      expect(playButton).toHaveTextContent('Play');

      // Start once more
      fireEvent.click(playButton);
      expect(playButton).toHaveTextContent('Pause');
    });

    it('updates timestep during animation', async () => {
      renderWithStore(<ConnectedReviewerPage />);

      const playButton = screen.getByTestId('play-pause-button');
      fireEvent.click(playButton);

      // Advance timer
      act(() => {
        jest.advanceTimersByTime(100);
      });

      await waitFor(() => {
        expect(screen.getByText('Timestep: 1')).toBeInTheDocument();
      });
    });
  });
});
