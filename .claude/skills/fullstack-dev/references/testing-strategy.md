# Behavior-Driven Testing Strategy

Comprehensive guide to pragmatic, behavior-focused testing for full-stack applications. Emphasizes testing what users experience, not implementation details.

## Table of Contents

- [Testing Philosophy](#testing-philosophy)
- [Frontend Testing](#frontend-testing)
- [Backend Testing](#backend-testing)
- [Integration Testing](#integration-testing)
- [Test Organization](#test-organization)
- [Mocking Strategies](#mocking-strategies)
- [Common Patterns](#common-patterns)
- [Anti-Patterns](#anti-patterns)

## Testing Philosophy

### The Behavior-Driven Approach

**Test behaviors, not implementation:**

```typescript
// ❌ Bad: Testing implementation details
test('increments count state when button clicked', () => {
  const { result } = renderHook(() => useState(0))
  const [count, setCount] = result.current
  act(() => setCount(count + 1))
  expect(result.current[0]).toBe(1)
})

// ✅ Good: Testing user behavior
test('shows incremented count when user clicks button', async () => {
  const user = userEvent.setup()
  render(<Counter />)

  const button = screen.getByRole('button', { name: /increment/i })
  await user.click(button)

  expect(screen.getByText('Count: 1')).toBeInTheDocument()
})
```

### Testing Pyramid

```
         /\
        /  \  E2E (Few - Slow - Expensive)
       /────\
      /      \
     / Integ  \ Integration (Some - Medium)
    /──────────\
   /            \
  /   Unit       \ Unit (Many - Fast - Cheap)
 /────────────────\
```

**Our distribution:**
- 70% Integration tests (components + API)
- 20% Unit tests (utilities, complex logic)
- 10% E2E tests (critical user flows)

### What to Test

**DO test:**
- ✅ User-facing behavior (what users see and do)
- ✅ Business logic and validations
- ✅ Error states and edge cases
- ✅ Accessibility (roles, labels, keyboard navigation)
- ✅ API contracts (request/response shapes)

**DON'T test:**
- ❌ Library internals (React, Fastify)
- ❌ Implementation details (component state, CSS classes)
- ❌ Third-party code
- ❌ Trivial code (getters/setters, pass-through functions)

## Frontend Testing

### React Testing Library Setup

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./test/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'test/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/mockData.ts'
      ]
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  }
})
```

```typescript
// test/setup.ts
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'
import '@testing-library/jest-dom'

// Cleanup after each test
afterEach(() => {
  cleanup()
})
```

### Testing Client Components

```typescript
// __tests__/components/user-form.test.tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import { UserForm } from '@/components/user-form'

describe('UserForm', () => {
  it('submits form with valid data', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()

    render(<UserForm onSubmit={onSubmit} />)

    // Fill form using accessible queries
    await user.type(
      screen.getByLabelText(/name/i),
      'John Doe'
    )
    await user.type(
      screen.getByLabelText(/email/i),
      'john@example.com'
    )

    // Submit
    await user.click(
      screen.getByRole('button', { name: /submit/i })
    )

    // Assert on behavior
    expect(onSubmit).toHaveBeenCalledWith({
      name: 'John Doe',
      email: 'john@example.com'
    })
  })

  it('shows validation errors for invalid email', async () => {
    const user = userEvent.setup()

    render(<UserForm onSubmit={vi.fn()} />)

    await user.type(
      screen.getByLabelText(/email/i),
      'invalid-email'
    )
    await user.click(
      screen.getByRole('button', { name: /submit/i })
    )

    // Error appears to user
    expect(
      await screen.findByText(/invalid email/i)
    ).toBeInTheDocument()
  })

  it('disables submit button while submitting', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn(() => new Promise(resolve =>
      setTimeout(resolve, 100)
    ))

    render(<UserForm onSubmit={onSubmit} />)

    await user.type(screen.getByLabelText(/name/i), 'John')
    await user.type(screen.getByLabelText(/email/i), 'john@example.com')

    const submitButton = screen.getByRole('button', { name: /submit/i })
    await user.click(submitButton)

    // Button disabled during submission
    expect(submitButton).toBeDisabled()
  })
})
```

### Testing Server Components

Server Components can't use React Testing Library (they're not React components in the browser). Test them by:

1. **Testing the data layer separately**
2. **E2E tests for full flow**
3. **Snapshot tests (sparingly)**

```typescript
// __tests__/lib/data.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { getUserData, getStats } from '@/lib/data'
import { db } from '@/lib/db-test'

describe('getUserData', () => {
  beforeEach(async () => {
    await db.seed() // Seed test database
  })

  it('returns user with complete profile', async () => {
    const user = await getUserData('user-123')

    expect(user).toMatchObject({
      id: 'user-123',
      name: 'John Doe',
      email: 'john@example.com'
    })
  })

  it('throws error for non-existent user', async () => {
    await expect(
      getUserData('non-existent')
    ).rejects.toThrow('User not found')
  })
})
```

### Testing with Server Actions

```typescript
// __tests__/components/todo-form.test.tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import { TodoForm } from '@/components/todo-form'
import { createTodo } from '@/app/actions'

// Mock Server Action
vi.mock('@/app/actions', () => ({
  createTodo: vi.fn()
}))

describe('TodoForm with Server Actions', () => {
  it('shows optimistic update immediately', async () => {
    const user = userEvent.setup()
    vi.mocked(createTodo).mockResolvedValue({ success: true })

    render(<TodoForm todos={[]} />)

    const input = screen.getByPlaceholderText(/new todo/i)
    await user.type(input, 'Buy milk')
    await user.click(screen.getByRole('button', { name: /add/i }))

    // Optimistic update appears immediately
    expect(screen.getByText('Buy milk')).toBeInTheDocument()
  })

  it('handles server action errors', async () => {
    const user = userEvent.setup()
    vi.mocked(createTodo).mockResolvedValue({
      error: 'Failed to create todo'
    })

    render(<TodoForm todos={[]} />)

    await user.type(screen.getByPlaceholderText(/new todo/i), 'Buy milk')
    await user.click(screen.getByRole('button', { name: /add/i }))

    // Error message displayed
    expect(
      await screen.findByText(/failed to create/i)
    ).toBeInTheDocument()
  })
})
```

### Testing Accessibility

```typescript
// __tests__/components/button.test.tsx
import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { Button } from '@/components/ui/button'

describe('Button accessibility', () => {
  it('has accessible name', () => {
    render(<Button>Click me</Button>)
    expect(
      screen.getByRole('button', { name: /click me/i })
    ).toBeInTheDocument()
  })

  it('supports aria-label when no text', () => {
    render(<Button aria-label="Close dialog"><X /></Button>)
    expect(
      screen.getByRole('button', { name: /close dialog/i })
    ).toBeInTheDocument()
  })

  it('indicates disabled state', () => {
    render(<Button disabled>Submit</Button>)
    expect(screen.getByRole('button')).toBeDisabled()
  })

  it('supports keyboard navigation', async () => {
    const user = userEvent.setup()
    const onClick = vi.fn()

    render(<Button onClick={onClick}>Click</Button>)

    const button = screen.getByRole('button')
    button.focus()

    // Space and Enter should trigger
    await user.keyboard('{Enter}')
    expect(onClick).toHaveBeenCalledTimes(1)

    await user.keyboard(' ')
    expect(onClick).toHaveBeenCalledTimes(2)
  })
})
```

## Backend Testing

### Fastify Testing Setup

```typescript
// server/build.ts
import Fastify from 'fastify'
import { TypeBoxTypeProvider } from '@fastify/type-provider-typebox'

export async function build(opts = {}) {
  const server = Fastify({
    logger: false, // Disable in tests
    ...opts
  }).withTypeProvider<TypeBoxTypeProvider>()

  // Register plugins
  await server.register(import('./plugins/database'))
  await server.register(import('./routes/users'), { prefix: '/api' })

  return server
}
```

### Testing API Routes

```typescript
// __tests__/routes/users.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { build } from '../server/build'
import type { FastifyInstance } from 'fastify'

describe('POST /api/users', () => {
  let server: FastifyInstance

  beforeEach(async () => {
    server = await build()
  })

  afterEach(async () => {
    await server.close()
  })

  it('creates user with valid data', async () => {
    const response = await server.inject({
      method: 'POST',
      url: '/api/users',
      payload: {
        name: 'John Doe',
        email: 'john@example.com',
        age: 30
      }
    })

    expect(response.statusCode).toBe(201)

    const body = response.json()
    expect(body).toMatchObject({
      name: 'John Doe',
      email: 'john@example.com',
      age: 30
    })
    expect(body).toHaveProperty('id')
    expect(body).toHaveProperty('createdAt')
  })

  it('validates required fields', async () => {
    const response = await server.inject({
      method: 'POST',
      url: '/api/users',
      payload: {
        name: 'John'
        // Missing email
      }
    })

    expect(response.statusCode).toBe(400)
    expect(response.json()).toHaveProperty('error')
  })

  it('validates email format', async () => {
    const response = await server.inject({
      method: 'POST',
      url: '/api/users',
      payload: {
        name: 'John',
        email: 'invalid-email'
      }
    })

    expect(response.statusCode).toBe(400)
  })

  it('prevents duplicate emails', async () => {
    // Create first user
    await server.inject({
      method: 'POST',
      url: '/api/users',
      payload: {
        name: 'John Doe',
        email: 'john@example.com'
      }
    })

    // Attempt duplicate
    const response = await server.inject({
      method: 'POST',
      url: '/api/users',
      payload: {
        name: 'Jane Doe',
        email: 'john@example.com'
      }
    })

    expect(response.statusCode).toBe(400)
    expect(response.json().error).toBe('DUPLICATE_EMAIL')
  })
})

describe('GET /api/users', () => {
  let server: FastifyInstance

  beforeEach(async () => {
    server = await build()

    // Seed test data
    await server.inject({
      method: 'POST',
      url: '/api/users',
      payload: { name: 'User 1', email: 'user1@example.com' }
    })
    await server.inject({
      method: 'POST',
      url: '/api/users',
      payload: { name: 'User 2', email: 'user2@example.com' }
    })
  })

  afterEach(async () => {
    await server.close()
  })

  it('returns paginated users', async () => {
    const response = await server.inject({
      method: 'GET',
      url: '/api/users?page=1&limit=10'
    })

    expect(response.statusCode).toBe(200)

    const body = response.json()
    expect(body).toHaveProperty('users')
    expect(body).toHaveProperty('total')
    expect(body.users).toHaveLength(2)
  })

  it('supports pagination', async () => {
    const response = await server.inject({
      method: 'GET',
      url: '/api/users?page=2&limit=1'
    })

    const body = response.json()
    expect(body.page).toBe(2)
    expect(body.limit).toBe(1)
    expect(body.users).toHaveLength(1)
  })
})
```

### Testing Authentication

```typescript
// __tests__/routes/auth.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { build } from '../server/build'
import type { FastifyInstance } from 'fastify'

describe('Authentication', () => {
  let server: FastifyInstance

  beforeEach(async () => {
    server = await build()

    // Create test user
    await server.inject({
      method: 'POST',
      url: '/api/auth/register',
      payload: {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'SecurePass123!'
      }
    })
  })

  afterEach(async () => {
    await server.close()
  })

  it('logs in with valid credentials', async () => {
    const response = await server.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: {
        email: 'john@example.com',
        password: 'SecurePass123!'
      }
    })

    expect(response.statusCode).toBe(200)

    const body = response.json()
    expect(body).toHaveProperty('accessToken')
    expect(body.user).toMatchObject({
      name: 'John Doe',
      email: 'john@example.com'
    })
  })

  it('rejects invalid password', async () => {
    const response = await server.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: {
        email: 'john@example.com',
        password: 'WrongPassword'
      }
    })

    expect(response.statusCode).toBe(401)
    expect(response.json().error).toBe('INVALID_CREDENTIALS')
  })

  it('protects authenticated routes', async () => {
    // Without token
    const response = await server.inject({
      method: 'GET',
      url: '/api/auth/me'
    })

    expect(response.statusCode).toBe(401)
  })

  it('allows access with valid token', async () => {
    // Get token
    const loginResponse = await server.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: {
        email: 'john@example.com',
        password: 'SecurePass123!'
      }
    })

    const { accessToken } = loginResponse.json()

    // Use token
    const response = await server.inject({
      method: 'GET',
      url: '/api/auth/me',
      headers: {
        authorization: `Bearer ${accessToken}`
      }
    })

    expect(response.statusCode).toBe(200)
    expect(response.json()).toMatchObject({
      email: 'john@example.com'
    })
  })
})
```

### Testing Database Layer

```typescript
// __tests__/repositories/user-repository.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { UserRepository } from '@/server/repositories/users'
import { getTestDb } from '@/test/db'

