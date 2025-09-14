import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi, type Mock } from 'vitest';
import { useProjects, useProject, useProjectOperations } from './useProjects';
import { resetFirebaseMocks } from '@/test/mocks/firebase';
import { useApp } from '@/contexts/AppContext';
import { STATUS, type Status } from '@/constants/firestore';

// Mock the AppContext
vi.mock('@/contexts/AppContext', () => ({
  useApp: vi.fn(),
}));

// Mock react-firebase-hooks
vi.mock('react-firebase-hooks/firestore', () => ({
  useCollection: vi.fn(),
  useDocument: vi.fn(),
}));

// Mock toast notifications
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock useFirestoreOperations
vi.mock('@/hooks/firebase/useFirestoreOperations', () => ({
  useFirestoreOperations: vi.fn(),
}));

// Mock useCascadingSoftDelete
vi.mock('@/hooks/firebase/useCascadingSoftDelete', () => ({
  useCascadingSoftDelete: vi.fn(),
}));

// Import the mocked functions
import { useDocument } from 'react-firebase-hooks/firestore';
import { useFirestoreOperations } from '@/hooks/firebase/useFirestoreOperations';
import { useCascadingSoftDelete } from '@/hooks/firebase/useCascadingSoftDelete';

describe('useProjects Hook', () => {
  beforeEach(() => {
    // Reset all mocks before each test
    resetFirebaseMocks();
    vi.clearAllMocks();

    // Setup default useApp mock
    (useApp as Mock).mockReturnValue({
      loggedInUser: { uid: 'test-user-id', email: 'test@example.com' },
    });
  });

  describe('useProjects', () => {
    it('should return list of projects when loaded', () => {
      const mockProjects = [
        { id: '1', projectName: 'Project Alpha', status: 'active' },
        { id: '2', projectName: 'Project Beta', status: 'active' },
      ];

      (useFirestoreOperations as Mock).mockReturnValue({
        documents: mockProjects,
        loading: false,
        error: null,
      });

      const { result } = renderHook(() => useProjects());

      expect(result.current[0]).toHaveLength(2);
      expect(result.current[0][0].projectName).toBe('Project Alpha');
      expect(result.current[0][1].projectName).toBe('Project Beta');
      expect(result.current[1]).toBe(false);
    });

    it('should handle loading state', () => {
      (useFirestoreOperations as Mock).mockReturnValue({
        documents: [],
        loading: true,
        error: null,
      });

      const { result } = renderHook(() => useProjects());

      expect(result.current[0]).toEqual([]);
      expect(result.current[1]).toBe(true);
      expect(result.current[2]).toBe(null);
    });

    it('should filter projects by status', () => {
      const mockActiveProjects = [
        { id: '1', projectName: 'Active Project', status: 'active' },
      ];

      (useFirestoreOperations as Mock).mockReturnValue({
        documents: mockActiveProjects,
        loading: false,
        error: null,
      });

      const { result } = renderHook(() => useProjects(STATUS.ACTIVE));

      expect(result.current[0]).toHaveLength(1);
      expect(result.current[0][0].status).toBe('active');
    });

    it('should handle error state', () => {
      const mockError = new Error('Failed to load projects');
      (useFirestoreOperations as Mock).mockReturnValue({
        documents: [],
        loading: false,
        error: mockError,
      });

      const { result } = renderHook(() => useProjects());

      expect(result.current[0]).toEqual([]);
      expect(result.current[1]).toBe(false);
      expect(result.current[2]).toEqual(mockError);
    });
  });

  describe('useProject', () => {
    it('should return project details when project exists', () => {
      const mockProject = {
        id: '123',
        exists: () => true,
        data: () => ({
          projectName: 'Test Project',
          status: 'active',
          description: 'Test description',
        }),
      };

      (useDocument as Mock).mockReturnValue([mockProject, false, null]);

      const { result } = renderHook(() => useProject('123'));

      expect(result.current[0]).toMatchObject({
        id: '123',
        projectName: 'Test Project',
        status: 'active',
        description: 'Test description',
      });
    });

    it('should return null when project does not exist', () => {
      const mockSnapshot = {
        exists: () => false,
      };

      (useDocument as Mock).mockReturnValue([mockSnapshot, false, null]);

      const { result } = renderHook(() => useProject('123'));

      expect(result.current[0]).toBe(null);
    });

    it('should return null when no project is selected', () => {
      (useDocument as Mock).mockReturnValue([null, false, null]);

      const { result } = renderHook(() => useProject(null));

      expect(result.current[0]).toBe(null);
      expect(result.current[1]).toBe(false);
    });
  });

  describe('useProjectOperations', () => {
    const mockUser = { uid: 'user123', email: 'test@example.com' };
    const mockCreate = vi.fn();
    const mockUpdate = vi.fn();
    const mockArchive = vi.fn();
    const mockRestore = vi.fn();
    const mockDeleteProject = vi.fn();

    beforeEach(() => {
      (useApp as Mock).mockReturnValue({ loggedInUser: mockUser });

      (useFirestoreOperations as Mock).mockReturnValue({
        create: mockCreate,
        update: mockUpdate,
        archive: mockArchive,
        restore: mockRestore,
        remove: vi.fn(),
      });

      (useCascadingSoftDelete as Mock).mockReturnValue({
        deleteProject: mockDeleteProject,
      });

      // Reset mocks
      mockCreate.mockReset();
      mockUpdate.mockReset();
      mockArchive.mockReset();
      mockRestore.mockReset();
      mockDeleteProject.mockReset();
    });

    describe('createProject', () => {
      it('should create a new project successfully', async () => {
        mockCreate.mockResolvedValue('new-project-id');

        const { result } = renderHook(() => useProjectOperations());

        const projectData = {
          projectName: 'New Project',
          description: 'Test description',
        };

        await act(async () => {
          const projectId = await result.current.createProject(projectData);
          expect(projectId).toBe('new-project-id');
        });

        expect(mockCreate).toHaveBeenCalledWith({
          projectName: 'New Project',
          description: 'Test description',
        });
      });

      it('should require authenticated user', async () => {
        (useApp as Mock).mockReturnValue({ loggedInUser: null });
        mockCreate.mockRejectedValue(
          new Error('User must be logged in to perform this operation')
        );

        const { result } = renderHook(() => useProjectOperations());

        await act(async () => {
          await expect(
            result.current.createProject({ projectName: 'Test' })
          ).rejects.toThrow('User must be logged in to perform this operation');
        });
      });
    });

    describe('updateProject', () => {
      it('should update project successfully', async () => {
        mockUpdate.mockResolvedValue(undefined);

        const { result } = renderHook(() => useProjectOperations());

        const updates = {
          projectName: 'Updated Project Name',
          description: 'Updated description',
        };

        await act(async () => {
          await result.current.updateProject('project123', updates);
        });

        expect(mockUpdate).toHaveBeenCalledWith('project123', {
          projectName: 'Updated Project Name',
          description: 'Updated description',
        });
      });

      it('should require authenticated user', async () => {
        (useApp as Mock).mockReturnValue({ loggedInUser: null });
        mockUpdate.mockRejectedValue(
          new Error('User must be logged in to perform this operation')
        );

        const { result } = renderHook(() => useProjectOperations());

        await act(async () => {
          await expect(
            result.current.updateProject('project123', { projectName: 'Test' })
          ).rejects.toThrow('User must be logged in to perform this operation');
        });
      });
    });

    describe('deleteProject', () => {
      it('should delete project using cascading soft delete', async () => {
        mockDeleteProject.mockResolvedValue(true);

        const { result } = renderHook(() => useProjectOperations());

        await act(async () => {
          await result.current.deleteProject('project123');
        });

        expect(mockDeleteProject).toHaveBeenCalledWith('project123');
      });
    });

    describe('project lifecycle management', () => {
      it('should archive project', async () => {
        mockArchive.mockResolvedValue(undefined);

        const { result } = renderHook(() => useProjectOperations());

        await act(async () => {
          await result.current.archiveProject('project123');
        });

        expect(mockArchive).toHaveBeenCalledWith('project123');
      });

      it('should restore archived project', async () => {
        mockRestore.mockResolvedValue(undefined);

        const { result } = renderHook(() => useProjectOperations());

        await act(async () => {
          await result.current.restoreProject('project123');
        });

        expect(mockRestore).toHaveBeenCalledWith('project123');
      });
    });
  });
});

