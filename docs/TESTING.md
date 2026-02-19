# Testing Guide

Comprehensive testing documentation for the At Home Real Estate Platform.

## Overview

| Component | Framework | Version |
|-----------|-----------|---------|
| Test Runner | Jest | 29.7.0 |
| React Testing | @testing-library/react | 16.1.0 |
| User Events | @testing-library/user-event | 14.5.2 |
| DOM Matchers | @testing-library/jest-dom | 6.4.2 |
| TypeScript | ts-jest | 29.1.2 |

---

## Quick Start

```bash
# Run all tests
npm test

# Watch mode (re-run on changes)
npm run test:watch

# Generate coverage report
npm run test:coverage

# CI mode (no interactive)
npm run test:ci
```

---

## Project Structure

```
__tests__/
├── components/
│   └── AdminPortal.test.tsx    # Component tests
├── services/
│   ├── api.test.ts             # API service tests
│   └── crmService.test.ts      # CRM logic tests
└── utils/
    └── testUtils.tsx           # Test utilities

__mocks__/
├── fileMock.js                 # Static file mock
└── styleMock.js                # CSS mock
```

---

## Configuration

### jest.config.cjs

```javascript
module.exports = {
  testEnvironment: 'jsdom',
  transform: {
    '^.+\\.tsx?$': ['ts-jest', { useESM: true }]
  },
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  testMatch: [
    '**/__tests__/**/*.test.ts?(x)',
    '**/__tests__/**/*.spec.ts?(x)'
  ],
  moduleNameMapper: {
    '\\.(css|scss)$': 'identity-obj-proxy',
    '\\.(jpg|png|svg)$': '<rootDir>/__mocks__/fileMock.js',
    '^@/(.*)$': '<rootDir>/$1'
  },
  coverageThreshold: {
    global: {
      branches: 20,
      functions: 20,
      lines: 20,
      statements: 20
    }
  }
};
```

### jest.setup.ts

Pre-configured mocks:
- `localStorage` / `sessionStorage`
- `fetch` API
- `window.matchMedia`
- `ResizeObserver` / `IntersectionObserver`
- `import.meta.env`
- Framer Motion components

---

## Test Utilities

### Location: `__tests__/utils/testUtils.tsx`

### Custom Render

```typescript
import { render, screen } from '../utils/testUtils';

const { user } = render(<MyComponent />, { route: '/leads' });

// user = userEvent instance for interactions
await user.click(screen.getByRole('button'));
```

### Mock Data Factories

```typescript
// User mock
const user = mockUser({
  role: 'admin',
  email: 'test@example.com'
});

// Lead mock
const lead = mockLead({
  status: 'qualified',
  score: 85
});

// Property mock
const property = mockProperty({
  category: 'SALE',
  priceNumeric: 2500000
});

// Notification mock
const notification = mockNotification({
  type: 'new_lead',
  read: false
});

// CRM Stats mock
const stats = mockCRMStats({
  totalLeads: 150,
  conversionRate: 30
});
```

### Fetch Mocking

```typescript
// Success response
mockFetchSuccess({ data: 'value' }, 200);

// Error response
mockFetchError('Not found', 404);

// Network error
mockFetchNetworkError();
```

### Auth Helpers

```typescript
// Setup authenticated session
setupAuthStorage(mockUser(), 'test-token');

// Clear session
clearAuthStorage();
```

### Async Utilities

```typescript
// Wait for milliseconds
await wait(100);

// Flush pending promises
await flushPromises();
```

---

## Writing Tests

### Component Test Template

```typescript
import { render, screen, mockUser, setupAuthStorage } from '../utils/testUtils';
import MyComponent from '@/components/MyComponent';

describe('MyComponent', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setupAuthStorage(mockUser({ role: 'admin' }));
  });

  it('should render correctly', () => {
    render(<MyComponent />);
    expect(screen.getByRole('heading')).toBeInTheDocument();
  });

  it('should handle click', async () => {
    const { user } = render(<MyComponent />);
    
    await user.click(screen.getByRole('button', { name: /submit/i }));
    
    expect(screen.getByText('Success')).toBeInTheDocument();
  });
});
```

### Service Test Template

