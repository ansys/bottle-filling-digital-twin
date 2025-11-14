/**
 * StreamRouter Component
 *
 * Routes to the appropriate streaming component based on source type
 */

import React, { Component } from 'react';
import { StreamConfig } from '../../../types';
import LocalStreamContainer from '../LocalStream/LocalStreamContainer';
import OKASStreamContainer from '../OKASStream/OKASStreamContainer';
import GFNNotImplemented from '../GFNNotImplemented/GFNNotImplemented';
import StreamSourceError from '../StreamSourceError/StreamSourceError';
import StreamMessenger from '../StreamMessenger';

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
