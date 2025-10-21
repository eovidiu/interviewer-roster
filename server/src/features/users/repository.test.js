/**
 * User Repository Tests (Issue #53)
 * TDD approach for database-driven role management
 */
import { test, describe, beforeEach, afterEach } from 'node:test'
import assert from 'node:assert'
import Database from 'better-sqlite3'
import { UserRepository } from './repository.js'

describe('UserRepository', () => {
  let db
  let repository

  beforeEach(() => {
    // Create in-memory database for testing
    db = new Database(':memory:')
    db.pragma('foreign_keys = ON')

    // Create users table
    db.exec(`
      CREATE TABLE users (
        id TEXT PRIMARY KEY,
        email TEXT NOT NULL UNIQUE,
        name TEXT NOT NULL,
        role TEXT NOT NULL CHECK (role IN ('viewer', 'talent', 'admin')),
        picture TEXT,
        last_login_at TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      )
    `)

    repository = new UserRepository(db)
  })

  afterEach(() => {
    db.close()
  })

  describe('findByEmail', () => {
    test('should return user by email', () => {
      // Insert test user
      db.prepare(`
        INSERT INTO users (id, email, name, role)
        VALUES (?, ?, ?, ?)
      `).run('user-1', 'alice@example.com', 'Alice', 'viewer')

      const user = repository.findByEmail('alice@example.com')

      assert.strictEqual(user.email, 'alice@example.com')
      assert.strictEqual(user.name, 'Alice')
      assert.strictEqual(user.role, 'viewer')
    })

    test('should return null if user not found', () => {
      const user = repository.findByEmail('notfound@example.com')

      assert.strictEqual(user, null)
    })
  })

  describe('create', () => {
    test('should create new user with default viewer role', () => {
      const userData = {
        email: 'bob@example.com',
        name: 'Bob'
      }

      const user = repository.create(userData)

      assert.strictEqual(user.email, 'bob@example.com')
      assert.strictEqual(user.name, 'Bob')
      assert.strictEqual(user.role, 'viewer') // Default role
      assert.ok(user.id) // ID should be generated
      assert.ok(user.created_at)
    })

    test('should create user with specified role', () => {
      const userData = {
        email: 'admin@example.com',
        name: 'Admin User',
        role: 'admin'
      }

      const user = repository.create(userData)

      assert.strictEqual(user.role, 'admin')
    })

    test('should create user with picture URL', () => {
      const userData = {
        email: 'charlie@example.com',
        name: 'Charlie',
        picture: 'https://example.com/avatar.jpg'
      }

      const user = repository.create(userData)

      assert.strictEqual(user.picture, 'https://example.com/avatar.jpg')
    })

    test('should set last_login_at on creation', () => {
      const userData = {
        email: 'dave@example.com',
        name: 'Dave'
      }

      const user = repository.create(userData)

      assert.ok(user.last_login_at)
    })
  })

  describe('updateLastLogin', () => {
    test('should update last_login_at timestamp', () => {
      // Create user
      db.prepare(`
        INSERT INTO users (id, email, name, role)
        VALUES (?, ?, ?, ?)
      `).run('user-1', 'alice@example.com', 'Alice', 'viewer')

      repository.updateLastLogin('alice@example.com')

      const user = repository.findByEmail('alice@example.com')
      assert.ok(user.last_login_at)
    })
  })

  describe('updateRole', () => {
    test('should update user role', () => {
      // Create user
      db.prepare(`
        INSERT INTO users (id, email, name, role)
        VALUES (?, ?, ?, ?)
      `).run('user-1', 'alice@example.com', 'Alice', 'viewer')

      const updated = repository.updateRole('alice@example.com', 'admin')

      assert.strictEqual(updated.role, 'admin')
    })

    test('should return null if user not found', () => {
      const updated = repository.updateRole('notfound@example.com', 'admin')

      assert.strictEqual(updated, null)
    })
  })

  describe('findAll', () => {
    beforeEach(() => {
      // Insert test users
      const users = [
        { id: 'user-1', email: 'alice@example.com', name: 'Alice', role: 'viewer' },
        { id: 'user-2', email: 'bob@example.com', name: 'Bob', role: 'talent' },
        { id: 'user-3', email: 'charlie@example.com', name: 'Charlie', role: 'admin' }
      ]

      const insert = db.prepare(`
        INSERT INTO users (id, email, name, role)
        VALUES (?, ?, ?, ?)
      `)

      users.forEach(u => insert.run(u.id, u.email, u.name, u.role))
    })

    test('should return all users', () => {
      const users = repository.findAll()

      assert.strictEqual(users.length, 3)
    })

    test('should filter by role', () => {
      const admins = repository.findAll({ role: 'admin' })

      assert.strictEqual(admins.length, 1)
      assert.strictEqual(admins[0].email, 'charlie@example.com')
    })

    test('should search by email or name', () => {
      const results = repository.findAll({ search: 'alice' })

      assert.strictEqual(results.length, 1)
      assert.strictEqual(results[0].email, 'alice@example.com')
    })

    test('should support pagination', () => {
      const page1 = repository.findAll({ limit: 2, offset: 0 })
      const page2 = repository.findAll({ limit: 2, offset: 2 })

      assert.strictEqual(page1.length, 2)
      assert.strictEqual(page2.length, 1)
    })
  })

  describe('count', () => {
    test('should return total user count', () => {
      // Insert test users
      db.prepare(`
        INSERT INTO users (id, email, name, role)
        VALUES (?, ?, ?, ?)
      `).run('user-1', 'alice@example.com', 'Alice', 'viewer')

      db.prepare(`
        INSERT INTO users (id, email, name, role)
        VALUES (?, ?, ?, ?)
      `).run('user-2', 'bob@example.com', 'Bob', 'talent')

      const count = repository.count()

      assert.strictEqual(count, 2)
    })

    test('should count with filters', () => {
      // Insert test users
      db.prepare(`
        INSERT INTO users (id, email, name, role)
        VALUES (?, ?, ?, ?)
      `).run('user-1', 'alice@example.com', 'Alice', 'admin')

      db.prepare(`
        INSERT INTO users (id, email, name, role)
        VALUES (?, ?, ?, ?)
      `).run('user-2', 'bob@example.com', 'Bob', 'viewer')

      const adminCount = repository.count({ role: 'admin' })

      assert.strictEqual(adminCount, 1)
    })
  })
})
