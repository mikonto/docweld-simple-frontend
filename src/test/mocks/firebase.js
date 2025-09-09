import { vi } from "vitest";

// Mock Firestore
export const mockFirestore = {
  collection: vi.fn(() => mockFirestore),
  doc: vi.fn(() => mockFirestore),
  where: vi.fn(() => mockFirestore),
  orderBy: vi.fn(() => mockFirestore),
  limit: vi.fn(() => mockFirestore),
  get: vi.fn(() => Promise.resolve({
    docs: [],
    empty: true,
    size: 0,
  })),
  onSnapshot: vi.fn((callback) => {
    callback({
      docs: [],
      empty: true,
      size: 0,
    });
    return vi.fn(); // unsubscribe function
  }),
  add: vi.fn(() => Promise.resolve({ id: "mock-id" })),
  set: vi.fn(() => Promise.resolve()),
  update: vi.fn(() => Promise.resolve()),
  delete: vi.fn(() => Promise.resolve()),
};

// Mock Auth
export const mockAuth = {
  currentUser: null,
  onAuthStateChanged: vi.fn((callback) => {
    callback(null);
    return vi.fn(); // unsubscribe function
  }),
  signInWithEmailAndPassword: vi.fn(() => Promise.resolve({
    user: { uid: "mock-uid", email: "test@example.com" },
  })),
  signOut: vi.fn(() => Promise.resolve()),
};

// Mock Storage
export const mockStorage = {
  ref: vi.fn(() => mockStorage),
  child: vi.fn(() => mockStorage),
  put: vi.fn(() => ({
    on: vi.fn((event, progress, error, complete) => {
      // Simulate immediate completion
      if (complete) complete();
    }),
    snapshot: { ref: mockStorage },
  })),
  getDownloadURL: vi.fn(() => Promise.resolve("https://mock-url.com/file.pdf")),
  delete: vi.fn(() => Promise.resolve()),
};

// Mock Firebase functions
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
export const mockArrayUnion = vi.fn((...args) => args);
export const mockArrayRemove = vi.fn((...args) => args);
export const mockWriteBatch = vi.fn();
export const mockSetDoc = vi.fn();

// Setup default mock implementations
export const setupFirebaseMocks = () => {
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
    forEach: vi.fn((callback) => {
      // Call callback for each doc in docs array
      const docs = [];
      docs.forEach(callback);
    }),
  });
  
  mockGetDoc.mockResolvedValue({
    exists: () => false,
    data: () => null,
    id: "mock-id",
  });
  
  mockAddDoc.mockResolvedValue({ id: "mock-id" });
  mockUpdateDoc.mockResolvedValue();
  mockDeleteDoc.mockResolvedValue();
  mockSetDoc.mockResolvedValue();
  
  mockGetDocs.mockResolvedValue({
    docs: [],
    empty: true,
    size: 0,
    forEach: vi.fn((callback) => {
      // Call callback for each doc in docs array
      const docs = [];
      docs.forEach(callback);
    }),
  });
  
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
    });
    return vi.fn(); // unsubscribe
  });
};

// Reset all mocks
export const resetFirebaseMocks = () => {
  vi.clearAllMocks();
  setupFirebaseMocks();
};