describe('UserRepository', () => {
  let db: ReturnType<typeof getTestDb>
  let userRepo: UserRepository

  beforeEach(async () => {
    db = getTestDb()
    await db.migrate() // Run migrations
    await db.seed() // Seed data
    userRepo = new UserRepository(db)
  })

  it('finds user by email', async () => {
    const user = await userRepo.findByEmail('john@example.com')

    expect(user).toMatchObject({
      name: 'John Doe',
      email: 'john@example.com'
    })
  })

  it('returns undefined for non-existent email', async () => {
    const user = await userRepo.findByEmail('nonexistent@example.com')
    expect(user).toBeUndefined()
  })

  it('creates user successfully', async () => {
    const user = await userRepo.create({
      name: 'Jane Doe',
      email: 'jane@example.com',
      passwordHash: 'hashed'
    })

    expect(user).toMatchObject({
      name: 'Jane Doe',
      email: 'jane@example.com'
    })
    expect(user).toHaveProperty('id')
    expect(user).toHaveProperty('createdAt')
  })

  it('updates user fields', async () => {
    const user = await userRepo.findByEmail('john@example.com')
    const updated = await userRepo.update(user.id, {
      name: 'John Updated'
    })

    expect(updated.name).toBe('John Updated')
    expect(updated.email).toBe('john@example.com') // Unchanged
  })
})
```

## Integration Testing

### Full-Stack Integration Test

```typescript
// __tests__/integration/user-flow.test.tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { build } from '@/server/build'
import { App } from '@/app'
import type { FastifyInstance } from 'fastify'

