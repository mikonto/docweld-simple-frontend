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

// Default values for a new user
const defaultValues = {
  firstName: '',
  lastName: '',
  email: '',
  password: '',
  isAdmin: false,
};

// User form dialog for creating and editing user accounts
export function UserFormDialog({ open, onOpenChange, user = null, onSubmit }) {
  const { t } = useTranslation();

  // Initialize form with either existing user data or default values
  const formSchema = z.object({
    firstName: z.string().min(1, t('validation.firstNameRequired')),
    lastName: z.string().min(1, t('validation.lastNameRequired')),
    email: z.string().email(t('validation.invalidEmail')),
    password: user
      ? z.string().optional() // Password is optional when editing
      : z.string().min(6, t('validation.passwordMinLength', { min: 6 })), // Required for new users
    isAdmin: z.boolean().default(false),
  });

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: user
      ? {
          firstName: user.firstName || '',
          lastName: user.lastName || '',
          email: user.email || '',
          isAdmin: user.role === 'admin',
          password: '', // Ensure the password field is controlled
        }
      : defaultValues,
  });

  // Reset form when dialog opens/closes or user changes
  React.useEffect(() => {
    if (open) {
      if (user) {
        // For existing users, reset form and ensure password is not undefined
        form.reset({
          firstName: user.firstName || '',
          lastName: user.lastName || '',
          email: user.email || '',
          isAdmin: user.role === 'admin',
          password: '', // Explicitly set password to an empty string
        });
      } else {
        // For new users, reset to default values
        form.reset(defaultValues);
      }
    }
  }, [form, user, open]);

  // Handle form submission
  const handleSubmit = form.handleSubmit(async (data) => {
    try {
      // Transform form data to match API expectations
      const userData = {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        role: data.isAdmin ? 'admin' : 'user',
      };

      // Only include password for new users
      if (!user && data.password) {
        userData.password = data.password;
      }

      await onSubmit(userData);
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
            {user ? t('users.editUser') : t('users.addUser')}
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <FormField
              control={form.control}
              name="firstName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('users.firstName')}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t('users.enterFirstName')}
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
              name="lastName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('users.lastName')}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t('users.enterLastName')}
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
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('users.email')}</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder={t('users.enterEmail')}
                      autoComplete="off"
                      disabled={!!user} // Disable email field when editing
                      {...field}
                    />
                  </FormControl>
                  {user && (
                    <p className="text-sm text-muted-foreground">
                      {t('users.emailCannotBeChanged')}
                    </p>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            {!user && ( // Only show password field for new users
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('users.password')}</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder={t('users.enterPassword')}
                        autoComplete="off"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="isAdmin"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <FormLabel className="font-normal">
                    {t('users.grantAdminPrivileges')}
                  </FormLabel>
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
                {user ? t('common.saveChanges') : t('common.addButton')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
