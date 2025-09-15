# TypeScript Guidelines for Commercial MVP - DocWeld Project

## Critical Context

**Project**: DocWeld - A welding management platform  
**Developer Level**: TypeScript-focused development  
**Goal**: Build a commercial MVP that is production-ready  
**Priority**: Dead simple implementation that is still professional and robust  
**Anti-goal**: Over-engineering or complex patterns that add confusion

---

## Core Principles

### MUST Follow

1. **Simplicity First** - If a simpler solution exists, use it
2. **Type Safety at Boundaries** - Focus typing efforts on API calls and user inputs
3. **Progressive Enhancement** - Start with basic types, refine later
4. **No Premature Abstraction** - Don't create generic types until you need them 3+ times
5. **Maintain Type Discipline** - Keep types accurate and up-to-date as code evolves

### MUST Avoid

- Complex generic types
- Nested type manipulations
- Over-abstraction
- Trying to type everything perfectly on first pass
- Using `any` for laziness (use `unknown` instead)

---

## Project Type Structure

### File Organization (Keep It Simple)

```
src/
├── types/              # ALL TypeScript types in 4 files only
│   ├── index.ts        # Central export point (exports everything)
│   ├── models.ts       # Business data models (User, Project, Weld, etc.)
│   ├── api.ts          # API requests/responses
│   └── ui.ts           # React component props
│
├── pages/              # Existing page components
├── components/         # Existing UI components
├── hooks/              # Existing React hooks
└── utils/              # Existing utilities
```

**Rule**: Start with just these 4 files. Only create more when these become larger than 200 lines.

---

## Type Definitions

### models.ts - Business Data Types

```typescript
// types/models.ts
// Purpose: Define the shape of your business data

// Base type - everything extends this
export interface BaseModel {
  id: string;
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
  status: 'active' | 'deleted';
  companyId: string;
}

// User - keep it simple
export interface User extends BaseModel {
  email: string;
  displayName: string;
  role: 'admin' | 'user' | 'viewer';
}

// Project
export interface Project extends BaseModel {
  name: string;
  description?: string; // ? means optional
  ownerId: string;
  participantIds: string[];
}

// Weld Log
export interface WeldLog extends BaseModel {
  projectId: string;
  logNumber: string;
  date: string;
  welderIds: string[];
}

// Individual Weld
export interface Weld extends BaseModel {
  weldLogId: string;
  weldNumber: string;
  status: WeldStatus;
  wpsNumber?: string;
  materialIds: {
    parent?: string;
    filler?: string;
  };
}

// Status as a type (not enum - simpler!)
export type WeldStatus =
  | 'planned'
  | 'in_progress'
  | 'completed'
  | 'inspected'
  | 'approved'
  | 'rejected';

// Material
export interface Material extends BaseModel {
  name: string;
  type: 'parent' | 'filler' | 'alloy';
  specification: string;
  thickness?: number;
}

// Document
export interface Document extends BaseModel {
  title: string;
  type: string;
  url?: string;
  projectId?: string;
}
```

### api.ts - API Communication Types

```typescript
// types/api.ts
// Purpose: Types for communicating with backend

import { User, Project, Weld, WeldLog, Material, Document } from './models';

// Wrapper for all API responses
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// Pagination (used everywhere)
export interface PaginationParams {
  page: number;
  limit: number;
}

// List response
export interface ListResponse<T> {
  items: T[];
  total: number;
  page: number;
}

// Simple request types (only what differs from model)
export type CreateProjectRequest = Pick<Project, 'name' | 'description'>;
export type UpdateProjectRequest = Partial<CreateProjectRequest>;

export type CreateWeldRequest = Pick<
  Weld,
  'weldNumber' | 'weldLogId' | 'status'
>;
export type UpdateWeldRequest = Partial<Weld>;

// Firebase specific
export interface FirebaseQuery {
  collection: string;
  where?: Array<{
    field: string;
    operator: '==' | '!=' | '<' | '>' | '<=' | '>=';
    value: any;
  }>;
  orderBy?: string;
  limit?: number;
}
```

### ui.ts - Component Props Types

```typescript
// types/ui.ts
// Purpose: Props for React components

import { ReactNode } from 'react';

// Dialog props (all dialogs use this)
export interface DialogProps {
  open: boolean;
  onClose: () => void;
}

// Form props (all forms use this)
export interface FormProps<T> {
  initialData?: T;
  onSubmit: (data: T) => void | Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

// Table props (simple version)
export interface TableProps<T> {
  data: T[];
  columns: TableColumn<T>[];
  onRowClick?: (item: T) => void;
  loading?: boolean;
}

export interface TableColumn<T> {
  key: keyof T | 'actions'; // Allow 'actions' as special column
  label: string;
  width?: string;
  render?: (item: T) => ReactNode;
}

// Card props
export interface CardProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  onClick?: () => void;
}

// Select/Dropdown props
export interface SelectOption {
  value: string;
  label: string;
}

// Common props for form fields
export interface FieldProps {
  label: string;
  error?: string;
  required?: boolean;
  disabled?: boolean;
}
```

