import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import { PlusIcon, MoreHorizontal, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import { Spinner } from '@/components/ui/custom/spinner';
import { Section } from './Section';

export function SectionsList({
  sections,
  allDocuments,
  isLoading,
  error,
  onMoveSection,
  onAddSection,
  onImportSections,
  onImportDocuments,
  collectionType,
  entityId,
  showImportMenu = false,
}) {
  const { t } = useTranslation();
  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Spinner />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <AlertCircle className="h-10 w-10 text-red-500 mb-2" />
          <CardTitle className="text-red-700 mb-2">
            {t('documents.errorLoadingSections')}
          </CardTitle>
          <p className="text-red-700">
            {error.message || t('common.unexpectedError')}
          </p>
          <p className="text-muted-foreground text-sm mt-2">
            {t('common.tryAgainOrContact')}
          </p>
        </CardContent>
      </Card>
    );
  }

  if (!sections || sections.length === 0) {
    return (
      <Card>
        <CardHeader className="flex flex-row justify-between border-b h-12 pr-6 pl-3">
          {showImportMenu && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 p-0">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuItem onClick={onImportSections}>
                  {t('documents.importSections')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          <div className="flex-1"></div>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center h-[40vh] text-center py-12">
          <p className="text-muted-foreground mb-4">
            {t('documents.noSectionsFound')}
          </p>
          <Button variant="default" onClick={onAddSection}>
            <PlusIcon className="size-4 mr-2" />
            {t('documents.addSection')}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="gap-0">
      <CardHeader className="flex flex-row justify-between border-b h-12 pr-6 pl-3">
        {showImportMenu && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem onClick={onImportSections}>
                {t('documents.importSections')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
        <div className="flex-1"></div>
        <Button variant="default" onClick={onAddSection} size="sm">
          <PlusIcon className="size-4 mr-2" />
          {t('documents.addSection')}
        </Button>
      </CardHeader>

      <CardContent className="p-0 pt-0 mt-0">
        {sections.map((section, index) => (
          <Section
            collectionType={collectionType}
            entityId={entityId}
            key={section.id}
            sectionData={section}
            allDocuments={allDocuments}
            index={index}
            onMoveSection={onMoveSection}
            totalSections={sections.length}
            showImportMenu={showImportMenu}
            onImportDocuments={onImportDocuments}
          />
        ))}
      </CardContent>
    </Card>
  );
}

SectionsList.propTypes = {
  sections: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      documentOrder: PropTypes.arrayOf(PropTypes.string),
    })
  ),
  allDocuments: PropTypes.array,
  isLoading: PropTypes.bool.isRequired,
  error: PropTypes.object,
  onMoveSection: PropTypes.func.isRequired,
  onAddSection: PropTypes.func.isRequired,
  onImportSections: PropTypes.func,
  onImportDocuments: PropTypes.func,
  collectionType: PropTypes.oneOf(['project', 'library']).isRequired,
  entityId: PropTypes.string,
  showImportMenu: PropTypes.bool,
};
