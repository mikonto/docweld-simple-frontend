import { where } from 'firebase/firestore';
import { useFirestoreOperations } from '@/hooks/firebase/useFirestoreOperations';

/**
 * Hook to fetch participants for a specific project
 * @param {string} projectId - The project ID
 * @returns {[Object[], boolean, Error | undefined]} - Returns:
 *   - Array of participant documents
 *   - Loading state
 *   - Error if any
 */
export const useProjectParticipants = (projectId) => {
  // Use useFirestoreOperations with constraints for projectId
  const constraints = projectId ? [where('projectId', '==', projectId)] : [];

  const { documents, loading, error } = useFirestoreOperations(
    'project-participants',
    {
      constraints,
    }
  );

  // If no projectId, return empty results
  if (!projectId) {
    return [[], false, null];
  }

  return [documents, loading, error];
};

/**
 * Hook to create, update, and delete project participants
 * @returns {Object} Object containing participant operation functions
 */
export const useParticipantOperations = () => {
  // Use useFirestoreOperations for CRUD operations
  const { create, update, remove } = useFirestoreOperations(
    'project-participants'
  );

  /**
   * Add a new participant to a project
   * @param {string} projectId - The project ID
   * @param {Object} participantData - The participant data
   * @returns {Promise<string>} The ID of the created participant
   */
  const addParticipant = async (projectId, participantData) => {
    // Add projectId to the participant data
    const newParticipantData = {
      ...participantData,
      projectId, // Add foreign key to flat structure
    };

    return await create(newParticipantData);
  };

  /**
   * Update an existing participant
   * @param {string} participantId - The participant ID
   * @param {Object} updates - The fields to update
   */
  const updateParticipant = async (participantId, updates) => {
    return await update(participantId, updates);
  };

  /**
   * Remove a participant from a project
   * @param {string} participantId - The participant ID to remove
   */
  const removeParticipant = async (participantId) => {
    // Hard delete for participants
    return await remove(participantId, true);
  };

  return {
    addParticipant,
    updateParticipant,
    removeParticipant,
  };
};
