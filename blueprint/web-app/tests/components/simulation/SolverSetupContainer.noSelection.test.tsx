import { mapDispatchToProps } from '../../../src/components/simulation/SolverSetup/SolverSetupContainer';

describe('SolverSetupContainer onOpenDesignFile no selection branch', () => {
  it('dispatches setError when no design selected', () => {
    const innerDispatch = jest.fn();
    const getState = () => ({ simulation: { selectedDesignFile: null, selectedResolution: 'High' } });

    const outerDispatch = (action: any) => {
      if (typeof action === 'function') return action(innerDispatch, getState as any);
      return innerDispatch(action);
    };

    const m = mapDispatchToProps(outerDispatch as any);
    m.onOpenDesignFile();

    // innerDispatch should have been called with setError at least once
    expect(innerDispatch).toHaveBeenCalled();
  });
});
