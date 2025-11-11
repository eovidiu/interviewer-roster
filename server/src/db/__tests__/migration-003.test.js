import { describe, test, expect, beforeEach, afterEach } from '@jest/globals'
import Database from 'better-sqlite3'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

describe('Migration 003: Add Interviewer Team Fields', () => {
  let db

  beforeEach(() => {
    // Create temp test database
    db = new Database(':memory:')

    // Apply base migrations
    const migration001 = fs.readFileSync(path.join(__dirname, '../migrations/001_initial.sql'), 'utf8')
    const migration002 = fs.readFileSync(path.join(__dirname, '../migrations/002_add_user_fields.sql'), 'utf8')
    db.exec(migration001)
    db.exec(migration002)
  })

  afterEach(() => {
    db.close()
  })

  describe('Schema Changes', () => {
    test('should add date_in column', () => {
      const migration003 = fs.readFileSync(path.join(__dirname, '../migrations/003_add_interviewer_team_fields.sql'), 'utf8')
      db.exec(migration003)

      const columns = db.prepare("PRAGMA table_info(interviewers)").all()
      const dateInColumn = columns.find(col => col.name === 'date_in')

      expect(dateInColumn).toBeDefined()
      expect(dateInColumn.type).toBe('TEXT')
    })

    test('should add manager column', () => {
      const migration003 = fs.readFileSync(path.join(__dirname, '../migrations/003_add_interviewer_team_fields.sql'), 'utf8')
      db.exec(migration003)

      const columns = db.prepare("PRAGMA table_info(interviewers)").all()
      const managerColumn = columns.find(col => col.name === 'manager')

      expect(managerColumn).toBeDefined()
      expect(managerColumn.type).toBe('TEXT')
    })

    test('should add check_manager column', () => {
      const migration003 = fs.readFileSync(path.join(__dirname, '../migrations/003_add_interviewer_team_fields.sql'), 'utf8')
      db.exec(migration003)

      const columns = db.prepare("PRAGMA table_info(interviewers)").all()
      const checkManagerColumn = columns.find(col => col.name === 'check_manager')

      expect(checkManagerColumn).toBeDefined()
      expect(checkManagerColumn.type).toBe('INTEGER')
      expect(checkManagerColumn.dflt_value).toBe('0')
    })

    test('should add org column', () => {
      const migration003 = fs.readFileSync(path.join(__dirname, '../migrations/003_add_interviewer_team_fields.sql'), 'utf8')
      db.exec(migration003)

      const columns = db.prepare("PRAGMA table_info(interviewers)").all()
      const orgColumn = columns.find(col => col.name === 'org')

      expect(orgColumn).toBeDefined()
      expect(orgColumn.type).toBe('TEXT')
    })

    test('should add all 8 profile boolean columns', () => {
      const migration003 = fs.readFileSync(path.join(__dirname, '../migrations/003_add_interviewer_team_fields.sql'), 'utf8')
      db.exec(migration003)

      const columns = db.prepare("PRAGMA table_info(interviewers)").all()
      const profileColumns = [
        'profile_backend', 'profile_big_data', 'profile_frontend', 'profile_fullstack',
        'profile_sre', 'profile_cse', 'profile_ml', 'profile_em'
      ]

      profileColumns.forEach(colName => {
        const col = columns.find(c => c.name === colName)
        expect(col).toBeDefined()
        expect(col.type).toBe('INTEGER')
        expect(col.dflt_value).toBe('0')
      })
    })

    test('should add max_level and check_level columns', () => {
      const migration003 = fs.readFileSync(path.join(__dirname, '../migrations/003_add_interviewer_team_fields.sql'), 'utf8')
      db.exec(migration003)

      const columns = db.prepare("PRAGMA table_info(interviewers)").all()

      const maxLevel = columns.find(col => col.name === 'max_level')
      expect(maxLevel).toBeDefined()
      expect(maxLevel.type).toBe('INTEGER')

      const checkLevel = columns.find(col => col.name === 'check_level')
      expect(checkLevel).toBeDefined()
      expect(checkLevel.type).toBe('TEXT')
    })

    test('should add pause_until, is_shadowing, onboarding_completed, is_remote columns', () => {
      const migration003 = fs.readFileSync(path.join(__dirname, '../migrations/003_add_interviewer_team_fields.sql'), 'utf8')
      db.exec(migration003)

      const columns = db.prepare("PRAGMA table_info(interviewers)").all()

      const pauseUntil = columns.find(col => col.name === 'pause_until')
      expect(pauseUntil).toBeDefined()
      expect(pauseUntil.type).toBe('TEXT')

      const statusColumns = ['is_shadowing', 'onboarding_completed', 'is_remote']
      statusColumns.forEach(colName => {
        const col = columns.find(c => c.name === colName)
        expect(col).toBeDefined()
        expect(col.type).toBe('INTEGER')
        expect(col.dflt_value).toBe('0')
      })
    })
  })

  describe('Indexes', () => {
    test('should create index on org column', () => {
      const migration003 = fs.readFileSync(path.join(__dirname, '../migrations/003_add_interviewer_team_fields.sql'), 'utf8')
      db.exec(migration003)

      const indexes = db.prepare("SELECT name FROM sqlite_master WHERE type='index' AND name='idx_interviewers_org'").all()
      expect(indexes.length).toBe(1)
    })

    test('should create index on manager column', () => {
      const migration003 = fs.readFileSync(path.join(__dirname, '../migrations/003_add_interviewer_team_fields.sql'), 'utf8')
      db.exec(migration003)

      const indexes = db.prepare("SELECT name FROM sqlite_master WHERE type='index' AND name='idx_interviewers_manager'").all()
      expect(indexes.length).toBe(1)
    })

    test('should create index on max_level column', () => {
      const migration003 = fs.readFileSync(path.join(__dirname, '../migrations/003_add_interviewer_team_fields.sql'), 'utf8')
      db.exec(migration003)

      const indexes = db.prepare("SELECT name FROM sqlite_master WHERE type='index' AND name='idx_interviewers_max_level'").all()
      expect(indexes.length).toBe(1)
    })

    test('should create index on pause_until column', () => {
      const migration003 = fs.readFileSync(path.join(__dirname, '../migrations/003_add_interviewer_team_fields.sql'), 'utf8')
      db.exec(migration003)

      const indexes = db.prepare("SELECT name FROM sqlite_master WHERE type='index' AND name='idx_interviewers_pause_until'").all()
      expect(indexes.length).toBe(1)
    })
  })

  describe('Data Integrity', () => {
    test('should preserve existing data when migration runs', () => {
      // Insert test data before migration
      db.exec(`
        INSERT INTO interviewers (id, name, email, role, skills, is_active)
        VALUES ('test-id', 'Test User', 'test@example.com', 'talent', '["JavaScript"]', 1)
      `)

      const migration003 = fs.readFileSync(path.join(__dirname, '../migrations/003_add_interviewer_team_fields.sql'), 'utf8')
      db.exec(migration003)

      const interviewer = db.prepare("SELECT * FROM interviewers WHERE id = 'test-id'").get()
      expect(interviewer.name).toBe('Test User')
      expect(interviewer.email).toBe('test@example.com')
    })

    test('should set default values for new boolean columns', () => {
      db.exec(`
        INSERT INTO interviewers (id, name, email, role, skills, is_active)
        VALUES ('test-id-2', 'Test User 2', 'test2@example.com', 'talent', '["Java"]', 1)
      `)

      const migration003 = fs.readFileSync(path.join(__dirname, '../migrations/003_add_interviewer_team_fields.sql'), 'utf8')
      db.exec(migration003)

      const interviewer = db.prepare("SELECT * FROM interviewers WHERE id = 'test-id-2'").get()
      expect(interviewer.profile_backend).toBe(0)
      expect(interviewer.profile_frontend).toBe(0)
      expect(interviewer.is_shadowing).toBe(0)
      expect(interviewer.onboarding_completed).toBe(0)
      expect(interviewer.is_remote).toBe(0)
    })
  })

  describe('CRUD Operations with New Fields', () => {
    test('should insert interviewer with new fields', () => {
      const migration003 = fs.readFileSync(path.join(__dirname, '../migrations/003_add_interviewer_team_fields.sql'), 'utf8')
      db.exec(migration003)

      db.prepare(`
        INSERT INTO interviewers (
          id, name, email, role, skills, is_active,
          date_in, manager, org, profile_backend, profile_sre,
          max_level, check_level, is_shadowing, onboarding_completed, is_remote
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        'new-id', 'John Doe', 'john@example.com', 'talent', '["Python"]', 1,
        '2024-01-01', 'Manager Name', 'TeamA', 1, 1,
        50, 'ESEP40', 0, 1, 0
      )

      const interviewer = db.prepare("SELECT * FROM interviewers WHERE id = 'new-id'").get()
      expect(interviewer.date_in).toBe('2024-01-01')
      expect(interviewer.manager).toBe('Manager Name')
      expect(interviewer.org).toBe('TeamA')
      expect(interviewer.profile_backend).toBe(1)
      expect(interviewer.profile_sre).toBe(1)
      expect(interviewer.max_level).toBe(50)
      expect(interviewer.check_level).toBe('ESEP40')
      expect(interviewer.onboarding_completed).toBe(1)
    })

    test('should update interviewer with new fields', () => {
      const migration003 = fs.readFileSync(path.join(__dirname, '../migrations/003_add_interviewer_team_fields.sql'), 'utf8')
      db.exec(migration003)

      db.prepare(`
        INSERT INTO interviewers (id, name, email, role, skills, is_active)
        VALUES ('update-id', 'Update Test', 'update@example.com', 'talent', '["Go"]', 1)
      `).run()

      db.prepare(`
        UPDATE interviewers
        SET manager = ?, org = ?, profile_ml = ?, max_level = ?
        WHERE id = ?
      `).run('New Manager', 'TeamB', 1, 60, 'update-id')

      const interviewer = db.prepare("SELECT * FROM interviewers WHERE id = 'update-id'").get()
      expect(interviewer.manager).toBe('New Manager')
      expect(interviewer.org).toBe('TeamB')
      expect(interviewer.profile_ml).toBe(1)
      expect(interviewer.max_level).toBe(60)
    })

    test('should query interviewers by new fields', () => {
      const migration003 = fs.readFileSync(path.join(__dirname, '../migrations/003_add_interviewer_team_fields.sql'), 'utf8')
      db.exec(migration003)

      db.prepare(`
        INSERT INTO interviewers (id, name, email, role, skills, is_active, org, profile_backend)
        VALUES ('q1', 'User 1', 'u1@ex.com', 'talent', '["JS"]', 1, 'TeamA', 1),
               ('q2', 'User 2', 'u2@ex.com', 'talent', '["JS"]', 1, 'TeamA', 0),
               ('q3', 'User 3', 'u3@ex.com', 'talent', '["JS"]', 1, 'TeamB', 1)
      `).run()

      const teamABackend = db.prepare("SELECT * FROM interviewers WHERE org = ? AND profile_backend = ?").all('TeamA', 1)
      expect(teamABackend.length).toBe(1)
      expect(teamABackend[0].id).toBe('q1')
    })
  })
})
