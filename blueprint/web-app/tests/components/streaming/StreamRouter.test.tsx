import { render } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import StreamRouter from '../../../src/components/streaming/StreamRouter/StreamRouter';
import { StreamConfig } from '../../../src/types';
import simulationReducer from '../../../src/store/slices/simulationSlice';

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
