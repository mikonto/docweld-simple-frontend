# Document Sections Components

This directory contains components for the Document Sections feature of the DocWeld application. The feature allows users to organize documents into sections, upload new documents, and manage both sections and documents.

## Component Structure

### Folder Organization

```
sections/
├── multi/                  # Multi-section components
│   ├── Section.tsx         # Individual section component
│   ├── SectionContent.tsx  # Grid layout content
│   ├── SectionsContainer.tsx # Main container
│   ├── SectionsList.tsx    # List of sections
│   ├── SectionDialog.tsx   # Add/edit section dialog
│   └── sectionOperations.ts # Section operations
├── standalone/             # Standalone section components
│   ├── StandaloneSection.tsx # Main standalone component
│   └── StandaloneSectionContent.tsx # Horizontal scroll content
├── shared/                 # Shared components
│   └── SectionHeader.tsx  # Collapsible header
└── index.ts               # Public exports
```

### Main Components

- **SectionsContainer** (`multi/`): Full sections management for multiple sections (used in Project Documents, Library)
- **StandaloneSection** (`standalone/`): Single collapsible section for standalone use cases (used in Weld Log Documents)

### Section Components

- **Section** (`multi/`): Displays a single section and its documents (used by SectionsContainer)
- **SectionHeader** (`shared/`): Header component for sections with expand/collapse and actions
- **SectionContent** (`multi/`): Content component for displaying document grid with drag & drop
- **StandaloneSectionContent** (`standalone/`): Compact horizontal scrolling content for standalone sections

### Card Components

- **DocumentCard**: Displays a document with thumbnail and actions
- **DocumentCardImage**: Handles document image display logic
- **DocumentCardUploadStatus**: Displays upload progress and status
- **DocumentUploadCard**: Card for uploading new documents

### Dialog Components

- **SectionDialog**: Dialog for adding or editing sections
- **DocumentDialog**: Dialog for renaming documents
- **ConfirmationDialog**: Reusable dialog for confirming actions
- **DocumentImportDialog**: Dialog for importing sections and documents from library or other projects

### Browser Components

- **DocumentBrowser**: Browser for selecting documents to import

### Utilities and Constants

- **constants.ts**: Shared constants for the module
- **fileUtils.ts**: File handling utilities
- **storageUtils.ts**: Firebase Storage interaction utilities

## Hooks

The components use several custom hooks from `src/hooks/documents/`:

**Public API (exported):**

- **`useDocuments`**: Main hook for document CRUD operations
- **`useSections`**: Main hook for section CRUD operations
- **`useDocumentImport`**: Handles importing documents from library or other projects
- **`useDocumentDisplay`**: Manages document image display with loading states
- **`useDragAndDrop`**: Handles drag and drop functionality for file uploads

**Internal hooks (not exported):**

- **`useBaseDocumentOperations`**: Base operations used by useDocuments
- **`useDocumentData`**: Data fetching used by useDocuments
- **`useSectionData`**: Data fetching used by useSections
- **`useSectionOperations`**: Operations used by useSections
- **`useFileUpload`**: File upload logic used internally

## Usage

### For Multiple Sections (Projects, Libraries)

Use `SectionsContainer` for features that need multiple sections with management capabilities:

```jsx
import { SectionsContainer } from '@/components/documents/sections';

function ProjectDocuments() {
  return <SectionsContainer collectionType="project" entityId="project-123" />;
}
```

### For Single Standalone Sections

Use `StandaloneSection` for features that need a single collapsible document section:

```jsx
import { StandaloneSection } from '@/components/documents/sections';

function WeldLogDocuments({ documents, onImportClick }) {
  const dropdownActions = [
    {
      key: 'import',
      label: 'Import Documents',
      onSelect: onImportClick,
    },
  ];

  return (
    <StandaloneSection
      title="Weld Log Documents"
      documents={documents}
      documentsLoading={loading}
      documentsError={error}
      onDragEnd={handleDragEnd}
      onUpload={handleUpload}
      onRenameDocument={handleRename}
      onDeleteDocument={handleDelete}
      dropdownActions={dropdownActions}
      uploadingFiles={uploadingFiles}
      initialExpanded={false}
    />
  );
}
```

### StandaloneSection Props

- `title` (string, required): Section title
- `documents` (array): Array of document objects
- `documentsLoading` (boolean): Loading state
- `documentsError` (object): Error object if any
- `uploadingFiles` (object): Upload status for files
- `onDragEnd` (function): Handle drag and drop reordering
- `onUpload` (function): Handle file upload
- `onRenameDocument` (function): Handle document rename
- `onDeleteDocument` (function): Handle document delete
- `dropdownActions` (array): Custom actions for dropdown menu
- `initialExpanded` (boolean): Whether to start expanded
- `className` (string): Additional CSS classes

### Key Differences

**Multi-Section (SectionsContainer/Section):**

- Multiple collapsible sections with management features
- Grid layout that wraps to multiple rows
- Larger cards optimized for detailed document viewing
- Full height expansion for many documents

**Standalone Section (StandaloneSection):**

- Single collapsible section
- Horizontal scrolling single row layout
- Compact cards to save vertical space
- Limited height expansion (400px) to work with other content below
