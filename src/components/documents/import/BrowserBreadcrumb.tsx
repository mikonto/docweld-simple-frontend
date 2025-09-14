import { useTranslation } from 'react-i18next';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';

interface BrowserBreadcrumbProps {
  sourceType: 'documentLibrary' | 'projectLibrary';
  currentView: 'collections' | 'sections' | 'documents';
  selectedCollection?: {
    id: string;
    name: string;
  };
  selectedSection?: {
    id: string;
    name: string;
  };
  onNavigate: (view: 'collections' | 'sections' | 'documents') => void;
}

/**
 * Breadcrumb navigation for the import browser
 */
function BrowserBreadcrumb({
  sourceType,
  currentView,
  selectedCollection,
  selectedSection,
  onNavigate,
}: BrowserBreadcrumbProps) {
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

export default BrowserBreadcrumb;
