# Full-Stack Development Expert

**Version:** 1.0.0

Master modern full-stack web development with React 19's server-first architecture, high-performance Fastify backends, and pragmatic behavior-driven testing.

## Overview

This skill empowers you to build production-ready, high-performance web applications using a best-of-breed technology stack that prioritizes:

- **Developer Experience** - Fast builds, hot reload, type safety
- **Performance** - Server Components, schema-based validation, SQLite optimization
- **User Experience** - Optimistic UI updates, progressive enhancement, zero-bundle-size data fetching

## Core Technologies

### Frontend
- **React 19** - Server Components and Server Actions
- **Vite 6** - Lightning-fast build tooling
- **Tailwind CSS** - Utility-first styling
- **shadcn/ui** - Copy-paste component library

### Backend
- **Fastify** - High-performance web framework
- **TypeBox** - Type-safe schema validation
- **SQLite** - Embedded database with Drizzle ORM

### Testing
- **Vitest** - Fast unit test runner
- **React Testing Library** - Behavior-driven component testing
- **MSW** - API mocking without touching code

## Key Features

### 🖥️ Server-First React Architecture

React 19 shifts the paradigm from client-side rendering to server-first:

```typescript
// app/dashboard/page.tsx - Zero JavaScript sent to client
export default async function DashboardPage() {
  // Data fetching happens on server during render
  const [user, stats] = await Promise.all([
    fetchUser(),
    fetchStats()
  ])

  return (
    <div>
      <h1>Welcome, {user.name}</h1>

      {/* Server Component - no client JavaScript */}
      <StatsGrid stats={stats} />

      {/* Only interactive parts go to client */}
      <InteractiveChart data={stats.chartData} />
    </div>
  )
}
```

**Benefits:**
- ✅ 60-80% reduction in client JavaScript bundle size
- ✅ Direct database access from components
- ✅ Automatic code splitting
- ✅ SEO-friendly by default

### ⚡ Server Actions with Optimistic UI

Replace API endpoints with Server Actions for seamless mutations:

```typescript
// app/actions.ts
'use server'

import { revalidatePath } from 'next/cache'

export async function createTodo(formData: FormData) {
  const title = formData.get('title') as string

  // Server-side validation and database operation
  const todo = await db.insert('todos').values({ title }).returning()

  // Automatic cache invalidation
  revalidatePath('/todos')

  return { todo }
}

// components/todo-form.tsx
'use client'

import { useOptimistic } from 'react'

export function TodoForm({ todos }) {
  const [optimisticTodos, addOptimisticTodo] = useOptimistic(
    todos,
    (state, newTodo) => [...state, newTodo]
  )

  async function handleSubmit(formData: FormData) {
    const title = formData.get('title') as string

    // UI updates instantly (optimistic)
    addOptimisticTodo({ id: crypto.randomUUID(), title, completed: false })

    // Server action runs in background
    await createTodo(formData)
  }

  return (
    <form action={handleSubmit}>
      <input name="title" placeholder="New todo..." />
      <button>Add</button>

      <ul>
        {optimisticTodos.map(todo => (
          <li key={todo.id}>{todo.title}</li>
        ))}
      </ul>
    </form>
  )
}
```

**Benefits:**
- ✅ Instant UI feedback
- ✅ No API boilerplate
- ✅ Progressive enhancement (works without JavaScript!)
- ✅ Built-in error handling and rollback

### 🚀 High-Performance Fastify Backend

Schema-based validation and serialization for 2-3x performance boost:

```typescript
// server/routes/users.ts
import { FastifyPluginAsync } from 'fastify'
import { Type } from '@sinclair/typebox'

const usersRoutes: FastifyPluginAsync = async (server) => {
  server.post('/api/users', {
    schema: {
      body: Type.Object({
        name: Type.String({ minLength: 1 }),
        email: Type.String({ format: 'email' })
      }),
      response: {
        201: Type.Object({
          id: Type.String(),
          name: Type.String(),
          email: Type.String()
        })
      }
    }
  }, async (request, reply) => {
    // TypeBox pre-compiles validators and serializers
    // Request body is automatically validated
    // Response is serialized 2-3x faster than JSON.stringify

    const user = await server.db
      .insert('users')
      .values(request.body)
      .returning()

    reply.code(201).send(user)
  })
}
```

