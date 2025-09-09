import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

/**
 * Footer with selection count and action buttons
 */
function ImportFooter({ selectedItems, onClearSelection, onCancel, onSubmit }) {
  const { t } = useTranslation();

  return (
    <div className="flex items-center justify-between pt-2 flex-shrink-0">
      <div className="flex items-center gap-3">
        {selectedItems.length > 0 && (
          <>
            <div className="text-sm text-muted-foreground">
              <span>
                {t('documents.itemsSelected', {
                  count: selectedItems.length,
                })}
              </span>
            </div>
            <Button variant="ghost" size="sm" onClick={onClearSelection}>
              {t('common.clearSelection')}
            </Button>
          </>
        )}
      </div>
      <div className="flex gap-2">
        <Button variant="outline" onClick={onCancel}>
          {t('common.cancel')}
        </Button>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <span>
                <Button
                  onClick={onSubmit}
                  disabled={selectedItems.length === 0}
                >
                  {t('documents.importSelected')}
                </Button>
              </span>
            </TooltipTrigger>
            {selectedItems.length === 0 && (
              <TooltipContent>
                <p>{t('documents.selectItemsToImport')}</p>
              </TooltipContent>
            )}
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  );
}

ImportFooter.propTypes = {
  selectedItems: PropTypes.array.isRequired,
  onClearSelection: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
};

export default ImportFooter;
