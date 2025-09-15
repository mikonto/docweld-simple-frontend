import { useTranslation } from 'react-i18next';
import { Checkbox } from '@/components/ui/checkbox';
import { Document, Section } from '@/types/api/firestore';

interface SelectionToolbarProps {
  mode: 'section' | 'document' | 'both';
  currentView: 'collections' | 'sections' | 'documents';
  sections: Section[];
  documents: Document[];
  allowMultiple: boolean;
  areAllItemsSelected: (type: 'section' | 'document') => boolean;
  toggleAllItems: (type: 'section' | 'document') => void;
}

/**
 * Selection toolbar with "Select All" checkbox
 */
function SelectionToolbar({
  mode,
  currentView,
  sections,
  documents,
  allowMultiple,
  areAllItemsSelected,
  toggleAllItems,
}: SelectionToolbarProps) {
  const { t } = useTranslation();

  // Determine if we should show select all checkbox
  const shouldShowSelectAll = () => {
    if (!allowMultiple) return false;

    if (currentView === 'sections') {
      const canSelectSections = mode === 'section' || mode === 'both';
      return canSelectSections && sections.length > 0;
    }

    if (currentView === 'documents') {
      const canSelectDocuments = mode === 'document' || mode === 'both';
      return canSelectDocuments && documents.length > 0;
    }

    return false;
  };

  const getSelectAllLabel = () => {
    return currentView === 'sections'
      ? t('documents.selectAllSections')
      : t('documents.selectAllDocuments');
  };

  const handleSelectAllChange = () => {
    if (currentView === 'sections') {
      toggleAllItems('section');
    } else if (currentView === 'documents') {
      toggleAllItems('document');
    }
  };

  const isAllSelected = () => {
    if (currentView === 'sections') {
      return areAllItemsSelected('section');
    } else if (currentView === 'documents') {
      return areAllItemsSelected('document');
    }
    return false;
  };

  if (!shouldShowSelectAll()) {
    return null;
  }

  return (
    <div className="flex items-center gap-2 ml-4">
      <Checkbox
        checked={isAllSelected()}
        onCheckedChange={handleSelectAllChange}
      />
      <label className="text-sm font-medium">{getSelectAllLabel()}</label>
    </div>
  );
}

export default SelectionToolbar;
