import Database from 'better-sqlite3'
import { mkdirSync, existsSync } from 'fs'
import { dirname } from 'path'
import 'dotenv/config'

const dbPath = process.env.DATABASE_PATH || './data/interviewer-roster.db'

// Ensure data directory exists
const dataDir = dirname(dbPath)
mkdirSync(dataDir, { recursive: true })

console.log(`📊 Applying migration 002 to: ${dbPath}`)

if (!existsSync(dbPath)) {
  console.error('❌ Database does not exist. Run npm run db:migrate first.')
  process.exit(1)
}

const db = new Database(dbPath)
db.pragma('foreign_keys = ON')

try {
  // Check if columns already exist
  const tableInfo = db.prepare('PRAGMA table_info(users)').all()
  const existingColumns = tableInfo.map(col => col.name)

  if (!existingColumns.includes('picture')) {
    db.exec('ALTER TABLE users ADD COLUMN picture TEXT')
    console.log('✅ Added picture column')
  } else {
    console.log('⏭️  Column picture already exists')
  }

  if (!existingColumns.includes('last_login_at')) {
    db.exec('ALTER TABLE users ADD COLUMN last_login_at TEXT')
    console.log('✅ Added last_login_at column')
  } else {
    console.log('⏭️  Column last_login_at already exists')
  }

  // Create index
  db.exec('CREATE INDEX IF NOT EXISTS idx_users_last_login ON users(last_login_at)')
  console.log('✅ Created index on last_login_at')

  console.log('✅ Migration 002 completed successfully')
} catch (error) {
  console.error('❌ Migration 002 failed:', error)
  process.exit(1)
} finally {
  db.close()
}
