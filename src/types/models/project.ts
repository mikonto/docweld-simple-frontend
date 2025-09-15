/**
 * Project-related types
 * Manages projects, participants, and permissions
 */

import type { Timestamp } from 'firebase/firestore';
import { FirestoreBase } from './base';

/**
 * Project status values
 */
export type ProjectStatus =
  | 'planning'
  | 'active'
  | 'completed'
  | 'archived'
  | 'on-hold';

/**
 * Roles a user can have in a project
 */
export type ProjectRole =
  | 'owner'      // Full control
  | 'manager'    // Can manage project
  | 'welder'     // Can add welds
  | 'inspector'  // Can inspect/approve
  | 'viewer';    // Read-only access

/**
 * Permissions available in a project
 */
export type ProjectPermission =
  | 'view'
  | 'edit'
  | 'delete'
  | 'manage-participants'
  | 'manage-welds'
  | 'manage-documents'
  | 'approve-welds';

/**
 * Core project data
 */
export interface Project extends FirestoreBase {
  projectName: string; // Note: Firestore uses 'projectName', not 'name'
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

/**
 * Participant in a project
 */
export interface ProjectParticipant {
  userId: string;
  role: ProjectRole;
  participatingAs?: string[];
  addedAt: Timestamp;
  addedBy: string;
  permissions?: ProjectPermission[];
}