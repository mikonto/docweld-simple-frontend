import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { useCompanyInformation } from '@/hooks/useCompanyInformation';
import { CompanyProfileForm } from './CompanyProfileForm';
import PageHeader from '@/components/layouts/PageHeader';
import { ErrorLoadingWrapper } from '@/components/shared/ErrorLoadingWrapper';

export default function CompanyProfile() {
  const { t } = useTranslation();

  // Get company information and operations from hook
  const {
    companyInformation,
    loading,
    error,
    updateCompanyInformation,
    uploadCompanyLogo,
    isUploading,
  } = useCompanyInformation();

  // State for logo file handling
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  // Initialize logo preview from company data
  useEffect(() => {
    if (companyInformation?.logoUrl) {
      setLogoPreview(companyInformation.logoUrl);
    }
  }, [companyInformation?.logoUrl]);

  // Handle logo file selection and validation
  const handleLogoChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Validate file size (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        toast.error(t('company.logoSizeError'));
        return;
      }

      setLogoFile(file);

      // Create a preview URL for the selected file
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle form submission with logo upload
  const handleSubmit = async (data) => {
    try {
      setIsSaving(true);

      // Upload logo if a new one was selected
      if (logoFile) {
        try {
          await uploadCompanyLogo(logoFile);
          // Logo URL is automatically updated in Firestore by the hook
        } catch (uploadError) {
          toast.error(
            `${t('company.logoUploadError')}: ${uploadError.message || t('errors.unknownError')}`
          );
          // Continue with other updates even if logo upload fails
        }
      }

      // Update the company information (toasts are shown by useFirestoreOperations)
      await updateCompanyInformation(data);

      // Reset logo file state after successful update
      setLogoFile(null);
    } catch {
      // Error toast is already shown by useFirestoreOperations
      // Only re-throw if needed for other error handling
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title={t('company.title')} />

      <ErrorLoadingWrapper
        error={error}
        loading={loading}
        resourceName={t('navigation.companyProfile').toLowerCase()}
      >
        <CompanyProfileForm
          companyInformation={companyInformation}
          isUploading={isUploading}
          isSaving={isSaving}
          logoPreview={logoPreview}
          handleLogoChange={handleLogoChange}
          onSubmit={handleSubmit}
        />
      </ErrorLoadingWrapper>
    </div>
  );
}