// Critical i18n tests merged from useProjects.i18n.test.jsx
// Real-world usage scenarios based on actual app behavior
describe('Real-world app scenarios', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (useApp as Mock).mockReturnValue({
      loggedInUser: { uid: 'test-user-id', email: 'test@example.com' },
    });
  });

  it('should handle switching between active and archived projects tabs', () => {
    // Simulate Projects page switching tabs
    const activeProjects = [
      { id: '1', projectName: 'Active Project 1', status: 'active' },
      { id: '2', projectName: 'Active Project 2', status: 'active' },
    ];

    const archivedProjects = [
      { id: '3', projectName: 'Archived Project', status: 'archived' },
    ];

    // First render with 'active' status
    (useFirestoreOperations as Mock).mockReturnValue({
      documents: activeProjects,
      loading: false,
      error: null,
    });

    const { result, rerender } = renderHook(
      ({ status }: { status: Status }) => useProjects(status),
      { initialProps: { status: STATUS.ACTIVE as Status } }
    );

    expect(result.current[0]).toHaveLength(2);
    expect(result.current[0][0].status).toBe('active');

    // Switch to 'archived' tab
    (useFirestoreOperations as Mock).mockReturnValue({
      documents: archivedProjects,
      loading: false,
      error: null,
    });

    rerender({ status: STATUS.ARCHIVED });

    expect(result.current[0]).toHaveLength(1);
    expect(result.current[0][0].status).toBe('archived');
  });

  it('should handle project not found scenario gracefully', () => {
    // Simulate navigating to non-existent project
    (useDocument as Mock).mockReturnValue([null, false, null]);

    const { result } = renderHook(() => useProject('non-existent-id'));

    const [project, loading, error] = result.current;

    expect(project).toBe(null);
    expect(loading).toBe(false);
    expect(error).toBe(null);
    // Parent component should handle showing "Project not found" message
  });

  it('should provide default empty array when no projects exist', () => {
    // Simulate new user with no projects
    (useFirestoreOperations as Mock).mockReturnValue({
      documents: [],
      loading: false,
      error: null,
    });

    const { result } = renderHook(() => useProjects(STATUS.ACTIVE));

    const [projects, loading] = result.current;

    expect(projects).toEqual([]);
    expect(loading).toBe(false);
    // Parent component should show "Create your first project" message
  });

  it('should handle rapid project status changes', async () => {
    const mockArchive = vi.fn().mockResolvedValue(undefined);
    const mockRestore = vi.fn().mockResolvedValue(undefined);

    (useFirestoreOperations as Mock).mockReturnValue({
      create: vi.fn(),
      update: vi.fn(),
      archive: mockArchive,
      restore: mockRestore,
    });

    (useCascadingSoftDelete as Mock).mockReturnValue({
      deleteProject: vi.fn(),
    });

    const { result } = renderHook(() => useProjectOperations());

    // Simulate user archiving then immediately restoring
    await act(async () => {
      await result.current.archiveProject('project123');
    });

    await act(async () => {
      await result.current.restoreProject('project123');
    });

    expect(mockArchive).toHaveBeenCalledWith('project123');
    expect(mockRestore).toHaveBeenCalledWith('project123');
  });
});

