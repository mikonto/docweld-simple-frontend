import React from 'react';
import * as z from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import type { DocumentLibrary, DocumentLibraryFormData } from '@/types';

// Default values for a new document collection
const defaultValues = {
  name: '',
  description: '',
};

interface DocumentFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  document?: DocumentLibrary | null;
  onSubmit: (data: DocumentLibraryFormData) => Promise<void>;
}

// Document form dialog for creating and editing document collections
export function DocumentFormDialog({
  open,
  onOpenChange,
  document = null,
  onSubmit,
}: DocumentFormDialogProps) {
  const { t } = useTranslation();

  // Initialize form with either existing document data or default values
  const formSchema = z.object({
    name: z.string().min(1, t('validation.nameRequired')),
    description: z.string().optional(), // Made description optional
  });

  type FormData = z.infer<typeof formSchema>;

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: document || defaultValues,
  });

  // Reset form when dialog opens/closes or document changes
  React.useEffect(() => {
    if (open) {
      if (document) {
        // Extract only the fields we need from the document data
        const formData: FormData = {
          name: document.name || '',
          description: document.description || '',
        };
        form.reset(formData);
      } else {
        form.reset(defaultValues);
      }
    }
  }, [form, document, open]);

  // Handle form submission
  const handleSubmit = form.handleSubmit(async (data) => {
    try {
      await onSubmit(data);
      form.reset();
      onOpenChange(false);
      // Success toast is handled by useFirestoreOperations
    } catch {
      // Error is already logged by useFirestoreOperations, but we'll keep error handling here
      // for any additional error scenarios that might not be caught by the hook
    }
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {document
              ? t('documentLibrary.editCollection')
              : t('documentLibrary.addDocumentCollection')}
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('common.name')}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t('documentLibrary.enterCollectionName')}
                      autoComplete="off"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('common.description')}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t('documentLibrary.enterDescription')}
                      autoComplete="off"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                {t('common.cancel')}
              </Button>
              <Button type="submit">
                {document ? t('common.saveChanges') : t('common.addButton')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
