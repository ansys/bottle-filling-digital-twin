/**
 * ReviewerPage Component (Refactored)
 *
 * Main reviewer interface using CollapsibleTab architecture with progressive workflow
 */

import React, { Component } from 'react';
import { connect, ConnectedProps } from 'react-redux';
import type { RootState, AppDispatch } from '../../store';
import { StreamConfig } from '../../types';
import { setLoading, setStatusText } from '../../store/slices/simulationSlice';
import { streamingActions } from '../../store/slices/streamingSlice';
import { CollapsibleTab, TabContent, StatusBar } from '../../components/common';
import { Results, SolvedCasesContent } from '../../components/simulation';
import { useTabWorkflow, type WorkflowStep } from '../../hooks/useTabWorkflow';
import { StreamRouter } from '../../components/streaming';
import { AppStreamer } from '@nvidia/omniverse-webrtc-streaming-library';
import { Header } from '../../components';
import SessionSelectionPanel from '../../components/common/SessionSelectionPanel';
import './ReviewerPage.css';

// Define workflow steps for reviewer
const REVIEWER_WORKFLOW_STEPS: WorkflowStep[] = [
  {
    id: 'solved-cases',
    title: 'Solved Cases',
    stepNumber: 1,
    dependencies: [],
  },
  {
    id: 'results',
    title: 'Results Visualization',
    stepNumber: 2,
    dependencies: ['solved-cases'], // Requires case selection first
  },
];

// Map Redux state to component props
const mapStateToProps = (state: RootState) => ({
  solvedCases: state.simulation.solvedCases,
  selectedSolvedCase: state.simulation.selectedSolvedCase,
  isLoading: state.simulation.isLoading,
  statusText: state.simulation.statusText,
  error: state.simulation.error,
});

// Map Redux dispatch to component props
const mapDispatchToProps = (dispatch: AppDispatch) => ({
  setLoading: (loading: boolean) => dispatch(setLoading(loading)),
  setStatusText: (text: string) => dispatch(setStatusText(text)),
  resetStreamingState: () => dispatch(streamingActions.resetStreamingState()),
});

// Create connector
const connector = connect(mapStateToProps, mapDispatchToProps);
type PropsFromRedux = ConnectedProps<typeof connector>;

// Component props
interface ReviewerPageProps {
  className?: string;
}

// Combined props type
type ReviewerPageAllProps = PropsFromRedux & ReviewerPageProps;

/**
 * StreamingArea - Memoized component for streaming viewport
 * Prevents unnecessary re-renders when timestep changes
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
        <div className='streaming-config-loading'>
          <h3>Loading Stream Configuration...</h3>
          <p>Please wait while we load the streaming settings.</p>
        </div>
      );
    }

    if (configError || !streamConfig) {
      return (
        <div className='streaming-config-error'>
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
        'ReviewerPage: Rendering SessionSelectionPanel for stream source'
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
      'ReviewerPage: Rendering StreamRouter with streamConfig:',
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
        className='reviewer-stream-container'
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
 * ReviewerWorkflowManager - Functional component wrapper for reviewer workflow hook
 */
const ReviewerWorkflowManager = React.forwardRef<
  { completeSolvedCasesStep: () => void },
  {
    isLoading: boolean;
    statusText?: string | null;
    onCompleteStep: (stepId: string) => void;
    formProps: ReviewerPageAllProps & {
      timestep: number;
      isFullscreen: boolean;
      isPlaying: boolean;
      setTimestep: (timestep: number) => void;
      setFullscreen: (isFullscreen: boolean) => void;
      startAnimation: () => void;
      stopAnimation: () => void;
    };
  }
