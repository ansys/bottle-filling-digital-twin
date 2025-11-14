/**
 * SimulationPage Component (Refactored)
 *
 * Main simulation interface using CollapsibleTab   const {
    tabStates,
    toggleTab,
    setTabLoading,
    completeStep
  } = useTabWorkflow({ecture with progressive workflow
 */

import React, { Component } from 'react';
import { connect, ConnectedProps } from 'react-redux';
import type { RootState, AppDispatch } from '../../store';
import { StreamConfig } from '../../types';
import {
  setSimulationStatus,
  setLoading,
} from '../../store/slices/simulationSlice';
import { streamingActions } from '../../store/slices/streamingSlice';

import { CollapsibleTab, TabContent, StatusBar } from '../../components/common';
import { useTabWorkflow, type WorkflowStep } from '../../hooks/useTabWorkflow';
import SolverSetupContainer from '../../components/simulation/SolverSetup/SolverSetupContainer';
import FluentSolutionVariablesContainer from '../../components/simulation/FluentSolutionVariables/FluentSolutionVariablesContainer';
import FluentCalculationsContainer from '../../components/simulation/FluentCalculations/FluentCalculationsContainer';
import { ResultsContent } from '../../components/simulation';
import { StreamRouter } from '../../components/streaming';
import { Header } from '../../components';
import SessionSelectionPanel from '../../components/common/SessionSelectionPanel';
import styles from './SimulationPage.module.css';

// Define workflow steps
const WORKFLOW_STEPS: WorkflowStep[] = [
  {
    id: 'solver-setup',
    title: 'Solver Setup',
    stepNumber: 1,
    dependencies: [],
  },
  {
    id: 'initial-conditions',
    title: 'Initial Conditions',
    stepNumber: 2,
    dependencies: ['solver-setup'], // Requires solver setup completion
  },
  {
    id: 'calculations',
    title: 'Calculations',
    stepNumber: 3,
    dependencies: ['initial-conditions'], // Requires initial conditions completion
  },
  {
    id: 'results',
    title: 'Results & Visualization',
    stepNumber: 4,
    dependencies: [], // Will be enabled when calculations OR solved cases complete (handled in logic)
  },
];

// Map state from Redux store to component props
const mapStateToProps = (state: RootState) => ({
  isSimulationRunning: state.simulation.isSimulationRunning,
  simulationStatus: state.simulation.simulationStatus,
  simulationProgress: state.simulation.simulationProgress,
  selectedDesignFile: state.simulation.selectedDesignFile,
  error: state.simulation.error,
  isLoading: state.simulation.isLoading,
  statusText: state.simulation.statusText,
  canRun: state.simulation.canRun,
  canInitialize: state.simulation.canInitialize,
});

// Map dispatch to props
const mapDispatchToProps = (dispatch: AppDispatch) => ({
  setSimulationStatus: (
    status:
      | 'idle'
      | 'initializing'
      | 'running'
      | 'completed'
      | 'error'
      | 'cancelled'
  ) => dispatch(setSimulationStatus(status)),
  setLoading: (loading: boolean) => dispatch(setLoading(loading)),
  resetStreamingState: () => dispatch(streamingActions.resetStreamingState()),
});

// Create connector
const connector = connect(mapStateToProps, mapDispatchToProps);
type PropsFromRedux = ConnectedProps<typeof connector>;

// Component props interface
interface SimulationPageProps extends PropsFromRedux {
  className?: string;
}

// Component state interface
interface SimulationPageState {
  streamConfig: StreamConfig | null;
  configLoading: boolean;
  configError: string | null;
  sessionId: string | null;
  showSessionPanel: boolean;
}

/**
 * StreamingArea - Memoized component for streaming viewport
 * Prevents unnecessary re-renders when Redux state changes
 * Custom comparison: only re-render if streaming-related props change
 */
