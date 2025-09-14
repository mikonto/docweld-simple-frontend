import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi, type Mock } from 'vitest';
import { useUsers, useUser, useUserOperations } from './useUsers';
import { mockSetDoc, resetFirebaseMocks } from '@/test/mocks/firebase';
import { useApp } from '@/contexts/AppContext';
import { toast } from 'sonner';
import type { UserFormData } from '@/types';
import type { FirestoreError } from 'firebase/firestore';

// Mock the AppContext
vi.mock('@/contexts/AppContext', () => ({
  useApp: vi.fn(),
}));

// Mock react-firebase-hooks
vi.mock('react-firebase-hooks/firestore', () => ({
  useCollection: vi.fn(),
  useDocument: vi.fn(),
}));

// Mock useFirestoreOperations
vi.mock('@/hooks/firebase/useFirestoreOperations', () => ({
  useFirestoreOperations: vi.fn(),
}));

// Mock Firebase Cloud Functions
vi.mock('firebase/functions', () => ({
  httpsCallable: vi.fn(),
  getFunctions: vi.fn(),
}));

// Mock toast notifications
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

// Import the mocked functions
import { useDocument } from 'react-firebase-hooks/firestore';
import { httpsCallable } from 'firebase/functions';
import { useFirestoreOperations } from '@/hooks/firebase/useFirestoreOperations';

