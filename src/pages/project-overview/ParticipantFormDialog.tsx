import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import * as z from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

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
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useUsers } from '@/hooks/useUsers';
import type { ProjectParticipant } from '@/types';

interface ParticipantFormData {
  userId: string;
  participatingAs: string[];
}

interface ParticipantFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  participant?: ProjectParticipant | null;
  onSubmit: (data: ParticipantFormData) => Promise<void>;
}

// Default values for a new participant
const defaultValues: ParticipantFormData = {
  userId: '',
  participatingAs: [],
};

export function ParticipantFormDialog({
  open,
  onOpenChange,
  participant = null,
  onSubmit,
}: ParticipantFormDialogProps) {
  const { t } = useTranslation();
  const [users, usersLoading] = useUsers('active');

  // List of possible participant roles
  const participantRoles = [
    { id: 'viewer', label: t('projects.roles.viewer') },
    { id: 'projectLeader', label: t('projects.roles.projectLeader') },
    { id: 'weldingCoordinator', label: t('projects.roles.weldingCoordinator') },
    {
      id: 'responsibleWeldingCoordinator',
      label: t('projects.roles.responsibleWeldingCoordinator'),
    },
    { id: 'welder', label: t('projects.roles.welder') },
    {
      id: 'heatTreatmentOperator',
      label: t('projects.roles.heatTreatmentOperator'),
    },
    { id: 'ndtOperator', label: t('projects.roles.ndtOperator') },
  ];

  // Form schema using zod
  const formSchema = z.object({
    userId: z.string().min(1, t('validation.userRequired')),
    participatingAs: z.array(z.string()).min(1, t('validation.roleRequired')),
  });

  const form = useForm<ParticipantFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: participant
      ? {
          userId: participant.userId || '',
          participatingAs: participant.participatingAs || [],
        }
      : defaultValues,
  });

  // Reset form when dialog opens/closes or participant changes
  useEffect(() => {
    if (open) {
      if (participant) {
        const formData: ParticipantFormData = {
          userId: participant.userId || '',
          participatingAs: participant.participatingAs || [],
        };
        form.reset(formData);
      } else {
        form.reset(defaultValues);
      }
    }
  }, [form, participant, open]);

  // Handle form submission
  const handleSubmit = form.handleSubmit(async (data) => {
    try {
      // Find the selected user's info
      const selectedUser = users.find((user) => user.id === data.userId);

      if (!selectedUser) {
        throw new Error(t('errors.userNotFound'));
      }

      // Transform form data to match expected format
      // Only store userId to avoid data denormalization
      const participantData: ParticipantFormData = {
        userId: selectedUser.id,
        participatingAs: data.participatingAs,
      };

      await onSubmit(participantData);
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
            {participant
              ? t('projects.editParticipant')
              : t('projects.addParticipant')}
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <FormField
              control={form.control}
              name="userId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('projects.user')}</FormLabel>
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={!!participant || usersLoading} // Disable when editing
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t('projects.selectUser')} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectGroup>
                        {users.map((user) => (
                          <SelectItem key={user.id} value={user.id}>
                            {user.firstName} {user.lastName}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="participatingAs"
              render={() => (
                <FormItem>
                  <div className="mb-4">
                    <FormLabel>{t('projects.participatingAs')}</FormLabel>
                  </div>
                  <div className="grid gap-2">
                    {participantRoles.map((role) => (
                      <FormField
                        key={role.id}
                        control={form.control}
                        name="participatingAs"
                        render={({ field }) => {
                          return (
                            <FormItem
                              key={role.id}
                              className="flex flex-row items-start space-x-3 space-y-0"
                            >
                              <FormControl>
                                <Checkbox
                                  checked={field.value?.includes(role.id)}
                                  onCheckedChange={(checked) => {
                                    return checked
                                      ? field.onChange([
                                          ...field.value,
                                          role.id,
                                        ])
                                      : field.onChange(
                                          field.value?.filter(
                                            (value) => value !== role.id
                                          )
                                        );
                                  }}
                                />
                              </FormControl>
                              <FormLabel className="font-normal">
                                {role.label}
                              </FormLabel>
                            </FormItem>
                          );
                        }}
                      />
                    ))}
                  </div>
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
                {participant ? t('common.saveChanges') : t('common.addButton')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
