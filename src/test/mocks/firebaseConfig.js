import { vi } from "vitest";
import { 
  mockAuth, 
  mockFirestore, 
  mockStorage,
  mockCollection,
  mockDoc,
  mockWhere,
  mockOrderBy,
  mockLimit,
  mockOnSnapshot,
  mockAddDoc,
  mockUpdateDoc,
  mockDeleteDoc,
  mockGetDoc,
  mockGetDocs,
  mockQuery,
  mockServerTimestamp,
  mockArrayUnion,
  mockArrayRemove,
  mockWriteBatch,
  mockSetDoc,
  setupFirebaseMocks,
} from "./firebase";

// Setup mocks on import
setupFirebaseMocks();

// Mock the firebase config module
vi.mock("@/config/firebase", () => ({
  db: mockFirestore,
  auth: mockAuth,
  storage: mockStorage,
  functions: {},
}));

// Mock firebase/firestore functions
vi.mock("firebase/firestore", () => ({
  collection: mockCollection,
  doc: mockDoc,
  where: mockWhere,
  orderBy: mockOrderBy,
  limit: mockLimit,
  onSnapshot: mockOnSnapshot,
  addDoc: mockAddDoc,
  updateDoc: mockUpdateDoc,
  deleteDoc: mockDeleteDoc,
  getDoc: mockGetDoc,
  getDocs: mockGetDocs,
  query: mockQuery,
  serverTimestamp: mockServerTimestamp,
  arrayUnion: mockArrayUnion,
  arrayRemove: mockArrayRemove,
  writeBatch: mockWriteBatch,
  setDoc: mockSetDoc,
}));

// Mock firebase/storage functions  
vi.mock("firebase/storage", () => ({
  ref: vi.fn(() => mockStorage),
  uploadBytesResumable: vi.fn(() => ({
    on: vi.fn((event, progress, error, complete) => {
      if (complete) complete();
    }),
    snapshot: { ref: mockStorage },
  })),
  getDownloadURL: vi.fn(() => Promise.resolve("https://mock-url.com/file.pdf")),
  deleteObject: vi.fn(() => Promise.resolve()),
}));

// Mock firebase/auth functions
vi.mock("firebase/auth", () => ({
  onAuthStateChanged: mockAuth.onAuthStateChanged,
  signInWithEmailAndPassword: mockAuth.signInWithEmailAndPassword,
  signOut: mockAuth.signOut,
}));