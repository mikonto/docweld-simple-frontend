# ANY Type Fix Plan

## Current Status

- **Total warnings**: 0 🎉 (all `@typescript-eslint/no-explicit-any` eliminated!) - Down from 415! (415 warnings fixed - 100% improvement)
- **Priority**: ✅ All types have been properly fixed
- **Approach**: Manual fixes to ensure proper typing
- **Completed**:
  - ✅ Phase 1 - All `error: any` patterns have been fixed!
  - ✅ Phase 2 - All `Promise<any>` patterns have been fixed!
  - ✅ Phase 3 - Component event handlers typed!
  - ✅ Phase 4 - Test mock types improved!
  - ✅ Phase 5 - DataTable and hooks typed!
  - ✅ Phase 6 - DataTable internals and Firebase mocks typed!
  - ✅ Phase 7 - Test component mocks typed!
  - ✅ Phase 8 - Core components and test mocks typed!
  - ✅ Phase 9 - Console functions, Firebase mocks, and hook callbacks typed!
  - ✅ Phase 10 - Import dialog, component props, utility functions, and test mocks typed!
  - ✅ Phase 11 - Document import test mocks and section test components typed!
  - ✅ Phase 12 - Table component test mocks and page test components typed!
  - ✅ Phase 13 - Layout test mocks and production hook types fixed!
  - ✅ Phase 14 - Page components and confirmation dialog types fixed!
  - ✅ Phase 15 - Utility files and WeldLogs table components typed!
  - ✅ Phase 16 - Remaining production hooks and test component mocks typed!
  - ✅ Phase 17 - SectionsContainer test with 22 'as any' casts fixed!
  - ✅ Phase 18 - Test files (weld-logs/index.test.tsx and SelectionToolbar.test.tsx) with 36 'as any' casts fixed!
  - ✅ Phase 19 - Test files (SectionsList.test.tsx and project-overview/index.test.tsx) with 25 'as any' casts fixed!
  - ✅ Phase 20 - Additional test files and production hooks fixed (15 more warnings removed)!
  - ✅ Phase 21 - Test files and utilities cleanup (12 more warnings removed)!
  - ✅ Phase 22 - Comprehensive test file cleanup (16 more warnings removed)!
  - ✅ Phase 23 - Final test utilities and hook tests cleanup (11 more warnings removed)!
  - ✅ Phase 24 - Complete elimination of all remaining `any` warnings (23 more warnings removed)!

## Categories of `any` Types

### ✅ Priority 1: Error Handling (COMPLETED)

Files with `error: any` that have been fixed:

- [x] `src/hooks/documents/useBaseDocumentOperations.ts` - ✅ Fixed in previous session
- [x] `src/hooks/documents/useDocumentImport.ts` - ✅ Fixed
- [x] `src/hooks/documents/useFileUpload.ts` - ✅ Fixed
- [x] `src/hooks/documents/useFileUpload.test.ts` - ✅ Fixed
- [x] `src/hooks/documents/useSectionOperations.ts` - ✅ Fixed
- [x] `src/components/documents/sections/multi/sectionOperations.ts` - ✅ Fixed
- [x] `src/components/documents/sections/multi/sectionOperations.test.ts` - ✅ Fixed
- [x] `src/components/documents/sections/multi/Section.tsx` - ✅ Fixed
- [x] `src/components/documents/sections/multi/SectionsContainer.tsx` - ✅ Fixed

**All error handling has been properly typed with `error: unknown` and type guards!**

### ✅ Priority 2: Promise Types (COMPLETED)

Files that had `Promise<any>` - all fixed:

- [x] useBaseDocumentOperations.ts - Fixed to `Promise<UploadResults>`
- [x] useFileUpload.ts - Fixed to proper return types
- [x] All `updateDocumentOrder` functions - Fixed to `Promise<{ success: boolean; error?: Error | unknown }>`

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

- [x] All `error: any` replaced - **COMPLETED**
- [x] Test that error handling still works - **Application running successfully**

### Phase 2: Core Functions ✅

- [x] Promise types fixed - **COMPLETED**
- [x] Main hook parameters typed - **Dialog<T> and interfaces fixed**

### Phase 3: Components ✅

- [x] Event handlers typed - **onClick, onSubmit handlers fixed**
- [x] Props properly typed - **Component interfaces improved**

