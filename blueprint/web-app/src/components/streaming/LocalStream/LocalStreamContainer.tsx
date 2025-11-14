/**
 * LocalStreamContainer Component
 *
 * Redux container for LocalStream component
 * Handles Redux integration and message passing
 */

import React, { Component } from 'react';
import { connect, ConnectedProps } from 'react-redux';
import type { RootState, AppDispatch } from '../../../store';
import { StreamEvent } from '@nvidia/omniverse-webrtc-streaming-library';
import { OmniverseMessageHandler } from '../../../services/OmniverseMessageHandler';
import LocalStream from './LocalStream';

interface OwnProps {
  server: string;
  signalingPort: number;
  mediaPort?: number;
  app: string;
  accessToken?: string;
  style?: React.CSSProperties;
}

const mapStateToProps = (state: RootState) => ({
  selectedDesignFile: state.simulation.selectedDesignFile,
  simulationStatus: state.simulation.simulationStatus,
  simulationProgress: state.simulation.simulationProgress,
});

const mapDispatchToProps = (dispatch: AppDispatch) => ({
  dispatch,
});

const connector = connect(mapStateToProps, mapDispatchToProps);
type PropsFromRedux = ConnectedProps<typeof connector>;
type LocalStreamContainerProps = PropsFromRedux & OwnProps;

/**
 * LocalStreamContainer - Connects LocalStream to Redux
 */
class LocalStreamContainer extends Component<LocalStreamContainerProps> {
  private messageHandler: OmniverseMessageHandler;
  private streamRef: React.RefObject<LocalStream>;

  constructor(props: LocalStreamContainerProps) {
    super(props);
    this.messageHandler = new OmniverseMessageHandler(props.dispatch);
    this.streamRef = React.createRef();
  }

  componentDidUpdate(prevProps: LocalStreamContainerProps): void {
    // Send simulation status updates to Omniverse
    if (prevProps.simulationStatus !== this.props.simulationStatus) {
      this.sendSimulationStatusChange();
    }
  }

  /**
   * Handle custom events from Omniverse
   */
  private handleCustomEvent = (event: StreamEvent): void => {
    this.messageHandler.handleCustomEvent(event);
  };

  /**
   * Send simulation status change to Omniverse
   */
  private sendSimulationStatusChange = (): void => {
    const message = {
      type: 'simulation_status_change',
      payload: {
        status: this.props.simulationStatus,
      },
    };

    console.log('LocalStreamContainer: Sending status change:', message);

    // Only send if stream is ready
    if (this.streamRef.current) {
      const streamInstance = this.streamRef.current;
      const state = streamInstance.state as { streamReady: boolean };

      if (state.streamReady) {
        streamInstance.sendMessage(message);
      } else {
        console.log('LocalStreamContainer: Stream not ready yet, skipping message');
      }
    }
  };

  render(): JSX.Element {
    const { server, signalingPort, mediaPort, app, accessToken, style } =
      this.props;

    return (
      <LocalStream
        ref={this.streamRef}
        server={server}
        signalingPort={signalingPort}
        mediaPort={mediaPort}
        app={app}
        accessToken={accessToken}
        style={style}
        onCustomEvent={this.handleCustomEvent}
      />
    );
  }
}

const ConnectedLocalStreamContainer = connector(LocalStreamContainer);
export default ConnectedLocalStreamContainer;
