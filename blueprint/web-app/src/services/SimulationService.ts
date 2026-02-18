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
 * Simulation Service
 *
 * Handles all API calls and business logic related to simulation management
 */

import type {
  DesignFile,
  SolutionVariable,
} from '@/store/slices/simulationSlice.ts';
import { getApiBase } from './env.ts';
import type { FluentCalculationParams } from '@/store/slices/fluentSlice.ts';

// API endpoints configuration
const API_BASE = getApiBase();
const API_ENDPOINTS = {
  DESIGNS: `${API_BASE}/designs`,
  SIMULATION: `${API_BASE}/simulation`,
  FLUENT: `${API_BASE}/fluent`,
  STATUS: `${API_BASE}/status`,
} as const;

// HTTP client wrapper with error handling
class APIClient {
  private async request<T>(url: string, options: RequestInit = {}): Promise<T> {
    try {
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API Request failed:', error);
      throw error;
    }
  }

  async get<T>(url: string): Promise<T> {
    return this.request<T>(url);
  }

  async post<T>(url: string, data: unknown): Promise<T> {
    return this.request<T>(url, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async put<T>(url: string, data: unknown): Promise<T> {
    return this.request<T>(url, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async delete<T>(url: string): Promise<T> {
    return this.request<T>(url, {
      method: 'DELETE',
    });
  }
}

const apiClient = new APIClient();

export class SimulationService {
  /**
   * Fetch available design files
   */
  static async getAvailableDesigns(): Promise<DesignFile[]> {
    try {
      const designs = await apiClient.get<DesignFile[]>(API_ENDPOINTS.DESIGNS);
      return designs;
    } catch (error) {
      console.error('Failed to fetch design files:', error);
      throw new Error('Unable to load design files');
    }
  }

  /**
   * Load a specific design file
   */
  static async loadDesignFile(designId: string): Promise<DesignFile> {
    try {
      const design = await apiClient.get<DesignFile>(
        `${API_ENDPOINTS.DESIGNS}/${designId}`
      );
      return design;
    } catch (error) {
      console.error(`Failed to load design file ${designId}:`, error);
      throw new Error(`Unable to load design file: ${designId}`);
    }
  }

  /**
   * Start simulation with specified parameters
   */
  static async startSimulation(params: {
    designFileId: string;
    solverConfig: unknown;
    fluentParams?: FluentCalculationParams;
  }): Promise<{ simulationId: string; status: string }> {
    try {
      const result = await apiClient.post<{
        simulationId: string;
        status: string;
      }>(`${API_ENDPOINTS.SIMULATION}/start`, {
        designFile: params.designFileId,
        solver: params.solverConfig,
        fluent: params.fluentParams,
        timestamp: Date.now(),
      });

      return result;
    } catch (error) {
      console.error('Failed to start simulation:', error);
      throw new Error('Unable to start simulation');
    }
  }

  /**
   * Stop running simulation
   */
  static async stopSimulation(simulationId: string): Promise<void> {
    try {
      await apiClient.post(
        `${API_ENDPOINTS.SIMULATION}/${simulationId}/stop`,
        {}
      );
    } catch (error) {
      console.error(`Failed to stop simulation ${simulationId}:`, error);
      throw new Error('Unable to stop simulation');
    }
  }

  /**
   * Get simulation status and progress
   */
  static async getSimulationStatus(simulationId: string): Promise<{
    status: 'idle' | 'running' | 'completed' | 'error';
    progress: number;
    currentStep: string;
    error?: string;
  }> {
    try {
      const status = await apiClient.get<{
        status: 'idle' | 'running' | 'completed' | 'error';
        progress: number;
        currentStep: string;
        error?: string;
      }>(`${API_ENDPOINTS.SIMULATION}/${simulationId}/status`);

      return status;
    } catch (error) {
      console.error(`Failed to get simulation status ${simulationId}:`, error);
      return {
        status: 'error',
        progress: 0,
        currentStep: 'Error',
        error: 'Unable to fetch simulation status',
      };
    }
  }

  /**
   * Get available solution variables
   */
  static async getSolutionVariables(): Promise<SolutionVariable[]> {
    try {
      const variables = await apiClient.get<SolutionVariable[]>(
        `${API_ENDPOINTS.SIMULATION}/variables`
      );
      return variables;
    } catch (error) {
      console.error('Failed to fetch solution variables:', error);
      return [];
    }
  }

  /**
   * Export simulation results in specified format
   */
  static async exportResults(
    simulationId: string,
    format: 'csv' | 'json' | 'vtk' | 'ensight'
  ): Promise<{ downloadUrl: string; filename: string }> {
    try {
      const result = await apiClient.post<{
        downloadUrl: string;
        filename: string;
      }>(`${API_ENDPOINTS.SIMULATION}/${simulationId}/export`, {
        format,
      });

      return result;
    } catch (error) {
      console.error(`Failed to export results for ${simulationId}:`, error);
      throw new Error('Unable to export simulation results');
    }
  }
}

export default SimulationService;
