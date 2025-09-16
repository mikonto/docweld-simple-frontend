/**
 * Central Type Exports
 *
 * All types are now organized into categorized folders.
 * Import types from the specific folders for better clarity.
 *
 * @example
 * import { User } from '@/types/models/user';
 * import { UserFormData } from '@/types/forms';
 * import { ApiResponse } from '@/types/api';
 */

// ============== Organized Exports ==============

// Re-export from organized folders
export * from './models';
export * from './forms';
export * from './api';
export * from './ui';
export * from './utils';
export * from './documents';

// Test utilities remain in their own file
export * from './test-utils';

// ============== Utility Type Aliases ==============

/*
// Utility types - preserved for future use
// Currently not needed in the codebase

export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type ValueOf<T> = T[keyof T];
export type RequiredFields<T, K extends keyof T> = Omit<T, K> & Required<Pick<T, K>>;
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};
*/