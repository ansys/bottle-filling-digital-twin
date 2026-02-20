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

/* eslint-disable @typescript-eslint/no-explicit-any */
import { Http } from '@/services/http.ts';

describe('Http helper', () => {
  let spy: jest.SpyInstance;

  beforeEach(() => {
    spy = jest.spyOn(global as any, 'fetch');
  });
  afterEach(() => {
    spy.mockRestore();
  });

  test('get returns status and data', async () => {
    const res = { ok: true, status: 200, json: async () => ({ a: 1 }) } as any;
    spy.mockResolvedValue(res);
    const out = await Http.get('/x');
    expect(out.status).toBe(200);
    expect(out.data).toEqual({ a: 1 });
  });

  test('post returns status and data', async () => {
    const res = { ok: true, status: 201, json: async () => ({ id: '1' }) } as any;
    spy.mockResolvedValue(res);
    const out = await Http.post('/x', { b: 2 });
    expect(out.status).toBe(201);
    expect(out.data).toEqual({ id: '1' });
  });

  test('del returns status when not ok', async () => {
    const res = { ok: false, status: 404, text: async () => '' } as any;
    spy.mockResolvedValue(res);
    const out = await Http.del('/x', {});
    expect(out).toEqual({ status: 404 });
  });

  test('del returns detail when ok and has text', async () => {
    const res = { ok: true, status: 200, text: async () => 'done' } as any;
    spy.mockResolvedValue(res);
    const out = await Http.del('/x', {});
    expect(out).toEqual({ detail: 'done', status: 200 });
  });
});
/* eslint-enable @typescript-eslint/no-explicit-any */
