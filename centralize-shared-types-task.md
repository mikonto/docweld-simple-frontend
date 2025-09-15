# Task: Centralize All Shared Types

## Objective

Identify and centralize all TypeScript types/interfaces that are used in 2 or more files to improve code organization and maintainability.

## Background

After completing the initial TypeScript reorganization (Phases 1-3), we discovered several types that are still defined inline but are actually shared across multiple files. These should be centralized according to the principle: **"1 file = keep inline, 2+ files = centralize"**.

## Success Criteria

- [ ] All types used in 2+ files are moved to centralized `/types` folders
- [ ] No duplicate type definitions exist across the codebase
- [ ] All imports are updated to use the centralized types
- [ ] TypeScript compiles without errors
- [ ] Clear folder structure for different type categories

---

## Discovered Shared Types to Centralize

### 1. Document Import Browser Types

**Current Location**: `src/hooks/documents/useImportBrowser.ts`

| Type            | Usage Count | Files Using It                  |
| --------------- | ----------- | ------------------------------- |
| `SelectedItem`  | 10 files    | Import components, hooks, pages |
| `BrowserState`  | 5 files     | Import hooks and tests          |
| `BrowserAction` | 4 files     | Import hooks                    |

**Proposed New Location**: `src/types/documents/import.ts`

### 2. Weld Form Types

**Current Location**: `src/pages/weld-log-overview/WeldFormDialog.tsx`

| Type                    | Usage Count | Files Using It                     |
| ----------------------- | ----------- | ---------------------------------- |
| `SingleWeldFormData`    | 4 files     | WeldFormDialog, index pages, tests |
| `MultipleWeldsFormData` | 4 files     | WeldFormDialog, index pages, tests |

**Proposed New Location**: `src/types/forms/weld-forms.ts`

### 3. Additional Shared Types Found

| Type                  | Current Location                              | Usage Count | Proposed Location      |
| --------------------- | --------------------------------------------- | ----------- | ---------------------- |
| `ProcessingState`     | `src/components/documents/constants.ts`       | 11 files    | `src/types/documents/` |
| `BreadcrumbData`      | `src/components/Breadcrumbs.tsx`              | 3 files     | `src/types/ui/`        |
| `ComboboxOption`      | `src/components/ui/combobox.tsx`              | Multiple    | `src/types/ui/`        |
| `MultiComboboxOption` | `src/components/ui/custom/multi-combobox.tsx` | Multiple    | `src/types/ui/`        |

### 4. Types That Should Stay Inline (Used in 1-2 files only)

- `DocumentLibraryTableProps` - Only used in component and its test
- `ProjectFormDialogProps` - Component-specific props
- `DialogData`, `DeleteDialog` - Only used in sectionOperations
- Various component props interfaces

---

## Implementation Plan

### Phase 1: Analysis (Current)

- [x] Search for all exported interfaces/types from non-type files
- [x] Count usage of each type across files
- [x] Identify which types need centralization
- [ ] Check for duplicate type definitions with different names

### Phase 2: Create New Type Files

- [ ] Create `src/types/documents/` folder
- [ ] Create `src/types/documents/import.ts` for import-related types
- [ ] Create `src/types/forms/weld-forms.ts` for weld form types
- [ ] Consider if dialog state types need their own file

### Phase 3: Move Types

For each type to centralize:

- [ ] Copy type definition to new location
- [ ] Add proper JSDoc comments
- [ ] Update all imports in files using the type
- [ ] Remove old type definition
- [ ] Run type-check after each move

### Phase 4: Verification

- [ ] Run full TypeScript type check
- [ ] Run test suite
- [ ] Check for any remaining duplicate definitions
- [ ] Update this document with results

---

## Search Commands for Finding Shared Types

```bash
# Find all exported interfaces/types in non-type directories
grep -r "^export (interface|type)" src --exclude-dir=types --include="*.ts" --include="*.tsx"

# Find specific type usage across files
grep -r "TypeName" src --include="*.ts" --include="*.tsx" | cut -d: -f1 | sort -u | wc -l

# Find potentially duplicate interfaces with similar names
grep -r "^(export )?interface.*Dialog" src --include="*.ts" --include="*.tsx"
grep -r "^(export )?interface.*Form" src --include="*.ts" --include="*.tsx"
grep -r "^(export )?interface.*State" src --include="*.ts" --include="*.tsx"
```

---

## Progress Tracking

### Types Successfully Centralized

- [ ] `SelectedItem` → `src/types/documents/import.ts`
- [ ] `BrowserState` → `src/types/documents/import.ts`
- [ ] `BrowserAction` → `src/types/documents/import.ts`
- [ ] `SingleWeldFormData` → `src/types/forms/weld-forms.ts`
- [ ] `MultipleWeldsFormData` → `src/types/forms/weld-forms.ts`

### Files Updated

<!-- Track which files have had their imports updated -->

- [ ] src/hooks/documents/useImportBrowser.ts
- [ ] src/hooks/documents/useImportSelection.ts
- [ ] src/hooks/documents/useImportDataFetching.ts
- [ ] src/components/documents/import/ImportBrowser.tsx
- [ ] src/pages/weld-log-overview/WeldFormDialog.tsx
- [ ] src/pages/weld-log-overview/index.tsx
- [ ] src/pages/weld-overview/index.tsx
- [ ] (and others...)

---

## Notes & Decisions

### Why Centralize?

1. **Single Source of Truth**: No duplicate definitions
2. **Easier Maintenance**: Update type in one place
3. **Better Discovery**: Clear where to find types
4. **Type Safety**: TypeScript can better track type usage
5. **Import Clarity**: `from '@/types/documents'` is clearer than `from '../hooks/useImportBrowser'`

### When NOT to Centralize

- Type is truly only used in one file
- Type is a simple component props interface
- Type is temporary/experimental

---

## Completion Checklist

- [ ] All shared types identified
- [ ] All shared types centralized
- [ ] All imports updated
- [ ] No TypeScript errors
- [ ] Tests pass
- [ ] Documentation updated
- [ ] Old inline types removed
- [ ] Team notified of changes

---

## Questions to Resolve

1. Should we create `src/types/documents/` or put document types in `src/types/api/`?
2. Should dialog state interfaces be centralized if they follow similar patterns?
3. Should we add a linting rule to prevent exporting types from non-type files?

---

Last Updated: [Current Date]
Status: **In Progress** 🚧
