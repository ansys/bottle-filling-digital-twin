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

// We'll import StreamMessenger then inject mock functions directly into the
// LocalStream and OKASStream modules that StreamMessenger uses. This avoids
// issues with module hoisting and ensures the module under test calls our mocks.
const StreamMessenger = require('@/components/streaming/StreamMessenger.ts').default;

const mockLocalSend = jest.fn();
const mockOKASSend = jest.fn();

// Inject mocks into the actual modules used by StreamMessenger
const LocalStreamModule = require('@/components/streaming/LocalStream/LocalStream.tsx');
if (LocalStreamModule && LocalStreamModule.default) {
  LocalStreamModule.default.sendMessage = mockLocalSend;
}

const OKASModule = require('@/components/streaming/OKASStream/OKASStream.tsx');
if (OKASModule && OKASModule.OKASStream) {
  OKASModule.OKASStream.sendMessage = mockOKASSend;
}

describe('StreamMessenger static sendMessage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLocalSend.mockClear();
    mockOKASSend.mockClear();
    // Reset active source
    StreamMessenger.setActiveSource(null);
  });

  it('warns when no active source is set', () => {
    const spyWarn = jest.spyOn(console, 'warn').mockImplementation(() => {});

    StreamMessenger.sendMessage({ test: 'message' });

    expect(spyWarn).toHaveBeenCalledWith(
      'StreamMessenger: No active stream source set. Call setActiveSource() first.'
    );

    spyWarn.mockRestore();
  });

  it('routes messages to LocalStream when active source is local', () => {
    StreamMessenger.setActiveSource('local');
    const message = { test: 'data' };

    StreamMessenger.sendMessage(message);

    expect(mockLocalSend).toHaveBeenCalledWith(JSON.stringify(message));
  });

  it('routes messages to OKASStream when active source is stream', () => {
    StreamMessenger.setActiveSource('stream');
    const message = 'test message';

    StreamMessenger.sendMessage(message);

    expect(mockOKASSend).toHaveBeenCalledWith(message);
  });

  it('warns when GFN source is not implemented', () => {
    const spyWarn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    StreamMessenger.setActiveSource('gfn');

    StreamMessenger.sendMessage('test');

    expect(spyWarn).toHaveBeenCalledWith('StreamMessenger: GFN streaming not yet implemented');

    spyWarn.mockRestore();
  });

  it('handles LocalStream sendMessage failures gracefully', () => {
    const spyError = jest.spyOn(console, 'error').mockImplementation(() => {});
    mockLocalSend.mockImplementation(() => {
      throw new Error('LocalStream failed');
    });

    StreamMessenger.setActiveSource('local');
    StreamMessenger.sendMessage('test');

    expect(spyError).toHaveBeenCalledWith(
      'StreamMessenger: LocalStream sendMessage failed:',
      expect.any(Error)
    );

    spyError.mockRestore();
  });

  it('handles OKASStream sendMessage failures gracefully', () => {
    const spyError = jest.spyOn(console, 'error').mockImplementation(() => {});
    mockOKASSend.mockImplementation(() => {
      throw new Error('OKASStream failed');
    });

    StreamMessenger.setActiveSource('stream');
    StreamMessenger.sendMessage('test');

    expect(spyError).toHaveBeenCalledWith(
      'StreamMessenger: OKASStream sendMessage failed:',
      expect.any(Error)
    );

    spyError.mockRestore();
  });

  it('can get and set active source', () => {
    expect(StreamMessenger.getActiveSource()).toBe(null);

    StreamMessenger.setActiveSource('local');
    expect(StreamMessenger.getActiveSource()).toBe('local');

    StreamMessenger.setActiveSource('stream');
    expect(StreamMessenger.getActiveSource()).toBe('stream');
  });
});
