import { where, QueryConstraint, FirestoreError } from 'firebase/firestore';
import { useFirestoreOperations } from '@/hooks/firebase/useFirestoreOperations';
import type { ProjectParticipant, ProjectParticipantFormData } from '@/types';

/**
 * Return type for useParticipantOperations hook
 */
interface UseParticipantOperationsReturn {
  addParticipant: (
    projectId: string,
    participantData: ProjectParticipantFormData
  ) => Promise<string>;
  updateParticipant: (
    participantId: string,
    updates: Partial<ProjectParticipant>
  ) => Promise<void>;
  removeParticipant: (participantId: string) => Promise<void>;
}

/**
 * Hook to fetch participants for a specific project
 * @param projectId - The project ID
 * @returns Returns:
 *   - Array of participant documents
 *   - Loading state
 *   - Error if any
 */
export const useProjectParticipants = (
  projectId?: string | null
): [ProjectParticipant[], boolean, FirestoreError | undefined] => {
  // Use useFirestoreOperations with constraints for projectId
  const constraints: QueryConstraint[] = projectId
    ? [where('projectId', '==', projectId)]
    : [];

  const { documents, loading, error } = useFirestoreOperations(
    'project-participants',
    {
      constraints,
    }
  );

  // If no projectId, return empty results
  if (!projectId) {
    return [[], false, undefined];
  }

  return [documents as ProjectParticipant[], loading, error];
};

/**
 * Hook to create, update, and delete project participants
 * @returns Object containing participant operation functions
 */
export const useParticipantOperations = (): UseParticipantOperationsReturn => {
  // Use useFirestoreOperations for CRUD operations
  const { create, update, remove } = useFirestoreOperations(
    'project-participants'
  );

  /**
   * Add a new participant to a project
   * @param projectId - The project ID
   * @param participantData - The participant data
   * @returns The ID of the created participant
   */
  const addParticipant = async (
    projectId: string,
    participantData: ProjectParticipantFormData
  ): Promise<string> => {
    // Add projectId to the participant data
    const newParticipantData = {
      ...participantData,
      projectId, // Add foreign key to flat structure
    };

    return await create(newParticipantData);
  };

  /**
   * Update an existing participant
   * @param participantId - The participant ID
   * @param updates - The fields to update
   */
  const updateParticipant = async (
    participantId: string,
    updates: Partial<ProjectParticipant>
  ): Promise<void> => {
    return await update(participantId, updates);
  };

  /**
   * Remove a participant from a project
   * @param participantId - The participant ID to remove
   */
  const removeParticipant = async (participantId: string): Promise<void> => {
    // Hard delete for participants
    return await remove(participantId, true);
  };

  return {
    addParticipant,
    updateParticipant,
    removeParticipant,
  };
};
