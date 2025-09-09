import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import { Checkbox } from '@/components/ui/checkbox';

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
}) {
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

SelectionToolbar.propTypes = {
  mode: PropTypes.oneOf(['section', 'document', 'both']).isRequired,
  currentView: PropTypes.oneOf(['collections', 'sections', 'documents'])
    .isRequired,
  sections: PropTypes.array.isRequired,
  documents: PropTypes.array.isRequired,
  allowMultiple: PropTypes.bool.isRequired,
  areAllItemsSelected: PropTypes.func.isRequired,
  toggleAllItems: PropTypes.func.isRequired,
};

export default SelectionToolbar;
