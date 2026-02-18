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

import React from 'react';
import { OKASStream } from '@/components/streaming/OKASStream/OKASStream.tsx';

describe('OKASStream', () => {
  afterEach(() => {
    jest.restoreAllMocks();
    document.body.innerHTML = '';
  });

  it('waitForDOMElements resolves when elements exist', async () => {
    const video = document.createElement('video');
    video.id = 'remote-video';
    const audio = document.createElement('audio');
    audio.id = 'remote-audio';
    const msg = document.createElement('div');
    msg.id = 'message-display';
    document.body.appendChild(video);
    document.body.appendChild(audio);
    document.body.appendChild(msg);

    const inst = new OKASStream({
      appServer: 'a',
      streamServer: 's',
      appId: 'id',
      appVersion: 'v',
      profile: 'p',
      app: 'app',
    } as any);

    await expect((inst as any).waitForDOMElements()).resolves.toBeUndefined();
  });

  it('waitForDOMElements rejects when elements missing', async () => {
    jest.useFakeTimers();
    const inst = new OKASStream({
      appServer: 'a',
      streamServer: 's',
      appId: 'id',
      appVersion: 'v',
      profile: 'p',
      app: 'app',
    } as any);

    const p = (inst as any).waitForDOMElements();
    // advance timers to cause timeout
    jest.advanceTimersByTime(6000);

    await expect(p).rejects.toThrow(/Required DOM elements not found/);
  });

  it('sendMessage warns when stream not ready', () => {
    const inst = new OKASStream({
      appServer: 'a',
      streamServer: 's',
      appId: 'id',
      appVersion: 'v',
      profile: 'p',
      app: 'app',
    } as any);

    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});

    inst.sendMessage('hello');

    expect(warn).toHaveBeenCalled();
  });

  it('getStatusMessage returns expected strings', () => {
    const inst = new OKASStream({
      appServer: 'a',
      streamServer: 's',
      appId: 'id',
      appVersion: 'v',
      profile: 'p',
      app: 'app',
    } as any);

    (inst as any).sessionStatus = 'creating';
    expect((inst as any).getStatusMessage()).toContain('Creating');

    (inst as any).sessionStatus = 'polling';
    inst.sessionId = 'abc';
    expect((inst as any).getStatusMessage()).toContain('Polling');

    (inst as any).sessionStatus = 'ready';
    expect((inst as any).getStatusMessage()).toContain('Connecting');

    (inst as any).sessionStatus = 'error';
    expect((inst as any).getStatusMessage()).toContain('Session error');
  });

  it('handleEndStream cleans up and resets state', async () => {
    const inst = new OKASStream({
      appServer: 'a',
      streamServer: 's',
      appId: 'id',
      appVersion: 'v',
      profile: 'p',
      app: 'app',
    } as any);

    // install fake appStreamer with disconnect
    inst['appStreamer'] = { disconnect: jest.fn() } as any;
    inst.destroySession = jest.fn().mockResolvedValue(undefined);

    await (inst as any).handleEndStream();

    expect(inst.state.streamReady).toBe(false);
    expect(inst.state.isConnecting).toBe(false);
    expect(inst.state.error).toBeNull();
  });
});
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock the Nvidia library
jest.mock('@nvidia/omniverse-webrtc-streaming-library', () => ({
  AppStreamer: jest.fn().mockImplementation(() => ({
    // Mock AppStreamer methods
  })),
  StreamEvent: {},
}));

// Mock the useOKASSession hook
jest.mock('@/store/hooks/useOKASSession.ts', () => ({
  useOKASSession: jest.fn(() => ({
    sessionId: null,
    sessionStatus: 'idle',
    connectionParams: null,
    error: null,
    createSession: jest.fn(),
    connectToExistingSession: jest.fn(),
    destroySession: jest.fn(),
  })),
}));

// Mock StreamVideoDisplay and StreamStatusOverlay
jest.mock('@/components/streaming/StreamVideoDisplay/StreamVideoDisplay.tsx', () => {
  return function MockStreamVideoDisplay() {
    return <div data-testid="stream-video-display">Video Display</div>;
  };
});

