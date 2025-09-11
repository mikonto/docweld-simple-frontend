/**
 * Application Types - Core Business Logic Types
 * 
 * These types represent the application's domain models
 * and are used throughout the components and hooks.
 */

import type { Timestamp } from 'firebase/firestore';

// ============== User Types ==============

export interface User {
  id: string;
  email: string;
  displayName: string;
  firstName?: string;
  lastName?: string;
  role: UserRole;
  companyName?: string;
  phoneNumber?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  lastLogin?: Timestamp;
  isActive: boolean;
}

export type UserRole = 'admin' | 'manager' | 'welder' | 'viewer' | 'user';

// ============== Project Types ==============

export interface Project {
  id: string;
  projectName: string;  // Note: Firestore uses 'projectName', not 'name'
  projectNumber?: string;
  client?: string;
  customer?: string;
  status: ProjectStatus;
  description?: string;
  externalReference?: string;
  location?: string;
  startDate?: Timestamp;
  endDate?: Timestamp;
  fillerMaterialTraceable?: boolean;
  parentMaterialTraceable?: boolean;
  participants?: ProjectParticipant[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

type ProjectStatus = 'planning' | 'active' | 'completed' | 'archived' | 'on-hold';

export interface ProjectParticipant {
  userId: string;
  role: ProjectRole;
  participatingAs?: string[];
  addedAt: Timestamp;
  addedBy: string;
  permissions?: ProjectPermission[];
}

type ProjectRole = 'owner' | 'manager' | 'welder' | 'inspector' | 'viewer';

type ProjectPermission = 
  | 'view'
  | 'edit'
  | 'delete'
  | 'manage-participants'
  | 'manage-welds'
  | 'manage-documents'
  | 'approve-welds';

// ============== Weld Types ==============

export interface WeldLog {
  id: string;
  projectId: string;
  name: string;
  description?: string;
  status: 'active' | 'completed' | 'archived';
  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdBy: string;
  welds?: string[];
}

export interface Weld {
  id: string;
  projectId: string;
  weldLogId?: string;
  number: string;
  welderId: string;
  inspectorId?: string;
  status: WeldStatus;
  type: WeldType;
  process?: WeldProcess;
  material?: Material;
  createdAt: Timestamp;
  completedAt?: Timestamp;
  inspectedAt?: Timestamp;
  notes?: string;
}

type WeldStatus = 'pending' | 'in-progress' | 'completed' | 'approved' | 'rejected' | 'repaired';
type WeldType = 'production' | 'repair' | 'test';
type WeldProcess = 'SMAW' | 'GMAW' | 'GTAW' | 'FCAW' | 'SAW';

// ============== Material Types ==============

export interface Material {
  id?: string;
  name: string;
  type: MaterialType;
  grade?: string;
  specification?: string;
  heatNumber?: string;
  thickness?: number;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

type MaterialType = 'carbon-steel' | 'stainless-steel' | 'aluminum' | 'duplex' | 'other';

// ============== Company Types ==============

// @unused - CompanyInformation is defined in database.ts
// interface CompanyInformation {
//   id?: string;
//   companyName: string;
//   organizationNumber?: string;
//   address?: string;
//   city?: string;
//   postalCode?: string;
//   country?: string;
//   phone?: string;
//   email?: string;
//   website?: string;
//   logoUrl?: string;
//   createdAt?: Timestamp;
//   updatedAt?: Timestamp;
// }

// ============== Form Types ==============

// @unused - Login is handled by Firebase Auth
// interface LoginFormData {
//   email: string;
//   password: string;
// }

export interface ProjectFormData {
  projectName: string;
  projectNumber?: string;
  client?: string;
  customer?: string;
  location?: string;
  externalReference?: string;
  startDate?: string;
  endDate?: string;
  status?: ProjectStatus;
}

export interface MaterialFormData {
  name: string;
  type: MaterialType;
  grade?: string;
  specification?: string;
  heatNumber?: string;
  thickness?: number;
}

export interface UserFormData {
  email: string;
  displayName: string;
  firstName?: string;
  lastName?: string;
  role: UserRole;
  companyName?: string;
  phoneNumber?: string;
  password?: string;
}

export interface WeldLogFormData {
  name: string;
  description?: string;
  status?: 'active' | 'completed' | 'archived';
}

export interface WeldFormData {
  number: string;
  welderId?: string;
  type?: WeldType;
  status?: WeldStatus;
  notes?: string;
}

// ============== Context Types ==============

interface AppUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL?: string | null;
}

// @unused - User data is handled through AppUser type
// interface UserDbData {
//   id: string;
//   email: string;
//   displayName?: string;
//   role?: UserRole;
//   [key: string]: any; // Allow additional fields from Firestore
// }

export interface LoggedInUser extends AppUser {
  role?: UserRole;
  displayName: string;
  email: string;
}