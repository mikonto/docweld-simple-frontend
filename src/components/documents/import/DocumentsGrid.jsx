import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import { ref, getDownloadURL } from 'firebase/storage';
import { storage } from '@/config/firebase';
import { FileIcon } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { IMPORT_BROWSER_ASPECT_RATIO } from '../constants';

/**
 * Displays a grid of documents with thumbnails and selection
 */
function DocumentsGrid({
  documents,
  thumbnails,
  mode,
  onSelectItem,
  isItemSelected,
}) {
  const { t } = useTranslation();

  const canSelectDocuments = mode === 'document' || mode === 'both';

  if (!canSelectDocuments) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        {t('documents.cannotSelectDocumentsInSectionMode')}
      </div>
    );
  }

  if (documents.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        {t('documents.noDocumentsFound')}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2">
      {documents.map((document) => {
        const isSelected = isItemSelected(document, 'document');
        const thumbnailUrl = thumbnails[document.id];

        return (
          <div
            key={document.id}
            className={`cursor-pointer hover:brightness-90 transition-all border rounded-md overflow-hidden relative ${
              isSelected ? 'border-primary ring-1 ring-primary' : ''
            }`}
            onClick={() => onSelectItem(document, 'document')}
            style={{ aspectRatio: `1/${IMPORT_BROWSER_ASPECT_RATIO}` }}
          >
            {/* Thumbnail container */}
            <div className="absolute inset-0 flex items-center justify-center bg-muted">
              {thumbnailUrl ? (
                <img
                  src={thumbnailUrl}
                  alt={document.title}
                  className="h-full w-full object-cover"
                  onClick={(e) => {
                    // Open document in new tab if storageRef is available
                    if (document.storageRef) {
                      e.stopPropagation();
                      getDownloadURL(ref(storage, document.storageRef))
                        .then((url) => {
                          window.open(url, '_blank');
                        })
                        .catch(() => {
                          // Silently handle error - user will see document didn't open
                        });
                    }
                  }}
                  style={{ cursor: 'pointer' }}
                />
              ) : (
                <FileIcon className="h-12 w-12 text-muted-foreground" />
              )}
            </div>

            {/* Title and checkbox overlay */}
            <div className="absolute bottom-0 left-0 right-0 bg-background p-1.5 flex justify-between items-center z-10 border-t">
              <TooltipProvider>
                <Tooltip delayDuration={500}>
                  <TooltipTrigger asChild>
                    <p className="text-sm truncate w-[80%]">{document.title}</p>
                  </TooltipTrigger>
                  <TooltipContent side="top" align="start">
                    <p>{document.title}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <Checkbox
                checked={isSelected}
                onCheckedChange={() => onSelectItem(document, 'document')}
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

DocumentsGrid.propTypes = {
  documents: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      title: PropTypes.string.isRequired,
      storageRef: PropTypes.string,
      thumbStorageRef: PropTypes.string,
    })
  ).isRequired,
  thumbnails: PropTypes.objectOf(PropTypes.string).isRequired,
  mode: PropTypes.oneOf(['section', 'document', 'both']).isRequired,
  onSelectItem: PropTypes.func.isRequired,
  isItemSelected: PropTypes.func.isRequired,
};

export default DocumentsGrid;
