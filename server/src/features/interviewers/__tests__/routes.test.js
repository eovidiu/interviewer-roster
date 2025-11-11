import { describe, test, expect, beforeAll, afterAll, beforeEach } from '@jest/globals'
import Fastify from 'fastify'
import sensible from '@fastify/sensible'
import Database from 'better-sqlite3'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import interviewersRoutes from '../routes.js'
import { InterviewerService } from '../service.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

describe('Interviewers API Routes', () => {
  let app
  let db

  beforeAll(async () => {
    // Create in-memory database
    db = new Database(':memory:')

    // Run migrations
    const migrationsDir = path.join(__dirname, '../../../db/migrations')
    const migration001 = fs.readFileSync(path.join(migrationsDir, '001_initial.sql'), 'utf-8')
    const migration002 = fs.readFileSync(path.join(migrationsDir, '002_add_user_fields.sql'), 'utf-8')
    const migration003 = fs.readFileSync(path.join(migrationsDir, '003_add_interviewer_team_fields.sql'), 'utf-8')

    db.exec(migration001)
    db.exec(migration002)
    db.exec(migration003)

    // Create minimal Fastify app for testing
    app = Fastify({ logger: false })

    // Register sensible plugin for reply helpers (notFound, conflict, etc.)
    await app.register(sensible)

    // Decorate with database instance
    app.decorate('db', db)

    // Mock authentication decorator
    app.decorate('authenticate', async (request, reply) => {
      // Allow all requests in tests
      request.user = { email: 'test@example.com', role: 'admin' }
    })

    // Mock authorization decorator
    app.decorate('authorize', (allowedRoles) => {
      return async (request, reply) => {
        // Set mock user
        request.user = { email: 'test@example.com', role: 'admin' }
      }
    })

    // Create mock audit logger
    const auditLogger = {
      log: () => {}
    }

    // Create service
    const service = new InterviewerService(db, auditLogger)

    // Register routes with service
    await app.register(interviewersRoutes, { prefix: '/api/interviewers', service })

    await app.ready()
  })

  afterAll(async () => {
    db.close()
    await app.close()
  })

  beforeEach(() => {
    // Clear interviewers before each test
    db.prepare('DELETE FROM interviewers').run()
  })

  describe('GET /api/interviewers', () => {
    test('should return 200 with empty list when no interviewers', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/interviewers'
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body.data).toEqual([])
      expect(body.pagination).toBeDefined()
    })

    test('should return 200 with list of interviewers', async () => {
      // Insert test data
      db.prepare(`
        INSERT INTO interviewers (id, name, email, role, skills, is_active, created_at, updated_at)
        VALUES
          ('1', 'Alice', 'alice@example.com', 'talent', '[]', 1, datetime('now'), datetime('now')),
          ('2', 'Bob', 'bob@example.com', 'admin', '[]', 1, datetime('now'), datetime('now'))
      `).run()

      const response = await app.inject({
        method: 'GET',
        url: '/api/interviewers'
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body.data).toHaveLength(2)
      expect(body.data[0].name).toBe('Alice')
      expect(body.data[1].name).toBe('Bob')
    })

    test('should filter by role', async () => {
      db.prepare(`
        INSERT INTO interviewers (id, name, email, role, skills, is_active, created_at, updated_at)
        VALUES
          ('1', 'Alice', 'alice@example.com', 'talent', '[]', 1, datetime('now'), datetime('now')),
          ('2', 'Bob', 'bob@example.com', 'admin', '[]', 1, datetime('now'), datetime('now'))
      `).run()

      const response = await app.inject({
        method: 'GET',
        url: '/api/interviewers?role=talent'
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body.data).toHaveLength(1)
      expect(body.data[0].role).toBe('talent')
    })

    test('should filter by Migration 003 org field', async () => {
      db.prepare(`
        INSERT INTO interviewers (id, name, email, role, skills, is_active, org, created_at, updated_at)
        VALUES
          ('1', 'TeamA Member', 'teama@example.com', 'talent', '[]', 1, 'TeamA', datetime('now'), datetime('now')),
          ('2', 'TeamB Member', 'teamb@example.com', 'talent', '[]', 1, 'TeamB', datetime('now'), datetime('now'))
      `).run()

      const response = await app.inject({
        method: 'GET',
        url: '/api/interviewers?org=TeamA'
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body.data).toHaveLength(1)
      expect(body.data[0].org).toBe('TeamA')
    })

    test('should filter by Migration 003 profile_backend field', async () => {
      db.prepare(`
        INSERT INTO interviewers (id, name, email, role, skills, is_active, profile_backend, created_at, updated_at)
        VALUES
          ('1', 'Backend Dev', 'backend@example.com', 'talent', '[]', 1, 1, datetime('now'), datetime('now')),
          ('2', 'Frontend Dev', 'frontend@example.com', 'talent', '[]', 1, 0, datetime('now'), datetime('now'))
      `).run()

      const response = await app.inject({
        method: 'GET',
        url: '/api/interviewers?profile_backend=true'
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body.data).toHaveLength(1)
      expect(body.data[0].profile_backend).toBe(true)
    })

    test('should filter by Migration 003 onboarding_completed field', async () => {
      db.prepare(`
        INSERT INTO interviewers (id, name, email, role, skills, is_active, onboarding_completed, created_at, updated_at)
        VALUES
          ('1', 'Onboarded', 'onboarded@example.com', 'talent', '[]', 1, 1, datetime('now'), datetime('now')),
          ('2', 'Pending', 'pending@example.com', 'talent', '[]', 1, 0, datetime('now'), datetime('now'))
      `).run()

      const response = await app.inject({
        method: 'GET',
        url: '/api/interviewers?onboarding_completed=true'
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body.data).toHaveLength(1)
      expect(body.data[0].onboarding_completed).toBe(true)
    })

    test('should support pagination', async () => {
      // Insert 5 interviewers
      for (let i = 1; i <= 5; i++) {
        db.prepare(`
          INSERT INTO interviewers (id, name, email, role, skills, is_active, created_at, updated_at)
          VALUES (?, ?, ?, 'talent', '[]', 1, datetime('now'), datetime('now'))
        `).run(`${i}`, `User ${i}`, `user${i}@example.com`)
      }

      const response = await app.inject({
        method: 'GET',
        url: '/api/interviewers?limit=2&offset=0'
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body.data).toHaveLength(2)
      expect(body.pagination.total).toBe(5)
      expect(body.pagination.hasMore).toBe(true)
    })

    test('should return 400 for invalid query parameters', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/interviewers?limit=invalid'
      })

      expect(response.statusCode).toBe(400)
    })
  })

  describe('POST /api/interviewers', () => {
    test('should create interviewer with valid data', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/interviewers',
        payload: {
          name: 'New User',
          email: 'newuser@example.com',
          role: 'talent',
          skills: ['JavaScript'],
          is_active: true
        }
      })

      expect(response.statusCode).toBe(201)
      const body = JSON.parse(response.body)
      expect(body.id).toBeDefined()
      expect(body.name).toBe('New User')
      expect(body.email).toBe('newuser@example.com')
    })

    test('should create interviewer with all Migration 003 fields', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/interviewers',
        payload: {
          name: 'Full Stack Dev',
          email: 'fullstack@example.com',
          role: 'talent',
          skills: ['JavaScript', 'Python'],
          is_active: true,
          // Migration 003 fields
          org: 'TeamA',
          manager: 'Alice Manager',
          check_manager: true,
          date_in: '2024-01-15',
          profile_backend: true,
          profile_frontend: true,
          profile_fullstack: true,
          profile_sre: false,
          profile_big_data: false,
          profile_cse: false,
          profile_ml: false,
          profile_em: false,
          max_level: 50,
          check_level: 'ESEP40',
          pause_until: null,
          is_shadowing: false,
          onboarding_completed: true,
          is_remote: true
        }
      })

      expect(response.statusCode).toBe(201)
      const body = JSON.parse(response.body)
      expect(body.org).toBe('TeamA')
      expect(body.manager).toBe('Alice Manager')
      expect(body.check_manager).toBe(true)
      expect(body.profile_backend).toBe(true)
      expect(body.max_level).toBe(50)
      expect(body.onboarding_completed).toBe(true)
      expect(body.is_remote).toBe(true)
    })

    test('should return 400 for missing required fields', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/interviewers',
        payload: {
          email: 'noname@example.com'
        }
      })

      expect(response.statusCode).toBe(400)
    })

    test('should return 400 for invalid email format', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/interviewers',
        payload: {
          name: 'Test User',
          email: 'invalid-email',
          role: 'talent',
          skills: []
        }
      })

      expect(response.statusCode).toBe(400)
    })

    test('should return 409 for duplicate email', async () => {
      // Create first interviewer
      await app.inject({
        method: 'POST',
        url: '/api/interviewers',
        payload: {
          name: 'First User',
          email: 'duplicate@example.com',
          role: 'talent',
          skills: []
        }
      })

      // Try to create duplicate
      const response = await app.inject({
        method: 'POST',
        url: '/api/interviewers',
        payload: {
          name: 'Second User',
          email: 'duplicate@example.com',
          role: 'talent',
          skills: []
        }
      })

      expect(response.statusCode).toBe(409)
    })
  })

  describe('GET /api/interviewers/:id', () => {
    test('should return 200 with interviewer data', async () => {
      db.prepare(`
        INSERT INTO interviewers (id, name, email, role, skills, is_active, created_at, updated_at)
        VALUES ('test-id', 'Test User', 'test@example.com', 'talent', '[]', 1, datetime('now'), datetime('now'))
      `).run()

      const response = await app.inject({
        method: 'GET',
        url: '/api/interviewers/test-id'
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body.id).toBe('test-id')
      expect(body.name).toBe('Test User')
    })

    test('should return 404 for non-existent interviewer', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/interviewers/non-existent'
      })

      expect(response.statusCode).toBe(404)
    })

    test('should return interviewer with all Migration 003 fields', async () => {
      db.prepare(`
        INSERT INTO interviewers (
          id, name, email, role, skills, is_active,
          org, manager, check_manager, profile_backend, max_level, onboarding_completed,
          created_at, updated_at
        ) VALUES (
          'mig-003-id', 'Migration 003 User', 'mig003@example.com', 'talent', '[]', 1,
          'TeamA', 'Alice', 1, 1, 50, 1,
          datetime('now'), datetime('now')
        )
      `).run()

      const response = await app.inject({
        method: 'GET',
        url: '/api/interviewers/mig-003-id'
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body.org).toBe('TeamA')
      expect(body.manager).toBe('Alice')
      expect(body.check_manager).toBe(true)
      expect(body.profile_backend).toBe(true)
      expect(body.max_level).toBe(50)
      expect(body.onboarding_completed).toBe(true)
    })
  })

  describe('PUT /api/interviewers/:id', () => {
    test('should update interviewer with valid data', async () => {
      db.prepare(`
        INSERT INTO interviewers (id, name, email, role, skills, is_active, created_at, updated_at)
        VALUES ('update-id', 'Old Name', 'old@example.com', 'talent', '[]', 1, datetime('now'), datetime('now'))
      `).run()

      const response = await app.inject({
        method: 'PUT',
        url: '/api/interviewers/update-id',
        payload: {
          name: 'New Name',
          email: 'new@example.com'
        }
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body.name).toBe('New Name')
      expect(body.email).toBe('new@example.com')
    })

    test('should update Migration 003 fields', async () => {
      db.prepare(`
        INSERT INTO interviewers (id, name, email, role, skills, is_active, org, max_level, created_at, updated_at)
        VALUES ('update-mig', 'User', 'user@example.com', 'talent', '[]', 1, 'TeamA', 30, datetime('now'), datetime('now'))
      `).run()

      const response = await app.inject({
        method: 'PUT',
        url: '/api/interviewers/update-mig',
        payload: {
          org: 'TeamB',
          max_level: 50,
          profile_backend: true,
          onboarding_completed: true
        }
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body.org).toBe('TeamB')
      expect(body.max_level).toBe(50)
      expect(body.profile_backend).toBe(true)
      expect(body.onboarding_completed).toBe(true)
    })

    test('should return 404 for non-existent interviewer', async () => {
      const response = await app.inject({
        method: 'PUT',
        url: '/api/interviewers/non-existent',
        payload: {
          name: 'New Name'
        }
      })

      expect(response.statusCode).toBe(404)
    })

    test('should return 400 for invalid data', async () => {
      db.prepare(`
        INSERT INTO interviewers (id, name, email, role, skills, is_active, created_at, updated_at)
        VALUES ('invalid-update', 'User', 'user@example.com', 'talent', '[]', 1, datetime('now'), datetime('now'))
      `).run()

      const response = await app.inject({
        method: 'PUT',
        url: '/api/interviewers/invalid-update',
        payload: {
          email: 'invalid-email'
        }
      })

      expect(response.statusCode).toBe(400)
    })
  })

  describe('DELETE /api/interviewers/:id', () => {
    test('should delete interviewer', async () => {
      db.prepare(`
        INSERT INTO interviewers (id, name, email, role, skills, is_active, created_at, updated_at)
        VALUES ('delete-id', 'Delete Me', 'delete@example.com', 'talent', '[]', 1, datetime('now'), datetime('now'))
      `).run()

      const response = await app.inject({
        method: 'DELETE',
        url: '/api/interviewers/delete-id'
      })

      expect(response.statusCode).toBe(204)

      // Verify deletion
      const checkResponse = await app.inject({
        method: 'GET',
        url: '/api/interviewers/delete-id'
      })
      expect(checkResponse.statusCode).toBe(404)
    })

    test('should return 404 for non-existent interviewer', async () => {
      const response = await app.inject({
        method: 'DELETE',
        url: '/api/interviewers/non-existent'
      })

      expect(response.statusCode).toBe(404)
    })
  })

  describe('Response Type Validation (Contract Tests)', () => {
    test('should return booleans as JS booleans, not integers', async () => {
      db.prepare(`
        INSERT INTO interviewers (
          id, name, email, role, skills, is_active, profile_backend, onboarding_completed,
          created_at, updated_at
        ) VALUES (
          'contract-test', 'Contract Test', 'contract@example.com', 'talent', '[]', 1, 1, 1,
          datetime('now'), datetime('now')
        )
      `).run()

      const response = await app.inject({
        method: 'GET',
        url: '/api/interviewers/contract-test'
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)

      // Contract test: ensure booleans are actual booleans
      expect(typeof body.is_active).toBe('boolean')
      expect(typeof body.profile_backend).toBe('boolean')
      expect(typeof body.onboarding_completed).toBe('boolean')

      expect(body.is_active).toBe(true)
      expect(body.profile_backend).toBe(true)
      expect(body.onboarding_completed).toBe(true)
    })

    test('should return skills as array, not JSON string', async () => {
      db.prepare(`
        INSERT INTO interviewers (id, name, email, role, skills, is_active, created_at, updated_at)
        VALUES ('array-test', 'Array Test', 'array@example.com', 'talent', '["JavaScript","Python"]', 1, datetime('now'), datetime('now'))
      `).run()

      const response = await app.inject({
        method: 'GET',
        url: '/api/interviewers/array-test'
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)

      // Contract test: ensure skills is an array
      expect(Array.isArray(body.skills)).toBe(true)
      expect(body.skills).toEqual(['JavaScript', 'Python'])
    })
  })
})
