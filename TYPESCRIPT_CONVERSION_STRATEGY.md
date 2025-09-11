# TypeScript Conversion Strategy - Clean Implementation

## Core Principles
1. **Component + Test Together**: Never convert one without the other
2. **No Type Shortcuts**: No `as any` except for third-party library issues
3. **shadcn Immutable**: NEVER edit files in /components/ui/
4. **Bottom-Up**: Start with leaves, end with roots
5. **Full Completion**: Each file 100% typed before moving on

## Pre-Conversion Checklist
- [ ] All tests passing in JavaScript
- [ ] Document data model clearly defined
- [ ] No console errors or warnings
- [ ] ESLint clean

## Phase 1: Foundation (Day 1)

### 1.1 TypeScript Configuration
```bash
npm install --save-dev typescript @types/react @types/react-dom @types/node
npx tsc --init
```

**tsconfig.json** - Strict but Beginner-Friendly:
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "jsx": "react-jsx",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    },
    "resolveJsonModule": true,
    "allowImportingTsExtensions": true,
    "noEmit": true,
    
    // Strict settings for clean code
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "noImplicitReturns": true,
    
    // Allow JS during migration
    "allowJs": true,
    "skipLibCheck": true
  },
  "include": ["src"],
  "exclude": ["node_modules", "dist"]
}
```

### 1.2 Core Type Definitions

**/src/types/database.ts** - Fix the Data Model Mismatch:
```typescript
// Firestore actual data structure
export interface FirestoreSection {
  id: string;
  name: string;  // Display name
  description: string;
  status: 'active' | 'deleted';
  order: number;
  projectId?: string;
  libraryId?: string;
  createdAt: Timestamp;
  createdBy: string;
  updatedAt: Timestamp;
  updatedBy: string;
}

export interface FirestoreDocument {
  id: string;
  title: string;
  fileType: string;
  fileSize: number;
  storageRef: string;
  thumbStorageRef: string | null;
  processingState: 'pending' | 'processing' | 'completed' | 'error';
  status: 'active' | 'deleted';
  order: number;
  sectionId?: string;
  projectId?: string;
  libraryId?: string;
  weldLogId?: string;
  createdAt: Timestamp;
  createdBy: string;
}

// TypeScript interfaces for app usage
export interface Section extends FirestoreSection {}
export interface Document extends FirestoreDocument {}
```

**/src/types/test-utils.ts** - Proper Test Types:
```typescript
import { ReactElement } from 'react';
import { RenderOptions } from '@testing-library/react';

export interface RenderWithProvidersOptions extends Omit<RenderOptions, 'wrapper'> {
  initialState?: Partial<AppState>;
  route?: string;
}

export type MockedFunction<T extends (...args: any[]) => any> = 
  jest.MockedFunction<T> | vi.MockedFunction<T>;
```

## Phase 1.5: Re-initialize shadcn/ui for TypeScript

**Do this BEFORE converting any other files:**

```bash
# 1. Update components.json to use TypeScript
sed -i 's/"tsx": false/"tsx": true/' components.json

# 2. Re-install ALL shadcn components as TypeScript
npx shadcn@latest add --overwrite alert alert-dialog avatar badge breadcrumb button card checkbox command dialog dropdown-menu form input label popover scroll-area select separator sheet sidebar skeleton sonner table tabs tooltip

