/**
 * FluentSolutionVariables Container
 *
 * Redux container component that connects FluentSolutionVariables UI to Redux state
 */

import { Component } from 'react';
import { connect, ConnectedProps } from 'react-redux';
import { AppStreamer } from '@nvidia/omniverse-webrtc-streaming-library';
import type { RootState, AppDispatch } from '../../../store';
import { setSelectedSolutionVariable } from '../../../store/slices/simulationSlice';
import {
  setLoading,
  setSimulationStatus,
} from '../../../store/slices/simulationSlice';
import FluentSolutionVariables, {
  type SolutionVariable,
} from './FluentSolutionVariables';

// Map Redux state to component props
const mapStateToProps = (state: RootState) => ({
  // Solution variables from simulation state
  fluentSolutionVariables: state.simulation.solutionVariables,
  selectedSolutionVariable: state.simulation.selectedSolutionVariable?.name,

  // Enable state from simulation (canInitialize flag)
  enabled: state.simulation.canInitialize,

  // Loading states
  isLoading: state.simulation.isLoading,
  statusText: state.simulation.statusText,
});

// Map Redux dispatch to component props
const mapDispatchToProps = (dispatch: AppDispatch) => ({
  // Solution variable actions (matching old frontend name)
  onSelectFluentSolutionVariables: (sv: SolutionVariable) => {
    dispatch(setSelectedSolutionVariable(sv));
  },

  // Async actions for visualization
  onVisualize: (
    fillingHeight: number,
    freeSurfaceOnly: boolean,
    sv?: string
  ) => {
    dispatch(dispatch => {
      try {
        // Set loading states like original frontend
        dispatch(setLoading(true));
        dispatch(setSimulationStatus('running'));

        // Send postProcessSolutionVariable message to Omniverse Kit application
        const message = {
          event_type: 'postProcessSolutionVariable',
          payload: {
            fillingHeight: fillingHeight,
            freeSurfaceOnly: freeSurfaceOnly,
            sv: sv,
          },
        };

        // Send message directly to Omniverse via AppStreamer
        try {
          AppStreamer.sendMessage(JSON.stringify(message));
          console.log(
            'Sent postProcessSolutionVariable message to Omniverse:',
            message
          );
        } catch (error) {
          console.error('Failed to send message to Omniverse:', error);
          dispatch(setLoading(false));
          dispatch(setSimulationStatus('error'));
          throw error;
        }
      } catch (error) {
        console.error('Failed to visualize solution variable:', error);
        dispatch(setLoading(false));
        dispatch(setSimulationStatus('error'));
      }
    });
  },
});

// Create connector
const connector = connect(mapStateToProps, mapDispatchToProps);
type PropsFromRedux = ConnectedProps<typeof connector>;

// Container component props
interface FluentSolutionVariablesContainerProps {
  width?: number;
  className?: string;
  onStepCompleted?: () => void;
}

// Combined props type
type FluentSolutionVariablesContainerAllProps = PropsFromRedux &
  FluentSolutionVariablesContainerProps;

/**
 * FluentSolutionVariablesContainer Class Component
 *
 * Handles Redux integration and async operations for FluentSolutionVariables
 */
class FluentSolutionVariablesContainer extends Component<FluentSolutionVariablesContainerAllProps> {
  componentDidMount(): void {
    // Initialize solution variables if needed
    if (this.props.fluentSolutionVariables.length === 0) {
      // Could dispatch an action to load solution variables
      console.log('FluentSolutionVariables: No solution variables available');
    }
  }

  render(): JSX.Element {
    const {
      fluentSolutionVariables,
      selectedSolutionVariable,
      enabled,
      isLoading,
      statusText,
      onSelectFluentSolutionVariables,
      onVisualize,
    } = this.props;

    return (
      <FluentSolutionVariables
        fluentSolutionVariables={fluentSolutionVariables}
        selectedSolutionVariable={selectedSolutionVariable}
        enabled={enabled}
        isLoading={isLoading}
        statusText={statusText}
        width={300} // Default width since it's not in props
        onSelectFluentSolutionVariables={onSelectFluentSolutionVariables}
        onVisualize={onVisualize}
      />
    );
  }
}

const ConnectedFluentSolutionVariablesContainer = connect(
  mapStateToProps,
  mapDispatchToProps
)(FluentSolutionVariablesContainer);

ConnectedFluentSolutionVariablesContainer.displayName =
  'ConnectedFluentSolutionVariablesContainer';

export default ConnectedFluentSolutionVariablesContainer;
