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

import {
  selectIsFullscreen,
  selectTimestepRange,
  selectTheme,
  selectShowDebugInfo,
  selectShowStreamStats,
  selectNotifications,
  selectScreenSize,
  selectWindowSize,
} from '@/store/slices/uiSlice.ts';

describe('ui selectors', () => {
  const baseState = {
    ui: {
      isFullscreen: true,
      timestep: 42,
      minTimestep: 0,
      maxTimestep: 100,
      theme: 'dark',
      showDebugInfo: true,
      showStreamStats: false,
      notifications: [{ id: 'n1', type: 'info', title: 't', message: 'm', timestamp: 1 }],
      screenSize: 'tablet',
      windowWidth: 800,
      windowHeight: 600,
    },
  } as any;

  it('selectIsFullscreen and theme', () => {
    expect(selectIsFullscreen(baseState)).toBe(true);
    expect(selectTheme(baseState)).toBe('dark');
  });

  it('select timestep range and theme/flags', () => {
    const range = selectTimestepRange(baseState);
    expect(range.current).toBe(42);
    expect(selectTheme(baseState)).toBe('dark');
    expect(selectShowDebugInfo(baseState)).toBe(true);
    expect(selectShowStreamStats(baseState)).toBe(false);
  });

  it('notifications and screen/window selectors', () => {
    expect(selectNotifications(baseState).length).toBe(1);
    expect(selectScreenSize(baseState)).toBe('tablet');
    const size = selectWindowSize(baseState);
    expect(size.width).toBe(800);
    expect(size.height).toBe(600);
  });
});
