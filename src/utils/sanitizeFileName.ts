import sanitize from 'sanitize-filename';

// Sanitizes a filename, preserving the file extension.
export function sanitizeFileName(fileName: unknown, maxLength = 255): string {
  if (typeof fileName !== 'string') {
    throw new TypeError('fileName must be a string');
  }

  // Use sanitize-filename as the first pass
  let sanitized = sanitize(fileName);

  // Replace spaces with underscores
  sanitized = sanitized.replace(/ /g, '_');

  // Handle the file extension
  const lastDotIndex = sanitized.lastIndexOf('.');
  let nameWithoutExtension =
    lastDotIndex !== -1 ? sanitized.slice(0, lastDotIndex) : sanitized;
  let extension = lastDotIndex !== -1 ? sanitized.slice(lastDotIndex) : '';

  // Trim leading and trailing periods from the name and extension
  nameWithoutExtension = nameWithoutExtension.replace(/^\.+|\.+$/g, '');
  extension = extension.replace(/^\.+|\.+$/g, '.');

  // Remove any character that is not a letter, number, underscore, hyphen, asterisk, or a Latin-1 Supplement character
  nameWithoutExtension = nameWithoutExtension.replace(
    /[^a-zA-Z0-9_\-*\u00C0-\u017F]/g,
    ''
  );

  // Ensure the filename isn't empty after sanitization
  nameWithoutExtension = nameWithoutExtension || 'unnamed_file';

  // Limit the overall filename length, prioritizing the name
  const maxNameLength = Math.max(1, maxLength - extension.length);
  if (nameWithoutExtension.length > maxNameLength) {
    nameWithoutExtension = nameWithoutExtension.slice(0, maxNameLength);
  }

  // Combine the cleaned name and extension
  return nameWithoutExtension + extension;
}

/**
 * Firebase Storage path configuration
 * Centralized storage path management following simplified structure
 *
 * Storage paths follow the pattern:
 * - documents/{documentId}/{filename} - for document files
 * - documents/{documentId}/thumbnails/{filename} - for thumbnails
 *
 * Document types (library/project) are managed in Firestore metadata
 */