### index.ts - Central Export

```typescript
// types/index.ts
// Purpose: Single import point for all types

// Re-export everything
export * from './models';
export * from './api';
export * from './ui';

// Add 2-3 utility types maximum
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type ValueOf<T> = T[keyof T];
```

---

## Implementation Examples

### Example 1: React Component with Types

```typescript
// pages/projects/ProjectCard.tsx
import { Project, CardProps } from '@/types';

interface ProjectCardProps extends CardProps {
  project: Project;
  onEdit?: (project: Project) => void;
  onDelete?: (id: string) => void;
}

export function ProjectCard({
  project,
  onEdit,
  onDelete,
  ...cardProps  // Pass through other CardProps
}: ProjectCardProps) {
  return (
    <Card {...cardProps}>
      <h3>{project.name}</h3>
      <p>{project.description || 'No description'}</p>
      {onEdit && (
        <Button onClick={() => onEdit(project)}>Edit</Button>
      )}
      {onDelete && (
        <Button onClick={() => onDelete(project.id)}>Delete</Button>
      )}
    </Card>
  );
}
```

### Example 2: Custom Hook with Types

```typescript
// hooks/useProjects.ts
import { useState, useEffect } from 'react';
import { Project, ApiResponse, ListResponse } from '@/types';

interface UseProjectsReturn {
  projects: Project[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useProjects(): UseProjectsReturn {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/projects');
      const data: ApiResponse<ListResponse<Project>> = await response.json();

      if (data.success && data.data) {
        setProjects(data.data.items);
      } else {
        setError(data.error || 'Failed to fetch projects');
      }
    } catch (err) {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  return { projects, loading, error, refetch: fetchProjects };
}
```

### Example 3: Form Component with Types

```typescript
// components/forms/WeldForm.tsx
import { useState } from 'react';
import { Weld, FormProps, WeldStatus } from '@/types';

type WeldFormData = Pick<Weld, 'weldNumber' | 'status' | 'wpsNumber'>;

export function WeldForm({
  initialData,
  onSubmit,
  onCancel,
  loading
}: FormProps<WeldFormData>) {
  const [formData, setFormData] = useState<WeldFormData>(
    initialData || {
      weldNumber: '',
      status: 'planned',
      wpsNumber: ''
    }
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
  };

  const updateField = (field: keyof WeldFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <form onSubmit={handleSubmit}>
      <Input
        label="Weld Number"
        value={formData.weldNumber}
        onChange={(e) => updateField('weldNumber', e.target.value)}
        required
        disabled={loading}
      />

      <Select
        label="Status"
        value={formData.status}
        onChange={(e) => updateField('status', e.target.value as WeldStatus)}
        disabled={loading}
      >
        <option value="planned">Planned</option>
        <option value="in_progress">In Progress</option>
        <option value="completed">Completed</option>
      </Select>

      <Button type="submit" disabled={loading}>
        {loading ? 'Saving...' : 'Save'}
      </Button>
      <Button type="button" onClick={onCancel} variant="outline">
        Cancel
      </Button>
    </form>
  );
}
```

---

## Common Patterns for MVP

### Pattern 1: Loading States

```typescript
// Simple loading state type
interface LoadingState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

// Usage
const [state, setState] = useState<LoadingState<Project[]>>({
  data: null,
  loading: true,
  error: null,
});
```

### Pattern 2: Form Validation (Keep It Simple)

```typescript
// Don't over-engineer validation
interface ValidationErrors {
  [fieldName: string]: string | undefined;
}

function validateWeld(data: Partial<Weld>): ValidationErrors {
  const errors: ValidationErrors = {};

  if (!data.weldNumber) {
    errors.weldNumber = 'Weld number is required';
  }

  if (!data.weldLogId) {
    errors.weldLogId = 'Must be associated with a weld log';
  }

  return errors;
}
```

### Pattern 3: Type Guards (For Runtime Safety)

```typescript
// Simple type guard
export function isUser(value: unknown): value is User {
  return (
    typeof value === 'object' &&
    value !== null &&
    'email' in value &&
    'displayName' in value
  );
}

// Usage
const data: unknown = await fetchSomeData();
if (isUser(data)) {
  // TypeScript now knows data is a User
  console.log(data.email);
}
```

---

## Step-by-Step Implementation Plan

### Phase 1: Foundation (Week 1)

1. Create the 4 type files exactly as shown above
2. Add types to ONE complete feature (e.g., Projects)
3. Ensure no TypeScript errors in that feature
4. Test that feature thoroughly

### Phase 2: Expansion (Week 2)

1. Add types to all data fetching hooks
2. Type all form components
3. Type all API calls
4. Remove any usage of `any` (replace with `unknown` or specific types)

