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
 * StreamMessenger
 *
 * Unified message sending interface for all streaming components
 * Maintains awareness of active stream source and routes messages accordingly
 */

import LocalStream from './LocalStream/LocalStream.tsx';
import { OKASStream } from './OKASStream/OKASStream.tsx';

type StreamSource = 'local' | 'stream' | 'gfn' | null;

/**
 * Stream Messenger class
 *
 * Provides static sendMessage method that routes to the correct active streaming component
 */
class StreamMessenger {
  private static activeSource: StreamSource = null;

  /**
   * Set the active stream source
   * Should be called when a stream component initializes
   */
  public static setActiveSource(source: StreamSource): void {
    console.log('StreamMessenger: Setting active source to:', source);
    this.activeSource = source;
  }

  /**
   * Get the current active stream source
   */
  public static getActiveSource(): StreamSource {
    return this.activeSource;
  }

  /**
   * Send a message to the active Omniverse stream
   *
   * Routes the message to the appropriate streaming component based on
   * the active source (local -> LocalStream, stream -> OKASStream)
   *
   * @param message - JSON string or object to send
   */
  public static sendMessage(message: string | object): void {
    const messageStr =
      typeof message === 'string' ? message : JSON.stringify(message);

    // Route based on active source
    switch (this.activeSource) {
      case 'local':
        try {
          LocalStream.sendMessage(messageStr);
          return;
        } catch (error) {
          console.error('StreamMessenger: LocalStream sendMessage failed:', error);
        }
        break;

      case 'stream':
        try {
          OKASStream.sendMessage(messageStr);
          return;
        } catch (error) {
          console.error('StreamMessenger: OKASStream sendMessage failed:', error);
        }
        break;

      case 'gfn':
        console.warn('StreamMessenger: GFN streaming not yet implemented');
        break;

      default:
        console.warn(
          'StreamMessenger: No active stream source set. Call setActiveSource() first.'
        );
    }
  }
}

export default StreamMessenger;
