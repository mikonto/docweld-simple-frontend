import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  formatDate,
  formatRelativeDate,
  convertToDate,
} from './dateFormatting';
import i18n from '@/i18n/config';

vi.mock('@/i18n/config');

const mockI18n = vi.mocked(i18n);

describe('dateFormatting', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockI18n.language = 'en';
  });

  describe('convertToDate', () => {
    it('should handle Firestore timestamp with toDate method', () => {
      const mockDate = new Date('2024-01-01T10:00:00Z');
      const firestoreTimestamp = {
        toDate: vi.fn(() => mockDate),
      };

      const result = convertToDate(firestoreTimestamp);
      expect(result).toEqual(mockDate);
      expect(firestoreTimestamp.toDate).toHaveBeenCalled();
    });

    it('should handle Firestore timestamp with seconds property', () => {
      const seconds = 1704103200; // 2024-01-01T10:00:00Z
      const firestoreTimestamp = { seconds };

      const result = convertToDate(firestoreTimestamp);
      expect(result).toEqual(new Date(seconds * 1000));
    });

    it('should handle JavaScript Date object', () => {
      const date = new Date('2024-01-01T10:00:00Z');
      const result = convertToDate(date);
      expect(result).toEqual(date);
    });

    it('should handle Unix timestamp', () => {
      const timestamp = 1704103200000; // 2024-01-01T10:00:00Z
      const result = convertToDate(timestamp);
      expect(result).toEqual(new Date(timestamp));
    });

    it('should return null for invalid input', () => {
      expect(convertToDate(null)).toBeNull();
      expect(convertToDate(undefined)).toBeNull();
      expect(convertToDate('invalid-date')).toBeNull();
    });
  });

  describe('formatDate', () => {
    const testDate = new Date('2024-01-15T14:30:45Z');

    describe('English locale', () => {
      beforeEach(() => {
        mockI18n.language = 'en';
      });

      it('should format date in default format', () => {
        const result = formatDate(testDate);
        expect(result).toMatch(/January 15, 2024/);
      });

      it('should format date with time', () => {
        const result = formatDate(testDate, 'dateTime');
        expect(result).toMatch(/January 15, 2024/);
        expect(result).toMatch(/PM/); // Should use 12-hour format
      });

      it('should format short date', () => {
        const result = formatDate(testDate, 'shortDate');
        expect(result).toMatch(/Jan 15, 2024/);
      });

      it('should format time only', () => {
        const result = formatDate(testDate, 'time');
        expect(result).toMatch(/PM/); // Should use 12-hour format
      });
    });

    describe('Danish locale', () => {
      beforeEach(() => {
        mockI18n.language = 'da';
      });

      it('should format date in Danish format', () => {
        const result = formatDate(testDate);
        expect(result).toMatch(/15\. januar 2024/);
      });

      it('should format date with time in 24-hour format', () => {
        const result = formatDate(testDate, 'dateTime');
        expect(result).toMatch(/15\. januar 2024/);
        expect(result).not.toMatch(/[AP]M/); // Should use 24-hour format
      });

      it('should format short date in Danish', () => {
        const result = formatDate(testDate, 'shortDate');
        expect(result).toMatch(/15\. jan\. 2024/);
      });

      it('should format time in 24-hour format', () => {
        const result = formatDate(testDate, 'time');
        expect(result).not.toMatch(/[AP]M/); // Should use 24-hour format
      });
    });

    it('should handle null or invalid dates', () => {
      expect(formatDate(null)).toBe('—');
      expect(formatDate(undefined)).toBe('—');
      expect(formatDate('invalid')).toBe('—');
    });

    it('should handle Firestore timestamps', () => {
      const firestoreTimestamp = {
        toDate: () => testDate,
      };
      const result = formatDate(firestoreTimestamp);
      expect(result).toMatch(/January 15, 2024/);
    });
  });

  describe('formatRelativeDate', () => {
    // Mock current time
    const now = new Date('2024-01-15T12:00:00Z');

    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(now);
      mockI18n.language = 'en';
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should format recent dates as relative time', () => {
      // 5 minutes ago
      const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
      const result = formatRelativeDate(fiveMinutesAgo);
      expect(result).toMatch(/5 minutes ago|5 min. ago/);
    });

    it('should format future dates', () => {
      // In 2 hours
      const inTwoHours = new Date(now.getTime() + 2 * 60 * 60 * 1000);
      const result = formatRelativeDate(inTwoHours);
      expect(result).toMatch(/in 2 hours/);
    });

    it('should format dates from yesterday', () => {
      // Yesterday
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const result = formatRelativeDate(yesterday);
      expect(result).toMatch(/yesterday|1 day ago/);
    });

    it('should handle null or invalid dates', () => {
      expect(formatRelativeDate(null)).toBe('—');
      expect(formatRelativeDate(undefined)).toBe('—');
    });

    describe('Danish locale', () => {
      beforeEach(() => {
        mockI18n.language = 'da';
      });

      it('should format relative dates in Danish', () => {
        // 5 minutes ago
        const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
        const result = formatRelativeDate(fiveMinutesAgo);
        // Danish relative time format
        expect(result).toBeDefined();
        expect(result).not.toBe('—');
      });
    });
  });
});
