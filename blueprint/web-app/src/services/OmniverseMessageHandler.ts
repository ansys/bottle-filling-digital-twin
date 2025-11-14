/**
 * Omniverse Message Handler Service
 *
 * Centralized service for handling custom events from Omniverse applications
 * Decouples message processing logic from UI components
 */

import { AppDispatch } from '../store';
import {
  setSelectedDesignFile,
  updateSimulationProgress,
  setSimulationStatus,
  setError,
  setCanInitialize,
  setCanRun,
  setLoading,
  setStatusText,
  setStoredResults,
} from '../store/slices/simulationSlice';

export interface OmniverseEventPayload {
  result?: string;
  progress?: number;
  status?: string;
  designFile?: string;
  error?: string;
  text?: string;
  storedResults?: string | string[];
  isHealthy?: boolean;
}

export interface OmniverseCustomEvent {
  event_type?: string;
  type?: string;
  payload?: OmniverseEventPayload;
}

/**
 * Process custom events from Omniverse and dispatch appropriate Redux actions
 */
export class OmniverseMessageHandler {
  private dispatch: AppDispatch;

  constructor(dispatch: AppDispatch) {
    this.dispatch = dispatch;
  }

  /**
   * Handle incoming custom event from Omniverse
   */
  public handleCustomEvent(event: unknown): void {
    try {
      const eventData = event as OmniverseCustomEvent;

      const messageType = eventData.event_type || eventData.type;
      if (!messageType || !eventData.payload) {
        console.warn('OmniverseMessageHandler: Invalid event structure', event);
        return;
      }

      console.log(
        `OmniverseMessageHandler: Processing ${messageType}`,
        eventData.payload
      );

      switch (messageType) {
        case 'simulation_progress':
          this.handleSimulationProgress(eventData.payload);
          break;

        case 'simulation_status':
          this.handleSimulationStatus(eventData.payload);
          break;

        case 'design_file_loaded':
          this.handleDesignFileLoaded(eventData.payload);
          break;

        case 'loadDesignFileResponse':
          this.handleLoadDesignFileResponse(eventData.payload);
          break;

        case 'postProcessSolutionVariableResponse':
          this.handlePostProcessResponse(eventData.payload);
          break;

        case 'updateStatusText':
          this.handleStatusTextUpdate(eventData.payload);
          break;

        case 'runCalculationsResponse':
          this.handleCalculationsResponse(eventData.payload);
          break;

        case 'openSolvedCaseResponse':
          this.handleSolvedCaseResponse(eventData.payload);
          break;

        case 'storedResultsResponse':
          this.handleStoredResultsResponse(eventData.payload);
          break;

        case 'updateMessageText':
          this.handleStatusTextUpdate(eventData.payload);
          break;

        case 'storedSolvedCaseResponse':
          this.handleStoredSolvedCaseResponse(eventData.payload);
          break;

        case 'isInstanceHealthyResponse':
          this.handleInstanceHealthyResponse(eventData.payload);
          break;

        case 'error':
          this.handleError(eventData.payload);
          break;

        default:
          console.log(
            'OmniverseMessageHandler: Unhandled event type:',
            messageType
          );
      }
    } catch (error) {
      console.error('OmniverseMessageHandler: Error processing event:', error);
    }
  }

  private handleSimulationProgress(payload: OmniverseEventPayload): void {
    if (payload.progress !== undefined) {
      this.dispatch(updateSimulationProgress(payload.progress));
    }
  }

  private handleSimulationStatus(payload: OmniverseEventPayload): void {
    if (payload.status) {
      const validStatuses = [
        'idle',
        'initializing',
        'running',
        'completed',
        'error',
        'cancelled',
      ] as const;

      if (
        validStatuses.includes(payload.status as (typeof validStatuses)[number])
      ) {
        this.dispatch(
          setSimulationStatus(payload.status as (typeof validStatuses)[number])
        );
      }
    }
  }

  private handleDesignFileLoaded(payload: OmniverseEventPayload): void {
    if (payload.designFile) {
      const designFile = {
        name: payload.designFile,
        url: `/designs/${payload.designFile}`,
      };
      this.dispatch(setSelectedDesignFile(designFile));
    }
  }

