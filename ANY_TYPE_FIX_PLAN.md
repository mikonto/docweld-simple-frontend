# ANY Type Fix Plan

## Current Status
- **Total warnings**: 415 (all `@typescript-eslint/no-explicit-any`)
- **Priority**: Fix critical types first, then gradually improve others
- **Approach**: Manual fixes to ensure proper typing

## Categories of `any` Types

### 🔴 Priority 1: Error Handling (CRITICAL)
Files with `error: any` that should be properly typed:
- [ ] `src/hooks/documents/useBaseDocumentOperations.ts` - line 49
- [ ] `src/hooks/documents/useDocumentImport.ts` 
- [ ] `src/hooks/documents/useFileUpload.ts`
- [ ] `src/hooks/documents/useFileUpload.test.ts`
- [ ] `src/hooks/documents/useSectionOperations.ts`
- [ ] `src/components/documents/sections/multi/sectionOperations.ts`
- [ ] `src/components/documents/sections/multi/sectionOperations.test.ts`
- [ ] `src/components/documents/sections/multi/Section.tsx`
- [ ] `src/components/documents/sections/multi/SectionsContainer.tsx`

**Fix**: `error: any` → `error: FirestoreError | undefined` or `error: Error | unknown`

### 🟠 Priority 2: Promise Types
Files with `Promise<any>`:
- [ ] Check all async functions return types
- [ ] Fix `Promise<any>` → `Promise<void>` or specific return type
- [ ] Update `updateDocumentOrder` functions

### 🟡 Priority 3: Function Parameters
Common patterns to fix:
- [ ] `(data: any)` → specific type
- [ ] `(e: any)` → proper event type
- [ ] Callback functions with any parameters

### 🟢 Priority 4: Test Mocks
- [ ] Mock function types
- [ ] Test data factories
- [ ] Mock return values

### 🔵 Priority 5: Firebase/Firestore Types
- [ ] DocumentData usage
- [ ] Query constraints
- [ ] Firestore operations

## Type Definitions Needed

### 1. Error Types
```typescript
type AppError = FirestoreError | StorageError | Error | unknown;
type AsyncResult<T> = Promise<{ success: boolean; data?: T; error?: AppError }>;
```

### 2. Document Types
```typescript
interface BaseDocument {
  id: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  status: Status;
}
```

### 3. Operation Results
```typescript
interface OperationResult<T = void> {
  success: boolean;
  data?: T;
  error?: AppError;
}
```

## Files to Fix (by priority)

### Core Hooks (High Priority)
1. `useBaseDocumentOperations.ts` - Central document operations
2. `useFileUpload.ts` - File handling
3. `useDocumentImport.ts` - Import functionality
4. `useSectionOperations.ts` - Section management

### Components (Medium Priority)
1. Section components in `/sections/multi/`
2. Data table components
3. Form dialogs

### Test Files (Low Priority)
- Can remain with `any` temporarily
- Fix when updating tests

## Tracking Progress

### Phase 1: Critical Errors ✅
- [ ] All `error: any` replaced
- [ ] Test that error handling still works

### Phase 2: Core Functions
- [ ] Promise types fixed
- [ ] Main hook parameters typed

### Phase 3: Components
- [ ] Event handlers typed
- [ ] Props properly typed

### Phase 4: Tests
- [ ] Mock types improved
- [ ] Test utilities typed

## Commands to Check Progress

```bash
# Count remaining any warnings
npm run lint 2>&1 | grep "warning.*any" | wc -l

# Check specific file
npm run lint 2>&1 | grep "useBaseDocumentOperations.ts" -A1 | grep "warning"

# Find error: any patterns
grep -r "error: any" src --include="*.ts" --include="*.tsx" | wc -l

# Find Promise<any> patterns  
grep -r "Promise<any>" src --include="*.ts" --include="*.tsx" | wc -l

# Find : any patterns
grep -r ": any" src --include="*.ts" --include="*.tsx" | wc -l
```

## Notes
- Fix one category at a time
- Test after each category
- Commit after each successful phase
- Don't use automated scripts - manual review ensures quality