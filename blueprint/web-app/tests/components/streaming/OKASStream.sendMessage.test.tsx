// Test OKASStream static methods

describe('OKASStream static sendMessage', () => {
  it('warns when no active instance is present', () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

  // dynamic import to access class for static method call
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const OKAS = require('../../../src/components/streaming/OKASStream/OKASStream');
  const OKASStreamClass = OKAS.OKASStream;
  OKASStreamClass.sendMessage('{"test":true}');

    expect(warnSpy).toHaveBeenCalledWith(
      'OKASStream: No active instance or stream not ready'
    );

    warnSpy.mockRestore();
  });
});
