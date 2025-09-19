/**
 * Welding-related types
 * Manages weld logs, individual welds, and welding processes
 */

import type { Timestamp } from 'firebase/firestore';
import type { Status } from '../common/status';
import { FirestoreBase } from './base';
import { Material } from './company';

/**
 * Weld status values
 */
export type WeldStatus =
  | 'pending'
  | 'in-progress'
  | 'completed'
  | 'approved'
  | 'rejected'
  | 'repaired';

/**
 * Types of welds
 */
export type WeldType =
  | 'production'
  | 'repair'
  | 'test';

/**
 * Welding processes
 */
export type WeldProcess =
  | 'SMAW'  // Shielded Metal Arc Welding
  | 'GMAW'  // Gas Metal Arc Welding
  | 'GTAW'  // Gas Tungsten Arc Welding
  | 'FCAW'  // Flux-Cored Arc Welding
  | 'SAW';  // Submerged Arc Welding

/**
 * Weld log status values
 */
export type WeldLogStatus =
  | 'active'
  | 'completed'
  | 'archived';

/**
 * Weld log containing multiple welds
 */
export interface WeldLog extends FirestoreBase {
  projectId: string;
  name: string;
  description?: string;
  status: WeldLogStatus;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdBy: string;
  welds?: string[];
  [key: string]: unknown; // Allow additional fields
}

/**
 * Individual weld record
 */
export interface Weld extends FirestoreBase {
  projectId: string;
  weldLogId?: string;
  number: string;
  position?: string;
  welderId: string;
  inspectorId?: string;
  status: WeldStatus;
  type: WeldType;
  process?: WeldProcess;
  material?: Material;
  parentMaterials?: string[];
  fillerMaterials?: string[];
  heatTreatment?: boolean;
  description?: string;
  notes?: string;
  createdAt: Timestamp;
  completedAt?: Timestamp;
  inspectedAt?: Timestamp;
}

/**
 * Supported weld activity types for audit trail logging
 */
export type WeldActivityType =
  | 'weld'
  | 'heat-treatment'
  | 'visual-inspection'
  | 'comment';

/**
 * Audit trail entry for weld history
 */
export interface WeldHistoryEntry extends FirestoreBase {
  status: Status;
  createdAt: Timestamp;
  createdBy: string;
  updatedAt: Timestamp;
  updatedBy: string;

  weldId: string;
  weldLogId: string;
  projectId: string;

  eventType: WeldActivityType;
  description: string;
  performedAt: Timestamp;
  performedBy: string;
  doneById?: string;
  
  // For visual inspection events
  inspectionResult?: 'approved' | 'rejected';

  attachmentIds?: string[];
  metadata?: Record<string, unknown>;
}

/**
 * Payload for creating a weld history entry via Firestore operations hook
 * System fields are injected automatically by the hook
 */
export type CreateWeldHistoryInput = {
  weldId: string;
  weldLogId: string;
  projectId: string;
  eventType: WeldActivityType;
  description: string;
  performedAt: Timestamp;
  performedBy: string;
  doneById?: string;
  inspectionResult?: 'approved' | 'rejected';
  attachmentIds?: string[];
  metadata?: Record<string, unknown>;
};
