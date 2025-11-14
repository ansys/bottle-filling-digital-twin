// Simple smoke test to import index exports which improves coverage for index.ts files
import '../../src/components';
import '../../src/components/common';

test('index exports are resolvable', () => {
  expect(true).toBe(true);
});
