import { X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface ImageViewDialogProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl?: string | null;
  title: string;
}

export function ImageViewDialog({
  isOpen,
  onClose,
  imageUrl,
  title,
}: ImageViewDialogProps) {
  if (!imageUrl) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <Button
            onClick={onClose}
            className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground"
            variant="ghost"
            size="icon"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </Button>
        </DialogHeader>
        <div className="mt-4">
          <img
            src={imageUrl}
            alt={title}
            className="w-full h-auto max-h-[70vh] object-contain"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
