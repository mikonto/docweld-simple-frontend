import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import { Library, ChevronRight } from 'lucide-react';

/**
 * Displays a list of document collections
 */
function CollectionsList({ collections, onCollectionClick, isLoading }) {
  const { t } = useTranslation();

  if (isLoading) {
    return null; // Loading state handled by parent
  }

  if (collections.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        {t('documents.noCollectionsFound')}
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {collections.map((col) => (
        <div
          key={col.id}
          className="cursor-pointer hover:bg-muted/50 transition-colors rounded-md border px-3 py-2 flex items-center justify-between"
          onClick={() => onCollectionClick(col)}
        >
          <div className="flex items-center gap-2">
            <Library className="h-5 w-5 text-muted-foreground" />
            <div>
              <h3 className="text-sm font-medium">{col.name}</h3>
              <p className="text-xs text-muted-foreground">
                {col.sectionCount >= 0 &&
                  t(
                    col.sectionCount === 1
                      ? 'documents.sections_one'
                      : 'documents.sections_other',
                    { count: col.sectionCount }
                  )}
                {' • '}
                {col.documentCount >= 0 &&
                  t(
                    col.documentCount === 1
                      ? 'documents.documents_one'
                      : 'documents.documents_other',
                    { count: col.documentCount }
                  )}
              </p>
            </div>
          </div>
          <ChevronRight className="h-5 w-5 text-muted-foreground" />
        </div>
      ))}
    </div>
  );
}

CollectionsList.propTypes = {
  collections: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      sectionCount: PropTypes.number,
      documentCount: PropTypes.number,
    })
  ).isRequired,
  onCollectionClick: PropTypes.func.isRequired,
  isLoading: PropTypes.bool,
};

export default CollectionsList;
