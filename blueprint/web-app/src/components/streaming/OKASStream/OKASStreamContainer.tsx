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
 * OKASStreamContainer Component
 *
 * Redux container for OKASStream component
 * Handles Redux integration and message passing
 */

import React, { Component } from 'react';
import { connect, ConnectedProps } from 'react-redux';
import type { RootState, AppDispatch } from '@/store';
import { StreamEvent } from '@nvidia/omniverse-webrtc-streaming-library';
import { OmniverseMessageHandler } from '@/services/OmniverseMessageHandler.ts';
import { OKASStream, OKASStreamWithHook } from './OKASStream.tsx';

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
