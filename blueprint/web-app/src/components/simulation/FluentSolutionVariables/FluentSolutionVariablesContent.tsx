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
 * FluentSolutionVariables Content Container
 *
 * Redux container component that provides FluentSolutionVariables content without tab wrapper.
 * Used with CollapsibleTab for reusable tab architecture.
 */

import { Component } from 'react';
import { connect, ConnectedProps } from 'react-redux';
import { AppStreamer } from '@nvidia/omniverse-webrtc-streaming-library';
import type { RootState, AppDispatch } from '@/store';
import { setSelectedSolutionVariable } from '@/store/slices/simulationSlice.ts';
import {
  setLoading,
  setSimulationStatus,
} from '@/store/slices/simulationSlice.ts';
import FluentSolutionVariables, {
  type SolutionVariable,
} from './FluentSolutionVariables.tsx';

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

// Container component props (minimal since no tab wrapper)
interface FluentSolutionVariablesContentProps {
  width?: number;
  className?: string;
  // Callback to notify parent that step is completed
  onStepCompleted?: () => void;
}

// Combined props type
type FluentSolutionVariablesContentAllProps = PropsFromRedux &
  FluentSolutionVariablesContentProps;

/**
 * FluentSolutionVariables Content Container
 *
 * Renders only the FluentSolutionVariables content without tab wrapper.
 * Communicates completion state to parent workflow manager.
 */
class FluentSolutionVariablesContent extends Component<FluentSolutionVariablesContentAllProps> {
  componentDidMount(): void {
    // Initialize solution variables if needed
    if (this.props.fluentSolutionVariables.length === 0) {
      // Could dispatch an action to load solution variables
      console.log('FluentSolutionVariables: No solution variables available');
    }
  }

  // Handle visualization with completion callback
  private handleVisualize = (
    fillingHeight: number,
    freeSurfaceOnly: boolean,
    sv?: string
  ) => {
    const { onVisualize } = this.props;

    if (onVisualize) {
      onVisualize(fillingHeight, freeSurfaceOnly, sv);

      // Note: onStepCompleted will be called when visualization completes
      // The parent component should listen to Redux state changes for actual completion
    }
  };

  render(): JSX.Element {
    const {
      fluentSolutionVariables,
      selectedSolutionVariable,
      enabled,
      isLoading,
      statusText,
      width,
      className,
      onSelectFluentSolutionVariables,
    } = this.props;

    return (
      <div className={className}>
        <FluentSolutionVariables
          fluentSolutionVariables={fluentSolutionVariables}
          selectedSolutionVariable={selectedSolutionVariable}
          enabled={enabled}
          isLoading={isLoading}
          statusText={statusText}
          width={width || 300}
          onSelectFluentSolutionVariables={onSelectFluentSolutionVariables}
          onVisualize={this.handleVisualize}
        />
      </div>
    );
  }
}

// Create the connected component
const ConnectedFluentSolutionVariablesContent = connect(
  mapStateToProps,
  mapDispatchToProps
)(FluentSolutionVariablesContent);

// Set display name for debugging
ConnectedFluentSolutionVariablesContent.displayName =
  'ConnectedFluentSolutionVariablesContent';

// Export the connected content container
export default ConnectedFluentSolutionVariablesContent;

// Export types for reuse
export type { FluentSolutionVariablesContentProps };
