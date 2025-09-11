import i18n from '@/i18n/config';
import { Timestamp } from 'firebase/firestore';

/**
 * Locale configuration type
 */
interface LocaleConfig {
  locale: string;
  dateOptions: Intl.DateTimeFormatOptions;
  dateTimeOptions: Intl.DateTimeFormatOptions;
  shortDateOptions: Intl.DateTimeFormatOptions;
  timeOptions: Intl.DateTimeFormatOptions;
}

/**
 * Supported languages
 */
type SupportedLanguage = 'en' | 'da';

/**
 * Format types for date formatting
 */
type DateFormat = 'date' | 'dateTime' | 'shortDate' | 'time';

/**
 * Locale configurations for date/time formatting
 */
const localeConfig: Record<SupportedLanguage, LocaleConfig> = {
  en: {
    locale: 'en-US',
    dateOptions: {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    },
    dateTimeOptions: {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric',
      hour12: true,
    },
    shortDateOptions: {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    },
    timeOptions: {
      hour: 'numeric',
      minute: 'numeric',
      hour12: true,
    },
  },
  da: {
    locale: 'da-DK',
    dateOptions: {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    },
    dateTimeOptions: {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric',
      hour12: false, // Danish uses 24-hour format
    },
    shortDateOptions: {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    },
    timeOptions: {
      hour: 'numeric',
      minute: 'numeric',
      hour12: false,
    },
  },
};

/**
 * Get the current locale configuration
 */
const getCurrentLocaleConfig = (): LocaleConfig => {
  const lang = (i18n.language || 'en') as SupportedLanguage;
  return localeConfig[lang] || localeConfig.en;
};

/**
 * Type for acceptable timestamp inputs
 */
type TimestampInput = 
  | Timestamp 
  | Date 
  | number 
  | string 
  | { toDate: () => Date }
  | { seconds: number }
  | null 
  | undefined;

/**
 * Convert Firestore timestamp to JavaScript Date
 * @param timestamp - Firestore timestamp, Date object, or Unix timestamp
 * @returns JavaScript Date object or null if invalid
 */
export const convertToDate = (timestamp: TimestampInput): Date | null => {
  if (!timestamp) return null;

  // Handle Firestore timestamp
  if (timestamp && typeof timestamp === 'object' && 'toDate' in timestamp && typeof timestamp.toDate === 'function') {
    return timestamp.toDate();
  }

  // Handle Firestore timestamp with seconds property
  if (timestamp && typeof timestamp === 'object' && 'seconds' in timestamp) {
    return new Date(timestamp.seconds * 1000);
  }

  // Handle JavaScript Date
  if (timestamp instanceof Date) {
    return timestamp;
  }

  // Handle Unix timestamp (number)
  if (typeof timestamp === 'number') {
    return new Date(timestamp);
  }

  // Try to parse as string
  if (typeof timestamp === 'string') {
    const parsed = new Date(timestamp);
    return isNaN(parsed.getTime()) ? null : parsed;
  }

  return null;
};

/**
 * Format a date with locale support
 * @param timestamp - Timestamp to format
 * @param format - Format type: "date", "dateTime", "shortDate", "time"
 * @returns Formatted date string
 */
export const formatDate = (timestamp: TimestampInput, format: DateFormat = 'date'): string => {
  const date = convertToDate(timestamp);
  if (!date) return '—';

  const config = getCurrentLocaleConfig();
  let options: Intl.DateTimeFormatOptions;

  switch (format) {
    case 'dateTime':
      options = config.dateTimeOptions;
      break;
    case 'shortDate':
      options = config.shortDateOptions;
      break;
    case 'time':
      options = config.timeOptions;
      break;
    case 'date':
    default:
      options = config.dateOptions;
      break;
  }

  try {
    return new Intl.DateTimeFormat(config.locale, options).format(date);
  } catch {
    return date.toLocaleDateString();
  }
};

/**
 * Format a relative date (e.g., "2 days ago", "in 3 hours")
 * @param timestamp - Timestamp to format
 * @returns Relative date string
 */
export const formatRelativeDate = (timestamp: TimestampInput): string => {
  const date = convertToDate(timestamp);
  if (!date) return '—';

  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  const config = getCurrentLocaleConfig();

  // Use Intl.RelativeTimeFormat if available
  if (typeof Intl !== 'undefined' && Intl.RelativeTimeFormat) {
    const rtf = new Intl.RelativeTimeFormat(config.locale, {
      numeric: 'auto',
    });

    interface Division {
      amount: number;
      name: Intl.RelativeTimeFormatUnit | 'seconds' | 'minutes' | 'hours' | 'days' | 'weeks' | 'months' | 'years';
    }

    const divisions: Division[] = [
      { amount: 60, name: 'seconds' },
      { amount: 60, name: 'minutes' },
      { amount: 24, name: 'hours' },
      { amount: 7, name: 'days' },
      { amount: 4.34524, name: 'weeks' },
      { amount: 12, name: 'months' },
      { amount: Number.POSITIVE_INFINITY, name: 'years' },
    ];

    let duration = Math.abs(diffInSeconds);
    for (const division of divisions) {
      if (duration < division.amount) {
        const unit = division.name.slice(0, -1) as Intl.RelativeTimeFormatUnit;
        return rtf.format(
          diffInSeconds < 0 ? Math.floor(duration) : -Math.floor(duration),
          unit
        );
      }
      duration /= division.amount;
    }
  }

  // Fallback to regular date formatting
  return formatDate(date, 'shortDate');
};