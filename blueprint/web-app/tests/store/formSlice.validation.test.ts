import { formReducer, formActions } from '../../src/store/slices/formSlice';

describe('formSlice validation via reducer', () => {
  it('updateServerUrlsData triggers validation errors for missing/invalid urls', () => {
    let state: any = undefined;

    // Missing URLs should produce validation errors
    state = formReducer(state, formActions.updateServerUrlsData({ appServer: '', streamServer: '' }));
    expect(state.validation.serverUrls.isValid).toBe(false);
    expect(state.validation.serverUrls.errors.appServer).toBeDefined();

    // Invalid format should also produce errors
    state = formReducer(state, formActions.updateServerUrlsData({ appServer: 'not-a-url', streamServer: 'also-not' }));
    expect(state.validation.serverUrls.isValid).toBe(false);
    expect(state.validation.serverUrls.errors.appServer).toMatch(/Invalid URL/);
  });
});