**Benefits:**
- ✅ 10x faster validation (pre-compiled schemas)
- ✅ 2-3x faster JSON serialization
- ✅ Type safety with TypeScript
- ✅ Automatic API documentation

### 🧪 Behavior-Driven Testing

Test what users experience, not implementation details:

```typescript
// __tests__/components/user-form.test.tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

test('allows users to submit valid form', async () => {
  const user = userEvent.setup()
  const onSubmit = vi.fn()

  render(<UserForm onSubmit={onSubmit} />)

  // Find elements like users do (by accessible roles/labels)
  await user.type(screen.getByLabelText(/name/i), 'John Doe')
  await user.type(screen.getByLabelText(/email/i), 'john@example.com')
  await user.click(screen.getByRole('button', { name: /submit/i }))

  // Assert on visible outcomes
  expect(onSubmit).toHaveBeenCalledWith({
    name: 'John Doe',
    email: 'john@example.com'
  })
})

// __tests__/routes/users.test.ts
import { build } from '../server'

test('creates user with valid data', async () => {
  const server = await build()

  // No HTTP overhead - inject simulates request in-memory
  const response = await server.inject({
    method: 'POST',
    url: '/api/users',
    payload: { name: 'John', email: 'john@example.com' }
  })

  expect(response.statusCode).toBe(201)
  expect(response.json()).toMatchObject({
    name: 'John',
    email: 'john@example.com'
  })
})
```

**Benefits:**
- ✅ Tests resilient to refactoring
- ✅ Accessibility-first (semantic queries)
- ✅ Fast feedback (in-memory testing)
- ✅ Real user behavior validation

## Quick Start

### 1. Create New Project

```bash
# Initialize Vite project with React + TypeScript
npm create vite@latest my-app -- --template react-ts
cd my-app

# Install React 19 (RC)
npm install react@rc react-dom@rc

# Install frontend dependencies
npm install -D tailwindcss postcss autoprefixer
npm install -D @testing-library/react @testing-library/user-event vitest jsdom

# Install backend dependencies
npm install fastify @fastify/type-provider-typebox @sinclair/typebox
npm install better-sqlite3 drizzle-orm

# Setup Tailwind
npx tailwindcss init -p

# Setup shadcn/ui
npx shadcn-ui@latest init
```

### 2. Configure Vite

```typescript
// vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./test/setup.ts']
  }
})
```

### 3. Setup Fastify Server

```typescript
// server/index.ts
import Fastify from 'fastify'
import { TypeBoxTypeProvider } from '@fastify/type-provider-typebox'

const server = Fastify({
  logger: true
}).withTypeProvider<TypeBoxTypeProvider>()

// Register plugins
await server.register(import('./plugins/database'))
await server.register(import('./routes/users'), { prefix: '/api' })

await server.listen({ port: 3000 })
```

### 4. Create First Server Component

```typescript
// app/page.tsx
import { db } from '@/lib/db'

export default async function HomePage() {
  const users = await db.select().from('users')

  return (
    <div>
      <h1>Users</h1>
      <ul>
        {users.map(user => (
          <li key={user.id}>{user.name}</li>
        ))}
      </ul>
    </div>
  )
}
```

### 5. Add Server Action

```typescript
// app/actions.ts
'use server'

import { db } from '@/lib/db'
import { revalidatePath } from 'next/cache'

export async function createUser(formData: FormData) {
  const name = formData.get('name') as string

  const user = await db.insert('users').values({ name }).returning()

  revalidatePath('/users')

  return { user }
}
```

## Project Structure

