import serverReducer, { serverActions } from '@/store/slices/serverSlice';

describe('server slice coverage', () => {
  const initial = (serverReducer(undefined, { type: 'INIT' } as any) as unknown) as any;

  test('set stream and app servers and recent list behavior', () => {
    const s1 = serverReducer(initial, serverActions.setStreamServer('s1'));
    expect(s1.streamServer).toBe('s1');
    expect(s1.recentServers.streamServers[0]).toBe('s1');

    const s2 = serverReducer(s1, serverActions.setAppServer('a1'));
    expect(s2.appServer).toBe('a1');
    expect(s2.recentServers.appServers[0]).toBe('a1');

    // setServers with both values updates recent lists
    const s3 = serverReducer(s2, serverActions.setServers('s2', 'a2'));
    expect(s3.streamServer).toBe('s2');
    expect(s3.appServer).toBe('a2');
    expect(s3.recentServers.streamServers[0]).toBe('s2');
  });

  test('update health and clear recent servers', () => {
    const s1 = serverReducer(initial, serverActions.updateStreamServerHealth({ version: '1.2' }));
    expect(s1.streamServerHealth.version).toBe('1.2');
    expect(s1.streamServerHealth.lastChecked).not.toBeNull();

    const s2 = serverReducer(s1, serverActions.addRecentStreamServer('sX'));
    expect(s2.recentServers.streamServers[0]).toBe('sX');

  const s3 = serverReducer(s2, { type: 'server/clearRecentServers' });
    expect(s3.recentServers.streamServers.length).toBe(0);
    expect(s3.recentServers.appServers.length).toBe(0);
  });

  test('error handling and reset', () => {
    const s1 = serverReducer(initial, serverActions.setServerError('stream', 'boom'));
    expect(s1.lastError).toBeDefined();
    expect(s1.lastError?.server).toBe('stream');

    const s2 = serverReducer(s1, serverActions.clearServerError());
    expect(s2.lastError).toBeNull();

    const s3 = serverReducer(s2, serverActions.resetServerState());
    expect(s3).toEqual(serverReducer(undefined, { type: 'INIT' } as any));
  });
});