### Phase 3: Refinement (Week 3)

1. Add simple validation functions
2. Add 3-5 type guards for critical data
3. Type any remaining components
4. Run full type check and fix all errors

### Phase 4: Polish (Week 4)

1. Add JSDoc comments to complex types
2. Ensure consistent naming patterns
3. Final type coverage check
4. Deploy MVP

---

## Debugging TypeScript Errors

### Most Common Beginner Errors and Solutions

```typescript
// Error: "Property 'x' does not exist on type 'never'"
// Cause: TypeScript can't infer the type
// Solution: Explicitly type your state
const [data, setData] = useState<Project[]>([]); // Add <Project[]>

// Error: "Argument of type 'string' is not assignable to parameter of type 'WeldStatus'"
// Cause: TypeScript doesn't know your string is a valid status
// Solution: Type assertion (only when you're sure!)
const status = e.target.value as WeldStatus;

// Error: "Object is possibly 'undefined'"
// Cause: Optional property might not exist
// Solution: Check it exists first
if (project.description) {
  console.log(project.description.toUpperCase());
}
// Or use optional chaining
console.log(project.description?.toUpperCase());

// Error: "Property 'id' does not exist on type 'unknown'"
// Cause: TypeScript doesn't know the type of your data
// Solution: Type your API responses
const response = await fetch('/api/user');
const data: ApiResponse<User> = await response.json();
```

---

## Scripts for package.json

Add these scripts for TypeScript management:

```json
{
  "scripts": {
    "type-check": "tsc --noEmit",
    "type-check:watch": "tsc --noEmit --watch",
    "find-any": "grep -r ': any' --include='*.ts' --include='*.tsx' src/",
    "pre-commit": "npm run type-check"
  }
}
```

---

## tsconfig.json Settings for MVP

```json
{
  "compilerOptions": {
    // Strictness (balanced for beginner)
    "strict": false, // Start with false, enable later
    "noImplicitAny": true, // Catch missing types
    "strictNullChecks": true, // Catch null/undefined errors

    // Module Resolution
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"],
      "@/types": ["./src/types"]
    },

    // React
    "jsx": "react-jsx",
    "lib": ["dom", "dom.iterable", "esnext"],

    // Output
    "target": "es5",
    "module": "esnext",
    "moduleResolution": "node",
    "allowJs": true,
    "skipLibCheck": true,

    // Helpers
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true
  },
  "include": ["src"],
  "exclude": ["node_modules", "build", "dist"]
}
```

---

## DO's and DON'Ts for MVP

### DO's ✅

- Start with typing data structures (models)
- Type function parameters and return values
- Use interfaces for objects
- Keep types close to usage initially
- Use TypeScript errors as a learning tool
- Copy patterns from working code
- Ask "what could go wrong?" and add types to prevent it

### DON'Ts ❌

- Don't create abstract generic types yet
- Don't worry about 100% type coverage
- Don't use `any` when you're unsure (use `unknown`)
- Don't create types for types sake
- Don't spend more than 5 minutes on any single type error
- Don't sacrifice type safety for convenience
- Don't use advanced TypeScript features (conditional types, mapped types, etc.)

---

## Success Metrics for MVP

Your TypeScript implementation is ready for production when:

### Must Have ✅

- [ ] `npm run type-check` passes without errors
- [ ] All API calls are typed
- [ ] All form inputs are typed
- [ ] No `any` types in business logic
- [ ] Can catch obvious bugs before runtime

### Nice to Have (Post-MVP)

- [ ] 80%+ type coverage
- [ ] Runtime validation matches types
- [ ] Auto-generated types from backend
- [ ] Complex type utilities

---

## Getting Help

When stuck on TypeScript:

1. **Error messages**: Read them carefully - they usually tell you exactly what's wrong
2. **Quick fix**: VS Code's quick fix (Ctrl+.) solves 80% of TypeScript errors
3. **Type inference**: Hover over variables to see what TypeScript thinks they are
4. **Simplify**: If a type is too complex, break it into smaller pieces
5. **Escape hatch**: Use `as unknown as YourType` as last resort (mark with TODO)

---

## Final Advice

**Remember**: TypeScript is a tool to help you ship better code faster, not a burden. For an MVP, aim for "good enough" types that catch obvious errors. You can always improve them later when you have paying customers.

**The goal**: Types that would help a new developer (or you in 6 months) understand what the code does without reading the implementation.

**Success looks like**: Shipping a working MVP where TypeScript caught bugs before your users did.

---

## Questions for AI Assistant

When implementing with AI assistance, provide this context:

- "I'm building a commercial MVP"
- "I'm a TypeScript beginner"
- "Keep types simple but professional"
- "This is a welding management platform"
- "I need production-ready but not over-engineered"

Ask AI to:

- Check if types match the patterns in this guide
- Suggest simpler alternatives if types get complex
- Help with specific TypeScript errors
- Review types for a specific feature before implementing
