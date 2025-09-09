import i18n from '@/i18n/config';

/**
 * Locale configurations for date/time formatting
 */
const localeConfig = {
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
const getCurrentLocaleConfig = () => {
  const lang = i18n.language || 'en';
  return localeConfig[lang] || localeConfig.en;
};

/**
 * Convert Firestore timestamp to JavaScript Date
 * @param {Object|Date|number} timestamp - Firestore timestamp, Date object, or Unix timestamp
 * @returns {Date|null} JavaScript Date object or null if invalid
 */
export const convertToDate = (timestamp) => {
  if (!timestamp) return null;

  // Handle Firestore timestamp
  if (timestamp.toDate && typeof timestamp.toDate === 'function') {
    return timestamp.toDate();
  }

  // Handle Firestore timestamp with seconds property
  if (timestamp.seconds) {
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
  const parsed = new Date(timestamp);
  return isNaN(parsed.getTime()) ? null : parsed;
};

/**
 * Format a date with locale support
 * @param {Object|Date|number} timestamp - Timestamp to format
 * @param {string} format - Format type: "date", "dateTime", "shortDate", "time"
 * @returns {string} Formatted date string
 */
export const formatDate = (timestamp, format = 'date') => {
  const date = convertToDate(timestamp);
  if (!date) return '—';

  const config = getCurrentLocaleConfig();
  let options;

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
 * @param {Object|Date|number} timestamp - Timestamp to format
 * @returns {string} Relative date string
 */
export const formatRelativeDate = (timestamp) => {
  const date = convertToDate(timestamp);
  if (!date) return '—';

  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);
  const config = getCurrentLocaleConfig();

  // Use Intl.RelativeTimeFormat if available
  if (typeof Intl !== 'undefined' && Intl.RelativeTimeFormat) {
    const rtf = new Intl.RelativeTimeFormat(config.locale, {
      numeric: 'auto',
    });

    const divisions = [
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
        return rtf.format(
          diffInSeconds < 0 ? Math.floor(duration) : -Math.floor(duration),
          division.name.slice(0, -1) // Remove 's' for singular
        );
      }
      duration /= division.amount;
    }
  }

  // Fallback to regular date formatting
  return formatDate(date, 'shortDate');
};
