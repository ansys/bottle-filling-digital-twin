/**
 * Application Route Constants
 *
 * Central definition of all application routes.
 */

export const ROUTES = {
  WORKFLOW: '/workflow',
  SIMULATION: '/simulation',
  REVIEWER: '/reviewer',
  // Future routes
  DESIGN: '/design',
  RESULTS: '/results',
  SETTINGS: '/settings',
} as const;

export type RouteKey = keyof typeof ROUTES;
export type RouteValue = (typeof ROUTES)[RouteKey];