### Phase 4: Tests ✅

- [x] Mock types improved - **Created mockTimestamp utility, fixed hook mocks**
- [x] Test utilities typed - **Fixed vi.fn() types and mock return values**

### Phase 5: DataTable & Production Code Types ✅

- [x] Created `/src/test/types/mockTypes.ts` - **Reusable mock type definitions**
- [x] Fixed DataTable mock in test files - **Typed props and columns**
- [x] Fixed UsersTable column types - **Added Column<User> and Row<User> types**
- [x] Fixed useImportSelection hook - **Created SelectableItem union type**
- [x] Fixed ParticipantsTable column types - **Typed with ProjectParticipant**

### Phase 6: DataTable Internals & Firebase Mocks ✅

- [x] Fixed DataTable BulkActionButton - **Generic type `BulkActionButton<TData>`**
- [x] Fixed DataTable columns - **Changed `ColumnDef<TData, any>` to `ColumnDef<TData, unknown>`**
- [x] Fixed DataTable sorting state - **Added `SortingState` type from @tanstack/react-table**
- [x] Fixed DataTable row handlers - **Typed with `Row<TData>` from @tanstack/react-table**
- [x] Fixed Firebase mock types - **Replaced `any` with proper types in firebase.ts**
- [x] Fixed Storage mock types - **Added proper `MockStorageSnapshot` interface**

### Phase 7: Test Component Mocks ✅

- [x] Created type interfaces for mock components - **MockCollection, MockSection, MockDocument**
- [x] Fixed ImportBrowser test mocks - **All component mocks properly typed**
- [x] Fixed mock selectedItems - **Typed as `MockSelectedItem[]`**
- [x] Fixed mock event handlers - **Proper function signatures for all callbacks**

### Phase 8: Core Components & Test Mocks ✅

- [x] Fixed ActionsCell component - **Changed `TData = any` to `TData = unknown`**
- [x] Fixed ColumnDef component - **All generics use `unknown` instead of `any`**
- [x] Fixed test setup file - **ThemeProvider mock properly typed**
- [x] Fixed PrivateRoute tests - **Removed all `as any` casts with proper types**
- [x] Created MockToast interface - **Typed toast mock functions**
- [x] Fixed useApp mock returns - **Complete UseAuthWithFirestoreReturn type**

## Progress Summary

### Warnings Reduced

- **Starting**: 415 warnings
- **After Phase 1**: 401 warnings (-14)
- **After Phase 2**: 394 warnings (-7)
- **After Phase 3**: 372 warnings (-22)
- **After Phase 4**: 359 warnings (-13)
- **After Phase 5**: 335 warnings (-24)
- **After Phase 6**: 321 warnings (-14)
- **After Phase 7**: 311 warnings (-10)
- **After Phase 8**: 297 warnings (-14)
- **After Phase 9**: 276 warnings (-21)
- **After Phase 10**: 261 warnings (-15)
- **After Phase 11**: 242 warnings (-19)
- **After Phase 12**: 202 warnings (-40)
- **After Phase 13**: 189 warnings (-13)
- **After Phase 14**: 179 warnings (-10)
- **After Phase 15**: 170 warnings (-9)
- **After Phase 16**: 160 warnings (-10)
- **After Phase 17**: 138 warnings (-22)
- **After Phase 18**: 102 warnings (-36)
- **After Phase 19**: 77 warnings (-25)
- **After Phase 20**: 62 warnings (-15)
- **After Phase 21**: 50 warnings (-12)
- **After Phase 22**: 34 warnings (-16)
- **After Phase 23**: 23 warnings (-11)
- **After Phase 24**: 0 warnings (-23)
- **Total Reduction**: 415 warnings fixed (100% improvement) 🎉

### Patterns Fixed

