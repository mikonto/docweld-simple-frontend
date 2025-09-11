// src/hooks/documents/useSectionData.ts
import { useMemo } from 'react';
import { useCollectionData } from 'react-firebase-hooks/firestore';
import { collection, query, where, orderBy, Query, DocumentData, FirestoreError } from 'firebase/firestore';
import { db } from '@/config/firebase';

export interface UseSectionDataReturn {
  sections: DocumentData[];
  loading: boolean;
  error: FirestoreError | undefined;
}

/**
 * Hook for fetching sections from collections with foreign key filtering
 */
export function useSectionData(
  collectionName: string | null,
  foreignKeys: Record<string, string | null> = {}
): UseSectionDataReturn {
  // Memoize foreignKeys to prevent re-renders due to object reference changes
  const serializedForeignKeys = JSON.stringify(foreignKeys);

  const sectionQuery = useMemo<Query<DocumentData> | null>(() => {
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

  return { sections: sections || [], loading: loading ?? false, error };
}