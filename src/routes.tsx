import { createBrowserRouter, Navigate } from 'react-router-dom';

import { AppLayout } from './components/layouts/AppLayout';

import PrivateRoute from './components/PrivateRoute';
import PublicRoute from './components/PublicRoute';

import Login from './pages/login/Login';
import NotFound from './pages/not-found/NotFound';
import Projects from './pages/projects';
import ProjectOverview from './pages/project-overview';
import ProjectDocuments from './pages/project-documents';
import WeldLogs from './pages/weld-logs';
import WeldLogOverview from './pages/weld-log-overview';
import WeldOverview from './pages/weld-overview';
import MaterialManagement from './pages/material-management';
import DocumentLibrary from './pages/document-library';
import DocumentLibraryCollection from './pages/document-library-collection';
import UserManagement from './pages/user-management';
import CompanyProfile from './pages/company-profile';

// Define the application routes
const router = createBrowserRouter([
  {
    element: (
      <PrivateRoute>
        <AppLayout />
      </PrivateRoute>
    ),
    children: [
      {
        path: '/',
        element: <Projects />,
      },
      {
        path: '/projects/:projectId',
        element: <Navigate to="project-overview" replace />,
      },
      {
        path: '/projects/:projectId/project-overview',
        element: <ProjectOverview />,
      },
      {
        path: '/projects/:projectId/documents',
        element: <ProjectDocuments />,
      },
      {
        path: '/projects/:projectId/weld-logs',
        element: <WeldLogs />,
      },
      {
        path: '/projects/:projectId/weld-logs/:weldLogId',
        element: <WeldLogOverview />,
      },
      {
        path: '/projects/:projectId/weld-logs/:weldLogId/welds/:weldId',
        element: <WeldOverview />,
      },
      {
        path: '/material-management',
        element: <MaterialManagement />,
      },
      {
        path: '/document-library',
        element: <DocumentLibrary />,
      },
      {
        path: '/document-library/collection/:id',
        element: <DocumentLibraryCollection />,
      },
      {
        path: '/user-management',
        element: <UserManagement />,
      },
      {
        path: '/company-profile',
        element: <CompanyProfile />,
      },
    ],
  },
  {
    path: '/login',
    element: (
      <PublicRoute>
        <Login />
      </PublicRoute>
    ),
  },
  {
    path: '*',
    element: <NotFound />,
  },
]);

export default router;
