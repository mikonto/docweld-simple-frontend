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
import { Checkbox } from '@/components/ui/checkbox';

// Default values for a new project
const defaultValues = {
  projectName: '',
  projectNumber: '',
  customer: '',
  externalReference: '',
  description: '',
  parentMaterialTraceable: false,
  fillerMaterialTraceable: false,
};

// Project form dialog for creating and editing projects
export function ProjectFormDialog({
  open,
  onOpenChange,
  project = null,
  onSubmit,
}) {
  const { t } = useTranslation();

  // Initialize form with either existing project data or default values
  const formSchema = z.object({
    projectName: z.string().min(1, t('validation.required')),
    projectNumber: z.string().min(1, t('validation.required')),
    customer: z.string().min(1, t('validation.required')),
    externalReference: z.string().optional(),
    description: z.string().optional(),
    parentMaterialTraceable: z.boolean().default(false),
    fillerMaterialTraceable: z.boolean().default(false),
  });

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: project || defaultValues,
  });

  // Reset form when dialog opens/closes or project changes
  React.useEffect(() => {
    if (open) {
      if (project) {
        // Extract only the fields we need from the project data
        const formData = {
          projectName: project.projectName || '',
          projectNumber: project.projectNumber || '',
          customer: project.customer || '',
          externalReference: project.externalReference || '',
          description: project.description || '',
          parentMaterialTraceable: project.parentMaterialTraceable || false,
          fillerMaterialTraceable: project.fillerMaterialTraceable || false,
        };
        form.reset(formData);
      } else {
        form.reset(defaultValues);
      }
    }
  }, [form, project, open]);

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
            {project ? t('projects.editProject') : t('projects.addProject')}
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <FormField
              control={form.control}
              name="projectName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('common.name')}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t('projects.enterProjectName')}
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
              name="projectNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('projects.projectNumber')}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t('projects.enterProjectNumber')}
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
              name="customer"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('projects.customer')}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t('projects.enterCustomer')}
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
              name="externalReference"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('projects.externalReference')}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t('projects.enterExternalReference')}
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
                      placeholder={t('projects.enterDescription')}
                      autoComplete="off"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-4">
              <FormField
                control={form.control}
                name="parentMaterialTraceable"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <FormLabel className="font-normal">
                      {t('projects.parentMaterialTraceable')}
                    </FormLabel>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="fillerMaterialTraceable"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <FormLabel className="font-normal">
                      {t('projects.fillerMaterialTraceable')}
                    </FormLabel>
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                {t('common.cancel')}
              </Button>
              <Button type="submit">
                {project ? t('common.saveChanges') : t('common.addButton')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
