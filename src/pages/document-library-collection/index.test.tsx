import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import DocumentLibraryCollection from './index';
import { useApp } from '@/contexts/AppContext';
import * as AppContextModule from '@/contexts/AppContext';

// Mock Firebase
vi.mock('@/config/firebase', () => ({
  auth: {},
  db: {},
  storage: {},
}));

vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  doc: vi.fn(),
  query: vi.fn(() => ({})),
  where: vi.fn(),
  orderBy: vi.fn(),
  onSnapshot: vi.fn(() => () => {}),
  getDocs: vi.fn(() => Promise.resolve({ empty: true, docs: [] })),
  getDoc: vi.fn(() =>
    Promise.resolve({ exists: () => false, data: () => null })
  ),
}));

vi.mock('react-firebase-hooks/auth', () => ({
  useAuthState: vi.fn(() => [null, false, null]),
}));

vi.mock('react-firebase-hooks/firestore', () => ({
  useDocument: vi.fn(() => [null, false, null]),
  useCollection: vi.fn(() => [null, false, null]),
  useCollectionData: vi.fn(() => [[], false, null]),
}));

// Mock auth hook
vi.mock('@/hooks/useAuthWithFirestore', () => ({
  useAuthWithFirestore: vi.fn(() => ({
    loggedInUser: null,
    userAuth: null,
    userDb: null,
    userStatus: null,
    isAuthorized: false,
    loading: false,
    error: null,
  })),
}));

// Mock React Router
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useParams: () => ({ id: 'test-collection-id' }),
  };
});

// Mock i18n
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'documentLibrary.documentCollection': 'Document Collection',
      };
      return translations[key] || key;
    },
    i18n: {
      changeLanguage: () => new Promise(() => {}),
    },
  }),
}));

const useAppSpy = vi.spyOn(AppContextModule, 'useApp');

describe('DocumentLibraryCollection', () => {
  beforeEach(() => {
    useAppSpy.mockReturnValue({
      loggedInUser: {
        uid: 'test-user',
        displayName: 'Test User',
      },
    } as unknown as ReturnType<typeof useApp>);
  });
  it('should render without crashing', () => {
    const { container } = render(
      <BrowserRouter>
        <DocumentLibraryCollection />
      </BrowserRouter>
    );

    expect(container.firstChild).toBeTruthy();
  });

  it('should render with Document Collection heading', () => {
    render(
      <BrowserRouter>
        <DocumentLibraryCollection />
      </BrowserRouter>
    );

    // The component renders a Document Collection heading
    expect(screen.getByText('Document Collection')).toBeInTheDocument();
  });

  it('should handle library collection type', () => {
    const { container } = render(
      <BrowserRouter>
        <DocumentLibraryCollection />
      </BrowserRouter>
    );

    // Check that the component doesn't crash with library collection type
    expect(container.querySelector('.space-y-6')).toBeTruthy();
  });

  it('should render within a page layout', () => {
    const { container } = render(
      <BrowserRouter>
        <DocumentLibraryCollection />
      </BrowserRouter>
    );

    // Check for the main layout structure
    const mainContent = container.querySelector('.space-y-6');
    expect(mainContent).toBeTruthy();

    // Check for the header section
    const header = container.querySelector('h1');
    expect(header).toBeTruthy();
  });

  afterAll(() => {
    useAppSpy.mockRestore();
  });
});
