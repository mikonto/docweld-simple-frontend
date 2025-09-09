import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import { FolderIcon, ChevronRight } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';

/**
 * Displays a list of document sections with optional selection
 */
function SectionsList({
  sections,
  mode,
  onSectionClick,
  onSelectItem,
  isItemSelected,
}) {
  const { t } = useTranslation();

  const canSelectSections = mode === 'section' || mode === 'both';
  const canNavigate = mode === 'document' || mode === 'both';

  if (sections.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        {t('documents.noSectionsFound')}
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {sections.map((section) => {
        const isSelected = isItemSelected(section, 'section');

        return (
          <div
            key={section.id}
            className={`${
              canNavigate
                ? 'cursor-pointer hover:bg-muted/50'
                : canSelectSections
                  ? 'cursor-pointer'
                  : ''
            } transition-colors rounded-md border px-3 py-2 flex items-center justify-between ${
              isSelected ? 'ring-2 ring-primary' : ''
            }`}
            onClick={() => {
              if (canNavigate && !canSelectSections) {
                onSectionClick(section);
              } else if (canSelectSections) {
                onSelectItem(section, 'section');
              }
            }}
          >
            <div className="flex items-center gap-2">
              {canSelectSections && (
                <div
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectItem(section, 'section');
                  }}
                >
                  <Checkbox checked={isSelected} />
                </div>
              )}
              <FolderIcon className="h-5 w-5 text-muted-foreground" />
              <div>
                <h3 className="text-sm font-medium">{section.name}</h3>
                <p className="text-xs text-muted-foreground">
                  {t(
                    section.documentCount === 1
                      ? 'documents.documents_one'
                      : 'documents.documents_other',
                    { count: section.documentCount }
                  )}
                </p>
              </div>
            </div>
            {canNavigate && (
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            )}
          </div>
        );
      })}
    </div>
  );
}

SectionsList.propTypes = {
  sections: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      documentCount: PropTypes.number,
    })
  ).isRequired,
  mode: PropTypes.oneOf(['section', 'document', 'both']).isRequired,
  onSectionClick: PropTypes.func,
  onSelectItem: PropTypes.func.isRequired,
  isItemSelected: PropTypes.func.isRequired,
};

export default SectionsList;