describe('User Registration and Login Flow', () => {
  let server: FastifyInstance

  beforeAll(async () => {
    server = await build()
    await server.listen({ port: 3001 })
  })

  afterAll(async () => {
    await server.close()
  })

  it('allows user to register and login', async () => {
    const user = userEvent.setup()

    render(<App apiUrl="http://localhost:3001" />)

    // Navigate to registration
    await user.click(screen.getByRole('link', { name: /register/i }))

    // Fill registration form
    await user.type(screen.getByLabelText(/name/i), 'John Doe')
    await user.type(screen.getByLabelText(/email/i), 'john@example.com')
    await user.type(screen.getByLabelText(/password/i), 'SecurePass123!')

    // Submit
    await user.click(screen.getByRole('button', { name: /register/i }))

    // Should redirect to login
    expect(
      await screen.findByText(/registration successful/i)
    ).toBeInTheDocument()

    // Login with new account
    await user.type(screen.getByLabelText(/email/i), 'john@example.com')
    await user.type(screen.getByLabelText(/password/i), 'SecurePass123!')
    await user.click(screen.getByRole('button', { name: /login/i }))

    // Should see dashboard
    expect(
      await screen.findByText(/welcome, john doe/i)
    ).toBeInTheDocument()
  })
})
```

## Test Organization

### File Structure

```
project/
├── __tests__/
│   ├── components/          # Frontend component tests
│   │   ├── user-form.test.tsx
│   │   └── todo-list.test.tsx
│   ├── lib/                # Utility tests
│   │   ├── validation.test.ts
│   │   └── utils.test.ts
│   ├── routes/             # Backend API tests
│   │   ├── users.test.ts
│   │   └── auth.test.ts
│   ├── repositories/       # Database layer tests
│   │   └── user-repository.test.ts
│   ├── integration/        # Full-stack integration tests
│   │   └── user-flow.test.tsx
│   └── e2e/               # End-to-end tests
│       └── checkout.test.ts
└── test/
    ├── setup.ts           # Test setup
    ├── db.ts             # Test database utilities
    └── fixtures/         # Test data
        └── users.ts
