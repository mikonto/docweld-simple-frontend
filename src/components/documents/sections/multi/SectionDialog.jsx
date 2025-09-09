import { useForm } from 'react-hook-form';
import { useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import PropTypes from 'prop-types';
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

const createFormSchema = (t) =>
  z.object({
    sectionName: z
      .string()
      .min(1, { message: t('documents.sectionNameRequired') }),
  });

export function SectionDialog({
  mode = 'add',
  section = null,
  open,
  onClose,
  onSubmit,
}) {
  const { t } = useTranslation();

  // Initialize the form with React Hook Form and Zod validation
  const form = useForm({
    resolver: zodResolver(createFormSchema(t)),
    defaultValues: {
      sectionName: section ? section.name : '',
    },
  });

  // Update form values when section changes
  useEffect(() => {
    if (section && mode === 'edit') {
      form.reset({
        sectionName: section.name,
      });
    } else if (mode === 'add') {
      form.reset({
        sectionName: '',
      });
    }
  }, [section, form, mode, open]);

  // Reset form when dialog opens with new values
  const handleDialogOpenChange = (newOpen) => {
    if (!newOpen) {
      onClose();
    }
  };

  // Handle form submission
  const handleSubmit = form.handleSubmit(async (values) => {
    try {
      await onSubmit(values.sectionName);
      form.reset({ sectionName: '' });
    } catch {
      // Error handling is delegated to the parent component
    }
  });

  const isEdit = mode === 'edit';

  return (
    <Dialog open={open} onOpenChange={handleDialogOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? t('documents.editSection') : t('documents.addNewSection')}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <FormField
              control={form.control}
              name="sectionName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('documents.sectionName')}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t('documents.enterSectionName')}
                      autoComplete="off"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                {t('common.cancel')}
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {isEdit ? t('common.saveChanges') : t('common.addButton')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

SectionDialog.propTypes = {
  mode: PropTypes.oneOf(['add', 'edit']),
  section: PropTypes.shape({
    id: PropTypes.string,
    name: PropTypes.string,
  }),
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
};
