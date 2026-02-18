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

/**
 * Omniverse Message Handler Service
 *
 * Centralized service for handling custom events from Omniverse applications
 * Decouples message processing logic from UI components
 */

import { AppDispatch } from '@/store';
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
  setKitAppReady,
  setRtxStatus,
  setModelLoadProgress,
} from '@/store/slices/simulationSlice.ts';

export interface OmniverseEventPayload {
  result?: string;
  progress?: number;
  status?: string;
  designFile?: string;
  error?: string;
  text?: string;
  storedResults?: string | string[];
  isHealthy?: boolean;
  // Kit-app status tracking (for e2e tests)
  ready?: boolean;
  solver?: string;
  rtxEnabled?: boolean;
  rt2Enabled?: boolean;
  stage?: string;
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

        // Kit-app status tracking (for e2e tests)
        case 'kitAppReadyResponse':
          this.handleKitAppReady(eventData.payload);
          break;

        case 'rtxStatusResponse':
          this.handleRtxStatus(eventData.payload);
          break;

        case 'modelLoadProgressResponse':
          this.handleModelLoadProgress(eventData.payload);
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

  // Kit-app status tracking handlers (for e2e tests)
  private handleKitAppReady(payload: OmniverseEventPayload): void {
    if (payload.ready) {
      this.dispatch(setKitAppReady(true));
    }
  }

  private handleRtxStatus(payload: OmniverseEventPayload): void {
    const rtxEnabled = payload.rtxEnabled ?? false;
    const rt2Enabled = payload.rt2Enabled ?? false;
    this.dispatch(setRtxStatus({ rtxEnabled, rt2Enabled }));
  }

  private handleModelLoadProgress(payload: OmniverseEventPayload): void {
    const stage = payload.stage ?? 'unknown';
    const progress = payload.progress ?? 0;
    this.dispatch(setModelLoadProgress({ stage, progress }));
  }
}
