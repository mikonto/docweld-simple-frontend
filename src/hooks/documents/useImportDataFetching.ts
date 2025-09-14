import { useEffect, Dispatch } from 'react';
import {
  collection,
  query,
  where,
  getDocs,
  Query,
  DocumentData as FirestoreDocumentData,
} from 'firebase/firestore';
import { ref, getDownloadURL } from 'firebase/storage';
import { db, storage } from '@/config/firebase';
import { ACTIONS, BrowserState, BrowserAction } from './useImportBrowser';
import type { FirestoreSection, FirestoreDocument } from '@/types/database';

// Type aliases for import browser context
type CollectionData = { id: string; name: string; [key: string]: unknown };
type SectionData = FirestoreSection;
type DocumentData = FirestoreDocument;

/**
 * Hook for managing data fetching in the import browser
 * @param state - Current browser state
 * @param dispatch - Dispatch function for state updates
 * @param sourceType - Source type ('documentLibrary' or 'projectLibrary')
 * @param projectId - Project ID for project library source
 */
export default function useImportDataFetching(
  state: BrowserState,
  dispatch: Dispatch<BrowserAction>,
  sourceType: 'documentLibrary' | 'projectLibrary',
  projectId: string | null
): void {
  const { currentView, selectedCollection, selectedSection } = state;

  // Fetch collections - only for document library
  useEffect(() => {
    // Only fetch collections for document library and when in collections view
    if (sourceType === 'documentLibrary' && currentView === 'collections') {
      const fetchCollections = async () => {
        dispatch({ type: ACTIONS.SET_LOADING, payload: true });
        try {
          // Get document collections with document counts
          const collectionsQuery = query(collection(db, 'document-library'));
          const snapshot = await getDocs(collectionsQuery);

          const collectionsData = await Promise.all(
            snapshot.docs.map(async (docSnap) => {
              const collectionData: CollectionData = {
                id: docSnap.id,
                ...docSnap.data(),
              } as CollectionData;

              // Fetch section and document count for each collection
              const sectionsQuery = query(
                collection(db, 'library-document-sections'),
                where('libraryId', '==', docSnap.id)
              );

              const sectionsSnapshot = await getDocs(sectionsQuery);
              const sectionIds = sectionsSnapshot.docs.map((doc) => doc.id);

              // Count documents across all sections
              let documentCount = 0;
              if (sectionIds.length > 0) {
                const documentsQuery = query(
                  collection(db, 'library-documents'),
                  where('sectionId', 'in', sectionIds)
                );
                const documentsSnapshot = await getDocs(documentsQuery);
                documentCount = documentsSnapshot.size;
              }

              return {
                ...collectionData,
                sectionCount: sectionsSnapshot.size,
                documentCount,
              };
            })
          );

          dispatch({ type: ACTIONS.SET_COLLECTIONS, payload: collectionsData });
        } catch {
          // Silent fail on fetching collections
        } finally {
          dispatch({ type: ACTIONS.SET_LOADING, payload: false });
        }
      };

      fetchCollections();
    } else if (
      sourceType === 'projectLibrary' &&
      currentView === 'collections'
    ) {
      // For project library, no need to fetch collections, but need to reset sections
      dispatch({ type: ACTIONS.SET_SECTIONS, payload: [] });
      dispatch({ type: ACTIONS.SET_LOADING, payload: false });
    }
  }, [sourceType, currentView, dispatch]);

  // Fetch sections when a collection is selected
  useEffect(() => {
    // Only fetch sections when we have a selected collection and we're in sections view
    if (selectedCollection && currentView === 'sections') {
      const fetchSections = async () => {
        dispatch({ type: ACTIONS.SET_LOADING, payload: true });
        try {
          let sectionsQuery: Query<FirestoreDocumentData> | null = null;

          if (sourceType === 'documentLibrary') {
            // Fetch sections for selected collection
            sectionsQuery = query(
              collection(db, 'library-document-sections'),
              where('libraryId', '==', selectedCollection.id)
            );
          } else if (sourceType === 'projectLibrary' && projectId) {
            // Fetch sections for the project
            sectionsQuery = query(
              collection(db, 'project-document-sections'),
              where('projectId', '==', projectId)
            );
          }

          if (sectionsQuery) {
            const snapshot = await getDocs(sectionsQuery);

            const sectionsData = await Promise.all(
              snapshot.docs.map(async (docSnap) => {
                const sectionData: SectionData = {
                  id: docSnap.id,
                  ...docSnap.data(),
                } as SectionData;

                // Count documents in this section
                const documentsQuery = query(
                  collection(
                    db,
                    sourceType === 'documentLibrary'
                      ? 'library-documents'
                      : 'project-documents'
                  ),
                  where('sectionId', '==', docSnap.id)
                );
                const documentsSnapshot = await getDocs(documentsQuery);

                return {
                  ...sectionData,
                  documentCount: documentsSnapshot.size,
                };
              })
            );

            dispatch({ type: ACTIONS.SET_SECTIONS, payload: sectionsData });
          }
        } catch {
          // Silent fail on fetching sections
        } finally {
          dispatch({ type: ACTIONS.SET_LOADING, payload: false });
        }
      };

      fetchSections();
    }
  }, [selectedCollection, currentView, sourceType, projectId, dispatch]);

  // Fetch documents when a section is selected
  useEffect(() => {
    // Only fetch documents when we have a selected section and we're in documents view
    if (selectedSection && currentView === 'documents') {
      const fetchDocuments = async () => {
        dispatch({ type: ACTIONS.SET_LOADING, payload: true });
        try {
          let documentsQuery: Query<FirestoreDocumentData> | null = null;

          if (sourceType === 'documentLibrary') {
            // Fetch documents for selected section
            documentsQuery = query(
              collection(db, 'library-documents'),
              where('sectionId', '==', selectedSection.id)
            );
          } else if (sourceType === 'projectLibrary') {
            // Fetch documents for selected project section
            documentsQuery = query(
              collection(db, 'project-documents'),
              where('sectionId', '==', selectedSection.id)
            );
          }

          if (documentsQuery) {
            const snapshot = await getDocs(documentsQuery);
            const documentsData: DocumentData[] = snapshot.docs.map(
              (doc) =>
                ({
                  id: doc.id,
                  ...doc.data(),
                }) as DocumentData
            );

            dispatch({ type: ACTIONS.SET_DOCUMENTS, payload: documentsData });

            // Fetch thumbnails in parallel
            const thumbnailPromises = documentsData.map(async (doc) => {
              if (doc.thumbStorageRef) {
                try {
                  const url = await getDownloadURL(
                    ref(storage, doc.thumbStorageRef)
                  );
                  return { id: doc.id, url };
                } catch {
                  return null;
                }
              }
              return null;
            });

            const thumbnailResults = await Promise.all(thumbnailPromises);
            const thumbnailMap: Record<string, string> = {};
            thumbnailResults.forEach((result) => {
              if (result) {
                thumbnailMap[result.id] = result.url;
              }
            });

            dispatch({ type: ACTIONS.SET_THUMBNAILS, payload: thumbnailMap });
          }
        } catch {
          // Silent fail on fetching documents
        } finally {
          dispatch({ type: ACTIONS.SET_LOADING, payload: false });
        }
      };

      fetchDocuments();
    }
  }, [selectedSection, currentView, sourceType, dispatch]);
}
