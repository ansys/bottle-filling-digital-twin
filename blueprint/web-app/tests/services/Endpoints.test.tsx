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

import { getApplications, getStreamingSessions, createStreamingSession, getStreamingSessionInfo, destroyStreamingSession } from '@/services/Endpoints.tsx';
import { Http } from '@/services/http.ts';

jest.mock('@/services/http.ts', () => ({
  Http: {
    get: jest.fn(),
    post: jest.fn(),
    del: jest.fn(),
  },
}));

describe('Endpoints service', () => {
  beforeEach(() => jest.clearAllMocks());

  it('getApplications returns mapped applications', async () => {
    (Http.get as jest.Mock).mockResolvedValue({ status: 200, data: { items: [{ id: 'a', name: 'A', description: '', tags: [] }], limit: 1, offset: 0, count: 1 } });
    const res = await getApplications('https://app');
    expect(res.status).toBe(200);
    expect(res.data.a.id).toBe('a');
  });

  it('getStreamingSessions forwards response', async () => {
    (Http.get as jest.Mock).mockResolvedValue({ status: 200, data: { items: [] } });
    const res = await getStreamingSessions('https://stream');
    expect(res.status).toBe(200);
  });

  it('createStreamingSession posts payload and returns response', async () => {
    (Http.post as jest.Mock).mockResolvedValue({ status: 201, data: { id: 's1' } });
    const res = await createStreamingSession('https://stream', 'app', '1.0', 'p');
    expect(res.status).toBe(201);
    expect(Http.post).toHaveBeenCalled();
  });

  it('getStreamingSessionInfo returns session info', async () => {
    (Http.get as jest.Mock).mockResolvedValue({ status: 200, data: { id: 's1', routes: {} } });
    const res = await getStreamingSessionInfo('https://stream', 's1');
    expect(res.status).toBe(200);
    expect(res.data.id).toBe('s1');
  });

  it('destroyStreamingSession calls del', async () => {
    (Http.del as jest.Mock).mockResolvedValue({ status: 200 });
    const res = await destroyStreamingSession('https://stream', 's1');
    expect(res.status).toBe(200);
    expect(Http.del).toHaveBeenCalled();
  });
});
