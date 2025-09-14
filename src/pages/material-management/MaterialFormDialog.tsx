import React from 'react';
import * as z from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
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
import { Combobox } from '@/components/ui/combobox';
import { useAlloyMaterials } from '@/hooks/useMaterials';
import type { Material } from '@/types';
import type { TFunction } from 'i18next';

// Get schema and default values based on material type
const getSchemaAndDefaults = (materialType: string, t: TFunction) => {
  switch (materialType) {
    case 'parent':
      return {
        schema: z.object({
          type: z.string().min(1, t('validation.typeRequired')),
          dimensions: z.string().min(1, t('validation.dimensionsRequired')),
          thickness: z.string().min(1, t('validation.thicknessRequired')),
          alloyMaterial: z
            .string()
            .min(1, t('validation.alloyMaterialRequired')),
        }),
        defaults: {
          type: '',
          dimensions: '',
          thickness: '',
          alloyMaterial: '',
        },
      };
    case 'filler':
      return {
        schema: z.object({
          name: z.string().min(1, t('validation.nameRequired')),
        }),
        defaults: {
          name: '',
        },
      };
    case 'alloy':
      return {
        schema: z.object({
          name: z.string().min(1, t('validation.nameRequired')),
        }),
        defaults: {
          name: '',
        },
      };
    default:
      return { schema: z.object({}), defaults: {} };
  }
};

interface MaterialFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  material?: Material | null;
  materialType: 'parent' | 'filler' | 'alloy';
  onSubmit: (data: Partial<Material>) => Promise<void>;
  description?: string | null;
}

// Material form dialog for creating and editing materials of different types
export function MaterialFormDialog({
  open,
  onOpenChange,
  material = null,
  materialType,
  onSubmit,
  description = null,
}: MaterialFormDialogProps) {
  const { t } = useTranslation();

  // Always call the hook, but only use the materials for parent type
  const [alloyMaterials = [], , alloyError] = useAlloyMaterials();

  // Handle potential error from hook
  React.useEffect(() => {
    if (alloyError && materialType === 'parent') {
      toast.error(t('materials.loadAlloyMaterialsError'));
    }
  }, [alloyError, materialType, t]);
  const availableAlloyMaterials = React.useMemo(
    () =>
      materialType === 'parent'
        ? alloyMaterials.map((material) => ({
            value: material.name || '',
            label: material.name || '',
          }))
        : [],
    [materialType, alloyMaterials]
  );

  const { schema, defaults } = React.useMemo(
    () => getSchemaAndDefaults(materialType, t),
    [materialType, t]
  );

  type FormData = z.infer<typeof schema>;

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: React.useMemo(
      () => (material || defaults) as FormData,
      [material, defaults]
    ),
  });

  // Reset form when dialog opens/closes or material changes
  React.useEffect(() => {
    if (open) {
      const values = (material || defaults) as FormData;
      form.reset(values);
    }
  }, [open, material, defaults, form]);

  // Form fields based on material type
  const renderFormFields = React.useCallback(() => {
    switch (materialType) {
      case 'parent':
        return (
          <>
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('materials.type')}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t('materials.enterType')}
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
              name="dimensions"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('materials.dimensions')}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t('materials.enterDimensions')}
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
              name="thickness"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('materials.thickness')}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t('materials.enterThickness')}
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
              name="alloyMaterial"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('materials.alloyMaterial')}</FormLabel>
                  <FormControl>
                    <Combobox
                      options={availableAlloyMaterials}
                      value={field.value}
                      onValueChange={field.onChange}
                      placeholder={t('materials.selectAlloyMaterial')}
                      emptyText={t('materials.noAlloyMaterials')}
                      searchPlaceholder={t('materials.searchAlloyMaterials')}
                      allowCustomValue={true}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </>
        );
      case 'filler':
      case 'alloy':
        return (
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  {materialType === 'filler'
                    ? t('materials.fillerMaterial')
                    : t('materials.alloyMaterial')}{' '}
                  {t('materials.name')}
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder={t(
                      materialType === 'filler'
                        ? 'materials.enterFillerMaterialName'
                        : 'materials.enterAlloyMaterialName'
                    )}
                    autoComplete="off"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        );
      default:
        return null;
    }
  }, [materialType, form.control, availableAlloyMaterials, t]);

  const handleSubmit = form.handleSubmit(async (data) => {
    try {
      // Pass the form data directly - it now matches the Material interface
      await onSubmit(data as Partial<Material>);
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
            {material
              ? t(
                  `materials.edit${
                    materialType.charAt(0).toUpperCase() + materialType.slice(1)
                  }Material`
                )
              : t(
                  `materials.add${
                    materialType.charAt(0).toUpperCase() + materialType.slice(1)
                  }Material`
                )}
          </DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={handleSubmit} className="space-y-4">
            {renderFormFields()}
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                {t('common.cancel')}
              </Button>
              <Button type="submit">
                {material ? t('common.saveChanges') : t('common.addButton')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
