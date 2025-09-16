# Weld Events Implementation Plan

## Overview

Add event logging capability to track actions performed on individual welds (welding, heat treatment, visual inspection, comments). This forms an audit trail displayed on the Weld Overview page.

## Progress Tracking

- [ ] Phase 1: Core Data Structures
- [ ] Phase 2: Basic Hooks Implementation
- [ ] Phase 3: UI Components
- [ ] Phase 4: Batch Operations
- [ ] Phase 5: Edit Functionality
- [ ] Phase 6: NDT Integration Prep

---

## Phase 1: Core Data Structures ⏳

### 1.1 Create Type Definitions

**File:** `src/types/models/welding.ts`

```typescript
// Add to existing file
export interface WeldEvent {
  id: string;
  weldId: string;
  weldLogId: string;
  projectId: string;

  // Event details
  eventType: 'weld' | 'heat-treatment' | 'visual-inspection' | 'comment';
  description: string;
  performedAt: Timestamp;
  performedBy: string; // name or userId

  // Metadata
  createdAt: Timestamp;
  createdBy: string; // userId from auth
  updatedAt?: Timestamp;
  updatedBy?: string;

  // Optional fields
  attachmentIds?: string[];
  metadata?: Record<string, any>; // for future NDT integration

  // Edit control
  isEditable: boolean; // false after 24h or if verified
}

export type CreateWeldEventInput = Omit<
  WeldEvent,
  'id' | 'createdAt' | 'createdBy' | 'isEditable'
>;
export type UpdateWeldEventInput = Partial<
  Pick<WeldEvent, 'description' | 'performedAt' | 'performedBy'>
>;
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
export const useWeldEvents = (weldId: string | null) => {
  const { documents, loading, error } = useFirestoreOperations('weld-events', {
    constraints: weldId ? [['weldId', '==', weldId]] : [],
    orderBy: [['performedAt', 'desc']],
    limit: 100, // Prevent edge cases
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
export const useWeldEventOperations = () => {
  const { user } = useApp();
  const { create, update, remove } = useFirestoreOperations('weld-events');

  const createEvent = async (input: CreateWeldEventInput) => {
    const now = Timestamp.now();
    return create({
      ...input,
      createdAt: now,
      createdBy: user?.uid || 'unknown',
      isEditable: true,
    });
  };

  const updateEvent = async (id: string, updates: UpdateWeldEventInput) => {
    // Check if still editable (within 24h)
    const event = await getDoc(doc(db, 'weld-events', id));
    const hoursSinceCreation =
      (Date.now() - event.data().createdAt.toMillis()) / (1000 * 60 * 60);

    if (hoursSinceCreation > 24) {
      throw new Error('Event cannot be edited after 24 hours');
    }

    return update(id, {
      ...updates,
      updatedAt: Timestamp.now(),
      updatedBy: user?.uid,
    });
  };

  return { createEvent, updateEvent };
};
```

### 2.3 Write Tests FIRST

**File:** `src/hooks/useWeldEvents.test.ts`

```typescript
describe('useWeldEvents', () => {
  it('should fetch events for a specific weld ordered by performedAt desc', async () => {
    // Test implementation
  });

  it('should handle empty results gracefully', async () => {
    // Test implementation
  });
});

describe('useWeldEventOperations', () => {
  it('should create event with proper metadata', async () => {
    // Test implementation
  });

  it('should prevent editing after 24 hours', async () => {
    // Test implementation
  });

  it('should update event with audit fields', async () => {
    // Test implementation
  });
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
- Edit button (if isEditable)
- Loading and empty states

### 3.2 Create WeldEventForm Dialog

**File:** `src/components/weld-events/WeldEventFormDialog.tsx`

Fields:

- Event type selector
- Description (textarea)
- Performed at (date/time picker)
- Performed by (text input with suggestions)
- Attachment upload (optional)

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
const createBatchEvents = async (
  weldIds: string[],
  event: Omit<WeldEvent, 'id' | 'weldId' | 'createdAt' | 'createdBy'>
) => {
  const batch = writeBatch(db);
  const now = Timestamp.now();

  weldIds.forEach((weldId) => {
    const ref = doc(collection(db, 'weld-events'));
    batch.set(ref, {
      ...event,
      weldId,
      createdAt: now,
      createdBy: user?.uid || 'unknown',
      isEditable: true,
    });
  });

  await batch.commit();
  toast.success(`Event logged for ${weldIds.length} welds`);
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

## Phase 5: Edit Functionality ✏️

### 5.1 Edit Restrictions Logic

- Only allow editing description, performedAt, performedBy
- Block edits after 24 hours
- Store original values in metadata for audit

### 5.2 Edit UI

- Inline editing or dialog
- Show "locked" icon after 24h
- Confirmation before saving changes

### 5.3 Audit Trail

When edited, add to metadata:

```typescript
metadata: {
  ...existing,
  editHistory: [
    {
      editedAt: Timestamp.now(),
      editedBy: userId,
      fields: ['description', 'performedBy'],
      previousValues: { description: oldDesc, performedBy: oldPerson }
    }
  ]
}
```

---

## Phase 6: NDT Integration Preparation 🔮

### 6.1 Metadata Structure for Future NDT

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

### 6.2 Event Type Extensions

Plan for future event types:

- `'ndt-inspection'` - Added when NDT Orders implemented
- `'repair'` - After rejection
- `'status-change'` - Automatic system events

### 6.3 NDT Assignment Events

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
- [ ] Edit restriction logic tests
- [ ] Firestore security rules tests (when implemented)

### Critical Test Scenarios

1. Event creation with all required fields
2. Batch creation for multiple welds
3. 24-hour edit restriction enforcement
4. Proper ordering by performedAt
5. Error handling for failed operations
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
   - [ ] Type definitions
   - [ ] Basic hooks with tests
   - [ ] Simple event display

2. **Week 2: Core Features**
   - [ ] Event creation form
   - [ ] Quick action buttons
   - [ ] Integration with Weld Overview

3. **Week 3: Advanced Features**
   - [ ] Batch operations
   - [ ] Edit functionality
   - [ ] Polish UI/UX

---

## Success Criteria ✅

- [ ] Users can log events on individual welds
- [ ] Events display in chronological order
- [ ] Batch logging works from weld table
- [ ] Events are editable within 24 hours
- [ ] System is prepared for NDT integration
- [ ] All features have test coverage
- [ ] Performance is acceptable with 100+ events

---

## Notes & Decisions 📝

1. **No pagination initially** - Most welds have 20-30 events max
2. **Simple event types for MVP** - Full NDT integration comes later
3. **24-hour edit window** - Balances flexibility with audit integrity
4. **Explicit NDT Order removal** - User must consciously remove weld from order
5. **Test-first development** - Write tests before implementation

---

## Questions to Resolve ❓

- [ ] Should comments require approval/verification?
- [ ] Should we notify project managers of certain events?
- [ ] Do we need event templates for common operations?
- [ ] Should attachment size be limited?
