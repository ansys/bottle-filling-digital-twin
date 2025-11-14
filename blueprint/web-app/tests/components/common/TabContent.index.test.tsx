// smoke test to import TabContent index export
// fix relative path: tests/components/common -> ../../../src
import '../../../src/components/common/TabContent';

test('TabContent index import works', () => {
  expect(true).toBe(true);
});
