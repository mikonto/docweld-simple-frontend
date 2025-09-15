# TypeScript Reorganization Guide for DocWeld

## Executive Summary

Current TypeScript implementation is functional but poorly organized for a beginner developer. This guide provides a clear path to reorganize ~700 lines of types into a structure that's 10x easier to understand and maintain.

**Goal**: Transform from "everything in one file" to "each file has ONE clear purpose"

---

## Current Problems (Why This Matters)

### 1. File Organization Issues

- `app.ts` has 256 lines mixing 23 different concerns
- No clear separation between data models, forms, and UI
- Finding a specific type requires searching through hundreds of lines
- No comments or sections to guide navigation

### 2. Beginner Pain Points

- **Daily time waste**: 2-3 minutes per type lookup × 20 lookups = 40-60 minutes/day
- **Mental overload**: Opening 256-line file to find one type
- **Error prone**: Easy to modify wrong type or create duplicates
- **No learning path**: Can't progressively understand the codebase

### 3. Maintenance Debt

- Adding new features requires editing massive files
- Type dependencies are unclear
- No consistent patterns for similar types
- Test types mixed with production types

---

## Target Architecture (Simple & Clear)

```
src/types/
├── models/           # Core business data (what things ARE)
│   ├── index.ts     # Re-exports all models
│   ├── base.ts      # Base interfaces (timestamps, IDs)
│   ├── user.ts      # User, roles, permissions
│   ├── project.ts   # Project, participants
│   ├── welding.ts   # WeldLog, Weld, processes
│   └── company.ts   # Company, materials
│
├── forms/           # Form data types (what users INPUT)
│   ├── index.ts     # Re-exports all forms
│   └── form-data.ts # All FormData interfaces
│
├── api/             # API communication (how we TALK to backend)
│   ├── index.ts     # Re-exports all API types
│   ├── responses.ts # ApiResponse, ListResponse
│   └── firestore.ts # Firestore-specific types
│
├── ui/              # Component props (how components BEHAVE)
│   ├── index.ts     # Re-exports all UI types
│   └── props.ts     # Common component props
│
├── utils/           # Utility types & helpers
│   ├── index.ts     # Re-exports all utils
│   └── guards.ts    # Type guards (isUser, isProject)
│
└── index.ts         # Master export file
```

**Rule**: Each file should be <100 lines. If it grows beyond that, split it.

---

## Implementation Plan (4 Phases)

### Phase 1: Foundation (Day 1-2)

Create new structure without breaking existing code.

**Tasks:**

