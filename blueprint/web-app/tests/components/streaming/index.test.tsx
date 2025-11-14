import * as StreamingComponents from '../../../src/components/streaming';

describe('Streaming Components Index', () => {
  test('exports StreamRouter component', () => {
    expect(StreamingComponents.StreamRouter).toBeDefined();
    expect(typeof StreamingComponents.StreamRouter).toBe('function');
  });

  test('exports LocalStreamContainer component', () => {
    expect(StreamingComponents.LocalStreamContainer).toBeDefined();
    // Container components are objects with React component properties
    expect(StreamingComponents.LocalStreamContainer).toBeTruthy();
  });

  test('exports OKASStreamContainer component', () => {
    expect(StreamingComponents.OKASStreamContainer).toBeDefined();
    // Container components are objects with React component properties
    expect(StreamingComponents.OKASStreamContainer).toBeTruthy();
  });

  test('exports GFNNotImplemented component', () => {
    expect(StreamingComponents.GFNNotImplemented).toBeDefined();
    expect(typeof StreamingComponents.GFNNotImplemented).toBe('function');
  });

  test('exports UI components', () => {
    const uiComponents = ['StreamSourceError', 'StreamVideoDisplay', 'StreamStatusOverlay'];

    uiComponents.forEach(exportName => {
      expect(StreamingComponents).toHaveProperty(exportName);
      expect(StreamingComponents[exportName as keyof typeof StreamingComponents]).toBeDefined();
    });
  });

  test('exports all primary components', () => {
    const primaryExports = ['StreamRouter', 'LocalStreamContainer', 'OKASStreamContainer'];

    primaryExports.forEach(exportName => {
      expect(StreamingComponents).toHaveProperty(exportName);
      expect(StreamingComponents[exportName as keyof typeof StreamingComponents]).toBeDefined();
    });
  });
});
