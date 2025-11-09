---
name: fullstack-dev
description: Expert full-stack development skill for modern, high-performance web applications using React 19 server-first architecture, Fastify backend, and behavior-driven testing. Use when building production-ready applications with Server Components, Server Actions, schema-based validation, and pragmatic testing strategies. Trigger phrases include "build a full-stack app", "create React 19 server component", "setup Fastify API", "implement server actions", "write behavior tests", or any full-stack architecture questions.
---

# Full-Stack Development Expert

Master full-stack web development with React 19's server-first paradigm, high-performance Fastify backends, and behavior-driven testing strategies. Build modern, production-ready applications that prioritize developer experience, build speed, and end-user performance.

## Core Competencies

### 🖥️ Frontend: React 19 Server-First Architecture

**Technologies:** React 19, Vite 6, Tailwind CSS, shadcn/ui

**Philosophy:** Architect applications around React Server Components (RSC) and Server Actions, not traditional client-side React patterns.

**Key Capabilities:**
- Design server-first component architectures
- Implement Server Actions with optimistic updates
- Build zero-bundle-size data-heavy interfaces
- Master Vite build toolchain optimization
- Create bespoke design systems with shadcn/ui

### ⚙️ Backend: Low-Overhead Service Engineering

**Technologies:** Fastify, SQLite

**Philosophy:** Engineer for maximum throughput and minimal overhead using schema-based validation and in-process databases.

**Key Capabilities:**
- Build high-performance Fastify services
- Implement schema-based request/response validation
- Design pragmatic SQLite data architectures
- Optimize for read-heavy workloads
- Master Fastify's plugin ecosystem

### 🧪 Testing: Behavior-Driven Validation

**Technologies:** Vitest, React Testing Library, Jest

**Philosophy:** Write user-centric, behavior-driven tests that validate what users experience, not implementation details.

**Key Capabilities:**
- Write behavior-driven frontend tests with RTL
- Implement isolated backend integration tests
- Use in-memory testing for fast feedback
- Mock external dependencies effectively
- Test Server Components and Server Actions

## When to Use This Skill

Use this skill when:
- Building modern full-stack web applications
- Implementing React 19 Server Components architecture
- Creating high-performance Fastify APIs
- Setting up behavior-driven testing strategies
- Optimizing build toolchains with Vite
- Designing component systems with Tailwind + shadcn/ui
- Implementing Server Actions with optimistic UI
- Building read-heavy services with SQLite
- Architecting monorepo full-stack projects

**Trigger phrases:**
- "Build a full-stack app with React 19"
- "Create Server Component for data fetching"
- "Setup Fastify API with schema validation"
- "Implement Server Action with optimistic update"
- "Write behavior tests for React component"
- "Optimize Vite build configuration"
- "Design shadcn/ui component system"
- "Setup SQLite with Fastify"

## Architecture Patterns

### Server-First Frontend Pattern

```typescript
// app/dashboard/page.tsx - Server Component (zero bundle size)
import { getUserData, getStats } from '@/lib/data'

export default async function DashboardPage() {
  // Data fetching happens on server
  const user = await getUserData()
  const stats = await getStats()

  return (
    <div className="container">
      <h1>Welcome, {user.name}</h1>

      {/* Server Component - no JS sent to client */}
      <StatsGrid stats={stats} />

      {/* Client Component - interactive parts only */}
      <InteractiveChart data={stats.chartData} />
    </div>
  )
}

// components/stats-grid.tsx - Server Component
export function StatsGrid({ stats }: { stats: Stats }) {
  return (
    <div className="grid grid-cols-3 gap-4">
      {stats.map(stat => (
        <div key={stat.id} className="rounded-lg border p-4">
          <p className="text-sm text-muted-foreground">{stat.label}</p>
          <p className="text-2xl font-bold">{stat.value}</p>
        </div>
      ))}
    </div>
  )
}

// components/interactive-chart.tsx - Client Component
'use client'
import { useState } from 'react'

export function InteractiveChart({ data }: { data: ChartData }) {
  const [range, setRange] = useState('7d')

  return (
    <div>
      <select value={range} onChange={e => setRange(e.target.value)}>
        <option value="7d">Last 7 days</option>
        <option value="30d">Last 30 days</option>
      </select>
      <Chart data={data} range={range} />
    </div>
  )
}
```

### Server Actions with Optimistic Updates

