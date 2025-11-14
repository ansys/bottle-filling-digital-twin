import getConstants, {
  APP_CONFIG,
  API_ENDPOINTS,
  BOTTLE_DESIGNS,
  SIMULATION_STATUS,
  ROUTES,
} from '../../src/constants/runtime';

describe('runtime-safe constants', () => {
  test('exports basic app config', () => {
    const c = getConstants();
    expect(c.APP_CONFIG).toBeDefined();
    expect(c.APP_CONFIG.name).toContain('Bottle');
    expect(APP_CONFIG.version).toMatch(/^[0-9]+\.[0-9]+\.[0-9]+$/);
  });

  test('api endpoints shape', () => {
    expect(API_ENDPOINTS.base).toContain('http');
    expect(Object.keys(API_ENDPOINTS)).toEqual(
      expect.arrayContaining(['base', 'simulation', 'fluent'])
    );
  });

  test('bottle designs and routes', () => {
    expect(BOTTLE_DESIGNS.DESIGN_A_DINO).toMatch(/Design/);
    expect(ROUTES.HOME).toBe('/');
    expect(SIMULATION_STATUS.RUNNING).toBe('running');
  });
});
