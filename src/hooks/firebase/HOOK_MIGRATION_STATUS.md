# Firebase Hooks Migration Status

## Overview
This document tracks the migration from direct Firebase SDK calls to hook-based patterns where appropriate, following our hybrid approach philosophy.

**Last Updated**: 2025-07-05
**Overall Progress**: ~70% Complete

## Migration Philosophy
We follow a **hybrid approach**:
- ✅ Use hooks wherever possible (React components and custom hooks)
- ✅ Keep direct SDK for utility functions, batch operations, and conditional logic
- ✅ Document WHY certain areas must remain as direct SDK calls
- ✅ No backwards compatibility needed (small development database)

## Completed Migrations ✅

### 1. Authentication Hooks (100% Complete)
All authentication operations have been migrated to hooks:

| Component/Hook | Migration | Hook Used |
|----------------|-----------|-----------|
| Login.jsx | ✅ Complete | `useSignInWithEmailAndPassword` |
| AppProvider.jsx | ✅ Complete | `useAuthState` |
| Logout functionality | ✅ Complete | `useSignOut` |

### 2. Storage Hooks (100% Complete)

#### useFileUrl Hook
- **Status**: ✅ Implemented
- **Location**: `src/components/documents/shared/utils/storageUtils.js`
- **Replaces**: Direct `getDownloadURL()` calls for fetching file URLs
- **Usage**: Components that need to display files from Firebase Storage

#### DocumentThumbnail Component
- **Status**: ✅ Created
- **Location**: `src/components/documents/shared/import/DocumentThumbnail.jsx`
- **Features**: 
  - Uses `useFileUrl` hook for thumbnail URLs
  - Handles loading/error states
  - Fully tested with 6 passing tests

### 3. Firestore Real-time Listeners (100% Complete)

| Hook | Migration | Hook Used |
|------|-----------|-----------|
| useDocumentData | ✅ Complete | `useCollectionData` |
| useSectionData | ✅ Complete | `useCollectionData` |

### 4. Firestore CRUD Operations (75% Complete)

#### useFirestoreOperations Hook
- **Status**: ✅ Implemented
- **Location**: `src/hooks/firebase/useFirestoreOperations.js`
- **Features**:
  - Standardized CRUD operations (create, update, remove, archive, restore)
  - Automatic timestamps and user tracking
  - Toast notifications for user feedback
  - Real-time data updates

#### Migrated Hooks
| Hook | Status | Notes |
|------|--------|-------|
| useMaterials | ✅ Complete | Including useAlloyMaterials sub-hook |
| useProjects | ✅ Complete | Full CRUD operations |
| useWelds | ✅ Partial | CRUD migrated, validation functions use direct SDK |
| useDocumentLibrary | ✅ Complete | Full migration |
| useWeldLogs | ✅ Complete | Full migration |
| useProjectParticipants | ✅ Complete | Full migration |

#### Not Yet Migrated
| Hook | Status | Priority | Estimated Time |
|------|--------|----------|----------------|
| useVendors | ❌ Pending | Medium | 2 hours |
| useWeldingProcesses | ❌ Pending | Medium | 2 hours |
| useUsers | ❌ Pending | Medium | 3 hours |

## Partially Compatible Hooks ⚠️

### useWelds Hook
- **Location**: `src/hooks/useWelds.js`
- **Migrated**:
  - ✅ Basic CRUD operations use `useFirestoreOperations`
  - ✅ Real-time weld data updates
- **Cannot Migrate** (with documented reasons):
  - ❌ `isWeldNumberAvailable()` - Utility function, called conditionally
  - ❌ `isWeldNumberRangeAvailable()` - Utility function, called conditionally
  - ❌ `createWeldsRange()` - Uses `writeBatch()` for transactions

### useCompanyInformation Hook
- **Location**: `src/hooks/useCompanyInformation.js`
- **Can Migrate**:
  - ✅ Could use `useDocument` for fetching company data
- **Cannot Migrate**:
  - ❌ `uploadCompanyLogo()` - Uses `getDownloadURL()` in async handler

## Components Requiring Refactoring 🔧

