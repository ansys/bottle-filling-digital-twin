import { mapDispatchToProps } from '../../../src/components/simulation/SolverSetup/SolverSetupContainer';

describe('SolverSetupContainer dispatch branches', () => {
  afterEach(() => jest.restoreAllMocks());

  it('onSelectDesignFile dispatches setSelectedDesignFile for valid id', () => {
    const dispatched: any[] = [];
    const dispatch = (a: any) => dispatched.push(a);

    const m = mapDispatchToProps(dispatch as any);
    m.onSelectDesignFile('design-0');

    expect(dispatched.length).toBeGreaterThan(0);
    const action = dispatched.find(a => a && a.type && String(a.type).includes('setSelectedDesignFile'));
    expect(action).toBeDefined();
  });

  it('onSelectDesignFile does nothing for invalid id', () => {
    const dispatched: any[] = [];
    const dispatch = (a: any) => dispatched.push(a);

    const m = mapDispatchToProps(dispatch as any);
    m.onSelectDesignFile('design-99');

    // should not dispatch setSelectedDesignFile
    const action = dispatched.find(a => a && a.type && String(a.type).includes('setSelectedDesignFile'));
    expect(action).toBeUndefined();
  });

  it('onOpenDesignFile dispatches setError when no selected design in state', () => {
    const innerDispatch = jest.fn();
    const getState = () => ({ simulation: { selectedDesignFile: null, selectedResolution: 'High' } });

    const outerDispatch = (action: any) => {
      if (typeof action === 'function') return action(innerDispatch, getState);
      return innerDispatch(action);
    };

    const m = mapDispatchToProps(outerDispatch as any);
    m.onOpenDesignFile();

    expect(innerDispatch).toHaveBeenCalled();
    const calledSetError = innerDispatch.mock.calls.some(c => c[0] && c[0].type && String(c[0].type).includes('setError'));
    expect(calledSetError).toBeTruthy();
  });
});
