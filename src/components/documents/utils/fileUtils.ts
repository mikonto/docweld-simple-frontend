import { UPLOAD_CONFIG } from '../constants'
import type { ProcessingState } from '../constants'

export function getFileExtension(filename: string): string {
  const parts = filename.split('.')
  return parts.length > 1 ? `.${parts.pop()!.toLowerCase()}` : ''
}

export function isAllowedFile(file: File): boolean {
  if (UPLOAD_CONFIG.ALLOWED_TYPES.includes(file.type as any)) {
    return true
  }

  // Check by extension as fallback
  const extension = getFileExtension(file.name)
  return UPLOAD_CONFIG.ALLOWED_EXTENSIONS.includes(extension as any)
}

export function getMimeTypeFromExtension(filename: string): string {
  const extension = getFileExtension(filename)
  const mimeTypes = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.bmp': 'image/bmp',
    '.webp': 'image/webp',
    '.heic': 'image/heic',
    '.heif': 'image/heif',
    '.pdf': 'application/pdf',
  } as const

  return mimeTypes[extension as keyof typeof mimeTypes] || 'application/octet-stream'
}

// Get display name for a document, handling HEIC to JPG conversion
export function getDisplayName(
  title: string,
  storageRef?: string,
  processingState?: ProcessingState
): string {
  if (!title) return ''

  if (processingState === 'pending') {
    return title
  }

  const originalExtension = getFileExtension(title)
  const isHeicOriginal = ['.heic', '.heif'].includes(originalExtension)

  if (isHeicOriginal && storageRef && processingState === 'completed') {
    const storageExtension = getFileExtension(storageRef)
    if (storageExtension && storageExtension !== originalExtension) {
      const baseName = title.substring(0, title.lastIndexOf('.'))
      return `${baseName}${storageExtension}`
    }
  }

  return title
}