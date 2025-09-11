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
 * Direction for moving items in an array
 */
type MoveDirection = 'up' | 'down';

/**
 * Generic item with an identifiable field
 */
interface IdentifiableItem {
  [key: string]: any;
}

/**
 * Calculate the next order value for a new item (documents - newest first)
 * @param highestOrder - The current highest order value
 * @returns The next order value
 */
export function getNextDescendingOrder(highestOrder: number | null | undefined): number {
  if (highestOrder === null || highestOrder === undefined) {
    return DEFAULT_ORDER;
  }
  return highestOrder + ORDER_GAP;
}

/**
 * Calculate the next order value for a new item (sections - sequential)
 * @param highestOrder - The current highest order value
 * @returns The next order value
 */
export function getNextAscendingOrder(highestOrder: number | null | undefined): number {
  if (highestOrder === null || highestOrder === undefined) {
    return DEFAULT_ORDER;
  }
  return highestOrder + ORDER_GAP;
}

/**
 * Calculate order values for a batch of items (documents - newest first)
 * First item gets highest order value
 * @param count - Number of items
 * @returns Array of order values
 */
export function calculateDescendingOrderValues(count: number): number[] {
  return Array.from(
    { length: count },
    (_, index) => (count - index) * ORDER_GAP
  );
}

/**
 * Calculate order values for a batch of items (sections - sequential)
 * First item gets lowest order value
 * @param count - Number of items
 * @returns Array of order values
 */
export function calculateAscendingOrderValues(count: number): number[] {
  return Array.from({ length: count }, (_, index) => (index + 1) * ORDER_GAP);
}

/**
 * Calculate order value for a specific position (documents - newest first)
 * @param position - Zero-based position (0 = first/newest)
 * @param total - Total number of items
 * @returns Order value for the position
 */
export function getDescendingOrderForPosition(position: number, total: number): number {
  return (total - position) * ORDER_GAP;
}

/**
 * Calculate order value for a specific position (sections - sequential)
 * @param position - Zero-based position (0 = first)
 * @returns Order value for the position
 */
export function getAscendingOrderForPosition(position: number): number {
  return (position + 1) * ORDER_GAP;
}

/**
 * Get fallback order value using timestamp
 * Used when order calculation fails to ensure uniqueness
 * @returns Current timestamp
 */
export function getFallbackOrder(): number {
  return Date.now();
}

/**
 * Reorder an array by moving an item from one position to another
 * @param items - Array of items to reorder
 * @param fromIndex - Current index of item to move
 * @param toIndex - Target index for the item
 * @returns New reordered array
 */
export function reorderArray<T>(items: T[], fromIndex: number, toIndex: number): T[] {
  if (fromIndex < 0 || fromIndex >= items.length) return items;
  if (toIndex < 0 || toIndex >= items.length) return items;

  const result = [...items];
  const [movedItem] = result.splice(fromIndex, 1);
  result.splice(toIndex, 0, movedItem);
  return result;
}

/**
 * Move an item up or down in an ordered array
 * @param items - Array of items
 * @param itemId - ID of item to move
 * @param direction - Direction to move
 * @param idField - Name of the ID field (default: 'id')
 * @returns New reordered array or null if move is invalid
 */
export function moveItemInArray<T extends IdentifiableItem>(
  items: T[],
  itemId: string | number,
  direction: MoveDirection,
  idField = 'id'
): T[] | null {
  const currentIndex = items.findIndex((item) => item[idField] === itemId);
  if (currentIndex === -1) return null;

  const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;

  if (newIndex < 0 || newIndex >= items.length) return null;

  return reorderArray(items, currentIndex, newIndex);
}