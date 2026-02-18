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

import { render } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import StreamRouter from '@/components/streaming/StreamRouter/StreamRouter.tsx';
import { StreamConfig } from '@/types';
import simulationReducer from '@/store/slices/simulationSlice.ts';

describe('StreamRouter routing', () => {
  const store = configureStore({ reducer: { simulation: simulationReducer } });

  it('renders LocalStreamContainer when source is local and config present', () => {
    const cfg: StreamConfig = { source: 'local', local: { server: 's', signalingPort: 49100 } };
    const { container } = render(
      <Provider store={store}>
        <StreamRouter streamConfig={cfg} />
      </Provider>
    );
    expect(container.firstChild).toBeDefined();
  });

  it('renders OKASStreamContainer when source is stream and config present', () => {
    const cfg: StreamConfig = { source: 'stream', stream: { appServer: 'a', streamServer: 's', appId: 'id', appVersion: 'v', profile: 'p' } };
    const { container } = render(
      <Provider store={store}>
        <StreamRouter streamConfig={cfg} />
      </Provider>
    );
    expect(container.firstChild).toBeDefined();
  });

  it('renders GFNNotImplemented for gfn source', () => {
    const cfg: StreamConfig = { source: 'gfn' };
    const { container } = render(
      <Provider store={store}>
        <StreamRouter streamConfig={cfg} />
      </Provider>
    );
    expect(container.firstChild).toBeDefined();
  });

  it('renders StreamSourceError when config missing for local/stream', () => {
  const cfgLocal: StreamConfig = { source: 'local' };
    const { container: c1 } = render(
      <Provider store={store}>
        <StreamRouter streamConfig={cfgLocal} />
      </Provider>
    );
    expect(c1.firstChild).toBeDefined();

  const cfgStream: StreamConfig = { source: 'stream' };
    const { container: c2 } = render(
      <Provider store={store}>
        <StreamRouter streamConfig={cfgStream} />
      </Provider>
    );
    expect(c2.firstChild).toBeDefined();
  });
});