  private handleLoadDesignFileResponse(payload: OmniverseEventPayload): void {
    if (payload.result === 'success') {
      this.dispatch(setCanInitialize(true));
      this.dispatch(setLoading(false));
      this.dispatch(setSimulationStatus('idle'));
    } else {
      console.error('OmniverseMessageHandler: Error loading design file');
      const errorMessage = payload.error || 'Error loading design file';
      this.dispatch(setError(errorMessage));
      this.dispatch(setLoading(false));
    }
  }

  private handlePostProcessResponse(payload: OmniverseEventPayload): void {
    if (payload.result === 'success') {
      this.dispatch(setCanRun(true));
      this.dispatch(setLoading(false));
      this.dispatch(setSimulationStatus('idle'));
    } else {
      console.error(
        'OmniverseMessageHandler: Error post-processing solution variable'
      );
      const errorMessage =
        payload.error || 'Error post-processing solution variable';
      this.dispatch(setError(errorMessage));
      this.dispatch(setLoading(false));
    }
  }

  private handleStatusTextUpdate(payload: OmniverseEventPayload): void {
    if (payload.text) {
      this.dispatch(setStatusText(payload.text));
    }
  }

  private handleCalculationsResponse(payload: OmniverseEventPayload): void {
    if (payload.result === 'success') {
      this.dispatch(setCanInitialize(true));
      this.dispatch(setCanRun(true));
      this.dispatch(setLoading(false));
      this.dispatch(setSimulationStatus('completed'));
      this.dispatch(setStatusText(null));
    } else {
      console.error('OmniverseMessageHandler: Error during calculations');
      const errorMessage = payload.error || 'Error during calculations';
      this.dispatch(setError(errorMessage));
      this.dispatch(setLoading(false));
      this.dispatch(setSimulationStatus('error'));
    }
  }

  private handleSolvedCaseResponse(payload: OmniverseEventPayload): void {
    if (payload.result === 'success') {
      this.dispatch(setLoading(false));
      this.dispatch(setStatusText('Solved case loaded successfully'));
    } else {
      console.error('OmniverseMessageHandler: Error loading solved case');
      this.dispatch(setLoading(false));
      this.dispatch(setStatusText('Failed to load solved case'));
    }
  }

  private handleStoredResultsResponse(payload: OmniverseEventPayload): void {
    if (payload.storedResults) {
      if (Array.isArray(payload.storedResults)) {
        this.dispatch(setStoredResults(payload.storedResults));
        this.dispatch(setLoading(false));
        this.dispatch(setStatusText('Stored results loaded successfully'));
      } else if (payload.storedResults === 'success') {
        this.dispatch(setLoading(false));
        this.dispatch(setStatusText('Loaded Stored successfully'));
      }
    } else {
      console.error('OmniverseMessageHandler: Error loading stored results');
      this.dispatch(setLoading(false));
      this.dispatch(setStatusText('Failed to load stored results'));
    }
  }

  private handleStoredSolvedCaseResponse(payload: OmniverseEventPayload): void {
    if (payload.result === 'success'){
      this.dispatch(setLoading(false));
      this.dispatch(setStatusText('Solved case stored successfully'));
    } else {
      console.error('Error saving solved case');
      this.dispatch(setLoading(false));
      this.dispatch(setStatusText('Error saving solved case'));

    }
  }

  private handleInstanceHealthyResponse(payload: OmniverseEventPayload): void {
    if (!payload.isHealthy) {
      console.log(
        'OmniverseMessageHandler: Fluent instance unhealthy - License required'
      );
      this.dispatch(setSimulationStatus('error'));
      this.dispatch(setError('Fluent License Required!'));
      this.dispatch(setLoading(false));
    } else {
      console.log('OmniverseMessageHandler: Fluent instance healthy');
      // Don't set canRun here - it should only be set after user completes initial conditions
      // Just clear any previous errors and confirm system is ready
      this.dispatch(setLoading(false));
      this.dispatch(setError(null));
      this.dispatch(setSimulationStatus('idle'));
    }
  }

  private handleError(payload: OmniverseEventPayload): void {
    if (payload.error) {
      this.dispatch(setError(payload.error));
    }
  }
}