```typescript
import { mockFetchSuccess, mockFetchError } from '../utils/testUtils';
import { leadsAPI } from '@/services/api';

describe('leadsAPI', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should fetch leads', async () => {
    const mockLeads = [{ id: '1', firstName: 'John' }];
    mockFetchSuccess({ leads: mockLeads });

    const result = await leadsAPI.getAll();

    expect(result.leads).toEqual(mockLeads);
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/leads'),
      expect.any(Object)
    );
  });

  it('should handle errors', async () => {
    mockFetchError('Unauthorized', 401);

    await expect(leadsAPI.getAll()).rejects.toThrow();
  });
});
```

### Async Component Test

```typescript
import { render, screen, waitFor, mockFetchSuccess } from '../utils/testUtils';

it('should load data', async () => {
  mockFetchSuccess({ items: ['a', 'b', 'c'] });
  
  render(<DataList />);
  
  // Wait for loading to complete
  await waitFor(() => {
    expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
  });
  
  expect(screen.getByText('a')).toBeInTheDocument();
});
```

---

## Best Practices

### DO

```typescript
// ✓ Use semantic queries
screen.getByRole('button', { name: /submit/i });
screen.getByLabelText('Email');
screen.getByText(/welcome/i);

// ✓ Test behavior, not implementation
expect(screen.getByText('Success')).toBeInTheDocument();

// ✓ Use async utilities
await waitFor(() => expect(element).toBeVisible());

// ✓ Clean up between tests
beforeEach(() => jest.clearAllMocks());

// ✓ Use mock factories
const lead = mockLead({ status: 'won' });
```

### DON'T

```typescript
// ✗ Query by test-id when semantic query works
screen.getByTestId('submit-button');

// ✗ Test implementation details
expect(component.state.isOpen).toBe(true);

// ✗ Use arbitrary waits
await new Promise(r => setTimeout(r, 1000));

// ✗ Share state between tests
let sharedData = {};
```

---

## Coverage

### Generate Report

```bash
npm run test:coverage
```

### Coverage Output

```
./coverage/
├── lcov-report/
│   └── index.html    # Open in browser
├── lcov.info         # For CI tools
└── coverage-final.json
```

### Current Thresholds

```javascript
coverageThreshold: {
  global: {
    branches: 20,
    functions: 20,
    lines: 20,
    statements: 20
  }
}
```

### Target Coverage

| Priority | Coverage Goal |
|----------|---------------|
| Services | 80% |
| Hooks | 70% |
| Utils | 90% |
| Components | 60% |

---

## Debugging Tests

### Verbose Output

```bash
npm test -- --verbose
```

### Run Single Test

```bash
# By filename
npm test -- AdminPortal.test.tsx

# By test name
npm test -- -t "should render login"
```

### Debug Mode

```typescript
// Add to test
screen.debug();  // Print current DOM

// Or specific element
screen.debug(screen.getByRole('form'));
```

### Common Issues

**Test not found:**
- Check file matches `*.test.ts(x)` pattern
- Verify in `__tests__/` directory

**Module not found:**
- Check `@/` path alias in jest.config.cjs
- Verify moduleNameMapper

**Timeout:**
- Increase timeout: `jest.setTimeout(10000)`
- Check for unresolved promises

**localStorage undefined:**
- Already mocked in jest.setup.ts
- Use `setupAuthStorage()` helper

---

## CI/CD Integration

### GitHub Actions

```yaml
- name: Run Tests
  run: npm run test:ci

- name: Upload Coverage
  uses: codecov/codecov-action@v3
  with:
    files: ./coverage/lcov.info
```

### Test Command

```bash
npm run test:ci
# Runs: jest --ci --coverage --reporters=default --reporters=jest-junit
```

### Output Files

- `coverage/` - Coverage reports
- `junit.xml` - Test results (CI parsing)

---

## Mock Reference

### Available Mocks (jest.setup.ts)

| Mock | Purpose |
|------|---------|
| localStorage | Browser storage |
| sessionStorage | Session storage |
| fetch | Network requests |
| matchMedia | Responsive queries |
| ResizeObserver | Element resizing |
| IntersectionObserver | Viewport detection |
| scrollTo | Scroll behavior |
| import.meta.env | Vite env vars |
| framer-motion | Animation library |

### Resetting Mocks

```typescript
beforeEach(() => {
  jest.clearAllMocks();        // Clear call history
  localStorageMock.clear();    // Clear storage
  resetFetchMock();            // Reset fetch
});
```
