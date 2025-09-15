/**
 * Type guards for runtime type checking
 * Use these when receiving data from APIs or external sources
 */

import { User, LoggedInUser } from '../models/user';
import { Project } from '../models/project';
import { Weld, WeldLog } from '../models/welding';
import { Company, Material } from '../models/company';

/**
 * Check if unknown data is a User
 */
export function isUser(data: unknown): data is User {
  return (
    typeof data === 'object' &&
    data !== null &&
    'email' in data &&
    'displayName' in data &&
    'role' in data &&
    'id' in data
  );
}

/**
 * Check if unknown data is a LoggedInUser
 */
export function isLoggedInUser(data: unknown): data is LoggedInUser {
  return (
    typeof data === 'object' &&
    data !== null &&
    'uid' in data &&
    'email' in data &&
    'displayName' in data
  );
}

/**
 * Check if unknown data is a Project
 */
export function isProject(data: unknown): data is Project {
  return (
    typeof data === 'object' &&
    data !== null &&
    'id' in data &&
    'projectName' in data &&
    'status' in data
  );
}

/**
 * Check if unknown data is a Weld
 */
export function isWeld(data: unknown): data is Weld {
  return (
    typeof data === 'object' &&
    data !== null &&
    'id' in data &&
    'number' in data &&
    'welderId' in data &&
    'status' in data &&
    'type' in data
  );
}

/**
 * Check if unknown data is a WeldLog
 */
export function isWeldLog(data: unknown): data is WeldLog {
  return (
    typeof data === 'object' &&
    data !== null &&
    'id' in data &&
    'projectId' in data &&
    'name' in data &&
    'status' in data
  );
}

/**
 * Check if unknown data is a Company
 */
export function isCompany(data: unknown): data is Company {
  return (
    typeof data === 'object' &&
    data !== null &&
    'companyName' in data
  );
}

/**
 * Check if unknown data is a Material
 */
export function isMaterial(data: unknown): data is Material {
  return (
    typeof data === 'object' &&
    data !== null &&
    ('name' in data || 'type' in data)
  );
}

/**
 * Check if a value is defined (not null or undefined)
 */
export function isDefined<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}

/**
 * Check if a value is an array
 */
export function isArray<T>(value: unknown): value is T[] {
  return Array.isArray(value);
}

/**
 * Check if an object has a specific property
 */
export function hasProperty<K extends PropertyKey>(
  obj: unknown,
  key: K
): obj is Record<K, unknown> {
  return typeof obj === 'object' && obj !== null && key in obj;
}