- ✅ All `error: any` → `error: unknown` with type guards
- ✅ All `Promise<any>` → Proper Promise types
- ✅ `Dialog<T = any>` → `Dialog<T = unknown>`
- ✅ `TranslationFunction` options properly typed
- ✅ `WeldFormDialog` onSubmit properly typed with union types
- ✅ `UsersTable` onClick handlers typed with `User[]`
- ✅ Import interfaces improved with specific types
- ✅ Created `mockTimestamp` utility for test files
- ✅ Fixed `useSignOut` hook mock types
- ✅ Typed `vi.fn()` mock functions properly
- ✅ DataTable column definitions with `Column<T>` and `Row<T>` types
- ✅ Created reusable `/src/test/types/mockTypes.ts` for test mocks
- ✅ `useImportSelection` hook with `SelectableItem` union type
- ✅ DataTable internal types with `SortingState` and `Row<TData>`
- ✅ Firebase/Firestore mock types with proper interfaces
- ✅ Storage mock snapshot types with defined properties
- ✅ Test component mocks with proper type interfaces
- ✅ Mock event handlers in tests with typed callbacks
- ✅ Core DataTable components with generic `TData = unknown`
- ✅ Test mock returns with complete interface implementations
- ✅ Console override functions with `unknown[]` parameters
- ✅ Firebase mock array functions with proper types
- ✅ Hook test callbacks with specific interfaces
- ✅ Translation mock functions with `Record<string, unknown>` params
- ✅ Generic function types using `unknown` instead of `any`
- ✅ ImportDialog with `SelectedItem[]` type from hooks
- ✅ File utility functions with proper type casting
- ✅ Section components with proper dialog types
- ✅ DataTable test files with `ColumnDef<T, unknown>`
- ✅ PublicRoute tests with `UseAuthWithFirestoreReturn` type
- ✅ Checkbox mock components with proper event handler types
- ✅ ImportBrowser test mocks with typed props
- ✅ Section test mocks with typed document arrays
- ✅ DndContext mocks with proper event types
- ✅ Dialog state management with complete type interfaces
- ✅ DataTable test mocks with full column and data type interfaces
- ✅ Table test components with typed action and bulk action buttons
- ✅ Page test mocks with proper component prop types
- ✅ StandaloneSection mocks with dropdown action types
- ✅ ErrorLoadingWrapper and form mocks with typed props
- ✅ Layout test component mocks with `[key: string]: unknown` patterns
- ✅ useDocumentImport production hook with proper ImportItem interface
- ✅ fileUploadHelpers with typed FirestoreConfig
- ✅ useDocuments test with proper type casting using UseDocumentsConfig
- ✅ useImportBrowser with typed SelectedItem and action payloads
- ✅ Page components with proper Array.isArray() checks for bulk operations
- ✅ useConfirmationDialog with typed IdentifiableEntity interface
- ✅ WeldFormDialog with typed Material extensions
- ✅ weld-log-overview with DragEndEvent and SelectedItem types
- ✅ userInitials utility with typed UserWithName interface
- ✅ confirmationContent utility with typed TFunction options
- ✅ orderManagement utility with typed IdentifiableItem interface
- ✅ WeldLogsTable with Column<WeldLog> and Row<WeldLog> types
- ✅ Welds component with ExtendedWeld interface for Firestore fields
- ✅ useSectionOperations with SectionOperationResult error type
- ✅ fileUploadHelpers processUploadResults with PromiseSettledResult<unknown>
- ✅ useDocumentImport interface without union types with any
- ✅ weld-log-overview ExtendedWeldFormData positions type
- ✅ DataTablePagination test MockTableOverrides with unknown[]
- ✅ UploadCard test with ReturnType<typeof useDragAndDrop>
- ✅ SectionsContainer.test.tsx with proper typed mocks for all hooks
- ✅ Created typed interfaces for UseSectionsReturn, UseDocumentsReturn, UseDocumentImportReturn
- ✅ Removed all 22 'as any' casts from SectionsContainer.test.tsx
- ✅ weld-logs/index.test.tsx with typed hook returns and proper Timestamp types
- ✅ SelectionToolbar.test.tsx with fully typed Section[] and Document[] mock data
- ✅ Created type definitions for all hook returns in test files
- ✅ SectionsList.test.tsx with properly typed Section objects using mockTimestamp
- ✅ project-overview/index.test.tsx with MockedFunction types and FirestoreError types
- ✅ Replaced all `new Date() as any` with `mockTimestamp as Timestamp`
- ✅ Phase 20 improvements:
  - Fixed `useDocumentImport.ts` production hook - removed union types with `any`
  - Fixed `DataTablePagination.test.tsx` - `Table<unknown>` instead of `Table<any>`
  - Fixed `ImportFooter.test.tsx` - properly typed `SelectedItem` arrays
  - Fixed `sectionOperations.test.ts` - exported `DeleteDialog` interface and typed mocks
  - Fixed `StandaloneSection.test.tsx` - properly typed `LucideIcon` mocks
  - Fixed `StandaloneSectionContent.test.tsx` - replaced mock file casts with `new File()`
  - Fixed `test-utils.ts` - `Record<string, unknown>` instead of `Record<string, any>`
