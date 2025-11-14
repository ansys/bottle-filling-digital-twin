/**
 * Form Slice
 *
 * Manages form state, validation, and navigation across multi-step workflows
 */

// Form validation interface
export interface FormValidation {
  isValid: boolean;
  errors: Record<string, string>;
  warnings: Record<string, string>;
  touched: Record<string, boolean>;
}

// Form state interface
export interface FormState {
  // Current form and navigation
  currentStep: number;
  totalSteps: number;
  canGoBack: boolean;
  canGoForward: boolean;

  // Form data for each step
  formData: {
    // Step 1: App selection preferences
    appOnly: {
      useSimulationUI: boolean;
    };

    // Step 2: Server URLs
    serverUrls: {
      appServer: string;
      streamServer: string;
    };

    // Step 3: Application selection
    applicationSelection: {
      selectedApplicationId: string;
      availableApplications: Array<{
        id: string;
        name: string;
        description?: string;
      }>;
    };

    // Step 4: Version selection
    versionSelection: {
      selectedVersion: string;
      availableVersions: string[];
    };

    // Step 5: Profile selection
    profileSelection: {
      selectedProfile: string;
      availableProfiles: string[];
    };
  };

  // Validation state for each step
  validation: {
    appOnly: FormValidation;
    serverUrls: FormValidation;
    applicationSelection: FormValidation;
    versionSelection: FormValidation;
    profileSelection: FormValidation;
  };

  // Form submission state
  isSubmitting: boolean;
  submitError: string | null;

  // Auto-save and draft state
  isDirty: boolean;
  lastSaved: number | null;
  autoSaveEnabled: boolean;

  // Form history for undo/redo
  history: Array<{
    step: number;
    data: typeof initialState.formData;
    timestamp: number;
  }>;
  currentHistoryIndex: number;
}

// Initial validation state
const createInitialValidation = (): FormValidation => ({
  isValid: true,
  errors: {},
  warnings: {},
  touched: {},
});

// Initial state
const initialState: FormState = {
  currentStep: 1,
  totalSteps: 5,
  canGoBack: false,
  canGoForward: false,

  formData: {
    appOnly: {
      useSimulationUI: true,
    },
    serverUrls: {
      appServer: '',
      streamServer: '',
    },
    applicationSelection: {
      selectedApplicationId: '',
      availableApplications: [],
    },
    versionSelection: {
      selectedVersion: '',
      availableVersions: [],
    },
    profileSelection: {
      selectedProfile: '',
      availableProfiles: [],
    },
  },

  validation: {
    appOnly: createInitialValidation(),
    serverUrls: createInitialValidation(),
    applicationSelection: createInitialValidation(),
    versionSelection: createInitialValidation(),
    profileSelection: createInitialValidation(),
  },

  isSubmitting: false,
  submitError: null,

  isDirty: false,
  lastSaved: null,
  autoSaveEnabled: true,

  history: [],
  currentHistoryIndex: -1,
};

// Action types
export const FORM_ACTIONS = {
  // Navigation
  NEXT_STEP: 'form/nextStep',
  PREVIOUS_STEP: 'form/previousStep',
  GO_TO_STEP: 'form/goToStep',
  SET_NAVIGATION_STATE: 'form/setNavigationState',

  // Form data updates
  UPDATE_APP_ONLY_DATA: 'form/updateAppOnlyData',
  UPDATE_SERVER_URLS_DATA: 'form/updateServerUrlsData',
  UPDATE_APPLICATION_SELECTION_DATA: 'form/updateApplicationSelectionData',
  UPDATE_VERSION_SELECTION_DATA: 'form/updateVersionSelectionData',
  UPDATE_PROFILE_SELECTION_DATA: 'form/updateProfileSelectionData',

  // Validation
  SET_STEP_VALIDATION: 'form/setStepValidation',
  SET_FIELD_ERROR: 'form/setFieldError',
  CLEAR_FIELD_ERROR: 'form/clearFieldError',
  SET_FIELD_TOUCHED: 'form/setFieldTouched',
  VALIDATE_CURRENT_STEP: 'form/validateCurrentStep',
  VALIDATE_ALL_STEPS: 'form/validateAllSteps',

  // Submission
  START_SUBMIT: 'form/startSubmit',
  SUBMIT_SUCCESS: 'form/submitSuccess',
  SUBMIT_ERROR: 'form/submitError',

  // Auto-save and drafts
  SET_DIRTY: 'form/setDirty',
  MARK_SAVED: 'form/markSaved',
  TOGGLE_AUTO_SAVE: 'form/toggleAutoSave',

  // History
  ADD_TO_HISTORY: 'form/addToHistory',
  UNDO: 'form/undo',
  REDO: 'form/redo',
  CLEAR_HISTORY: 'form/clearHistory',

  // Reset
  RESET_FORM: 'form/resetForm',
  RESET_STEP: 'form/resetStep',
} as const;

