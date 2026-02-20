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
