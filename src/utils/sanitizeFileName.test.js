import { describe, it, expect } from 'vitest';
import { sanitizeFileName } from './sanitizeFileName';

describe('sanitizeFileName', () => {
  it('should sanitize basic filenames', () => {
    expect(sanitizeFileName('test.pdf')).toBe('test.pdf');
    expect(sanitizeFileName('my document.txt')).toBe('my_document.txt');
  });

  it('should handle spaces by replacing with underscores', () => {
    expect(sanitizeFileName('file with spaces.doc')).toBe(
      'file_with_spaces.doc'
    );
    expect(sanitizeFileName('  leading spaces.pdf')).toBe(
      '__leading_spaces.pdf'
    );
  });

  it('should remove invalid characters', () => {
    expect(sanitizeFileName('file@#$%.txt')).toBe('file.txt');
    expect(sanitizeFileName('test<>:"|?*.pdf')).toBe('test.pdf');
  });

  it('should preserve file extensions', () => {
    expect(sanitizeFileName('document.pdf')).toBe('document.pdf');
    expect(sanitizeFileName('image.jpeg')).toBe('image.jpeg');
    // Note: Only the last extension is preserved, dots in filename are removed
    expect(sanitizeFileName('file.tar.gz')).toBe('filetar.gz');
  });

  it('should handle files without extensions', () => {
    expect(sanitizeFileName('README')).toBe('README');
    expect(sanitizeFileName('Makefile')).toBe('Makefile');
  });

  it('should handle empty or invalid input', () => {
    expect(sanitizeFileName('')).toBe('unnamed_file');
    expect(sanitizeFileName('...')).toBe('unnamed_file');
    expect(sanitizeFileName('///\\\\')).toBe('unnamed_file');
  });

  it('should throw error for non-string input', () => {
    expect(() => sanitizeFileName(null)).toThrow(TypeError);
    expect(() => sanitizeFileName(123)).toThrow(TypeError);
    expect(() => sanitizeFileName(undefined)).toThrow(TypeError);
  });

  it('should respect max length parameter', () => {
    const longName = 'a'.repeat(300) + '.pdf';
    const result = sanitizeFileName(longName, 255);
    expect(result.length).toBeLessThanOrEqual(255);
    // When name is very long, it may truncate the extension too
    expect(result).toBe('a'.repeat(255));
  });

  it('should preserve Latin-1 Supplement characters', () => {
    expect(sanitizeFileName('café.txt')).toBe('café.txt');
    expect(sanitizeFileName('naïve.pdf')).toBe('naïve.pdf');
    expect(sanitizeFileName('Björk.doc')).toBe('Björk.doc');
  });

  it('should handle multiple dots in filename', () => {
    // Dots within the filename are removed, only the last extension is preserved
    expect(sanitizeFileName('file.test.backup.txt')).toBe('filetestbackup.txt');
    expect(sanitizeFileName('..hidden..file.pdf')).toBe('hiddenfile.pdf');
  });
});