```
fullstack-app/
├── app/                     # React 19 app directory
│   ├── layout.tsx          # Root layout (Server Component)
│   ├── page.tsx            # Home page (Server Component)
│   ├── actions.ts          # Server Actions
│   └── dashboard/
│       └── page.tsx        # Dashboard route
├── components/
│   ├── ui/                 # shadcn/ui components
│   │   ├── button.tsx
│   │   └── form.tsx
│   └── client/             # Client Components
│       └── interactive-chart.tsx
├── server/                 # Fastify backend
│   ├── index.ts           # Server entry
│   ├── routes/            # API routes
│   │   └── users.ts
│   ├── plugins/           # Fastify plugins
│   │   └── database.ts
│   └── schemas/           # TypeBox schemas
│       └── user.ts
├── lib/
│   ├── db.ts              # Database client
│   └── utils.ts           # Utilities
├── __tests__/
│   ├── components/        # Frontend tests
│   └── routes/           # Backend tests
└── public/                # Static assets
```

## Development Workflow

### Available Commands

```bash
# Development
npm run dev              # Start both frontend and backend
npm run dev:frontend     # Vite dev server (5173)
npm run dev:backend      # Fastify server (3000)

# Testing
npm run test            # Run all tests
npm run test:watch      # Watch mode
npm run test:coverage   # Coverage report

# Build
npm run build           # Production build
npm run preview         # Preview production build

# Database
npm run db:migrate      # Run migrations
npm run db:seed         # Seed test data
```

### package.json Scripts

```json
{
  "scripts": {
    "dev": "concurrently \"npm run dev:frontend\" \"npm run dev:backend\"",
    "dev:frontend": "vite",
    "dev:backend": "tsx watch server/index.ts",
    "build": "vite build",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest --coverage"
  }
}
```

## Common Use Cases

### Building a CRUD Application

1. **Define schema** (TypeBox)
2. **Create Fastify route** with schema validation
3. **Create Server Component** for listing
4. **Add Server Action** for mutations
5. **Add Client Component** for interactivity
6. **Write tests** for behavior

### Optimizing Performance

- Use Server Components for data-heavy UI (zero client JS)
- Implement `useOptimistic` for instant UI updates
- Enable SQLite WAL mode for better concurrency
- Add schema-based serialization for 2-3x faster JSON
- Use Suspense for progressive rendering

### Implementing Authentication

- Create `/auth/login` Server Action
- Use `@fastify/jwt` for token generation
- Add `authenticate` decorator to Fastify
- Protect routes with `onRequest: [server.authenticate]`
- Store JWT in httpOnly cookie

## Learning Resources

### Documentation

- **React 19 Patterns** - See `references/react-19-patterns.md` for Server Component and Server Action patterns
- **Fastify Performance** - See `references/fastify-performance.md` for backend optimization techniques
- **Testing Strategy** - See `references/testing-strategy.md` for behavior-driven testing approach

### External Links

- [React 19 Documentation](https://react.dev)
- [Fastify Documentation](https://fastify.dev)
- [Vite Guide](https://vitejs.dev)
- [shadcn/ui Components](https://ui.shadcn.com)
- [TypeBox Schemas](https://github.com/sinclairzx81/typebox)
- [Vitest Documentation](https://vitest.dev)

## Trigger Phrases

Use this skill when you say:

- "Build a full-stack app with React 19"
- "Create a Server Component for data fetching"
- "Setup Fastify API with schema validation"
- "Implement Server Action with optimistic update"
- "Write behavior tests for React component"
- "Optimize Vite build configuration"
- "Design shadcn/ui component system"
- "Setup SQLite with Fastify"

## Philosophy

> **Build server-first, optimize pragmatically, test behaviors. Ship fast, perform faster.**

This skill represents a modern, pragmatic approach to full-stack development that:

1. **Embraces server-first architecture** - Leverage server capabilities by default
2. **Optimizes for real performance** - Not just perceived performance
3. **Tests what matters** - User behavior, not implementation details
4. **Prioritizes developer experience** - Fast builds, type safety, hot reload
5. **Focuses on shipping** - Production-ready patterns, not academic exercises

---

**Ready to build?** Invoke this skill and start creating modern, high-performance full-stack applications!