const StreamingArea = React.memo<{
  configLoading: boolean;
  configError: string | null;
  streamConfig: StreamConfig | null;
  showSessionPanel: boolean;
  sessionId: string | null;
  onSessionReady: (sessionId: string) => void;
  onEndStreamReady?: (endStreamFn: () => void) => void;
  onStreamDisconnected?: () => void;
}>(
  ({
    configLoading,
    configError,
    streamConfig,
    showSessionPanel,
    sessionId,
    onSessionReady,
    onEndStreamReady,
    onStreamDisconnected,
  }) => {
    if (configLoading) {
      return (
        <div className={styles.streamingConfigLoading}>
          <h3>Loading Stream Configuration...</h3>
          <p>Please wait while we load the streaming settings.</p>
        </div>
      );
    }

    if (configError || !streamConfig) {
      return (
        <div className={styles.streamingConfigError}>
          <h3>Stream Configuration Error</h3>
          <p>Failed to load streaming configuration.</p>
          <p>Please check that stream.config.json is properly configured.</p>
        </div>
      );
    }

    // For 'stream' source, show session selection panel to create/select session
    // For 'local' source, skip session creation and connect directly
    if (showSessionPanel && streamConfig.source === 'stream') {
      console.log(
        'SimulationPage: Rendering SessionSelectionPanel for stream source'
      );
      return (
        <SessionSelectionPanel
          streamServer={streamConfig.stream?.streamServer || ''}
          appId={streamConfig.stream?.appId || ''}
          appVersion={streamConfig.stream?.appVersion || ''}
          profile={streamConfig.stream?.profile || ''}
          onSessionReady={onSessionReady}
        />
      );
    }

    // For 'local' source, connect directly using config without session creation
    // For 'stream' source, merge sessionId into streamConfig if available
    const effectiveStreamConfig =
      sessionId && streamConfig.source === 'stream'
        ? {
            ...streamConfig,
            stream: {
              ...streamConfig.stream!,
              initialSessionId: sessionId,
            },
          }
        : streamConfig;

    console.log(
      'SimulationPage: Rendering StreamRouter with streamConfig:',
      effectiveStreamConfig,
      'sessionId from SessionPanel:',
      sessionId
    );
    return (
      <StreamRouter
        key={sessionId || 'no-session'} // Force remount on session change
        streamConfig={effectiveStreamConfig}
        onEndStreamReady={onEndStreamReady}
        onStreamDisconnected={onStreamDisconnected}
        className={styles.streamContainer}
      />
    );
  },
  // Custom comparison function: only re-render if these specific props change
  (prevProps, nextProps) => {
    return (
      prevProps.configLoading === nextProps.configLoading &&
      prevProps.configError === nextProps.configError &&
      prevProps.streamConfig === nextProps.streamConfig &&
      prevProps.showSessionPanel === nextProps.showSessionPanel &&
      prevProps.sessionId === nextProps.sessionId
      // Note: onSessionReady and onEndStreamReady are stable function references, no need to compare
    );
  }
);

StreamingArea.displayName = 'StreamingArea';

/**
 * AccordionWorkflowManager - Functional component wrapper for accordion workflow hook
 */
