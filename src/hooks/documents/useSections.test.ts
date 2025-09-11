import { renderHook } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, MockedFunction } from 'vitest';
import { useSections } from './useSections';

// Mock dependencies
vi.mock('./useSectionOperations');
vi.mock('./useSectionData');

import { useSectionOperations } from './useSectionOperations';
import { useSectionData } from './useSectionData';

const mockUseSectionOperations = useSectionOperations as MockedFunction<typeof useSectionOperations>;
const mockUseSectionData = useSectionData as MockedFunction<typeof useSectionData>;

describe('useSections', () => {
  const mockOperations = {
    sections: [],
    loading: false,
    error: null,
    addSection: vi.fn(),
    renameSection: vi.fn(),
    deleteSection: vi.fn(),
    updateSectionOrder: vi.fn(),
    moveSection: vi.fn(),
  };

  const mockData = {
    sections: [
      { id: 'section1', name: 'Section 1' },
      { id: 'section2', name: 'Section 2' },
    ],
    loading: false,
    error: undefined,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseSectionOperations.mockReturnValue(mockOperations);
    mockUseSectionData.mockReturnValue(mockData);
  });

  describe('Entity Type Support', () => {
    it('should work with project sections', () => {
      const { result } = renderHook(() =>
        useSections({
          entityType: 'project',
          entityId: 'project-123',
        })
      );

      expect(useSectionOperations).toHaveBeenCalledWith(
        'project-document-sections',
        { projectId: 'project-123' }
      );
      expect(useSectionData).toHaveBeenCalledWith('project-document-sections', {
        projectId: 'project-123',
      });

      expect(result.current).toEqual({
        addSection: mockOperations.addSection,
        renameSection: mockOperations.renameSection,
        deleteSection: mockOperations.deleteSection,
        updateSectionOrder: mockOperations.updateSectionOrder,
        moveSection: mockOperations.moveSection,
        sections: mockData.sections,
        sectionsLoading: mockData.loading,
        sectionsError: mockData.error,
      });
    });

    it('should work with library sections', () => {
      const { result } = renderHook(() =>
        useSections({
          entityType: 'library',
          entityId: 'main',
        })
      );

      expect(useSectionOperations).toHaveBeenCalledWith(
        'library-document-sections',
        { libraryId: 'main' }
      );
      expect(result.current.sections).toEqual(mockData.sections);
    });
  });

  describe('Error Handling', () => {
    it('should throw error when entityType is missing', () => {
      expect(() => {
        renderHook(() =>
          useSections({
            entityId: '123',
          } as any)
        );
      }).toThrow('useSections requires entityType and entityId');
    });

    it('should throw error when entityId is missing', () => {
      expect(() => {
        renderHook(() =>
          useSections({
            entityType: 'project',
          } as any)
        );
      }).toThrow('useSections requires entityType and entityId');
    });

    it('should throw error for unsupported entity type', () => {
      expect(() => {
        renderHook(() =>
          useSections({
            entityType: 'weldLog' as any,
            entityId: '123',
          })
        );
      }).toThrow(
        "Unsupported entity type: weldLog. Only 'project' and 'library' are supported."
      );
    });
  });

  describe('Operations', () => {
    it('should expose all operations from operations hook', () => {
      const { result } = renderHook(() =>
        useSections({
          entityType: 'project',
          entityId: 'project-123',
        })
      );

      expect(result.current.addSection).toBe(mockOperations.addSection);
      expect(result.current.renameSection).toBe(mockOperations.renameSection);
      expect(result.current.deleteSection).toBe(mockOperations.deleteSection);
      expect(result.current.updateSectionOrder).toBe(
        mockOperations.updateSectionOrder
      );
      expect(result.current.moveSection).toBe(mockOperations.moveSection);
    });
  });

  // Integration test
  it('should be a function', () => {
    expect(typeof useSections).toBe('function');
  });
});