```

### Shared Test Utilities

```typescript
// test/factories.ts
import { faker } from '@faker-js/faker'

export const createUser = (overrides = {}) => ({
  id: faker.string.uuid(),
  name: faker.person.fullName(),
  email: faker.internet.email(),
  createdAt: faker.date.past().toISOString(),
  ...overrides
})

export const createPost = (overrides = {}) => ({
  id: faker.string.uuid(),
  title: faker.lorem.sentence(),
  content: faker.lorem.paragraphs(3),
  authorId: faker.string.uuid(),
  published: false,
  createdAt: faker.date.past().toISOString(),
  ...overrides
})
```

```typescript
// test/db.ts
import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'

export function getTestDb() {
  const sqlite = new Database(':memory:') // In-memory database
  const db = drizzle(sqlite)

  return {
    ...db,
    migrate: async () => {
      // Run migrations
    },
    seed: async () => {
      // Seed test data
    },
    reset: async () => {
      // Clear all tables
    }
  }
}
```

## Mocking Strategies

### Mock Service Worker (MSW)

For mocking API calls in frontend tests:

```typescript
// test/mocks/handlers.ts
import { http, HttpResponse } from 'msw'

export const handlers = [
  // GET /api/users
  http.get('/api/users', () => {
    return HttpResponse.json({
      users: [
        { id: '1', name: 'John Doe', email: 'john@example.com' },
        { id: '2', name: 'Jane Doe', email: 'jane@example.com' }
      ],
      total: 2
    })
  }),

  // POST /api/users
  http.post('/api/users', async ({ request }) => {
    const body = await request.json()

    return HttpResponse.json(
      {
        id: crypto.randomUUID(),
        ...body,
        createdAt: new Date().toISOString()
      },
      { status: 201 }
    )
  }),

  // Error scenario
  http.post('/api/users/error', () => {
    return HttpResponse.json(
      { error: 'SERVER_ERROR', message: 'Something went wrong' },
      { status: 500 }
    )
  })
]
```

```typescript
// test/mocks/server.ts
import { setupServer } from 'msw/node'
import { handlers } from './handlers'

