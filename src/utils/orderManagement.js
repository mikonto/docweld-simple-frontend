/**
 * Centralized order management utilities for documents and sections
 *
 * This module provides consistent order calculation and management
 * across the application. Documents use descending order (newest first)
 * while sections use ascending order (first section has lowest order).
 */

/**
 * Standard gap between ordered items
 * Using 1000 allows for easy reordering without recalculating all items
 */
export const ORDER_GAP = 1000;

/**
 * Default starting order value
 */
export const DEFAULT_ORDER = 1000;

/**
 * Calculate the next order value for a new item (documents - newest first)
 * @param {number|null} highestOrder - The current highest order value
 * @returns {number} The next order value
 */
export function getNextDescendingOrder(highestOrder) {
  if (highestOrder === null || highestOrder === undefined) {
    return DEFAULT_ORDER;
  }
  return highestOrder + ORDER_GAP;
}

/**
 * Calculate the next order value for a new item (sections - sequential)
 * @param {number|null} highestOrder - The current highest order value
 * @returns {number} The next order value
 */
export function getNextAscendingOrder(highestOrder) {
  if (highestOrder === null || highestOrder === undefined) {
    return DEFAULT_ORDER;
  }
  return highestOrder + ORDER_GAP;
}

/**
 * Calculate order values for a batch of items (documents - newest first)
 * First item gets highest order value
 * @param {number} count - Number of items
 * @returns {number[]} Array of order values
 */
export function calculateDescendingOrderValues(count) {
  return Array.from(
    { length: count },
    (_, index) => (count - index) * ORDER_GAP
  );
}

/**
 * Calculate order values for a batch of items (sections - sequential)
 * First item gets lowest order value
 * @param {number} count - Number of items
 * @returns {number[]} Array of order values
 */
export function calculateAscendingOrderValues(count) {
  return Array.from({ length: count }, (_, index) => (index + 1) * ORDER_GAP);
}

/**
 * Calculate order value for a specific position (documents - newest first)
 * @param {number} position - Zero-based position (0 = first/newest)
 * @param {number} total - Total number of items
 * @returns {number} Order value for the position
 */
export function getDescendingOrderForPosition(position, total) {
  return (total - position) * ORDER_GAP;
}

/**
 * Calculate order value for a specific position (sections - sequential)
 * @param {number} position - Zero-based position (0 = first)
 * @returns {number} Order value for the position
 */
export function getAscendingOrderForPosition(position) {
  return (position + 1) * ORDER_GAP;
}

/**
 * Get fallback order value using timestamp
 * Used when order calculation fails to ensure uniqueness
 * @returns {number} Current timestamp
 */
export function getFallbackOrder() {
  return Date.now();
}

/**
 * Reorder an array by moving an item from one position to another
 * @param {Array} items - Array of items to reorder
 * @param {number} fromIndex - Current index of item to move
 * @param {number} toIndex - Target index for the item
 * @returns {Array} New reordered array
 */
export function reorderArray(items, fromIndex, toIndex) {
  if (fromIndex < 0 || fromIndex >= items.length) return items;
  if (toIndex < 0 || toIndex >= items.length) return items;

  const result = [...items];
  const [movedItem] = result.splice(fromIndex, 1);
  result.splice(toIndex, 0, movedItem);
  return result;
}

/**
 * Move an item up or down in an ordered array
 * @param {Array} items - Array of items
 * @param {string|number} itemId - ID of item to move
 * @param {'up'|'down'} direction - Direction to move
 * @param {string} idField - Name of the ID field (default: 'id')
 * @returns {Array|null} New reordered array or null if move is invalid
 */
export function moveItemInArray(items, itemId, direction, idField = 'id') {
  const currentIndex = items.findIndex((item) => item[idField] === itemId);
  if (currentIndex === -1) return null;

  const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;

  if (newIndex < 0 || newIndex >= items.length) return null;

  return reorderArray(items, currentIndex, newIndex);
}
