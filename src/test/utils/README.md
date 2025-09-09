# Test Utilities

This directory contains shared test utilities to promote consistency and reduce duplication across the test suite.

## Render Functions

### `renderWithProviders(ui, options)`

The primary render function that wraps components with all necessary providers:

- I18nextProvider (internationalization)
- ThemeProvider (theming)
- BrowserRouter (routing)

```javascript
import { renderWithProviders } from '@/test/utils/testUtils';

renderWithProviders(<MyComponent />);
```

### `renderWithRouter(ui, { initialEntries, ...options })`

For testing components that need specific routing behavior:

- Uses MemoryRouter for controlled routing
- Accepts `initialEntries` to set initial route

```javascript
renderWithRouter(<MyComponent />, {
  initialEntries: ['/projects/123'],
});
```

### `renderWithI18n(ui, options)`

Lightweight render for components that only need i18n:

```javascript
renderWithI18n(<LanguageSwitcher />);
```

## Mock Data Creators

Consistent mock data creators for common entities:

```javascript
const mockUser = createMockUser({ email: 'custom@test.com' });
const mockProject = createMockProject({ name: 'Custom Project' });
const mockWeld = createMockWeld({ weldNumber: 'W-002' });
const mockWeldLog = createMockWeldLog({ name: 'WL-002' });
const mockMaterial = createMockMaterial('filler', { name: 'Filler X' });
const mockDocument = createMockDocument({ title: 'Report.pdf' });
const mockSection = createMockSection({ name: 'Reports' });
```

## Constants

### `TEST_IDS`

Common test IDs for consistent element selection:

```javascript
screen.getByTestId(TEST_IDS.dataTable);
screen.getByTestId(TEST_IDS.pageHeader);
```

### `BUTTON_MATCHERS`

Regular expressions for finding action buttons:

```javascript
screen.getByRole('button', { name: BUTTON_MATCHERS.add });
screen.getByRole('button', { name: BUTTON_MATCHERS.delete });
```

## Helper Functions

### `waitForLoadingToComplete()`

Waits for loading spinners to disappear:

```javascript
await waitForLoadingToComplete();
```

### `findActionButton(screen, action)`

Finds action buttons in data tables:

```javascript
const editButton = findActionButton(screen, 'edit');
```

### `selectTableRow(user, rowIndex)`

Selects a row in a data table:

```javascript
await selectTableRow(user, 0); // Select first row
```

## Best Practices

1. **Use the appropriate render function**:
   - `renderWithProviders` for most components
   - `renderWithRouter` when testing routing behavior
   - `renderWithI18n` for simple components with only i18n needs

2. **Use mock data creators**:
   - Provides consistency across tests
   - Easy to override specific properties
   - Reduces boilerplate

3. **Use constants for common patterns**:
   - `TEST_IDS` for data-testid attributes
   - `BUTTON_MATCHERS` for finding buttons by text

4. **Keep tests focused**:
   - Test user behavior, not implementation details
   - Mock at the highest level possible
   - Trust that base components work correctly
