/**
 * Company and material-related types
 * Manages company information and welding materials
 */

import type { Timestamp } from 'firebase/firestore';
import { FirestoreBase } from './base';

/**
 * Company information
 */
export interface Company {
  id: string;
  companyName: string;
  companyAddress?: string;
  companyWebsite?: string;
  contactPersonName?: string;
  contactPersonEmail?: string;
  contactPersonPhone?: string;
  logoUrl?: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

/**
 * Material used in welding
 * Can represent parent material, filler material, or alloy material
 */
export interface Material extends FirestoreBase {
  // Common field for filler/alloy materials, or can be used for parent material name
  name?: string;
  // Parent material specific fields
  type?: string; // Material type description (e.g., "Steel Grade A")
  dimensions?: string;
  thickness?: string;
  alloyMaterial?: string;
  // Optional fields for more detailed specifications
  grade?: string;
  specification?: string;
  heatNumber?: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}
