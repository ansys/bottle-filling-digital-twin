/**
 * StreamMessenger
 *
 * Unified message sending interface for all streaming components
 * Maintains awareness of active stream source and routes messages accordingly
 */

import LocalStream from './LocalStream/LocalStream';
import { OKASStream } from './OKASStream/OKASStream';

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
