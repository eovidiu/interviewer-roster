import { describe, test, expect, beforeAll, beforeEach, afterAll } from '@jest/globals'
import Database from 'better-sqlite3'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { randomUUID } from 'crypto'
import { AuditLogRepository } from '../repository.js'

const __dirname = dirname(fileURLToPath(import.meta.url))

// Load migrations
const migration001 = readFileSync(
  join(__dirname, '../../../db/migrations/001_initial.sql'),
  'utf-8'
)

describe('AuditLogRepository', () => {
  let db
  let repository

  beforeAll(() => {
    // Create in-memory database
    db = new Database(':memory:')

    // Run migrations
    db.exec(migration001)

    repository = new AuditLogRepository(db)
  })

  afterAll(() => {
    db.close()
  })

  beforeEach(() => {
    // Clear audit_logs table
    db.prepare('DELETE FROM audit_logs').run()
  })

  describe('findAll()', () => {
    test('should return empty array when no logs exist', () => {
      const logs = repository.findAll()
      expect(logs).toEqual([])
    })

    test('should return all logs', () => {
      const stmt = db.prepare(`
        INSERT INTO audit_logs (id, user_email, user_name, action, entity_type, entity_id, changes, timestamp)
        VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
      `)

      stmt.run(randomUUID(), 'admin@example.com', 'Admin', 'CREATE_INTERVIEWER', 'interviewer', 'int-1', '{}')
      stmt.run(randomUUID(), 'admin@example.com', 'Admin', 'UPDATE_EVENT', 'event', 'evt-1', '{}')

      const logs = repository.findAll()
      expect(logs).toHaveLength(2)
    })

    test('should filter by user_email', () => {
      const stmt = db.prepare(`
        INSERT INTO audit_logs (id, user_email, user_name, action, entity_type, entity_id, changes, timestamp)
        VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
      `)

      stmt.run(randomUUID(), 'admin@example.com', 'Admin', 'CREATE_INTERVIEWER', 'interviewer', 'int-1', '{}')
      stmt.run(randomUUID(), 'user@example.com', 'User', 'CREATE_EVENT', 'event', 'evt-1', '{}')

      const logs = repository.findAll({ user_email: 'admin@example.com' })
      expect(logs).toHaveLength(1)
      expect(logs[0].user_email).toBe('admin@example.com')
    })

    test('should filter by action', () => {
      const stmt = db.prepare(`
        INSERT INTO audit_logs (id, user_email, user_name, action, entity_type, entity_id, changes, timestamp)
        VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
      `)

      stmt.run(randomUUID(), 'admin@example.com', 'Admin', 'CREATE_INTERVIEWER', 'interviewer', 'int-1', '{}')
      stmt.run(randomUUID(), 'admin@example.com', 'Admin', 'DELETE_EVENT', 'event', 'evt-1', '{}')

      const logs = repository.findAll({ action: 'DELETE_EVENT' })
      expect(logs).toHaveLength(1)
      expect(logs[0].action).toBe('DELETE_EVENT')
    })

    test('should filter by entity_type', () => {
      const stmt = db.prepare(`
        INSERT INTO audit_logs (id, user_email, user_name, action, entity_type, entity_id, changes, timestamp)
        VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
      `)

      stmt.run(randomUUID(), 'admin@example.com', 'Admin', 'CREATE_INTERVIEWER', 'interviewer', 'int-1', '{}')
      stmt.run(randomUUID(), 'admin@example.com', 'Admin', 'CREATE_EVENT', 'event', 'evt-1', '{}')

      const logs = repository.findAll({ entity_type: 'interviewer' })
      expect(logs).toHaveLength(1)
      expect(logs[0].entity_type).toBe('interviewer')
    })

    test('should filter by entity_id', () => {
      const stmt = db.prepare(`
        INSERT INTO audit_logs (id, user_email, user_name, action, entity_type, entity_id, changes, timestamp)
        VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
      `)

      stmt.run(randomUUID(), 'admin@example.com', 'Admin', 'CREATE_INTERVIEWER', 'interviewer', 'int-1', '{}')
      stmt.run(randomUUID(), 'admin@example.com', 'Admin', 'UPDATE_INTERVIEWER', 'interviewer', 'int-2', '{}')

      const logs = repository.findAll({ entity_id: 'int-1' })
      expect(logs).toHaveLength(1)
      expect(logs[0].entity_id).toBe('int-1')
    })

    test('should filter by date range', () => {
      const stmt = db.prepare(`
        INSERT INTO audit_logs (id, user_email, user_name, action, entity_type, entity_id, changes, timestamp)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `)

      stmt.run(randomUUID(), 'admin@example.com', 'Admin', 'CREATE', 'interviewer', 'int-1', '{}', '2024-01-15T10:00:00Z')
      stmt.run(randomUUID(), 'admin@example.com', 'Admin', 'UPDATE', 'interviewer', 'int-2', '{}', '2024-01-20T10:00:00Z')
      stmt.run(randomUUID(), 'admin@example.com', 'Admin', 'DELETE', 'interviewer', 'int-3', '{}', '2024-01-25T10:00:00Z')

      const logs = repository.findAll({
        start_date: '2024-01-15',
        end_date: '2024-01-20'
      })
      expect(logs).toHaveLength(2)
    })

    test('should support pagination', () => {
      const stmt = db.prepare(`
        INSERT INTO audit_logs (id, user_email, user_name, action, entity_type, entity_id, changes, timestamp)
        VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
      `)

      for (let i = 1; i <= 5; i++) {
        stmt.run(randomUUID(), 'admin@example.com', 'Admin', 'CREATE', 'interviewer', `int-${i}`, '{}')
      }

      const logs = repository.findAll({ limit: 2, offset: 1 })
      expect(logs).toHaveLength(2)
    })

    test('should parse JSON changes field', () => {
      const logId = randomUUID()

      db.prepare(`
        INSERT INTO audit_logs (id, user_email, user_name, action, entity_type, entity_id, changes, timestamp)
        VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
      `).run(logId, 'admin@example.com', 'Admin', 'UPDATE', 'interviewer', 'int-1', '{"name":"New Name"}')

      const logs = repository.findAll()
      expect(logs[0].changes).toEqual({ name: 'New Name' })
    })
  })

  describe('count()', () => {
    test('should return 0 when no logs exist', () => {
      const count = repository.count()
      expect(count).toBe(0)
    })

    test('should return total count', () => {
      const stmt = db.prepare(`
        INSERT INTO audit_logs (id, user_email, user_name, action, entity_type, entity_id, changes, timestamp)
        VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
      `)

      stmt.run(randomUUID(), 'admin@example.com', 'Admin', 'CREATE', 'interviewer', 'int-1', '{}')
      stmt.run(randomUUID(), 'admin@example.com', 'Admin', 'UPDATE', 'interviewer', 'int-2', '{}')

      const count = repository.count()
      expect(count).toBe(2)
    })

    test('should count with filters', () => {
      const stmt = db.prepare(`
        INSERT INTO audit_logs (id, user_email, user_name, action, entity_type, entity_id, changes, timestamp)
        VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
      `)

      stmt.run(randomUUID(), 'admin@example.com', 'Admin', 'CREATE', 'interviewer', 'int-1', '{}')
      stmt.run(randomUUID(), 'user@example.com', 'User', 'UPDATE', 'event', 'evt-1', '{}')

      const count = repository.count({ user_email: 'admin@example.com' })
      expect(count).toBe(1)
    })
  })

  describe('findById()', () => {
    test('should return log when found', () => {
      const logId = randomUUID()

      db.prepare(`
        INSERT INTO audit_logs (id, user_email, user_name, action, entity_type, entity_id, changes, timestamp)
        VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
      `).run(logId, 'admin@example.com', 'Admin', 'CREATE', 'interviewer', 'int-1', '{}')

      const log = repository.findById(logId)
      expect(log).toBeDefined()
      expect(log.id).toBe(logId)
    })

    test('should return null when not found', () => {
      const log = repository.findById('non-existent')
      expect(log).toBeNull()
    })
  })

  describe('findByEntity()', () => {
    test('should return logs for specific entity', () => {
      const stmt = db.prepare(`
        INSERT INTO audit_logs (id, user_email, user_name, action, entity_type, entity_id, changes, timestamp)
        VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
      `)

      stmt.run(randomUUID(), 'admin@example.com', 'Admin', 'CREATE', 'interviewer', 'int-1', '{}')
      stmt.run(randomUUID(), 'admin@example.com', 'Admin', 'UPDATE', 'interviewer', 'int-1', '{}')
      stmt.run(randomUUID(), 'admin@example.com', 'Admin', 'CREATE', 'interviewer', 'int-2', '{}')

      const logs = repository.findByEntity('interviewer', 'int-1')
      expect(logs).toHaveLength(2)
      expect(logs.every(log => log.entity_id === 'int-1')).toBe(true)
    })

    test('should return empty array when no logs found', () => {
      const logs = repository.findByEntity('interviewer', 'non-existent')
      expect(logs).toEqual([])
    })
  })

  describe('findByUser()', () => {
    test('should return logs for specific user', () => {
      const stmt = db.prepare(`
        INSERT INTO audit_logs (id, user_email, user_name, action, entity_type, entity_id, changes, timestamp)
        VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
      `)

      stmt.run(randomUUID(), 'admin@example.com', 'Admin', 'CREATE', 'interviewer', 'int-1', '{}')
      stmt.run(randomUUID(), 'admin@example.com', 'Admin', 'UPDATE', 'event', 'evt-1', '{}')
      stmt.run(randomUUID(), 'user@example.com', 'User', 'CREATE', 'interviewer', 'int-2', '{}')

      const logs = repository.findByUser('admin@example.com')
      expect(logs).toHaveLength(2)
      expect(logs.every(log => log.user_email === 'admin@example.com')).toBe(true)
    })

    test('should return empty array when no logs found for user', () => {
      const logs = repository.findByUser('nonexistent@example.com')
      expect(logs).toEqual([])
    })
  })

  describe('getStatsByAction()', () => {
    test('should return empty object when no logs', () => {
      const stats = repository.getStatsByAction()
      expect(stats).toEqual({})
    })

    test('should return count by action', () => {
      const stmt = db.prepare(`
        INSERT INTO audit_logs (id, user_email, user_name, action, entity_type, entity_id, changes, timestamp)
        VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
      `)

      stmt.run(randomUUID(), 'admin@example.com', 'Admin', 'CREATE_INTERVIEWER', 'interviewer', 'int-1', '{}')
      stmt.run(randomUUID(), 'admin@example.com', 'Admin', 'CREATE_INTERVIEWER', 'interviewer', 'int-2', '{}')
      stmt.run(randomUUID(), 'admin@example.com', 'Admin', 'UPDATE_EVENT', 'event', 'evt-1', '{}')

      const stats = repository.getStatsByAction()
      expect(stats.CREATE_INTERVIEWER).toBe(2)
      expect(stats.UPDATE_EVENT).toBe(1)
    })
  })

  describe('findRecent()', () => {
    test('should return recent logs with default limit', () => {
      const stmt = db.prepare(`
        INSERT INTO audit_logs (id, user_email, user_name, action, entity_type, entity_id, changes, timestamp)
        VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
      `)

      for (let i = 1; i <= 3; i++) {
        stmt.run(randomUUID(), 'admin@example.com', 'Admin', 'CREATE', 'interviewer', `int-${i}`, '{}')
      }

      const logs = repository.findRecent(50)
      expect(logs).toHaveLength(3)
    })

    test('should respect custom limit', () => {
      const stmt = db.prepare(`
        INSERT INTO audit_logs (id, user_email, user_name, action, entity_type, entity_id, changes, timestamp)
        VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
      `)

      for (let i = 1; i <= 10; i++) {
        stmt.run(randomUUID(), 'admin@example.com', 'Admin', 'CREATE', 'interviewer', `int-${i}`, '{}')
      }

      const logs = repository.findRecent(5)
      expect(logs).toHaveLength(5)
    })

    test('should return logs ordered by timestamp DESC', () => {
      const stmt = db.prepare(`
        INSERT INTO audit_logs (id, user_email, user_name, action, entity_type, entity_id, changes, timestamp)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `)

      stmt.run(randomUUID(), 'admin@example.com', 'Admin', 'CREATE', 'interviewer', 'int-1', '{}', '2024-01-15T10:00:00Z')
      stmt.run(randomUUID(), 'admin@example.com', 'Admin', 'UPDATE', 'interviewer', 'int-2', '{}', '2024-01-20T10:00:00Z')

      const logs = repository.findRecent(10)
      // Most recent first
      expect(new Date(logs[0].timestamp) >= new Date(logs[1].timestamp)).toBe(true)
    })
  })
})
