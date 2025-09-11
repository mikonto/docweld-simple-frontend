# Next Session Quick Start Guide

## Current Status
- **38 errors** remaining (down from 65)
- **424 warnings** (mostly `any` types - lower priority)

## Quick Commands to Start

```bash
# Check current status
npm run lint 2>&1 | tail -5

# See all remaining errors
npm run lint 2>&1 | grep "error"

# Count specific error types
npm run lint 2>&1 | grep "is defined but never used" | wc -l  # Should be ~32
npm run lint 2>&1 | grep "'React' is not defined" | wc -l      # Should be ~6
```

## Priority Tasks (38 errors to fix)

### 1. Fix React Import Issues (6 errors) - QUICK WIN
Files that need `import * as React from "react"`:
- Check with: `npm run lint 2>&1 | grep -B1 "'React' is not defined"`
- Add import to each file

### 2. Fix Unused Exports in Hooks (32 errors)
Common patterns to fix:
```typescript
// Unused type exports - comment out or remove:
export interface UseFirestoreOperationsReturn { ... }
// becomes:
// interface UseFirestoreOperationsReturn { ... }

// Unused imports - remove:
import { FieldValue } from 'firebase/firestore';
// Remove if not used

// Unused parameters - prefix with underscore:
function example(unused: string) { ... }
// becomes:
function example(_unused: string) { ... }
```

### 3. Specific Files with Most Issues
Focus on these files first:
- `src/hooks/firebase/*.ts` - Multiple unused exports
- `src/hooks/documents/*.ts` - Unused type exports
- Test files with unused imports

## Helper Scripts

```bash
# Find all files with unused exports
npm run lint 2>&1 | grep "is defined but never used" | cut -d: -f1 | sort -u

# Find React import issues
npm run lint 2>&1 | grep -B1 "'React' is not defined"

# Auto-fix what's possible
npm run lint -- --fix
```

## Expected Result
After fixing these 38 errors:
- ✅ 0 errors
- ⚠️ 424 warnings (acceptable for now - all `any` types)

## Time Estimate
- React imports: 5 minutes
- Unused exports: 20-25 minutes
- Total: ~30 minutes to reach 0 errors