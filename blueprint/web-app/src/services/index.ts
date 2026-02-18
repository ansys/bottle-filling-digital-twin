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
 * Services Index
 *
 * Central exports for all service classes
 */

import { SimulationService } from './SimulationService.ts';
import { StreamingService } from './StreamingService.ts';

export { SimulationService, StreamingService };

// Service instances for easy access
export const simulationService = SimulationService;
export const streamingService = StreamingService.getInstance();

// API configuration
export const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_BASE || 'http://localhost:8000',
  TIMEOUT: 10000,
  RETRY_ATTEMPTS: 3,
} as const;

// Error handling utilities
export class ServiceError extends Error {
  constructor(
    message: string,
    public service: string,
    public operation: string,
    public originalError?: Error
  ) {
    super(message);
    this.name = 'ServiceError';
  }
}

export const handleServiceError = (
  error: unknown,
  service: string,
  operation: string
): ServiceError => {
  if (error instanceof ServiceError) {
    return error;
  }

  const message =
    error instanceof Error ? error.message : 'Unknown error occurred';
  return new ServiceError(
    message,
    service,
    operation,
    error instanceof Error ? error : undefined
  );
};

// Common response types
export interface ServiceResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export interface HealthCheckResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  services: {
    [serviceName: string]: {
      status: 'up' | 'down';
      responseTime?: number;
      lastChecked: number;
    };
  };
  uptime: number;
  version: string;
}