export const server = setupServer(...handlers)
```

```typescript
// test/setup.ts
import { beforeAll, afterEach, afterAll } from 'vitest'
import { server } from './mocks/server'

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())
```

### Using MSW in Tests

```typescript
// __tests__/components/user-list.test.tsx
import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { server } from '@/test/mocks/server'
import { http, HttpResponse } from 'msw'
import { UserList } from '@/components/user-list'

describe('UserList', () => {
  it('displays users from API', async () => {
    render(<UserList />)

    // MSW intercepts the request automatically
    expect(await screen.findByText('John Doe')).toBeInTheDocument()
    expect(screen.getByText('Jane Doe')).toBeInTheDocument()
  })

  it('handles API errors', async () => {
    // Override handler for this test
    server.use(
      http.get('/api/users', () => {
        return HttpResponse.json(
          { error: 'SERVER_ERROR' },
          { status: 500 }
        )
      })
    )

    render(<UserList />)

    expect(
      await screen.findByText(/failed to load users/i)
    ).toBeInTheDocument()
  })
})
```

## Common Patterns

### Testing Forms

```typescript
test('validates and submits form', async () => {
  const user = userEvent.setup()
  const onSubmit = vi.fn()

  render(<UserForm onSubmit={onSubmit} />)

  // Fill form
  await user.type(screen.getByLabelText(/name/i), 'John Doe')
  await user.type(screen.getByLabelText(/email/i), 'john@example.com')

  // Submit
  await user.click(screen.getByRole('button', { name: /submit/i }))

  // Verify submission
  expect(onSubmit).toHaveBeenCalledWith({
    name: 'John Doe',
    email: 'john@example.com'
  })
})
```

### Testing Async Operations

```typescript
test('loads data on mount', async () => {
  render(<UserProfile userId="123" />)

  // Wait for loading to finish
  expect(screen.getByText(/loading/i)).toBeInTheDocument()

  // Data appears
  expect(await screen.findByText('John Doe')).toBeInTheDocument()
  expect(screen.queryByText(/loading/i)).not.toBeInTheDocument()
})
```

### Testing Error Boundaries

```typescript
test('catches and displays errors', async () => {
  const ThrowError = () => {
    throw new Error('Test error')
  }

  render(
    <ErrorBoundary fallback={<div>Something went wrong</div>}>
      <ThrowError />
    </ErrorBoundary>
  )

  expect(screen.getByText(/something went wrong/i)).toBeInTheDocument()
})
```

## Anti-Patterns

### ❌ Testing Implementation Details

```typescript
// ❌ Bad: Testing component state
test('updates state', () => {
  const { result } = renderHook(() => useCounter())
  act(() => result.current.increment())
  expect(result.current.count).toBe(1)
})