describe('useUsers Hook', () => {
  beforeEach(() => {
    // Reset all mocks before each test
    resetFirebaseMocks();
    vi.clearAllMocks();
  });

  describe('useUsers', () => {
    it('should return users with combined name field when loaded', () => {
      const mockUsers = [
        {
          id: '1',
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          status: 'active',
        },
        {
          id: '2',
          firstName: 'Jane',
          lastName: 'Smith',
          email: 'jane@example.com',
          status: 'active',
        },
      ];

      (useFirestoreOperations as Mock).mockReturnValue({
        documents: mockUsers,
        loading: false,
        error: null,
      });

      const { result } = renderHook(() => useUsers());

      expect(result.current[0]).toEqual([
        {
          id: '1',
          firstName: 'John',
          lastName: 'Doe',
          name: 'John Doe',
          email: 'john@example.com',
          status: 'active',
        },
        {
          id: '2',
          firstName: 'Jane',
          lastName: 'Smith',
          name: 'Jane Smith',
          email: 'jane@example.com',
          status: 'active',
        },
      ]);
      expect(result.current[1]).toBe(false);
      expect(result.current[2]).toBe(null);
    });

    it('should handle loading state', () => {
      (useFirestoreOperations as Mock).mockReturnValue({
        documents: [],
        loading: true,
        error: null,
      });

      const { result } = renderHook(() => useUsers());

      expect(result.current[0]).toEqual([]);
      expect(result.current[1]).toBe(true);
      expect(result.current[2]).toBe(null);
    });

    it('should filter users by status', () => {
      const mockActiveUsers = [
        {
          id: '1',
          firstName: 'John',
          lastName: 'Doe',
          status: 'active',
        },
      ];

      (useFirestoreOperations as Mock).mockReturnValue({
        documents: mockActiveUsers,
        loading: false,
        error: null,
      });

      const { result } = renderHook(() => useUsers('active'));

      expect(result.current[0]).toEqual([
        {
          id: '1',
          firstName: 'John',
          lastName: 'Doe',
          name: 'John Doe',
          status: 'active',
        },
      ]);
    });

    it('should handle error state', () => {
      const mockError = new Error('Firebase error') as FirestoreError;
      (useFirestoreOperations as Mock).mockReturnValue({
        documents: [],
        loading: false,
        error: mockError,
      });

      const { result } = renderHook(() => useUsers());

      expect(result.current[0]).toEqual([]);
      expect(result.current[1]).toBe(false);
      expect(result.current[2]).toBe(mockError);
    });
  });

  describe('useUser', () => {
    it('should return user data when found', () => {
      const mockUser = {
        id: '123',
        exists: () => true,
        data: () => ({
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          status: 'active',
        }),
      };

      (useDocument as Mock).mockReturnValue([mockUser, false, null]);

      const { result } = renderHook(() => useUser('123'));

      expect(result.current[0]).toEqual({
        id: '123',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        status: 'active',
      });
      expect(result.current[1]).toBe(false);
      expect(result.current[2]).toBe(null);
    });

    it('should return null when user does not exist', () => {
      const mockSnapshot = {
        exists: () => false,
      };

      (useDocument as Mock).mockReturnValue([mockSnapshot, false, null]);

      const { result } = renderHook(() => useUser('123'));

      expect(result.current[0]).toBe(null);
    });

    it('should return null when userId is not provided', () => {
      (useDocument as Mock).mockReturnValue([null, false, null]);

      const { result } = renderHook(() => useUser(undefined));

      expect(result.current[0]).toBe(null);
      expect(result.current[1]).toBe(false);
      expect(result.current[2]).toBe(null);
    });
  });

  describe('useUserOperations', () => {
    const mockUser = { uid: 'admin123', email: 'admin@example.com' };
    const mockUpdate = vi.fn();

    beforeEach(() => {
      (useApp as Mock).mockReturnValue({ loggedInUser: mockUser });
      (useFirestoreOperations as Mock).mockReturnValue({
        documents: [],
        loading: false,
        error: null,
        create: vi.fn(),
        update: mockUpdate,
        remove: vi.fn(),
        archive: vi.fn(),
        restore: vi.fn(),
      });
      mockUpdate.mockClear();
    });

    describe('createUser', () => {
      it('should create a new user successfully', async () => {
        const mockCloudFunction = vi.fn().mockResolvedValue({
          data: { uid: 'new-user-id' },
        });
        (httpsCallable as Mock).mockReturnValue(mockCloudFunction);
        mockSetDoc.mockResolvedValue(undefined);

        const { result } = renderHook(() => useUserOperations());

        const userData: UserFormData = {
          firstName: 'John',
          lastName: 'Doe',
          displayName: 'John Doe',
          email: 'john@example.com',
          password: 'securePassword123',
          role: 'user',
        };

        let userId: string | undefined;
        await act(async () => {
          userId = await result.current.createUser(userData);
        });

        expect(userId).toBe('new-user-id');
        expect(toast.success).toHaveBeenCalledWith('users.createSuccess');
      });

      it('should validate required fields', async () => {
        const { result } = renderHook(() => useUserOperations());

        await act(async () => {
          await expect(
            result.current.createUser({
              firstName: 'John',
              lastName: 'Doe',
              displayName: 'John Doe',
              role: 'user',
              // Missing email and password
            } as UserFormData)
          ).rejects.toThrow('Email and password are required');
        });

        expect(toast.error).toHaveBeenCalledWith(
          'Email and password are required'
        );
      });

      it('should require authenticated user', async () => {
        (useApp as Mock).mockReturnValue({ loggedInUser: null });

        const { result } = renderHook(() => useUserOperations());

        await act(async () => {
          await expect(
            result.current.createUser({
              firstName: 'John',
              lastName: 'Doe',
              displayName: 'John Doe',
              email: 'john@example.com',
              password: 'securePassword123',
              role: 'user',
            } as UserFormData)
          ).rejects.toThrow('Must be logged in to create users');
        });
      });
    });

    describe('updateUser', () => {
      it('should update user successfully', async () => {
        mockUpdate.mockResolvedValue(undefined);

        const { result } = renderHook(() => useUserOperations());

        await act(async () => {
          await result.current.updateUser('user123', {
            firstName: 'Jane',
            lastName: 'Smith',
          });
        });

        expect(mockUpdate).toHaveBeenCalledWith('user123', {
          firstName: 'Jane',
          lastName: 'Smith',
        });
      });

      it('should require authenticated user', async () => {
        (useApp as Mock).mockReturnValue({ loggedInUser: null });
        mockUpdate.mockRejectedValue(
          new Error('User must be logged in to perform this operation')
        );

        const { result } = renderHook(() => useUserOperations());

        await act(async () => {
          await expect(
            result.current.updateUser('user123', { firstName: 'Jane' })
          ).rejects.toThrow('User must be logged in to perform this operation');
        });
      });
    });

    describe('role management', () => {
      it('should promote user to admin', async () => {
        mockUpdate.mockResolvedValue(undefined);

        const { result } = renderHook(() => useUserOperations());

        await act(async () => {
          await result.current.promoteToAdmin('user123');
        });

        expect(mockUpdate).toHaveBeenCalledWith('user123', { role: 'admin' });
      });

      it('should demote admin to user', async () => {
        mockUpdate.mockResolvedValue(undefined);

        const { result } = renderHook(() => useUserOperations());

        await act(async () => {
          await result.current.demoteToUser('admin123');
        });

        expect(mockUpdate).toHaveBeenCalledWith('admin123', { role: 'user' });
      });
    });

    describe('status management', () => {
      it('should activate user', async () => {
        mockUpdate.mockResolvedValue(undefined);

        const { result } = renderHook(() => useUserOperations());

        await act(async () => {
          await result.current.activateUser('user123');
        });

        expect(mockUpdate).toHaveBeenCalledWith('user123', {
          status: 'active',
        });
      });

      it('should deactivate user', async () => {
        mockUpdate.mockResolvedValue(undefined);

        const { result } = renderHook(() => useUserOperations());

        await act(async () => {
          await result.current.deactivateUser('user123');
        });

        expect(mockUpdate).toHaveBeenCalledWith('user123', {
          status: 'inactive',
        });
      });
    });
  });
});

