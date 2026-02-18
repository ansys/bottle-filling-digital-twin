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

// Ensure we exercise the real constants file (do not use the automatic mock)
jest.unmock('@/constants');
const { APP_CONFIG, API_ENDPOINTS, BOTTLE_DESIGNS, ROUTES, SIMULATION_STATUS } = require('@/constants');

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