// Action creators
export const formActions = {
  nextStep: () => ({
    type: FORM_ACTIONS.NEXT_STEP,
  }),

  previousStep: () => ({
    type: FORM_ACTIONS.PREVIOUS_STEP,
  }),

  goToStep: (step: number) => ({
    type: FORM_ACTIONS.GO_TO_STEP,
    payload: step,
  }),

  updateAppOnlyData: (data: Partial<FormState['formData']['appOnly']>) => ({
    type: FORM_ACTIONS.UPDATE_APP_ONLY_DATA,
    payload: data,
  }),

  updateServerUrlsData: (
    data: Partial<FormState['formData']['serverUrls']>
  ) => ({
    type: FORM_ACTIONS.UPDATE_SERVER_URLS_DATA,
    payload: data,
  }),

  updateApplicationSelectionData: (
    data: Partial<FormState['formData']['applicationSelection']>
  ) => ({
    type: FORM_ACTIONS.UPDATE_APPLICATION_SELECTION_DATA,
    payload: data,
  }),

  updateVersionSelectionData: (
    data: Partial<FormState['formData']['versionSelection']>
  ) => ({
    type: FORM_ACTIONS.UPDATE_VERSION_SELECTION_DATA,
    payload: data,
  }),

  updateProfileSelectionData: (
    data: Partial<FormState['formData']['profileSelection']>
  ) => ({
    type: FORM_ACTIONS.UPDATE_PROFILE_SELECTION_DATA,
    payload: data,
  }),

  setFieldError: (
    step: keyof FormState['validation'],
    field: string,
    error: string
  ) => ({
    type: FORM_ACTIONS.SET_FIELD_ERROR,
    payload: { step, field, error },
  }),

  clearFieldError: (step: keyof FormState['validation'], field: string) => ({
    type: FORM_ACTIONS.CLEAR_FIELD_ERROR,
    payload: { step, field },
  }),

  setFieldTouched: (
    step: keyof FormState['validation'],
    field: string,
    touched: boolean = true
  ) => ({
    type: FORM_ACTIONS.SET_FIELD_TOUCHED,
    payload: { step, field, touched },
  }),

  startSubmit: () => ({
    type: FORM_ACTIONS.START_SUBMIT,
  }),

  submitSuccess: () => ({
    type: FORM_ACTIONS.SUBMIT_SUCCESS,
  }),

  submitError: (error: string) => ({
    type: FORM_ACTIONS.SUBMIT_ERROR,
    payload: error,
  }),

  resetForm: () => ({
    type: FORM_ACTIONS.RESET_FORM,
  }),
};

// Helper functions
const updateNavigationState = (state: FormState): FormState => {
  return {
    ...state,
    canGoBack: state.currentStep > 1,
    canGoForward:
      state.currentStep < state.totalSteps &&
      state.validation[getCurrentStepKey(state.currentStep)].isValid,
  };
};

const getCurrentStepKey = (step: number): keyof FormState['validation'] => {
  switch (step) {
    case 1:
      return 'appOnly';
    case 2:
      return 'serverUrls';
    case 3:
      return 'applicationSelection';
    case 4:
      return 'versionSelection';
    case 5:
      return 'profileSelection';
    default:
      return 'appOnly';
  }
};

const validateStep = (
  stepKey: keyof FormState['validation'],
  formData: FormState['formData']
): FormValidation => {
  const validation: FormValidation = {
    isValid: true,
    errors: {},
    warnings: {},
    touched: {},
  };

  switch (stepKey) {
    case 'serverUrls': {
      if (!formData.serverUrls.appServer) {
        validation.errors.appServer = 'App Server URL is required';
        validation.isValid = false;
      } else {
        try {
          new URL(formData.serverUrls.appServer);
        } catch {
          validation.errors.appServer = 'Invalid URL format';
          validation.isValid = false;
        }
      }

      if (!formData.serverUrls.streamServer) {
        validation.errors.streamServer = 'Stream Server URL is required';
        validation.isValid = false;
      } else {
        try {
          new URL(formData.serverUrls.streamServer);
        } catch {
          validation.errors.streamServer = 'Invalid URL format';
          validation.isValid = false;
        }
      }
      break;
    }

    case 'applicationSelection': {
      if (!formData.applicationSelection.selectedApplicationId) {
        validation.errors.selectedApplicationId =
          'Please select an application';
        validation.isValid = false;
      }
      break;
    }

    case 'versionSelection': {
      if (!formData.versionSelection.selectedVersion) {
        validation.errors.selectedVersion = 'Please select a version';
        validation.isValid = false;
      }
      break;
    }

    case 'profileSelection': {
      if (!formData.profileSelection.selectedProfile) {
        validation.errors.selectedProfile = 'Please select a profile';
        validation.isValid = false;
      }
      break;
    }

    default:
      break;
  }

  return validation;
};

