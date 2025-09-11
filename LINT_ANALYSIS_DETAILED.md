# Detailed Lint Analysis Report

Generated from ESLint output

## Summary
- **Total Issues:** 491
- **Errors:** 65 (Must fix)
- **Warnings:** 426 (Should fix)
- **Auto-fixable:** 3 warnings

## Files with Most Issues

Based on the lint output, here are the files that need the most attention:

### Critical Files (with errors)

1. **src/types/test-utils.ts** - Multiple unused type exports
   - MockedHookReturn
   - MockProps
   - MockChangeEvent
   - MockMouseEvent
   - MockDragEvent
   - isDefined
   - isError
   - createTestFactory

2. **src/types/app.ts** - Unused type exports
   - UserRole
   - CompanyInformation
   - LoginFormData
   - UserDbData

3. **src/types/database.ts** - Unused type exports
   - UploadResult
   - DocumentQuery
   - SectionQuery
   - DeleteResult

4. **src/hooks/documents/** - Multiple files with unused exports
   - Various hook-specific types
   - Helper function types

5. **src/hooks/firebase/** - Unused Firestore types
   - UseFirestoreOperationsReturn
   - BaseDocumentOperationsConfig

### Files with Most Warnings (any usage)

1. **Test Files** (*.test.tsx, *.test.ts)
   - src/components/PrivateRoute.test.tsx (9 warnings)
   - src/components/PublicRoute.test.tsx (5 warnings)
   - src/components/data-table/*.test.tsx (multiple files)
   - src/pages/*/*.test.tsx (many test files)

2. **Data Table Components**
   - src/components/data-table/DataTable.tsx (5 warnings)
   - src/components/data-table/ColumnDef.tsx (5 warnings)
   - src/components/data-table/ActionsCell.tsx (3 warnings)

3. **Hook Files**
   - src/hooks/documents/ (multiple files with any types)
   - src/hooks/firebase/ (Firestore operation types)

## Fix Priority Order

### Priority 1: Critical Errors (MUST FIX)
These prevent clean builds and should be fixed immediately:

1. **Remove truly unused exports** 
   - Check if types are used elsewhere
   - Remove if confirmed unused
   - Or prefix with underscore if intentionally unused

2. **Fix import errors**
   - Remove unused imports
   - Fix incorrect import paths

### Priority 2: Production Code Warnings (SHOULD FIX)
These affect code quality in production:

1. **Replace `any` in component props**
   - Data table components
   - Form components
   - Dialog components

2. **Type hook returns properly**
   - Document hooks
   - Firebase hooks
   - Custom hooks

### Priority 3: Test File Warnings (CAN WAIT)
Lower priority as they don't affect production:

1. **Type mock functions**
   - Create typed mock utilities
   - Use `unknown` instead of `any` where possible

2. **Type test data**
   - Create test data types
   - Reuse production types where applicable

## Recommended Actions

### Immediate Actions
```bash
# 1. Auto-fix what's possible
npm run lint -- --fix

# 2. Check for truly unused exports
# For each unused export, search the codebase:
grep -r "MockedHookReturn" src/
grep -r "UserRole" src/
# etc...

# 3. Remove confirmed unused exports
```

### Short-term Actions
1. Create proper types for data table components
2. Type all hook returns and parameters
3. Replace `any` with `unknown` where type is truly unknown
4. Create shared test utility types

### Long-term Actions
1. Enable stricter TypeScript settings
2. Add no-any ESLint rule (after fixing current issues)
3. Create type generation for Firebase models
4. Document any remaining `any` usage with justification

## Files to Fix First (Quick Wins)

These files have few issues and can be fixed quickly:

1. **src/types/app.ts** - Just remove/export 4 types
2. **src/types/database.ts** - Just remove/export 4 types
3. **Coverage files** - Can be excluded from linting
4. **Single `any` files** - Files with only 1-2 any warnings

## Tracking Progress

Use these commands to track progress:

```bash
# Total issues
npm run lint 2>&1 | tail -5

# Errors only
npm run lint 2>&1 | grep "error" | wc -l

# Warnings only
npm run lint 2>&1 | grep "warning" | wc -l

# Unused exports
npm run lint 2>&1 | grep "is defined but never used" | wc -l

# Any usage
npm run lint 2>&1 | grep "Unexpected any" | wc -l
```

## Notes

- Some `any` usage in test files is acceptable
- Focus on production code first
- Consider using `// @ts-expect-error` for intentional type violations
- Use `unknown` instead of `any` when type is truly unknown
- Document with comments when `any` is necessary (e.g., third-party libraries)