import { useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Spinner } from '@/components/ui/custom/spinner';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Section, Document } from '@/types/api/firestore';
import useImportBrowser from '@/hooks/documents/useImportBrowser';
import type { SelectedItem } from '@/types/documents';
import useImportDataFetching from '@/hooks/documents/useImportDataFetching';
import useImportSelection from '@/hooks/documents/useImportSelection';
import CollectionsList from './CollectionsList';
import SectionsList from './SectionsList';
import DocumentsGrid from './DocumentsGrid';
import BrowserBreadcrumb from './BrowserBreadcrumb';
import SelectionToolbar from './SelectionToolbar';
import ImportFooter from './ImportFooter';

interface ImportBrowserProps {
  onSelectItems: (items: SelectedItem[]) => void;
  onCancel: () => void;
  allowMultiple?: boolean;
  mode?: 'section' | 'document' | 'both';
  sourceType?: 'documentLibrary' | 'projectLibrary';
  projectId?: string | null;
}

/**
 * Document browser component for selecting sections or documents to import
 */
function ImportBrowser({
  onSelectItems,
  onCancel,
  allowMultiple = true,
  mode = 'both',
  sourceType = 'documentLibrary',
  projectId = null,
}: ImportBrowserProps) {
  const { t } = useTranslation();

  // Use reducer for state management
  const { state, dispatch, ACTIONS } = useImportBrowser();
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Destructure state for easier access
  const {
    collections,
    selectedCollection,
    selectedSection,
    sections,
    documents,
    thumbnails,
    isLoading,
    currentView,
  } = state;

  // Use data fetching hook
  useImportDataFetching(state, dispatch, sourceType, projectId);

  // Use selection hook
  const {
    handleSelectItem,
    isItemSelected,
    areAllItemsSelected,
    toggleAllItems,
    clearSelection,
    selectedItems,
  } = useImportSelection(state, dispatch, allowMultiple, sourceType, projectId);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      const timeout = timeoutRef.current;
      if (timeout) {
        clearTimeout(timeout);
      }
    };
  }, []);

  // Set view and reset state when source type changes
  useEffect(() => {
    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Clear all current selections and data
    dispatch({ type: ACTIONS.RESET_SECTIONS_AND_DOCUMENTS });

    if (sourceType === 'documentLibrary') {
      // For document library, reset to collections view
      dispatch({
        type: ACTIONS.RESET_FOR_SOURCE_CHANGE,
        payload: { view: 'collections' },
      });
    } else if (sourceType === 'projectLibrary' && projectId) {
      // For project library, go directly to sections view
      // Use a small timeout to ensure state updates in correct order
      timeoutRef.current = setTimeout(() => {
        dispatch({
          type: ACTIONS.RESET_FOR_SOURCE_CHANGE,
          payload: {
            view: 'sections',
            collection: {
              id: 'main',
              name: t('navigation.projectDocuments'),
            },
          },
        });
      }, 0);
    }
  }, [sourceType, projectId, t, dispatch, ACTIONS]);

  // Navigation handlers
  const handleCollectionClick = useCallback(
    (collection: { id: string; name: string }) => {
      dispatch({ type: ACTIONS.SET_SELECTED_COLLECTION, payload: collection });
      dispatch({ type: ACTIONS.SET_VIEW, payload: 'sections' });
      dispatch({ type: ACTIONS.SET_SECTIONS, payload: [] });
      dispatch({ type: ACTIONS.SET_SELECTED_SECTION, payload: null });
      dispatch({ type: ACTIONS.CLEAR_SELECTION });
    },
    [dispatch, ACTIONS]
  );

  const handleSectionClick = useCallback(
    (section: Section) => {
      dispatch({ type: ACTIONS.SET_SELECTED_SECTION, payload: section });
      dispatch({ type: ACTIONS.SET_VIEW, payload: 'documents' });
      dispatch({ type: ACTIONS.SET_DOCUMENTS, payload: [] });
      dispatch({ type: ACTIONS.CLEAR_SELECTION });
    },
    [dispatch, ACTIONS]
  );

  const handleNavigate = useCallback(
    (view: 'collections' | 'sections' | 'documents') => {
      if (view === 'collections') {
        dispatch({ type: ACTIONS.SET_VIEW, payload: 'collections' });
        dispatch({ type: ACTIONS.SET_SELECTED_COLLECTION, payload: null });
        dispatch({ type: ACTIONS.SET_SELECTED_SECTION, payload: null });
      } else if (view === 'sections') {
        dispatch({ type: ACTIONS.SET_VIEW, payload: 'sections' });
        dispatch({ type: ACTIONS.SET_SELECTED_SECTION, payload: null });
      }
    },
    [dispatch, ACTIONS]
  );

  const handleSubmit = useCallback(() => {
    if (selectedItems.length > 0) {
      onSelectItems(selectedItems);
    }
  }, [selectedItems, onSelectItems]);

  // Render the current view content
  const renderCurrentView = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center py-8">
          <Spinner />
        </div>
      );
    }

    switch (currentView) {
      case 'collections':
        return (
          <CollectionsList
            collections={collections}
            onCollectionClick={handleCollectionClick}
            isLoading={isLoading}
          />
        );
      case 'sections':
        return (
          <SectionsList
            sections={sections as Section[]}
            mode={mode}
            onSectionClick={handleSectionClick}
            onSelectItem={handleSelectItem}
            isItemSelected={isItemSelected}
          />
        );
      case 'documents':
        return (
          <DocumentsGrid
            documents={documents as Document[]}
            thumbnails={thumbnails}
            mode={mode}
            onSelectItem={handleSelectItem}
            isItemSelected={isItemSelected}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div
      className="bg-muted/30 rounded-lg border p-4 flex flex-col gap-4"
      style={{ maxHeight: '550px' }}
    >
      {/* Toolbar with breadcrumb and select all */}
      <div className="flex items-center justify-between flex-shrink-0">
        <div className="flex-1">
          <BrowserBreadcrumb
            sourceType={sourceType}
            currentView={currentView}
            selectedCollection={selectedCollection || undefined}
            selectedSection={selectedSection || undefined}
            onNavigate={handleNavigate}
          />
        </div>
        <SelectionToolbar
          mode={mode}
          currentView={currentView}
          sections={sections as Section[]}
          documents={documents as Document[]}
          allowMultiple={allowMultiple}
          areAllItemsSelected={areAllItemsSelected}
          toggleAllItems={toggleAllItems}
        />
      </div>

      {/* Main content area with scroll */}
      <div className="flex-1 min-h-0 rounded-md border overflow-hidden">
        <ScrollArea className="h-full w-full max-h-[400px]">
          <div className="p-4" style={{ minHeight: '150px' }}>
            {renderCurrentView()}
          </div>
        </ScrollArea>
      </div>

      {/* Footer with selection count and action buttons */}
      <ImportFooter
        selectedItems={selectedItems}
        onClearSelection={clearSelection}
        onCancel={onCancel}
        onSubmit={handleSubmit}
      />
    </div>
  );
}

export default ImportBrowser;
