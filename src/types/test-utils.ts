/**
 * Test Utility Types
 * 
 * Types for testing utilities and mock functions.
 * Helps maintain type safety in test files.
 */

import type { RenderOptions } from '@testing-library/react';
import type { MockedFunction as VitestMock } from 'vitest';

// ============== Render Utilities ==============

export interface RenderWithProvidersOptions extends Omit<RenderOptions, 'wrapper'> {
  initialState?: Record<string, any>;
  route?: string;
  initialEntries?: string[];
}

// ============== Mock Types ==============

/**
 * Vitest mock function type
 * Use this for typing mocked functions in tests
 */
export type MockedFunction<T extends (...args: any[]) => any> = VitestMock<T>;

/**
 * Mock return value for hooks
 * Helps type the return values of mocked hooks
 * @unused - Kept for future use
 */
// type MockedHookReturn<T> = T extends (...args: any[]) => infer R ? R : never;

// ============== Firebase Mock Types ==============

export interface MockFirebaseUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL?: string | null;
  emailVerified?: boolean;
}

export interface MockFirestoreDocument {
  id: string;
  data: () => Record<string, any>;
  exists: () => boolean;
  ref: {
    id: string;
    path: string;
  };
}

export interface MockFirestoreQuerySnapshot {
  empty: boolean;
  size: number;
  docs: MockFirestoreDocument[];
  forEach: (callback: (doc: MockFirestoreDocument) => void) => void;
}

// ============== Component Props Mock Types ==============

/**
 * Helper to extract props type from a component
 * @unused - Kept for future use
 */
// type ComponentProps<T> = T extends (props: infer P) => ReactElement ? P : never;

/**
 * Helper to create partial mock props
 * @unused - Kept for future use
 */
// type MockProps<T> = Partial<ComponentProps<T>>;

// ============== Event Mock Types ==============

// @unused - Mock event interface for testing
// interface MockEvent<T = HTMLElement> {
//   target: Partial<T>;
//   currentTarget: Partial<T>;
//   preventDefault: () => void;
//   stopPropagation: () => void;
//   persist?: () => void;
// }

// Commented out - kept for future use when needed
// type MockChangeEvent<T = HTMLInputElement> = MockEvent<T> & {
//   target: Partial<T> & {
//     value: string;
//     checked?: boolean;
//   };
// };

// type MockMouseEvent<T = HTMLElement> = MockEvent<T> & {
//   clientX: number;
//   clientY: number;
//   pageX: number;
//   pageY: number;
//   button: number;
// };

// type MockDragEvent = {
//   active: { id: string };
//   over: { id: string } | null;
//   delta?: { x: number; y: number };
// };

// ============== Assertion Helpers ==============

/**
 * Type guard for checking if value is defined
 * @unused - Kept as utility function for future use
 */
// function isDefined<T>(value: T | undefined | null): value is T {
//   return value !== undefined && value !== null;
// }

/**
 * Type guard for checking if error is an Error instance
 * @unused - Kept as utility function for future use
 */
// function isError(error: unknown): error is Error {
//   return error instanceof Error;
// }

// ============== Test Data Factory Types ==============

// @unused - Test data factory interface for creating test objects
// interface TestDataFactory<T> {
//   create: (overrides?: Partial<T>) => T;
//   createMany: (count: number, overrides?: Partial<T>) => T[];
// }

/**
 * Helper to create test data factories
 * @unused - Kept as utility function for future use
 */
// function createTestFactory<T>(defaults: T): TestDataFactory<T> {
//   return {
//     create: (overrides = {}) => ({ ...defaults, ...overrides }),
//     createMany: (count, overrides = {}) => 
//       Array.from({ length: count }, () => ({ ...defaults, ...overrides }))
//   };
// }