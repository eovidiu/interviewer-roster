import { describe, test, expect, beforeAll, beforeEach, afterAll } from '@jest/globals'
import Database from 'better-sqlite3'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { randomUUID } from 'crypto'
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

describe('UserRepository', () => {
  let db
  let repository

  beforeAll(() => {
    // Create in-memory database
    db = new Database(':memory:')

    // Run migrations
    db.exec(migration001)
    db.exec(migration002)

    repository = new UserRepository(db)
  })

  afterAll(() => {
    db.close()
  })

  beforeEach(() => {
    // Clear users table
    db.prepare('DELETE FROM users').run()
  })

  describe('findAll()', () => {
    test('should return empty array when no users exist', () => {
      const users = repository.findAll()
      expect(users).toEqual([])
    })

    test('should return all users', () => {
      // Insert test users
      const stmt = db.prepare(`
        INSERT INTO users (id, email, name, role, created_at, updated_at)
        VALUES (?, ?, ?, ?, datetime('now'), datetime('now'))
      `)

      stmt.run('user1', 'user1@example.com', 'User One', 'viewer')
      stmt.run('user2', 'user2@example.com', 'User Two', 'talent')

      const users = repository.findAll()
      expect(users).toHaveLength(2)
    })

    test('should filter by role', () => {
      const stmt = db.prepare(`
        INSERT INTO users (id, email, name, role, created_at, updated_at)
        VALUES (?, ?, ?, ?, datetime('now'), datetime('now'))
      `)

      stmt.run('user1', 'user1@example.com', 'User One', 'viewer')
      stmt.run('user2', 'user2@example.com', 'User Two', 'talent')
      stmt.run('user3', 'user3@example.com', 'User Three', 'admin')

      const users = repository.findAll({ role: 'talent' })
      expect(users).toHaveLength(1)
      expect(users[0].role).toBe('talent')
    })

    test('should search by email or name', () => {
      const stmt = db.prepare(`
        INSERT INTO users (id, email, name, role, created_at, updated_at)
        VALUES (?, ?, ?, ?, datetime('now'), datetime('now'))
      `)

      stmt.run('user1', 'alice@example.com', 'Alice Smith', 'viewer')
      stmt.run('user2', 'bob@example.com', 'Bob Jones', 'talent')

      const users = repository.findAll({ search: 'alice' })
      expect(users.length).toBeGreaterThan(0)
    })

    test('should support pagination', () => {
      const stmt = db.prepare(`
        INSERT INTO users (id, email, name, role, created_at, updated_at)
        VALUES (?, ?, ?, ?, datetime('now'), datetime('now'))
      `)

      for (let i = 1; i <= 5; i++) {
        stmt.run(`user${i}`, `user${i}@example.com`, `User ${i}`, 'viewer')
      }

      const users = repository.findAll({ limit: 2, offset: 1 })
      expect(users).toHaveLength(2)
    })
  })

  describe('count()', () => {
    test('should return 0 when no users exist', () => {
      const count = repository.count()
      expect(count).toBe(0)
    })

    test('should return total count', () => {
      const stmt = db.prepare(`
        INSERT INTO users (id, email, name, role, created_at, updated_at)
        VALUES (?, ?, ?, ?, datetime('now'), datetime('now'))
      `)

      stmt.run('user1', 'user1@example.com', 'User One', 'viewer')
      stmt.run('user2', 'user2@example.com', 'User Two', 'talent')

      const count = repository.count()
      expect(count).toBe(2)
    })

    test('should count with filters', () => {
      const stmt = db.prepare(`
        INSERT INTO users (id, email, name, role, created_at, updated_at)
        VALUES (?, ?, ?, ?, datetime('now'), datetime('now'))
      `)

      stmt.run('user1', 'user1@example.com', 'User One', 'viewer')
      stmt.run('user2', 'user2@example.com', 'User Two', 'talent')

      const count = repository.count({ role: 'talent' })
      expect(count).toBe(1)
    })
  })

  describe('findByEmail()', () => {
    test('should return user when found', () => {
      db.prepare(`
        INSERT INTO users (id, email, name, role, created_at, updated_at)
        VALUES (?, ?, ?, ?, datetime('now'), datetime('now'))
      `).run('user1', 'test@example.com', 'Test User', 'admin')

      const user = repository.findByEmail('test@example.com')
      expect(user).toBeDefined()
      expect(user.email).toBe('test@example.com')
    })

    test('should return null when not found', () => {
      const user = repository.findByEmail('nonexistent@example.com')
      expect(user).toBeNull()
    })
  })

  describe('updateRole()', () => {
    test('should update user role', () => {
      db.prepare(`
        INSERT INTO users (id, email, name, role, created_at, updated_at)
        VALUES (?, ?, ?, ?, datetime('now'), datetime('now'))
      `).run('user1', 'test@example.com', 'Test User', 'viewer')

      const updated = repository.updateRole('test@example.com', 'admin')
      expect(updated.role).toBe('admin')
      expect(updated.email).toBe('test@example.com')
    })

    test('should update updated_at timestamp', () => {
      db.prepare(`
        INSERT INTO users (id, email, name, role, created_at, updated_at)
        VALUES (?, ?, ?, ?, datetime('now'), datetime('now'))
      `).run('user1', 'test@example.com', 'Test User', 'viewer')

      const before = repository.findByEmail('test@example.com')
      const updated = repository.updateRole('test@example.com', 'admin')

      expect(updated.updated_at).toBeDefined()
    })
  })

  describe('delete()', () => {
    test('should delete user and return true', () => {
      db.prepare(`
        INSERT INTO users (id, email, name, role, created_at, updated_at)
        VALUES (?, ?, ?, ?, datetime('now'), datetime('now'))
      `).run('user1', 'test@example.com', 'Test User', 'viewer')

      const result = repository.delete('test@example.com')
      expect(result).toBe(true)

      const user = repository.findByEmail('test@example.com')
      expect(user).toBeNull()
    })

    test('should return false when user not found', () => {
      const result = repository.delete('nonexistent@example.com')
      expect(result).toBe(false)
    })
  })
})
