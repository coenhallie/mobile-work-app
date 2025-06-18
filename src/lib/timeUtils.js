/**
 * Time utility functions for formatting relative time
 */

/**
 * Formats a timestamp to relative time (e.g., "2 hours ago", "3 days ago")
 * @param {string|Date} timestamp - The timestamp to format
 * @param {string} locale - The locale for formatting (default: 'en-US')
 * @returns {string} - Formatted relative time string
 */
export function formatRelativeTime(timestamp, locale = 'en-US') {
  if (!timestamp) return '';

  try {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);

    // Handle invalid dates
    if (isNaN(date.getTime())) {
      return '';
    }

    // Define time intervals in seconds
    const intervals = {
      year: 31536000,
      month: 2592000,
      week: 604800,
      day: 86400,
      hour: 3600,
      minute: 60,
    };

    // Handle "just now" case (less than 1 minute)
    if (diffInSeconds < 60) {
      return locale === 'es-PE' ? 'hace un momento' : 'just now';
    }

    // Find the appropriate interval
    for (const [unit, seconds] of Object.entries(intervals)) {
      const interval = Math.floor(diffInSeconds / seconds);

      if (interval >= 1) {
        return formatTimeInterval(interval, unit, locale);
      }
    }

    // Fallback
    return locale === 'es-PE' ? 'hace un momento' : 'just now';
  } catch (error) {
    console.error('Error formatting relative time:', error);
    return '';
  }
}

/**
 * Formats a time interval with proper pluralization and localization
 * @param {number} interval - The time interval number
 * @param {string} unit - The time unit (year, month, week, day, hour, minute)
 * @param {string} locale - The locale for formatting
 * @returns {string} - Formatted time interval string
 */
function formatTimeInterval(interval, unit, locale) {
  if (locale === 'es-PE') {
    const unitTranslations = {
      year: interval === 1 ? 'año' : 'años',
      month: interval === 1 ? 'mes' : 'meses',
      week: interval === 1 ? 'semana' : 'semanas',
      day: interval === 1 ? 'día' : 'días',
      hour: interval === 1 ? 'hora' : 'horas',
      minute: interval === 1 ? 'minuto' : 'minutos',
    };

    return `hace ${interval} ${unitTranslations[unit]}`;
  } else {
    // English formatting
    const unitName = interval === 1 ? unit : `${unit}s`;
    return `${interval} ${unitName} ago`;
  }
}

/**
 * Formats application time specifically for the "Applied X ago" button text
 * @param {string|Date} appliedAt - The application timestamp
 * @param {string} locale - The locale for formatting
 * @returns {string} - Formatted application time string
 */
export function formatApplicationTime(appliedAt, locale = 'en-US') {
  if (!appliedAt) return '';

  const relativeTime = formatRelativeTime(appliedAt, locale);
  if (!relativeTime) return '';

  if (locale === 'es-PE') {
    return `Postulado ${relativeTime}`;
  } else {
    return `Applied ${relativeTime}`;
  }
}

/**
 * Gets a short relative time format for compact displays
 * @param {string|Date} timestamp - The timestamp to format
 * @param {string} locale - The locale for formatting
 * @returns {string} - Short formatted relative time string
 */
export function formatShortRelativeTime(timestamp, locale = 'en-US') {
  if (!timestamp) return '';

  try {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (isNaN(date.getTime())) {
      return '';
    }

    // Less than 1 minute
    if (diffInSeconds < 60) {
      return locale === 'es-PE' ? 'ahora' : 'now';
    }

    // Less than 1 hour
    if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return locale === 'es-PE' ? `${minutes}m` : `${minutes}m`;
    }

    // Less than 1 day
    if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return locale === 'es-PE' ? `${hours}h` : `${hours}h`;
    }

    // Less than 1 week
    if (diffInSeconds < 604800) {
      const days = Math.floor(diffInSeconds / 86400);
      return locale === 'es-PE' ? `${days}d` : `${days}d`;
    }

    // Less than 1 month
    if (diffInSeconds < 2592000) {
      const weeks = Math.floor(diffInSeconds / 604800);
      return locale === 'es-PE' ? `${weeks}sem` : `${weeks}w`;
    }

    // Months
    const months = Math.floor(diffInSeconds / 2592000);
    return locale === 'es-PE' ? `${months}mes` : `${months}mo`;
  } catch (error) {
    console.error('Error formatting short relative time:', error);
    return '';
  }
}

/**
 * Formats a date string to a standard date format (e.g., "Jun 16, 2025").
 * @param {string|Date} dateString - The date string or Date object to format.
 * @param {string} locale - The locale for formatting (default: 'en-US').
 * @returns {string} - Formatted date string.
 */
export function formatStandardDate(dateString, locale = 'en-US') {
  if (!dateString) return '';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return '';
    }
    return date.toLocaleDateString(locale, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch (error) {
    console.error('Error formatting standard date:', error);
    return '';
  }
}

/**
 * Formats a date-time string to a standard date-time format (e.g., "Jun 16, 9:52 PM").
 * @param {string|Date} dateTimeString - The date-time string or Date object to format.
 * @param {string} locale - The locale for formatting (default: 'en-US').
 * @returns {string} - Formatted date-time string.
 */
export function formatStandardDateTime(dateTimeString, locale = 'en-US') {
  if (!dateTimeString) return '';
  try {
    const date = new Date(dateTimeString);
    if (isNaN(date.getTime())) {
      return '';
    }
    return date.toLocaleDateString(locale, {
      month: 'short',
      day: 'numeric',
      year: 'numeric', // Added year for consistency with formatDate in ClientJobCard
      hour: 'numeric',
      minute: '2-digit',
    });
  } catch (error) {
    console.error('Error formatting standard date-time:', error);
    return '';
  }
}
