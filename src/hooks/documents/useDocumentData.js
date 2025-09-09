// src/hooks/documents/useDocumentData.js
import { useMemo } from 'react';
import { collection, query, where, orderBy } from 'firebase/firestore';
import { useCollectionData } from 'react-firebase-hooks/firestore';
import { db } from '@/config/firebase';

/**
 * Hook for fetching documents from collections with foreign key filtering
 * @param {string} collectionName - Name of the collection
 * @param {object} foreignKeys - Foreign key values for filtering
 * @param {object} options - Additional options
 * @returns {object} Documents data and loading state
 */
export function useDocumentData(collectionName, foreignKeys) {
  // Build query with foreign key constraints
  const documentQuery = useMemo(() => {
    if (!collectionName) return null;

    // Check if any required foreign key is null/undefined
    const hasMissingKeys = Object.values(foreignKeys).some(
      (value) => value === null || value === undefined
    );
    if (hasMissingKeys) {
      // Don't create query if foreign keys are missing
      return null;
    }

    try {
      let q = collection(db, collectionName);
      const constraints = [];

      // Add foreign key filters
      Object.entries(foreignKeys).forEach(([key, value]) => {
        if (value) constraints.push(where(key, '==', value));
      });

      // Filter for active documents only (simpler query that doesn't need composite index)
      constraints.push(where('status', '==', 'active'));

      // Sort by order field (descending to show newest/highest order first)
      // Documents with higher order values appear first
      constraints.push(orderBy('order', 'desc'));

      return query(q, ...constraints);
    } catch {
      return null;
    }
  }, [collectionName, foreignKeys]);

  // Use react-firebase-hooks for real-time data
  const [documents = [], loading, error] = useCollectionData(documentQuery, {
    idField: 'id', // Add id field to match Firestore document ID convention
  });

  // Add warning if any documents are missing id field
  if (documents && documents.length > 0) {
    documents.forEach((doc) => {
      if (!doc.id) {
        // Document is missing 'id' field
      }
    });
  }

  return {
    documents,
    loading: loading ?? !collectionName,
    error,
  };
}
