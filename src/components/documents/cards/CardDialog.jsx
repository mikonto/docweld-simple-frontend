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
    title: z.string().min(1, { message: t('documents.documentTitleRequired') }),
  });

export function CardDialog({
  document = null,
  open,
  onClose,
  onSubmit,
  title,
  dialogTitle,
}) {
  const { t } = useTranslation();

  // Create the validation schema with translations
  const formSchema = createFormSchema(t);

  // Initialize the form with React Hook Form and Zod validation
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: document ? document.title : title || '',
    },
  });

  // Update form values when document changes
  useEffect(() => {
    if (document) {
      form.reset({
        title: document.title,
      });
    } else if (title) {
      form.reset({
        title,
      });
    }
  }, [document, title, form]);

  // Reset form when dialog opens with new values
  const handleDialogOpenChange = (newOpen) => {
    if (!newOpen) {
      onClose();
    }
  };

  // Handle form submission
  const handleSubmit = form.handleSubmit(async (values) => {
    try {
      await onSubmit(values.title);
      form.reset({ title: '' });
    } catch {
      // Error handling is delegated to the parent component
    }
  });

  return (
    <Dialog open={open} onOpenChange={handleDialogOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {dialogTitle || t('documents.editDocument')}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('documents.documentTitle')}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t('documents.enterDocumentTitle')}
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
                {t('common.saveChanges')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

CardDialog.propTypes = {
  document: PropTypes.shape({
    id: PropTypes.string,
    title: PropTypes.string,
  }),
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  title: PropTypes.string,
  dialogTitle: PropTypes.string,
};