const TabWorkflowManager: React.FC<{
  selectedDesignFile: { name: string; url: string } | null;
  canRun: boolean;
  canInitialize: boolean;
  simulationStatus: string;
  isLoading: boolean;
  statusText?: string | null;
  onCompleteStep: (stepId: string) => void;
}> = ({
  canRun,
  canInitialize,
  simulationStatus,
  isLoading,
  statusText,
  onCompleteStep,
}) => {
  const { tabStates, toggleTab, setTabLoading, completeStep, enableTab } =
    useTabWorkflow({
      steps: WORKFLOW_STEPS,
      initialOpenStep: 'solver-setup',
      onStepCompleted: onCompleteStep,
    });

  // Monitor Redux state changes to determine when steps are completed
  React.useEffect(() => {
    // Solver Setup completed when design file is actually opened and loaded (not just selected)
    // This is indicated by canInitialize becoming true after loadDesignFileResponse
    if (
      canInitialize &&
      simulationStatus === 'idle' &&
      !isLoading &&
      !tabStates['solver-setup']?.isCompleted
    ) {
      completeStep('solver-setup');
      onCompleteStep('solver-setup');
    }
  }, [
    canInitialize,
    simulationStatus,
    isLoading,
    tabStates,
    completeStep,
    onCompleteStep,
  ]);

  React.useEffect(() => {
    // Initial Conditions completed when canRun becomes true (prerequisites met)
    if (canRun && !tabStates['initial-conditions']?.isCompleted) {
      completeStep('initial-conditions');
      onCompleteStep('initial-conditions');
    }
  }, [canRun, tabStates, completeStep, onCompleteStep]);

  React.useEffect(() => {
    // Calculations completed when simulation finishes successfully
    if (
      simulationStatus === 'completed' &&
      !tabStates['calculations']?.isCompleted
    ) {
      completeStep('calculations');
      onCompleteStep('calculations');
    }
  }, [simulationStatus, tabStates, completeStep, onCompleteStep]);

  // Enable Results tab when either calculations OR solved cases are completed
  React.useEffect(() => {
    const calculationsCompleted = tabStates['calculations']?.isCompleted;
    const resultsEnabled = tabStates['results']?.isEnabled;

    if (calculationsCompleted && !resultsEnabled) {
      enableTab('results');
    }
  }, [tabStates, enableTab]);

  // Update loading states based on Redux
  React.useEffect(() => {
    WORKFLOW_STEPS.forEach(step => {
      const shouldBeLoading =
        isLoading &&
        ((step.id === 'solver-setup' && simulationStatus === 'initializing') ||
          (step.id === 'calculations' && simulationStatus === 'running') ||
          (step.id === 'initial-conditions' && simulationStatus === 'running'));

      setTabLoading(step.id, shouldBeLoading, statusText || undefined);
    });
  }, [isLoading, simulationStatus, statusText, setTabLoading]);

  return (
    <div className={styles.workflowTabs}>
      <CollapsibleTab
        title='Solver Setup'
        stepNumber={1}
        isOpen={tabStates['solver-setup']?.isOpen || false}
        isEnabled={tabStates['solver-setup']?.isEnabled || false}
        isLoading={tabStates['solver-setup']?.isLoading || false}
        statusText={tabStates['solver-setup']?.statusText}
        onToggle={() => toggleTab('solver-setup')}
        className={tabStates['solver-setup']?.isCompleted ? 'completed' : ''}
      >
        <TabContent>
          <SolverSetupContainer
            width={400}
            onStepCompleted={() => onCompleteStep('solver-setup')}
          />
        </TabContent>
      </CollapsibleTab>

      <CollapsibleTab
        title='Initial Conditions'
        stepNumber={2}
        isOpen={tabStates['initial-conditions']?.isOpen || false}
        isEnabled={tabStates['initial-conditions']?.isEnabled || false}
        isLoading={tabStates['initial-conditions']?.isLoading || false}
        statusText={tabStates['initial-conditions']?.statusText}
        onToggle={() => toggleTab('initial-conditions')}
        className={
          tabStates['initial-conditions']?.isCompleted ? 'completed' : ''
        }
      >
        <TabContent>
          <FluentSolutionVariablesContainer
            width={400}
            onStepCompleted={() => onCompleteStep('initial-conditions')}
          />
        </TabContent>
      </CollapsibleTab>

      <CollapsibleTab
        title='Calculations'
        stepNumber={3}
        isOpen={tabStates['calculations']?.isOpen || false}
        isEnabled={tabStates['calculations']?.isEnabled || false}
        isLoading={tabStates['calculations']?.isLoading || false}
        statusText={tabStates['calculations']?.statusText}
        onToggle={() => toggleTab('calculations')}
        className={tabStates['calculations']?.isCompleted ? 'completed' : ''}
      >
        <TabContent>
          <FluentCalculationsContainer
            width={400}
            onStepCompleted={() => onCompleteStep('calculations')}
          />
        </TabContent>
      </CollapsibleTab>

      <CollapsibleTab
        title='Results & Visualization'
        stepNumber={4}
        isOpen={tabStates['results']?.isOpen || false}
        isEnabled={tabStates['results']?.isEnabled || false}
        isLoading={tabStates['results']?.isLoading || false}
        statusText={tabStates['results']?.statusText}
        onToggle={() => toggleTab('results')}
        className={tabStates['results']?.isCompleted ? 'completed' : ''}
      >
        <TabContent>
          <ResultsContent
            width={400}
            showStoreButton={true}
            onStepCompleted={() => onCompleteStep('results')}
          />
        </TabContent>
      </CollapsibleTab>
    </div>
  );
};

