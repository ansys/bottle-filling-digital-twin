/* eslint-disable @typescript-eslint/no-explicit-any */
import { Http } from '../../src/services/http';

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