>(({ isLoading, statusText, onCompleteStep, formProps }, ref) => {
  const { tabStates, toggleTab, setTabLoading, completeStep } = useTabWorkflow({
    steps: REVIEWER_WORKFLOW_STEPS,
    initialOpenStep: 'solved-cases',
    onStepCompleted: onCompleteStep,
  });

  // Monitor for solved case loading states
  React.useEffect(() => {
    REVIEWER_WORKFLOW_STEPS.forEach(step => {
      const shouldBeLoading = isLoading && step.id === 'solved-cases';
      setTabLoading(step.id, shouldBeLoading, statusText || undefined);
    });
  }, [isLoading, statusText, setTabLoading]);

  // Monitor Redux state changes to determine when steps are completed
  React.useEffect(() => {
    // Solved Cases completed when case is loaded successfully (loading ends with success message)
    if (
      !isLoading &&
      statusText === 'Solved case loaded successfully' &&
      !tabStates['solved-cases']?.isCompleted
    ) {
      completeStep('solved-cases');
      onCompleteStep('solved-cases');
    }
  }, [isLoading, statusText, tabStates, completeStep, onCompleteStep]);

  // Function to complete solved-cases step (called by parent)
  const completeSolvedCasesStep = React.useCallback(() => {
    if (!tabStates['solved-cases']?.isCompleted) {
      completeStep('solved-cases');
      onCompleteStep('solved-cases');
    }
  }, [tabStates, completeStep, onCompleteStep]);

  // Expose the function to parent via ref
  React.useImperativeHandle(
    ref,
    () => ({
      completeSolvedCasesStep,
    }),
    [completeSolvedCasesStep]
  );

  return (
    <div className='workflow-tabs'>
      <CollapsibleTab
        title='Solved Cases'
        stepNumber={1}
        isOpen={tabStates['solved-cases']?.isOpen || false}
        isEnabled={tabStates['solved-cases']?.isEnabled || false}
        isLoading={tabStates['solved-cases']?.isLoading || false}
        statusText={tabStates['solved-cases']?.statusText}
        onToggle={() => toggleTab('solved-cases')}
        className={tabStates['solved-cases']?.isCompleted ? 'completed' : ''}
      >
        <TabContent>
          <SolvedCasesContent
            width={400}
            onStepCompleted={completeSolvedCasesStep}
            onVisualize={(caseValue: string) => {
              console.log('Visualizing case:', caseValue);

              formProps.setLoading?.(true);
              formProps.setStatusText?.('Loading solved case...');

              try {
                const message = {
                  event_type: 'openSolvedCase',
                  payload: {
                    usdFile: caseValue,
                  },
                };

                AppStreamer.sendMessage(JSON.stringify(message));
                console.log(
                  'Sent openSolvedCase message to Omniverse:',
                  message
                );
              } catch (error) {
                console.error('Error visualizing solved case:', error);
                formProps.setLoading?.(false);
                formProps.setStatusText?.('Failed to load solved case');
              }
            }}
          />
        </TabContent>
      </CollapsibleTab>

      <CollapsibleTab
        title='Results Visualization'
        stepNumber={2}
        isOpen={tabStates['results']?.isOpen || false}
        isEnabled={tabStates['results']?.isEnabled || false}
        isLoading={tabStates['results']?.isLoading || false}
        statusText={tabStates['results']?.statusText}
        onToggle={() => toggleTab('results')}
        className={tabStates['results']?.isCompleted ? 'completed' : ''}
      >
        <TabContent>
          <Results
            width={400}
            showStoreButton={false}
            timestep={formProps.timestep || 0}
            isFullscreen={formProps.isFullscreen || false}
            isPlaying={formProps.isPlaying || false}
            onTimestepChange={formProps.setTimestep}
            onFullscreenChange={formProps.setFullscreen}
            onPlayStateChange={(isPlaying: boolean) => {
              if (isPlaying) {
                formProps.startAnimation?.();
              } else {
                formProps.stopAnimation?.();
              }
            }}
          />
        </TabContent>
      </CollapsibleTab>
    </div>
  );
});

// Component state interface
interface ReviewerPageState {
  timestep: number;
  isFullscreen: boolean;
  isPlaying: boolean;
  animationInterval?: NodeJS.Timeout;
  streamConfig: StreamConfig | null;
  configLoading: boolean;
  configError: string | null;
  sessionId: string | null;
  showSessionPanel: boolean;
}

/**
 * ReviewerPage Class Component (Refactored)
 *
 * Uses CollapsibleTab architecture with progressive workflow
 */
class ReviewerPage extends Component<ReviewerPageAllProps, ReviewerPageState> {
  private workflowManagerRef = React.createRef<{
    completeSolvedCasesStep: () => void;
  }>();
  private endStreamFn: (() => void) | null = null;