jest.mock('@/components/streaming/StreamStatusOverlay/StreamStatusOverlay.tsx', () => {
  return function MockStreamStatusOverlay({
    isConnecting,
    error
  }: {
    isConnecting?: boolean;
    error?: string | null;
  }) {
    return (
      <div data-testid="stream-status-overlay">
        {isConnecting && <div data-testid="connecting">Connecting...</div>}
        {error && <div data-testid="error">{error}</div>}
      </div>
    );
  };
});

jest.mock('@/components/streaming/utils/streamEventHandlers.ts', () => ({
  createStreamEventHandlers: jest.fn(() => ({
    handleStart: jest.fn(),
    handleStop: jest.fn(),
    handleUpdate: jest.fn(),
    handleCustomEvent: jest.fn(),
  })),
}));

describe('OKASStream Component', () => {
  const defaultProps = {
    appServer: 'http://app.example.com',
    streamServer: 'http://stream.example.com',
    appId: 'test-app',
    appVersion: '1.0.0',
    profile: 'test-profile',
    app: 'TestApp',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders the OKASStream component', () => {
      render(<OKASStream {...defaultProps} />);

      expect(screen.getByTestId('stream-video-display')).toBeInTheDocument();
      expect(screen.getByTestId('stream-status-overlay')).toBeInTheDocument();
    });

    it('applies custom style props', () => {
      const customStyle = { backgroundColor: 'red', width: '800px' };
      const { container } = render(<OKASStream {...defaultProps} style={customStyle} />);

      const streamContainer = container.querySelector('.okas-stream-container');
      expect(streamContainer).toHaveStyle('background-color: red');
      expect(streamContainer).toHaveStyle('width: 800px');
    });

    it('shows connecting status when isConnecting is true', () => {
      const component = new OKASStream(defaultProps);
      component.setState({ isConnecting: true });

      const { container } = render(component.render() as React.ReactElement);
      expect(container.querySelector('[data-testid="stream-status-overlay"]')).toBeInTheDocument();
    });

    it('shows error status when error is present', () => {
      const component = new OKASStream(defaultProps);
      component.setState({ error: 'Connection failed' });

      const { container } = render(component.render() as React.ReactElement);
      expect(container.querySelector('[data-testid="stream-status-overlay"]')).toBeInTheDocument();
    });
  });

  describe('Lifecycle Methods', () => {
    it('calls onEndStreamReady prop on mount if provided', () => {
      const onEndStreamReady = jest.fn();
      const component = new OKASStream({ ...defaultProps, onEndStreamReady });

      component.componentDidMount();

      expect(onEndStreamReady).toHaveBeenCalledWith(expect.any(Function));
    });

    it('handles component mounting', () => {
      const component = new OKASStream(defaultProps);
      expect(component).toBeDefined();
    });

    it('handles component unmounting', () => {
      const component = new OKASStream(defaultProps);
      expect(() => component.componentWillUnmount()).not.toThrow();
    });
  });

  describe('Static Methods', () => {
    it('sendMessage method exists', () => {
      expect(typeof OKASStream.sendMessage).toBe('function');
    });

    it('sendMessage handles message sending', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      OKASStream.sendMessage('{"test": "message"}');

      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('Error Handling', () => {
    it('renders error state correctly', () => {
      const component = new OKASStream(defaultProps);
      component.state = { streamReady: false, isConnecting: false, error: 'Test error' };

      const { container } = render(component.render() as React.ReactElement);
      expect(container.querySelector('[data-testid="stream-status-overlay"]')).toBeInTheDocument();
    });

    it('handles state management', () => {
      const component = new OKASStream(defaultProps);
      expect(component.state.error).toBeNull();
      expect(component.state.isConnecting).toBe(false);
      expect(component.state.streamReady).toBe(false);
    });
  });

  describe('State Management', () => {
    it('initializes with correct default state', () => {
      const component = new OKASStream(defaultProps);

      expect(component.state).toEqual({
        streamReady: false,
        isConnecting: false,
        error: null,
      });
    });

    it('initializes session management properties', () => {
      const component = new OKASStream(defaultProps);

      expect(component.sessionId).toBeNull();
      expect(component.sessionStatus).toBe('idle');
      expect(component.connectionParams).toBeNull();
    });
  });
});