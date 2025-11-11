import { describe, test, expect, beforeAll, beforeEach, afterAll } from '@jest/globals'
import Fastify from 'fastify'
import sensible from '@fastify/sensible'
import Database from 'better-sqlite3'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import userRoutes from '../routes.js'
import { UserService } from '../service.js'
import { UserRepository } from '../repository.js'

const __dirname = dirname(fileURLToPath(import.meta.url))

// Load migrations
const migration001 = readFileSync(
  join(__dirname, '../../../db/migrations/001_initial.sql'),
  'utf-8'
)
const migration002 = readFileSync(
  join(__dirname, '../../../db/migrations/002_add_user_fields.sql'),
  'utf-8'
)
const migration003 = readFileSync(
  join(__dirname, '../../../db/migrations/003_add_interviewer_team_fields.sql'),
  'utf-8'
)

describe('User Routes Integration Tests', () => {
  let app
  let db
  let currentUser // Shared user for authenticate decorator

  beforeAll(async () => {
    // Create in-memory database
    db = new Database(':memory:')

    // Run all migrations
    db.exec(migration001)
    db.exec(migration002)
    db.exec(migration003)

    // Create Fastify app
    app = Fastify({ logger: false })

    // Register sensible plugin for reply helpers
    await app.register(sensible)

    // Decorate with database
    app.decorate('db', db)

    // Mock audit logger
    const auditLogger = {
      log: () => {},
      logRoleChange: () => {},
    }
    app.decorate('auditLogger', auditLogger)

    // Default to admin user
    currentUser = {
      id: 'admin-id',
      email: 'admin@example.com',
      name: 'Admin User',
      role: 'admin',
    }

    // Mock authenticate decorator that uses currentUser
    app.decorate('authenticate', async (request, reply) => {
      request.user = currentUser
    })

    // Create service
    const userRepository = new UserRepository(db)
    const userService = new UserService(userRepository, auditLogger)

    // Register routes
    await app.register(userRoutes, { prefix: '/api/users', service: userService })
  })

  afterAll(async () => {
    await app.close()
    db.close()
  })

  beforeEach(() => {
    // Clear users table before each test
    db.prepare('DELETE FROM users').run()

    // Reset to admin user for each test
    currentUser = {
      id: 'admin-id',
      email: 'admin@example.com',
      name: 'Admin User',
      role: 'admin',
    }
  })

  describe('GET /api/users', () => {
    test('should return empty list when no users exist', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/users',
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body.users).toEqual([])
      expect(body.total).toBe(0)
      expect(body.hasMore).toBe(false)
    })

    test('should return list of users with pagination metadata', async () => {
      // Insert test users
      const stmt = db.prepare(`
        INSERT INTO users (id, email, name, role, created_at, updated_at)
        VALUES (?, ?, ?, ?, datetime('now'), datetime('now'))
      `)

      stmt.run('user1', 'user1@example.com', 'User One', 'viewer')
      stmt.run('user2', 'user2@example.com', 'User Two', 'talent')
      stmt.run('user3', 'user3@example.com', 'User Three', 'admin')

      const response = await app.inject({
        method: 'GET',
        url: '/api/users',
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body.users).toHaveLength(3)
      expect(body.total).toBe(3)
      expect(body.hasMore).toBe(false)
      expect(body.users[0]).toHaveProperty('id')
      expect(body.users[0]).toHaveProperty('email')
      expect(body.users[0]).toHaveProperty('name')
      expect(body.users[0]).toHaveProperty('role')
    })

    test('should filter users by role', async () => {
      // Insert test users
      const stmt = db.prepare(`
        INSERT INTO users (id, email, name, role, created_at, updated_at)
        VALUES (?, ?, ?, ?, datetime('now'), datetime('now'))
      `)

      stmt.run('user1', 'user1@example.com', 'User One', 'viewer')
      stmt.run('user2', 'user2@example.com', 'User Two', 'talent')
      stmt.run('user3', 'user3@example.com', 'User Three', 'admin')

      const response = await app.inject({
        method: 'GET',
        url: '/api/users?role=talent',
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body.users).toHaveLength(1)
      expect(body.users[0].role).toBe('talent')
      expect(body.users[0].email).toBe('user2@example.com')
    })

    test('should support pagination with limit and offset', async () => {
      // Insert test users
      const stmt = db.prepare(`
        INSERT INTO users (id, email, name, role, created_at, updated_at)
        VALUES (?, ?, ?, ?, datetime('now'), datetime('now'))
      `)

      for (let i = 1; i <= 5; i++) {
        stmt.run(`user${i}`, `user${i}@example.com`, `User ${i}`, 'viewer')
      }

      const response = await app.inject({
        method: 'GET',
        url: '/api/users?limit=2&offset=1',
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body.users).toHaveLength(2)
      expect(body.total).toBe(5)
      expect(body.hasMore).toBe(true)
    })

    test('should search users by email or name', async () => {
      // Insert test users
      const stmt = db.prepare(`
        INSERT INTO users (id, email, name, role, created_at, updated_at)
        VALUES (?, ?, ?, ?, datetime('now'), datetime('now'))
      `)

      stmt.run('user1', 'alice@example.com', 'Alice Smith', 'viewer')
      stmt.run('user2', 'bob@example.com', 'Bob Jones', 'talent')
      stmt.run('user3', 'charlie@example.com', 'Charlie Brown', 'admin')

      const response = await app.inject({
        method: 'GET',
        url: '/api/users?search=alice',
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body.users.length).toBeGreaterThan(0)
      expect(body.users[0].email).toBe('alice@example.com')
    })

    test('should return 403 when non-admin user tries to access', async () => {
      // Set non-admin user
      currentUser = {
        id: 'viewer-id',
        email: 'viewer@example.com',
        name: 'Viewer User',
        role: 'viewer',
      }

      const response = await app.inject({
        method: 'GET',
        url: '/api/users',
      })

      expect(response.statusCode).toBe(403)
      const body = JSON.parse(response.body)
      expect(body.error).toBe('Admin access required')
    })

    test('should return 400 for invalid query parameters', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/users?limit=invalid',
      })

      expect(response.statusCode).toBe(400)
    })
  })

  describe('PATCH /api/users/:email/role', () => {
    test('should update user role successfully', async () => {
      // Insert test user
      db.prepare(`
        INSERT INTO users (id, email, name, role, created_at, updated_at)
        VALUES (?, ?, ?, ?, datetime('now'), datetime('now'))
      `).run('user1', 'user1@example.com', 'User One', 'viewer')

      const response = await app.inject({
        method: 'PATCH',
        url: '/api/users/user1@example.com/role',
        payload: {
          role: 'talent',
        },
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body.email).toBe('user1@example.com')
      expect(body.role).toBe('talent')
      expect(body).toHaveProperty('updated_at')

      // Verify in database
      const user = db.prepare('SELECT role FROM users WHERE email = ?').get('user1@example.com')
      expect(user.role).toBe('talent')
    })

    test('should return 404 when user not found', async () => {
      const response = await app.inject({
        method: 'PATCH',
        url: '/api/users/nonexistent@example.com/role',
        payload: {
          role: 'admin',
        },
      })

      expect(response.statusCode).toBe(404)
      const body = JSON.parse(response.body)
      expect(body.error).toBe('User not found')
    })

    test('should return 400 for invalid role value', async () => {
      // Insert test user
      db.prepare(`
        INSERT INTO users (id, email, name, role, created_at, updated_at)
        VALUES (?, ?, ?, ?, datetime('now'), datetime('now'))
      `).run('user1', 'user1@example.com', 'User One', 'viewer')

      const response = await app.inject({
        method: 'PATCH',
        url: '/api/users/user1@example.com/role',
        payload: {
          role: 'superadmin', // Invalid role
        },
      })

      expect(response.statusCode).toBe(400)
    })

    test('should return 400 when role field is missing', async () => {
      const response = await app.inject({
        method: 'PATCH',
        url: '/api/users/user1@example.com/role',
        payload: {},
      })

      expect(response.statusCode).toBe(400)
    })

    test('should return 403 when non-admin user tries to update role', async () => {
      // Set non-admin user
      currentUser = {
        id: 'talent-id',
        email: 'talent@example.com',
        name: 'Talent User',
        role: 'talent',
      }

      const response = await app.inject({
        method: 'PATCH',
        url: '/api/users/user1@example.com/role',
        payload: {
          role: 'admin',
        },
      })

      expect(response.statusCode).toBe(403)
      const body = JSON.parse(response.body)
      expect(body.error).toBe('Admin access required')
    })
  })

  describe('DELETE /api/users/:email', () => {
    test('should delete user successfully', async () => {
      // Insert test user
      db.prepare(`
        INSERT INTO users (id, email, name, role, created_at, updated_at)
        VALUES (?, ?, ?, ?, datetime('now'), datetime('now'))
      `).run('user1', 'user1@example.com', 'User One', 'viewer')

      const response = await app.inject({
        method: 'DELETE',
        url: '/api/users/user1@example.com',
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body.success).toBe(true)
      expect(body.deletedEmail).toBe('user1@example.com')

      // Verify user is deleted
      const user = db.prepare('SELECT * FROM users WHERE email = ?').get('user1@example.com')
      expect(user).toBeUndefined()
    })

    test('should return 404 when user not found', async () => {
      const response = await app.inject({
        method: 'DELETE',
        url: '/api/users/nonexistent@example.com',
      })

      expect(response.statusCode).toBe(404)
      const body = JSON.parse(response.body)
      expect(body.error).toBe('User not found')
    })

    test('should return 403 when trying to delete protected user', async () => {
      // Insert protected user
      db.prepare(`
        INSERT INTO users (id, email, name, role, created_at, updated_at)
        VALUES (?, ?, ?, ?, datetime('now'), datetime('now'))
      `).run('protected-id', 'eovidiu@gmail.com', 'Protected User', 'admin')

      const response = await app.inject({
        method: 'DELETE',
        url: '/api/users/eovidiu@gmail.com',
      })

      expect(response.statusCode).toBe(403)
      const body = JSON.parse(response.body)
      expect(body.error).toBe('Cannot delete protected user account')

      // Verify user still exists
      const user = db.prepare('SELECT * FROM users WHERE email = ?').get('eovidiu@gmail.com')
      expect(user).toBeDefined()
    })

    test('should return 403 when trying to delete protected user (case insensitive)', async () => {
      // Insert protected user
      db.prepare(`
        INSERT INTO users (id, email, name, role, created_at, updated_at)
        VALUES (?, ?, ?, ?, datetime('now'), datetime('now'))
      `).run('protected-id', 'eovidiu@gmail.com', 'Protected User', 'admin')

      const response = await app.inject({
        method: 'DELETE',
        url: '/api/users/EOVIDIU@GMAIL.COM',
      })

      expect(response.statusCode).toBe(403)
      const body = JSON.parse(response.body)
      expect(body.error).toBe('Cannot delete protected user account')
    })

    test('should return 403 when non-admin user tries to delete', async () => {
      // Set non-admin user
      currentUser = {
        id: 'viewer-id',
        email: 'viewer@example.com',
        name: 'Viewer User',
        role: 'viewer',
      }

      const response = await app.inject({
        method: 'DELETE',
        url: '/api/users/user1@example.com',
      })

      expect(response.statusCode).toBe(403)
      const body = JSON.parse(response.body)
      expect(body.error).toBe('Admin access required')
    })
  })

  describe('Contract Tests', () => {
    test('should return user fields with correct types', async () => {
      // Insert test user with all fields
      db.prepare(`
        INSERT INTO users (id, email, name, role, google_id, picture, last_login_at, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
      `).run(
        'user1',
        'user1@example.com',
        'User One',
        'admin',
        'google123',
        'https://example.com/pic.jpg',
        '2024-01-15T10:00:00Z'
      )

      const response = await app.inject({
        method: 'GET',
        url: '/api/users',
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body.users).toHaveLength(1)

      const user = body.users[0]
      expect(typeof user.id).toBe('string')
      expect(typeof user.email).toBe('string')
      expect(typeof user.name).toBe('string')
      expect(typeof user.role).toBe('string')
      expect(user.role).toMatch(/^(viewer|talent|admin)$/)
      expect(typeof user.picture).toBe('string')
      expect(typeof user.last_login_at).toBe('string')
      expect(typeof user.created_at).toBe('string')
    })

    test('should handle null values correctly', async () => {
      // Insert user with null optional fields
      db.prepare(`
        INSERT INTO users (id, email, name, role, created_at, updated_at)
        VALUES (?, ?, ?, ?, datetime('now'), datetime('now'))
      `).run('user1', 'user1@example.com', 'User One', 'viewer')

      const response = await app.inject({
        method: 'GET',
        url: '/api/users',
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body.users[0].picture).toBeNull()
      expect(body.users[0].last_login_at).toBeNull()
    })
  })
})
