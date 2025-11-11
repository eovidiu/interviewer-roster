import { describe, test, expect, beforeAll, beforeEach, afterAll } from '@jest/globals'
import Fastify from 'fastify'
import sensible from '@fastify/sensible'
import Database from 'better-sqlite3'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { randomUUID } from 'crypto'
import auditLogRoutes from '../routes.js'
import { AuditLogService } from '../service.js'
import { AuditLogRepository } from '../repository.js'

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

describe('Audit Log Routes Integration Tests', () => {
  let app
  let db
  let currentUser // Shared user for auth decorators

  beforeAll(async () => {
    // Create in-memory database
    db = new Database(':memory:')

    // Run all migrations
    db.exec(migration001)
    db.exec(migration002)
    db.exec(migration003)

    // Create Fastify app
    app = Fastify({ logger: false })

    // Register sensible plugin
    await app.register(sensible)

    // Decorate with database
    app.decorate('db', db)

    // Default to admin user
    currentUser = {
      id: 'admin-id',
      email: 'admin@example.com',
      name: 'Admin User',
      role: 'admin',
    }

    // Mock authenticate decorator
    app.decorate('authenticate', async (request, reply) => {
      request.user = currentUser
    })

    // Mock authorize decorator
    app.decorate('authorize', (allowedRoles) => {
      return async (request, reply) => {
        request.user = currentUser
        if (!allowedRoles.includes(currentUser.role)) {
          reply.code(403).send({ error: 'Forbidden' })
        }
      }
    })

    // Create service
    const auditLogRepository = new AuditLogRepository(db)
    const auditLogService = new AuditLogService(db)
    auditLogService.repository = auditLogRepository

    // Register routes
    await app.register(auditLogRoutes, {
      prefix: '/api/audit-logs',
      service: auditLogService,
    })
  })

  afterAll(async () => {
    await app.close()
    db.close()
  })

  beforeEach(() => {
    // Clear audit_logs table
    db.prepare('DELETE FROM audit_logs').run()

    // Reset to admin user
    currentUser = {
      id: 'admin-id',
      email: 'admin@example.com',
      name: 'Admin User',
      role: 'admin',
    }
  })

  describe('GET /api/audit-logs', () => {
    test('should return empty list when no logs exist', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/audit-logs',
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body.data).toEqual([])
      expect(body.pagination.total).toBe(0)
      expect(body.pagination.hasMore).toBe(false)
    })

    test('should return list of audit logs with pagination', async () => {
      // Insert test audit logs
      const stmt = db.prepare(`
        INSERT INTO audit_logs (id, user_email, user_name, action, entity_type, entity_id, changes, timestamp)
        VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
      `)

      stmt.run(
        randomUUID(),
        'admin@example.com',
        'Admin User',
        'CREATE_INTERVIEWER',
        'interviewer',
        'int-1',
        '{}'
      )
      stmt.run(
        randomUUID(),
        'admin@example.com',
        'Admin User',
        'UPDATE_EVENT',
        'event',
        'evt-1',
        '{}'
      )
      stmt.run(
        randomUUID(),
        'user@example.com',
        'Regular User',
        'CREATE_INTERVIEWER',
        'interviewer',
        'int-2',
        '{}'
      )

      const response = await app.inject({
        method: 'GET',
        url: '/api/audit-logs',
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body.data).toHaveLength(3)
      expect(body.pagination.total).toBe(3)
      expect(body.pagination.hasMore).toBe(false)
    })

    test('should support pagination with limit and offset', async () => {
      // Insert test audit logs
      const stmt = db.prepare(`
        INSERT INTO audit_logs (id, user_email, user_name, action, entity_type, entity_id, changes, timestamp)
        VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
      `)

      for (let i = 1; i <= 5; i++) {
        stmt.run(
          randomUUID(),
          'admin@example.com',
          'Admin User',
          'CREATE_INTERVIEWER',
          'interviewer',
          `int-${i}`,
          '{}'
        )
      }

      const response = await app.inject({
        method: 'GET',
        url: '/api/audit-logs?limit=2&offset=1',
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body.data).toHaveLength(2)
      expect(body.pagination.total).toBe(5)
      expect(body.pagination.limit).toBe(2)
      expect(body.pagination.offset).toBe(1)
      expect(body.pagination.hasMore).toBe(true)
    })

    test('should filter logs by action', async () => {
      // Insert test audit logs
      const stmt = db.prepare(`
        INSERT INTO audit_logs (id, user_email, user_name, action, entity_type, entity_id, changes, timestamp)
        VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
      `)

      stmt.run(
        randomUUID(),
        'admin@example.com',
        'Admin',
        'CREATE_INTERVIEWER',
        'interviewer',
        'int-1',
        '{}'
      )
      stmt.run(
        randomUUID(),
        'admin@example.com',
        'Admin',
        'DELETE_EVENT',
        'event',
        'evt-1',
        '{}'
      )

      const response = await app.inject({
        method: 'GET',
        url: '/api/audit-logs?action=DELETE_EVENT',
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body.data).toHaveLength(1)
      expect(body.data[0].action).toBe('DELETE_EVENT')
    })

    test('should filter logs by entity_type', async () => {
      // Insert test audit logs
      const stmt = db.prepare(`
        INSERT INTO audit_logs (id, user_email, user_name, action, entity_type, entity_id, changes, timestamp)
        VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
      `)

      stmt.run(
        randomUUID(),
        'admin@example.com',
        'Admin',
        'CREATE_INTERVIEWER',
        'interviewer',
        'int-1',
        '{}'
      )
      stmt.run(
        randomUUID(),
        'admin@example.com',
        'Admin',
        'CREATE_EVENT',
        'event',
        'evt-1',
        '{}'
      )

      const response = await app.inject({
        method: 'GET',
        url: '/api/audit-logs?entity_type=interviewer',
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body.data).toHaveLength(1)
      expect(body.data[0].entity_type).toBe('interviewer')
    })

    test('should non-admin users only see their own logs', async () => {
      // Insert test audit logs
      const stmt = db.prepare(`
        INSERT INTO audit_logs (id, user_email, user_name, action, entity_type, entity_id, changes, timestamp)
        VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
      `)

      stmt.run(
        randomUUID(),
        'admin@example.com',
        'Admin User',
        'CREATE_INTERVIEWER',
        'interviewer',
        'int-1',
        '{}'
      )
      stmt.run(
        randomUUID(),
        'user@example.com',
        'Regular User',
        'CREATE_EVENT',
        'event',
        'evt-1',
        '{}'
      )

      // Set non-admin user
      currentUser = {
        id: 'user-id',
        email: 'user@example.com',
        name: 'Regular User',
        role: 'talent',
      }

      const response = await app.inject({
        method: 'GET',
        url: '/api/audit-logs',
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body.data).toHaveLength(1)
      expect(body.data[0].user_email).toBe('user@example.com')
    })

    test('should return 400 for invalid query parameters', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/audit-logs?limit=invalid',
      })

      expect(response.statusCode).toBe(400)
    })
  })

  describe('GET /api/audit-logs/stats', () => {
    test('should return statistics by action', async () => {
      // Insert test audit logs
      const stmt = db.prepare(`
        INSERT INTO audit_logs (id, user_email, user_name, action, entity_type, entity_id, changes, timestamp)
        VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
      `)

      stmt.run(
        randomUUID(),
        'admin@example.com',
        'Admin',
        'CREATE_INTERVIEWER',
        'interviewer',
        'int-1',
        '{}'
      )
      stmt.run(
        randomUUID(),
        'admin@example.com',
        'Admin',
        'CREATE_INTERVIEWER',
        'interviewer',
        'int-2',
        '{}'
      )
      stmt.run(
        randomUUID(),
        'admin@example.com',
        'Admin',
        'DELETE_EVENT',
        'event',
        'evt-1',
        '{}'
      )

      const response = await app.inject({
        method: 'GET',
        url: '/api/audit-logs/stats',
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body.CREATE_INTERVIEWER).toBe(2)
      expect(body.DELETE_EVENT).toBe(1)
    })

    test('should return empty object when no logs exist', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/audit-logs/stats',
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body).toEqual({})
    })

    test('should return 403 for non-admin users', async () => {
      // Set non-admin user
      currentUser = {
        id: 'user-id',
        email: 'user@example.com',
        name: 'Regular User',
        role: 'talent',
      }

      const response = await app.inject({
        method: 'GET',
        url: '/api/audit-logs/stats',
      })

      expect(response.statusCode).toBe(403)
    })
  })

  describe('GET /api/audit-logs/recent', () => {
    test('should return recent logs with default limit', async () => {
      // Insert test audit logs
      const stmt = db.prepare(`
        INSERT INTO audit_logs (id, user_email, user_name, action, entity_type, entity_id, changes, timestamp)
        VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
      `)

      for (let i = 1; i <= 3; i++) {
        stmt.run(
          randomUUID(),
          'admin@example.com',
          'Admin',
          'CREATE_INTERVIEWER',
          'interviewer',
          `int-${i}`,
          '{}'
        )
      }

      const response = await app.inject({
        method: 'GET',
        url: '/api/audit-logs/recent',
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(Array.isArray(body)).toBe(true)
      expect(body.length).toBe(3)
    })

    test('should respect custom limit', async () => {
      // Insert test audit logs
      const stmt = db.prepare(`
        INSERT INTO audit_logs (id, user_email, user_name, action, entity_type, entity_id, changes, timestamp)
        VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
      `)

      for (let i = 1; i <= 10; i++) {
        stmt.run(
          randomUUID(),
          'admin@example.com',
          'Admin',
          'CREATE_INTERVIEWER',
          'interviewer',
          `int-${i}`,
          '{}'
        )
      }

      const response = await app.inject({
        method: 'GET',
        url: '/api/audit-logs/recent?limit=5',
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body.length).toBe(5)
    })

    test('should return 403 for non-admin users', async () => {
      // Set non-admin user
      currentUser = {
        id: 'user-id',
        email: 'user@example.com',
        name: 'Regular User',
        role: 'viewer',
      }

      const response = await app.inject({
        method: 'GET',
        url: '/api/audit-logs/recent',
      })

      expect(response.statusCode).toBe(403)
    })

    test('should return 400 for invalid limit', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/audit-logs/recent?limit=invalid',
      })

      expect(response.statusCode).toBe(400)
    })
  })

  describe('GET /api/audit-logs/:id', () => {
    test('should return audit log by ID', async () => {
      const logId = randomUUID()

      // Insert test audit log
      db.prepare(`
        INSERT INTO audit_logs (id, user_email, user_name, action, entity_type, entity_id, changes, timestamp)
        VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
      `).run(
        logId,
        'admin@example.com',
        'Admin User',
        'CREATE_INTERVIEWER',
        'interviewer',
        'int-1',
        '{"created": true}'
      )

      const response = await app.inject({
        method: 'GET',
        url: `/api/audit-logs/${logId}`,
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body.id).toBe(logId)
      expect(body.action).toBe('CREATE_INTERVIEWER')
      expect(body.user_email).toBe('admin@example.com')
    })

    test('should return 404 when log not found', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/api/audit-logs/${randomUUID()}`,
      })

      expect(response.statusCode).toBe(404)
      const body = JSON.parse(response.body)
      expect(body.error).toBe('Not Found')
      expect(body.message).toBe('Audit log not found')
    })

    test('should allow non-admin users to view their own logs', async () => {
      const logId = randomUUID()

      // Insert test audit log
      db.prepare(`
        INSERT INTO audit_logs (id, user_email, user_name, action, entity_type, entity_id, changes, timestamp)
        VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
      `).run(
        logId,
        'user@example.com',
        'Regular User',
        'CREATE_EVENT',
        'event',
        'evt-1',
        '{}'
      )

      // Set non-admin user
      currentUser = {
        id: 'user-id',
        email: 'user@example.com',
        name: 'Regular User',
        role: 'talent',
      }

      const response = await app.inject({
        method: 'GET',
        url: `/api/audit-logs/${logId}`,
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body.id).toBe(logId)
      expect(body.user_email).toBe('user@example.com')
    })

    test('should return 403 when non-admin tries to view other user logs', async () => {
      const logId = randomUUID()

      // Insert test audit log from different user
      db.prepare(`
        INSERT INTO audit_logs (id, user_email, user_name, action, entity_type, entity_id, changes, timestamp)
        VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
      `).run(
        logId,
        'admin@example.com',
        'Admin User',
        'CREATE_INTERVIEWER',
        'interviewer',
        'int-1',
        '{}'
      )

      // Set non-admin user
      currentUser = {
        id: 'user-id',
        email: 'user@example.com',
        name: 'Regular User',
        role: 'talent',
      }

      const response = await app.inject({
        method: 'GET',
        url: `/api/audit-logs/${logId}`,
      })

      expect(response.statusCode).toBe(403)
      const body = JSON.parse(response.body)
      expect(body.error).toBe('Forbidden')
      expect(body.message).toBe('You can only view your own audit logs')
    })
  })

  describe('Contract Tests', () => {
    test('should return audit log fields with correct types', async () => {
      const logId = randomUUID()

      // Insert test audit log
      db.prepare(`
        INSERT INTO audit_logs (id, user_email, user_name, action, entity_type, entity_id, changes, timestamp)
        VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
      `).run(
        logId,
        'admin@example.com',
        'Admin User',
        'CREATE_INTERVIEWER',
        'interviewer',
        'int-1',
        '{"created": true}'
      )

      const response = await app.inject({
        method: 'GET',
        url: `/api/audit-logs/${logId}`,
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(typeof body.id).toBe('string')
      expect(typeof body.user_email).toBe('string')
      expect(typeof body.user_name).toBe('string')
      expect(typeof body.action).toBe('string')
      expect(typeof body.entity_type).toBe('string')
      expect(typeof body.entity_id).toBe('string')
      expect(typeof body.changes).toBe('object') // Parsed from JSON TEXT in DB
      expect(typeof body.timestamp).toBe('string')
    })

    test('should return pagination metadata with correct types', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/audit-logs',
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(Array.isArray(body.data)).toBe(true)
      expect(typeof body.pagination).toBe('object')
      expect(typeof body.pagination.total).toBe('number')
      expect(typeof body.pagination.limit).toBe('number')
      expect(typeof body.pagination.offset).toBe('number')
      expect(typeof body.pagination.hasMore).toBe('boolean')
    })
  })
})