  constructor(props: ReviewerPageAllProps) {
    super(props);
    this.state = {
      timestep: 0,
      isFullscreen: false,
      isPlaying: false,
      streamConfig: null,
      configLoading: false,
      configError: null,
      sessionId: null,
      showSessionPanel: false,
    };
  }

  componentDidMount(): void {
    // Only load config if not already loaded
    if (!this.state.streamConfig) {
      this.loadStreamConfig();
    } else {
      console.log('ReviewerPage: Config already loaded, skipping reload');
    }
  }

  async loadStreamConfig(
    retryCount: number = 0,
    MAX_RETRY_ATTEMPTS: number = 2,
    RETRY_DELAY_MS: number = 1000
  ): Promise<void> {
    console.log(
      `ReviewerPage: Starting to load stream configuration... (attempt ${retryCount + 1})`
    );
    this.setState({ configLoading: true, configError: null });

    try {
      console.log('ReviewerPage: Fetching /stream.config.json...');
      const response = await fetch('/stream.config.json', {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          'Cache-Control': 'no-cache',
        },
      });
      console.log(
        'ReviewerPage: Fetch response status:',
        response.status,
        response.statusText
      );

      if (!response.ok) {
        throw new Error(
          `Failed to load stream config: ${response.status} ${response.statusText}`
        );
      }

      const responseText = await response.text();
      console.log('ReviewerPage: Raw response text:', responseText);

      const config: StreamConfig = JSON.parse(responseText);
      console.log('ReviewerPage: Parsed stream configuration:', config);
      console.log('ReviewerPage: Source type from config:', config.source);

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
        'ReviewerPage: State updated with config, configLoading set to false'
      );

