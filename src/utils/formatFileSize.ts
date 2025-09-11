/**
 * Format file size in bytes to human readable format
 * @param bytes - File size in bytes
 * @param decimals - Number of decimal places (default: 1)
 * @returns Formatted file size (e.g., "1.5 MB", "842 KB")
 */
export function formatFileSize(bytes: number | null | undefined, decimals = 1): string {
  if (!bytes || bytes === 0) return '0 B';
  
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB'] as const;
  
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const size = parseFloat((bytes / Math.pow(k, i)).toFixed(dm));
  
  // Remove decimal if it's .0
  const formattedSize = size % 1 === 0 ? Math.floor(size) : size;
  
  return `${formattedSize} ${sizes[i]}`;
}