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
 * SolverSetup Container
 *
 * Redux container component that provides SolverSetup content without tab wrapper.
 * Used with CollapsibleTab for reusable tab architecture.
 */

import { Component } from 'react';
import { connect, ConnectedProps } from 'react-redux';
import { AppStreamer } from '@nvidia/omniverse-webrtc-streaming-library';
import type { RootState, AppDispatch } from '@/store';
import {
  setSelectedDesignFile,
  setSelectedResolution,
  setError,
  setLoading,
  setSimulationStatus,
} from '@/store/slices/simulationSlice.ts';
import SolverSetup, { type DesignFile } from './SolverSetup.tsx';

// Map Redux state to component props
export const mapStateToProps = (state: RootState) => ({
  // Design files from simulation state
  designFiles: state.simulation.designFiles.map((file, index) => ({
    id: `design-${index}`,
    name: file.name,
    url: file.url,
    description: `Design file: ${file.name}`,
  })) as DesignFile[],
  selectedDesignFileId: state.simulation.selectedDesignFile
    ? `design-${state.simulation.designFiles.findIndex(f => f.name === state.simulation.selectedDesignFile?.name)}`
    : null,

  // Solver configuration
  selectedResolution: state.simulation.selectedResolution,

  // Loading states
  isLoading: state.simulation.isLoading,
  isOpening: state.simulation.simulationStatus === 'initializing',
});

// Map Redux dispatch to component props
export const mapDispatchToProps = (dispatch: AppDispatch) => ({
  // Design file actions
  onSelectDesignFile: (designFileId: string) => {
    const designIndex = parseInt(designFileId.replace('design-', ''));
    const designFiles = [
      {
        name: '500ml Water Bottle',
        url: '/500mlWaterBottle/500-ml-water-bottle',
      },
      {
        name: '2000ml Water Bottle',
        url: '/2000mlWaterBottle/2000-ml-water-bottle',
      },
    ];
    const designFile = designFiles[designIndex];
    if (designFile && designFile.name !== 'Select Design') {
      dispatch(setSelectedDesignFile(designFile));
    }
  },

  // Resolution actions
  onSelectResolution: (resolution: string) => {
    dispatch(setSelectedResolution(resolution));
  },

  // Async actions for opening design file
  onOpenDesignFile: () => {
    console.log('[mapDispatchToProps] onOpenDesignFile called');
    dispatch((dispatch: AppDispatch, getState: () => RootState) => {
      try {
        console.log('[Thunk] Starting design file open process');
        console.log(
          '[Thunk] AppStreamer.sendMessage available:',
          typeof AppStreamer.sendMessage
        );

        dispatch(setError(null));

        const state = getState();
        const selectedDesignFile = state.simulation.selectedDesignFile;
        const selectedResolution = state.simulation.selectedResolution;

        console.log('[Thunk] Selected file:', selectedDesignFile);
        console.log('[Thunk] Selected resolution:', selectedResolution);

        if (selectedDesignFile && selectedDesignFile.name !== 'Select Design') {
          console.log('[Thunk] Opening design file:', selectedDesignFile.name);

          dispatch(setLoading(true));
          dispatch(setSimulationStatus('initializing'));

          const messageUrl = selectedDesignFile.url + '_' + selectedResolution;
          console.log('[Thunk] Full URL:', messageUrl);

          const message = {
            event_type: 'loadDesignFile',
            payload: {
              url: messageUrl,
            },
          };

          try {
            const messageStr = JSON.stringify(message);
            console.log('[Thunk] Message object:', message);
            console.log('[Thunk] Message string to send:', messageStr);
            console.log('[Thunk] Calling AppStreamer.sendMessage...');
            AppStreamer.sendMessage(messageStr);
            console.log('[Thunk] Message sent successfully');
          } catch (error) {
            console.error(
              '[Thunk] Failed to send message to Omniverse:',
              error
            );
            dispatch(setLoading(false));
            throw error;
          }
        } else {
          console.error('[Thunk] No design file selected or invalid selection');
          throw new Error('No design file selected');
        }
      } catch (error) {
        console.error('[Thunk] Failed to open design file:', error);
        dispatch(
          setError(
            error instanceof Error
              ? error.message
              : 'Failed to open design file'
          )
        );
      }
    });
  },
});

