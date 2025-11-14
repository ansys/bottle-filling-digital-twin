/**
 * BaseStreamComponent
 *
 * Common base class for streaming components with shared event handling logic
 * Provides consistent event handling across Local, OKAS, and future streaming sources
 */

import { Component } from 'react';
import {
  AppStreamer,
  StreamEvent,
  eStatus,
  eAction,
} from '@nvidia/omniverse-webrtc-streaming-library';

export interface BaseStreamState {
  streamReady: boolean;
  isConnecting: boolean;
  error: string | null;
}

export interface BaseStreamProps {
  onStart?: (message: StreamEvent) => void;
  onStop?: (message: StreamEvent) => void;
  onUpdate?: (message: StreamEvent) => void;
  onCustomEvent?: (message: StreamEvent) => void;
  onStreamStats?: (message: StreamEvent) => void;
}

/**
 * BaseStreamComponent - Provides common streaming event handlers
 *
 * Extend this class to inherit standard event handling behavior
 */
export abstract class BaseStreamComponent<
  P extends BaseStreamProps,
  S extends BaseStreamState,
> extends Component<P, S> {
  protected appStreamer?: AppStreamer;

  /**
   * Handle stream start event
   * Consistent handling across all streaming types
   */
  protected handleStart = (message: StreamEvent): void => {
    console.log(`${this.constructor.name}: onStart:`, message);

    if (message.status === eStatus.success) {
      this.setState({
        streamReady: true,
        isConnecting: false,
        error: null,
      } as Partial<S> as Pick<S, keyof S>);
      console.info(`${this.constructor.name}: Stream connected and ready`);
    } else if (message.status === eStatus.warning) {
      console.warn(
        `${this.constructor.name}: Stream connection warning:`,
        message
      );
      // Don't set error state for warnings, just log
    } else if (message.status === eStatus.error) {
      this.setState({
        isConnecting: false,
        error: `Connection failed: ${message.info || 'Unknown error'}`,
      } as Partial<S> as Pick<S, keyof S>);
      console.error(
        `${this.constructor.name}: Stream connection failed:`,
        message
      );
    }

    // Call parent callback if provided
    if (this.props.onStart) {
      this.props.onStart(message);
    }
  };

  /**
   * Handle stream stop event
   * Consistent handling for disconnection scenarios
   */
  protected handleStop = (message: StreamEvent): void => {
    console.log(`${this.constructor.name}: onStop:`, message);

    if (
      message.action === eAction.terminate &&
      message.status === eStatus.error
    ) {
      console.error(
        `${this.constructor.name}: Stream disconnected unexpectedly:`,
        message
      );
      this.setState({
        streamReady: false,
        error: `Stream disconnected: ${message.info || 'Connection lost'}`,
      } as Partial<S> as Pick<S, keyof S>);
    } else if (
      message.action === eAction.terminate &&
      message.status === eStatus.success
    ) {
      console.info(
        `${this.constructor.name}: Stream disconnected successfully:`,
        message
      );
      this.setState({
        streamReady: false,
        error: null,
      } as Partial<S> as Pick<S, keyof S>);
    } else if (
      message.action === eAction.terminate &&
      message.status === eStatus.warning
    ) {
      console.warn(
        `${this.constructor.name}: Stream disconnected with warning:`,
        message
      );
      this.setState({
        streamReady: false,
        error: null,
      } as Partial<S> as Pick<S, keyof S>);
    }

    // Call parent callback if provided
    if (this.props.onStop) {
      this.props.onStop(message);
    }
  };

  /**
   * Handle stream update events
   * Forwards updates to parent component
   */
  protected handleUpdate = (message: StreamEvent): void => {
    console.log(`${this.constructor.name}: onUpdate:`, message);

    // Call parent callback if provided
    if (this.props.onUpdate) {
      this.props.onUpdate(message);
    }
  };

  /**
   * Handle custom events from Omniverse
   * Forwards custom events to parent component
   */
  protected handleCustomEvent = (message: StreamEvent): void => {
    console.log(`${this.constructor.name}: onCustomEvent:`, message);

    // Call parent callback if provided
    if (this.props.onCustomEvent) {
      this.props.onCustomEvent(message);
    }
  };

  /**
   * Handle stream statistics events
   * Forwards statistics to parent component
   */
  protected handleStreamStats = (message: StreamEvent): void => {
    console.log(`${this.constructor.name}: onStreamStats:`, message);

    // Call parent callback if provided
    if (this.props.onStreamStats) {
      this.props.onStreamStats(message);
    }
  };

  /**
   * Send message to Omniverse application
   * Common implementation with error handling
   */
  public sendMessage = (message: unknown): void => {
    const state = this.state as BaseStreamState;

    if (this.appStreamer && state.streamReady) {
      try {
        const streamerWithMessage = this.appStreamer as AppStreamer & {
          sendMessage?: (msg: string) => void;
        };

        if (
          streamerWithMessage &&
          typeof streamerWithMessage.sendMessage === 'function'
        ) {
          const messageStr =
            typeof message === 'string' ? message : JSON.stringify(message);
          streamerWithMessage.sendMessage(messageStr);
          console.log(
            `${this.constructor.name}: Message sent to Omniverse:`,
            message
          );
        } else {
          console.warn(
            `${this.constructor.name}: sendMessage method not available on AppStreamer`
          );
        }
      } catch (error) {
        console.error(
          `${this.constructor.name}: Error sending message:`,
          error
        );
      }
    } else {
      console.warn(
        `${this.constructor.name}: Cannot send message - stream not ready`
      );
    }
  };

  /**
   * Wait for required DOM elements to be available
   * Common DOM element checking logic
   */
  protected waitForDOMElements = async (): Promise<void> => {
    return new Promise((resolve, reject) => {
      let attempts = 0;
      const maxAttempts = 50; // 5 seconds total

      const checkElements = () => {
        const videoElement = document.getElementById(
          'remote-video'
        ) as HTMLVideoElement;
        const audioElement = document.getElementById(
          'remote-audio'
        ) as HTMLAudioElement;
        const messageElement = document.getElementById('message-display');

        if (videoElement && audioElement && messageElement) {
          // Configure media elements
          videoElement.muted = false;
          videoElement.volume = 1.0;
          audioElement.volume = 1.0;

          console.log(`${this.constructor.name}: DOM elements ready`);
          resolve();
        } else if (attempts >= maxAttempts) {
          const error = new Error('Timeout waiting for DOM elements');
          console.error(`${this.constructor.name}:`, error);
          reject(error);
        } else {
          attempts++;
          setTimeout(checkElements, 100);
        }
      };

      checkElements();
    });
  };

  /**
   * Abstract method for cleanup - must be implemented by subclasses
   */
  protected abstract cleanup(): void | Promise<void>;
}

export default BaseStreamComponent;
