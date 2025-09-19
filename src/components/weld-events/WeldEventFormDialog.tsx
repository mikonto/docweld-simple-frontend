import type { JSX } from 'react';
import { useEffect, useMemo } from 'react';
import { Timestamp } from 'firebase/firestore';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { enUS, da } from 'date-fns/locale';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DateTimePickerSimple } from '@/components/ui/custom/date-time-picker';
import type { CreateWeldEventInput, WeldEventType } from '@/types/models/welding';

interface PerformerOption {
  value: string;
  label: string;
}

interface WeldEventFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  weldId: string;
  weldLogId: string;
  projectId: string;
  selectedEventType: WeldEventType;
  allowPerformerSelection: boolean;
  performerOptions: PerformerOption[];
  defaultPerformerId: string | null;
  currentUserId: string | null;
  currentUserName: string;
  onSubmit: (input: CreateWeldEventInput) => Promise<void>;
  isSubmitting: boolean;
}

interface WeldEventFormValues {
  comment: string;
  doneAt: Date;
  performerId: string;
  inspectionResult?: 'approved' | 'rejected';
}

const DIALOG_TITLE_KEYS: Record<WeldEventType, string> = {
  weld: 'weldEvents.dialogTitles.weld',
  'visual-inspection': 'weldEvents.dialogTitles.visual-inspection',
  'heat-treatment': 'weldEvents.dialogTitles.heat-treatment',
  comment: 'weldEvents.dialogTitles.comment',
};

export function WeldEventFormDialog({
  open,
  onOpenChange,
  weldId,
  weldLogId,
  projectId,
  selectedEventType,
  allowPerformerSelection,
  performerOptions,
  defaultPerformerId,
  currentUserId,
  currentUserName,
  onSubmit,
  isSubmitting,
}: WeldEventFormDialogProps): JSX.Element {
  const { t, i18n } = useTranslation();

  // Get the correct locale for date-fns based on current language
  const dateLocale = useMemo(() => {
    if (i18n.language === 'da') {
      return da;
    }
    return enUS;
  }, [i18n.language]);

  const schema = useMemo(
    () =>
      z.object({
        comment: selectedEventType === 'comment'
          ? z.string().min(1, t('weldEvents.validation.commentRequired'))
          : z.string().optional(),
        doneAt: z.date({
          errorMap: () => ({ message: t('weldEvents.validation.doneAtRequired') }),
        }),
        performerId: z
          .string()
          .min(1, t('weldEvents.validation.performerRequired')),
        inspectionResult: selectedEventType === 'visual-inspection'
          ? z.enum(['approved', 'rejected'])
          : z.enum(['approved', 'rejected']).optional(),
      }),
    [t, selectedEventType]
  );

  const normalizedOptions = useMemo(
    () => performerOptions ?? [],
    [performerOptions]
  );

  const computedDefaultPerformerId = useMemo(() => {
    if (allowPerformerSelection) {
      return (
        defaultPerformerId || normalizedOptions[0]?.value || currentUserId || ''
      );
    }
    return currentUserId || '';
  }, [
    allowPerformerSelection,
    defaultPerformerId,
    normalizedOptions,
    currentUserId,
  ]);

  const form = useForm<WeldEventFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      comment: '',
      doneAt: new Date(),
      performerId: computedDefaultPerformerId,
      inspectionResult: selectedEventType === 'visual-inspection' ? 'approved' : undefined,
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        comment: '',
        doneAt: new Date(),
        performerId: computedDefaultPerformerId,
        inspectionResult: selectedEventType === 'visual-inspection' ? 'approved' : undefined,
      });
    }
  }, [open, computedDefaultPerformerId, form, selectedEventType]);

  useEffect(() => {
    form.setValue('performerId', computedDefaultPerformerId);
  }, [computedDefaultPerformerId, form]);

  const handleDialogChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      form.reset({
        comment: '',
        doneAt: new Date(),
        performerId: computedDefaultPerformerId,
        inspectionResult: selectedEventType === 'visual-inspection' ? 'approved' : undefined,
      });
    }
    onOpenChange(nextOpen);
  };

  const dialogTitle = t(
    DIALOG_TITLE_KEYS[selectedEventType] ?? 'weldEvents.form.title'
  );

  const handleSubmit = form.handleSubmit(async (values) => {
    const timestamp = Timestamp.fromDate(values.doneAt);

    const selectedOption = normalizedOptions.find(
      (option) => option.value === values.performerId
    );

    const performerName = allowPerformerSelection
      ? selectedOption?.label || currentUserName || t('weldEvents.unknownPerformer')
      : currentUserName || t('weldEvents.unknownPerformer');

    const eventData: any = {
      weldId,
      weldLogId,
      projectId,
      eventType: selectedEventType,
      description: values.comment?.trim() || '',
      performedAt: timestamp,
      performedBy: performerName.trim(),
      doneById: values.performerId || undefined,
    };

    // Only add inspectionResult if it has a value
    if (values.inspectionResult) {
      eventData.inspectionResult = values.inspectionResult;
    }

    await onSubmit(eventData);

    handleDialogChange(false);
  });

  return (
    <Dialog open={open} onOpenChange={handleDialogChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{dialogTitle}</DialogTitle>
          <DialogDescription className="sr-only">
            {t('weldEvents.form.subtitle')}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="doneAt"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('weldEvents.form.doneAt')}</FormLabel>
                    <FormControl>
                      <DateTimePickerSimple
                        value={field.value}
                        onChange={field.onChange}
                        granularity="minute"
                        placeholder={t('weldEvents.form.selectDate')}
                        locale={dateLocale}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="performerId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('weldEvents.form.doneBy')}</FormLabel>
                    {allowPerformerSelection ? (
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                        disabled={isSubmitting || normalizedOptions.length === 0}
                      >
                        <FormControl>
                          <SelectTrigger aria-label={t('weldEvents.form.doneBy')}>
                            <SelectValue
                              placeholder={t('weldEvents.form.performerPlaceholder')}
                            />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {normalizedOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <>
                        <FormControl>
                          <Input value={currentUserName} readOnly disabled />
                        </FormControl>
                        <input type="hidden" {...field} />
                      </>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="comment"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('weldEvents.form.comment')}</FormLabel>
                  <FormControl>
                    <textarea
                      {...field}
                      rows={3}
                      className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {selectedEventType === 'visual-inspection' && (
              <FormField
                control={form.control}
                name="inspectionResult"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('weldEvents.form.inspectionResult')}</FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                      disabled={isSubmitting}
                    >
                      <FormControl>
                        <SelectTrigger aria-label={t('weldEvents.form.inspectionResult')}>
                          <SelectValue
                            placeholder={t('weldEvents.form.inspectionResultPlaceholder')}
                          />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="approved">
                          {t('weldEvents.inspectionResult.approved')}
                        </SelectItem>
                        <SelectItem value="rejected">
                          {t('weldEvents.inspectionResult.rejected')}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <DialogFooter className="flex flex-col gap-2 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleDialogChange(false)}
              >
                {t('weldEvents.form.cancel')}
              </Button>
              <Button type="submit" disabled={isSubmitting || form.formState.isSubmitting}>
                {isSubmitting || form.formState.isSubmitting
                  ? t('weldEvents.form.submitting')
                  : dialogTitle}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
