import Database from 'better-sqlite3'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { InterviewerRepository } from '../repository.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

describe('InterviewerRepository - Migration 003 Fields', () => {
  let db
  let repository

  beforeEach(() => {
    // Create in-memory database
    db = new Database(':memory:')

    // Apply migrations
    const migration001 = fs.readFileSync(path.join(__dirname, '../../../db/migrations/001_initial.sql'), 'utf8')
    const migration002 = fs.readFileSync(path.join(__dirname, '../../../db/migrations/002_add_user_fields.sql'), 'utf8')
    const migration003 = fs.readFileSync(path.join(__dirname, '../../../db/migrations/003_add_interviewer_team_fields.sql'), 'utf8')

    db.exec(migration001)
    db.exec(migration002)
    db.exec(migration003)

    repository = new InterviewerRepository(db)
  })

  afterEach(() => {
    db.close()
  })

  describe('create() with new fields', () => {
    test('should create interviewer with all new fields', () => {
      const data = {
        id: 'test-id-1',
        name: 'John Doe',
        email: 'john@example.com',
        role: 'talent',
        skills: ['JavaScript', 'Python'],
        is_active: true,
        calendar_sync_enabled: false,
        date_in: '2024-01-15',
        manager: 'Jane Manager',
        check_manager: true,
        org: 'TeamA',
        profile_backend: true,
        profile_big_data: false,
        profile_frontend: true,
        profile_fullstack: false,
        profile_sre: false,
        profile_cse: false,
        profile_ml: false,
        profile_em: false,
        max_level: 50,
        check_level: 'ESEP40',
        pause_until: null,
        is_shadowing: false,
        onboarding_completed: true,
        is_remote: false
      }

      const interviewer = repository.create(data, { userEmail: 'admin@example.com' })

      expect(interviewer.id).toBe('test-id-1')
      expect(interviewer.date_in).toBe('2024-01-15')
      expect(interviewer.manager).toBe('Jane Manager')
      expect(interviewer.check_manager).toBe(true)
      expect(interviewer.org).toBe('TeamA')
      expect(interviewer.profile_backend).toBe(true)
      expect(interviewer.profile_frontend).toBe(true)
      expect(interviewer.max_level).toBe(50)
      expect(interviewer.check_level).toBe('ESEP40')
      expect(interviewer.onboarding_completed).toBe(true)
      expect(interviewer.is_remote).toBe(false)
    })

    test('should create interviewer with minimal fields (new fields null/default)', () => {
      const data = {
        id: 'test-id-2',
        name: 'Jane Doe',
        email: 'jane@example.com',
        role: 'talent',
        skills: ['Java'],
        is_active: true,
        calendar_sync_enabled: false
      }

      const interviewer = repository.create(data, { userEmail: 'admin@example.com' })

      expect(interviewer.id).toBe('test-id-2')
      expect(interviewer.date_in).toBeNull()
      expect(interviewer.manager).toBeNull()
      expect(interviewer.check_manager).toBe(false)
      expect(interviewer.org).toBeNull()
      expect(interviewer.profile_backend).toBe(false)
      expect(interviewer.max_level).toBeNull()
      expect(interviewer.is_shadowing).toBe(false)
      expect(interviewer.onboarding_completed).toBe(false)
    })
  })

  describe('update() with new fields', () => {
    test('should update all new fields', () => {
      // Create interviewer
      const createData = {
        id: 'test-id-3',
        name: 'Bob Smith',
        email: 'bob@example.com',
        role: 'talent',
        skills: ['Go'],
        is_active: true,
        calendar_sync_enabled: false
      }
      repository.create(createData, { userEmail: 'admin@example.com' })

      // Update with new fields
      const updateData = {
        date_in: '2024-02-01',
        manager: 'New Manager',
        check_manager: true,
        org: 'TeamB',
        profile_backend: true,
        profile_ml: true,
        max_level: 60,
        check_level: 'ESEP50',
        pause_until: '2024-06-01',
        is_shadowing: true,
        onboarding_completed: true,
        is_remote: true
      }

      const updated = repository.update('test-id-3', updateData, { userEmail: 'admin@example.com' })

      expect(updated.date_in).toBe('2024-02-01')
      expect(updated.manager).toBe('New Manager')
      expect(updated.check_manager).toBe(true)
      expect(updated.org).toBe('TeamB')
      expect(updated.profile_backend).toBe(true)
      expect(updated.profile_ml).toBe(true)
      expect(updated.max_level).toBe(60)
      expect(updated.check_level).toBe('ESEP50')
      expect(updated.pause_until).toBe('2024-06-01')
      expect(updated.is_shadowing).toBe(true)
      expect(updated.onboarding_completed).toBe(true)
      expect(updated.is_remote).toBe(true)
    })

    test('should partially update new fields', () => {
      const createData = {
        id: 'test-id-4',
        name: 'Alice Brown',
        email: 'alice@example.com',
        role: 'talent',
        skills: ['Rust'],
        is_active: true,
        calendar_sync_enabled: false,
        org: 'TeamA',
        profile_backend: false
      }
      repository.create(createData, { userEmail: 'admin@example.com' })

      const updateData = {
        org: 'TeamC',
        profile_backend: true
      }

      const updated = repository.update('test-id-4', updateData, { userEmail: 'admin@example.com' })

      expect(updated.org).toBe('TeamC')
      expect(updated.profile_backend).toBe(true)
    })

    test('should set fields to null when explicitly updated', () => {
      const createData = {
        id: 'test-id-5',
        name: 'Charlie Delta',
        email: 'charlie@example.com',
        role: 'talent',
        skills: ['C++'],
        is_active: true,
        calendar_sync_enabled: false,
        manager: 'Old Manager',
        pause_until: '2024-05-01'
      }
      repository.create(createData, { userEmail: 'admin@example.com' })

      const updateData = {
        manager: null,
        pause_until: null
      }

      const updated = repository.update('test-id-5', updateData, { userEmail: 'admin@example.com' })

      expect(updated.manager).toBeNull()
      expect(updated.pause_until).toBeNull()
    })
  })

  describe('findAll() with new filter fields', () => {
    beforeEach(() => {
      // Create test data
      repository.create({
        id: 'filter-1',
        name: 'Backend Dev 1',
        email: 'backend1@example.com',
        role: 'talent',
        skills: ['Node.js'],
        is_active: true,
        calendar_sync_enabled: false,
        org: 'TeamA',
        manager: 'Manager A',
        profile_backend: true,
        profile_frontend: false,
        max_level: 50,
        onboarding_completed: true,
        is_remote: false
      }, { userEmail: 'admin@example.com' })

      repository.create({
        id: 'filter-2',
        name: 'Frontend Dev 1',
        email: 'frontend1@example.com',
        role: 'talent',
        skills: ['React'],
        is_active: true,
        calendar_sync_enabled: false,
        org: 'TeamA',
        manager: 'Manager A',
        profile_backend: false,
        profile_frontend: true,
        max_level: 45,
        onboarding_completed: false,
        is_remote: true
      }, { userEmail: 'admin@example.com' })

      repository.create({
        id: 'filter-3',
        name: 'Backend Dev 2',
        email: 'backend2@example.com',
        role: 'talent',
        skills: ['Python'],
        is_active: true,
        calendar_sync_enabled: false,
        org: 'TeamB',
        manager: 'Manager B',
        profile_backend: true,
        profile_ml: true,
        max_level: 60,
        onboarding_completed: true,
        is_remote: false
      }, { userEmail: 'admin@example.com' })

      repository.create({
        id: 'filter-4',
        name: 'Fullstack Dev 1',
        email: 'fullstack1@example.com',
        role: 'talent',
        skills: ['JavaScript'],
        is_active: true,
        calendar_sync_enabled: false,
        org: 'TeamB',
        manager: 'Manager B',
        profile_backend: true,
        profile_frontend: true,
        profile_fullstack: true,
        max_level: 55,
        onboarding_completed: true,
        is_remote: true
      }, { userEmail: 'admin@example.com' })
    })

    test('should filter by org', () => {
      const results = repository.findAll({ org: 'TeamA' })
      expect(results.length).toBe(2)
      expect(results.every(r => r.org === 'TeamA')).toBe(true)
    })

    test('should filter by manager', () => {
      const results = repository.findAll({ manager: 'Manager B' })
      expect(results.length).toBe(2)
      expect(results.every(r => r.manager === 'Manager B')).toBe(true)
    })

    test('should filter by single profile type', () => {
      const results = repository.findAll({ profile_backend: true })
      expect(results.length).toBe(3)
      expect(results.every(r => r.profile_backend === true)).toBe(true)
    })

    test('should filter by multiple profile types (AND logic)', () => {
      const results = repository.findAll({ profile_backend: true, profile_ml: true })
      expect(results.length).toBe(1)
      expect(results[0].id).toBe('filter-3')
    })

    test('should filter by min_level', () => {
      const results = repository.findAll({ min_level: 50 })
      expect(results.length).toBe(3)
      expect(results.every(r => r.max_level >= 50)).toBe(true)
    })

    test('should filter by max_level', () => {
      const results = repository.findAll({ max_level: 50 })
      expect(results.length).toBe(2)
      expect(results.every(r => r.max_level <= 50)).toBe(true)
    })

    test('should filter by level range (min and max)', () => {
      const results = repository.findAll({ min_level: 45, max_level: 55 })
      expect(results.length).toBe(3)
      expect(results.every(r => r.max_level >= 45 && r.max_level <= 55)).toBe(true)
    })

    test('should filter by onboarding_completed', () => {
      const results = repository.findAll({ onboarding_completed: true })
      expect(results.length).toBe(3)
      expect(results.every(r => r.onboarding_completed === true)).toBe(true)
    })

    test('should filter by is_remote', () => {
      const results = repository.findAll({ is_remote: true })
      expect(results.length).toBe(2)
      expect(results.every(r => r.is_remote === true)).toBe(true)
    })

    test('should combine multiple new filters', () => {
      const results = repository.findAll({
        org: 'TeamA',
        profile_backend: true,
        onboarding_completed: true
      })
      expect(results.length).toBe(1)
      expect(results[0].id).toBe('filter-1')
    })

    test('should combine new filters with existing filters', () => {
      const results = repository.findAll({
        is_active: true,
        org: 'TeamB',
        profile_backend: true,
        min_level: 55
      })
      expect(results.length).toBe(2)
    })
  })

  describe('findById() with new fields', () => {
    test('should return all new fields', () => {
      const data = {
        id: 'find-by-id-1',
        name: 'Test User',
        email: 'test@example.com',
        role: 'talent',
        skills: ['TypeScript'],
        is_active: true,
        calendar_sync_enabled: false,
        date_in: '2024-01-01',
        manager: 'Test Manager',
        org: 'TeamTest',
        profile_sre: true,
        max_level: 70,
        check_level: 'ESEP60',
        onboarding_completed: true
      }

      repository.create(data, { userEmail: 'admin@example.com' })

      const found = repository.findById('find-by-id-1')

      expect(found.date_in).toBe('2024-01-01')
      expect(found.manager).toBe('Test Manager')
      expect(found.org).toBe('TeamTest')
      expect(found.profile_sre).toBe(true)
      expect(found.max_level).toBe(70)
      expect(found.check_level).toBe('ESEP60')
      expect(found.onboarding_completed).toBe(true)
    })
  })

  describe('findByEmail() with new fields', () => {
    test('should return all new fields', () => {
      const data = {
        id: 'find-by-email-1',
        name: 'Email Test',
        email: 'email-test@example.com',
        role: 'talent',
        skills: ['Kotlin'],
        is_active: true,
        calendar_sync_enabled: false,
        profile_cse: true,
        max_level: 65,
        is_remote: true
      }

      repository.create(data, { userEmail: 'admin@example.com' })

      const found = repository.findByEmail('email-test@example.com')

      expect(found.profile_cse).toBe(true)
      expect(found.max_level).toBe(65)
      expect(found.is_remote).toBe(true)
    })
  })

  describe('count() with new filters', () => {
    beforeEach(() => {
      for (let i = 1; i <= 10; i++) {
        repository.create({
          id: `count-${i}`,
          name: `User ${i}`,
          email: `user${i}@example.com`,
          role: 'talent',
          skills: ['JavaScript'],
          is_active: true,
          calendar_sync_enabled: false,
          org: i <= 5 ? 'TeamA' : 'TeamB',
          profile_backend: i % 2 === 0,
          max_level: 40 + i * 2,
          onboarding_completed: i <= 7
        }, { userEmail: 'admin@example.com' })
      }
    })

    test('should count with org filter', () => {
      const count = repository.count({ org: 'TeamA' })
      expect(count).toBe(5)
    })

    test('should count with profile filter', () => {
      const count = repository.count({ profile_backend: true })
      expect(count).toBe(5)
    })

    test('should count with level range filter', () => {
      const count = repository.count({ min_level: 50, max_level: 55 })
      expect(count).toBeGreaterThan(0)
    })

    test('should count with onboarding filter', () => {
      const count = repository.count({ onboarding_completed: true })
      expect(count).toBe(7)
    })

    test('should count with combined filters', () => {
      const count = repository.count({
        org: 'TeamA',
        onboarding_completed: true,
        profile_backend: true
      })
      expect(count).toBeGreaterThan(0)
    })
  })
})
