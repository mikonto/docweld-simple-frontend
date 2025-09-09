import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  ORDER_GAP,
  DEFAULT_ORDER,
  getNextDescendingOrder,
  getNextAscendingOrder,
  calculateDescendingOrderValues,
  calculateAscendingOrderValues,
  getDescendingOrderForPosition,
  getAscendingOrderForPosition,
  getFallbackOrder,
  reorderArray,
  moveItemInArray,
} from './orderManagement';

describe('Order Management Utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Constants', () => {
    it('should define correct order gap', () => {
      expect(ORDER_GAP).toBe(1000);
    });

    it('should define correct default order', () => {
      expect(DEFAULT_ORDER).toBe(1000);
    });
  });

  describe('getNextDescendingOrder', () => {
    it('should return default order when no highest order exists', () => {
      expect(getNextDescendingOrder(null)).toBe(DEFAULT_ORDER);
      expect(getNextDescendingOrder(undefined)).toBe(DEFAULT_ORDER);
    });

    it('should add order gap to highest order', () => {
      expect(getNextDescendingOrder(5000)).toBe(6000);
      expect(getNextDescendingOrder(0)).toBe(1000);
    });
  });

  describe('getNextAscendingOrder', () => {
    it('should return default order when no highest order exists', () => {
      expect(getNextAscendingOrder(null)).toBe(DEFAULT_ORDER);
      expect(getNextAscendingOrder(undefined)).toBe(DEFAULT_ORDER);
    });

    it('should add order gap to highest order', () => {
      expect(getNextAscendingOrder(3000)).toBe(4000);
      expect(getNextAscendingOrder(0)).toBe(1000);
    });
  });

  describe('calculateDescendingOrderValues', () => {
    it('should calculate descending order values correctly', () => {
      expect(calculateDescendingOrderValues(3)).toEqual([3000, 2000, 1000]);
      expect(calculateDescendingOrderValues(1)).toEqual([1000]);
      expect(calculateDescendingOrderValues(0)).toEqual([]);
    });

    it('should place newest items first with highest order', () => {
      const orders = calculateDescendingOrderValues(5);
      expect(orders[0]).toBeGreaterThan(orders[1]);
      expect(orders[1]).toBeGreaterThan(orders[2]);
    });
  });

  describe('calculateAscendingOrderValues', () => {
    it('should calculate ascending order values correctly', () => {
      expect(calculateAscendingOrderValues(3)).toEqual([1000, 2000, 3000]);
      expect(calculateAscendingOrderValues(1)).toEqual([1000]);
      expect(calculateAscendingOrderValues(0)).toEqual([]);
    });

    it('should place first items with lowest order', () => {
      const orders = calculateAscendingOrderValues(5);
      expect(orders[0]).toBeLessThan(orders[1]);
      expect(orders[1]).toBeLessThan(orders[2]);
    });
  });

  describe('getDescendingOrderForPosition', () => {
    it('should calculate correct order for position', () => {
      expect(getDescendingOrderForPosition(0, 5)).toBe(5000); // First position
      expect(getDescendingOrderForPosition(2, 5)).toBe(3000); // Middle position
      expect(getDescendingOrderForPosition(4, 5)).toBe(1000); // Last position
    });
  });

  describe('getAscendingOrderForPosition', () => {
    it('should calculate correct order for position', () => {
      expect(getAscendingOrderForPosition(0)).toBe(1000); // First position
      expect(getAscendingOrderForPosition(2)).toBe(3000); // Third position
      expect(getAscendingOrderForPosition(4)).toBe(5000); // Fifth position
    });
  });

  describe('getFallbackOrder', () => {
    it('should return a timestamp', () => {
      const before = Date.now();
      const fallback = getFallbackOrder();
      const after = Date.now();

      expect(fallback).toBeGreaterThanOrEqual(before);
      expect(fallback).toBeLessThanOrEqual(after);
    });
  });

  describe('reorderArray', () => {
    it('should reorder array correctly', () => {
      const items = ['a', 'b', 'c', 'd'];

      expect(reorderArray(items, 0, 2)).toEqual(['b', 'c', 'a', 'd']);
      expect(reorderArray(items, 3, 1)).toEqual(['a', 'd', 'b', 'c']);
      expect(reorderArray(items, 1, 1)).toEqual(['a', 'b', 'c', 'd']);
    });

    it('should return original array for invalid indices', () => {
      const items = ['a', 'b', 'c'];

      expect(reorderArray(items, -1, 1)).toEqual(items);
      expect(reorderArray(items, 1, 5)).toEqual(items);
      expect(reorderArray(items, 5, 1)).toEqual(items);
    });

    it('should not mutate original array', () => {
      const items = ['a', 'b', 'c'];
      const result = reorderArray(items, 0, 2);

      expect(items).toEqual(['a', 'b', 'c']);
      expect(result).toEqual(['b', 'c', 'a']);
    });
  });

  describe('moveItemInArray', () => {
    const items = [
      { id: '1', name: 'First' },
      { id: '2', name: 'Second' },
      { id: '3', name: 'Third' },
    ];

    it('should move item up correctly', () => {
      const result = moveItemInArray(items, '2', 'up');
      expect(result).toEqual([
        { id: '2', name: 'Second' },
        { id: '1', name: 'First' },
        { id: '3', name: 'Third' },
      ]);
    });

    it('should move item down correctly', () => {
      const result = moveItemInArray(items, '2', 'down');
      expect(result).toEqual([
        { id: '1', name: 'First' },
        { id: '3', name: 'Third' },
        { id: '2', name: 'Second' },
      ]);
    });

    it('should return null when moving first item up', () => {
      expect(moveItemInArray(items, '1', 'up')).toBeNull();
    });

    it('should return null when moving last item down', () => {
      expect(moveItemInArray(items, '3', 'down')).toBeNull();
    });

    it('should return null for non-existent item', () => {
      expect(moveItemInArray(items, 'invalid', 'up')).toBeNull();
    });

    it('should work with custom id field', () => {
      const customItems = [
        { key: 'a', value: 1 },
        { key: 'b', value: 2 },
        { key: 'c', value: 3 },
      ];

      const result = moveItemInArray(customItems, 'b', 'up', 'key');
      expect(result).toEqual([
        { key: 'b', value: 2 },
        { key: 'a', value: 1 },
        { key: 'c', value: 3 },
      ]);
    });
  });
});
