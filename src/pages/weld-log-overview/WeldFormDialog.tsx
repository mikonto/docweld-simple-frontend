import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import * as z from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
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
  FormDescription,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useMaterials, useMaterialOperations } from '@/hooks/useMaterials';
import { MaterialFormDialog } from '@/pages/material-management/MaterialFormDialog';
import { MultiCombobox } from '@/components/ui/custom/multi-combobox';
import { useWeldOperations } from '@/hooks/useWelds';
import type { Weld } from '@/types/models/welding';
import type { Material } from '@/types/models/company';
import type { MaterialFormData } from '@/types/forms';
import type {
  SingleWeldFormData,
  MultipleWeldsFormData,
} from '@/types/forms/weld-forms';

interface MaterialDialogState {
  isOpen: boolean;
  materialType: 'parent' | 'filler' | null;
}

interface WeldFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  weld?: Weld | null;
  weldLogId?: string;
  onSubmit: (
    data: SingleWeldFormData | MultipleWeldsFormData,
    mode?: string
  ) => Promise<void>;
}

// Default values for forms
const getSingleWeldDefaults = (weld?: Weld | null): SingleWeldFormData => ({
  number: weld?.number || '',
  position: '', // Position is not stored in Weld type
  parentMaterials: [], // Parent materials are not stored in Weld type
  fillerMaterials: [], // Filler materials are not stored in Weld type
  description: weld?.notes || '', // Map notes to description
  heatTreatment: false, // Heat treatment is not stored in Weld type
});

const getMultipleWeldsDefaults = (): MultipleWeldsFormData => ({
  startNumber: '',
  endNumber: '',
  position: '',
  positionMode: '', // Default to empty (shows placeholder)
  parentMaterials: [],
  fillerMaterials: [],
  description: '',
  heatTreatment: false,
});

