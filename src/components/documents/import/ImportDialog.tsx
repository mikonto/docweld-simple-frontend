import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Spinner } from '@/components/ui/custom/spinner';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ImportBrowser from './ImportBrowser';

interface ImportDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (items: any[]) => void;
  isImporting?: boolean;
  mode?: 'section' | 'document';
  projectId?: string | null;
  hideProjectDocuments?: boolean;
}

export default function ImportDialog({
  open,
  onClose,
  onSubmit,
  isImporting = false,
  mode = 'section',
  projectId = null,
  hideProjectDocuments = false,
}: ImportDialogProps) {
  const { t } = useTranslation();

  const [importSource, setImportSource] = useState<'documentLibrary' | 'projectLibrary'>('documentLibrary');

  const [browserKey, setBrowserKey] = useState(0);

  React.useEffect(() => {
    if (open) {
      const defaultSource =
        hideProjectDocuments || !projectId
          ? 'documentLibrary'
          : 'projectLibrary';
      setImportSource(defaultSource);
      setBrowserKey((prevKey) => prevKey + 1); // Force remount on open
    }
  }, [open, projectId, hideProjectDocuments]); // Add hideProjectDocuments as dependency

  // Handle source type change with a proper React remount
  const handleSourceChange = (newSource: string) => {
    // Update the source type
    setImportSource(newSource as 'documentLibrary' | 'projectLibrary');

    // Increment key to force component remount
    setBrowserKey((prevKey) => prevKey + 1);
  };

  // Simplified handler for item selection that directly processes items
  const handleItemsSelected = (items: any[]) => {
    // Process selected items for import
    if (items.length === 0) return;

    // Format items to match what useDocumentImport expects
    const imports = items.map((item) => {
      // The useDocumentImport hook expects items with the original data structure
      // plus the type field and source information
      return {
        ...item, // Keep all original fields from the selected item
        type: item.type, // Explicitly set type (section or document)
        // Add source information based on where we're importing from
        projectId: item.projectId || null,
        collectionId: item.collectionId || null,
      };
    });

    // Call submit function with the formatted imports
    onSubmit(imports);
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-[850px] h-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === 'document'
              ? t('documents.importDocuments')
              : t('documents.importSections')}
          </DialogTitle>
        </DialogHeader>

        {/* Source selection tabs - only show when projectId exists and hideProjectDocuments is false */}
        {projectId && !hideProjectDocuments && (
          <Tabs
            value={importSource}
            onValueChange={handleSourceChange}
            className="mt-4"
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="projectLibrary">
                {t('documents.projectDocuments')}
              </TabsTrigger>
              <TabsTrigger value="documentLibrary">
                {t('documents.documentLibrary')}
              </TabsTrigger>
            </TabsList>
          </Tabs>
        )}

        {isImporting ? (
          <div className="flex flex-col items-center space-y-4 py-8">
            <Spinner size="large" />
            <p>{t('documents.importing')}</p>
          </div>
        ) : (
          <ImportBrowser
            key={browserKey}
            onSelectItems={handleItemsSelected}
            onCancel={onClose}
            mode={mode === 'section' ? 'section' : 'document'}
            allowMultiple={true}
            sourceType={importSource}
            projectId={projectId}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}