### DocumentBrowser Component
- **Status**: ❌ Needs Major Refactoring
- **Location**: `src/components/documents/shared/import/DocumentBrowser.jsx`
- **Current Issues**:
  - Uses `getDocs()` in complex navigation logic
  - Fetches thumbnails in loops (can't use hooks)
  - Maintains complex state that doesn't fit hook patterns

- **Proposed Solution**:
  ```
  DocumentBrowser (parent - manages navigation state)
  ├── CollectionsList (uses hooks for collections)
  ├── SectionsList (uses hooks for sections)  
  ├── DocumentsList (uses hooks for documents)
  └── DocumentThumbnail (already created, uses useFileUrl)
  ```

- **Benefits**:
  - Each sub-component can properly use hooks
  - Better separation of concerns
  - Easier testing and maintenance

## Hook Limitations Discovered 📚

### 1. React Rules of Hooks
Hooks can only be called:
- ✅ At the top level of React function components
- ✅ At the top level of custom hooks
- ❌ NOT inside conditions, loops, or nested functions
- ❌ NOT inside regular JavaScript functions
- ❌ NOT inside async functions or event handlers

### 2. Specific Limitations by Category

#### Conditional Hook Calls
```javascript
// ❌ CANNOT DO THIS
if (document.thumbnail) {
  const [url] = useDownloadURL(ref); // ERROR!
}

// ✅ SOLUTION: Create wrapper component
<DocumentThumbnail storagePath={document.thumbnail} />
```

#### Loops and Iterations
```javascript
// ❌ CANNOT DO THIS
documents.forEach(doc => {
  const [url] = useDownloadURL(ref); // ERROR!
});

// ✅ SOLUTION: Map to components
{documents.map(doc => <DocWithThumbnail key={doc.id} doc={doc} />)}
```

#### Async Functions and Event Handlers
```javascript
// ❌ CANNOT DO THIS
const handleUpload = async (file) => {
  const [url] = useDownloadURL(ref); // ERROR!
};

// ✅ MUST USE: Direct SDK in handlers
const handleUpload = async (file) => {
  const url = await getDownloadURL(ref); // Direct SDK
};
```

#### Utility Functions
```javascript
// ❌ CANNOT DO THIS
export function validateData() {
  const [data] = useCollection(query); // ERROR!
}

// ✅ MUST USE: Direct SDK in utilities
export async function validateData() {
  const snapshot = await getDocs(query); // Direct SDK
}
```

## Best Practices Established ✨

### 1. Documentation Requirements
Every direct SDK usage must have a comment explaining why:
```javascript
// NOTE: Using direct SDK because this is a utility function
// that may be called conditionally - hooks cannot be used here
const snapshot = await getDocs(query);
```

### 2. Component Design Patterns
- Break complex components into smaller, hook-friendly pieces
- Use wrapper components to enable hook usage in lists
- Keep validation and utility logic separate from components

### 3. Testing Strategy
- Write tests BEFORE migrating
- Test both success and error scenarios
- Ensure loading states are properly tested
- Verify real-time updates work correctly

### 4. Performance Considerations
- Memoize queries to prevent unnecessary re-renders
- Use constraints wisely to limit data fetched
- Let hooks handle subscription cleanup automatically

## Migration Patterns Reference 📖

### Pattern 1: Simple Collection Display
```javascript
// Before: Direct SDK
const [items, setItems] = useState([]);
const [loading, setLoading] = useState(true);

useEffect(() => {
  getDocs(collection(db, 'items')).then(snapshot => {
    setItems(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    setLoading(false);
  });
}, []);

// After: Hook
const [items, loading, error] = useCollectionData(
  collection(db, 'items')
);
```

### Pattern 2: CRUD Operations
```javascript
// Before: Direct SDK
const createItem = async (data) => {
  try {
    await addDoc(collection(db, 'items'), {
      ...data,
      createdAt: serverTimestamp()
    });
    toast.success('Created!');
  } catch (error) {
    toast.error(error.message);
  }
};

// After: useFirestoreOperations
const { create } = useFirestoreOperations('items');
// create() handles timestamps, user tracking, and toasts automatically
```

### Pattern 3: File Display
```javascript
// Before: Direct SDK
const [url, setUrl] = useState(null);
const [loading, setLoading] = useState(true);

useEffect(() => {
  if (storagePath) {
    getDownloadURL(ref(storage, storagePath))
      .then(setUrl)
      .finally(() => setLoading(false));
  }
}, [storagePath]);

// After: useFileUrl hook
const { url, loading, error } = useFileUrl(storagePath);
```

## Next Steps 🚀

### Immediate Priority (4-6 hours)
1. **Refactor DocumentBrowser Component**
   - Create sub-components design
   - Implement one sub-component at a time
   - Write comprehensive tests

### Medium Priority (6-8 hours)
2. **Complete Remaining CRUD Migrations**
   - useVendors (2 hours)
   - useWeldingProcesses (2 hours)
   - useUsers (3 hours)

### Low Priority (2-3 hours)
3. **Documentation and Cleanup**
   - Update all code comments
   - Create visual diagrams
   - Remove any deprecated code

## Success Metrics 📊

- ✅ 50+ migration tests written and passing
- ✅ Zero backwards compatibility code
- ✅ All migrations have clear documentation
- ✅ No bugs introduced during migration
- ✅ Improved code readability and maintainability
- ⏳ 100% of feasible migrations completed (70% done)

## Resources 📚

- [FIREBASE_HOOKS_MIGRATION_SUMMARY.md](/FIREBASE_HOOKS_MIGRATION_SUMMARY.md) - Comprehensive guide
- [FIREBASE_HOOKS_MIGRATION_CHECKLIST.md](/FIREBASE_HOOKS_MIGRATION_CHECKLIST.md) - Step-by-step checklist
- [Testing Patterns](/docs/testing_patterns_and_fixes.md) - Test-first development guide
- [react-firebase-hooks Docs](https://github.com/CSFrequency/react-firebase-hooks) - Library documentation