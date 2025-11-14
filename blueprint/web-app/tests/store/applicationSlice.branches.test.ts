import applicationReducer, {
  ApplicationState,
  Forms,
  StreamStatus,
  setApplications,
  setApplicationVersions,
  setApplicationProfiles,
  setSelectedApplication,
  setSelectedApplicationVersion,
  setError,
  clearError,
  resetApplicationState,
  resetToInitialForm,
  selectSelectedApplication,
  selectIsLoading,
} from '../../src/store/slices/applicationSlice';

describe('applicationSlice - branches and selectors', () => {
  const baseState: ApplicationState = {
    currentForm: Forms.APP_ONLY,
    useSimulationUI: false,
    applications: [],
    applicationVersions: [],
    applicationProfiles: [],
    selectedApplicationId: '',
    selectedApplicationVersion: '',
    selectedApplicationProfile: '',
    streamStatus: StreamStatus.IDLE,
    connectionText: '',
    sessionId: '',
    isLoadingApplications: false,
    isLoadingVersions: false,
    isLoadingProfiles: false,
    isCreatingSession: false,
    error: null,
    lastError: null,
  };

  const createState = (overrides: Partial<ApplicationState> = {}): ApplicationState => ({
    ...baseState,
    ...overrides,
  });

  it('setApplications clears loading and error', () => {
  const prev = createState({ isLoadingApplications: true, error: 'oops' });
  const apps = [{ id: 'a1', name: 'App 1' }];
  const next = applicationReducer(prev, setApplications(apps));
    expect(next.applications).toEqual(apps);
    expect(next.isLoadingApplications).toBe(false);
    expect(next.error).toBeNull();
  });

  it('setApplicationVersions and setApplicationProfiles clear loading/error', () => {
  let state = createState({ isLoadingVersions: true, error: 'x' });
  state = applicationReducer(state, setApplicationVersions(['1.0']));
    expect(state.applicationVersions).toEqual(['1.0']);
    expect(state.isLoadingVersions).toBe(false);
    expect(state.error).toBeNull();

  state = createState({ isLoadingProfiles: true, error: 'y' });
  state = applicationReducer(state, setApplicationProfiles(['p1']));
    expect(state.applicationProfiles).toEqual(['p1']);
    expect(state.isLoadingProfiles).toBe(false);
    expect(state.error).toBeNull();
  });

  it('setSelectedApplication resets dependent fields', () => {
    const prev = createState({
      selectedApplicationId: 'old',
      selectedApplicationVersion: 'v1',
      selectedApplicationProfile: 'p1',
      applicationVersions: ['v1'],
      applicationProfiles: ['p1'],
    });
    const next = applicationReducer(prev, setSelectedApplication('new'));
    expect(next.selectedApplicationId).toBe('new');
    expect(next.selectedApplicationVersion).toBe('');
    expect(next.selectedApplicationProfile).toBe('');
    expect(next.applicationVersions).toEqual([]);
    expect(next.applicationProfiles).toEqual([]);
  });

  it('setSelectedApplicationVersion resets dependent profile', () => {
  const prev = createState({ selectedApplicationVersion: 'v1', applicationProfiles: ['p1'], selectedApplicationProfile: 'p1' });
  const next = applicationReducer(prev, setSelectedApplicationVersion('v2'));
    expect(next.selectedApplicationVersion).toBe('v2');
    expect(next.selectedApplicationProfile).toBe('');
    expect(next.applicationProfiles).toEqual([]);
  });

  it('error sets lastError and clears loading flags', () => {
  const prev = createState({ isLoadingApplications: true, isLoadingVersions: true, isCreatingSession: true });
  const next = applicationReducer(prev, setError('fatal'));
    expect(next.error).toBe('fatal');
    expect(next.lastError).not.toBeNull();
    expect(next.isLoadingApplications).toBe(false);
    expect(next.isLoadingVersions).toBe(false);
    expect(next.isCreatingSession).toBe(false);
  });

  it('clearError clears error', () => {
  const prev = createState({ error: 'bad' });
  const next = applicationReducer(prev, clearError());
    expect(next.error).toBeNull();
  });

  it('resetApplicationState preserves useSimulationUI', () => {
  const prev = createState({ useSimulationUI: true, applications: [{ id: 'a', name: 'A' }] });
  const next = applicationReducer(prev, resetApplicationState());
    expect(next.useSimulationUI).toBe(true);
    expect(next.applications).toEqual([]);
  });

  it('resetToInitialForm clears many fields', () => {
  const prev = createState({ currentForm: Forms.PROFILES, streamStatus: StreamStatus.CONNECTED, connectionText: 'x', sessionId: 's', selectedApplicationId: 'a' });
  const next = applicationReducer(prev, resetToInitialForm());
    expect(next.currentForm).toBe(Forms.APP_ONLY);
    expect(next.streamStatus).toBe(StreamStatus.IDLE);
    expect(next.connectionText).toBe('');
    expect(next.sessionId).toBe('');
    expect(next.selectedApplicationId).toBe('');
  });

  it('selectSelectedApplication finds an application by id', () => {
    const state = { application: createState({ applications: [{ id: 'a1', name: 'App1' }], selectedApplicationId: 'a1' }) };
    const found = selectSelectedApplication(state);
    expect(found).toBeDefined();
    expect(found!.id).toBe('a1');
  });

  it('selectIsLoading aggregates loading flags', () => {
    const s1 = { application: createState({ isLoadingApplications: true }) };
    expect(selectIsLoading(s1)).toBe(true);
    const s2 = { application: createState({ isCreatingSession: true }) };
    expect(selectIsLoading(s2)).toBe(true);
    const s3 = { application: createState() };
    expect(selectIsLoading(s3)).toBe(false);
  });
});
