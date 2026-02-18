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
 * Fluent Calculations Container
 *
 * Container component that connects Redux state to FluentCalculations UI component
 */

import { Component } from 'react';
import { connect, ConnectedProps } from 'react-redux';
import { AppStreamer } from '@nvidia/omniverse-webrtc-streaming-library';
import type { RootState, AppDispatch } from '@/store';
import {
  setNumTimesteps,
  setViscosity,
  setBottlesPerHour,
  setTolerance,
  startCalculation,
} from '@/store/slices/fluentSlice.ts';
import {
  setLoading,
  setSimulationStatus,
} from '@/store/slices/simulationSlice.ts';
import FluentCalculations from './FluentCalculations.tsx';

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

// Define props type from connector
type PropsFromRedux = ConnectedProps<typeof connector>;

// Component props interface
interface FluentCalculationsContainerProps extends PropsFromRedux {
  width: number;
  onStepCompleted?: () => void;
}

interface FluentCalculationsContainerState {
  // Container-specific state if needed
}

class FluentCalculationsContainer extends Component<
  FluentCalculationsContainerProps,
  FluentCalculationsContainerState
> {
  constructor(props: FluentCalculationsContainerProps) {
    super(props);
    this.state = {};
  }

  // Handle calculate (matching old frontend interface)
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

      // Send message directly to Omniverse via StreamMessenger
      AppStreamer.sendMessage(JSON.stringify(message));
      console.log('Sent runCalculations message to Omniverse:', message);
    } catch (error) {
      console.error('Failed to send runCalculations message:', error);
      this.props.setLoading(false);
      this.props.setSimulationStatus('error');
    }
  };

  public render(): JSX.Element {
    const { width, enabled, isLoading, statusText } = this.props;

    return (
      <FluentCalculations
        width={width}
        enabled={enabled}
        isLoading={isLoading}
        statusText={statusText}
        onCalculate={this.handleCalculate}
      />
    );
  }
}

// Export connected component
const ConnectedFluentCalculationsContainer = connector(
  FluentCalculationsContainer
);
ConnectedFluentCalculationsContainer.displayName =
  'FluentCalculationsContainer';
export default ConnectedFluentCalculationsContainer;
