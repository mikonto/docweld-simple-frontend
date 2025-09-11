import { vi, type MockedFunction } from 'vitest';
import type { 
  MockFirestoreDocument, 
  MockFirestoreQuerySnapshot, 
  MockFirebaseUser 
} from '@/types/test-utils';

// ============== Firebase Auth Mock Types ==============

interface MockAuth {
  currentUser: MockFirebaseUser | null;
  onAuthStateChanged: MockedFunction<(callback: (user: MockFirebaseUser | null) => void) => () => void>;
  signInWithEmailAndPassword: MockedFunction<(email: string, password: string) => Promise<{ user: MockFirebaseUser }>>;
  signOut: MockedFunction<() => Promise<void>>;
}

// ============== Firebase Firestore Mock Types ==============

interface MockFirestore {
  collection: MockedFunction<(path: string) => MockFirestore>;
  doc: MockedFunction<(path?: string) => MockFirestore>;
  where: MockedFunction<(field: string, operator: any, value: any) => MockFirestore>;
  orderBy: MockedFunction<(field: string, direction?: 'asc' | 'desc') => MockFirestore>;
  limit: MockedFunction<(limit: number) => MockFirestore>;
  get: MockedFunction<() => Promise<MockFirestoreQuerySnapshot>>;
  onSnapshot: MockedFunction<(callback: (snapshot: MockFirestoreQuerySnapshot) => void) => () => void>;
  add: MockedFunction<(data: Record<string, any>) => Promise<{ id: string }>>;
  set: MockedFunction<(data: Record<string, any>, options?: any) => Promise<void>>;
  update: MockedFunction<(data: Record<string, any>) => Promise<void>>;
  delete: MockedFunction<() => Promise<void>>;
}

// ============== Firebase Storage Mock Types ==============

interface MockStorageTaskSnapshot {
  ref: MockStorage;
}

interface MockStorageUploadTask {
  on: MockedFunction<(
    event: string, 
    progress?: (snapshot: any) => void, 
    error?: (error: Error) => void, 
    complete?: () => void
  ) => void>;
  snapshot: MockStorageTaskSnapshot;
}

interface MockStorage {
  ref: MockedFunction<(path?: string) => MockStorage>;
  child: MockedFunction<(path: string) => MockStorage>;
  put: MockedFunction<(data: any) => MockStorageUploadTask>;
  getDownloadURL: MockedFunction<() => Promise<string>>;
  delete: MockedFunction<() => Promise<void>>;
}

// ============== Mock Implementations ==============

// Mock Firestore
export const mockFirestore: MockFirestore = {
  collection: vi.fn(() => mockFirestore),
  doc: vi.fn(() => mockFirestore),
  where: vi.fn(() => mockFirestore),
  orderBy: vi.fn(() => mockFirestore),
  limit: vi.fn(() => mockFirestore),
  get: vi.fn(() => Promise.resolve({
    docs: [],
    empty: true,
    size: 0,
    forEach: vi.fn(),
  })),
  onSnapshot: vi.fn((callback) => {
    callback({
      docs: [],
      empty: true,
      size: 0,
      forEach: vi.fn(),
    });
    return vi.fn(); // unsubscribe function
  }),
  add: vi.fn(() => Promise.resolve({ id: 'mock-id' })),
  set: vi.fn(() => Promise.resolve()),
  update: vi.fn(() => Promise.resolve()),
  delete: vi.fn(() => Promise.resolve()),
};

// Mock Auth
export const mockAuth: MockAuth = {
  currentUser: null,
  onAuthStateChanged: vi.fn((callback) => {
    callback(null);
    return vi.fn(); // unsubscribe function
  }),
  signInWithEmailAndPassword: vi.fn(() => Promise.resolve({
    user: { uid: 'mock-uid', email: 'test@example.com', displayName: null, emailVerified: true },
  })),
  signOut: vi.fn(() => Promise.resolve()),
};

// Mock Storage
export const mockStorage: MockStorage = {
  ref: vi.fn(() => mockStorage),
  child: vi.fn(() => mockStorage),
  put: vi.fn(() => ({
    on: vi.fn((event, progress, error, complete) => {
      // Simulate immediate completion
      if (complete) complete();
    }),
    snapshot: { ref: mockStorage },
  })),
  getDownloadURL: vi.fn(() => Promise.resolve('https://mock-url.com/file.pdf')),
  delete: vi.fn(() => Promise.resolve()),
};

// ============== Mock Firebase Functions ==============

// Individual mock functions for Firebase operations
export const mockCollection = vi.fn();
export const mockDoc = vi.fn();
export const mockWhere = vi.fn();
export const mockOrderBy = vi.fn();
export const mockLimit = vi.fn();
export const mockOnSnapshot = vi.fn();
export const mockAddDoc = vi.fn();
export const mockUpdateDoc = vi.fn();
export const mockDeleteDoc = vi.fn();
export const mockGetDoc = vi.fn();
export const mockGetDocs = vi.fn();
export const mockQuery = vi.fn();
export const mockServerTimestamp = vi.fn(() => new Date());
export const mockArrayUnion = vi.fn((...args: any[]) => args);
export const mockArrayRemove = vi.fn((...args: any[]) => args);
export const mockWriteBatch = vi.fn();
export const mockSetDoc = vi.fn();

// ============== Mock Setup Utilities ==============

// Setup default mock implementations
export const setupFirebaseMocks = (): void => {
  mockCollection.mockReturnValue(mockFirestore);
  mockDoc.mockReturnValue(mockFirestore);
  mockWhere.mockReturnValue(mockFirestore);
  mockOrderBy.mockReturnValue(mockFirestore);
  mockLimit.mockReturnValue(mockFirestore);
  mockQuery.mockReturnValue(mockFirestore);
  
  mockGetDocs.mockResolvedValue({
    docs: [],
    empty: true,
    size: 0,
    forEach: vi.fn((callback: (doc: MockFirestoreDocument) => void) => {
      // Call callback for each doc in docs array
      const docs: MockFirestoreDocument[] = [];
      docs.forEach(callback);
    }),
  });
  
  mockGetDoc.mockResolvedValue({
    exists: () => false,
    data: () => null,
    id: 'mock-id',
    ref: {
      id: 'mock-id',
      path: 'mock/path',
    },
  });
  
  mockAddDoc.mockResolvedValue({ id: 'mock-id' });
  mockUpdateDoc.mockResolvedValue();
  mockDeleteDoc.mockResolvedValue();
  mockSetDoc.mockResolvedValue();
  
  mockWriteBatch.mockReturnValue({
    set: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    commit: vi.fn().mockResolvedValue(),
  });
  
  mockOnSnapshot.mockImplementation((query, callback) => {
    callback({
      docs: [],
      empty: true,
      size: 0,
      forEach: vi.fn(),
    });
    return vi.fn(); // unsubscribe
  });
};

// Reset all mocks
export const resetFirebaseMocks = (): void => {
  vi.clearAllMocks();
  setupFirebaseMocks();
};