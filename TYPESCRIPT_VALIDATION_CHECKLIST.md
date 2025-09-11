# TypeScript Conversion Validation Checklist

## Per-Component Checklist

Use this for EVERY component/hook/utility conversion:

### Before Starting Component
- [ ] Currently in JavaScript state (no .ts/.tsx files)
- [ ] NOT a shadcn component (/components/ui/*.jsx stays as JSX!)
- [ ] All tests passing for this component
- [ ] No console errors when using component

### During Conversion

#### Step 1: Create Type Definitions
- [ ] Props interface defined
- [ ] State types defined  
- [ ] Event handler types defined
- [ ] Return type explicit (for hooks)

#### Step 2: Convert Files Together
- [ ] Component.jsx → Component.tsx
- [ ] Component.test.jsx → Component.test.tsx
- [ ] Both converted in same commit

#### Step 3: Fix Type Errors
- [ ] Zero TypeScript errors in component
- [ ] Zero TypeScript errors in test
- [ ] No `@ts-ignore` comments
- [ ] No `as any` (except third-party libraries)

#### Step 4: Validate Behavior
- [ ] Tests still passing
- [ ] Component works in browser
- [ ] No runtime errors

### After Conversion
- [ ] Run `npx tsc --noEmit` - no errors for this file
- [ ] Run component tests - all pass
- [ ] Manually test in browser - works correctly
- [ ] Commit with message: "Convert [ComponentName] to TypeScript"

## Common TypeScript Patterns Reference

### Pattern 1: React Component with Props
```typescript
interface ComponentProps {
  required: string;
  optional?: number;
  children: React.ReactNode;
  onClick: () => void;
}

export function Component({ required, optional = 0, children, onClick }: ComponentProps) {
  return <div>{children}</div>;
}
```

### Pattern 2: Component with State
```typescript
function Component() {
  // Simple types - inferred
  const [count, setCount] = useState(0);
  
  // Complex types - explicit
  const [user, setUser] = useState<User | null>(null);
  
  // Array types
  const [items, setItems] = useState<string[]>([]);
}
```

### Pattern 3: Event Handlers
```typescript
// Mouse events
const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {};

// Form events  
const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {};

// Input changes
const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const value = e.target.value;
};
```

### Pattern 4: Refs
```typescript
// DOM refs
const divRef = useRef<HTMLDivElement>(null);

// Value refs
const countRef = useRef<number>(0);
```

### Pattern 5: Custom Hooks
```typescript
// Define return type interface
interface UseCustomHookReturn {
  data: string[];
  loading: boolean;
  error: Error | null;
  refetch: () => void;
}

// Explicit return type
export function useCustomHook(): UseCustomHookReturn {
  const [data, setData] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  const refetch = () => {
    // Implementation
  };
  
  return { data, loading, error, refetch };
}
```

### Pattern 6: Testing Mocks
```typescript
// Mock a hook
vi.mock('@/hooks/useCustomHook');
const mockUseCustomHook = vi.mocked(useCustomHook);

// Mock with return value
mockUseCustomHook.mockReturnValue({
  data: ['test'],
  loading: false,
  error: null,
  refetch: vi.fn()
});
```

### Pattern 7: Firebase/Firestore Types
```typescript
import { Timestamp, DocumentReference } from 'firebase/firestore';

interface FirestoreDocument {
  id: string;
  createdAt: Timestamp;
  ref?: DocumentReference;
}
```

## Type Error Solutions

### Error: "Property does not exist"
```typescript
// Problem
const value = object.property; // Error: property does not exist

// Solution 1: Define interface
interface MyObject {
  property: string;
}

// Solution 2: Type assertion (last resort)
const value = (object as MyObject).property;
```

### Error: "Argument type mismatch"  
```typescript
// Problem
function needsString(value: string) {}
needsString(undefined); // Error

// Solution 1: Make optional
function needsString(value?: string) {}

// Solution 2: Provide default
needsString(value || '');

// Solution 3: Type guard
if (value) {
  needsString(value);
}
```

### Error: "Type assignment"
```typescript
// Problem  
const value: string = undefined; // Error

// Solution 1: Union type
const value: string | undefined = undefined;

// Solution 2: Optional
let value?: string;

// Solution 3: Default value
const value: string = undefined || '';
```

## Red Flags - Stop If You See This

1. **Too many `any` types**
   - Stop and properly type instead

2. **Modifying shadcn components**
   - Never edit /components/ui/*
   - Use props and className only

3. **Test passing but types failing**
   - Don't use @ts-ignore to make tests pass
   - Fix the types properly

4. **Circular dependencies**
   - Restructure imports
   - Use type imports: `import type { }`

5. **Complex type assertions**
   ```typescript
   // If you're writing this, something is wrong
   ((value as unknown) as SomeType) as FinalType
   ```

## Questions to Ask Before Moving On

1. Would a TypeScript beginner understand these types?
2. Are the types helping or hiding bugs?
3. Could I update this component in 6 months?
4. Do the tests actually test the typed behavior?
5. Is this how a senior developer would type it?

## Final Validation Per Component

```bash
# Run these commands for the component you just converted
npx tsc --noEmit src/components/YourComponent.tsx
npx tsc --noEmit src/components/YourComponent.test.tsx
npm test YourComponent
```

All must pass before moving to next component.