// Reducer
export const formReducer = (
  state: FormState = initialState,
  action: { type: string; payload?: unknown }
): FormState => {
  switch (action.type) {
    case FORM_ACTIONS.NEXT_STEP: {
      const newStep = Math.min(state.currentStep + 1, state.totalSteps);
      return updateNavigationState({
        ...state,
        currentStep: newStep,
      });
    }

    case FORM_ACTIONS.PREVIOUS_STEP: {
      const newStep = Math.max(state.currentStep - 1, 1);
      return updateNavigationState({
        ...state,
        currentStep: newStep,
      });
    }

    case FORM_ACTIONS.GO_TO_STEP: {
      const step = Math.max(
        1,
        Math.min(action.payload as number, state.totalSteps)
      );
      return updateNavigationState({
        ...state,
        currentStep: step,
      });
    }

    case FORM_ACTIONS.UPDATE_APP_ONLY_DATA: {
      const newState = {
        ...state,
        formData: {
          ...state.formData,
          appOnly: {
            ...state.formData.appOnly,
            ...(action.payload as Partial<FormState['formData']['appOnly']>),
          },
        },
        isDirty: true,
      };

      newState.validation.appOnly = validateStep('appOnly', newState.formData);
      return updateNavigationState(newState);
    }

    case FORM_ACTIONS.UPDATE_SERVER_URLS_DATA: {
      const newState = {
        ...state,
        formData: {
          ...state.formData,
          serverUrls: {
            ...state.formData.serverUrls,
            ...(action.payload as Partial<FormState['formData']['serverUrls']>),
          },
        },
        isDirty: true,
      };

      newState.validation.serverUrls = validateStep(
        'serverUrls',
        newState.formData
      );
      return updateNavigationState(newState);
    }

    case FORM_ACTIONS.UPDATE_APPLICATION_SELECTION_DATA: {
      const newState = {
        ...state,
        formData: {
          ...state.formData,
          applicationSelection: {
            ...state.formData.applicationSelection,
            ...(action.payload as Partial<
              FormState['formData']['applicationSelection']
            >),
          },
        },
        isDirty: true,
      };

      newState.validation.applicationSelection = validateStep(
        'applicationSelection',
        newState.formData
      );
      return updateNavigationState(newState);
    }

    case FORM_ACTIONS.SET_FIELD_ERROR: {
      const { step, field, error } = action.payload as {
        step: keyof FormState['validation'];
        field: string;
        error: string;
      };
      return {
        ...state,
        validation: {
          ...state.validation,
          [step]: {
            ...state.validation[step],
            errors: {
              ...state.validation[step].errors,
              [field]: error,
            },
            isValid: false,
          },
        },
      };
    }

    case FORM_ACTIONS.CLEAR_FIELD_ERROR: {
      const { step, field } = action.payload as {
        step: keyof FormState['validation'];
        field: string;
      };
      const newErrors = { ...state.validation[step].errors };
      delete newErrors[field];

      return {
        ...state,
        validation: {
          ...state.validation,
          [step]: {
            ...state.validation[step],
            errors: newErrors,
            isValid: Object.keys(newErrors).length === 0,
          },
        },
      };
    }

    case FORM_ACTIONS.START_SUBMIT:
      return {
        ...state,
        isSubmitting: true,
        submitError: null,
      };

    case FORM_ACTIONS.SUBMIT_SUCCESS:
      return {
        ...state,
        isSubmitting: false,
        submitError: null,
        isDirty: false,
        lastSaved: Date.now(),
      };

    case FORM_ACTIONS.SUBMIT_ERROR:
      return {
        ...state,
        isSubmitting: false,
        submitError: action.payload as string,
      };

    case FORM_ACTIONS.MARK_SAVED:
      return {
        ...state,
        isDirty: false,
        lastSaved: Date.now(),
      };

    case FORM_ACTIONS.RESET_FORM:
      return initialState;

    default:
      return state;
  }
};

// Selectors
export const selectCurrentStep = (state: { form: FormState }) =>
  state.form.currentStep;
export const selectFormData = (state: { form: FormState }) =>
  state.form.formData;
export const selectCurrentStepData = (state: { form: FormState }) => {
  const stepKey = getCurrentStepKey(state.form.currentStep);
  return state.form.formData[stepKey];
};
export const selectCurrentStepValidation = (state: { form: FormState }) => {
  const stepKey = getCurrentStepKey(state.form.currentStep);
  return state.form.validation[stepKey];
};
export const selectNavigationState = (state: { form: FormState }) => ({
  currentStep: state.form.currentStep,
  totalSteps: state.form.totalSteps,
  canGoBack: state.form.canGoBack,
  canGoForward: state.form.canGoForward,
});
export const selectIsFormValid = (state: { form: FormState }) =>
  Object.values(state.form.validation).every(v => v.isValid);
export const selectFormErrors = (state: { form: FormState }) =>
  Object.entries(state.form.validation).reduce(
    (acc, [step, validation]) => {
      if (Object.keys(validation.errors).length > 0) {
        acc[step] = validation.errors;
      }
      return acc;
    },
    {} as Record<string, Record<string, string>>
  );

export default formReducer;
