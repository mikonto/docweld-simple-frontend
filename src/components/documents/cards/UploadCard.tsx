import { useRef, ChangeEvent } from 'react';
import { UploadCloud } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Card as CardPrimitive } from '@/components/ui/card';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { UPLOAD_CONFIG } from '@/types/documents';
import { useDragAndDrop } from '@/hooks/documents';

interface UploadCardProps {
  onUpload: (files: File[]) => void;
  maxFilesAllowed: number;
}

export function UploadCard({ onUpload, maxFilesAllowed }: UploadCardProps) {
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { isDragging, dragProps } = useDragAndDrop((files) => {
    if (files && files.length > 0) {
      onUpload(Array.from(files));
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  });

  // Event Handlers
  const handleClick = () => fileInputRef.current?.click();

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      onUpload(Array.from(files));
      event.target.value = '';
    }
  };

  const supportedFormats = UPLOAD_CONFIG.ALLOWED_EXTENSIONS.map((ext) =>
    ext.substring(1).toUpperCase()
  ).join(', ');
  const heicNote = t('documents.uploadCard.heicNote');
  const infoTooltip = `${t('documents.uploadCard.maxFiles', { count: maxFilesAllowed })}
${t('documents.uploadCard.supportedFormats', { formats: supportedFormats })}
${t('common.note')}: ${heicNote}`;

  return (
    <CardPrimitive
      style={{
        padding: 0,
      }}
      className={`flex flex-col justify-center items-center cursor-pointer transition-colors p-0 h-full w-full ${
        isDragging ? 'bg-accent' : 'bg-card hover:bg-accent/50'
      }`}
      onClick={handleClick}
      {...dragProps}
    >
      <div className="flex flex-col items-center justify-center h-full w-full p-4">
        <UploadCloud className="h-12 w-12 mb-2 text-primary" />
        <p className="text-sm text-center">
          {isDragging
            ? t('documents.dropFilesHere')
            : t('documents.clickOrDropFiles')}
          <TooltipProvider>
            <Tooltip delayDuration={500}>
              <TooltipTrigger asChild>
                <span className="ml-1" onClick={(e) => e.stopPropagation()}>
                  ⓘ
                </span>
              </TooltipTrigger>
              <TooltipContent className="whitespace-pre-line">
                {infoTooltip}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </p>
      </div>
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        onChange={handleFileChange}
        multiple
        accept={UPLOAD_CONFIG.ALLOWED_EXTENSIONS.join(',')}
      />
    </CardPrimitive>
  );
}
