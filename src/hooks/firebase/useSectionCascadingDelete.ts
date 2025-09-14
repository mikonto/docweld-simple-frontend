import {
  collection,
  query,
  where,
  getDocs,
  writeBatch,
  serverTimestamp,
  doc,
} from 'firebase/firestore';
import { db } from '@/config/firebase';
import { useApp } from '@/contexts/AppContext';
import { STATUS, COLLECTIONS } from '@/constants/firestore';

/**
 * Result from a section delete operation
 */
interface SectionDeleteResult {
  deletedCount: number;
}

/**
 * Return type for useSectionCascadingDelete hook
 */
interface UseSectionCascadingDeleteReturn {
  deleteProjectSection: (
    sectionId: string,
    projectId: string
  ) => Promise<SectionDeleteResult>;
  deleteLibrarySection: (
    sectionId: string,
    libraryId: string
  ) => Promise<SectionDeleteResult>;
}

/**
 * Hook for cascading soft deletes for document sections
 * When a section is deleted, all documents within it are also soft-deleted
 */
export function useSectionCascadingDelete(): UseSectionCascadingDeleteReturn {
  const { loggedInUser } = useApp();

  /**
   * Soft delete a project document section and all its documents
   * @param sectionId - The section ID to delete
   * @param projectId - The project ID (for efficient querying)
   */
  const deleteProjectSection = async (
    sectionId: string,
    projectId: string
  ): Promise<SectionDeleteResult> => {
    const batch = writeBatch(db);
    const timestamp = serverTimestamp();
    const deletedBy = loggedInUser?.uid || 'system';
    let documentCount = 0;

    // Delete the section itself
    const sectionRef = doc(
      db,
      COLLECTIONS.PROJECT_DOCUMENT_SECTIONS,
      sectionId
    );
    batch.update(sectionRef, {
      status: STATUS.DELETED,
      updatedAt: timestamp,
      updatedBy: deletedBy,
    });

    // Delete all documents in this section
    const documentsQuery = query(
      collection(db, COLLECTIONS.PROJECT_DOCUMENTS),
      where('projectId', '==', projectId),
      where('sectionId', '==', sectionId),
      where('status', '!=', STATUS.DELETED)
    );
    const documentsSnapshot = await getDocs(documentsQuery);
    documentsSnapshot.forEach((document) => {
      documentCount++;
      batch.update(document.ref, {
        status: STATUS.DELETED,
        updatedAt: timestamp,
        updatedBy: deletedBy,
      });
    });

    // Commit all deletes in a single batch
    await batch.commit();

    // Return count of deleted items (section + documents)
    return { deletedCount: 1 + documentCount };
  };

  /**
   * Soft delete a library document section and all its documents
   * @param sectionId - The section ID to delete
   * @param libraryId - The library ID (for efficient querying)
   */
  const deleteLibrarySection = async (
    sectionId: string,
    libraryId: string
  ): Promise<SectionDeleteResult> => {
    const batch = writeBatch(db);
    const timestamp = serverTimestamp();
    const deletedBy = loggedInUser?.uid || 'system';
    let documentCount = 0;

    // Delete the section itself
    const sectionRef = doc(
      db,
      COLLECTIONS.LIBRARY_DOCUMENT_SECTIONS,
      sectionId
    );
    batch.update(sectionRef, {
      status: STATUS.DELETED,
      updatedAt: timestamp,
      updatedBy: deletedBy,
    });

    // Delete all documents in this section
    const documentsQuery = query(
      collection(db, COLLECTIONS.LIBRARY_DOCUMENTS),
      where('libraryId', '==', libraryId),
      where('sectionId', '==', sectionId),
      where('status', '!=', STATUS.DELETED)
    );
    const documentsSnapshot = await getDocs(documentsQuery);
    documentsSnapshot.forEach((document) => {
      documentCount++;
      batch.update(document.ref, {
        status: STATUS.DELETED,
        updatedAt: timestamp,
        updatedBy: deletedBy,
      });
    });

    // Commit all deletes in a single batch
    await batch.commit();

    // Return count of deleted items (section + documents)
    return { deletedCount: 1 + documentCount };
  };

  return {
    deleteProjectSection,
    deleteLibrarySection,
  };
}
