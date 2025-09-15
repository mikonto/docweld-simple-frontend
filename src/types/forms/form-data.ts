/**
 * Form data types
 * These are subsets of models used in forms
 * They only include editable fields and use simpler types (strings instead of Timestamps)
 */

import type {
  ProjectStatus,
  ProjectRole,
  ProjectPermission,
} from '../models/project';
import type { WeldType, WeldStatus, WeldLogStatus } from '../models/welding';
import type { UserRole } from '../models/user';

/**
 * Creating or editing a project
 */
export interface ProjectFormData {
  projectName: string;
  projectNumber?: string;
  client?: string;
  customer?: string;
  location?: string;
  externalReference?: string;
  startDate?: string; // String for form input
  endDate?: string; // String for form input
  status?: ProjectStatus;
}

/**
 * Creating or editing a user
 */
export interface UserFormData {
  email: string;
  displayName: string;
  firstName?: string;
  lastName?: string;
  role: UserRole;
  companyName?: string;
  phoneNumber?: string;
  password?: string; // Required for creating new users
  status?: 'active' | 'inactive';
}

/**
 * Creating or editing a weld log
 */
export interface WeldLogFormData {
  name: string;
  description?: string;
  status?: WeldLogStatus;
  [key: string]: unknown; // Allow additional fields
}

/**
 * Creating or editing a weld
 */
export interface WeldFormData {
  number: string;
  welderId?: string;
  type?: WeldType;
  status?: WeldStatus;
  notes?: string;
}

/**
 * Creating or editing a material
 */
export interface MaterialFormData {
  // Common field for all materials
  name?: string;
  // Parent material fields
  type?: string;
  dimensions?: string;
  thickness?: string;
  alloyMaterial?: string;
  // Optional detailed fields
  grade?: string;
  specification?: string;
  heatNumber?: string;
}

/**
 * Creating or editing a company
 */
export interface CompanyFormData {
  companyName: string;
  address?: string;
  website?: string;
  contactPerson?: string;
  contactEmail?: string;
  contactPhone?: string;
}

/**
 * Adding or editing a project participant
 */
export interface ProjectParticipantFormData {
  userId: string;
  role: ProjectRole;
  participatingAs?: string[];
  permissions?: ProjectPermission[];
}