// Weld form dialog for creating and editing individual welds with single/multiple modes
export function WeldFormDialog({
  open,
  onOpenChange,
  weld = null,
  weldLogId,
  onSubmit,
}: WeldFormDialogProps): React.ReactElement {
  const { t } = useTranslation();

  // State for form mode (single or multiple)
  const [mode, setMode] = useState<'single' | 'multiple'>('single');

  // State for wizard navigation
  const [currentStep, setCurrentStep] = useState<number>(1);

  // State for manual positions
  const [positions, setPositions] = useState<Record<string, string>>({});

  // Get materials from hooks
  const [parentMaterials] = useMaterials('parent');
  const [fillerMaterials] = useMaterials('filler');
  const { createMaterial } = useMaterialOperations();
  const { isWeldNumberAvailable, isWeldNumberRangeAvailable } =
    useWeldOperations();

  // State for material dialog
  const [materialFormDialog, setMaterialFormDialog] =
    useState<MaterialDialogState>({
      isOpen: false,
      materialType: null,
    });

  // State for validation in progress
  const [validating, setValidating] = useState(false);

  // Form schema for single weld mode - must match SingleWeldFormData interface exactly
  const singleWeldSchema = z.object({
    number: z.string().min(1, t('validation.weldNumberRequired')),
    position: z.string().min(1, t('validation.positionRequired')),
    parentMaterials: z
      .array(z.string())
      .min(1, t('validation.parentMaterialsRequired')),
    fillerMaterials: z
      .array(z.string())
      .min(1, t('validation.fillerMaterialsRequired')),
    description: z.string().optional(),
    heatTreatment: z.boolean(),
  });

  // Form schema for multiple welds mode - must match MultipleWeldsFormData interface exactly
  const multipleWeldsSchema = z.object({
    startNumber: z.string().min(1, t('validation.startNumberRequired')),
    endNumber: z.string().min(1, t('validation.endNumberRequired')),
    position: z.string().optional(),
    positionMode: z.enum(['', 'same-as-number', 'manual', 'add-later']),
    parentMaterials: z
      .array(z.string())
      .min(1, t('validation.parentMaterialsRequired')),
    fillerMaterials: z
      .array(z.string())
      .min(1, t('validation.fillerMaterialsRequired')),
    description: z.string().optional(),
    heatTreatment: z.boolean(),
  });

  // Single form
  const singleForm = useForm<SingleWeldFormData>({
    resolver: zodResolver(singleWeldSchema),
    defaultValues: getSingleWeldDefaults(weld),
  });

  // Multiple form
  const multipleForm = useForm<MultipleWeldsFormData>({
    resolver: zodResolver(multipleWeldsSchema),
    defaultValues: getMultipleWeldsDefaults(),
  });

  // Update form when weld changes or mode switches
  useEffect(() => {
    if (mode === 'single' && weld) {
      singleForm.reset(getSingleWeldDefaults(weld));
    } else if (mode === 'multiple') {
      multipleForm.reset(getMultipleWeldsDefaults());
    }
  }, [weld, mode, singleForm, multipleForm]);

  // Clear form when dialog closes
  useEffect(() => {
    if (!open) {
      setMode('single');
      setCurrentStep(1);
      setPositions({});
      singleForm.reset(getSingleWeldDefaults());
      multipleForm.reset(getMultipleWeldsDefaults());
    }
  }, [open, singleForm, multipleForm]);

  // Helper to generate position list for manual mode
  const generateWeldNumbersList = (
    startNumber: string,
    endNumber: string
  ): string[] => {
    const weldNumbers: string[] = [];
    const startNum = parseInt(startNumber.replace(/\D/g, ''), 10);
    const endNum = parseInt(endNumber.replace(/\D/g, ''), 10);
    const prefix = startNumber.replace(/\d/g, '');

    if (!isNaN(startNum) && !isNaN(endNum) && startNum <= endNum) {
      for (let i = startNum; i <= endNum; i++) {
        weldNumbers.push(`${prefix}${i}`);
      }
    }

    return weldNumbers;
  };

  const validateWeldNumber = async (number: string): Promise<string | null> => {
    if (!weldLogId) return null;

    const isAvailable = await isWeldNumberAvailable(weldLogId, number);
    if (!isAvailable) {
      return t('validation.weldNumberTaken', { number });
    }

    return null;
  };

  const validateWeldNumberRange = async (
    startNumber: string,
    endNumber: string
  ): Promise<string | null> => {
    if (!weldLogId) return null;

    // Extract numbers from the weld number strings
    const startNum = parseInt(startNumber.replace(/\D/g, ''), 10);
    const endNum = parseInt(endNumber.replace(/\D/g, ''), 10);

    if (isNaN(startNum) || isNaN(endNum)) {
      return t('validation.invalidNumberRange');
    }

    const isAvailable = await isWeldNumberRangeAvailable(
      weldLogId,
      startNum,
      endNum
    );

    if (!isAvailable) {
      return t('validation.weldNumbersConflict', {
        conflicts: `${startNumber} - ${endNumber}`,
      });
    }

    return null;
  };

  // Handle single weld submission
  const handleSingleWeldSubmit = async (data: SingleWeldFormData) => {
    try {
      setValidating(true);

      // Validate weld number availability if creating new weld
      if (!weld) {
        const error = await validateWeldNumber(data.number);
        if (error) {
          singleForm.setError('number', { message: error });
          setValidating(false);
          return;
        }
      }

      setValidating(false);
      await onSubmit(data, mode);
      onOpenChange(false);
    } catch (error) {
      setValidating(false);
      console.error('Error submitting single weld:', error);
      toast.error(t('weldLogs.errorSavingWeld'));
    }
  };

  // Handle multiple welds submission
  const handleMultipleWeldsSubmit = async (data: MultipleWeldsFormData) => {
    try {
      setValidating(true);

      // Validate weld number range availability
      const error = await validateWeldNumberRange(
        data.startNumber,
        data.endNumber
      );
      if (error) {
        multipleForm.setError('startNumber', { message: error });
        setValidating(false);
        return;
      }

      // If using manual position mode, validate all positions are filled
      if (data.positionMode === 'manual') {
        const weldNumbers = generateWeldNumbersList(
          data.startNumber,
          data.endNumber
        );
        const missingPositions = weldNumbers.filter(
          (num) => !positions[num] || positions[num].trim() === ''
        );

        if (missingPositions.length > 0) {
          toast.error(
            t('validation.missingPositions', {
              count: missingPositions.length,
            })
          );
          setValidating(false);
          return;
        }

        // Add manual positions to the data
        const multipleData = {
          ...data,
          manualPositions: positions,
        };
        setValidating(false);
        await onSubmit(multipleData, mode);
      } else {
        setValidating(false);
        await onSubmit(data, mode);
      }

      onOpenChange(false);
    } catch (error) {
      setValidating(false);
      console.error('Error submitting multiple welds:', error);
      toast.error(t('weldLogs.errorSavingWelds'));
    }
  };

  // Handle adding a new material
  const handleAddNewMaterial = async (
    type: 'parent' | 'filler',
    data: MaterialFormData | string
  ): Promise<void> => {
    try {
      const materialData: MaterialFormData =
        typeof data === 'string' ? { name: data } : data;
      const materialId = await createMaterial(type, materialData);

      if (materialId) {
        toast.success(t('materials.materialCreated'));

        // Update form field with new material
        if (mode === 'single') {
          const currentValues = singleForm.getValues();
          if (type === 'parent') {
            singleForm.setValue('parentMaterials', [
              ...(currentValues.parentMaterials || []),
              materialId,
            ]);
          } else if (type === 'filler') {
            singleForm.setValue('fillerMaterials', [
              ...(currentValues.fillerMaterials || []),
              materialId,
            ]);
          }
        } else {
          const currentValues = multipleForm.getValues();
          if (type === 'parent') {
            multipleForm.setValue('parentMaterials', [
              ...(currentValues.parentMaterials || []),
              materialId,
            ]);
          } else if (type === 'filler') {
            multipleForm.setValue('fillerMaterials', [
              ...(currentValues.fillerMaterials || []),
              materialId,
            ]);
          }
        }
      }
    } catch (error) {
      console.error('Error creating material:', error);
      toast.error(t('materials.errorCreatingMaterial'));
    }
  };

  // Handle next step in wizard for multiple welds
  const handleNextStep = () => {
    const positionMode = multipleForm.getValues('positionMode');
    if (currentStep === 1 && positionMode === 'manual') {
      setCurrentStep(2);
    } else {
      multipleForm.handleSubmit(handleMultipleWeldsSubmit)();
    }
  };

  // Determine submit button text
  const getSubmitButtonText = () => {
    if (validating) return t('common.validating');
    if (weld) return t('common.save');
    if (mode === 'multiple') {
      const positionMode = multipleForm.watch('positionMode');
      if (currentStep === 1 && positionMode === 'manual') {
        return t('common.next');
      }
    }
    return t('common.add');
  };

  // Get dialog title
  const getDialogTitle = () => {
    if (weld) return t('weldLogs.editWeld');
    return mode === 'single' ? t('weldLogs.addWeld') : t('weldLogs.addWelds');
  };

  // Render manual position entry for step 2
  const renderManualPositionEntry = () => {
    const values = multipleForm.getValues();
    const weldNumbers = generateWeldNumbersList(
      values.startNumber || '',
      values.endNumber || ''
    );

    return (
      <div className="space-y-4">
        <div className="text-sm text-muted-foreground">
          {t('weldLogs.enterPositionsForWelds')}
        </div>
        <div className="grid grid-cols-2 gap-4 max-h-[400px] overflow-y-auto">
          {weldNumbers.map((number) => (
            <div key={number} className="flex items-center gap-2">
              <span className="font-medium min-w-[80px]">{number}:</span>
              <Input
                placeholder={t('weldLogs.positionPlaceholder')}
                value={positions[number] || ''}
                onChange={(e) =>
                  setPositions((prev) => ({
                    ...prev,
                    [number]: e.target.value,
                  }))
                }
              />
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Render single weld form
  const renderSingleWeldForm = () => (
    <Form {...singleForm}>
      <form
        onSubmit={singleForm.handleSubmit(handleSingleWeldSubmit)}
        className="space-y-6"
      >
        {/* Mode tabs - only show when creating new welds */}
        {!weld && (
          <Tabs
            value={mode}
            onValueChange={(v) => setMode(v as 'single' | 'multiple')}
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="single">
                {t('weldLogs.singleWeld')}
              </TabsTrigger>
              <TabsTrigger value="multiple">
                {t('weldLogs.multipleWelds')}
              </TabsTrigger>
            </TabsList>
          </Tabs>
        )}

        <div className="space-y-4">
          <FormField
            control={singleForm.control}
            name="number"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('weldLogs.weldNumber')}</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder={t('weldLogs.weldNumberPlaceholder')}
                    disabled={!!weld}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={singleForm.control}
            name="position"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('weldLogs.position')}</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder={t('weldLogs.positionPlaceholder')}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={singleForm.control}
            name="parentMaterials"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('weldLogs.parentMaterials')}</FormLabel>
                <FormControl>
                  <MultiCombobox
                    options={parentMaterials
                      .filter((m): m is Material & { id: string } => !!m.id)
                      .map((m) => ({
                        value: m.id,
                        label: m.name || '',
                      }))}
                    value={field.value || []}
                    onValueChange={field.onChange}
                    placeholder={t('weldLogs.selectParentMaterials')}
                    showAddNew={true}
                    onAddNew={() => {
                      setMaterialFormDialog({
                        isOpen: true,
                        materialType: 'parent',
                      });
                    }}
                    addNewLabel={t('materials.addNew')}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={singleForm.control}
            name="fillerMaterials"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('weldLogs.fillerMaterials')}</FormLabel>
                <FormControl>
                  <MultiCombobox
                    options={fillerMaterials
                      .filter((m): m is Material & { id: string } => !!m.id)
                      .map((m) => ({
                        value: m.id,
                        label: m.name || '',
                      }))}
                    value={field.value || []}
                    onValueChange={field.onChange}
                    placeholder={t('weldLogs.selectFillerMaterials')}
                    showAddNew={true}
                    onAddNew={() => {
                      setMaterialFormDialog({
                        isOpen: true,
                        materialType: 'filler',
                      });
                    }}
                    addNewLabel={t('materials.addNew')}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={singleForm.control}
            name="heatTreatment"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>{t('weldLogs.heatTreatment')}</FormLabel>
                  <FormDescription>
                    {t('weldLogs.heatTreatmentDescription')}
                  </FormDescription>
                </div>
              </FormItem>
            )}
          />

          <FormField
            control={singleForm.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('common.description')}</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder={t('common.descriptionPlaceholder')}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <DialogFooter className="gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            {t('common.cancel')}
          </Button>
          <Button type="submit" disabled={validating}>
            {getSubmitButtonText()}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );

  // Render multiple welds form
  const renderMultipleWeldsForm = () => (
    <Form {...multipleForm}>
      <form
        onSubmit={multipleForm.handleSubmit(handleMultipleWeldsSubmit)}
        className="space-y-6"
      >
        {/* Mode tabs */}
        <Tabs
          value={mode}
          onValueChange={(v) => setMode(v as 'single' | 'multiple')}
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="single">{t('weldLogs.singleWeld')}</TabsTrigger>
            <TabsTrigger value="multiple">
              {t('weldLogs.multipleWelds')}
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Step 1: Main form fields */}
        {currentStep === 1 && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={multipleForm.control}
                name="startNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('weldLogs.startNumber')}</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder={t('weldLogs.startNumberPlaceholder')}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={multipleForm.control}
                name="endNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('weldLogs.endNumber')}</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder={t('weldLogs.endNumberPlaceholder')}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={multipleForm.control}
              name="positionMode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('weldLogs.positionMode')}</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue
                          placeholder={t('weldLogs.selectPositionMode')}
                        />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="same-as-number">
                        {t('weldLogs.sameAsWeldNumber')}
                      </SelectItem>
                      <SelectItem value="manual">
                        {t('weldLogs.enterManually')}
                      </SelectItem>
                      <SelectItem value="add-later">
                        {t('weldLogs.addLater')}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Show position field when position mode is not selected/manual/same-as-number */}
            {multipleForm.watch('positionMode') !== 'manual' &&
              multipleForm.watch('positionMode') !== 'same-as-number' && (
                <FormField
                  control={multipleForm.control}
                  name="position"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('weldLogs.position')}</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder={t('weldLogs.positionPlaceholder')}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

            <FormField
              control={multipleForm.control}
              name="parentMaterials"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('weldLogs.parentMaterials')}</FormLabel>
                  <FormControl>
                    <MultiCombobox
                      options={parentMaterials
                        .filter((m): m is Material & { id: string } => !!m.id)
                        .map((m) => ({
                          value: m.id,
                          label: m.name || '',
                        }))}
                      value={field.value || []}
                      onValueChange={field.onChange}
                      placeholder={t('weldLogs.selectParentMaterials')}
                      showAddNew={true}
                      onAddNew={() => {
                        setMaterialFormDialog({
                          isOpen: true,
                          materialType: 'parent',
                        });
                      }}
                      addNewLabel={t('materials.addNew')}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={multipleForm.control}
              name="fillerMaterials"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('weldLogs.fillerMaterials')}</FormLabel>
                  <FormControl>
                    <MultiCombobox
                      options={fillerMaterials
                        .filter((m): m is Material & { id: string } => !!m.id)
                        .map((m) => ({
                          value: m.id,
                          label: m.name || '',
                        }))}
                      value={field.value || []}
                      onValueChange={field.onChange}
                      placeholder={t('weldLogs.selectFillerMaterials')}
                      showAddNew={true}
                      onAddNew={() => {
                        setMaterialFormDialog({
                          isOpen: true,
                          materialType: 'filler',
                        });
                      }}
                      addNewLabel={t('materials.addNew')}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={multipleForm.control}
              name="heatTreatment"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>{t('weldLogs.heatTreatment')}</FormLabel>
                    <FormDescription>
                      {t('weldLogs.heatTreatmentDescription')}
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />

            <FormField
              control={multipleForm.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('common.description')}</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder={t('common.descriptionPlaceholder')}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        )}

        {/* Step 2: Manual position entry */}
        {currentStep === 2 && renderManualPositionEntry()}

        <DialogFooter className="gap-2">
          {currentStep === 2 && (
            <Button
              type="button"
              variant="outline"
              onClick={() => setCurrentStep(1)}
            >
              {t('common.back')}
            </Button>
          )}
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            {t('common.cancel')}
          </Button>
          <Button
            type={
              currentStep === 1 &&
              multipleForm.watch('positionMode') === 'manual'
                ? 'button'
                : 'submit'
            }
            disabled={validating}
            onClick={
              currentStep === 1 &&
              multipleForm.watch('positionMode') === 'manual'
                ? handleNextStep
                : undefined
            }
          >
            {getSubmitButtonText()}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{getDialogTitle()}</DialogTitle>
            <DialogDescription className="sr-only">
              Form for creating or editing weld entries with material information and weld parameters
            </DialogDescription>
          </DialogHeader>

          {mode === 'single'
            ? renderSingleWeldForm()
            : renderMultipleWeldsForm()}
        </DialogContent>
      </Dialog>

      {/* Material form dialog */}
      {materialFormDialog.materialType && (
        <MaterialFormDialog
          open={materialFormDialog.isOpen}
          onOpenChange={(open) =>
            setMaterialFormDialog({ ...materialFormDialog, isOpen: open })
          }
          materialType={materialFormDialog.materialType}
          onSubmit={(data) =>
            handleAddNewMaterial(materialFormDialog.materialType!, data)
          }
        />
      )}
    </>
  );
}
