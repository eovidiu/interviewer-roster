# React 19 Server Components Patterns

Comprehensive guide to React 19's server-first architecture, including Server Components, Server Actions, and the modern patterns that enable zero-bundle-size data fetching and mutations.

## Table of Contents

- [Core Concepts](#core-concepts)
- [Server Components](#server-components)
- [Client Components](#client-components)
- [Server Actions](#server-actions)
- [Data Fetching](#data-fetching)
- [Optimistic Updates](#optimistic-updates)
- [Caching & Revalidation](#caching--revalidation)
- [Common Patterns](#common-patterns)
- [Troubleshooting](#troubleshooting)

## Core Concepts

### The Server-First Paradigm Shift

React 19 fundamentally changes how we think about React applications:

**Traditional React (Client-Side)**:
- All components run in the browser
- Data fetching happens in `useEffect`
- Entire component tree ships to client as JavaScript
- State management libraries for server data

**React 19 (Server-First)**:
- Components run on server by default
- Data fetching happens during render
- Only interactive components ship to client
- Server Actions replace API endpoints

### Component Rendering Model

```
┌─────────────────────────────────────────────────┐
│ Server (Node.js/Edge Runtime)                   │
│                                                  │
│  ┌─────────────────────────────────────┐       │
│  │ Server Components                   │       │
│  │ - Fetch data directly                │       │
│  │ - Access backend resources          │       │
│  │ - Zero client JavaScript            │       │
│  │ - Async/await data fetching         │       │
│  └─────────────────────────────────────┘       │
│                    │                             │
│                    ▼                             │
│         Serialized Component Tree                │
└────────────────────┬────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────┐
│ Client (Browser)                                 │
│                                                  │
│  ┌─────────────────────────────────────┐       │
│  │ Client Components                   │       │
│  │ - Interactivity (onClick, useState) │       │
│  │ - Browser APIs (localStorage, etc)  │       │
│  │ - Client-side libraries             │       │
│  │ - Hydrates with JavaScript          │       │
│  └─────────────────────────────────────┘       │
└─────────────────────────────────────────────────┘
```

## Server Components

### Basic Server Component

Server Components are the default in React 19. They run **only on the server** and never ship JavaScript to the client.

```typescript
// app/users/page.tsx
// This is a Server Component (no 'use client' directive)

import { db } from '@/lib/db'

export default async function UsersPage() {
  // Direct database access - runs on server
  const users = await db.select().from('users')

  return (
    <div>
      <h1>Users ({users.length})</h1>
      <ul>
        {users.map(user => (
          <li key={user.id}>
            {user.name} - {user.email}
          </li>
        ))}
      </ul>
    </div>
  )
}
```

**Benefits:**
- ✅ Zero JavaScript sent to client
- ✅ Direct access to backend resources (database, file system, env vars)
- ✅ Automatic code splitting
- ✅ No hydration overhead
- ✅ Sensitive logic stays on server

### Async Server Components

Server Components can be async, enabling clean data fetching without `useEffect`:

```typescript
// app/dashboard/page.tsx
export default async function DashboardPage() {
  // Parallel data fetching
  const [user, stats, notifications] = await Promise.all([
    fetchUser(),
    fetchStats(),
    fetchNotifications()
  ])

  return (
    <div>
      <Header user={user} notifications={notifications} />
      <StatsGrid stats={stats} />
      <RecentActivity userId={user.id} />
    </div>
  )
}
```

### Nested Server Components

Server Components can render other Server Components, creating a tree of server-rendered content:

```typescript
// app/posts/page.tsx
export default async function PostsPage() {
  const posts = await fetchPosts()

  return (
    <div>
      <h1>Blog Posts</h1>
      {posts.map(post => (
        <PostCard key={post.id} postId={post.id} />
      ))}
    </div>
  )
}

// components/post-card.tsx (also a Server Component)
export async function PostCard({ postId }: { postId: string }) {
  // Each component can fetch its own data
  const post = await fetchPost(postId)
  const author = await fetchAuthor(post.authorId)

  return (
    <article>
      <h2>{post.title}</h2>
      <p>By {author.name}</p>
      <p>{post.excerpt}</p>
    </article>
  )
}
```

### Server Component Capabilities

**What You CAN Do:**
- ✅ `async` components
- ✅ Direct database queries
- ✅ File system access
- ✅ Access environment variables
- ✅ Call backend APIs/services
- ✅ Use server-only libraries (no client bundle impact)
- ✅ Sensitive computations (authentication, encryption)

**What You CANNOT Do:**
- ❌ `useState`, `useEffect`, `useContext` (React hooks)
- ❌ Event handlers (`onClick`, `onChange`, etc.)
- ❌ Browser APIs (`window`, `document`, `localStorage`)
- ❌ Client-side libraries (chart libraries, date pickers, etc.)

## Client Components

### Basic Client Component

Add `'use client'` directive at the top of the file to create a Client Component:

```typescript
// components/counter.tsx
'use client'

import { useState } from 'react'

export function Counter() {
  const [count, setCount] = useState(0)

  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => setCount(count + 1)}>
        Increment
      </button>
    </div>
  )
}
```

### Client Component Boundaries

The `'use client'` directive creates a boundary. Everything imported into that file becomes part of the client bundle:

```typescript
// components/dashboard-client.tsx
'use client'

import { useState } from 'react'
import { Chart } from 'chart.js' // ⚠️ Added to client bundle
import { Button } from './button' // ⚠️ Button is now client-side too

export function DashboardClient() {
  const [data, setData] = useState([])
  // Client-side logic
}
```

**Best Practice:** Keep client boundaries as small as possible:

```typescript
// ✅ Good: Small client boundary
// app/dashboard/page.tsx (Server Component)
export default async function DashboardPage() {
  const data = await fetchData() // Server-side fetch

  return (
    <div>
      <h1>Dashboard</h1>
      <DataTable data={data} /> {/* Server Component */}
      <InteractiveChart data={data} /> {/* Small client component */}
    </div>
  )
}

// components/interactive-chart.tsx (Client Component)
'use client'
import { Chart } from 'chart.js'

export function InteractiveChart({ data }) {
  // Only this component and its dependencies go to client
}
```

### Passing Server Components to Client Components

You can pass Server Components as children/props to Client Components:

```typescript
// components/client-wrapper.tsx
'use client'

export function ClientWrapper({
  children
}: {
  children: React.ReactNode
}) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div>
      <button onClick={() => setIsOpen(!isOpen)}>Toggle</button>
      {isOpen && children}
    </div>
  )
}

// app/page.tsx (Server Component)
export default async function Page() {
  const data = await fetchData()

  return (
    <ClientWrapper>
      {/* This ServerContent stays on server */}
      <ServerContent data={data} />
    </ClientWrapper>
  )
}
```

## Server Actions

### Basic Server Action

Server Actions are asynchronous functions that run on the server and can be called from Client Components:

```typescript
// app/actions.ts
'use server'

import { db } from '@/lib/db'
import { revalidatePath } from 'next/cache'

export async function createUser(formData: FormData) {
  const name = formData.get('name') as string
  const email = formData.get('email') as string

  // Validation
  if (!name || !email) {
    return { error: 'Name and email are required' }
  }

  // Server-side database operation
  const user = await db.insert('users').values({ name, email }).returning()

  // Revalidate cached data
  revalidatePath('/users')

  return { user }
}
```

### Using Server Actions in Forms

Server Actions enable progressive enhancement - forms work without JavaScript:

```typescript
// components/user-form.tsx
import { createUser } from '@/app/actions'

export function UserForm() {
  return (
    <form action={createUser}>
      <input name="name" placeholder="Name" required />
      <input name="email" type="email" placeholder="Email" required />
      <button type="submit">Create User</button>
    </form>
  )
}
```

**This works even without JavaScript enabled in the browser!**

### Server Actions with Client-Side Enhancement

For enhanced UX, use Server Actions with `useFormState` and `useFormStatus`:

```typescript
// components/user-form-enhanced.tsx
'use client'

import { useFormState, useFormStatus } from 'react-dom'
import { createUser } from '@/app/actions'

function SubmitButton() {
  const { pending } = useFormStatus()

  return (
    <button type="submit" disabled={pending}>
      {pending ? 'Creating...' : 'Create User'}
    </button>
  )
}

export function UserFormEnhanced() {
  const [state, formAction] = useFormState(createUser, { error: null })

  return (
    <form action={formAction}>
      <input name="name" placeholder="Name" required />
      <input name="email" type="email" placeholder="Email" required />

      {state?.error && (
        <p className="text-red-500">{state.error}</p>
      )}

      <SubmitButton />
    </form>
  )
}
```

### Server Actions Without Forms

Server Actions can be called directly from event handlers:

```typescript
// components/delete-button.tsx
'use client'

import { deleteUser } from '@/app/actions'
import { useTransition } from 'react'

export function DeleteButton({ userId }: { userId: string }) {
  const [isPending, startTransition] = useTransition()

  function handleDelete() {
    startTransition(async () => {
      await deleteUser(userId)
    })
  }

  return (
    <button
      onClick={handleDelete}
      disabled={isPending}
    >
      {isPending ? 'Deleting...' : 'Delete'}
    </button>
  )
}
```

### Server Action Best Practices

```typescript
// ✅ Good: Validation, error handling, revalidation
'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'

const UserSchema = z.object({
  name: z.string().min(1),
  email: z.string().email()
})

export async function createUser(formData: FormData) {
  // Parse and validate
  const parsed = UserSchema.safeParse({
    name: formData.get('name'),
    email: formData.get('email')
  })

  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors }
  }

  try {
    const user = await db.insert('users').values(parsed.data).returning()

    // Revalidate relevant paths
    revalidatePath('/users')
    revalidatePath(`/users/${user.id}`)

    return { user }
  } catch (error) {
    console.error('Failed to create user:', error)
    return { error: 'Failed to create user. Please try again.' }
  }
}
```

## Data Fetching

### Fetching in Server Components

Direct data fetching without `useEffect`:

```typescript
// app/products/page.tsx
export default async function ProductsPage() {
  // Fetches during server render
  const products = await db.select().from('products')

  return (
    <div>
      {products.map(product => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  )
}
```

### Parallel Data Fetching

Use `Promise.all` for parallel requests:

```typescript
export default async function DashboardPage() {
  const [user, orders, analytics] = await Promise.all([
    fetchUser(),
    fetchOrders(),
    fetchAnalytics()
  ])

  return (
    <div>
      <UserProfile user={user} />
      <OrdersList orders={orders} />
      <AnalyticsDashboard analytics={analytics} />
    </div>
  )
}
```

### Sequential Data Fetching

When one fetch depends on another:

```typescript
export default async function UserPostsPage({ params }: { params: { id: string } }) {
  // Fetch user first
  const user = await fetchUser(params.id)

  // Then fetch their posts
  const posts = await fetchUserPosts(user.id)

  return (
    <div>
      <h1>{user.name}'s Posts</h1>
      {posts.map(post => <PostCard key={post.id} post={post} />)}
    </div>
  )
}
```

### Streaming with Suspense

Show content as it loads using `<Suspense>`:

```typescript
import { Suspense } from 'react'

export default function DashboardPage() {
  return (
    <div>
      <h1>Dashboard</h1>

      {/* Renders immediately */}
      <UserGreeting />

      {/* Shows fallback until data loads */}
      <Suspense fallback={<LoadingSkeleton />}>
        <SlowDataComponent />
      </Suspense>

      {/* Other content doesn't wait */}
      <QuickStatsComponent />
    </div>
  )
}

async function SlowDataComponent() {
  const data = await fetchSlowData() // Takes 3 seconds
  return <div>{/* Render data */}</div>
}
```

## Optimistic Updates

### Using useOptimistic

Provide instant feedback while server action completes:

```typescript
// components/todo-list.tsx
'use client'

import { useOptimistic } from 'react'
import { addTodo } from '@/app/actions'

export function TodoList({ initialTodos }: { initialTodos: Todo[] }) {
  const [optimisticTodos, addOptimisticTodo] = useOptimistic(
    initialTodos,
    (state, newTodo: string) => [
      ...state,
      { id: crypto.randomUUID(), text: newTodo, completed: false }
    ]
  )

  async function handleAddTodo(formData: FormData) {
    const text = formData.get('text') as string

    // Immediate UI update
    addOptimisticTodo(text)

    // Server action runs in background
    await addTodo(formData)
  }

  return (
    <div>
      <form action={handleAddTodo}>
        <input name="text" placeholder="New todo..." />
        <button>Add</button>
      </form>

      <ul>
        {optimisticTodos.map(todo => (
          <li key={todo.id}>{todo.text}</li>
        ))}
      </ul>
    </div>
  )
}
```

### Complex Optimistic Updates

Handle deletions, updates, and rollback:

```typescript
'use client'

import { useOptimistic } from 'react'

type Action =
  | { type: 'add', todo: Todo }
  | { type: 'delete', id: string }
  | { type: 'toggle', id: string }

export function TodoList({ initialTodos }: { initialTodos: Todo[] }) {
  const [optimisticTodos, updateOptimisticTodos] = useOptimistic(
    initialTodos,
    (state, action: Action) => {
      switch (action.type) {
        case 'add':
          return [...state, action.todo]
        case 'delete':
          return state.filter(t => t.id !== action.id)
        case 'toggle':
          return state.map(t =>
            t.id === action.id
              ? { ...t, completed: !t.completed }
              : t
          )
      }
    }
  )

  async function handleToggle(id: string) {
    updateOptimisticTodos({ type: 'toggle', id })
    await toggleTodo(id)
  }

  async function handleDelete(id: string) {
    updateOptimisticTodos({ type: 'delete', id })
    await deleteTodo(id)
  }

  return (
    <ul>
      {optimisticTodos.map(todo => (
        <li key={todo.id}>
          <input
            type="checkbox"
            checked={todo.completed}
            onChange={() => handleToggle(todo.id)}
          />
          {todo.text}
          <button onClick={() => handleDelete(todo.id)}>Delete</button>
        </li>
      ))}
    </ul>
  )
}
```

## Caching & Revalidation

### Revalidating Paths

Invalidate cached data after mutations:

```typescript
// app/actions.ts
'use server'

import { revalidatePath } from 'next/cache'

export async function createPost(formData: FormData) {
  const post = await db.insert('posts').values({...}).returning()

  // Revalidate specific paths
  revalidatePath('/posts')
  revalidatePath(`/posts/${post.id}`)

  return { post }
}
```

### Revalidating Tags

Tag-based cache invalidation:

```typescript
// lib/data.ts
export async function fetchPosts() {
  return fetch('https://api.example.com/posts', {
    next: {
      tags: ['posts'],
      revalidate: 3600 // 1 hour
    }
  })
}

// app/actions.ts
'use server'

import { revalidateTag } from 'next/cache'

export async function createPost(formData: FormData) {
  await db.insert('posts').values({...})

  // Invalidate all requests tagged with 'posts'
  revalidateTag('posts')
}
```

### Time-Based Revalidation

Set automatic revalidation intervals:

```typescript
// This data revalidates every 10 minutes
export const revalidate = 600

export default async function PostsPage() {
  const posts = await fetchPosts()
  return <PostsList posts={posts} />
}
```

## Common Patterns

### Layout Pattern

Share UI across routes with layouts:

```typescript
// app/dashboard/layout.tsx (Server Component)
export default async function DashboardLayout({
  children
}: {
  children: React.ReactNode
}) {
  const user = await fetchUser()

  return (
    <div className="flex">
      <Sidebar user={user} />
      <main className="flex-1">
        {children}
      </main>
    </div>
  )
}
```

### Loading Pattern

Automatic loading states with `loading.tsx`:

```typescript
// app/posts/loading.tsx
export default function Loading() {
  return (
    <div className="animate-pulse">
      <div className="h-8 bg-gray-200 rounded w-1/4 mb-4" />
      <div className="h-4 bg-gray-200 rounded w-full mb-2" />
      <div className="h-4 bg-gray-200 rounded w-5/6" />
    </div>
  )
}
```

### Error Boundary Pattern

Handle errors with `error.tsx`:

```typescript
// app/posts/error.tsx
'use client'

export default function Error({
  error,
  reset
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div>
      <h2>Something went wrong!</h2>
      <p>{error.message}</p>
      <button onClick={reset}>Try again</button>
    </div>
  )
}
```

### Composition Pattern

Compose Server and Client Components effectively:

```typescript
// app/page.tsx (Server Component)
export default async function Page() {
  const data = await fetchData()

  return (
    <div>
      {/* Server Components for data display */}
      <StaticHeader data={data} />
      <DataTable data={data} />

      {/* Client Components for interactivity */}
      <InteractiveFilters />
      <SearchBar />

      {/* Nested composition */}
      <Tabs>
        <TabPanel title="Overview">
          <ServerRenderedOverview data={data} />
        </TabPanel>
        <TabPanel title="Details">
          <ServerRenderedDetails data={data} />
        </TabPanel>
      </Tabs>
    </div>
  )
}
```

## Troubleshooting

### "document is not defined"

**Problem:** Using browser APIs in Server Component

```typescript
// ❌ Error
export default async function Page() {
  const width = document.body.clientWidth // Error!
  return <div>Width: {width}</div>
}
```

**Solution:** Move to Client Component

```typescript
// ✅ Fix
'use client'
import { useEffect, useState } from 'react'

export default function Page() {
  const [width, setWidth] = useState(0)

  useEffect(() => {
    setWidth(document.body.clientWidth)
  }, [])

  return <div>Width: {width}</div>
}
```

### Hydration Mismatch

**Problem:** Server and client render different content

```typescript
// ❌ Error - Date.now() differs between server and client
export default function Page() {
  return <div>{Date.now()}</div>
}
```

**Solution:** Use `useEffect` for client-only content

```typescript
// ✅ Fix
'use client'
import { useEffect, useState } from 'react'

export default function Page() {
  const [time, setTime] = useState<number | null>(null)

  useEffect(() => {
    setTime(Date.now())
  }, [])

  return <div>{time ?? 'Loading...'}</div>
}
```

### "Cannot use hooks in Server Component"

**Problem:** Trying to use React hooks in Server Component

```typescript
// ❌ Error
export default async function Page() {
  const [count, setCount] = useState(0) // Error!
  return <div>{count}</div>
}
```

**Solution:** Add `'use client'` directive

```typescript
// ✅ Fix
'use client'
import { useState } from 'react'

export default function Page() {
  const [count, setCount] = useState(0)
  return <div>{count}</div>
}
```

### Large Client Bundle

**Problem:** Too much JavaScript sent to client

**Solution:** Push client boundary down

```typescript
// ❌ Bad - entire page is client-side
'use client'
export default function Page() {
  const [filter, setFilter] = useState('')
  const data = useSWR('/api/data') // All client-side

  return (
    <div>
      <input value={filter} onChange={e => setFilter(e.target.value)} />
      <DataTable data={data} /> {/* Heavy component on client */}
    </div>
  )
}

// ✅ Good - only interactive parts are client-side
export default async function Page() {
  const data = await fetchData() // Server-side

  return (
    <div>
      <ClientFilter /> {/* Small client component */}
      <DataTable data={data} /> {/* Server component */}
    </div>
  )
}
```

### Server Action Not Working

**Problem:** Server Action not being called

**Checklist:**
1. ✅ File has `'use server'` directive at the top
2. ✅ Function is exported
3. ✅ Function is async
4. ✅ Called from Client Component or form action
5. ✅ Returns serializable data (no functions, classes, etc.)

```typescript
// ✅ Correct Server Action
'use server'

export async function myAction(formData: FormData) {
  const value = formData.get('field')
  // Do server-side work
  return { success: true } // Serializable return
}
```

## Advanced Patterns

### Parallel Routes

Render multiple pages in the same layout simultaneously:

```typescript
// app/dashboard/@analytics/page.tsx
export default async function Analytics() {
  const data = await fetchAnalytics()
  return <AnalyticsPanel data={data} />
}

// app/dashboard/@notifications/page.tsx
export default async function Notifications() {
  const notifications = await fetchNotifications()
  return <NotificationsList notifications={notifications} />
}

// app/dashboard/layout.tsx
export default function Layout({
  children,
  analytics,
  notifications
}: {
  children: React.ReactNode
  analytics: React.ReactNode
  notifications: React.ReactNode
}) {
  return (
    <div>
      {children}
      <aside>
        {analytics}
        {notifications}
      </aside>
    </div>
  )
}
```

### Intercepting Routes

Intercept navigation for modals:

```typescript
// app/@modal/(.)photo/[id]/page.tsx
export default async function PhotoModal({ params }: { params: { id: string } }) {
  const photo = await fetchPhoto(params.id)

  return (
    <Modal>
      <Image src={photo.url} alt={photo.title} />
    </Modal>
  )
}
```

## Summary

React 19's server-first architecture represents a fundamental shift in building web applications:

1. **Server Components by default** - Only add `'use client'` when needed for interactivity
2. **Server Actions for mutations** - Replace API endpoints with direct server functions
3. **Optimistic UI** - Provide instant feedback with `useOptimistic`
4. **Streaming with Suspense** - Show content progressively as it loads
5. **Smart caching** - Use `revalidatePath` and `revalidateTag` for cache invalidation

This approach delivers:
- ⚡ Faster initial page loads (less JavaScript)
- 🔒 Better security (sensitive code stays on server)
- 🎯 Simpler data fetching (no `useEffect` waterfalls)
- ✨ Progressive enhancement (works without JavaScript)
- 📦 Smaller client bundles (only interactive code ships)
