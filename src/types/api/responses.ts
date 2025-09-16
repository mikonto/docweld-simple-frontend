/**
 * Standard API response wrappers
 *
 * NOTE: These interfaces are for future REST API integration.
 * Currently not in use as the app uses Firestore directly.
 * Commented out to reduce TypeScript overhead.
 */

// Placeholder export to make this a valid module
export {};

/*
// Uncomment when implementing REST API integration

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string;
}

export interface ListResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export interface MutationResult {
  success: boolean;
  id?: string;
  message?: string;
  error?: string;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface PaginationParams {
  page: number;
  limit: number;
  orderBy?: string;
  orderDirection?: 'asc' | 'desc';
}

export interface FilterParams {
  [field: string]: string | number | boolean | undefined;
}
*/