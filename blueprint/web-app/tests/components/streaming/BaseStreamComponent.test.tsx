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

/* eslint-disable @typescript-eslint/no-explicit-any */
import BaseStreamComponent, { BaseStreamProps } from '@/components/streaming/BaseStreamComponent/BaseStreamComponent.tsx';
import { eStatus, eAction } from '@nvidia/omniverse-webrtc-streaming-library';

// Lightweight harness that exposes protected methods for testing
class Harness extends (BaseStreamComponent as any) {
  constructor(props: BaseStreamProps) {
    super(props as any);
    this.state = { streamReady: false, isConnecting: false, error: null };
  }

  // Expose protected handlers for tests
  public exposeHandleStart(msg: any) {
    return (this as any).handleStart(msg);
  }
  public exposeHandleStop(msg: any) {
    return (this as any).handleStop(msg);
  }
  public exposeHandleUpdate(msg: any) {
    return (this as any).handleUpdate(msg);
  }
  public exposeHandleCustom(msg: any) {
    return (this as any).handleCustomEvent(msg);
  }
  public exposeHandleStats(msg: any) {
    return (this as any).handleStreamStats(msg);
  }
  public exposeWaitForDOM() {
    return (this as any).waitForDOMElements();
  }

  protected cleanup(): void | Promise<void> {
    // noop
    return;
  }
}

describe('BaseStreamComponent', () => {
  it('handleStart sets state on success and calls prop', () => {
    const onStart = jest.fn();
    const inst = new Harness({ onStart } as any);
    inst.setState = jest.fn();

    const msg = { status: eStatus.success } as any;
    inst.exposeHandleStart(msg);

    expect((inst.setState as jest.Mock).mock.calls.length).toBeGreaterThan(0);
    expect(onStart).toHaveBeenCalledWith(msg);
  });

  it('handleStart logs warning for warning status and still calls prop', () => {
    const onStart = jest.fn();
    const inst = new Harness({ onStart } as any);
    console.warn = jest.fn();

    const msg = { status: eStatus.warning } as any;
    inst.exposeHandleStart(msg);
    expect(onStart).toHaveBeenCalledWith(msg);
    expect(console.warn).toHaveBeenCalled();
  });

  it('handleStart sets error on error status and calls prop', () => {
    const onStart = jest.fn();
    const inst = new Harness({ onStart } as any);
    inst.setState = jest.fn();

    const msg = { status: eStatus.error, info: 'bad' } as any;
    inst.exposeHandleStart(msg);
    expect((inst.setState as jest.Mock).mock.calls.some(c => c[0] && c[0].error)).toBe(true);
    expect(onStart).toHaveBeenCalledWith(msg);
  });

  it('handleStop handles terminate+error and calls prop', () => {
    const onStop = jest.fn();
    const inst = new Harness({ onStop } as any);
    inst.setState = jest.fn();

    const msg = { action: eAction.terminate, status: eStatus.error, info: 'lost' } as any;
    inst.exposeHandleStop(msg);
    expect((inst.setState as jest.Mock).mock.calls.some(c => c[0] && c[0].error)).toBe(true);
    expect(onStop).toHaveBeenCalledWith(msg);
  });

  it('handleStop handles terminate+success and calls prop', () => {
    const onStop = jest.fn();
    const inst = new Harness({ onStop } as any);
    inst.setState = jest.fn();

    const msg = { action: eAction.terminate, status: eStatus.success } as any;
    inst.exposeHandleStop(msg);
    expect((inst.setState as jest.Mock).mock.calls.some(c => c[0] && c[0].streamReady === false)).toBe(true);
    expect(onStop).toHaveBeenCalledWith(msg);
  });

  it('handleUpdate forwards to onUpdate prop', () => {
    const onUpdate = jest.fn();
    const inst = new Harness({ onUpdate } as any);
    const msg = { some: 'update' } as any;
    inst.exposeHandleUpdate(msg);
    expect(onUpdate).toHaveBeenCalledWith(msg);
  });

  it('handleCustomEvent forwards to onCustomEvent prop if present', () => {
    const onCustomEvent = jest.fn();
    const inst = new Harness({ onCustomEvent } as any);
    const msg = { custom: 'x' } as any;
    inst.exposeHandleCustom(msg);
    expect(onCustomEvent).toHaveBeenCalledWith(msg);
  });

  it('handleStreamStats forwards to onStreamStats prop if present', () => {
    const onStreamStats = jest.fn();
    const inst = new Harness({ onStreamStats } as any);
    const msg = { stats: 1 } as any;
    inst.exposeHandleStats(msg);
    expect(onStreamStats).toHaveBeenCalledWith(msg);
  });

  it('sendMessage warns when not ready and does not throw', () => {
    const inst = new Harness({} as any);
    console.warn = jest.fn();
    inst.appStreamer = undefined;
    inst.state.streamReady = false;
    inst.sendMessage({ hello: 'world' });
    expect(console.warn).toHaveBeenCalled();
  });

  it('sendMessage calls appStreamer.sendMessage when ready', () => {
    const inst = new Harness({} as any);
    inst.appStreamer = { sendMessage: jest.fn() } as any;
    inst.state.streamReady = true;
    inst.sendMessage({ a: 1 });
    expect((inst.appStreamer as any).sendMessage).toHaveBeenCalled();
  });

  it('waitForDOMElements resolves when elements present', async () => {
    const video = document.createElement('video');
    video.id = 'remote-video';
    document.body.appendChild(video);
    const audio = document.createElement('audio');
    audio.id = 'remote-audio';
    document.body.appendChild(audio);
    const msg = document.createElement('div');
    msg.id = 'message-display';
    document.body.appendChild(msg);

    const inst = new Harness({} as any);
    await expect(inst.exposeWaitForDOM()).resolves.toBeUndefined();

    video.remove();
    audio.remove();
    msg.remove();
  });
});
