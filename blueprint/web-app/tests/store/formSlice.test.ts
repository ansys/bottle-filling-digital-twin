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

import { formReducer, formActions } from '@/store/slices/formSlice.ts';

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
} from '@/store/slices/formSlice.ts';

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