# 3. Also reinstall custom components if any
npx shadcn@latest add --overwrite combobox
```

This will:
- Replace all `/components/ui/*.jsx` with `/components/ui/*.tsx`
- Proper TypeScript types included
- Default shadcn implementation (no customizations)

**IMPORTANT**: After this, NEVER modify these files directly!

## Phase 2: Utilities & Constants (Day 1)

Convert in this exact order:

1. **Constants first**:
   ```bash
   src/constants/firestore.js → firestore.ts
   src/config/firebase.js → firebase.ts
   src/config/navigation.js → navigation.ts
   ```

2. **Utilities with tests**:
   ```bash
   # Convert BOTH files together
   src/utils/dateFormatting.js → dateFormatting.ts
   src/utils/dateFormatting.test.js → dateFormatting.test.ts
   
   # Run tests immediately
   npm test dateFormatting
   ```

## Phase 3: Hooks (Day 2)

Start with simple hooks, build up to complex:

1. **Simple hooks first**:
   - useConfirmationDialog (no dependencies)
   - useFormDialog (minimal dependencies)

2. **Firebase hooks**:
   - useFirestoreOperations
   - useCascadingSoftDelete

3. **Document hooks** (most complex):
   - useBaseDocumentOperations
   - useDocuments
   - useSections

**Example Hook Conversion**:
```typescript
// useConfirmationDialog.ts
export interface UseConfirmationDialogReturn {
  isOpen: boolean;
  data: ConfirmationData | null;
  open: (data: ConfirmationData) => void;
  close: () => void;
}

export function useConfirmationDialog(): UseConfirmationDialogReturn {
  // Implementation
}

// useConfirmationDialog.test.ts
import { renderHook, act } from '@testing-library/react';
import { useConfirmationDialog } from './useConfirmationDialog';

describe('useConfirmationDialog', () => {
  it('should initialize with closed state', () => {
    const { result } = renderHook(() => useConfirmationDialog());
    expect(result.current.isOpen).toBe(false);
  });
});
```

## Phase 4: Components (Days 3-4)

### Important Note:
- shadcn components in `/components/ui/` should already be TypeScript from Phase 1.5
- NEVER modify these files - keep them as default shadcn components
- Focus on converting YOUR custom components only

### Conversion Order (Bottom-Up):

**Level 1 - Pure UI Components** (no business logic):
- [ ] Spinner
- [ ] ErrorFallback
- [ ] ConfirmationDialog

**Level 2 - Document Components**:
```
documents/
  cards/
    - [ ] CardImage + CardImage.test
    - [ ] CardOverlay + CardOverlay.test  
    - [ ] Card + Card.test
    - [ ] CardGrid + CardGrid.test
```

**Level 3 - Container Components**:
- Last to convert
- These use all the other components

### Component Conversion Template:

```typescript
// ❌ WRONG - Separate conversions
Monday: Card.jsx → Card.tsx
Tuesday: Card.test.jsx → Card.test.tsx  // Types don't match!

// ✅ CORRECT - Together
Monday Morning:
1. Card.jsx → Card.tsx
2. Card.test.jsx → Card.test.tsx
3. Fix ALL type errors in both
4. Run tests - must pass
5. Commit: "Convert Card component and tests to TypeScript"
```

## Phase 5: Pages (Day 5)

Convert pages last when all dependencies are typed.

## Validation Checklist for Each Component

Before moving to next component:
- [ ] Component file has zero type errors
- [ ] Test file has zero type errors  
- [ ] Tests are passing
- [ ] No `as any` (except for third-party mocks)
- [ ] Props interface is exported
- [ ] Return type is explicit for hooks

## Common Patterns to Use

### 1. Component Props:
```typescript
interface CardProps {
  title: string;
  imageUrl?: string;  // Optional
  onClick: () => void;
  children: React.ReactNode;
}

export function Card({ title, imageUrl, onClick, children }: CardProps) {
  // Implementation
}
```

### 2. Event Handlers:
```typescript
const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
  // Handler logic
};

const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
  const value = event.target.value;
};
```

### 3. State with Types:
```typescript
const [user, setUser] = useState<User | null>(null);
const [items, setItems] = useState<Document[]>([]);
const [loading, setLoading] = useState(false); // Type inferred as boolean
```

### 4. Test Mocks:
```typescript
import { vi } from 'vitest';
import type { UseDocumentsReturn } from '@/hooks/documents';

// Proper mock typing
const mockUseDocuments = vi.fn<[], UseDocumentsReturn>();
vi.mock('@/hooks/documents', () => ({
  useDocuments: mockUseDocuments
}));

// In test
mockUseDocuments.mockReturnValue({
  documents: [],
  loading: false,
  error: null,
  // ... all required fields
});
```

## Red Flags to Avoid

1. **Never do this**:
   ```typescript
   // ❌ Type assertion abuse
   const result = (something as any).whatever.works;
   ```

2. **Never convert or modify shadcn components**:
   ```typescript
   // ❌ NEVER convert /components/ui/*.jsx to TypeScript
   // ❌ NEVER edit these files
   // ✅ Keep them as .jsx so they can be updated via npx shadcn@latest
   // ✅ Use className and props for customization
   <Button className="custom-styles" />
   ```

3. **Never skip test types**:
   ```typescript
   // ❌ @ts-ignore
   // ❌ @ts-nocheck
   // ✅ Fix the types properly
   ```

## Success Metrics

After each phase:
- `npm run type-check` → 0 errors
- `npm test` → All passing
- `npm run lint` → 0 errors
- No `as any` in production code
- shadcn components untouched

## Timeline

- **Day 1**: Foundation + Utilities (8 hours)
- **Day 2**: Hooks (8 hours)
- **Days 3-4**: Components (16 hours)
- **Day 5**: Pages + Final validation (8 hours)

**Total: 40 hours for clean, professional TypeScript conversion**

## Daily Validation

End of each day:
```bash
# Must all pass
npm run type-check
npm test
npm run build
git status  # Only .ts/.tsx files changed, no .js/.jsx remains in converted folders
```

## Need Help?

If stuck on a type issue for >15 minutes:
1. Document the exact error
2. Check if it's a data model mismatch
3. Consider if the JavaScript implementation needs refactoring
4. Ask for specific help with the pattern

Remember: **Clean code is more valuable than fast code** for a commercial MVP.