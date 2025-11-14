import { getApplications, getStreamingSessions, createStreamingSession, getStreamingSessionInfo, destroyStreamingSession } from '../../src/services/Endpoints';
import { Http } from '../../src/services/http';

jest.mock('../../src/services/http', () => ({
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