// ✅ Good: Testing visible behavior
test('shows incremented count', async () => {
  const user = userEvent.setup()
  render(<Counter />)
  await user.click(screen.getByRole('button'))
  expect(screen.getByText('Count: 1')).toBeInTheDocument()
})
```

### ❌ Querying by Class Names

```typescript
// ❌ Bad: Using test IDs or classes
expect(container.querySelector('.user-name')).toHaveTextContent('John')

// ✅ Good: Using accessible queries
expect(screen.getByRole('heading', { name: /john/i })).toBeInTheDocument()
```

### ❌ Too Many Mocks

```typescript
// ❌ Bad: Mocking everything
vi.mock('@/hooks/useAuth')
vi.mock('@/hooks/useUser')
vi.mock('@/components/Header')
vi.mock('@/components/Footer')

// ✅ Good: Only mock external dependencies
vi.mock('@/lib/api') // External API calls
// Test real components
```

### ❌ Testing Library Code

```typescript
// ❌ Bad: Testing React internals
test('useState works', () => {
  const [state, setState] = useState(0)
  setState(1)
  expect(state).toBe(1) // Don't test React!
})

// ✅ Good: Test your code, not libraries
test('shows updated count', async () => {
  // Test your component using useState
})
```

## Summary

**Behavior-driven testing principles:**

1. **Test what users experience** - Query by roles, labels, and text
2. **Avoid implementation details** - Don't test state, props, or internal methods
3. **Write integration tests** - Test components with their dependencies
4. **Mock sparingly** - Only mock external services, not your own code
5. **Test accessibility** - Use semantic queries (getByRole, getByLabelText)
6. **Keep tests fast** - Use in-memory databases, avoid network calls
7. **Focus on behavior** - Test happy paths, error cases, and edge cases

**Key tools:**
- **Vitest** - Fast, modern test runner
- **React Testing Library** - User-centric component testing
- **MSW** - Mock API calls without touching your code
- **server.inject()** - Test Fastify routes without HTTP overhead
- **userEvent** - Realistic user interactions

This approach delivers maintainable tests that catch real bugs without breaking on refactors.
