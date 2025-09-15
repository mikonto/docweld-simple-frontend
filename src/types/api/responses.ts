/**
 * Standard API response wrappers
 * Every API call returns one of these
 */

/**
 * Single item response
 */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string;
}

/**
 * List response with pagination
 */
export interface ListResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

/**
 * Result from create/update/delete operations
 */
export interface MutationResult {
  success: boolean;
  id?: string;
  message?: string;
  error?: string;
}

/**
 * Error response from API
 */
export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

/**
 * Pagination parameters for list requests
 */
export interface PaginationParams {
  page: number;
  limit: number;
  orderBy?: string;
  orderDirection?: 'asc' | 'desc';
}

/**
 * Filter parameters for queries
 */
export interface FilterParams {
  [field: string]: string | number | boolean | undefined;
}