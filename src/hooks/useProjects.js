import { useDocument } from 'react-firebase-hooks/firestore';
import { doc, where } from 'firebase/firestore';

import { db } from '@/config/firebase';
import { useFirestoreOperations } from '@/hooks/firebase/useFirestoreOperations';
import { useCascadingSoftDelete } from '@/hooks/firebase/useCascadingSoftDelete';

// Collection of hooks for interacting with projects in Firestore

// Hook to fetch a single project's Firestore document
export const useProject = (projectId) => {
  const [snapshot, loading, error] = useDocument(
    projectId ? doc(db, 'projects', projectId) : null
  );

  const project = snapshot?.exists()
    ? { id: snapshot.id, ...snapshot.data() }
    : null;

  return [project, loading, error];
};

// Hook to fetch multiple projects with optional status filtering
export const useProjects = (status) => {
  // Build constraints based on status filter
  const constraints = status ? [where('status', '==', status)] : [];

  // Use the unified hook to fetch projects
  const { documents, loading, error } = useFirestoreOperations('projects', {
    constraints,
  });

  // Return in the expected format [projects, loading, error]
  return [documents, loading, error];
};

// Hook to create, update, delete, archive, and restore projects
export const useProjectOperations = () => {
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
