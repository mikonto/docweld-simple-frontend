# Weld Events Implementation Plan (v2 - Corrected)

## Overview

Add event logging capability to track actions performed on individual welds (welding, heat treatment, visual inspection, comments). This forms an audit trail displayed on the Weld Overview page.

## Critical Fixes from v1

### ✅ Fixed Issues:

1. **Firestore Constraints**: Now using actual `QueryConstraint` objects (`where()`, `orderBy()`, `limit()`) instead of arrays
2. **useApp() API**: Correctly using `loggedInUser` instead of non-existent `user` property
3. **System Fields**: No longer manually setting `createdAt`, `createdBy`, etc. - letting `useFirestoreOperations` handle them
4. **No isEditable Storage**: Removed flawed `isEditable` database field - will calculate on read if needed later
5. **Batch Typing**: Fixed type signatures to not require fields that are set internally

### 🎯 Simplifications:

- **No Edit Functionality**: Removed for v1 to reduce complexity
- **Focus on Core Features**: Just create and display events initially

## Progress Tracking

- [ ] Phase 1: Core Data Structures
- [ ] Phase 2: Basic Hooks Implementation
- [ ] Phase 3: UI Components
- [ ] Phase 4: Batch Operations
- [ ] Phase 5: NDT Integration Prep

---

## Phase 1: Core Data Structures ⏳

### 1.1 Create Type Definitions

**File:** `src/types/models/welding.ts`

```typescript
// Add to existing file
export interface WeldEvent {
  // System fields (managed by useFirestoreOperations)
  id: string;
  status: Status;
  createdAt: Timestamp;
  createdBy: string; // userId from auth
  updatedAt: Timestamp;
  updatedBy: string;

  // Event-specific fields
  weldId: string;
  weldLogId: string;
  projectId: string;

  // Event details
  eventType: 'weld' | 'heat-treatment' | 'visual-inspection' | 'comment';
  description: string;
  performedAt: Timestamp; // When the actual work was done
  performedBy: string; // Name of person who performed the work

  // Optional fields
  attachmentIds?: string[];
  metadata?: Record<string, any>; // for future NDT integration
}

// Only include fields we actually set - system fields are handled by the hook
export type CreateWeldEventInput = {
  weldId: string;
  weldLogId: string;
  projectId: string;
  eventType: WeldEvent['eventType'];
  description: string;
  performedAt: Timestamp;
  performedBy: string;
  attachmentIds?: string[];
  metadata?: Record<string, any>;
};
```

### 1.2 Firestore Collection Setup

- Collection name: `weld-events`
- Composite indexes needed:
  - `weldId` + `performedAt` (DESC)
  - `projectId` + `performedAt` (DESC)
  - `weldLogId` + `performedAt` (DESC)

---

## Phase 2: Basic Hooks Implementation 🔧

### 2.1 Create useWeldEvents Hook

**File:** `src/hooks/useWeldEvents.ts`

```typescript
import { where, orderBy, limit } from 'firebase/firestore';
import { useFirestoreOperations } from '@/hooks/firebase/useFirestoreOperations';
import type { WeldEvent } from '@/types/models/welding';

export const useWeldEvents = (weldId: string | null) => {
  const constraints = weldId
    ? [
        where('weldId', '==', weldId),
        orderBy('performedAt', 'desc'),
        limit(100),
      ]
    : [];

  const { documents, loading, error } = useFirestoreOperations('weld-events', {
    constraints,
  });

  return {
    events: documents as WeldEvent[],
    loading,
    error,
  };
};
```

### 2.2 Create useWeldEventOperations Hook

**File:** `src/hooks/useWeldEvents.ts`

```typescript
import { useApp } from '@/contexts/AppContext';
import type { CreateWeldEventInput } from '@/types/models/welding';

export const useWeldEventOperations = () => {
  const { loggedInUser } = useApp();
  const { create } = useFirestoreOperations('weld-events');

  const createEvent = async (input: CreateWeldEventInput) => {
    if (!loggedInUser) {
      throw new Error('User must be logged in to create events');
    }

    // useFirestoreOperations.create automatically adds:
    // - id, status, createdAt, createdBy, updatedAt, updatedBy
    // We only need to pass our domain-specific fields
    return create(input);
  };

  // Helper to check if event can be edited (for future use)
  const canEditEvent = (event: WeldEvent): boolean => {
    const hoursSinceCreation =
      (Date.now() - event.createdAt.toMillis()) / (1000 * 60 * 60);
    return hoursSinceCreation <= 24;
  };

  return { createEvent, canEditEvent };
};
```

