import Database from 'better-sqlite3'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const DB_PATH = path.join(__dirname, '../data/interviewer-roster.db')
const MIGRATION_PATH = path.join(__dirname, '../src/db/migrations/003_add_interviewer_team_fields.sql')

async function applyMigration() {
  console.log('📦 Applying Migration 003: Add Interviewer Team Fields')
  console.log('=' .repeat(60))

  try {
    // Open database
    const db = new Database(DB_PATH)

    // Read migration file
    const migration = fs.readFileSync(MIGRATION_PATH, 'utf8')

    console.log('✓ Database opened successfully')
    console.log('✓ Migration file loaded')

    // Execute migration
    db.exec(migration)

    console.log('✓ Migration executed successfully')

    // Verify columns were added
    const columns = db.prepare("PRAGMA table_info(interviewers)").all()
    const newColumns = [
      'date_in', 'manager', 'check_manager', 'org',
      'profile_backend', 'profile_big_data', 'profile_frontend', 'profile_fullstack',
      'profile_sre', 'profile_cse', 'profile_ml', 'profile_em',
      'max_level', 'check_level', 'pause_until',
      'is_shadowing', 'onboarding_completed', 'is_remote'
    ]

    let allColumnsAdded = true
    newColumns.forEach(colName => {
      const found = columns.find(col => col.name === colName)
      if (found) {
        console.log(`  ✓ ${colName}`)
      } else {
        console.log(`  ✗ ${colName} - NOT FOUND`)
        allColumnsAdded = false
      }
    })

    // Verify indexes were created
    const indexes = db.prepare("SELECT name FROM sqlite_master WHERE type='index' AND name LIKE 'idx_interviewers_%'").all()
    console.log(`\n✓ ${indexes.length} indexes created`)

    db.close()

    if (allColumnsAdded) {
      console.log('\n' + '='.repeat(60))
      console.log('✅ Migration 003 completed successfully!')
      console.log('='.repeat(60))
    } else {
      console.error('\n❌ Migration completed with errors - some columns were not added')
      process.exit(1)
    }

  } catch (error) {
    console.error('\n❌ Migration failed:')
    console.error(error.message)
    console.error(error.stack)
    process.exit(1)
  }
}

applyMigration()
