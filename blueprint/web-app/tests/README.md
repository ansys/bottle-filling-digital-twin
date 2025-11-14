# Test Documentation

## Overview

This directory contains the test suite for the Bottle Filling Digital Twin UI application.

## Structure

```
tests/
├── __mocks__/              # Mock files for assets and modules
│   └── fileMock.js         # Mock for static assets (images, etc.)
├── utils/                  # Test utilities and helpers
│   └── test-utils.tsx      # Custom render function and utilities
├── components/             # Component unit tests
│   ├── Loading.test.tsx    # Loading component tests
│   └── ErrorBoundary.test.tsx # Error boundary tests
├── pages/                  # Page component tests
│   └── HomePage.test.tsx   # Home page tests
├── constants/              # Constants tests
│   └── index.test.ts       # Application constants tests
├── integration/            # Integration tests
│   └── components.test.tsx # Cross-component integration tests
├── setup.ts                # Jest setup file
└── App.test.tsx            # Main App component tests
```

## Running Tests

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run tests with coverage
pnpm test:coverage

# Run specific test file
pnpm test Loading.test.tsx

# Run tests matching pattern
pnpm test --testNamePattern="renders"
```

## Test Coverage

The test suite aims for:

- **70% minimum coverage** for branches, functions, lines, and statements
- **Unit tests** for all components and utilities
- **Integration tests** for component interactions
- **Accessibility testing** using jest-dom matchers

## Writing Tests

### Component Tests

```typescript
import { render, screen } from '../utils/test-utils';
import MyComponent from '../../src/components/MyComponent';

describe('MyComponent', () => {
  it('renders correctly', () => {
    render(<MyComponent />);
    expect(screen.getByText('Expected text')).toBeInTheDocument();
  });
});
```

### Testing with Props

```typescript
it('renders with custom props', () => {
  render(<MyComponent title="Custom Title" />);
  expect(screen.getByText('Custom Title')).toBeInTheDocument();
});
```

### Testing User Interactions

```typescript
import { fireEvent } from '@testing-library/react';

it('handles click events', () => {
  const mockFn = jest.fn();
  render(<MyComponent onClick={mockFn} />);

  fireEvent.click(screen.getByRole('button'));
  expect(mockFn).toHaveBeenCalled();
});
```

### Async Testing

```typescript
import { waitFor } from '@testing-library/react';

it('handles async operations', async () => {
  render(<AsyncComponent />);

  await waitFor(() => {
    expect(screen.getByText('Loaded data')).toBeInTheDocument();
  });
});
```

## Mocking

### API Calls

```typescript
// Mock fetch globally
global.fetch = jest.fn().mockResolvedValue({
  ok: true,
  json: async () => ({ data: 'test' }),
});
```

### Modules

```typescript
// Mock external modules
jest.mock('external-library', () => ({
  someFunction: jest.fn(),
}));
```

### Router

```typescript
// Use test-utils render which includes BrowserRouter
import { render } from '../utils/test-utils';
```

## Best Practices

1. **Use descriptive test names** that explain what is being tested
2. **Group related tests** using `describe` blocks
3. **Clean up** after tests using `afterEach` or `afterAll`
4. **Mock external dependencies** to isolate units under test
5. **Test user interactions** rather than implementation details
6. **Use semantic queries** (getByRole, getByLabelText) over test IDs when possible
7. **Test accessibility** with appropriate ARIA attributes and roles

## Common Testing Patterns

### Testing Error States

```typescript
it('handles error states', () => {
  const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

  render(<ComponentThatMightError />);

  expect(screen.getByText('Error message')).toBeInTheDocument();

  consoleSpy.mockRestore();
});
```

### Testing Loading States

```typescript
it('shows loading state', () => {
  render(<ComponentWithLoading isLoading={true} />);
  expect(screen.getByText('Loading...')).toBeInTheDocument();
});
```

### Testing Form Interactions

```typescript
it('handles form submission', () => {
  const mockSubmit = jest.fn();
  render(<Form onSubmit={mockSubmit} />);

  fireEvent.change(screen.getByLabelText('Input'), {
    target: { value: 'test value' }
  });
  fireEvent.click(screen.getByRole('button', { name: 'Submit' }));

  expect(mockSubmit).toHaveBeenCalledWith('test value');
});
```
