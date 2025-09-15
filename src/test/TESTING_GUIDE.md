# Testing Guide for DocWeld

This guide explains how to write and run tests in the DocWeld application.

## Testing Philosophy

**IMPORTANT**: Write tests first based on the intended user behavior, then suggest fixes to the component to make tests pass. Don't adjust tests to match broken component behavior.

Key principles:

- Tests define correct behavior
- If components have duplicate UI elements or workarounds, suggest simplifying the component rather than accommodating it in tests
- Test user behavior, not implementation details
- Single UI elements only - use responsive CSS for mobile/desktop differences

## Testing Stack

- **Vitest**: Modern, fast test runner built for Vite
- **React Testing Library**: Tests React components from user perspective
- **@testing-library/user-event**: Simulates user interactions
- **@testing-library/jest-dom**: Provides helpful DOM matchers

## Running Tests

```bash
npm test              # Run tests in watch mode
npm run test:run      # Run tests once
npm run test:ui       # Open Vitest UI
npm run test:coverage # Run tests with coverage
```

## File Structure

```
src/
├── test/
│   ├── setup.ts              # Global test setup
│   ├── mocks/                # Mock implementations
│   │   ├── firebase.ts       # Firebase service mocks
│   │   └── firebaseConfig.ts # Firebase config mocks
│   └── utils/
│       └── testUtils.tsx    # Custom render function
├── hooks/
│   └── *.test.ts            # Hook tests
└── components/
    └── **/*.test.tsx        # Component tests
```

## Testing Patterns

### 1. Testing Hooks

Hooks are the easiest to test as they're pure functions. Here's the pattern:

```javascript
import { renderHook } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useYourHook } from './useYourHook';

describe('useYourHook', () => {
  beforeEach(() => {
    // Reset mocks before each test
    vi.clearAllMocks();
  });

  it('should return initial state', () => {
    const { result } = renderHook(() => useYourHook());

    expect(result.current.someValue).toBe(expectedValue);
  });

  it('should handle async operations', async () => {
    const { result } = renderHook(() => useYourHook());

    // Trigger an async operation
    await result.current.someAsyncFunction();

    // Check the result
    expect(result.current.data).toEqual(expectedData);
  });
});
```

### 2. Testing Components

Components should be tested from the user's perspective:

```javascript
import { render, screen } from '@/test/utils/testUtils';
import userEvent from '@testing-library/user-event';
import { YourComponent } from './YourComponent';

describe('YourComponent', () => {
  it('should render with props', () => {
    render(<YourComponent title="Test Title" />);

    expect(screen.getByText('Test Title')).toBeInTheDocument();
  });

  it('should handle user interactions', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();

    render(<YourComponent onClick={onClick} />);

    await user.click(screen.getByRole('button'));

    expect(onClick).toHaveBeenCalled();
  });
});
```

### 3. Mocking Firebase

All Firebase services are automatically mocked. You can control their behavior:

```javascript
import { mockCollection, mockAddDoc } from '@/test/mocks/firebase';

it('should create a document', async () => {
  // Setup mock response
  mockAddDoc.mockResolvedValue({ id: 'new-doc-id' });

  // Your test code here
});
```

### 4. Common Testing Scenarios

#### Testing Philosophy - Single Elements

Tests should expect single UI elements and drive component simplification:

```javascript
// Correct - expect single elements
expect(screen.getByText('Submit')).toBeInTheDocument();

// If this fails due to multiple elements, FIX THE COMPONENT
// Don't accommodate duplicates in tests!
```

**Important**: If you find duplicate UI elements for mobile/desktop, refactor the component to use responsive CSS instead of duplicate elements.

#### Testing Loading States

```javascript
it('should show loading state', () => {
  // Mock the hook to return loading state
  useCollection.mockReturnValue([null, true, null]);

  render(<YourComponent />);

  expect(screen.getByText('Loading...')).toBeInTheDocument();
});
```

#### Testing Error States

```javascript
it('should handle errors', () => {
  const error = new Error('Failed to load');
  useCollection.mockReturnValue([null, false, error]);

  render(<YourComponent />);

  expect(screen.getByText(/failed to load/i)).toBeInTheDocument();
});
```

## Best Practices

### 1. Test Behavior, Not Implementation

```javascript
// Bad - testing implementation details
expect(component.state.isOpen).toBe(true);

// Good - testing behavior
expect(screen.getByRole('dialog')).toBeInTheDocument();
```

### 2. Use Accessible Queries

Priority order for queries:

1. `getByRole` - Best for accessibility
2. `getByLabelText` - Good for form elements
3. `getByPlaceholderText` - For inputs without labels
4. `getByText` - For non-interactive elements
5. `getByTestId` - Last resort

### 3. Mock External Dependencies

Always mock Firebase and other external services:

```javascript
beforeEach(() => {
  // Reset all mocks to clean state
  resetFirebaseMocks();
});
```

### 4. Write Descriptive Test Names

```javascript
// Bad
it('should work', () => {});

// Good
it('should display error message when form submission fails', () => {});
```

### 5. Keep Tests Simple and Focused

Each test should verify one specific behavior:

```javascript
// Bad - testing multiple things
it('should handle form', () => {
  // Tests validation
  // Tests submission
  // Tests success message
});

// Good - separate tests
it('should validate required fields', () => {});
it('should submit form with valid data', () => {});
it('should show success message after submission', () => {});
```

## Common Gotchas

### 1. Async Operations

Always use `await` with user interactions:

```javascript
// Bad
user.click(button);
expect(result).toBe(true);

// Good
await user.click(button);
expect(result).toBe(true);
```

### 2. Component Design

Components should use responsive CSS, not duplicate elements:

```javascript
// If you see duplicate elements, fix the component!
// Use responsive classes like:
// className="flex flex-col sm:flex-row"
// NOT duplicate renders with hidden/show classes
```

### 3. Firebase Timestamps

Mock serverTimestamp to return a consistent value:

```javascript
mockServerTimestamp.mockReturnValue(new Date('2024-01-01'));
```

## Writing Your First Test

1. Create a test file next to your component/hook with `.test.ts` or `.test.tsx` extension
2. Import necessary utilities
3. Write your test following the patterns above
4. Run `npm test` to see it in action

Example structure:

```javascript
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@/test/utils/testUtils';
import { YourComponent } from './YourComponent';

describe('YourComponent', () => {
  it('should render successfully', () => {
    render(<YourComponent />);

    // Add your assertions
    expect(screen.getByText('Expected Text')).toBeInTheDocument();
  });
});
```

## Getting Help

- Run tests with `npm test` for watch mode with helpful error messages
- Use `npm run test:ui` for a visual interface
- Check existing tests for examples
- The test setup handles most boilerplate for you
