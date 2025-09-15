/**
 * Weld-specific form types
 * Form data structures for creating and editing welds
 */

/**
 * Form data for creating/editing a single weld
 */
export interface SingleWeldFormData {
  number: string;
  position: string;
  parentMaterials: string[];
  fillerMaterials: string[];
  description?: string;
  heatTreatment: boolean;
}

/**
 * Form data for creating multiple welds at once
 */
export interface MultipleWeldsFormData {
  startNumber: string;
  endNumber: string;
  position?: string;
  positionMode: '' | 'same-as-number' | 'manual' | 'add-later';
  parentMaterials: string[];
  fillerMaterials: string[];
  description?: string;
  heatTreatment: boolean;
}