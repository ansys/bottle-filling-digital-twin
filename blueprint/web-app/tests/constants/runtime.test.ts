import getConstants from '../../src/constants/runtime';

describe('constants runtime wrapper', () => {
  test('returns expected constant shapes and allows overrides', () => {
    const overrides = {
      API_ENDPOINTS: {
        ...getConstants().API_ENDPOINTS,
        base: 'https://api.test',
      },
    } as any;

    const c = getConstants(overrides);

    expect(c.APP_CONFIG).toHaveProperty('name');
    expect(c.BOTTLE_DESIGNS).toHaveProperty('DESIGN_A_DINO');
    expect(c.ROUTES).toHaveProperty('HOME', '/');
    expect(c.API_ENDPOINTS.base).toBe('https://api.test');
  });
});
