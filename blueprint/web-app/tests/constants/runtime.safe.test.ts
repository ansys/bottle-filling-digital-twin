// Copyright (C) 2025 - 2026 ANSYS, Inc. and/or its affiliates.
// SPDX-License-Identifier: MIT
//
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.

import getConstants, {
  APP_CONFIG,
  API_ENDPOINTS,
  BOTTLE_DESIGNS,
  SIMULATION_STATUS,
  ROUTES,
} from '@/constants/runtime.ts';

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
