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

import { uiReducer, uiActions } from '@/store/slices/uiSlice.ts';

describe('uiReducer core behaviors', () => {
  it('toggles fullscreen', () => {
    const s1 = uiReducer(undefined as any, uiActions.toggleFullscreen());
    expect(s1.isFullscreen).toBe(true);
    const s2 = uiReducer(s1, uiActions.toggleFullscreen());
    expect(s2.isFullscreen).toBe(false);
  });

  it('clamps timestep within range', () => {
    const s = uiReducer(undefined as any, uiActions.setTimestep(999999));
    expect(s.timestep).toBeLessThanOrEqual(s.maxTimestep);
  });

  it('adds and removes notifications', () => {
    const s1 = uiReducer(undefined as any, uiActions.addNotification({ type: 'info', title: 't', message: 'm' }));
    expect(s1.notifications.length).toBe(1);
    const id = s1.notifications[0].id;
    const s2 = uiReducer(s1, uiActions.removeNotification(id));
    expect(s2.notifications.length).toBe(0);
  });

  it('sets window size and updates screenSize', () => {
    const s = uiReducer(undefined as any, uiActions.setWindowSize(500, 400));
    expect(s.windowWidth).toBe(500);
    expect(s.screenSize).toBe('mobile');
  });
});
