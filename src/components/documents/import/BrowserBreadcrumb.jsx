import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';

/**
 * Breadcrumb navigation for the import browser
 */
function BrowserBreadcrumb({
  sourceType,
  currentView,
  selectedCollection,
  selectedSection,
  onNavigate,
}) {
  const { t } = useTranslation();

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {/* Collections level */}
        {sourceType === 'documentLibrary' && (
          <>
            <BreadcrumbItem>
              {currentView === 'collections' ? (
                <BreadcrumbPage>{t('documents.library')}</BreadcrumbPage>
              ) : (
                <BreadcrumbLink
                  className="cursor-pointer"
                  onClick={() => onNavigate('collections')}
                >
                  {t('documents.library')}
                </BreadcrumbLink>
              )}
            </BreadcrumbItem>
            {selectedCollection && <BreadcrumbSeparator />}
          </>
        )}

        {/* Selected collection / Project documents */}
        {selectedCollection && (
          <>
            <BreadcrumbItem>
              {currentView === 'sections' ? (
                <BreadcrumbPage>{selectedCollection.name}</BreadcrumbPage>
              ) : (
                <BreadcrumbLink
                  className="cursor-pointer"
                  onClick={() => onNavigate('sections')}
                >
                  {selectedCollection.name}
                </BreadcrumbLink>
              )}
            </BreadcrumbItem>
            {selectedSection && <BreadcrumbSeparator />}
          </>
        )}

        {/* Selected section */}
        {selectedSection && (
          <BreadcrumbItem>
            <BreadcrumbPage>{selectedSection.name}</BreadcrumbPage>
          </BreadcrumbItem>
        )}
      </BreadcrumbList>
    </Breadcrumb>
  );
}

BrowserBreadcrumb.propTypes = {
  sourceType: PropTypes.oneOf(['documentLibrary', 'projectLibrary']).isRequired,
  currentView: PropTypes.oneOf(['collections', 'sections', 'documents'])
    .isRequired,
  selectedCollection: PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
  }),
  selectedSection: PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
  }),
  onNavigate: PropTypes.func.isRequired,
};

export default BrowserBreadcrumb;
