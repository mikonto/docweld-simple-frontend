import React from 'react';
import PropTypes from 'prop-types';
import { SECTION_SIZE_CONFIG } from '../constants';

/**
 * Responsive card grid component that adapts to container size
 * Uses CSS Grid with auto-fill for responsive card sizing
 */
export function CardGrid({ children, className = '' }) {
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

CardGrid.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
};