1. Create new folder structure under `src/types/`
2. Copy (don't move) types to new locations
3. Set up index.ts files with proper exports
4. Verify no TypeScript errors

**Success Criteria:**

- [ ] All new folders created
- [ ] Types exist in both old and new locations
- [ ] `npm run type-check` passes

### Phase 2: Migration (Day 3-4)

Update all imports to use new type locations.

**Tasks:**

1. Update imports in components (one folder at a time)
2. Update imports in hooks
3. Update imports in pages
4. Update imports in utils

**Success Criteria:**

- [ ] All imports point to new locations
- [ ] Old type files no longer imported anywhere
- [ ] All tests pass

### Phase 3: Cleanup (Day 5)

Remove old type files and add improvements.

**Tasks:**

1. Delete old `app.ts`, `database.ts` files
2. Add JSDoc comments to complex types
3. Add type guards for runtime safety
4. Create missing API response types

**Success Criteria:**

- [ ] Old files deleted
- [ ] Every type has a comment explaining its purpose
- [ ] At least 5 type guards created

### Phase 4: Documentation (Day 6)

Make it beginner-proof with documentation.

**Tasks:**

1. Add README.md in each type folder
2. Create type relationship diagram
3. Document naming conventions
4. Add examples for common patterns

**Success Criteria:**

- [ ] Each folder has clear documentation
- [ ] New developer can find any type in <30 seconds

---

## Detailed File Contents

### models/base.ts

```typescript
/**
 * Base interfaces that all models extend
 * These provide common fields like timestamps and IDs
 */

// Every document in Firestore has these fields
export interface FirestoreBase {
  id: string;
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
}

// User-owned documents also have these
export interface UserOwned {
  userId: string;
  companyId: string;
}

// Soft-delete capability
export interface SoftDeletable {
  deletedAt?: string;
  isDeleted: boolean;
}
```

### models/user.ts

```typescript
/**
 * User-related types
 * Handles authentication, roles, and permissions
 */

import { FirestoreBase } from './base';

// Core user data from authentication
export interface User extends FirestoreBase {
  email: string;
  displayName: string;
  photoURL?: string;
  role: UserRole;
  companyId: string;
  isActive: boolean;
}

// Available user roles in the system
export type UserRole =
  | 'admin' // Full system access
  | 'manager' // Project management
  | 'welder' // Field operations
  | 'viewer'; // Read-only access

// Currently logged-in user (extends with auth info)
export interface LoggedInUser extends User {
  uid: string; // Firebase auth UID
  lastLogin: string;
}
```

### forms/form-data.ts

```typescript
/**
 * Form data types
 * These are subsets of models used in forms
 * They only include editable fields
 */

import { Project, User, Weld, WeldLog } from '../models';

// Creating a new project
export type ProjectFormData = Pick<Project, 'name' | 'description' | 'status'>;

// Editing a user
export type UserFormData = Pick<User, 'displayName' | 'role' | 'isActive'>;

// Pattern: FormData = Pick<Model, 'editableFields'>
```

### api/responses.ts

```typescript
/**
 * Standard API response wrappers
 * Every API call returns one of these
 */

// Single item response
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string;
}

// List response with pagination
export interface ListResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

// Mutation result
export interface MutationResult {
  success: boolean;
  id?: string;
  message?: string;
  error?: string;
}
```

### utils/guards.ts

```typescript
/**
 * Type guards for runtime type checking
 * Use these when receiving data from APIs
 */

import { User, Project } from '../models';

// Check if unknown data is a User
export function isUser(data: unknown): data is User {
  return (
    typeof data === 'object' &&
    data !== null &&
    'email' in data &&
    'displayName' in data &&
    'role' in data
  );
}

// Check if unknown data is a Project
export function isProject(data: unknown): data is Project {
  return (
    typeof data === 'object' &&
    data !== null &&
    'name' in data &&
    'status' in data
  );
}

// Usage example:
// const data = await fetchData();
// if (isUser(data)) {
//   console.log(data.email); // TypeScript knows it's a User
// }
```

---

## Migration Examples

### Before (Current Approach)

```typescript
// components/ProjectCard.tsx
import { Project, ProjectFormData, User } from '@/types/app';
// Where is Project? Line 31? 85? Have to search...
```

### After (New Approach)

```typescript
// components/ProjectCard.tsx
import { Project } from '@/types/models/project';
import { ProjectFormData } from '@/types/forms';
import { User } from '@/types/models/user';
// Crystal clear where each type lives
```

---

## Common Patterns to Follow

### Pattern 1: One Type, One Purpose

```typescript
// ❌ BAD: Mixed concerns
interface ProjectData {
  // Database fields
  id: string;
  name: string;
  // UI state
  isSelected?: boolean;
  // Form validation
  errors?: string[];
}

// ✅ GOOD: Separated concerns
interface Project {
  id: string;
  name: string;
}

interface ProjectUIState {
  isSelected: boolean;
}

interface ProjectValidation {
  errors: string[];
}
```

### Pattern 2: Progressive Disclosure

```typescript
// Start simple
type Status = 'active' | 'inactive';

// Extend when needed
type DetailedStatus = Status | 'pending' | 'archived';

// Rather than starting with everything
type ComplexStatus =
  | 'active'
  | 'inactive'
  | 'pending'
  | 'archived'
  | 'deleted'
  | 'suspended';
```

### Pattern 3: Descriptive Names

```typescript
// ❌ BAD: Unclear purpose
interface Data {}
interface Info {}
interface Params {}

// ✅ GOOD: Clear purpose
interface UserProfile {}
interface ProjectSettings {}
interface SearchFilters {}
```

---

## Success Metrics

### Immediate Benefits (Day 1)

- Find any type in <30 seconds (vs 2-3 minutes)
- Clear mental model of type organization
- Reduced file size from 256 to <100 lines each

### Week 1 Benefits

- 50% faster feature development
- 90% reduction in type-related confusion
- Zero duplicate type definitions

### Month 1 Benefits

- New developers onboard in hours, not days
- Type-related bugs near zero
- Confidence in making changes

---

## Tooling & Scripts

Add to package.json:

```json
{
  "scripts": {
    "type:check": "tsc --noEmit",
    "type:coverage": "npx ts-coverage",
    "type:find-any": "grep -r ': any' src/",
    "type:complexity": "find src/types -name '*.ts' | xargs wc -l",
    "type:deps": "madge --extensions ts --image graph.svg src/types"
  }
}
```

---

## FAQ for Beginners

**Q: Why not keep everything in one file?**
A: Mental overload. Your brain can hold ~7 things at once. One file with 23 types exceeds this.

**Q: Why separate models from forms?**
A: Models = complete data. Forms = what users can edit. Not the same thing.

**Q: How do I know where a type belongs?**
A: Ask "What is this type's primary purpose?"

- Describes data structure? → models/
- Used in forms? → forms/
- API communication? → api/
- Component props? → ui/

**Q: What if a type could go in multiple places?**
A: Put it where it's MOST used. Use imports for other places.

**Q: Should I refactor everything at once?**
A: No! Follow the phases. Gradual migration prevents breaking changes.

---

## Getting Help

When stuck:

1. Check the folder's README
2. Look for similar types as examples
3. Ask: "What would a new developer expect?"
4. Keep it simple - complexity can come later

---

## Final Checklist

Before considering this complete:

- [ ] Each type file is <100 lines
- [ ] Each folder has a clear, single purpose
- [ ] All types have JSDoc comments
- [ ] Type guards exist for external data
- [ ] No circular dependencies
- [ ] A new developer can find any type in <30 seconds
- [ ] You feel confident about where new types belong

---

## Maintenance Rules

Going forward:

1. **Review threshold**: If a file exceeds 100 lines, split it
2. **New features**: Always add types BEFORE implementation
3. **Documentation**: Every new type needs a comment
4. **Consistency**: Follow existing patterns in that folder
5. **Simplicity**: If you need to explain it, it's too complex

---

This reorganization will transform your development experience from "hunting through files" to "knowing exactly where everything is". The 6-day investment will pay back within the first week of use.
