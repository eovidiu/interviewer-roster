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
  // Read and execute migration file
  const migrationPath = join(__dirname, '../src/db/migrations/001_initial.sql')
  const migration = readFileSync(migrationPath, 'utf-8')

  // Split by semicolon and execute each statement
  const statements = migration
    .split(';')
    .map(stmt => stmt.trim())
    .filter(stmt => stmt.length > 0)

  statements.forEach((stmt, index) => {
    try {
      db.exec(stmt)
      console.log(`✅ Executed statement ${index + 1}/${statements.length}`)
    } catch (err) {
      console.error(`❌ Error in statement ${index + 1}:`, err.message)
      console.error(`Statement:`, stmt.substring(0, 100))
    }
  })

  console.log('✅ Migrations completed successfully')
} catch (error) {
  console.error('❌ Migration failed:', error)
  process.exit(1)
} finally {
  db.close()
}
