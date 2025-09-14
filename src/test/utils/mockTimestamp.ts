import type { Timestamp } from 'firebase/firestore';

/**
 * Mock Timestamp for testing
 * Provides a fully typed Timestamp object for use in tests
 */
export const createMockTimestamp = (date: Date = new Date()): Timestamp => ({
  seconds: Math.floor(date.getTime() / 1000),
  nanoseconds: 0,
  toDate: () => date,
  toMillis: () => date.getTime(),
  isEqual: (other: Timestamp) =>
    other.seconds === Math.floor(date.getTime() / 1000),
  valueOf: () => date.valueOf().toString(),
  toJSON: () => ({
    seconds: Math.floor(date.getTime() / 1000),
    nanoseconds: 0,
    type: 'timestamp',
  }),
});

export const mockTimestamp = createMockTimestamp();