/**
 * SimulationPage Class Component (Refactored)
 *
 * Uses CollapsibleTab architecture with progressive workflow
 */
class SimulationPageBase extends Component<
  SimulationPageProps,
  SimulationPageState
> {
  private endStreamFn: (() => void) | null = null;

  constructor(props: SimulationPageProps) {
    super(props);

    this.state = {
      streamConfig: null,
      configLoading: false,
      configError: null,
      sessionId: null,
      showSessionPanel: false,
    };
  }

  componentDidMount(): void {
    this.loadStreamConfig();
    console.log('SimulationPage: loadStreamConfig method called');
  }

  /**
   * Handle session ready from SessionSelectionPanel
   */
  private handleSessionReady = (sessionId: string): void => {
    console.log('SimulationPage: Session ready with ID:', sessionId);
    this.setState({
      sessionId,
      showSessionPanel: false,
    });
  };

  /**
   * Handle end stream function being ready
   */
  private handleEndStreamReady = (endStreamFn: () => void): void => {
    console.log('SimulationPage: End stream function is ready');
    this.endStreamFn = endStreamFn;
  };

  /**
   * Handle end stream button click
   */
  private handleEndStreamClick = (): void => {
    if (this.endStreamFn) {
      console.log('SimulationPage: Ending stream via status bar button');
      this.endStreamFn();
      // Clear the sessionId and show session panel to allow reconnecting
      this.setState({ sessionId: null, showSessionPanel: true });
    } else {
      console.warn('SimulationPage: End stream function not available');
    }
  };

  /**
   * Handle stream disconnected (from stream component)
   */
  private handleStreamDisconnected = (): void => {
    console.log(
      'SimulationPage: Stream disconnected, returning to session panel'
    );
    // Reset streaming state in Redux to clear any stale connection data
    this.props.resetStreamingState();
    // Clear the sessionId and show session panel to allow reconnecting
    this.setState({ sessionId: null, showSessionPanel: true });
  };

  async loadStreamConfig(
    retryCount: number = 0,
    MAX_RETRY_ATTEMPTS: number = 2,
    RETRY_DELAY_MS: number = 1000
  ): Promise<void> {
    console.log(
      `SimulationPage: Starting to load stream configuration... (attempt ${retryCount + 1})`
    );
    this.setState({ configLoading: true, configError: null });

    try {
      console.log('SimulationPage: Fetching /stream.config.json...');
      const response = await fetch('/stream.config.json', {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          'Cache-Control': 'no-cache',
        },
      });
      console.log(
        'SimulationPage: Fetch response status:',
        response.status,
        response.statusText
      );

      if (!response.ok) {
        throw new Error(
          `Failed to load stream config: ${response.status} ${response.statusText}`
        );
      }

      const responseText = await response.text();
      console.log('SimulationPage: Raw response text:', responseText);

      const config: StreamConfig = JSON.parse(responseText);
      console.log('SimulationPage: Parsed stream configuration:', config);
      console.log('SimulationPage: Source type from config:', config.source);

      // Validate config structure
      if (
        !config.source ||
        !['local', 'gfn', 'stream'].includes(config.source)
      ) {
        throw new Error(
          `Invalid source type: ${config.source}. Must be 'local', 'gfn', or 'stream'.`
        );
      }

      this.setState({ streamConfig: config, configLoading: false });
      console.log(
        'SimulationPage: State updated with config, configLoading set to false'
      );

      // Show session panel if source is 'stream' and no session ID yet
      if (config.source === 'stream') {
        this.setState({ showSessionPanel: true });
        console.log(
          'SimulationPage: Showing session selection panel for OKAS streaming'
        );
      }
    } catch (error) {
      console.error(
        'SimulationPage: Error loading stream configuration:',
        error
      );

      // Retry up to 3 times with increasing delay
      if (retryCount < MAX_RETRY_ATTEMPTS) {
        console.log(
          `SimulationPage: Retrying in ${(retryCount + 1) * RETRY_DELAY_MS}ms...`
        );
        setTimeout(
          () => {
            this.loadStreamConfig(retryCount + 1);
          },
          (retryCount + 1) * RETRY_DELAY_MS
        );
        return;
      }

      this.setState({
        configError:
          error instanceof Error
            ? error.message
            : 'Unknown error loading stream config',
        configLoading: false,
      });
    }
  }

  /**
   * Header handlers
   */
  private handleSettingsClick = (): void => {
    console.log('Settings clicked');
    // TODO: Open settings modal
  };

  private handleHelpClick = (): void => {
    console.log('Help clicked');
    // TODO: Open help documentation
  };

  private handleProfileClick = (): void => {
    console.log('Profile clicked');
    // TODO: Open user profile menu
  };

  /**
   * Handle workflow step completion
   */
  private handleStepCompleted = (stepId: string): void => {
    console.log(`Workflow step completed: ${stepId}`);

    // Additional logic for step completion if needed
    switch (stepId) {
      case 'solver-setup':
        // Could trigger additional setup logic
        break;
      case 'initial-conditions':
        // Could trigger validation
        break;
      case 'calculations':
        // Could trigger result processing
        break;
      case 'results':
        // Workflow complete
        console.log('Simulation workflow completed!');
        break;
    }
  };

  /**
   * Render simulation status bar
   */
  private renderStatusBar(): React.ReactNode {
    const {
      isSimulationRunning,
      simulationStatus,
      simulationProgress,
      selectedDesignFile,
    } = this.props;
    const { sessionId, streamConfig } = this.state;

    return (
      <StatusBar
        designName={selectedDesignFile?.name}
        status={simulationStatus}
        sessionId={sessionId}
        showSessionInfo={streamConfig?.source === 'stream'}
        showProgress={isSimulationRunning}
        progress={simulationProgress}
        onEndStream={this.handleEndStreamClick}
      />
    );
  }

  render(): React.ReactNode {
    const { error, className, ...workflowProps } = this.props;
    const {
      streamConfig,
      configLoading,
      configError,
      sessionId,
      showSessionPanel,
    } = this.state;

    return (
      <div className={`${styles.simulationPage} ${className || ''}`}>
        <Header
          appName='Bottle Filling Digital Twin - Simulation'
          onSettingsClick={this.handleSettingsClick}
          onHelpClick={this.handleHelpClick}
          onProfileClick={this.handleProfileClick}
        />

        {/* Error Banner */}
        {error && (
          <div className={styles.errorBanner}>
            <span className={styles.errorIcon}>⚠️</span>
            <span className={styles.errorMessage}>{error}</span>
          </div>
        )}

        {/* Stream Config Error Banner */}
        {configError && (
          <div className={styles.errorBanner}>
            <span className={styles.errorIcon}>⚠️</span>
            <span className={styles.errorMessage}>
              Stream Configuration Error: {configError}
            </span>
          </div>
        )}

        {/* Status Bar */}
        {this.renderStatusBar()}

        <div className={styles.splitLayout}>
          {/* Streaming Viewport - 70% width */}
          <div className={styles.streamingArea}>
            <StreamingArea
              configLoading={configLoading}
              configError={configError}
              streamConfig={streamConfig}
              showSessionPanel={showSessionPanel}
              sessionId={sessionId}
              onSessionReady={this.handleSessionReady}
              onEndStreamReady={this.handleEndStreamReady}
              onStreamDisconnected={this.handleStreamDisconnected}
            />
          </div>
          <div className={styles.sidebarContent}>
            <TabWorkflowManager
              {...workflowProps}
              onCompleteStep={this.handleStepCompleted}
            />
          </div>
        </div>
      </div>
    );
  }
}

// Export the connected component
export const SimulationPage = connector(SimulationPageBase);
export default SimulationPage;
