// src/hooks/documents/useSectionData.js
import { useMemo } from 'react';
import { useCollectionData } from 'react-firebase-hooks/firestore';
import { collection, query, where, orderBy } from 'firebase/firestore';
import { db } from '@/config/firebase';

/**
 * Hook for fetching sections from collections with foreign key filtering
 * @param {string} collectionName - Name of the sections collection
 * @param {object} foreignKeys - Foreign key values for filtering
 * @returns {object} Sections data and loading state
 */
export function useSectionData(collectionName, foreignKeys = {}) {
  // Memoize foreignKeys to prevent re-renders due to object reference changes
  const serializedForeignKeys = JSON.stringify(foreignKeys);

  const sectionQuery = useMemo(() => {
    if (!collectionName) {
      return null;
    }

    const constraints = [
      ...Object.entries(foreignKeys)
        .filter(([, value]) => value)
        .map(([key, value]) => where(key, '==', value)),
      where('status', '==', 'active'),
      orderBy('order', 'asc'),
    ];

    return query(collection(db, collectionName), ...constraints);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [collectionName, serializedForeignKeys]);

  const [sections, loading, error] = useCollectionData(sectionQuery, {
    idField: 'id',
  });

  return { sections: sections || [], loading, error };
}
