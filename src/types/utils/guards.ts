/**
 * Type guards for runtime type checking
 * Use these when receiving data from APIs or external sources
 *
 * NOTE: These type guards are currently not in use but preserved
 * for future API validation needs. Commented out to reduce bundle size.
 */

// Placeholder export to make this a valid module
export {};

/*
// Uncomment these type guards when needed for API validation

import { User, LoggedInUser } from '../models/user';
import { Project } from '../models/project';
import { Weld, WeldLog } from '../models/welding';
import { Company, Material } from '../models/company';

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

export function isLoggedInUser(data: unknown): data is LoggedInUser {
  return (
    typeof data === 'object' &&
    data !== null &&
    'uid' in data &&
    'email' in data &&
    'displayName' in data
  );
}

export function isProject(data: unknown): data is Project {
  return (
    typeof data === 'object' &&
    data !== null &&
    'id' in data &&
    'projectName' in data &&
    'status' in data
  );
}

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

export function isCompany(data: unknown): data is Company {
  return (
    typeof data === 'object' &&
    data !== null &&
    'companyName' in data
  );
}

export function isMaterial(data: unknown): data is Material {
  return (
    typeof data === 'object' &&
    data !== null &&
    ('name' in data || 'type' in data)
  );
}

export function isDefined<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}

export function isArray<T>(value: unknown): value is T[] {
  return Array.isArray(value);
}

export function hasProperty<K extends PropertyKey>(
  obj: unknown,
  key: K
): obj is Record<K, unknown> {
  return typeof obj === 'object' && obj !== null && key in obj;
}
*/