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

// Default values for a new weld log
const defaultValues = {
  name: '',
  description: '',
};

export function WeldLogFormDialog({
  open,
  onOpenChange,
  weldLog = null,
  onSubmit,
}) {
  const { t } = useTranslation();

  // Initialize form with either existing weld log data or default values
  const formSchema = z.object({
    name: z.string().min(1, t('validation.nameRequired')),
    description: z.string().optional(),
  });

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: weldLog || defaultValues,
  });

  // Reset form when dialog opens/closes or weld log changes
  React.useEffect(() => {
    if (open) {
      if (weldLog) {
        // Extract only the fields we need from the weld log data
        const formData = {
          name: weldLog.name || '',
          description: weldLog.description || '',
        };
        form.reset(formData);
      } else {
        form.reset(defaultValues);
      }
    }
  }, [form, weldLog, open]);

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
            {weldLog ? t('weldLogs.editWeldLog') : t('weldLogs.addWeldLog')}
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('weldLogs.name')}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t('weldLogs.enterWeldLogName')}
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
                      placeholder={t('weldLogs.enterDescription')}
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
                {weldLog ? t('common.saveChanges') : t('common.addButton')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
