---
name: test-suite
description: Use when running tests, adding new test coverage, or debugging test failures. Handles Vitest (frontend) and Jest (backend) test suites for the interviewer roster app.
---

## Test Commands

**Frontend Tests (Vitest + React Testing Library):**

```bash
npm test              # Run all tests once (CI mode)
npm run test:ui       # Run with Vitest UI (if needed)
```

**Backend Tests (Jest):**

```bash
cd server
npm test              # Run backend tests
```

## Test Structure

- **Frontend:** `src/test/` - smoke tests for routes and components
- **Backend:** `server/src/__tests__/` - API endpoint tests
- **Setup:** `src/test/setup.ts` - Vitest configuration and globals
- **Mocks:** Uses `msw` (Mock Service Worker) for API mocking in frontend tests

## What's Tested

**Frontend Smoke Tests:**
- All major routes render without crashing
- Navigation works correctly
- Components mount with seeded data
- Role-based access enforcement

**Backend Tests:**
- API endpoints return correct responses
- Database operations work as expected
- Authentication and authorization
- Data validation

## Best Practices

When adding new tests:

1. **Frontend Components:** Add tests in `src/test/` next to related files
2. **API Endpoints:** Add tests in `server/src/__tests__/`
3. **Mock External Dependencies:** Database, OAuth, external APIs
4. **Test Role-Based Access:** Verify viewer, talent, and admin permissions
5. **Ensure Routes Render:** All routes should have at least a smoke test

## Test Development Workflow

```bash
# Run tests in watch mode during development
npm test -- --watch  # Frontend
cd server && npm test -- --watch  # Backend

# Run specific test file
npm test -- path/to/test.test.tsx
```

## Common Test Patterns

**Testing React Components:**

```tsx
import { render, screen } from '@testing-library/react';
import { MyComponent } from './MyComponent';

test('renders component', () => {
  render(<MyComponent />);
  expect(screen.getByText('Expected Text')).toBeInTheDocument();
});
```

**Testing with User Interactions:**

```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

test('handles user interaction', async () => {
  const user = userEvent.setup();
  render(<MyComponent />);

  await user.click(screen.getByRole('button'));
  expect(screen.getByText('Updated')).toBeInTheDocument();
});
```

## Debugging Failed Tests

- Check test output for specific assertion failures
- Verify mock data matches expected format
- Ensure async operations are properly awaited
- Check for timing issues with user events
- Review MSW handlers for API mocking issues
