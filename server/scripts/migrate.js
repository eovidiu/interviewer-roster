import Database from 'better-sqlite3'
import { readFileSync, mkdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import 'dotenv/config'

const __dirname = dirname(fileURLToPath(import.meta.url))
const dbPath = process.env.DATABASE_PATH || './data/interviewer-roster.db'

// Ensure data directory exists
const dataDir = dirname(dbPath)
mkdirSync(dataDir, { recursive: true })

console.log(`📊 Running migrations on: ${dbPath}`)

const db = new Database(dbPath)
db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

try {
  // Run migrations in order
  const migrations = [
    '001_initial.sql',
    '002_add_user_fields.sql',
    '003_add_interviewer_team_fields.sql'
  ]

  for (const migrationFile of migrations) {
    console.log(`\n📝 Running migration: ${migrationFile}`)
    const migrationPath = join(__dirname, '../src/db/migrations', migrationFile)

    try {
      const migration = readFileSync(migrationPath, 'utf-8')

      // Split by semicolon and execute each statement
      const statements = migration
        .split(';')
        .map(stmt => stmt.trim())
        .filter(stmt => stmt.length > 0)

      statements.forEach((stmt, index) => {
        try {
          db.exec(stmt)
          console.log(`  ✅ Statement ${index + 1}/${statements.length}`)
        } catch (err) {
          // Ignore "duplicate column" errors for idempotency
          if (err.message.includes('duplicate column')) {
            console.log(`  ⚠️  Column already exists (skipping)`)
          } else {
            throw err
          }
        }
      })

      console.log(`  ✅ ${migrationFile} completed`)
    } catch (err) {
      if (err.code === 'ENOENT') {
        console.log(`  ⚠️  Migration file not found, skipping: ${migrationFile}`)
      } else {
        throw err
      }
    }
  }

  console.log('\n✅ All migrations completed successfully')
} catch (error) {
  console.error('❌ Migration failed:', error)
  process.exit(1)
} finally {
  db.close()
}
