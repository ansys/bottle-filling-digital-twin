import { formReducer, formActions } from '../../src/store/slices/formSlice';

describe('formSlice reducers', () => {
  it('returns initial state', () => {
    const state = formReducer(undefined, { type: '@@INIT' });
    expect(state).toBeDefined();
    expect(state.currentStep).toBeGreaterThanOrEqual(1);
  });

  it('update server urls validates and sets errors for invalid URLs', () => {
    const initial = formReducer(undefined, { type: '@@INIT' });
    const next = formReducer(
      initial,
      formActions.updateServerUrlsData({ appServer: 'not-a-url', streamServer: '' })
    );
    // validation errors should be present for serverUrls
    expect(next.validation.serverUrls.isValid).toBe(false);
    expect(Object.keys(next.validation.serverUrls.errors).length).toBeGreaterThan(0);
  });

  it('can reset form', () => {
    const modified = formReducer(undefined, formActions.updateAppOnlyData({ useSimulationUI: false }));
    const reset = formReducer(modified, formActions.resetForm());
    expect(reset.currentStep).toBe(1);
    expect(reset.isDirty).toBe(false);
  });
});
import {
  selectCurrentStep,
  selectCurrentStepValidation,
  selectNavigationState,
} from '../../src/store/slices/formSlice';

describe('formSlice reducer & selectors', () => {
  test('navigation next/previous/goToStep updates currentStep and navigation flags', () => {
    let state = formReducer(undefined, { type: 'unknown' });
    state = formReducer(state, formActions.nextStep());
    expect(selectCurrentStep({ form: state })).toBe(2);

    state = formReducer(state, formActions.previousStep());
    expect(selectCurrentStep({ form: state })).toBe(1);

    state = formReducer(state, formActions.goToStep(4));
    expect(selectCurrentStep({ form: state })).toBe(4);
    const nav = selectNavigationState({ form: state });
    expect(nav.currentStep).toBe(4);
  });

  test('updateServerUrlsData validates URLs and sets errors for invalid/missing', () => {
    let state = formReducer(undefined, { type: 'unknown' });
    // update with missing values
    state = formReducer(state, formActions.updateServerUrlsData({ appServer: '', streamServer: '' }));
    // Since currentStep is 4 previously in other tests, ensure validation for serverUrls by going to step 2
    state = formReducer(state, formActions.goToStep(2));
    state = formReducer(state, formActions.updateServerUrlsData({ appServer: 'not-a-url', streamServer: '' }));
    const v2 = selectCurrentStepValidation({ form: state });
    expect(v2.isValid).toBe(false);
    expect(v2.errors.appServer).toBeDefined();
  });

  test('setFieldError and clearFieldError manipulate validation errors', () => {
    let state = formReducer(undefined, { type: 'unknown' });
    state = formReducer(state, formActions.setFieldError('serverUrls', 'appServer', 'bad'));
    // since currentStep is 1 by default, check the serverUrls errors object directly
    expect(state.validation.serverUrls.errors.appServer).toBe('bad');

    state = formReducer(state, formActions.clearFieldError('serverUrls', 'appServer'));
    expect(state.validation.serverUrls.errors.appServer).toBeUndefined();
  });

  test('startSubmit, submitSuccess and submitError update submission flags', () => {
    let state = formReducer(undefined, { type: 'unknown' });
    state = formReducer(state, formActions.startSubmit());
    expect(state.isSubmitting).toBe(true);

    state = formReducer(state, formActions.submitError('oops'));
    expect(state.isSubmitting).toBe(false);
    expect(state.submitError).toBe('oops');

    state = formReducer(state, formActions.startSubmit());
    state = formReducer(state, formActions.submitSuccess());
    expect(state.isSubmitting).toBe(false);
    expect(state.submitError).toBeNull();
    expect(state.isDirty).toBe(false);
  });
});
