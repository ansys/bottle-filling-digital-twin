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
 * GFNNotImplemented Component
 *
 * Warning screen for GFN streaming (not yet implemented)
 */

import React, { Component } from 'react';

export interface GFNNotImplementedProps {
  style?: React.CSSProperties;
}

/**
 * GFNNotImplemented - Shows warning that GFN is not implemented yet
 */
class GFNNotImplemented extends Component<GFNNotImplementedProps> {
  render(): React.ReactNode {
    const { style } = this.props;

    return (
      <div
        className='gfn-not-implemented-container'
        style={{
          width: '100%',
          height: '100%',
          backgroundColor: '#1a1a1a',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          ...style,
        }}
      >
        <div
          style={{
            maxWidth: '600px',
            padding: '2rem',
            textAlign: 'center',
            color: '#ffffff',
          }}
        >
          <div
            style={{
              width: '80px',
              height: '80px',
              backgroundColor: '#FFA726',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.5rem',
              fontSize: '48px',
            }}
          >
            ⚠
          </div>

          <h2
            style={{
              margin: '0 0 1rem',
              fontSize: '2rem',
              color: '#FFA726',
            }}
          >
            GFN Streaming Not Implemented
          </h2>

          <p
            style={{
              margin: '0 0 1.5rem',
              fontSize: '1.1rem',
              color: '#cccccc',
              lineHeight: '1.6',
            }}
          >
            GeForce NOW (GFN) streaming support is planned for a future release.
            This feature will enable cloud-based streaming of Omniverse
            applications.
          </p>

          <div
            style={{
              padding: '1rem',
              backgroundColor: 'rgba(255, 167, 38, 0.1)',
              borderLeft: '4px solid #FFA726',
              borderRadius: '4px',
              textAlign: 'left',
            }}
          >
            <p
              style={{
                margin: '0 0 0.5rem',
                fontSize: '0.875rem',
                color: '#FFA726',
                fontWeight: 'bold',
              }}
            >
              Available Options:
            </p>
            <ul
              style={{
                margin: 0,
                paddingLeft: '1.5rem',
                color: '#cccccc',
                fontSize: '0.875rem',
              }}
            >
              <li>
                Local Streaming: Connect to a local Omniverse Kit instance
              </li>
              <li>
                OKAS Streaming: Use Omniverse Kit Application Streaming service
              </li>
            </ul>
          </div>

          <p
            style={{
              margin: '1.5rem 0 0',
              fontSize: '0.875rem',
              color: '#888888',
            }}
          >
            Please configure your streaming source in the application settings.
          </p>
        </div>
      </div>
    );
  }
}

export default GFNNotImplemented;
