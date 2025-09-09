/**
 * MIGRATION NOTES - Explicit ID Field Migration
 *
 * This hook has been migrated to use useFirestoreOperations:
 * ✅ Uses useFirestoreOperations for all CRUD operations
 * ✅ Automatically handles explicit ID field when creating documents
 * ✅ Provides consistent error handling and toast notifications
 * ✅ Uses useUploadFile hook for file uploads
 *
 * Still uses direct SDK for:
 * - getDownloadURL in async upload handler (hooks can't be called in async functions)
 *
 * The company document will now have an explicit id: "company" field.
 */

import { useFirestoreOperations } from '@/hooks/firebase/useFirestoreOperations';
import { useState } from 'react';
import { ref, getDownloadURL } from 'firebase/storage';
import { useUploadFile } from 'react-firebase-hooks/storage';
import { storage } from '@/config/firebase';
import { useApp } from '@/contexts/AppContext';
import { sanitizeFileName } from '@/utils/sanitizeFileName';

const COMPANY_ID = 'company'; // Single document ID for company information

/**
 * Custom hook for fetching and managing company information
 * @returns {Object} Object containing company data and operations
 */
export const useCompanyInformation = () => {
  const { loggedInUser } = useApp();
  const [isUploading, setIsUploading] = useState(false);

  // Initialize useUploadFile hook
  const [uploadFile, uploading, , uploadError] = useUploadFile();

  // Use useFirestoreOperations for the company collection
  const { documents, loading, error, update, create } =
    useFirestoreOperations('company');

  // Since we're dealing with a singleton document, get the first (and only) document
  const companyData = documents && documents.length > 0 ? documents[0] : null;

  // Transform the document data for component use
  const companyInformation = companyData
    ? {
        id: companyData.id || COMPANY_ID,
        companyName: companyData.companyName || '',
        address: companyData.companyAddress || '',
        website: companyData.companyWebsite || '',
        contactPerson: companyData.contactPersonName || '',
        contactEmail: companyData.contactPersonEmail || '',
        contactPhone: companyData.contactPersonPhone || '',
        logoUrl: companyData.logoUrl || '',
        createdAt: companyData.createdAt,
        updatedAt: companyData.updatedAt,
      }
    : null;

  /**
   * Update company information in Firestore
   * @param {Object} data - Form data to update
   * @returns {Promise<void>}
   */
  const updateCompanyInformation = async (data) => {
    if (!loggedInUser) {
      throw new Error('User must be logged in to update company information');
    }

    // Map form fields to Firestore document fields
    const firestoreData = {
      companyName: data.companyName,
      companyAddress: data.address,
      companyWebsite: data.website || '',
      contactPersonName: data.contactPerson,
      contactPersonEmail: data.contactEmail,
      contactPersonPhone: data.contactPhone,
    };

    // Check if document exists
    if (companyData) {
      // Update existing document
      await update(COMPANY_ID, firestoreData);
    } else {
      // Create new document with explicit ID
      // Note: useFirestoreOperations.create already adds the id field
      await create({
        ...firestoreData,
        id: COMPANY_ID, // This will be overridden by create(), but included for clarity
      });
    }
  };

  /**
   * Upload company logo to Firebase Storage
   * @param {File} file - The logo file to upload
   * @returns {Promise<string>} The URL of the uploaded logo
   */
  const uploadCompanyLogo = async (file) => {
    if (!file) return null;
    if (!loggedInUser) {
      throw new Error('User must be logged in to upload logo');
    }

    setIsUploading(true);

    try {
      // Sanitize the filename
      const sanitizedFilename = sanitizeFileName(file.name);

      // Create a reference to the file location in Firebase Storage
      const storageRef = ref(storage, `company/${sanitizedFilename}`);

      // Upload the file using the hook
      const result = await uploadFile(storageRef, file);

      if (!result) {
        throw new Error('Upload failed');
      }

      // NOTE: We cannot use useFileUrl hook here because hooks cannot be called
      // inside callbacks or async functions. This is a limitation of React hooks.
      // For now, we'll keep using getDownloadURL directly for upload operations.
      const downloadURL = await getDownloadURL(result.ref);

      // Update the company document with the new logo URL
      await update(COMPANY_ID, {
        logoUrl: downloadURL,
      });

      return downloadURL;
    } finally {
      setIsUploading(false);
    }
  };

  return {
    companyInformation,
    loading,
    error: error || uploadError,
    updateCompanyInformation,
    uploadCompanyLogo,
    isUploading: isUploading || uploading,
  };
};
