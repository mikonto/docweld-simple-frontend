import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import * as z from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Upload } from 'lucide-react';
import type { CompanyInformation } from '@/types/database';
import type { TFunction } from 'i18next';

// Create the schema inside the component to use translations
const createProfileSchema = (t: TFunction) =>
  z.object({
    companyName: z.string().min(1, t('company.companyNameRequired')),
    address: z.string().min(1, t('company.addressRequired')),
    contactPerson: z.string().min(1, t('company.contactPersonRequired')),
    contactEmail: z.string().email(t('company.invalidEmail')),
    contactPhone: z.string().min(1, t('company.phoneRequired')),
    website: z.string().optional(),
    // logoUrl is handled separately for upload
  });

// Default values for a new company profile
const defaultValues: Partial<CompanyInformation> = {
  companyName: '',
  address: '',
  contactPerson: '',
  contactEmail: '',
  contactPhone: '',
  website: '',
};

export interface CompanyProfileFormProps {
  companyInformation: CompanyInformation | null;
  isUploading: boolean;
  isSaving: boolean;
  logoPreview: string | null;
  handleLogoChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmit: (data: Partial<CompanyInformation>) => Promise<void>;
}

export function CompanyProfileForm({
  companyInformation,
  isUploading,
  isSaving,
  logoPreview,
  handleLogoChange,
  onSubmit,
}: CompanyProfileFormProps) {
  const { t } = useTranslation();

  type FormData = z.infer<ReturnType<typeof createProfileSchema>>;

  // Initialize form with react-hook-form and zod validation
  const form = useForm<FormData>({
    resolver: zodResolver(createProfileSchema(t)),
    defaultValues: companyInformation || defaultValues,
  });

  // Update form values when companyInformation changes
  useEffect(() => {
    if (companyInformation) {
      form.reset(companyInformation);
    }
  }, [companyInformation, form]);

  return (
    <Card>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Logo Upload Section */}
            <div className="flex items-center space-x-4 px-6 py-3">
              {/* Logo preview with better support for wide logos - no border or background */}
              <div className="h-20 w-40 flex-shrink-0 overflow-hidden flex items-center justify-center">
                {logoPreview ? (
                  <img
                    src={logoPreview}
                    alt={t('company.logo')}
                    className="max-h-full max-w-full object-contain"
                  />
                ) : (
                  <div className="text-xl font-semibold text-gray-300">
                    {companyInformation?.companyName
                      ?.substring(0, 2)
                      .toUpperCase() || 'LOGO'}
                  </div>
                )}
              </div>
              <div className="flex flex-col space-y-1">
                <Input
                  id="logo-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleLogoChange}
                  autoComplete="off"
                  className="hidden" // Hide default input
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => document.getElementById('logo-upload')?.click()}
                  disabled={isUploading}
                >
                  <Upload className="mr-2 h-4 w-4" />
                  {logoPreview
                    ? t('company.changeLogo')
                    : t('company.uploadLogo')}
                </Button>
              </div>
            </div>

            {/* Two-column layout */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Company Information Column */}
              <Card>
                <CardHeader>
                  <CardTitle>{t('company.companyInformation')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Company Name */}
                  <FormField
                    control={form.control}
                    name="companyName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('company.companyName')}</FormLabel>
                        <FormControl>
                          <Input
                            placeholder={t('company.enterCompanyName')}
                            autoComplete="off"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Address */}
                  <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('company.address')}</FormLabel>
                        <FormControl>
                          <Input
                            placeholder={t('company.enterAddress')}
                            autoComplete="off"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Website */}
                  <FormField
                    control={form.control}
                    name="website"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('company.website')}</FormLabel>
                        <FormControl>
                          <Input
                            type="text"
                            placeholder={t('company.enterWebsite')}
                            autoComplete="off"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* Contact Person Column */}
              <Card>
                <CardHeader>
                  <CardTitle>{t('company.contactPersonInformation')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Contact Person */}
                  <FormField
                    control={form.control}
                    name="contactPerson"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('company.contactPersonName')}</FormLabel>
                        <FormControl>
                          <Input
                            placeholder={t('company.enterContactName')}
                            autoComplete="off"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Contact Email */}
                  <FormField
                    control={form.control}
                    name="contactEmail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('company.contactEmail')}</FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            placeholder={t('company.enterContactEmail')}
                            autoComplete="off"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Contact Phone */}
                  <FormField
                    control={form.control}
                    name="contactPhone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('company.contactPhone')}</FormLabel>
                        <FormControl>
                          <Input
                            type="tel"
                            placeholder={t('company.enterContactPhone')}
                            autoComplete="off"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </div>

            <div className="flex justify-end">
              <Button
                type="submit"
                disabled={
                  isSaving || isUploading || form.formState.isSubmitting
                }
              >
                {isSaving || isUploading
                  ? t('company.saving')
                  : t('company.saveChanges')}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}