export const APP_CONFIG = {
  name: 'Bottle Filling Digital Twin',
  version: '0.0.1',
  company: 'Ansys',
} as const;

export const API_ENDPOINTS = {
  base: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api',
  simulation: '/simulation',
  fluent: '/fluent',
  omniverse: '/omniverse',
  designs: '/designs',
  results: '/results',
} as const;

export const BOTTLE_DESIGNS = {
  DESIGN_A_DINO: 'DesignA_Dino',
  DESIGN_B_MINERAL_WATER: 'DesignB_MineralWater',
  DESIGN_C_DIAMOND: 'DesignC_Diamond',
  DESIGN_D_ASIA: 'DesignD_Asia',
  DESIGN_E_TINY: 'DesignE_Tiny',
} as const;

export const SIMULATION_STATUS = {
  IDLE: 'idle',
  RUNNING: 'running',
  COMPLETED: 'completed',
  ERROR: 'error',
} as const;

export const ROUTES = {
  HOME: '/',
  WORKFLOW: '/workflow',
  SIMULATION: '/simulation',
  STREAMING: '/streaming',
  REVIEWER: '/reviewer',
  DESIGN: '/design',
  RESULTS: '/results',
  SETTINGS: '/settings',
  EXAMPLE: '/example',
} as const;
