# Fastify High-Performance Backend Patterns

Master guide to building high-performance, production-ready backend services with Fastify, focusing on schema-based validation, SQLite optimization, and low-overhead service engineering.

## Table of Contents

- [Core Architecture](#core-architecture)
- [Schema-Based Development](#schema-based-development)
- [Plugin System](#plugin-system)
- [Database Integration](#database-integration)
- [Performance Optimization](#performance-optimization)
- [Error Handling](#error-handling)
- [Authentication & Security](#authentication--security)
- [Testing](#testing)
- [Production Deployment](#production-deployment)

## Core Architecture

### Basic Fastify Server

```typescript
// server/index.ts
import Fastify from 'fastify'
import { TypeBoxTypeProvider } from '@fastify/type-provider-typebox'

const server = Fastify({
  logger: {
    level: process.env.LOG_LEVEL || 'info',
    transport: process.env.NODE_ENV === 'development'
      ? { target: 'pino-pretty' }
      : undefined
  }
}).withTypeProvider<TypeBoxTypeProvider>()

// Plugin registration
await server.register(import('./plugins/database'))
await server.register(import('./plugins/cors'))
await server.register(import('./routes/users'), { prefix: '/api' })
await server.register(import('./routes/posts'), { prefix: '/api' })

// Start server
const start = async () => {
  try {
    await server.listen({
      port: Number(process.env.PORT) || 3000,
      host: process.env.HOST || '0.0.0.0'
    })
  } catch (err) {
    server.log.error(err)
    process.exit(1)
  }
}

start()
```

### Server Configuration

```typescript
// server/config.ts
import { FastifyServerOptions } from 'fastify'

export const serverConfig: FastifyServerOptions = {
  logger: {
    level: process.env.LOG_LEVEL || 'info'
  },
  // Request body size limits
  bodyLimit: 1048576, // 1MB

  // Timeout configuration
  connectionTimeout: 30000, // 30 seconds
  keepAliveTimeout: 65000, // 65 seconds (must be > load balancer timeout)

  // Trust proxy for accurate client IP
  trustProxy: true,

  // Disable X-Powered-By header
  disableRequestLogging: false,

  // Request ID generation
  requestIdHeader: 'x-request-id',
  requestIdLogLabel: 'reqId',
  genReqId: () => crypto.randomUUID()
}
```

## Schema-Based Development

### TypeBox Schemas

TypeBox provides compile-time type safety and runtime validation:

```typescript
// server/schemas/user.ts
import { Type, Static } from '@sinclair/typebox'

// Define reusable schemas
export const UserSchema = Type.Object({
  id: Type.String({ format: 'uuid' }),
  name: Type.String({ minLength: 1, maxLength: 100 }),
  email: Type.String({ format: 'email' }),
  age: Type.Optional(Type.Integer({ minimum: 0, maximum: 150 })),
  createdAt: Type.String({ format: 'date-time' })
})

export const CreateUserSchema = Type.Object({
  name: Type.String({ minLength: 1, maxLength: 100 }),
  email: Type.String({ format: 'email' }),
  age: Type.Optional(Type.Integer({ minimum: 0, maximum: 150 }))
})

export const UpdateUserSchema = Type.Partial(CreateUserSchema)

// Export TypeScript types
export type User = Static<typeof UserSchema>
export type CreateUser = Static<typeof CreateUserSchema>
export type UpdateUser = Static<typeof UpdateUserSchema>
```

### Schema-Based Routes

Schemas provide automatic validation and serialization:

```typescript
// server/routes/users.ts
import { FastifyPluginAsync } from 'fastify'
import { Type } from '@sinclair/typebox'
import { UserSchema, CreateUserSchema } from '../schemas/user'

const usersRoutes: FastifyPluginAsync = async (server) => {
  // GET /users
  server.get('/users', {
    schema: {
      description: 'List all users',
      tags: ['users'],
      querystring: Type.Object({
        page: Type.Integer({ minimum: 1, default: 1 }),
        limit: Type.Integer({ minimum: 1, maximum: 100, default: 20 })
      }),
      response: {
        200: Type.Object({
          users: Type.Array(UserSchema),
          total: Type.Integer(),
          page: Type.Integer(),
          limit: Type.Integer()
        })
      }
    }
  }, async (request, reply) => {
    const { page, limit } = request.query

    const users = await server.db
      .select()
      .from('users')
      .limit(limit)
      .offset((page - 1) * limit)

    const [{ count }] = await server.db
      .select({ count: sql`count(*)` })
      .from('users')

    return {
      users,
      total: count,
      page,
      limit
    }
  })

  // POST /users
  server.post('/users', {
    schema: {
      description: 'Create a new user',
      tags: ['users'],
      body: CreateUserSchema,
      response: {
        201: UserSchema,
        400: Type.Object({
          error: Type.String(),
          message: Type.String()
        })
      }
    }
  }, async (request, reply) => {
    const { name, email, age } = request.body

    // Check if email exists
    const existing = await server.db
      .select()
      .from('users')
      .where('email', email)
      .first()

    if (existing) {
      reply.code(400)
      return {
        error: 'DUPLICATE_EMAIL',
        message: 'User with this email already exists'
      }
    }

    const [user] = await server.db
      .insert('users')
      .values({ name, email, age })
      .returning()

    reply.code(201)
    return user
  })

  // GET /users/:id
  server.get('/users/:id', {
    schema: {
      description: 'Get user by ID',
      tags: ['users'],
      params: Type.Object({
        id: Type.String({ format: 'uuid' })
      }),
      response: {
        200: UserSchema,
        404: Type.Object({
          error: Type.String(),
          message: Type.String()
        })
      }
    }
  }, async (request, reply) => {
    const { id } = request.params

    const user = await server.db
      .select()
      .from('users')
      .where('id', id)
      .first()

    if (!user) {
      reply.code(404)
      return {
        error: 'USER_NOT_FOUND',
        message: `User with ID ${id} not found`
      }
    }

    return user
  })
}

export default usersRoutes
```

### Reusable Schema Patterns

```typescript
// server/schemas/common.ts
import { Type } from '@sinclair/typebox'

// Pagination
export const PaginationQuerySchema = Type.Object({
  page: Type.Integer({ minimum: 1, default: 1 }),
  limit: Type.Integer({ minimum: 1, maximum: 100, default: 20 })
})

export const PaginatedResponseSchema = <T extends TSchema>(itemSchema: T) =>
  Type.Object({
    data: Type.Array(itemSchema),
    pagination: Type.Object({
      total: Type.Integer(),
      page: Type.Integer(),
      limit: Type.Integer(),
      totalPages: Type.Integer()
    })
  })

// Error responses
export const ErrorResponseSchema = Type.Object({
  error: Type.String(),
  message: Type.String(),
  statusCode: Type.Integer()
})

// Timestamps
export const TimestampsSchema = Type.Object({
  createdAt: Type.String({ format: 'date-time' }),
  updatedAt: Type.String({ format: 'date-time' })
})

// UUID param
export const UUIDParamSchema = Type.Object({
  id: Type.String({ format: 'uuid' })
})
```

## Plugin System

### Database Plugin

```typescript
// server/plugins/database.ts
import fp from 'fastify-plugin'
import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'

declare module 'fastify' {
  interface FastifyInstance {
    db: ReturnType<typeof drizzle>
  }
}

export default fp(async (server) => {
  const sqlite = new Database(
    process.env.DATABASE_URL || 'app.db'
  )

  // SQLite optimization for read-heavy workloads
  sqlite.pragma('journal_mode = WAL') // Write-Ahead Logging
  sqlite.pragma('synchronous = NORMAL') // Faster writes
  sqlite.pragma('cache_size = 10000') // 10MB cache
  sqlite.pragma('foreign_keys = ON') // Enforce foreign keys
  sqlite.pragma('temp_store = MEMORY') // Use memory for temp tables

  const db = drizzle(sqlite)

  server.decorate('db', db)

  server.addHook('onClose', () => {
    sqlite.close()
  })

  server.log.info('Database connected')
}, {
  name: 'database'
})
```

### CORS Plugin

```typescript
// server/plugins/cors.ts
import fp from 'fastify-plugin'
import cors from '@fastify/cors'

export default fp(async (server) => {
  await server.register(cors, {
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
  })
}, {
  name: 'cors'
})
```

### Authentication Plugin

```typescript
// server/plugins/auth.ts
import fp from 'fastify-plugin'
import jwt from '@fastify/jwt'

declare module 'fastify' {
  interface FastifyInstance {
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>
  }
}

export default fp(async (server) => {
  await server.register(jwt, {
    secret: process.env.JWT_SECRET || 'supersecret'
  })

  server.decorate('authenticate', async (request, reply) => {
    try {
      await request.jwtVerify()
    } catch (err) {
      reply.code(401).send({
        error: 'UNAUTHORIZED',
        message: 'Invalid or missing authentication token'
      })
    }
  })
}, {
  name: 'auth',
  dependencies: [] // Specify plugin dependencies
})
```

### Rate Limiting Plugin

```typescript
// server/plugins/rate-limit.ts
import fp from 'fastify-plugin'
import rateLimit from '@fastify/rate-limit'

export default fp(async (server) => {
  await server.register(rateLimit, {
    max: 100, // Max requests per window
    timeWindow: '1 minute',
    cache: 10000, // Cache size
    allowList: ['127.0.0.1'], // Whitelist IPs
    redis: process.env.REDIS_URL
      ? { url: process.env.REDIS_URL }
      : undefined,
    skipOnError: true, // Don't fail requests if rate limiter errors
    keyGenerator: (request) => {
      // Use API key if present, otherwise IP
      return request.headers['x-api-key'] as string || request.ip
    }
  })
}, {
  name: 'rate-limit'
})
```

## Database Integration

### SQLite with Drizzle ORM

```typescript
// server/db/schema.ts
import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core'
import { sql } from 'drizzle-orm'

export const users = sqliteTable('users', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  age: integer('age'),
  createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
  updatedAt: text('updated_at').notNull().$defaultFn(() => new Date().toISOString())
})

export const posts = sqliteTable('posts', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  title: text('title').notNull(),
  content: text('content').notNull(),
  authorId: text('author_id').notNull().references(() => users.id),
  published: integer('published', { mode: 'boolean' }).default(false),
  createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
  updatedAt: text('updated_at').notNull().$defaultFn(() => new Date().toISOString())
})
```

### Database Queries

```typescript
// server/repositories/users.ts
import { eq, sql } from 'drizzle-orm'
import { users } from '../db/schema'
import type { FastifyInstance } from 'fastify'

export class UserRepository {
  constructor(private db: FastifyInstance['db']) {}

  async findAll(limit: number, offset: number) {
    return this.db
      .select()
      .from(users)
      .limit(limit)
      .offset(offset)
  }

  async findById(id: string) {
    const [user] = await this.db
      .select()
      .from(users)
      .where(eq(users.id, id))

    return user
  }

  async findByEmail(email: string) {
    const [user] = await this.db
      .select()
      .from(users)
      .where(eq(users.email, email))

    return user
  }

  async create(data: { name: string; email: string; passwordHash: string }) {
    const [user] = await this.db
      .insert(users)
      .values(data)
      .returning()

    return user
  }

  async update(id: string, data: Partial<{ name: string; email: string }>) {
    const [user] = await this.db
      .update(users)
      .set({
        ...data,
        updatedAt: new Date().toISOString()
      })
      .where(eq(users.id, id))
      .returning()

    return user
  }

  async delete(id: string) {
    await this.db
      .delete(users)
      .where(eq(users.id, id))
  }

  async count() {
    const [{ value }] = await this.db
      .select({ value: sql<number>`count(*)` })
      .from(users)

    return value
  }
}
```

### Transactions

```typescript
// server/services/user-service.ts
export class UserService {
  constructor(private db: FastifyInstance['db']) {}

  async createUserWithProfile(userData: CreateUser, profileData: CreateProfile) {
    // Run in transaction
    return this.db.transaction(async (tx) => {
      // Create user
      const [user] = await tx
        .insert(users)
        .values(userData)
        .returning()

      // Create profile
      const [profile] = await tx
        .insert(profiles)
        .values({ ...profileData, userId: user.id })
        .returning()

      return { user, profile }
    })
  }
}
```

## Performance Optimization

### Schema Serialization

Fastify pre-compiles schemas for 2-3x faster JSON serialization:

```typescript
// Fastify automatically optimizes this
server.get('/users', {
  schema: {
    response: {
      200: Type.Array(UserSchema) // Pre-compiled serializer generated
    }
  }
}, async () => {
  const users = await db.select().from('users')
  // Serialization is 2-3x faster than JSON.stringify
  return users
})
```

### Connection Pooling

```typescript
// server/plugins/database.ts (PostgreSQL example)
import fp from 'fastify-plugin'
import postgres from 'postgres'

export default fp(async (server) => {
  const sql = postgres(process.env.DATABASE_URL!, {
    max: 20, // Connection pool size
    idle_timeout: 30, // Close idle connections after 30s
    connect_timeout: 10, // Connection timeout
    prepare: true, // Use prepared statements
    onnotice: () => {}, // Silence notices
  })

  server.decorate('db', sql)

  server.addHook('onClose', async () => {
    await sql.end()
  })
})
```

### Response Caching

```typescript
// server/plugins/cache.ts
import fp from 'fastify-plugin'
import cache from '@fastify/caching'

export default fp(async (server) => {
  await server.register(cache, {
    privacy: 'public',
    expiresIn: 60 // 60 seconds
  })
})

// Usage in route
server.get('/users', {
  schema: {...}
}, async (request, reply) => {
  const users = await db.select().from('users')

  // Cache for 5 minutes
  reply.header('Cache-Control', 'public, max-age=300')

  return users
})
```

### Compression

```typescript
// server/plugins/compression.ts
import fp from 'fastify-plugin'
import compress from '@fastify/compress'

export default fp(async (server) => {
  await server.register(compress, {
    global: true,
    threshold: 1024, // Only compress responses > 1KB
    encodings: ['gzip', 'deflate']
  })
})
```

### SQLite Performance Tuning

```typescript
// Optimize for read-heavy workloads
sqlite.pragma('journal_mode = WAL') // Enable Write-Ahead Logging
sqlite.pragma('synchronous = NORMAL') // Balance safety and speed
sqlite.pragma('cache_size = -64000') // 64MB cache (negative = KB)
sqlite.pragma('temp_store = MEMORY') // Use memory for temp storage
sqlite.pragma('mmap_size = 30000000000') // 30GB memory-mapped I/O
sqlite.pragma('page_size = 4096') // Match OS page size

// Analyze query performance
sqlite.pragma('optimize') // Run periodically
```

## Error Handling

### Global Error Handler

```typescript
// server/plugins/error-handler.ts
import fp from 'fastify-plugin'

export default fp(async (server) => {
  server.setErrorHandler((error, request, reply) => {
    // Log error
    request.log.error({
      err: error,
      req: request,
      res: reply
    }, 'Request error')

    // Validation errors
    if (error.validation) {
      reply.code(400).send({
        error: 'VALIDATION_ERROR',
        message: 'Request validation failed',
        details: error.validation
      })
      return
    }

    // Database errors
    if (error.code?.startsWith('23')) { // PostgreSQL constraint violation
      reply.code(409).send({
        error: 'CONFLICT',
        message: 'Database constraint violation',
        code: error.code
      })
      return
    }

    // Generic errors
    const statusCode = error.statusCode || 500
    reply.code(statusCode).send({
      error: error.name || 'INTERNAL_SERVER_ERROR',
      message: statusCode === 500
        ? 'An unexpected error occurred'
        : error.message,
      statusCode
    })
  })

  // Not found handler
  server.setNotFoundHandler((request, reply) => {
    reply.code(404).send({
      error: 'NOT_FOUND',
      message: `Route ${request.method}:${request.url} not found`,
      statusCode: 404
    })
  })
})
```

### Custom Errors

```typescript
// server/errors.ts
export class AppError extends Error {
  constructor(
    public statusCode: number,
    public error: string,
    message: string
  ) {
    super(message)
    this.name = 'AppError'
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string, id: string) {
    super(404, 'NOT_FOUND', `${resource} with ID ${id} not found`)
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized') {
    super(401, 'UNAUTHORIZED', message)
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Forbidden') {
    super(403, 'FORBIDDEN', message)
  }
}

// Usage in route
server.get('/users/:id', async (request, reply) => {
  const user = await db.users.findById(request.params.id)

  if (!user) {
    throw new NotFoundError('User', request.params.id)
  }

  return user
})
```

## Authentication & Security

### JWT Authentication

```typescript
// server/routes/auth.ts
import { FastifyPluginAsync } from 'fastify'
import { Type } from '@sinclair/typebox'
import bcrypt from 'bcryptjs'

const authRoutes: FastifyPluginAsync = async (server) => {
  // Login
  server.post('/auth/login', {
    schema: {
      body: Type.Object({
        email: Type.String({ format: 'email' }),
        password: Type.String({ minLength: 8 })
      }),
      response: {
        200: Type.Object({
          accessToken: Type.String(),
          user: UserSchema
        }),
        401: ErrorResponseSchema
      }
    }
  }, async (request, reply) => {
    const { email, password } = request.body

    const user = await server.db.users.findByEmail(email)

    if (!user || !await bcrypt.compare(password, user.passwordHash)) {
      reply.code(401)
      return {
        error: 'INVALID_CREDENTIALS',
        message: 'Invalid email or password',
        statusCode: 401
      }
    }

    const accessToken = server.jwt.sign({
      userId: user.id,
      email: user.email
    }, {
      expiresIn: '7d'
    })

    return {
      accessToken,
      user: omit(user, 'passwordHash')
    }
  })

  // Protected route
  server.get('/auth/me', {
    onRequest: [server.authenticate],
    schema: {
      response: {
        200: UserSchema
      }
    }
  }, async (request) => {
    const { userId } = request.user

    const user = await server.db.users.findById(userId)

    return omit(user, 'passwordHash')
  })
}

export default authRoutes
```

### Security Headers

```typescript
// server/plugins/security.ts
import fp from 'fastify-plugin'
import helmet from '@fastify/helmet'

export default fp(async (server) => {
  await server.register(helmet, {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'https:']
      }
    },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true
    }
  })
})
```

## Testing

### Testing Fastify Server

```typescript
// __tests__/users.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { build } from '../server'
import type { FastifyInstance } from 'fastify'

describe('POST /api/users', () => {
  let server: FastifyInstance

  beforeEach(async () => {
    server = await build()
  })

  afterEach(async () => {
    await server.close()
  })

  it('creates a user with valid data', async () => {
    const response = await server.inject({
      method: 'POST',
      url: '/api/users',
      payload: {
        name: 'John Doe',
        email: 'john@example.com'
      }
    })

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
    expect(response.json()).toHaveProperty('error')
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

    // Try to create duplicate
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
```

## Production Deployment

### Environment Configuration

```typescript
// server/config/env.ts
import { Type, Static } from '@sinclair/typebox'
import Ajv from 'ajv'

const EnvSchema = Type.Object({
  NODE_ENV: Type.Union([
    Type.Literal('development'),
    Type.Literal('production'),
    Type.Literal('test')
  ]),
  PORT: Type.String({ default: '3000' }),
  HOST: Type.String({ default: '0.0.0.0' }),
  DATABASE_URL: Type.String(),
  JWT_SECRET: Type.String(),
  LOG_LEVEL: Type.String({ default: 'info' }),
  CORS_ORIGIN: Type.String({ default: '*' })
})

type Env = Static<typeof EnvSchema>

const ajv = new Ajv({
  allErrors: true,
  removeAdditional: true,
  useDefaults: true,
  coerceTypes: true
})

export function validateEnv(): Env {
  const validate = ajv.compile(EnvSchema)
  const valid = validate(process.env)

  if (!valid) {
    console.error('Invalid environment variables:', validate.errors)
    process.exit(1)
  }

  return process.env as Env
}
```

### Graceful Shutdown

```typescript
// server/index.ts
const server = await build()

// Handle shutdown signals
const signals: NodeJS.Signals[] = ['SIGINT', 'SIGTERM']

signals.forEach(signal => {
  process.on(signal, async () => {
    server.log.info(`Received ${signal}, shutting down gracefully`)

    await server.close()

    server.log.info('Server closed')
    process.exit(0)
  })
})

// Handle uncaught errors
process.on('uncaughtException', (err) => {
  server.log.fatal(err, 'Uncaught exception')
  process.exit(1)
})

process.on('unhandledRejection', (err) => {
  server.log.fatal(err, 'Unhandled rejection')
  process.exit(1)
})
```

### Health Checks

```typescript
// server/routes/health.ts
import { FastifyPluginAsync } from 'fastify'
import { Type } from '@sinclair/typebox'

const healthRoutes: FastifyPluginAsync = async (server) => {
  server.get('/health', {
    schema: {
      response: {
        200: Type.Object({
          status: Type.Literal('ok'),
          timestamp: Type.String(),
          uptime: Type.Number(),
          database: Type.Literal('connected')
        })
      }
    }
  }, async () => {
    // Check database connection
    await server.db.select().from('users').limit(1)

    return {
      status: 'ok' as const,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: 'connected' as const
    }
  })

  server.get('/health/ready', {
    schema: {
      response: {
        200: Type.Object({
          ready: Type.Boolean()
        })
      }
    }
  }, async () => {
    return { ready: true }
  })
}

export default healthRoutes
```

## Summary

Fastify's performance advantages come from:

1. **Schema-based validation** - Pre-compiled validators are 10x faster
2. **Schema-based serialization** - 2-3x faster than `JSON.stringify`
3. **Plugin architecture** - Clean encapsulation and lifecycle management
4. **Low overhead** - Minimal abstraction layers
5. **SQLite WAL mode** - Better concurrency for read-heavy workloads

**Production checklist:**
- ✅ Environment validation
- ✅ Structured logging with request IDs
- ✅ Graceful shutdown handling
- ✅ Health check endpoints
- ✅ Error handling with proper status codes
- ✅ Rate limiting
- ✅ Security headers (Helmet)
- ✅ CORS configuration
- ✅ Request/response validation schemas
- ✅ Database connection pooling
