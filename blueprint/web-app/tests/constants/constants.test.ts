// Ensure we exercise the real constants file (do not use the automatic mock)
jest.unmock('../../src/constants');
const { APP_CONFIG, API_ENDPOINTS, BOTTLE_DESIGNS, ROUTES, SIMULATION_STATUS } = require('../../src/constants');

describe('constants', () => {
  test('APP_CONFIG contains expected fields', () => {
    expect(APP_CONFIG.name).toContain('Bottle');
    expect(APP_CONFIG.version).toBeDefined();
  });

  test('API_ENDPOINTS base has a string and other endpoints exist', () => {
    expect(typeof API_ENDPOINTS.base).toBe('string');
    expect(API_ENDPOINTS.simulation).toBe('/simulation');
  });

  test('BOTTLE_DESIGNS enumerations exist and ROUTES include HOME', () => {
    expect(BOTTLE_DESIGNS.DESIGN_A_DINO).toBeDefined();
    expect(ROUTES.HOME).toBe('/');
    expect(SIMULATION_STATUS.IDLE).toBe('idle');
  });
});
