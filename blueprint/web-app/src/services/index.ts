/**
 * Services Index
 *
 * Central exports for all service classes
 */

import { SimulationService } from './SimulationService';
import { StreamingService } from './StreamingService';

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
