import { waitForStreamDOMElements } from '../../../src/components/streaming/utils/streamEventHandlers';

describe('waitForStreamDOMElements', () => {
  afterEach(() => {
    // clean up DOM
    document.body.innerHTML = '';
    // restore timers
    try {
      // eslint-disable-next-line jest/no-export
      jest.useRealTimers();
    } catch (e) {
      // ignore
    }
  });

  it('resolves when elements are present', async () => {
    const video = document.createElement('video');
    video.id = 'remote-video';
    const audio = document.createElement('audio');
    audio.id = 'remote-audio';
    const msg = document.createElement('div');
    msg.id = 'message-display';
    document.body.appendChild(video);
    document.body.appendChild(audio);
    document.body.appendChild(msg);

    await expect(waitForStreamDOMElements('TestComp')).resolves.toBeUndefined();
  });

  it('rejects after timeout when elements do not appear', async () => {
    // use fake timers to advance the polling loop
    jest.useFakeTimers();

    const p = waitForStreamDOMElements('TestComp');

    // advance enough time to trigger maxAttempts (50 * 100ms = 5000ms)
    jest.advanceTimersByTime(5000 + 100);

    await expect(p).rejects.toThrow(/Timeout waiting for DOM elements/i);
  });
});
