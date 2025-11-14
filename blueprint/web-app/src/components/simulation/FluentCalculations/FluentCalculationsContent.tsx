/**
 * Fluent Calculations Content Container
 *
 * Redux container component that provides FluentCalculations content without tab wrapper.
 * Used with CollapsibleTab for reusable tab architecture.
 */

import { Component } from 'react';
import { connect, ConnectedProps } from 'react-redux';
import { AppStreamer } from '@nvidia/omniverse-webrtc-streaming-library';
import type { RootState, AppDispatch } from '../../../store';
import {
  setNumTimesteps,
  setViscosity,
  setBottlesPerHour,
  setTolerance,
  startCalculation,
} from '../../../store/slices/fluentSlice';
import {
  setLoading,
  setSimulationStatus,
} from '../../../store/slices/simulationSlice';
import FluentCalculations from './FluentCalculations';

// Map Redux state to component props
const mapStateToProps = (state: RootState) => ({
  // Enable state from simulation canRun (like old frontend)
  enabled: state.simulation.canRun,
  calculationParams: state.fluent.calculationParams,
  isCalculating: state.fluent.isCalculating,
  calculationStatus: state.fluent.calculationStatus,
  calculationError: state.fluent.calculationError,
  // Add loading state from simulation slice
  isLoading: state.simulation.isLoading,
  statusText: state.simulation.statusText,
});

// Map Redux actions to component props
const mapDispatchToProps = (dispatch: AppDispatch) => ({
  setNumTimesteps: (value: number) => dispatch(setNumTimesteps(value)),
  setViscosity: (value: number) => dispatch(setViscosity(value)),
  setBottlesPerHour: (value: number) => dispatch(setBottlesPerHour(value)),
  setTolerance: (value: number) => dispatch(setTolerance(value)),
  startCalculation: () => dispatch(startCalculation()),
  // Add simulation loading actions
  setLoading: (loading: boolean) => dispatch(setLoading(loading)),
  setSimulationStatus: (
    status:
      | 'idle'
      | 'initializing'
      | 'running'
      | 'completed'
      | 'error'
      | 'cancelled'
  ) => dispatch(setSimulationStatus(status)),
});

// Create connector
const connector = connect(mapStateToProps, mapDispatchToProps);
type PropsFromRedux = ConnectedProps<typeof connector>;

// Container component props (minimal since no tab wrapper)
interface FluentCalculationsContentProps {
  width?: number;
  className?: string;
  // Callback to notify parent that step is completed
  onStepCompleted?: () => void;
}

// Combined props type
type FluentCalculationsContentAllProps = PropsFromRedux &
  FluentCalculationsContentProps;

interface FluentCalculationsContentState {
  // Container-specific state if needed
}

/**
 * Fluent Calculations Content Container
 *
 * Renders only the FluentCalculations content without tab wrapper.
 * Communicates completion state to parent workflow manager.
 */
class FluentCalculationsContent extends Component<
  FluentCalculationsContentAllProps,
  FluentCalculationsContentState
> {
  constructor(props: FluentCalculationsContentAllProps) {
    super(props);
    this.state = {};
  }

  // Handle calculate (matching old frontend interface) with completion callback
  private handleCalculate = (
    numTimesteps: number,
    viscosity: number,
    bottlesPerHour: number,
    tolerance: number
  ) => {
    console.log('Sending runCalculations message to Omniverse Kit');

    try {
      // Set loading states like original frontend
      this.props.setLoading(true);
      this.props.setSimulationStatus('running');

      // Send message to Omniverse Kit like old frontend
      const message = {
        event_type: 'runCalculations',
        payload: {
          numTimesteps,
          viscosity,
          bottlesPerHour,
          tolerance,
        },
      };

      // Send message directly to Omniverse via AppStreamer
      AppStreamer.sendMessage(JSON.stringify(message));
      console.log('Sent runCalculations message to Omniverse:', message);

      // Note: onStepCompleted will be called when runCalculationsResponse is received
      // The parent component should listen to Redux state changes for actual completion
    } catch (error) {
      console.error('Failed to send runCalculations message:', error);
      this.props.setLoading(false);
      this.props.setSimulationStatus('error');
    }
  };

  public render(): JSX.Element {
    const { width, enabled, isLoading, statusText, className } = this.props;

    return (
      <div className={className}>
        <FluentCalculations
          width={width || 800}
          enabled={enabled}
          isLoading={isLoading}
          statusText={statusText}
          onCalculate={this.handleCalculate}
        />
      </div>
    );
  }
}

// Create the connected component
const ConnectedFluentCalculationsContent = connect(
  mapStateToProps,
  mapDispatchToProps
)(FluentCalculationsContent);

// Set display name for debugging
ConnectedFluentCalculationsContent.displayName =
  'ConnectedFluentCalculationsContent';

// Export the connected content container
export default ConnectedFluentCalculationsContent;

// Export types for reuse
export type { FluentCalculationsContentProps };
