# TypeScript Fixes Tracking

## Overview

This document tracks the systematic fixing of TypeScript errors after the JS to TS conversion.
Each file is fixed together with its test file to maintain consistency.

## Approach

1. Fix one file at a time with its corresponding test file
2. Document each type of error and its solution
3. Explain fixes clearly for TypeScript learning
4. Ensure both implementation and tests are type-safe

## Common TypeScript Error Patterns

### 1. Optional Parameters from useParams

**Problem**: `useParams()` returns `string | undefined` but functions expect `string`

```typescript
// ❌ Error: Type 'string | undefined' is not assignable to type 'string'
const { projectId } = useParams();
useDocuments({ entityId: projectId }); // expects string, not string | undefined
```

**CRITICAL - React Hooks Rule**: Never put early returns before hooks!

```typescript
// ❌ WRONG - Breaks React hooks rules!
const { projectId } = useParams();
if (!projectId) return <ErrorPage />; // DON'T DO THIS!
const [state, setState] = useState(); // Hook after conditional - BROKEN!
```

**Solution**: Handle undefined params AFTER all hooks

```typescript
// ✅ Correct: All hooks first, then handle undefined
const { projectId } = useParams();
const [state, setState] = useState(); // All hooks MUST come first
const documentsHook = useDocuments({
  entityId: projectId || '', // Use default value for hooks
});

// AFTER all hooks, then handle the error case
if (!projectId) {
  return <ErrorPage />;
}
// Now TypeScript knows projectId is definitely a string for the rest
```

### 2. Missing Type Exports

**Problem**: Types defined but not exported from index files

```typescript
// ❌ Error: Module has no exported member 'SomeType'
import { SomeType } from '@/hooks/documents';
```

**Solution**: Export types from index files

```typescript
// ✅ In index.ts
export type { SomeType } from './someFile';
```

### 3. Unused React Imports

**Problem**: React import not needed with new JSX transform

```typescript
// ❌ Warning: 'React' is declared but never used
import React from 'react';
```

**Solution**: Remove if not used directly

```typescript
// ✅ Remove unused import
// (JSX works without explicit React import in React 17+)
```

### 4. Type Mismatches in Props

**Problem**: Component expects different types than provided

```typescript
// ❌ Error: Type 'X' is not assignable to type 'Y'
<Component prop={wrongType} />
```

**Solution**: Fix the type or the usage

```typescript
// ✅ Ensure types match
<Component prop={correctType} />
```

### 5. Null vs Undefined

**Problem**: TypeScript distinguishes between null and undefined

```typescript
// ❌ Error: Type 'null' is not assignable to type 'undefined'
const value: string | undefined = null;
```

**Solution**: Use consistent nullish types

```typescript
// ✅ Be consistent with null/undefined
const value: string | null = null;
// or
const value: string | undefined = undefined;
```

## Files to Fix

### Priority 1: Page Components with Routes

These have useParams issues that need fixing first.

- [x] `src/pages/weld-log-overview/index.tsx` + tests ✅ COMPLETED
- [ ] `src/pages/project-overview/index.tsx` + tests
- [ ] `src/pages/weld-overview/index.tsx` + tests
- [ ] `src/pages/document-library-collection/index.tsx` + tests

### Priority 2: Component Files with Type Issues

- [ ] `src/components/PrivateRoute.tsx` + tests
- [ ] `src/components/documents/cards/*.tsx` + tests
- [ ] `src/components/documents/import/*.tsx` + tests
- [ ] `src/components/documents/sections/*.tsx` + tests

### Priority 3: Hook Files

- [ ] `src/hooks/documents/*.ts` + tests
- [ ] `src/hooks/firebase/*.ts` + tests
- [ ] Other hooks

### Priority 4: Utility and Config Files

- [ ] `src/utils/*.ts` + tests
- [ ] `src/config/*.ts` + tests
- [ ] Type definition files

## Progress Log

### 2024-01-XX: Starting Systematic Fixes

#### File: `src/pages/weld-log-overview/index.tsx` ✅ COMPLETED

**Errors Found:**

1. ❌ React hooks called after conditional return (CRITICAL!)
2. useParams returns undefined types
3. Missing SelectedItem export
4. Type mismatches in props
5. Error handling type issues
6. FirestoreError vs Error type mismatches
7. UploadingFile[] vs Record<string, UploadingFile> mismatch
8. Callback function type signatures don't match
9. ImportItem type conversion issues
10. WeldType mismatch ('SMAW' vs proper WeldType values)
11. WeldFormDialog props mismatch

**Fixes Applied:**

1. ✅ **CRITICAL FIX**: Moved all hooks before conditional returns

   ```typescript
   // All hooks FIRST
   const [state] = useState();
   const hook = useDocuments({ entityId: paramId || '' });

   // THEN handle missing params
   if (!paramId) return <ErrorPage />;
   ```

2. ✅ Exported SelectedItem from hooks/documents/index.ts
3. ✅ Fixed ImportItem conversion with null to undefined conversion (`?? undefined`)
4. ✅ Added null coalescing for FirestoreError types (`error || null`)
5. ✅ Converted UploadingFile[] to Record format using reduce
6. ✅ Fixed callback signatures with proper type assertions
7. ✅ Added proper null checks for data properties
8. ✅ Used default values for hooks when params undefined (`paramId || ''`)
9. ✅ Replaced WeldFormSubmissionData with SingleWeldFormData | MultipleWeldsFormData
10. ✅ Fixed WeldType to use 'production' instead of 'SMAW'
11. ✅ Removed projectId prop from WeldFormDialog (not part of interface)

#### File: `src/pages/weld-log-overview/index.test.tsx` ✅ COMPLETED

**Errors Fixed:**

1. ✅ Added missing vitest imports (describe, it, expect, vi, beforeEach)
2. ✅ Fixed mockTimestamp to include toJSON method
3. ✅ Replaced all `null` with `undefined` for FirestoreError types
4. ✅ Added `as any` type assertions for mock return values
5. ✅ Changed uploadingFiles from {} to []
6. ✅ Fixed FirestoreError mocks to include code property

**Lessons Learned:**

- **NEVER put early returns before React hooks** - breaks Rules of Hooks!
- Use default values (`|| ''` or `|| null`) for hooks when params might be undefined
- TypeScript is strict about `null` vs `undefined` - use `|| null` when needed
- Array to Record conversion: `array.reduce((acc, item) => ({ ...acc, [item.id]: item }), {})`
- Non-null assertion operator `!` tells TypeScript a value is not null: `event.over!.id`
- Type assertions with `as` when you know the type better than TypeScript
- Always check if data is an array before using array methods

---

## Notes for Learning TypeScript

### Key Concepts

1. **Type Guards**: Code that helps TypeScript narrow down types
2. **Type Assertions**: Telling TypeScript "trust me, I know this type"
3. **Generics**: Types that work with multiple types (like `Array<T>`)
4. **Union Types**: A value that can be one of several types (`string | number`)
5. **Optional Properties**: Properties that might not exist (`name?: string`)

### Best Practices

1. Avoid using `any` - it defeats the purpose of TypeScript
2. Use type guards instead of type assertions when possible
3. Define interfaces for object shapes
4. Export types that other files need
5. Keep types close to where they're used

## Next Steps

1. Continue with weld-log-overview/index.tsx
2. Fix its test file
3. Run type check to verify fixes
4. Move to next file in priority list
