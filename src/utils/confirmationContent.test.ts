import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { getConfirmationContent } from './confirmationContent';

describe('getConfirmationContent', () => {
  const mockT = vi.fn((key: string, options?: Record<string, any>) => {
    // Mock translation function that returns the key with options
    if (options) {
      return `${key}_${JSON.stringify(options)}`;
    }
    return key;
  }) as Mock;

  beforeEach(() => {
    mockT.mockClear();
  });

  it('should return delete content for single item', () => {
    const result = getConfirmationContent(
      'delete',
      false,
      1,
      mockT,
      'projects'
    );

    expect(result).toEqual({
      title: 'projects.deleteItem',
      description: 'projects.confirmDelete',
      actionLabel: 'common.delete',
      actionVariant: 'destructive',
    });
  });

  it('should return delete content for bulk items', () => {
    const result = getConfirmationContent('delete', true, 3, mockT, 'users');

    expect(result).toEqual({
      title: 'users.deleteSelected',
      description: 'users.confirmDeleteMultiple_{"count":3}',
      actionLabel: 'common.delete',
      actionVariant: 'destructive',
    });
  });

  it('should return archive content for single item', () => {
    const result = getConfirmationContent(
      'archive',
      false,
      1,
      mockT,
      'projects'
    );

    expect(result).toEqual({
      title: 'projects.archiveItem',
      description: 'projects.confirmArchive',
      actionLabel: 'projects.archive',
      actionVariant: 'default',
    });
  });

  it('should return archive content for bulk items', () => {
    const result = getConfirmationContent(
      'archive',
      true,
      5,
      mockT,
      'documents'
    );

    expect(result).toEqual({
      title: 'documents.archiveSelected',
      description: 'documents.confirmArchiveMultiple_{"count":5}',
      actionLabel: 'documents.archive',
      actionVariant: 'default',
    });
  });

  it('should return restore content for single item', () => {
    const result = getConfirmationContent(
      'restore',
      false,
      1,
      mockT,
      'projects'
    );

    expect(result).toEqual({
      title: 'projects.restoreItem',
      description: 'projects.confirmRestore',
      actionLabel: 'common.confirm',
      actionVariant: 'default',
    });
  });

  it('should return promote content for user operations', () => {
    const result = getConfirmationContent('promote', false, 1, mockT, 'users');

    expect(result).toEqual({
      title: 'users.promoteItem',
      description: 'users.promoteDescription_{"count":1}',
      actionLabel: 'users.promote',
      actionVariant: 'default',
    });
  });

  it('should return demote content for user operations', () => {
    const result = getConfirmationContent('demote', true, 2, mockT, 'users');

    expect(result).toEqual({
      title: 'users.demoteSelected',
      description: 'users.demoteDescription_{"count":2}',
      actionLabel: 'users.demote',
      actionVariant: 'destructive',
    });
  });

  it('should return remove content for participant operations', () => {
    const result = getConfirmationContent('remove', false, 1, mockT, 'projects');

    expect(result).toEqual({
      title: 'projects.removeFromProject',
      description: 'projects.confirmRemoveParticipant',
      actionLabel: 'common.remove',
      actionVariant: 'destructive',
    });
  });

  it('should return activate content', () => {
    const result = getConfirmationContent('activate', false, 1, mockT, 'users');

    expect(result).toEqual({
      title: 'users.activateItem',
      description: 'users.activateDescription_{"count":1}',
      actionLabel: 'users.activate',
      actionVariant: 'default',
    });
  });

  it('should return deactivate content', () => {
    const result = getConfirmationContent('deactivate', true, 3, mockT, 'users');

    expect(result).toEqual({
      title: 'users.deactivateSelected',
      description: 'users.deactivateDescription_{"count":3}',
      actionLabel: 'users.deactivate',
      actionVariant: 'destructive',
    });
  });

  it('should handle custom operation types with fallback', () => {
    const result = getConfirmationContent('custom-action', false, 1, mockT, 'items');

    expect(result).toEqual({
      title: 'common.confirmAction_{"action":"custom-action"}',
      description: 'common.actionDescription_{"action":"custom-action"}',
      actionLabel: 'common.confirm',
      actionVariant: 'default',
    });
  });

  it('should handle custom bulk operation types with fallback', () => {
    const result = getConfirmationContent('custom-bulk', true, 10, mockT, 'items');

    expect(result).toEqual({
      title: 'common.confirmBulkAction_{"action":"custom-bulk","count":10}',
      description: 'common.bulkActionDescription_{"action":"custom-bulk","count":10}',
      actionLabel: 'common.confirm',
      actionVariant: 'default',
    });
  });
});