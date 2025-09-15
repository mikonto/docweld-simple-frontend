import { SECTION_SIZE_CONFIG } from '@/types/documents';
import { ReactNode } from 'react';

interface CardGridProps {
  children: ReactNode;
  className?: string;
}

/**
 * Responsive card grid component that adapts to container size
 * Uses CSS Grid with auto-fill for responsive card sizing
 */
export function CardGrid({ children, className = '' }: CardGridProps) {
  const gridStyle = {
    display: 'grid',
    gridTemplateColumns: `repeat(auto-fill, minmax(${SECTION_SIZE_CONFIG.MULTI.CARD_MIN_WIDTH}px, 1fr))`,
    gap: '1rem',
    width: '100%',
  };

  return (
    <div className={className} style={gridStyle}>
      {children}
    </div>
  );
}
