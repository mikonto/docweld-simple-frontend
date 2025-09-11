import { useDocument } from 'react-firebase-hooks/firestore';
import { doc, where, QueryConstraint, FirestoreError } from 'firebase/firestore';

import { db } from '@/config/firebase';
import { useFirestoreOperations } from '@/hooks/firebase/useFirestoreOperations';
import { useCascadingSoftDelete } from '@/hooks/firebase/useCascadingSoftDelete';
import { type Project, type ProjectFormData } from '@/types';
import { type Status } from '@/constants/firestore';

/**
 * Return type for useProjectOperations hook
 */
interface UseProjectOperationsReturn {
  createProject: (data: ProjectFormData) => Promise<string>;
  updateProject: (projectId: string, updates: Partial<Project>) => Promise<void>;
  deleteProject: (projectId: string) => Promise<boolean>;
  archiveProject: (projectId: string) => Promise<void>;
  restoreProject: (projectId: string) => Promise<void>;
}

// Collection of hooks for interacting with projects in Firestore

/**
 * Hook to fetch a single project's Firestore document
 * @param projectId - The project ID to fetch
 * @returns Returns:
 *   - Project document or null if not found
 *   - Loading state
 *   - Error if any
 */
export const useProject = (projectId?: string | null): [Project | null, boolean, FirestoreError | undefined] => {
  const [snapshot, loading, error] = useDocument(
    projectId ? doc(db, 'projects', projectId) : null
  );

  const project = snapshot?.exists()
    ? { id: snapshot.id, ...snapshot.data() } as Project
    : null;

  return [project, loading, error];
};

/**
 * Hook to fetch multiple projects with optional status filtering
 * @param status - Optional status filter
 * @returns Returns:
 *   - Array of project documents
 *   - Loading state
 *   - Error if any
 */
export const useProjects = (status?: Status): [Project[], boolean, FirestoreError | undefined] => {
  // Build constraints based on status filter
  const constraints: QueryConstraint[] = status ? [where('status', '==', status)] : [];

  // Use the unified hook to fetch projects
  const { documents, loading, error } = useFirestoreOperations('projects', {
    constraints,
  });

  // Return in the expected format [projects, loading, error]
  return [documents as Project[], loading, error];
};

/**
 * Hook to create, update, delete, archive, and restore projects
 * @returns Object containing project operation functions
 */
export const useProjectOperations = (): UseProjectOperationsReturn => {
  // Use the unified hook for all operations
  const { create, update, archive, restore } =
    useFirestoreOperations('projects');
  const { deleteProject: cascadeDelete } = useCascadingSoftDelete();

  // Return with the expected function names
  return {
    createProject: create,
    updateProject: update,
    deleteProject: cascadeDelete, // Use cascading delete instead of simple remove
    archiveProject: archive,
    restoreProject: restore,
  };
};