import { selectCurrentStep, selectFormData, selectIsFormValid } from '../../src/store/slices/formSlice';

describe('form selectors', () => {
  const baseState = {
    form: {
      currentStep: 2,
      totalSteps: 5,
      validation: {
        appOnly: { isValid: true, errors: {}, warnings: {}, touched: {} },
        serverUrls: { isValid: false, errors: { appServer: 'x' }, warnings: {}, touched: {} },
        applicationSelection: { isValid: true, errors: {}, warnings: {}, touched: {} },
        versionSelection: { isValid: true, errors: {}, warnings: {}, touched: {} },
        profileSelection: { isValid: true, errors: {}, warnings: {}, touched: {} },
      },
      formData: {},
    },
  } as any;

  it('selectCurrentStep and form data', () => {
    expect(selectCurrentStep(baseState)).toBe(2);
    expect(selectFormData(baseState)).toBe(baseState.form.formData);
  });

  it('selectIsFormValid false when a step invalid', () => {
    expect(selectIsFormValid(baseState)).toBe(false);
  });
});
