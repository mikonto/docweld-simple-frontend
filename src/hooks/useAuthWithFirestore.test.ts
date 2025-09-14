import { renderHook } from '@testing-library/react';
import { vi, describe, it, expect } from 'vitest';
import { useAuthWithFirestore } from './useAuthWithFirestore';

// Mock Firebase hooks with actual implementations
vi.mock('react-firebase-hooks/auth', () => ({
  useAuthState: vi.fn(() => [null, true, null]), // loading=true initially
}));

vi.mock('react-firebase-hooks/firestore', () => ({
  useDocument: vi.fn(() => [null, false, null]),
}));

vi.mock('@/config/firebase', () => ({
  auth: {},
  db: {},
}));

vi.mock('firebase/firestore', () => ({
  doc: vi.fn(),
}));

describe('useAuthWithFirestore', () => {
  it('should handle unauthenticated state', () => {
    const { result } = renderHook(() => useAuthWithFirestore());

    expect(result.current.loading).toBe(true); // Initially loading
    expect(result.current.loggedInUser).toBe(null);
    expect(result.current.isAuthorized).toBe(false);
    expect(result.current.userAuth).toBe(null);
    expect(result.current.userDb).toBe(null);
    expect(result.current.userStatus).toBe(null);
  });

  it('should return expected properties', () => {
    const { result } = renderHook(() => useAuthWithFirestore());

    // Check that all expected properties exist
    expect(result.current).toHaveProperty('loggedInUser');
    expect(result.current).toHaveProperty('userAuth');
    expect(result.current).toHaveProperty('userDb');
    expect(result.current).toHaveProperty('userStatus');
    expect(result.current).toHaveProperty('isAuthorized');
    expect(result.current).toHaveProperty('loading');
    expect(result.current).toHaveProperty('error');
  });
});