```typescript
// app/actions.ts - Server Actions
'use server'

import { revalidatePath } from 'next/cache'
import { db } from '@/lib/db'

export async function createTodo(formData: FormData) {
  const title = formData.get('title') as string

  // Server-side validation
  if (!title || title.length < 3) {
    return { error: 'Title must be at least 3 characters' }
  }

  // Database operation
  const todo = await db.insert('todos').values({ title }).returning()

  // Revalidate the page cache
  revalidatePath('/todos')

  return { todo }
}

// components/todo-form.tsx - Client Component with optimistic update
'use client'

import { useOptimistic } from 'react'
import { createTodo } from '@/app/actions'

export function TodoForm({ todos }: { todos: Todo[] }) {
  const [optimisticTodos, addOptimisticTodo] = useOptimistic(
    todos,
    (state, newTodo: string) => [
      ...state,
      { id: crypto.randomUUID(), title: newTodo, completed: false }
    ]
  )

  async function handleSubmit(formData: FormData) {
    const title = formData.get('title') as string

    // Immediately update UI (optimistic)
    addOptimisticTodo(title)

    // Server action runs in background
    await createTodo(formData)
  }

  return (
    <div>
      <form action={handleSubmit}>
        <input name="title" placeholder="New todo..." required />
        <button type="submit">Add</button>
      </form>

      <ul>
        {optimisticTodos.map(todo => (
          <li key={todo.id}>{todo.title}</li>
        ))}
      </ul>
    </div>
  )
}
```

### High-Performance Fastify Backend

```typescript
// server/index.ts
import Fastify from 'fastify'
import { TypeBoxTypeProvider } from '@fastify/type-provider-typebox'
import { Type } from '@sinclair/typebox'

const server = Fastify({
  logger: true
}).withTypeProvider<TypeBoxTypeProvider>()

// Schema-based route with automatic validation and serialization
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
  const { name, email } = request.body

  // Type-safe: body is automatically validated
  const user = await db.insert('users').values({ name, email }).returning()

  // Fast serialization: response schema pre-compiled
  reply.code(201).send(user)
})

// Fastify plugin for database
import fp from 'fastify-plugin'
import Database from 'better-sqlite3'

export default fp(async (fastify) => {
  const db = new Database('app.db')

  // Optimize SQLite for read-heavy workloads
  db.pragma('journal_mode = WAL')
  db.pragma('synchronous = NORMAL')
  db.pragma('cache_size = 10000')

  fastify.decorate('db', db)

  fastify.addHook('onClose', () => db.close())
})

server.listen({ port: 3000 })
```

### Behavior-Driven Testing

```typescript
// __tests__/todo-form.test.tsx - Frontend behavior test
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TodoForm } from '@/components/todo-form'

describe('TodoForm', () => {
  it('allows users to add todos with optimistic updates', async () => {
    const user = userEvent.setup()
    render(<TodoForm todos={[]} />)

    // Find form elements by accessible roles/labels
    const input = screen.getByPlaceholderText(/new todo/i)
    const button = screen.getByRole('button', { name: /add/i })

    // User behavior: type and submit
    await user.type(input, 'Buy milk')
    await user.click(button)

    // Assert on visible outcome
    expect(screen.getByText('Buy milk')).toBeInTheDocument()
  })
})

// __tests__/users.test.ts - Backend integration test
import { describe, it, expect, beforeEach } from 'vitest'
import { build } from '../server'

describe('POST /api/users', () => {
  let server: FastifyInstance

  beforeEach(async () => {
    server = await build()
  })

  it('creates a user with valid data', async () => {
    // Simulate HTTP request in-memory
    const response = await server.inject({
      method: 'POST',
      url: '/api/users',
      payload: {
        name: 'John Doe',
        email: 'john@example.com'
      }
    })

    // Assert on HTTP response
    expect(response.statusCode).toBe(201)
    expect(response.json()).toMatchObject({
      name: 'John Doe',
      email: 'john@example.com'
    })
  })

  it('rejects invalid email', async () => {
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
})
```

## Project Structure

```
fullstack-app/
├── package.json              # Root workspace config
├── vite.config.ts           # Vite build configuration
├── tailwind.config.js       # Tailwind + design tokens
├── app/                     # React 19 app directory
│   ├── layout.tsx          # Root layout (Server Component)
│   ├── page.tsx            # Home page (Server Component)
│   ├── actions.ts          # Server Actions
│   └── dashboard/
│       └── page.tsx        # Dashboard (Server Component)
├── components/
│   ├── ui/                 # shadcn/ui components (owned)
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   └── form.tsx
│   └── client/             # Client Components
│       └── interactive-chart.tsx
├── lib/
│   ├── db.ts              # Database client
│   ├── data.ts            # Data access layer
│   └── utils.ts           # Shared utilities
├── server/                # Fastify backend
│   ├── index.ts          # Server entry
│   ├── routes/           # API routes
│   │   ├── users.ts
│   │   └── todos.ts
│   ├── plugins/          # Fastify plugins
│   │   └── database.ts
│   └── schemas/          # Type schemas
│       └── user.ts
├── __tests__/
│   ├── components/       # Frontend tests (Vitest + RTL)
│   └── api/             # Backend tests (Vitest/Jest)
└── public/              # Static assets
```

## Development Workflow

### Initial Setup

```bash
# Create project
npm create vite@latest my-app -- --template react-ts
cd my-app

# Install frontend dependencies
npm install react@rc react-dom@rc
npm install -D tailwindcss postcss autoprefixer
npm install -D @testing-library/react @testing-library/user-event vitest

# Install backend dependencies
npm install fastify @fastify/type-provider-typebox @sinclair/typebox
npm install better-sqlite3

# Setup Tailwind
npx tailwindcss init -p

# Setup shadcn/ui
npx shadcn-ui@latest init
```

