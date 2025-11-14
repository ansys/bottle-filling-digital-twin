/**
 * OKASStreamContainer Component
 *
 * Redux container for OKASStream component
 * Handles Redux integration and message passing
 */

import React, { Component } from 'react';
import { connect, ConnectedProps } from 'react-redux';
import type { RootState, AppDispatch } from '../../../store';
import { StreamEvent } from '@nvidia/omniverse-webrtc-streaming-library';
import { OmniverseMessageHandler } from '../../../services/OmniverseMessageHandler';
import { OKASStream, OKASStreamWithHook } from './OKASStream';

interface OwnProps {
  appServer: string;
  streamServer: string;
  appId: string;
  appVersion: string;
  profile: string;
  app: string;
  accessToken?: string;
  initialSessionId?: string;
  onEndStreamReady?: (endStreamFn: () => void) => void;
  onStreamDisconnected?: () => void;
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
type OKASStreamContainerProps = PropsFromRedux & OwnProps;

/**
 * OKASStreamContainer - Connects OKASStream to Redux
 */
class OKASStreamContainer extends Component<OKASStreamContainerProps> {
  private messageHandler: OmniverseMessageHandler;

  constructor(props: OKASStreamContainerProps) {
    super(props);
    this.messageHandler = new OmniverseMessageHandler(props.dispatch);
  }

  componentDidUpdate(prevProps: OKASStreamContainerProps): void {
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
   * Handle session created
   */
  private handleSessionCreated = (sessionId: string): void => {
    console.log('OKASStreamContainer: Session created:', sessionId);
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

    console.log('OKASStreamContainer: Sending status change:', message);

    // Use OKASStream static method to send message if stream is ready
    const messageStr = JSON.stringify(message);
    OKASStream.sendMessage(messageStr);
  };

  render(): JSX.Element {
    const {
      appServer,
      streamServer,
      appId,
      appVersion,
      profile,
      app,
      accessToken,
      initialSessionId,
      onEndStreamReady,
      onStreamDisconnected,
      style,
    } = this.props;

    return (
      <OKASStreamWithHook
        appServer={appServer}
        streamServer={streamServer}
        appId={appId}
        appVersion={appVersion}
        profile={profile}
        app={app}
        accessToken={accessToken}
        initialSessionId={initialSessionId}
        onEndStreamReady={onEndStreamReady}
        onStreamDisconnected={onStreamDisconnected}
        style={style}
        onCustomEvent={this.handleCustomEvent}
        onSessionCreated={this.handleSessionCreated}
      />
    );
  }
}

const ConnectedOKASStreamContainer = connector(OKASStreamContainer);
export default ConnectedOKASStreamContainer;