// Create connector
const connector = connect(mapStateToProps, mapDispatchToProps);
type PropsFromRedux = ConnectedProps<typeof connector>;

// Container component props (minimal since no tab wrapper)
interface SolverSetupContainerProps {
  width?: number;
  className?: string;
  // Callback to notify parent that step is completed
  onStepCompleted?: () => void;
}

// Combined props type
type SolverSetupContainerAllProps = PropsFromRedux & SolverSetupContainerProps;

/**
 * SolverSetup Container
 *
 * Renders only the SolverSetup content without tab wrapper.
 * Communicates completion state to parent workflow manager.
 */
export class SolverSetupContainer extends Component<SolverSetupContainerAllProps> {
  /**
   * Load design files when component mounts and check Fluent instance health
   */
  async componentDidMount(): Promise<void> {
    try {
      // Load available design files if not already loaded
      if (this.props.designFiles.length === 0) {
        // Design files are loaded elsewhere or on app startup
      }

      // Send health check message to verify Fluent instance is healthy
      this.sendHealthCheckMessage();
    } catch (error) {
      console.error('Failed to load design files:', error);
    }
  }

  /**
   * Send health check message to Omniverse to verify Fluent instance status
   * Delayed to ensure stream is ready
   */
  private sendHealthCheckMessage = (): void => {
    // Add a small delay to ensure the stream is initialized
    setTimeout(() => {
      try {
        const healthCheckMessage = {
          event_type: 'isInstanceHealthy',
          payload: {},
        };

        console.log(
          '[SolverSetupContainer] Sending health check message:',
          healthCheckMessage
        );
        AppStreamer.sendMessage(JSON.stringify(healthCheckMessage));
      } catch (error) {
        console.error(
          '[SolverSetupContainer] Failed to send health check message:',
          error
        );
        // Don't spam console with stream controller errors during initialization
        if (!(error as Error).toString().includes('no stream controller')) {
          console.error('[SolverSetupContainer] Health check failed:', error);
        }
      }
    }, 5000); // 5 second delay to ensure WebRTC data channel is fully ready
  };

  /**
   * Handle opening design file with async logic and completion callback
   */
  private handleOpenDesignFile = (): void => {
    console.log('[SolverSetupContainer] Button clicked');
    const { selectedDesignFileId, onOpenDesignFile, onStepCompleted } =
      this.props;

    console.log(
      '[SolverSetupContainer] Selected design file ID:',
      selectedDesignFileId
    );
    console.log(
      '[SolverSetupContainer] onOpenDesignFile available:',
      !!onOpenDesignFile
    );

    if (selectedDesignFileId && onOpenDesignFile) {
      console.log('[SolverSetupContainer] Calling onOpenDesignFile...');
      onOpenDesignFile();

      // Notify parent that this step will be completed when loading finishes
      // The parent should listen to Redux state changes for actual completion
      if (onStepCompleted) {
        // This will be called when the design file loads successfully
        // For now, we'll let the parent component listen to state changes
      }
    } else {
      console.warn(
        '[SolverSetupContainer] Cannot open design file - missing requirements'
      );
    }
  };

  render(): JSX.Element {
    const {
      designFiles,
      selectedDesignFileId,
      selectedResolution,
      isLoading,
      isOpening,
      width,
      className,
      onSelectDesignFile,
      onSelectResolution,
    } = this.props;

    return (
      <div className={className}>
        <SolverSetup
          designFiles={designFiles}
          selectedDesignFileId={selectedDesignFileId}
          selectedResolution={selectedResolution}
          isLoading={isLoading}
          isOpening={isOpening}
          width={width}
          onSelectDesignFile={onSelectDesignFile}
          onSelectResolution={onSelectResolution}
          onOpenDesignFile={this.handleOpenDesignFile}
        />
      </div>
    );
  }
}

// Create the connected component
const ConnectedSolverSetupContainer = connect(
  mapStateToProps,
  mapDispatchToProps
)(SolverSetupContainer);

// Set display name for debugging
ConnectedSolverSetupContainer.displayName = 'ConnectedSolverSetupContainer';

// Export the connected container
export default ConnectedSolverSetupContainer;

// Export types for reuse
export type { SolverSetupContainerProps };