// Critical i18n tests merged from useUsers.i18n.test.jsx
describe('useUserOperations i18n messages', () => {
  const mockUser = { uid: 'admin123', email: 'admin@example.com' };

  beforeEach(() => {
    (useApp as Mock).mockReturnValue({ loggedInUser: mockUser });
    (useFirestoreOperations as Mock).mockReturnValue({
      documents: [],
      loading: false,
      error: null,
      create: vi.fn(),
      update: vi.fn(),
      remove: vi.fn(),
      archive: vi.fn(),
      restore: vi.fn(),
    });
    vi.clearAllMocks();
  });

  it('should show success message when user creation succeeds', async () => {
    const mockCloudFunction = vi.fn().mockResolvedValue({
      data: { uid: 'new-user-id' },
    });
    (httpsCallable as Mock).mockReturnValue(mockCloudFunction);
    mockSetDoc.mockResolvedValue(undefined);

    const { result } = renderHook(() => useUserOperations());

    await act(async () => {
      await result.current.createUser({
        firstName: 'Test',
        lastName: 'User',
        displayName: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        role: 'user',
      } as UserFormData);
    });

    expect(toast.success).toHaveBeenCalledWith('users.createSuccess');
  });

  it('should show error message when user creation fails', async () => {
    const mockCloudFunction = vi
      .fn()
      .mockRejectedValue(new Error('Network error'));
    (httpsCallable as Mock).mockReturnValue(mockCloudFunction);

    const { result } = renderHook(() => useUserOperations());

    await act(async () => {
      try {
        await result.current.createUser({
          firstName: 'Test',
          lastName: 'User',
          displayName: 'Test User',
          email: 'test@example.com',
          password: 'password123',
          role: 'user',
        } as UserFormData);
      } catch (error) {
        expect((error as Error).message).toBe(
          'Failed to create user: Network error'
        );
      }
    });

    expect(toast.error).toHaveBeenCalledWith('Network error');
  });
});
