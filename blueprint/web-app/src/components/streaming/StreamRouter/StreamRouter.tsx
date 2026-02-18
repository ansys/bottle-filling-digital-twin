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
 * StreamRouter Component
 *
 * Routes to the appropriate streaming component based on source type
 */

import React, { Component } from 'react';
import { StreamConfig } from '@/types';
import LocalStreamContainer from '../LocalStream/LocalStreamContainer.tsx';
import OKASStreamContainer from '../OKASStream/OKASStreamContainer.tsx';
import GFNNotImplemented from '../GFNNotImplemented/GFNNotImplemented.tsx';
import StreamSourceError from '../StreamSourceError/StreamSourceError.tsx';
import StreamMessenger from '../StreamMessenger.ts';

export interface StreamRouterProps {
  streamConfig: StreamConfig;
  className?: string;
  style?: React.CSSProperties;
  onEndStreamReady?: (endStreamFn: () => void) => void;
  onStreamDisconnected?: () => void;
}

/**
 * StreamRouter - Selects and renders the appropriate streaming component
 */
class StreamRouter extends Component<StreamRouterProps> {
  componentDidMount(): void {
    // Set the active source in StreamMessenger
    StreamMessenger.setActiveSource(this.props.streamConfig.source);
  }

  componentDidUpdate(prevProps: StreamRouterProps): void {
    // Update active source if config changes
    if (prevProps.streamConfig.source !== this.props.streamConfig.source) {
      StreamMessenger.setActiveSource(this.props.streamConfig.source);
    }
  }

  componentWillUnmount(): void {
    // Clear active source when unmounting
    StreamMessenger.setActiveSource(null);
  }

  render(): React.ReactNode {
    const { streamConfig, className, style, onEndStreamReady, onStreamDisconnected } = this.props;

    console.log('StreamRouter: Routing to source type:', streamConfig.source);

    switch (streamConfig.source) {
      case 'local':
        if (!streamConfig.local) {
          console.error('StreamRouter: Local config is missing');
          return (
            <div className={className}>
              <StreamSourceError
                source='local (missing configuration)'
                style={style}
              />
            </div>
          );
        }

        return (
          <div className={className}>
            <LocalStreamContainer
              server={streamConfig.local.server}
              signalingPort={streamConfig.local.signalingPort || 49100}
              mediaPort={streamConfig.local.mediaPort}
              app='OmniverseApp'
              accessToken='omniverse-token'
              style={style}
            />
          </div>
        );

      case 'stream':
        if (!streamConfig.stream) {
          console.error('StreamRouter: Stream config is missing');
          return (
            <div className={className}>
              <StreamSourceError
                source='stream (missing configuration)'
                style={style}
              />
            </div>
          );
        }

        return (
          <div className={className}>
            <OKASStreamContainer
              appServer={streamConfig.stream.appServer}
              streamServer={streamConfig.stream.streamServer}
              appId={streamConfig.stream.appId}
              appVersion={streamConfig.stream.appVersion}
              profile={streamConfig.stream.profile}
              app='OmniverseApp'
              accessToken='stream-token'
              initialSessionId={streamConfig.stream.initialSessionId}
              onEndStreamReady={onEndStreamReady}
              onStreamDisconnected={onStreamDisconnected}
              style={style}
            />
          </div>
        );

      case 'gfn':
        console.warn('StreamRouter: GFN streaming is not yet implemented');
        return (
          <div className={className}>
            <GFNNotImplemented style={style} />
          </div>
        );

      default:
        console.error(
          'StreamRouter: Unknown source type:',
          streamConfig.source
        );
        return (
          <div className={className}>
            <StreamSourceError source={streamConfig.source} style={style} />
          </div>
        );
    }
  }
}

export default StreamRouter;
