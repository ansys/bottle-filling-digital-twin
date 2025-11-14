import LocalStream from '../../../src/components/streaming/LocalStream/LocalStream';

describe('LocalStream extra coverage', () => {
  it('warns when static sendMessage called without instance', () => {
    const origWarn = console.warn;
    const warnMock = jest.fn();
    console.warn = warnMock;

    LocalStream.sendMessage(JSON.stringify({ a: 1 }));
    expect(warnMock).toHaveBeenCalled();

    console.warn = origWarn;
  });

  it('handleRetry triggers initializeStream', () => {
    // @ts-ignore
    const inst = new LocalStream({ server: 's', signalingPort: 1234, app: 'app' });

    // override initializeStream with mock
    const initMock = jest.fn();
    // @ts-ignore
    inst.initializeStream = initMock;

    // Make setState synchronous so callbacks run immediately
    // @ts-ignore
    inst.setState = (state: any, cb?: () => void) => {
      // merge into existing state
      // @ts-ignore
      inst.state = { ...(inst.state || {}), ...(typeof state === 'function' ? state(inst.state) : state) };
      if (cb) cb();
    };

    // @ts-ignore
    inst.setState({ error: 'err' });

    // call handleRetry
    // @ts-ignore
    (inst as any).handleRetry();

    expect(initMock).toHaveBeenCalled();
  });

  it('initializeStream handles waitForDOMElements rejection', async () => {
    // construct instance
    // @ts-ignore
    const inst = new LocalStream({ server: 's', signalingPort: 1234, app: 'app' });

    // stub waitForDOMElements to throw
    // @ts-ignore
    inst.waitForDOMElements = jest.fn().mockRejectedValue(new Error('no dom'));

    // Make setState synchronous so we can inspect state after call
    // @ts-ignore
    inst.setState = (state: any, cb?: () => void) => {
      // @ts-ignore
      inst.state = { ...(inst.state || {}), ...(typeof state === 'function' ? state(inst.state) : state) };
      if (cb) cb();
    };

    // call initializeStream and ensure it sets error in state
    // @ts-ignore
    await (inst as any).initializeStream();

    // @ts-ignore
    expect(typeof inst.state.error).toBe('string');
    // @ts-ignore
    expect(inst.state.error).toMatch(/Connection error/);
  });
});