### 2.3 Write Tests FIRST

**File:** `src/hooks/useWeldEvents.test.ts`

```typescript
describe('useWeldEvents', () => {
  it('should fetch events for a specific weld ordered by performedAt desc', async () => {
    // Mock firestore constraints properly
    const mockWhere = vi.fn();
    const mockOrderBy = vi.fn();
    const mockLimit = vi.fn();

    // Test that correct constraints are created
  });

  it('should handle empty results gracefully', async () => {
    // Test empty state
  });

  it('should not apply constraints when weldId is null', async () => {
    // Test that no constraints are applied for null weldId
  });
});

describe('useWeldEventOperations', () => {
  it('should create event with domain fields only', async () => {
    // Verify that only our fields are passed to create
    // System fields should NOT be included
  });

  it('should throw error when user is not logged in', async () => {
    // Test auth requirement
  });

  it('should correctly calculate if event can be edited', async () => {
    // Test canEditEvent helper function
});
```

---

## Phase 3: UI Components 🎨

### 3.1 Create WeldEventsSection Component

**File:** `src/components/weld-events/WeldEventsSection.tsx`

Features:

- Timeline view grouped by day
- Event cards with icon per type
- Expand/collapse for details
- Read-only display (no edit in v1)
- Loading and empty states

### 3.2 Create WeldEventForm Dialog

**File:** `src/components/weld-events/WeldEventFormDialog.tsx`

Fields:

- Event type selector
- Description (textarea)
- Performed at (date/time picker - defaults to now)
- Performed by (text input - defaults to current user name)
- Attachment upload (optional - future phase)

### 3.3 Quick Action Buttons

**File:** `src/components/weld-events/QuickEventButtons.tsx`

```typescript
<Button onClick={() => openEventForm('weld')}>Log Weld</Button>
<Button onClick={() => openEventForm('visual-inspection')}>Log Inspection</Button>
<Button onClick={() => openEventForm('heat-treatment')}>Log Heat Treatment</Button>
<Button variant="outline" onClick={() => openEventForm('comment')}>Add Comment</Button>
```

### 3.4 Integrate into Weld Overview Page

**File:** `src/pages/weld-overview/index.tsx`

Add section after weld details, before documents:

```typescript
<WeldEventsSection
  weldId={weldId}
  weldStatus={weld.status}
  canEdit={userCanEdit}
/>
```

---

## Phase 4: Batch Operations 🚀

### 4.1 Extend useWeldEventOperations

Add batch creation support:

```typescript
import { writeBatch, doc, collection } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { toast } from 'sonner';

const createBatchEvents = async (
  weldData: Array<{ weldId: string; weldLogId: string; projectId: string }>,
  eventDetails: Omit<CreateWeldEventInput, 'weldId' | 'weldLogId' | 'projectId'>
) => {
  if (!loggedInUser) {
    throw new Error('User must be logged in to create events');
  }

  const batch = writeBatch(db);
  const now = serverTimestamp();

  weldData.forEach(({ weldId, weldLogId, projectId }) => {
    const ref = doc(collection(db, 'weld-events'));
    const eventData = {
      ...eventDetails,
      weldId,
      weldLogId,
      projectId,
      // System fields added automatically
      id: ref.id,
      status: STATUS.ACTIVE,
      createdAt: now,
      createdBy: loggedInUser.uid,
      updatedAt: now,
      updatedBy: loggedInUser.uid,
    };
    batch.set(ref, eventData);
  });

  await batch.commit();
  toast.success(`Event logged for ${weldData.length} welds`);
};
```

### 4.2 Add Selection to Welds Table

**File:** Update welds table component

- Add checkbox column
- Track selected weld IDs
- Show batch action button when items selected
- Open same event form, but for multiple welds

### 4.3 Write Batch Tests

```typescript
describe('Batch Event Creation', () => {
  it('should create identical events for multiple welds', async () => {
    // Test implementation
  });

  it('should handle batch creation failures gracefully', async () => {
    // Test implementation
  });
});
```

---

