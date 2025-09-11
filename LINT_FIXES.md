# Lint Fixes Tracking Document

## Overview
This document tracks all ESLint errors and warnings that need to be fixed in the codebase.

**Last Updated:** 2025-09-11

**Current Status:**
- 🔴 **38 Errors** (Critical - must fix) ↓ from 65
- 🟡 **424 Warnings** (Should fix for code quality) ↓ from 426
- Total: **462 issues** ↓ from 491

**Progress:**
- ✅ **27 errors fixed** (41.5% reduction)
- ✅ **29 total issues resolved**

## Categories of Issues

### 1. 🔴 ERRORS (38 remaining, 27 fixed) - Must Fix

#### 1.1 Unused Type Definitions (32 remaining, 17 fixed)
These types are defined but never used. Need to determine if they should be:
- Exported for external use
- Removed if truly unused
- Prefixed with underscore if intentionally unused

**Files with unused types:**
- `src/types/app.ts` - CompanyInformation, LoginFormData, UserDbData, UserRole, etc.
- `src/types/database.ts` - UploadResult, DocumentQuery, SectionQuery, DeleteResult
- `src/types/test-utils.ts` - MockedHookReturn, MockProps, MockChangeEvent, MockMouseEvent, MockDragEvent, isDefined, isError, createTestFactory
- `src/hooks/` - Multiple hooks with unused type exports
- `src/contexts/` - LoggedInUser, CollectionName

#### 1.2 Import Issues (16 errors)
- Missing imports or incorrect import paths
- Unused imports (vi from vitest, etc.)

### 2. 🟡 WARNINGS (426 total) - Should Fix

#### 2.1 TypeScript `any` Usage (423 warnings)
Files heavily using `any`:
- Test files (*.test.tsx) - Mock functions and test utilities
- Component props in data-table components
- Hook return types and parameters
- Firebase/Firestore related types

#### 2.2 ESLint Directive Issues (3 warnings)
- Unused eslint-disable directives in coverage files

## Action Plan

### Phase 1: Fix Critical Errors (Target: Immediate)
- [ ] Review and fix unused type exports
- [ ] Determine which types are part of public API
- [ ] Remove truly unused types
- [ ] Fix import issues

### Phase 2: Reduce `any` Usage (Target: Progressive)
Priority order:
1. [ ] Production code components
2. [ ] Hooks and utilities
3. [ ] Test files (lower priority)

### Phase 3: Clean Code (Target: Ongoing)
- [ ] Remove unnecessary ESLint disables
- [ ] Add proper typing to all functions
- [ ] Document any remaining `any` usage with justification

## File-by-File Breakdown

### Critical Files (Most Errors)

#### `src/types/test-utils.ts` (10+ errors)
- [ ] Remove or export: MockedHookReturn
- [ ] Remove or export: MockProps
- [ ] Remove or export: MockChangeEvent
- [ ] Remove or export: MockMouseEvent
- [ ] Remove or export: MockDragEvent
- [ ] Remove or export: isDefined
- [ ] Remove or export: isError
- [ ] Remove or export: createTestFactory
- [ ] Fix all `any` types with proper generics

#### `src/types/app.ts` (4 errors)
- [ ] Review: UserRole usage
- [ ] Review: CompanyInformation usage
- [ ] Review: LoginFormData usage
- [ ] Review: UserDbData usage

#### `src/types/database.ts` (4 errors)
- [ ] Review: UploadResult usage
- [ ] Review: DocumentQuery usage
- [ ] Review: SectionQuery usage
- [ ] Review: DeleteResult usage

### High Warning Files (Most `any` usage)

#### Data Table Components
- `src/components/data-table/DataTable.tsx` (5+ warnings)
- `src/components/data-table/DataTablePagination.test.tsx` (4+ warnings)
- `src/components/data-table/ColumnDef.tsx` (5+ warnings)

#### Hook Files
- `src/hooks/documents/` - Multiple files with `any` in types
- `src/hooks/firebase/` - Firestore operation types

#### Test Files
- Most test files use `any` for mocks (lower priority to fix)

## Commands for Tracking Progress

```bash
# Count total issues
npm run lint 2>&1 | tail -5

# Count errors only
npm run lint 2>&1 | grep "error" | wc -l

# Count warnings only  
npm run lint 2>&1 | grep "warning" | wc -l

# List files with most issues
npm run lint 2>&1 | grep -E "^/" | sort | uniq -c | sort -rn | head -10

# Find all unused exports
npm run lint 2>&1 | grep "is defined but never used"

# Find all any usage
npm run lint 2>&1 | grep "Unexpected any"
```

## Guidelines for Fixes

### For Unused Types
1. Check if the type is exported from an index file
2. Search for imports of this type in other files
3. If truly unused, remove it
4. If needed for future use, prefix with underscore: `_TypeName`

### For `any` Types
1. Determine the actual type from usage
2. Create proper interfaces/types if needed
3. Use generics where appropriate
4. Document with comments if `any` is truly necessary

### For Test Files
- It's acceptable to use `any` for mock functions
- Consider creating a `test-utils` file with properly typed mocks
- Use `unknown` instead of `any` where possible

## Progress Tracking

- [x] Phase 1 Started
- [x] Phase 1 41.5% Complete (27/65 errors fixed)
- [ ] Phase 1 Complete
- [ ] Phase 2 Started
- [ ] Phase 2 50% Complete
- [ ] Phase 2 Complete
- [ ] Phase 3 Started
- [ ] All Critical Errors Fixed
- [ ] Warnings Reduced by 50%
- [ ] Warnings Reduced by 75%
- [ ] Clean Code Achieved

## Session History

### Session 1 (2025-09-11)
**Duration:** ~30 minutes  
**Errors Fixed:** 27 (65 → 38)  
**Files Modified:** 15+

#### Fixed:
- ✅ `src/types/test-utils.ts` - Commented 8 unused types
- ✅ `src/types/app.ts` - Commented 3 unused types, exported UserRole
- ✅ `src/types/database.ts` - Commented 4 unused types
- ✅ `src/components/documents/constants.ts` - Commented 4 unused types
- ✅ `src/components/layouts/*.tsx` - Removed JSX.Element returns
- ✅ `src/components/ui/skeleton.tsx` - Added React import
- ✅ `src/components/ui/sonner.tsx` - Added React import
- ✅ Multiple files - Removed unused imports
- ✅ Fixed NodeJS.Timeout → ReturnType<typeof setTimeout>

#### Remaining for Next Session:
- 32 unused variables/exports (mostly in hook files)
- 6 React import issues in test/page files

## Notes
- Some `any` usage in test files is acceptable
- Focus on production code first
- Consider adding stricter ESLint rules after cleanup
- May need to adjust ESLint config for certain patterns