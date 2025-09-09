import { describe, it, expect, vi } from 'vitest';
import {
  prepareNewDocumentData,
  prepareNewSectionData,
} from './documentImportHelpers';

// Mock Firebase
vi.mock('@/config/firebase', () => ({
  auth: {},
  db: {},
  storage: {},
}));

vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  doc: vi.fn(),
  getDoc: vi.fn(),
  getDocs: vi.fn(),
  setDoc: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  orderBy: vi.fn(),
  limit: vi.fn(),
  serverTimestamp: vi.fn(() => new Date('2024-01-01T00:00:00Z')),
}));

vi.mock('firebase/storage', () => ({
  ref: vi.fn(),
  getDownloadURL: vi.fn(),
  uploadBytes: vi.fn(),
}));

vi.mock('@/utils/getFileExtension', () => ({
  getFileExtension: vi.fn((path) => {
    const match = path.match(/\.([^.]+)$/);
    return match ? `.${match[1]}` : '';
  }),
}));

describe('documentImportHelpers', () => {
  describe('prepareNewDocumentData', () => {
    it('should prepare new document data for project', () => {
      const result = prepareNewDocumentData(
        'new-doc-id',
        { id: 'source-id', title: 'Test Doc', fileType: 'PDF', fileSize: 1024 },
        { projectId: 'project-123' },
        'section-456',
        1,
        { storageRef: 'new/path.pdf' },
        'project',
        { id: 'user-123' }
      );

      expect(result.id).toBe('new-doc-id');
      expect(result.title).toBe('Test Doc');
      expect(result.fileType).toBe('PDF');
      expect(result.sectionId).toBe('section-456');
      expect(result.projectId).toBe('project-123');
      expect(result.status).toBe('active');
      expect(result.createdBy).toBe('user-123');
    });

    it('should handle weldLog destination type', () => {
      const result = prepareNewDocumentData(
        'new-doc-id',
        { id: 'source-id', title: 'Weld Doc' },
        { weldLogId: 'weld-123' },
        'section-456',
        0,
        {},
        'weldLog',
        null
      );

      expect(result.sectionId).toBe(null);
      expect(result.weldLogId).toBe('weld-123');
      expect(result.createdBy).toBe('system');
    });

    it('should provide default values for missing fields', () => {
      const result = prepareNewDocumentData(
        'new-doc-id',
        {},
        { projectId: 'project-123' },
        'section-456',
        0,
        {},
        'project',
        null
      );

      expect(result.title).toBe('Untitled Document');
      expect(result.fileSize).toBe(0);
      expect(result.processingState).toBe('completed');
    });
  });

  describe('prepareNewSectionData', () => {
    it('should prepare section data with all fields', () => {
      const result = prepareNewSectionData(
        'new-section-id',
        { id: 'source-id', name: 'Test Section', description: 'Test Desc' },
        { projectId: 'project-123' },
        2,
        { id: 'user-456' }
      );

      expect(result.id).toBe('new-section-id');
      expect(result.name).toBe('Test Section');
      expect(result.description).toBe('Test Desc');
      expect(result.projectId).toBe('project-123');
      expect(result.order).toBe(2);
      expect(result.status).toBe('active');
      expect(result.createdBy).toBe('user-456');
      expect(result.importedFrom).toBe('source-id');
    });

    it('should handle missing optional fields', () => {
      const result = prepareNewSectionData(
        'new-section-id',
        { name: 'Minimal Section' },
        { libraryCollectionId: 'lib-123' },
        0,
        null
      );

      expect(result.name).toBe('Minimal Section');
      expect(result.description).toBe('');
      expect(result.libraryCollectionId).toBe('lib-123');
      expect(result.createdBy).toBe('system');
      expect(result.importedFrom).toBe(null);
    });
  });
});