### Development Commands

```bash
# Start development servers
npm run dev              # Both frontend + backend
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
npm run db:reset        # Reset database
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
    "test:coverage": "vitest --coverage",
    "db:migrate": "tsx scripts/migrate.ts",
    "db:reset": "tsx scripts/reset-db.ts",
    "db:seed": "tsx scripts/seed.ts"
  }
}
```

## Best Practices

### React 19 Server Components

**DO:**
- ✅ Use Server Components by default for data fetching
- ✅ Place 'use client' only where interactivity is needed
- ✅ Fetch data at the highest level possible
- ✅ Use Server Actions for mutations
- ✅ Combine Server Actions with useOptimistic for instant UI

**DON'T:**
- ❌ Don't fetch data in useEffect (use Server Components)
- ❌ Don't make every component a Client Component
- ❌ Don't use client-side state management for server data
- ❌ Don't build APIs just for your own frontend

### Fastify Performance

**DO:**
- ✅ Define JSON schemas for all routes
- ✅ Use TypeBox for type-safe schemas
- ✅ Leverage schema-based serialization
- ✅ Use Fastify plugins for encapsulation
- ✅ Enable SQLite WAL mode for concurrency

**DON'T:**
- ❌ Don't skip schema validation (it's free performance)
- ❌ Don't use manual JSON.stringify (schemas are faster)
- ❌ Don't ignore Fastify's lifecycle hooks
- ❌ Don't put all routes in one file

### Testing Strategy

**DO:**
- ✅ Test user behavior, not implementation
- ✅ Query by accessible roles and labels
- ✅ Use inject() for backend tests (no network)
- ✅ Mock database layer for speed
- ✅ Test happy path and error cases

**DON'T:**
- ❌ Don't test internal component state
- ❌ Don't query by CSS classes or test IDs
- ❌ Don't make real HTTP requests in tests
- ❌ Don't test library code (React, Fastify)
- ❌ Don't aim for 100% coverage (test what matters)

## Common Patterns

### Data Fetching in Server Components

```typescript
// ✅ Good: Fetch in Server Component
export default async function UsersPage() {
  const users = await db.select().from('users')
  return <UserList users={users} />
}

// ❌ Bad: Client-side fetching
'use client'
export default function UsersPage() {
  const [users, setUsers] = useState([])

  useEffect(() => {
    fetch('/api/users')
      .then(r => r.json())
      .then(setUsers)
  }, [])

  return <UserList users={users} />
}
```

### Form Handling with Server Actions

```typescript
// ✅ Good: Server Action with progressive enhancement
'use server'
export async function updateProfile(formData: FormData) {
  const name = formData.get('name')
  await db.update('users').set({ name })
  revalidatePath('/profile')
}

// Component works without JavaScript!
export function ProfileForm({ user }) {
  return (
    <form action={updateProfile}>
      <input name="name" defaultValue={user.name} />
      <button>Save</button>
    </form>
  )
}
```

### Fastify Route Organization

```typescript
// routes/users.ts - Plugin-based route organization
import { FastifyPluginAsync } from 'fastify'
import { Type } from '@sinclair/typebox'

const usersRoutes: FastifyPluginAsync = async (server) => {
  // All user routes in one plugin
  server.get('/users', { schema: {...} }, getUsersHandler)
  server.post('/users', { schema: {...} }, createUserHandler)
  server.get('/users/:id', { schema: {...} }, getUserHandler)
}

export default usersRoutes

// server/index.ts
server.register(usersRoutes, { prefix: '/api' })
```

## Troubleshooting

### Frontend Issues

**"ReferenceError: document is not defined"**
- Cause: Using browser APIs in Server Component
- Fix: Move to Client Component with 'use client'

**"Hydration mismatch"**
- Cause: Server/client render different content
- Fix: Use useEffect for client-only content

**Slow build times**
- Check: Large dependencies in Server Components
- Fix: Use dynamic imports for heavy libraries

### Backend Issues

**"Port already in use"**
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9
```

**"Database locked"**
- Cause: SQLite not in WAL mode
- Fix: Add `db.pragma('journal_mode = WAL')`

**Slow request validation**
- Cause: Missing schema definitions
- Fix: Add TypeBox schemas to all routes

### Testing Issues

**"Cannot find module" in tests**
- Fix: Add vitest aliases to vite.config.ts

**Tests timing out**
- Cause: Making real HTTP requests
- Fix: Use server.inject() instead

## Resources

### Documentation References
- See `references/react-19-patterns.md` for Server Component patterns
- See `references/fastify-performance.md` for backend optimization
- See `references/testing-strategy.md` for behavior-driven testing

### Quick Links
- React 19 Docs: https://react.dev
- Fastify Docs: https://fastify.dev
- Vite Guide: https://vitejs.dev
- Vitest Docs: https://vitest.dev
- shadcn/ui: https://ui.shadcn.com
- TypeBox: https://github.com/sinclairzx81/typebox

---

**Philosophy:** Build server-first, optimize pragmatically, test behaviors. Ship fast, perform faster.