      // Show session panel if source is 'stream' and no session ID yet
      if (config.source === 'stream') {
        this.setState({ showSessionPanel: true });
        console.log(
          'ReviewerPage: Showing session selection panel for OKAS streaming'
        );
      }
    } catch (error) {
      console.error('ReviewerPage: Error loading stream configuration:', error);

      // Retry up to 3 times with increasing delay
      if (retryCount < MAX_RETRY_ATTEMPTS) {
        console.log(
          `ReviewerPage: Retrying in ${(retryCount + 1) * RETRY_DELAY_MS}ms...`
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
   * Handle session ready from SessionSelectionPanel
   */
  private handleSessionReady = (sessionId: string): void => {
    console.log('ReviewerPage: Session ready with ID:', sessionId);
    this.setState({
      sessionId,
      showSessionPanel: false,
    });
  };

  /**
   * Handle end stream function being ready
   */
  private handleEndStreamReady = (endStreamFn: () => void): void => {
    console.log('ReviewerPage: End stream function is ready');
    this.endStreamFn = endStreamFn;
  };

  /**
   * Handle end stream button click
   */
  private handleEndStreamClick = (): void => {
    if (this.endStreamFn) {
      console.log('ReviewerPage: Ending stream via status bar button');
      this.endStreamFn();
      // Clear the sessionId and show session panel to allow reconnecting
      this.setState({ sessionId: null, showSessionPanel: true });
    } else {
      console.warn('ReviewerPage: End stream function not available');
    }
  };

  /**
   * Handle stream disconnected (from stream component)
   */
  private handleStreamDisconnected = (): void => {
    console.log(
      'ReviewerPage: Stream disconnected, returning to session panel'
    );
    // Reset streaming state in Redux to clear any stale connection data
    this.props.resetStreamingState();
    // Clear the sessionId and show session panel to allow reconnecting
    this.setState({ sessionId: null, showSessionPanel: true });
  };

  /**
   * Header handlers
   */
  private handleSettingsClick = (): void => {
    console.log('Settings clicked');
  };

  private handleHelpClick = (): void => {
    console.log('Help clicked');
  };

  private handleProfileClick = (): void => {
    console.log('Profile clicked');
  };

  /**
   * Handle workflow step completion
   */
  private handleStepCompleted = (stepId: string): void => {
    console.log(`Reviewer workflow step completed: ${stepId}`);

    switch (stepId) {
      case 'solved-cases':
        // Solved case loaded successfully
        console.log('Solved case loaded, enabling visualization controls');
        break;
      case 'results':
        // Visualization complete
        console.log('Reviewer workflow completed!');
        break;
    }
  };

  /**
   * Animation control methods
   */
  private setTimestep = (timestep: number): void => {
    this.setState({ timestep });
  };

  private setFullscreen = (isFullscreen: boolean): void => {
    this.setState({ isFullscreen });
  };

  private startAnimation = (): void => {
    if (this.state.isPlaying) return;

    this.setState({ isPlaying: true });
    const interval = setInterval(() => {
      this.setState(prevState => {
        const nextTimestep =
          prevState.timestep >= 2530 ? 0 : prevState.timestep + 1;

        // Send timestep change message to Omniverse
        const timestepMessage = {
          event_type: 'timestepChanged',
          payload: { timestep: nextTimestep },
        };
        AppStreamer.sendMessage(JSON.stringify(timestepMessage));

        return { timestep: nextTimestep };
      });
    }, 100); // Change timestep every 100ms

    this.setState({ animationInterval: interval });
  };

  private stopAnimation = (): void => {
    if (this.state.animationInterval) {
      clearInterval(this.state.animationInterval);
    }
    this.setState({
      isPlaying: false,
      animationInterval: undefined,
    });
  };

  componentWillUnmount(): void {
    console.log(
      '🔴 ReviewerPage: componentWillUnmount called - component is being destroyed'
    );
    if (this.state.animationInterval) {
      clearInterval(this.state.animationInterval);
    }
  }

  /**
   * Render status bar with session information and controls
   */
  private renderStatusBar(): React.ReactNode {
    const { selectedSolvedCase, statusText } = this.props;
    const { sessionId, streamConfig } = this.state;

    return (
      <StatusBar
        designName={selectedSolvedCase?.name}
        status={statusText}
        sessionId={sessionId}
        showSessionInfo={streamConfig?.source === 'stream'}
        onEndStream={this.handleEndStreamClick}
      />
    );
  }

  render(): React.ReactNode {
    const { className, error, ...workflowProps } = this.props;
    const {
      streamConfig,
      configLoading,
      configError,
      sessionId,
      showSessionPanel,
    } = this.state;

    return (
      <div className={`reviewer-page ${className || ''}`}>
        <Header
          appName='Bottle Filling Digital Twin - Reviewer'
          onSettingsClick={this.handleSettingsClick}
          onHelpClick={this.handleHelpClick}
          onProfileClick={this.handleProfileClick}
        />

        {/* Error Banner */}
        {error && (
          <div className='error-banner'>
            <span className='error-icon'>⚠️</span>
            <span className='error-message'>{error}</span>
          </div>
        )}

        {/* Stream Config Error Banner */}
        {configError && (
          <div className='error-banner'>
            <span className='error-icon'>⚠️</span>
            <span className='error-message'>
              Stream Configuration Error: {configError}
            </span>
          </div>
        )}

        {/* Status Bar - shown for OKAS streaming sessions */}
        {this.renderStatusBar()}

        <div className='reviewer-split-layout'>
          {/* Streaming Viewport - 70% width */}
          <div className='streaming-area'>
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
          <div className='sidebar-content'>
            <ReviewerWorkflowManager
              ref={this.workflowManagerRef}
              {...workflowProps}
              onCompleteStep={this.handleStepCompleted}
              formProps={{
                ...this.props,
                timestep: this.state.timestep,
                isFullscreen: this.state.isFullscreen,
                isPlaying: this.state.isPlaying,
                setTimestep: this.setTimestep,
                setFullscreen: this.setFullscreen,
                startAnimation: this.startAnimation,
                stopAnimation: this.stopAnimation,
              }}
            />
          </div>
        </div>
      </div>
    );
  }
}

// Create the connected component
const ConnectedReviewerPage = connect(
  mapStateToProps,
  mapDispatchToProps
)(ReviewerPage);

// Set display name for debugging
ConnectedReviewerPage.displayName = 'ConnectedReviewerPage';

// Export the connected component
export default ConnectedReviewerPage;

// Export types for reuse
export type { ReviewerPageProps };
