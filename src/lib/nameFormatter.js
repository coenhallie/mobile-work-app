/**
 * Utility functions for formatting user names
 */

/**
 * Formats a full name to show only first name and first letter of last name
 * @param {string} fullName - The full name (may include email in parentheses)
 * @param {string} email - Optional email address to remove from name
 * @returns {string} Formatted name (e.g., "John S.")
 */
export function formatDisplayName(fullName, email = null) {
  if (!fullName || typeof fullName !== 'string') {
    return 'User';
  }

  // Remove email from name if it's included in parentheses
  let cleanName = fullName;

  // Remove email in parentheses pattern like "John Smith (email@example.com)"
  cleanName = cleanName.replace(/\s*\([^)]*@[^)]*\)/g, '');

  // Remove standalone email if provided
  if (email) {
    cleanName = cleanName.replace(email, '').trim();
  }

  // Split the name into parts
  const nameParts = cleanName
    .trim()
    .split(/\s+/)
    .filter((part) => part.length > 0);

  if (nameParts.length === 0) {
    return 'User';
  }

  if (nameParts.length === 1) {
    // Only first name available
    return nameParts[0];
  }

  // First name + first letter of last name
  const firstName = nameParts[0];
  const lastNameInitial = nameParts[nameParts.length - 1]
    .charAt(0)
    .toUpperCase();

  return `${firstName} ${lastNameInitial}.`;
}

/**
 * Extracts initials from a formatted name for avatar display
 * @param {string} displayName - The formatted display name
 * @returns {string} Initials (e.g., "JS")
 */
export function getInitialsFromDisplayName(displayName) {
  if (!displayName || typeof displayName !== 'string') {
    return '?';
  }

  const parts = displayName.split(/\s+/).filter((part) => part.length > 0);

  if (parts.length === 0) {
    return '?';
  }

  if (parts.length === 1) {
    return parts[0].charAt(0).toUpperCase();
  }

  // Take first letter of first part and first letter of last part (removing any dots)
  const firstInitial = parts[0].charAt(0).toUpperCase();
  const lastPart = parts[parts.length - 1].replace('.', '');
  const lastInitial = lastPart.charAt(0).toUpperCase();

  return `${firstInitial}${lastInitial}`;
}
