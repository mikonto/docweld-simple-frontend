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

// Default values for forms
const getSingleWeldDefaults = (weld) => ({
  number: weld?.number || '',
  position: weld?.position || '',
  parentMaterials: weld?.parentMaterials || [],
  fillerMaterials: weld?.fillerMaterials || [],
  description: weld?.description || '',
  heatTreatment: weld?.heatTreatment || false,
});

const getMultipleWeldsDefaults = () => ({
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
}) {
  const { t } = useTranslation();

  // Form schema for single weld mode
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
    heatTreatment: z.boolean().default(false),
  });

  // Form schema for multiple welds mode
  const multipleWeldsSchema = z.object({
    startNumber: z.string().min(1, t('validation.startNumberRequired')),
    endNumber: z.string().min(1, t('validation.endNumberRequired')),
    position: z.string().optional(), // Position is optional when using position mode
    positionMode: z
      .enum(['', 'same-as-number', 'manual', 'add-later'])
      .default(''),
    parentMaterials: z
      .array(z.string())
      .min(1, t('validation.parentMaterialsRequired')),
    fillerMaterials: z
      .array(z.string())
      .min(1, t('validation.fillerMaterialsRequired')),
    description: z.string().optional(),
    heatTreatment: z.boolean().default(false),
  });

  // State for form mode (single or multiple)
  const [mode, setMode] = useState('single');

  // State for wizard navigation
  const [currentStep, setCurrentStep] = useState(1);

  // State for manual positions
  const [positions, setPositions] = useState({});

  // Get materials from hooks
  const [parentMaterials, parentLoading] = useMaterials('parent');
  const [fillerMaterials, fillerLoading] = useMaterials('filler');
  const { createMaterial } = useMaterialOperations();
  const { isWeldNumberAvailable, isWeldNumberRangeAvailable } =
    useWeldOperations();

  // State for material dialog
  const [materialFormDialog, setMaterialFormDialog] = useState({
    isOpen: false,
    materialType: null, // "parent" or "filler"
  });

  // Form setup with conditional schema based on mode
  const form = useForm({
    resolver: zodResolver(
      mode === 'single' ? singleWeldSchema : multipleWeldsSchema
    ),
    defaultValues:
      mode === 'single'
        ? getSingleWeldDefaults(weld)
        : getMultipleWeldsDefaults(),
  });

  // When the dialog opens, reset to single mode and populate form.
  useEffect(() => {
    if (open) {
      setMode('single');
      setCurrentStep(1);
      setPositions({});
      form.reset(getSingleWeldDefaults(weld));
    }
  }, [open, weld, form]);

  const handleModeChange = (newMode) => {
    setMode(newMode);
    setCurrentStep(1);
    setPositions({});
    if (newMode === 'single') {
      form.reset(getSingleWeldDefaults(weld));
    } else {
      form.reset(getMultipleWeldsDefaults());
    }
  };

  // Check weld number availability
  const checkWeldNumberAvailability = async (number, currentWeldId = null) => {
    try {
      const isAvailable = await isWeldNumberAvailable(
        weldLogId,
        number,
        currentWeldId
      );
      return isAvailable;
    } catch {
      return false;
    }
  };

  // Check weld number range availability
  const checkWeldNumberRangeAvailability = async (start, end) => {
    try {
      const isAvailable = await isWeldNumberRangeAvailable(
        weldLogId,
        start,
        end
      );
      return isAvailable;
    } catch {
      return false;
    }
  };

  // Handle form submission for single weld
  const handleSingleWeldSubmit = async (data) => {
    try {
      // Check if weld number is available (only if creating new or changing number)
      if (!weld || weld.number !== data.number) {
        const isAvailable = await checkWeldNumberAvailability(
          data.number,
          weld?.id
        );
        if (!isAvailable) {
          toast.error(
            t('weldLogs.weldNumberAlreadyInUse', {
              number: data.number,
            })
          );
          return;
        }
      }

      await onSubmit(data, 'single');
      form.reset();
      onOpenChange(false);
      // Success toast is handled by useFirestoreOperations
    } catch {
      // Error is already logged by useFirestoreOperations
    }
  };

  // Handle form submission for multiple welds
  const handleMultipleWeldsSubmit = async (data) => {
    try {
      // Convert to numbers and validate
      const startNum = parseInt(data.startNumber, 10);
      const endNum = parseInt(data.endNumber, 10);

      if (isNaN(startNum) || isNaN(endNum)) {
        toast.error(t('weldLogs.invalidNumberRange'));
        return;
      }

      if (startNum > endNum) {
        form.setError('endNumber', {
          type: 'manual',
          message: t('weldLogs.endNumberMustBeGreater'),
        });
        return;
      }

      // Check if the entire range is available
      const isAvailable = await checkWeldNumberRangeAvailability(
        startNum,
        endNum
      );
      if (!isAvailable) {
        toast.error(t('weldLogs.weldNumbersInRangeInUse'));
        return;
      }

      // Validate position mode is selected
      if (!data.positionMode) {
        form.setError('positionMode', {
          type: 'manual',
          message: t('validation.positionModeRequired'),
        });
        return;
      }

      // Prepare position data based on position mode
      let positionData = {};

      if (data.positionMode === 'same-as-number') {
        // Position same as weld number
        for (let i = startNum; i <= endNum; i++) {
          positionData[i] = i.toString();
        }
      } else if (data.positionMode === 'manual') {
        // Use manually entered positions
        positionData = positions;

        // Validate that all positions are filled
        for (let i = startNum; i <= endNum; i++) {
          if (!positionData[i]) {
            toast.error(t('weldLogs.allPositionsMustBeFilled'));
            return;
          }
        }
      }
      // For 'add-later' mode, positionData remains empty

      // Create a shared data object for all welds
      const sharedData = {
        parentMaterials: data.parentMaterials,
        fillerMaterials: data.fillerMaterials,
        description: data.description,
        heatTreatment: data.heatTreatment,
      };

      await onSubmit(
        {
          startNumber: data.startNumber,
          endNumber: data.endNumber,
          positionMode: data.positionMode,
          positions: positionData,
          ...sharedData,
        },
        'multiple'
      );

      form.reset(getMultipleWeldsDefaults());
      setCurrentStep(1);
      setPositions({});
      onOpenChange(false);
      // Success toast is handled by useFirestoreOperations
    } catch {
      // Error is already logged by useFirestoreOperations
    }
  };

  // Handle form submission based on mode
  const handleSubmit = form.handleSubmit(
    mode === 'single' ? handleSingleWeldSubmit : handleMultipleWeldsSubmit
  );

  // Handle adding a new material
  const handleAddNewMaterial = async (type, data) => {
    try {
      // Transform data based on material type
      // Parent materials have multiple fields, filler materials only have name
      const transformedData =
        type === 'parent' ? data : { name: data.name || data };

      const newMaterialId = await createMaterial(type, transformedData);

      // Auto-select the newly created material in the appropriate field
      const currentValues = form.getValues();
      if (type === 'parent') {
        const updatedParentMaterials = [
          ...currentValues.parentMaterials,
          newMaterialId,
        ];
        form.setValue('parentMaterials', updatedParentMaterials, {
          shouldValidate: true,
          shouldDirty: true,
        });
      } else if (type === 'filler') {
        const updatedFillerMaterials = [
          ...currentValues.fillerMaterials,
          newMaterialId,
        ];
        form.setValue('fillerMaterials', updatedFillerMaterials, {
          shouldValidate: true,
          shouldDirty: true,
        });
      }

      // Success toast is handled by useFirestoreOperations
      setMaterialFormDialog({ isOpen: false, materialType: null });
    } catch {
      // Error is already logged by useFirestoreOperations
    }
  };

  // Transform materials to options format for the combobox
  const parentMaterialOptions = parentMaterials.map((material) => ({
    label: material.type
      ? `${material.type} - ${material.dimensions} - ${material.alloyMaterial}`
      : material.name,
    value: material.id,
  }));

  const fillerMaterialOptions = fillerMaterials.map((material) => ({
    label: material.name,
    value: material.id,
  }));

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>
              {weld
                ? t('weldLogs.editWeld')
                : mode === 'single'
                  ? t('weldLogs.addWeld')
                  : t('weldLogs.addWelds')}
            </DialogTitle>
          </DialogHeader>

          {/* Mode selection tabs - only show when adding new welds */}
          {!weld && (
            <Tabs
              defaultValue="single"
              value={mode}
              onValueChange={handleModeChange}
              className="w-full"
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

          <Form {...form}>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Step 1: Form fields */}
              {currentStep === 1 && (
                <>
                  {/* Render fields based on mode */}
                  {mode === 'single' ? (
                    <FormField
                      control={form.control}
                      name="number"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('weldLogs.weldNumber')}</FormLabel>
                          <FormControl>
                            <Input
                              placeholder={t('weldLogs.enterWeldNumber')}
                              autoComplete="off"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  ) : (
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="startNumber"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t('weldLogs.startNumber')}</FormLabel>
                            <FormControl>
                              <Input
                                placeholder={t('weldLogs.enterStartNumber')}
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
                        name="endNumber"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t('weldLogs.endNumber')}</FormLabel>
                            <FormControl>
                              <Input
                                placeholder={t('weldLogs.enterEndNumber')}
                                autoComplete="off"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  )}

                  {/* Position mode selector - only show for multiple welds */}
                  {mode === 'multiple' && currentStep === 1 && (
                    <FormField
                      control={form.control}
                      name="positionMode"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('weldLogs.positionMode')}</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                          >
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
                                {t('weldLogs.addLaterWithEditWeld')}
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  {/* Position field - only show for single weld mode */}
                  {mode === 'single' && (
                    <FormField
                      control={form.control}
                      name="position"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('weldLogs.position')}</FormLabel>
                          <FormControl>
                            <Input
                              placeholder={t('weldLogs.enterPosition')}
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
                    name="parentMaterials"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('weldLogs.parentMaterials')}</FormLabel>
                        <FormControl>
                          <MultiCombobox
                            placeholder={t('weldLogs.selectParentMaterials')}
                            options={parentMaterialOptions}
                            value={field.value}
                            onValueChange={field.onChange}
                            showAddNew={true}
                            addNewLabel={t('weldLogs.addNewParentMaterial')}
                            emptyText={
                              parentLoading
                                ? t('weldLogs.loadingMaterials')
                                : t('weldLogs.noParentMaterialsFound')
                            }
                            onAddNew={() =>
                              setMaterialFormDialog({
                                isOpen: true,
                                materialType: 'parent',
                              })
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="fillerMaterials"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('weldLogs.fillerMaterials')}</FormLabel>
                        <FormControl>
                          <MultiCombobox
                            placeholder={t('weldLogs.selectFillerMaterials')}
                            options={fillerMaterialOptions}
                            value={field.value}
                            onValueChange={field.onChange}
                            showAddNew={true}
                            addNewLabel={t('weldLogs.addNewFillerMaterial')}
                            emptyText={
                              fillerLoading
                                ? t('weldLogs.loadingMaterials')
                                : t('weldLogs.noFillerMaterialsFound')
                            }
                            onAddNew={() =>
                              setMaterialFormDialog({
                                isOpen: true,
                                materialType: 'filler',
                              })
                            }
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
                            placeholder={t('weldLogs.enterDescriptionOptional')}
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
                            {t('weldLogs.requiresHeatTreatment')}
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />
                </>
              )}

              {/* Step 2: Position entry for manual mode */}
              {currentStep === 2 && mode === 'multiple' && (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-medium">
                      {t('weldLogs.enterPositionsForWelds')}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {t('weldLogs.enterPositionForEachWeld')}
                    </p>
                  </div>
                  {/* Scrollable container for position inputs */}
                  <div className="max-h-[400px] overflow-y-auto border rounded-lg p-4">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      {(() => {
                        const startNum = parseInt(
                          form.getValues('startNumber'),
                          10
                        );
                        const endNum = parseInt(
                          form.getValues('endNumber'),
                          10
                        );
                        const entries = [];

                        for (let i = startNum; i <= endNum; i++) {
                          entries.push(
                            <div key={i} className="space-y-2">
                              <label
                                htmlFor={`position-${i}`}
                                className="text-sm font-medium"
                              >
                                {t('weldLogs.weld')} {i}
                              </label>
                              <Input
                                id={`position-${i}`}
                                placeholder={t('weldLogs.enterPosition')}
                                value={positions[i] || ''}
                                onChange={(e) => {
                                  setPositions((prev) => ({
                                    ...prev,
                                    [i]: e.target.value,
                                  }));
                                }}
                                autoComplete="off"
                              />
                            </div>
                          );
                        }

                        return entries;
                      })()}
                    </div>
                  </div>
                </div>
              )}

              <DialogFooter>
                {/* Back button for step 2 */}
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

                {/* Next button for step 1 when manual position mode is selected */}
                {currentStep === 1 &&
                  mode === 'multiple' &&
                  form.watch('positionMode') === 'manual' && (
                    <Button
                      type="button"
                      onClick={() => {
                        // Validate step 1 fields before proceeding
                        const startNum = form.getValues('startNumber');
                        const endNum = form.getValues('endNumber');
                        const parentMats = form.getValues('parentMaterials');
                        const fillerMats = form.getValues('fillerMaterials');

                        if (!startNum || !endNum) {
                          toast.error(
                            t('validation.pleaseEnterWeldNumberRange')
                          );
                          return;
                        }

                        if (parentMats.length === 0) {
                          toast.error(t('validation.parentMaterialsRequired'));
                          return;
                        }

                        if (fillerMats.length === 0) {
                          toast.error(t('validation.fillerMaterialsRequired'));
                          return;
                        }

                        setCurrentStep(2);
                      }}
                    >
                      {t('common.next')}
                    </Button>
                  )}

                {/* Submit button - hidden on step 1 when manual mode is selected */}
                {!(
                  currentStep === 1 &&
                  mode === 'multiple' &&
                  form.watch('positionMode') === 'manual'
                ) && (
                  <Button type="submit">
                    {weld ? t('common.saveChanges') : t('common.addButton')}
                  </Button>
                )}
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Material Form Dialog for adding materials on the fly */}
      {materialFormDialog.isOpen && (
        <MaterialFormDialog
          open={materialFormDialog.isOpen}
          onOpenChange={(isOpen) =>
            setMaterialFormDialog({
              ...materialFormDialog,
              isOpen,
            })
          }
          materialType={materialFormDialog.materialType}
          description={
            materialFormDialog.materialType === 'parent'
              ? t('materials.addParentMaterialForWeldDescription')
              : t('materials.addFillerMaterialForWeldDescription')
          }
          onSubmit={(data) =>
            handleAddNewMaterial(materialFormDialog.materialType, data)
          }
        />
      )}
    </>
  );
}
