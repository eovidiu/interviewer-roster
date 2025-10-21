import Database from 'better-sqlite3'
import { nanoid } from 'nanoid'
import 'dotenv/config'

const dbPath = process.env.DATABASE_PATH || './data/interviewer-roster.db'

console.log(`🌱 Seeding database: ${dbPath}`)

const db = new Database(dbPath)
db.pragma('foreign_keys = ON')

try {
  // Clear existing data
  db.exec('DELETE FROM audit_logs')
  db.exec('DELETE FROM interview_events')
  db.exec('DELETE FROM interviewers')
  db.exec('DELETE FROM users')

  console.log('🗑️  Cleared existing data')

  // Seed users (for authentication)
  const users = [
    {
      id: nanoid(),
      email: 'admin@example.com',
      name: 'Admin User',
      role: 'admin',
      google_id: 'google_admin_123'
    },
    {
      id: nanoid(),
      email: 'talent@example.com',
      name: 'Talent User',
      role: 'talent',
      google_id: 'google_talent_456'
    }
  ]

  const insertUser = db.prepare(`
    INSERT INTO users (id, email, name, role, google_id)
    VALUES (?, ?, ?, ?, ?)
  `)

  users.forEach(user => {
    insertUser.run(user.id, user.email, user.name, user.role, user.google_id)
  })

  console.log(`✅ Seeded ${users.length} users`)

  // Seed interviewers
  const interviewers = [
    {
      id: nanoid(),
      name: 'Sarah Chen',
      email: 'sarah.chen@example.com',
      role: 'talent',
      skills: JSON.stringify(['React', 'TypeScript', 'System Design']),
      is_active: 1,
      timezone: 'America/Los_Angeles',
      calendar_sync_enabled: 1
    },
    {
      id: nanoid(),
      name: 'Priya Patel',
      email: 'priya.patel@example.com',
      role: 'talent',
      skills: JSON.stringify(['Node.js', 'Python', 'Databases']),
      is_active: 1,
      timezone: 'America/New_York',
      calendar_sync_enabled: 1
    },
    {
      id: nanoid(),
      name: 'Marcus Johnson',
      email: 'marcus.j@example.com',
      role: 'talent',
      skills: JSON.stringify(['Go', 'Kubernetes', 'DevOps']),
      is_active: 1,
      timezone: 'America/Chicago',
      calendar_sync_enabled: 0
    },
    {
      id: nanoid(),
      name: 'Elena Rodriguez',
      email: 'elena.r@example.com',
      role: 'viewer',
      skills: JSON.stringify(['Product Management', 'UX Design']),
      is_active: 1,
      timezone: 'Europe/London',
      calendar_sync_enabled: 0
    },
    {
      id: nanoid(),
      name: 'Kenji Tanaka',
      email: 'kenji.t@example.com',
      role: 'talent',
      skills: JSON.stringify(['Java', 'Spring Boot', 'Microservices']),
      is_active: 1,
      timezone: 'Asia/Tokyo',
      calendar_sync_enabled: 1
    },
    {
      id: nanoid(),
      name: 'Aisha Mohammed',
      email: 'aisha.m@example.com',
      role: 'talent',
      skills: JSON.stringify(['Mobile Development', 'React Native', 'iOS']),
      is_active: 0,
      timezone: 'Africa/Cairo',
      calendar_sync_enabled: 0
    }
  ]

  const insertInterviewer = db.prepare(`
    INSERT INTO interviewers
    (id, name, email, role, skills, is_active, timezone, calendar_sync_enabled)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `)

  interviewers.forEach(interviewer => {
    insertInterviewer.run(
      interviewer.id,
      interviewer.name,
      interviewer.email,
      interviewer.role,
      interviewer.skills,
      interviewer.is_active,
      interviewer.timezone,
      interviewer.calendar_sync_enabled
    )
  })

  console.log(`✅ Seeded ${interviewers.length} interviewers`)

  // Seed interview events
  const now = new Date()
  const events = [
    {
      id: nanoid(),
      interviewer_email: 'sarah.chen@example.com',
      start_time: new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000).toISOString(),
      end_time: new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000 + 60 * 60 * 1000).toISOString(),
      candidate_name: 'John Doe',
      position: 'Senior Frontend Engineer',
      status: 'pending',
      skills_assessed: JSON.stringify(['React', 'TypeScript']),
      duration_minutes: 60
    },
    {
      id: nanoid(),
      interviewer_email: 'priya.patel@example.com',
      start_time: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      end_time: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000 + 45 * 60 * 1000).toISOString(),
      candidate_name: 'Jane Smith',
      position: 'Backend Engineer',
      status: 'attended',
      skills_assessed: JSON.stringify(['Node.js', 'Databases']),
      duration_minutes: 45,
      notes: 'Great technical depth, strong communication'
    },
    {
      id: nanoid(),
      interviewer_email: 'marcus.j@example.com',
      start_time: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      end_time: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000 + 60 * 60 * 1000).toISOString(),
      candidate_name: 'Mike Brown',
      position: 'DevOps Engineer',
      status: 'ghosted',
      skills_assessed: JSON.stringify(['Kubernetes', 'CI/CD']),
      duration_minutes: 60,
      notes: 'Candidate did not show up'
    }
  ]

  const insertEvent = db.prepare(`
    INSERT INTO interview_events
    (id, interviewer_email, start_time, end_time, candidate_name, position, status, skills_assessed, duration_minutes, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)

  events.forEach(event => {
    insertEvent.run(
      event.id,
      event.interviewer_email,
      event.start_time,
      event.end_time,
      event.candidate_name,
      event.position,
      event.status,
      event.skills_assessed,
      event.duration_minutes,
      event.notes || null
    )
  })

  console.log(`✅ Seeded ${events.length} interview events`)

  // Seed audit logs
  const auditLogs = [
    {
      id: nanoid(),
      user_email: 'admin@example.com',
      user_name: 'Admin User',
      action: 'CREATE_INTERVIEWER',
      entity_type: 'interviewer',
      entity_id: interviewers[0].id,
      changes: JSON.stringify({ created: true })
    },
    {
      id: nanoid(),
      user_email: 'talent@example.com',
      user_name: 'Talent User',
      action: 'UPDATE_EVENT_STATUS',
      entity_type: 'interview_event',
      entity_id: events[1].id,
      changes: JSON.stringify({ status: { from: 'pending', to: 'attended' } })
    }
  ]

  const insertAuditLog = db.prepare(`
    INSERT INTO audit_logs (id, user_email, user_name, action, entity_type, entity_id, changes)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `)

  auditLogs.forEach(log => {
    insertAuditLog.run(
      log.id,
      log.user_email,
      log.user_name,
      log.action,
      log.entity_type,
      log.entity_id,
      log.changes
    )
  })

  console.log(`✅ Seeded ${auditLogs.length} audit logs`)
  console.log('🎉 Database seeding completed successfully')
} catch (error) {
  console.error('❌ Seeding failed:', error)
  process.exit(1)
} finally {
  db.close()
}
