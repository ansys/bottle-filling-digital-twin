/**
 * StreamVideoDisplay Component
 *
 * Displays the video and audio elements for Omniverse streaming
 * Pure presentation component with minimal logic
 */

import React, { Component } from 'react';

export interface StreamVideoDisplayProps {
  style?: React.CSSProperties;
}

/**
 * StreamVideoDisplay - Renders video and audio elements for WebRTC streaming
 */
class StreamVideoDisplay extends Component<StreamVideoDisplayProps> {
  render(): React.ReactNode {
    const { style } = this.props;

    return (
      <>
        {/* Video element for WebRTC stream */}
        <video
          id='remote-video'
          autoPlay
          playsInline
          muted
          style={{
            left: 0,
            top: 0,
            width: '100%',
            height: '100%',
            ...style,
          }}
          tabIndex={-1}
        >
          {/* Placeholder track for accessibility compliance */}
          <track kind='captions' srcLang='en' label='English captions' />
        </video>

        {/* Audio element for WebRTC stream */}
        <audio id='remote-audio' muted style={{ display: 'none' }}>
          {/* Placeholder track for accessibility compliance */}
          <track kind='captions' srcLang='en' label='English captions' />
        </audio>

        {/* Message display element for stream events (required by NVIDIA library) */}
        <h3 style={{ visibility: 'hidden' }} id='message-display'>
          ...
        </h3>

        {/* Status Elements (required by NVIDIA library) */}
        <div id='status-message' style={{ display: 'none' }}></div>
        <div id='connection-status' style={{ display: 'none' }}></div>
      </>
    );
  }
}

export default StreamVideoDisplay;