## Phase 5: NDT Integration Preparation 🔮

### 5.1 Metadata Structure for Future NDT

Ensure metadata field can accommodate:

```typescript
metadata?: {
  ndtOrderId?: string;
  ndtOrderName?: string;
  inspectionMethod?: string; // 'ET' | 'HT' | 'MT' | 'RT' | 'UT' | 'LP' | 'VI'
  inspectionResult?: 'approved' | 'rejected';
  inspectorCertificate?: string;
  [key: string]: any;
}
```

### 5.2 Event Type Extensions

Plan for future event types:

- `'ndt-inspection'` - Added when NDT Orders implemented
- `'repair'` - After rejection
- `'status-change'` - Automatic system events

### 5.3 NDT Assignment Events

When NDT Orders are implemented:

```typescript
eventType: 'ndt-assignment'
metadata: {
  action: 'added' | 'removed',
  ndtOrderId: string,
  ndtOrderName: string
}
```

---

## Testing Strategy 🧪

### Test Coverage Requirements

- [ ] Unit tests for hooks (useWeldEvents, useWeldEventOperations)
- [ ] Component tests for WeldEventsSection
- [ ] Integration tests for batch operations
- [ ] Firestore constraint generation tests
- [ ] Firestore security rules tests (when implemented)

### Critical Test Scenarios

1. Event creation with domain fields only (no system fields)
2. Batch creation for multiple welds
3. Proper Firestore constraint objects (where, orderBy, limit)
4. Proper ordering by performedAt
5. Error handling for unauthenticated users
6. Loading states during async operations

---

## Performance Considerations 📊

1. **Query Optimization**
   - Limit initial load to 100 events
   - Add pagination only if user feedback indicates need
   - Use Firestore indexes for fast queries

2. **Batch Operations**
   - Use Firestore batch writes (max 500 operations)
   - Show progress for large batches
   - Implement retry logic for failures

3. **UI Responsiveness**
   - Optimistic updates for better UX
   - Debounce search/filter inputs
   - Virtual scrolling if event lists get long

---

## Security Considerations 🔒

### Basic Development Rules

```javascript
// firestore.rules (basic for development)
match /weld-events/{eventId} {
  allow read: if request.auth != null;
  allow create: if request.auth != null
    && request.resource.data.createdBy == request.auth.uid;
  allow update: if request.auth != null
    && resource.data.createdBy == request.auth.uid
    && request.time < resource.data.createdAt + duration.value(24, 'h');
}
```

### Production Enhancements (Future)

- Project-based access control
- Role-based permissions (inspector vs welder)
- Prevent backdating beyond reasonable time
- Audit log protection

---

## Implementation Order 📋

1. **Week 1: Foundation**
   - [ ] Type definitions with correct system fields
   - [ ] Basic hooks with proper Firestore constraints
   - [ ] Tests for hooks with mocked Firestore functions

2. **Week 2: Core Features**
   - [ ] Event creation form (no edit in v1)
   - [ ] Quick action buttons
   - [ ] Integration with Weld Overview page
   - [ ] Read-only event display

3. **Week 3: Batch Operations**
   - [ ] Batch event creation for multiple welds
   - [ ] Selection UI in welds table
   - [ ] Polish UI/UX

---

## Success Criteria ✅

- [ ] Users can log events on individual welds
- [ ] Events display in chronological order (by performedAt)
- [ ] Batch logging works from weld table
- [ ] System fields are properly managed by useFirestoreOperations
- [ ] Firestore constraints are correctly formed
- [ ] System is prepared for NDT integration
- [ ] All features have test coverage
- [ ] Performance is acceptable with 100+ events

---

## Notes & Decisions 📝

1. **No pagination initially** - Most welds have 20-30 events max
2. **Simple event types for MVP** - Full NDT integration comes later
3. **No edit functionality in v1** - Simplifies implementation
4. **Explicit NDT Order removal** - User must consciously remove weld from order
5. **Test-first development** - Write tests before implementation
6. **Leverage existing hooks** - Use useFirestoreOperations for all CRUD
7. **System fields handled automatically** - Don't manually set timestamps/user fields

---

## Questions to Resolve ❓

- [ ] Should comments require approval/verification?
- [ ] Should we notify project managers of certain events?
- [ ] Do we need event templates for common operations?
- [ ] Should attachment size be limited?