- ✅ Phase 21 improvements:
  - Fixed `ConfirmationDialog.test.tsx` - properly typed i18n mock with `ReturnType<typeof useTranslation>['i18n']`
  - Fixed `multi-combobox.test.tsx` - `Record<string, unknown>` for translation params
  - Fixed `useFileUpload.test.ts` - created `MockUploadTask` interface and removed unnecessary casts
  - Fixed `company-profile/index.test.tsx` - removed unnecessary `as any` cast from mocked hook
  - Fixed `document-library/index.test.tsx` - removed `as any` cast from useConfirmationDialog mock
  - Fixed `useDocumentImport.test.ts` - properly typed mock functions and batch operations
- ✅ Phase 22 improvements:
  - Fixed `DataTablePagination.test.tsx` - remaining `Table<any>` to `Table<unknown>`
  - Fixed `sectionOperations.test.ts` - replaced file string casts with proper `new File()` constructors
  - Fixed `documentImportHelpers.test.ts` - imported mockTimestamp and replaced `{} as any` with proper Timestamp types
  - Fixed `useDocumentDisplay.test.ts` - properly typed global Image mock and removed unnecessary casts
  - Fixed `weld-log-overview/index.test.tsx` - removed unnecessary `as any` cast from mockWeldLog
  - Fixed `dateFormatting.test.ts` - used `vi.mocked(i18n)` to properly type i18n mock throughout file
- ✅ Phase 23 improvements:
  - Fixed `test-utils.ts` - `MockFirestoreDocument` using `Record<string, unknown>`
  - Fixed `useConfirmationDialog.test.ts` - translation function params typed as `Record<string, unknown>`
  - Fixed `confirmationContent.test.ts` - mock translation function properly typed
  - Fixed `useFirestoreOperations.test.ts` - invalid input tests using `unknown` type assertions
  - Fixed `useSections.test.ts` - exported and imported `UseSectionsConfig` interface
  - Fixed `projects/index.test.tsx` - removed unnecessary `as any` cast from confirmation dialog mock
- ✅ Phase 24 - Complete elimination of all remaining warnings:
  - Fixed `useDocumentImport.test.ts` - `QuerySnapshot<DocumentData>` type for mock collections
  - Fixed `company-profile/index.test.tsx` - `MockedFunction` type for mocked hooks
  - Fixed `document-library/index.test.tsx` - removed unnecessary `as any` casts from mock returns
  - Fixed `material-management/index.test.tsx` - `MockedFunction` types for all mocked hooks
  - Fixed `WeldLogFormDialog.test.tsx` - replaced Date casts with `mockTimestamp as Timestamp`
  - Fixed `WeldLogsTable.test.tsx` - `Record<string, unknown>` for row data access
  - Fixed `DocumentsGrid.test.tsx` - replaced all Date casts with `mockTimestamp as Timestamp`
  - Fixed `test/setup.ts` - proper global type assertions for IntersectionObserver and ResizeObserver

## Commands to Check Progress

```bash
# Count remaining any warnings
npm run lint 2>&1 | grep "warning.*any" | wc -l

# Check specific file
npm run lint 2>&1 | grep "useBaseDocumentOperations.ts" -A1 | grep "warning"

# Find error: any patterns (should be 0)
grep -r "error: any" src --include="*.ts" --include="*.tsx" | wc -l

# Find Promise<any> patterns (should be 0)
grep -r "Promise<any>" src --include="*.ts" --include="*.tsx" | wc -l

# Find : any patterns (still many remaining)
grep -r ": any" src --include="*.ts" --include="*.tsx" | wc -l
```

## Notes

- Fix one category at a time
- Test after each category
- Commit after each successful phase
- Don't use automated scripts - manual review ensures quality
