import { describe, test, expect, beforeAll, beforeEach, afterAll } from '@jest/globals'
import Fastify from 'fastify'
import sensible from '@fastify/sensible'
import Database from 'better-sqlite3'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { randomUUID } from 'crypto'
import eventRoutes from '../routes.js'
import { EventService } from '../service.js'
import { EventRepository } from '../repository.js'
import { AuditLogger } from '../../../utils/audit-logger.js'

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

describe('Event Routes Integration Tests', () => {
  let app
  let db
  let currentUser

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

    // Mock audit logger
    const auditLogger = new AuditLogger(db)
    app.decorate('auditLogger', auditLogger)

    // Default to talent user (can create/update events)
    currentUser = {
      id: 'talent-id',
      email: 'talent@example.com',
      name: 'Talent User',
      role: 'talent',
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
    const eventRepository = new EventRepository(db)
    const eventService = new EventService(db, auditLogger)
    eventService.repository = eventRepository

    // Register routes
    await app.register(eventRoutes, {
      prefix: '/api/events',
      service: eventService,
    })
  })

  afterAll(async () => {
    await app.close()
    db.close()
  })

  beforeEach(() => {
    // Clear tables
    db.prepare('DELETE FROM interview_events').run()
    db.prepare('DELETE FROM interviewers').run()

    // Insert test interviewer (required for foreign key)
    db.prepare(`
      INSERT INTO interviewers (id, email, name, role, skills, is_active, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `).run('int-1', 'interviewer@example.com', 'Test Interviewer', 'talent', '[]', 1)

    // Reset to talent user
    currentUser = {
      id: 'talent-id',
      email: 'talent@example.com',
      name: 'Talent User',
      role: 'talent',
    }
  })

  describe('GET /api/events', () => {
    test('should return empty list when no events exist', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/events',
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body.data).toEqual([])
      expect(body.pagination.total).toBe(0)
    })

    test('should return list of events with pagination', async () => {
      // Insert test events
      const stmt = db.prepare(`
        INSERT INTO interview_events (
          id, interviewer_email, start_time, end_time, status, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, datetime('now'), datetime('now'))
      `)

      stmt.run('evt-1', 'interviewer@example.com', '2024-01-15T10:00:00Z', '2024-01-15T11:00:00Z', 'pending')
      stmt.run('evt-2', 'interviewer@example.com', '2024-01-16T10:00:00Z', '2024-01-16T11:00:00Z', 'attended')

      const response = await app.inject({
        method: 'GET',
        url: '/api/events',
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body.data).toHaveLength(2)
      expect(body.pagination.total).toBe(2)
    })

    test('should filter events by status', async () => {
      const stmt = db.prepare(`
        INSERT INTO interview_events (
          id, interviewer_email, start_time, end_time, status, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, datetime('now'), datetime('now'))
      `)

      stmt.run('evt-1', 'interviewer@example.com', '2024-01-15T10:00:00Z', '2024-01-15T11:00:00Z', 'pending')
      stmt.run('evt-2', 'interviewer@example.com', '2024-01-16T10:00:00Z', '2024-01-16T11:00:00Z', 'attended')

      const response = await app.inject({
        method: 'GET',
        url: '/api/events?status=attended',
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body.data).toHaveLength(1)
      expect(body.data[0].status).toBe('attended')
    })

    test('should filter events by interviewer_email', async () => {
      // Insert second interviewer
      db.prepare(`
        INSERT INTO interviewers (id, email, name, role, skills, is_active, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
      `).run('int-2', 'other@example.com', 'Other Interviewer', 'talent', '[]', 1)

      const stmt = db.prepare(`
        INSERT INTO interview_events (
          id, interviewer_email, start_time, end_time, status, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, datetime('now'), datetime('now'))
      `)

      stmt.run('evt-1', 'interviewer@example.com', '2024-01-15T10:00:00Z', '2024-01-15T11:00:00Z', 'pending')
      stmt.run('evt-2', 'other@example.com', '2024-01-16T10:00:00Z', '2024-01-16T11:00:00Z', 'attended')

      const response = await app.inject({
        method: 'GET',
        url: '/api/events?interviewer_email=interviewer@example.com',
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body.data).toHaveLength(1)
      expect(body.data[0].interviewer_email).toBe('interviewer@example.com')
    })

    test('should support pagination', async () => {
      const stmt = db.prepare(`
        INSERT INTO interview_events (
          id, interviewer_email, start_time, end_time, status, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, datetime('now'), datetime('now'))
      `)

      for (let i = 1; i <= 5; i++) {
        stmt.run(`evt-${i}`, 'interviewer@example.com', `2024-01-${10 + i}T10:00:00Z`, `2024-01-${10 + i}T11:00:00Z`, 'pending')
      }

      const response = await app.inject({
        method: 'GET',
        url: '/api/events?limit=2&offset=1',
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body.data).toHaveLength(2)
      expect(body.pagination.limit).toBe(2)
      expect(body.pagination.offset).toBe(1)
      expect(body.pagination.hasMore).toBe(true)
    })

    test('should return 400 for invalid query parameters', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/events?limit=invalid',
      })

      expect(response.statusCode).toBe(400)
    })
  })

  describe('GET /api/events/stats', () => {
    test('should return statistics by status', async () => {
      const stmt = db.prepare(`
        INSERT INTO interview_events (
          id, interviewer_email, start_time, end_time, status, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, datetime('now'), datetime('now'))
      `)

      stmt.run('evt-1', 'interviewer@example.com', '2024-01-15T10:00:00Z', '2024-01-15T11:00:00Z', 'pending')
      stmt.run('evt-2', 'interviewer@example.com', '2024-01-16T10:00:00Z', '2024-01-16T11:00:00Z', 'pending')
      stmt.run('evt-3', 'interviewer@example.com', '2024-01-17T10:00:00Z', '2024-01-17T11:00:00Z', 'attended')

      const response = await app.inject({
        method: 'GET',
        url: '/api/events/stats',
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body.pending).toBe(2)
      expect(body.attended).toBe(1)
    })

    test('should return empty object when no events', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/events/stats',
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body).toEqual({})
    })
  })

  describe('GET /api/events/:id', () => {
    test('should return event by ID', async () => {
      const eventId = randomUUID()

      db.prepare(`
        INSERT INTO interview_events (
          id, interviewer_email, start_time, end_time, status, candidate_name, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
      `).run(eventId, 'interviewer@example.com', '2024-01-15T10:00:00Z', '2024-01-15T11:00:00Z', 'pending', 'Alice Smith')

      const response = await app.inject({
        method: 'GET',
        url: `/api/events/${eventId}`,
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body.id).toBe(eventId)
      expect(body.candidate_name).toBe('Alice Smith')
    })

    test('should return 404 when event not found', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/api/events/${randomUUID()}`,
      })

      expect(response.statusCode).toBe(404)
      const body = JSON.parse(response.body)
      expect(body.error).toBe('Not Found')
    })
  })

  describe('POST /api/events', () => {
    test('should create event with valid data', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/events',
        payload: {
          interviewer_email: 'interviewer@example.com',
          start_time: '2024-01-15T10:00:00Z',
          end_time: '2024-01-15T11:00:00Z',
          candidate_name: 'Alice Smith',
          position: 'Backend Engineer',
          status: 'pending'
        },
      })

      expect(response.statusCode).toBe(201)
      const body = JSON.parse(response.body)
      expect(body.id).toBeDefined()
      expect(body.candidate_name).toBe('Alice Smith')
    })

    test('should return 400 for invalid time range', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/events',
        payload: {
          interviewer_email: 'interviewer@example.com',
          start_time: '2024-01-15T11:00:00Z',
          end_time: '2024-01-15T10:00:00Z', // End before start
        },
      })

      expect(response.statusCode).toBe(400)
      const body = JSON.parse(response.body)
      expect(body.error).toBe('Bad Request')
    })

    test('should return 400 for missing required fields', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/events',
        payload: {
          candidate_name: 'Alice Smith',
        },
      })

      expect(response.statusCode).toBe(400)
    })

    test('should return 403 for viewer role', async () => {
      currentUser = {
        id: 'viewer-id',
        email: 'viewer@example.com',
        name: 'Viewer User',
        role: 'viewer',
      }

      const response = await app.inject({
        method: 'POST',
        url: '/api/events',
        payload: {
          interviewer_email: 'interviewer@example.com',
          start_time: '2024-01-15T10:00:00Z',
          end_time: '2024-01-15T11:00:00Z',
        },
      })

      expect(response.statusCode).toBe(403)
    })
  })

  describe('PUT /api/events/:id', () => {
    test('should update event with valid data', async () => {
      const eventId = randomUUID()

      // Create event
      db.prepare(`
        INSERT INTO interview_events (
          id, interviewer_email, start_time, end_time, status, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, datetime('now'), datetime('now'))
      `).run(eventId, 'interviewer@example.com', '2024-01-15T10:00:00Z', '2024-01-15T11:00:00Z', 'pending')

      const response = await app.inject({
        method: 'PUT',
        url: `/api/events/${eventId}`,
        payload: {
          status: 'attended',
          candidate_name: 'Bob Jones'
        },
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body.status).toBe('attended')
      expect(body.candidate_name).toBe('Bob Jones')
    })

    test('should return 404 when event not found', async () => {
      const response = await app.inject({
        method: 'PUT',
        url: `/api/events/${randomUUID()}`,
        payload: {
          status: 'attended'
        },
      })

      expect(response.statusCode).toBe(404)
      const body = JSON.parse(response.body)
      expect(body.error).toBe('Not Found')
    })

    test('should return 400 for invalid time range', async () => {
      const eventId = randomUUID()

      db.prepare(`
        INSERT INTO interview_events (
          id, interviewer_email, start_time, end_time, status, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, datetime('now'), datetime('now'))
      `).run(eventId, 'interviewer@example.com', '2024-01-15T10:00:00Z', '2024-01-15T11:00:00Z', 'pending')

      const response = await app.inject({
        method: 'PUT',
        url: `/api/events/${eventId}`,
        payload: {
          start_time: '2024-01-15T11:00:00Z',
          end_time: '2024-01-15T10:00:00Z'
        },
      })

      expect(response.statusCode).toBe(400)
    })

    test('should return 403 for viewer role', async () => {
      currentUser = {
        id: 'viewer-id',
        email: 'viewer@example.com',
        name: 'Viewer User',
        role: 'viewer',
      }

      const eventId = randomUUID()

      db.prepare(`
        INSERT INTO interview_events (
          id, interviewer_email, start_time, end_time, status, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, datetime('now'), datetime('now'))
      `).run(eventId, 'interviewer@example.com', '2024-01-15T10:00:00Z', '2024-01-15T11:00:00Z', 'pending')

      const response = await app.inject({
        method: 'PUT',
        url: `/api/events/${eventId}`,
        payload: {
          status: 'attended'
        },
      })

      expect(response.statusCode).toBe(403)
    })
  })

  describe('DELETE /api/events/:id', () => {
    test('should delete event (admin only)', async () => {
      // Set admin user
      currentUser = {
        id: 'admin-id',
        email: 'admin@example.com',
        name: 'Admin User',
        role: 'admin',
      }

      const eventId = randomUUID()

      db.prepare(`
        INSERT INTO interview_events (
          id, interviewer_email, start_time, end_time, status, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, datetime('now'), datetime('now'))
      `).run(eventId, 'interviewer@example.com', '2024-01-15T10:00:00Z', '2024-01-15T11:00:00Z', 'pending')

      const response = await app.inject({
        method: 'DELETE',
        url: `/api/events/${eventId}`,
      })

      expect(response.statusCode).toBe(204)

      // Verify deleted
      const event = db.prepare('SELECT * FROM interview_events WHERE id = ?').get(eventId)
      expect(event).toBeUndefined()
    })

    test('should return 404 when event not found', async () => {
      currentUser = {
        id: 'admin-id',
        email: 'admin@example.com',
        name: 'Admin User',
        role: 'admin',
      }

      const response = await app.inject({
        method: 'DELETE',
        url: `/api/events/${randomUUID()}`,
      })

      expect(response.statusCode).toBe(404)
    })

    test('should return 403 for talent role', async () => {
      // Talent user (not admin)
      currentUser = {
        id: 'talent-id',
        email: 'talent@example.com',
        name: 'Talent User',
        role: 'talent',
      }

      const eventId = randomUUID()

      db.prepare(`
        INSERT INTO interview_events (
          id, interviewer_email, start_time, end_time, status, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, datetime('now'), datetime('now'))
      `).run(eventId, 'interviewer@example.com', '2024-01-15T10:00:00Z', '2024-01-15T11:00:00Z', 'pending')

      const response = await app.inject({
        method: 'DELETE',
        url: `/api/events/${eventId}`,
      })

      expect(response.statusCode).toBe(403)
    })
  })

  describe('Contract Tests', () => {
    test('should return event fields with correct types', async () => {
      const eventId = randomUUID()

      db.prepare(`
        INSERT INTO interview_events (
          id, interviewer_email, start_time, end_time, status, candidate_name, position, skills_assessed, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
      `).run(
        eventId,
        'interviewer@example.com',
        '2024-01-15T10:00:00Z',
        '2024-01-15T11:00:00Z',
        'pending',
        'Alice Smith',
        'Backend Engineer',
        '["JavaScript","Python"]'
      )

      const response = await app.inject({
        method: 'GET',
        url: `/api/events/${eventId}`,
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(typeof body.id).toBe('string')
      expect(typeof body.interviewer_email).toBe('string')
      expect(typeof body.start_time).toBe('string')
      expect(typeof body.end_time).toBe('string')
      expect(typeof body.status).toBe('string')
      expect(Array.isArray(body.skills_assessed)).toBe(true)
    })

    test('should return pagination metadata with correct types', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/events',
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(Array.isArray(body.data)).toBe(true)
      expect(typeof body.pagination).toBe('object')
      expect(typeof body.pagination.total).toBe('number')
      expect(typeof body.pagination.hasMore).toBe('boolean')
    })
  })
})