describe('useProjectOperations i18n messages', () => {
  const mockUser = { uid: 'test-user-id', email: 'test@example.com' };
  const mockCreate = vi.fn();
  const mockUpdate = vi.fn();
  const mockDeleteProject = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useApp as Mock).mockReturnValue({ loggedInUser: mockUser });

    (useFirestoreOperations as Mock).mockReturnValue({
      documents: [],
      loading: false,
      error: null,
      create: mockCreate,
      update: mockUpdate,
    });

    (useCascadingSoftDelete as Mock).mockReturnValue({
      deleteProject: mockDeleteProject,
    });
  });

  describe('createProject', () => {
    it('should handle success message when creating project', async () => {
      mockCreate.mockResolvedValueOnce('new-project-id');

      const { result } = renderHook(() => useProjectOperations());

      await act(async () => {
        await result.current.createProject({ projectName: 'Test Project' });
      });

      expect(mockCreate).toHaveBeenCalledWith({ projectName: 'Test Project' });
      // Success toast is handled by useFirestoreOperations
    });

    it('should handle error message when creating project fails', async () => {
      mockCreate.mockRejectedValueOnce(new Error('Network error'));

      const { result } = renderHook(() => useProjectOperations());

      await act(async () => {
        try {
          await result.current.createProject({ projectName: 'Test Project' });
        } catch (error) {
          expect((error as Error).message).toBe('Network error');
        }
      });
      // Error toast is handled by useFirestoreOperations
    });
  });

  describe('updateProject', () => {
    it('should handle success message when updating project', async () => {
      mockUpdate.mockResolvedValueOnce(undefined);

      const { result } = renderHook(() => useProjectOperations());

      await act(async () => {
        await result.current.updateProject('project-id', {
          projectName: 'Updated Project',
        });
      });

      expect(mockUpdate).toHaveBeenCalledWith('project-id', {
        projectName: 'Updated Project',
      });
      // Success toast is handled by useFirestoreOperations
    });

    it('should handle error message when updating project fails', async () => {
      mockUpdate.mockRejectedValueOnce(new Error('Permission denied'));

      const { result } = renderHook(() => useProjectOperations());

      await act(async () => {
        try {
          await result.current.updateProject('project-id', {
            projectName: 'Updated Project',
          });
        } catch (error) {
          expect((error as Error).message).toBe('Permission denied');
        }
      });
      // Error toast is handled by useFirestoreOperations
    });
  });

  describe('deleteProject', () => {
    it('should handle success message when deleting project', async () => {
      mockDeleteProject.mockResolvedValueOnce(undefined);

      const { result } = renderHook(() => useProjectOperations());

      await act(async () => {
        await result.current.deleteProject('project-id');
      });

      expect(mockDeleteProject).toHaveBeenCalledWith('project-id');
      // Success toast is handled by useCascadingSoftDelete
    });

    it('should handle error message when deleting project fails', async () => {
      mockDeleteProject.mockRejectedValueOnce(
        new Error('Cannot delete project with active welds')
      );

      const { result } = renderHook(() => useProjectOperations());

      await act(async () => {
        try {
          await result.current.deleteProject('project-id');
        } catch (error) {
          expect((error as Error).message).toBe(
            'Cannot delete project with active welds'
          );
        }
      });
      // Error toast is handled by useCascadingSoftDelete
    });
  });
});
