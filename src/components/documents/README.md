# Documents Components Architecture

This directory contains all document-related components for the DocWeld application, organized using a hybrid approach that combines feature-based and component-based organization.

## 📁 Directory Structure

```
/documents
  /cards            # Shared: Reusable card UI components
  /sections         # Feature: Document sections management
  /import           # Feature: Import functionality
  /utils            # Shared: Utility functions
  constants.js      # Shared: Constants and configuration
```

## 🧩 Component Organization

### `/cards` - Shared UI Components

**Purpose:** Reusable card components used throughout the application

- **Card.jsx** - Document card with thumbnail, title, and actions
- **UploadCard.jsx** - Card for uploading new documents
- **CardGrid.jsx** - Responsive grid layout for cards
- **CardDialog.jsx** - Dialog for card operations (rename, etc.)
- **CardImage.jsx** - Image display logic for cards
- **CardOverlay.jsx** - Overlay UI for card interactions

**Used by:**

- Section components (for documents within sections)
- Weld log pages (for standalone document displays)
- Any page that needs to display documents

### `/sections` - Document Sections Feature

**Purpose:** Complete feature for organizing documents into collapsible sections

- **SectionsContainer.jsx** - Main container with business logic
- **Section.jsx** - Individual section component
- **SectionsList.jsx** - List of all sections
- **SectionHeader.jsx** - Section header with controls
- **SectionContent.jsx** - Section content area (uses cards)
- **SectionDialog.jsx** - Dialog for section operations

**Used in:**

- Project documents page
- Library documents page

### `/import` - Import Feature

**Purpose:** Import documents and sections from other projects or libraries

- **ImportDialog.jsx** - Main import dialog (only exported component)
- **ImportBrowser.jsx** - Internal browser for selecting items
- **Other components** - Internal implementation details

**Used by:**

- Sections feature (import sections/documents)
- Weld log pages (import documents only)

### `/utils` - Shared Utilities

**Purpose:** Helper functions used across document components

- **fileUtils.js** - File handling and validation utilities

## 🔄 Data Flow

```
Page Component (e.g., ProjectDocuments)
    ↓
SectionsContainer (manages state & logic)
    ↓
SectionsList (presentational)
    ↓
Section (individual section)
    ↓
SectionContent
    ↓
CardGrid + Card components (shared UI)
```

## 💡 Key Concepts for Beginners

1. **Shared vs Feature Components**
   - `cards/` contains "dumb" presentational components with no business logic
   - `sections/` and `import/` are "smart" features with state management

2. **Reusability**
   - Card components work anywhere - with or without sections
   - Import dialog adapts to context (sections vs standalone documents)

3. **Single Responsibility**
   - Each component has one clear purpose
   - Business logic stays in container components
   - UI components remain pure and reusable

## 🎯 Usage Examples

### Using Sections (with cards)

```jsx
import { SectionsContainer } from '@/components/documents/sections';

<SectionsContainer collectionType="project" entityId="project-123" />;
```

### Using Cards Standalone

```jsx
import { Card, CardGrid, UploadCard } from '@/components/documents/cards';

<CardGrid>
  <UploadCard onUpload={handleUpload} />
  <Card title="Document 1" {...props} />
  <Card title="Document 2" {...props} />
</CardGrid>;
```

### Using Import Dialog

```jsx
import { ImportDialog } from '@/components/documents/import';

<ImportDialog
  open={isOpen}
  onClose={handleClose}
  onSubmit={handleImport}
  mode="document"
/>;
```

## 🏗️ Architecture Decisions

- **Why separate cards?** They're used independently in multiple features
- **Why keep sections together?** It's a cohesive feature with tightly coupled components
- **Why export only ImportDialog?** Other import components are implementation details
- **Why this hybrid approach?** Balances reusability with feature cohesion
