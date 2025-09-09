import { describe, it, expect } from 'vitest';
import {
  getSystemNavigation,
  getProjectNavigation,
  getNavigation,
} from './navigation';

describe('Navigation Configuration', () => {
  // Create a mock translation function
  const mockT = (key) => {
    const translations = {
      'navigation.projects': 'Projects',
      'navigation.materialManagement': 'Material Management',
      'navigation.documentLibrary': 'Document Library',
      'navigation.userManagement': 'User Management',
      'navigation.companyProfile': 'Company Profile',
      'navigation.projectOverview': 'Project Overview',
      'navigation.projectDocuments': 'Project Documents',
      'navigation.weldLogs': 'Weld Logs',
      'navigation.ndtOrders': 'NDT Orders',
      'navigation.reports': 'Reports',
    };
    return translations[key] || key;
  };

  describe('getSystemNavigation', () => {
    it('should return system navigation items with translation keys', () => {
      const items = getSystemNavigation(mockT, 'admin');

      expect(items).toHaveLength(5); // All items for admin
      expect(items[0].name).toBe('Projects');
      expect(items[0].path).toBe('/');
      expect(items[0].icon).toBeDefined();

      expect(items[1].name).toBe('Material Management');
      expect(items[1].path).toBe('/material-management');
      expect(items[1].icon).toBeDefined();

      expect(items[2].name).toBe('Document Library');
      expect(items[2].path).toBe('/document-library');
      expect(items[2].icon).toBeDefined();

      // Admin-only items
      expect(items[3].name).toBe('User Management');
      expect(items[3].path).toBe('/user-management');
      expect(items[3].icon).toBeDefined();

      expect(items[4].name).toBe('Company Profile');
      expect(items[4].path).toBe('/company-profile');
      expect(items[4].icon).toBeDefined();
    });

    it('should filter items based on user role', () => {
      const adminItems = getSystemNavigation(mockT, 'admin');
      const userItems = getSystemNavigation(mockT, 'user');

      expect(adminItems).toHaveLength(5);
      expect(userItems).toHaveLength(0); // Regular users don't see system navigation
    });
  });

  describe('getProjectNavigation', () => {
    it('should return empty array when no projectId', () => {
      const items = getProjectNavigation(null, mockT);
      expect(items).toEqual([]);
    });

    it('should return project navigation items with translation keys', () => {
      const projectId = 'test-project-123';
      const items = getProjectNavigation(projectId, mockT);

      expect(items).toHaveLength(5); // All project features (including planned)
      expect(items[0].name).toBe('Project Overview');
      expect(items[0].path).toBe(`/projects/${projectId}/project-overview`);
      expect(items[0].icon).toBeDefined();

      expect(items[1].name).toBe('Project Documents');
      expect(items[1].path).toBe(`/projects/${projectId}/documents`);
      expect(items[1].icon).toBeDefined();

      expect(items[2].name).toBe('Weld Logs');
      expect(items[2].path).toBe(`/projects/${projectId}/weld-logs`);
      expect(items[2].icon).toBeDefined();

      // Planned features (placeholders)
      expect(items[3].name).toBe('NDT Orders');
      expect(items[3].path).toBe(`/projects/${projectId}/ndt-orders`);
      expect(items[3].icon).toBeDefined();

      expect(items[4].name).toBe('Reports');
      expect(items[4].path).toBe(`/projects/${projectId}/reports`);
      expect(items[4].icon).toBeDefined();
    });
  });

  describe('getNavigation', () => {
    it('should return both system and project navigation', () => {
      const projectId = 'test-project';
      const navigation = getNavigation('admin', projectId, mockT);

      expect(navigation).toHaveProperty('system');
      expect(navigation).toHaveProperty('project');
      expect(navigation.system).toHaveLength(5); // Admin sees all system items
      expect(navigation.project).toHaveLength(5); // All project features (including planned)
    });

    it('should respect user roles for system navigation', () => {
      const projectId = 'test-project';
      const adminNavigation = getNavigation('admin', projectId, mockT);
      const userNavigation = getNavigation('user', projectId, mockT);

      expect(adminNavigation.system).toHaveLength(5); // Admin sees all
      expect(userNavigation.system).toHaveLength(0); // User doesn't see system navigation
      expect(adminNavigation.project).toHaveLength(5); // Project nav same for both
      expect(userNavigation.project).toHaveLength(5);
    });
  });
});
