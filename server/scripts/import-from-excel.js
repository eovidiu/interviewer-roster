#!/usr/bin/env node

/**
 * Excel Import Script
 *
 * Imports interviewer data from an Excel file (TheInterviewTeam.xlsx) into the SQLite database.
 *
 * Expected Excel columns (21 total):
 * - name, email, role, skills, is_active, timezone
 * - date_in, manager, check_manager, org
 * - profile_backend, profile_big_data, profile_frontend, profile_fullstack
 * - profile_sre, profile_cse, profile_ml, profile_em
 * - max_level, check_level, pause_until, is_shadowing, onboarding_completed, is_remote
 *
 * Usage:
 *   node server/scripts/import-from-excel.js <path-to-excel-file>
 *
 * Example:
 *   node server/scripts/import-from-excel.js ./TheInterviewTeam.xlsx
 */

import XLSX from 'xlsx'
import Database from 'better-sqlite3'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Database configuration
const DB_PATH = path.join(__dirname, '../data/interviewer-roster.db')

// Helper function to convert Excel boolean to SQLite integer
function boolToInt(value) {
  if (value === true || value === 'TRUE' || value === 'true' || value === 1 || value === '1') {
    return 1
  }
  return 0
}

// Helper function to parse skills (handles comma-separated string or array)
function parseSkills(value) {
  if (Array.isArray(value)) {
    return value
  }
  if (typeof value === 'string') {
    return value.split(',').map(s => s.trim()).filter(Boolean)
  }
  return []
}

// Helper function to generate unique ID
function generateId() {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

// Helper function to get current ISO timestamp
function getCurrentTimestamp() {
  return new Date().toISOString()
}

// Main import function
async function importFromExcel(excelPath) {
  console.log('📊 Excel Import Script')
  console.log('='.repeat(50))
  console.log(`Excel file: ${excelPath}`)
  console.log(`Database: ${DB_PATH}`)
  console.log()

  // Validate Excel file exists
  if (!fs.existsSync(excelPath)) {
    console.error(`❌ Error: Excel file not found at ${excelPath}`)
    process.exit(1)
  }

  // Validate database exists
  if (!fs.existsSync(DB_PATH)) {
    console.error(`❌ Error: Database not found at ${DB_PATH}`)
    console.error('Please run migrations first: npm run db:migrate')
    process.exit(1)
  }

  // Read Excel file
  console.log('📖 Reading Excel file...')
  const workbook = XLSX.readFile(excelPath)
  const sheetName = workbook.SheetNames[0]
  const worksheet = workbook.Sheets[sheetName]
  const data = XLSX.utils.sheet_to_json(worksheet)

  console.log(`✅ Found ${data.length} rows in sheet "${sheetName}"`)
  console.log()

  // Open database connection
  const db = new Database(DB_PATH)
  db.pragma('foreign_keys = ON')

  // Prepare insert statement
  const insertStmt = db.prepare(`
    INSERT INTO interviewers (
      id, name, email, role, skills, is_active, timezone,
      created_at, updated_at, created_by,
      date_in, manager, check_manager, org,
      profile_backend, profile_big_data, profile_frontend, profile_fullstack,
      profile_sre, profile_cse, profile_ml, profile_em,
      max_level, check_level, pause_until,
      is_shadowing, onboarding_completed, is_remote
    )
    VALUES (
      ?, ?, ?, ?, ?, ?, ?,
      ?, ?, ?,
      ?, ?, ?, ?,
      ?, ?, ?, ?,
      ?, ?, ?, ?,
      ?, ?, ?,
      ?, ?, ?
    )
  `)

  // Import data
  let successCount = 0
  let skipCount = 0
  let errorCount = 0

  console.log('📥 Importing records...')
  console.log()

  for (const row of data) {
    try {
      // Validate required fields
      if (!row.name || !row.email) {
        console.log(`⚠️  Skipping row (missing name or email): ${JSON.stringify(row).substring(0, 100)}`)
        skipCount++
        continue
      }

      // Check if email already exists
      const existing = db.prepare('SELECT id FROM interviewers WHERE email = ?').get(row.email)
      if (existing) {
        console.log(`⚠️  Skipping ${row.name} (${row.email}) - already exists`)
        skipCount++
        continue
      }

      const now = getCurrentTimestamp()
      const skills = parseSkills(row.skills || [])

      insertStmt.run(
        generateId(),
        row.name,
        row.email,
        row.role || 'viewer',
        JSON.stringify(skills),
        boolToInt(row.is_active !== undefined ? row.is_active : true),
        row.timezone || null,
        now,
        now,
        'excel-import',
        // Migration 003 fields
        row.date_in || null,
        row.manager || null,
        boolToInt(row.check_manager),
        row.org || null,
        boolToInt(row.profile_backend),
        boolToInt(row.profile_big_data),
        boolToInt(row.profile_frontend),
        boolToInt(row.profile_fullstack),
        boolToInt(row.profile_sre),
        boolToInt(row.profile_cse),
        boolToInt(row.profile_ml),
        boolToInt(row.profile_em),
        row.max_level || null,
        row.check_level || null,
        row.pause_until || null,
        boolToInt(row.is_shadowing),
        boolToInt(row.onboarding_completed),
        boolToInt(row.is_remote)
      )

      console.log(`✅ Imported: ${row.name} (${row.email})`)
      successCount++
    } catch (error) {
      console.error(`❌ Error importing ${row.name || 'unknown'}: ${error.message}`)
      errorCount++
    }
  }

  db.close()

  console.log()
  console.log('='.repeat(50))
  console.log('📊 Import Summary')
  console.log('='.repeat(50))
  console.log(`✅ Successfully imported: ${successCount}`)
  console.log(`⚠️  Skipped: ${skipCount}`)
  console.log(`❌ Errors: ${errorCount}`)
  console.log(`📋 Total rows processed: ${data.length}`)
  console.log()

  if (errorCount > 0) {
    process.exit(1)
  }
}

// CLI execution
const args = process.argv.slice(2)

if (args.length === 0) {
  console.error('❌ Error: Please provide path to Excel file')
  console.error()
  console.error('Usage:')
  console.error('  node server/scripts/import-from-excel.js <path-to-excel-file>')
  console.error()
  console.error('Example:')
  console.error('  node server/scripts/import-from-excel.js ./TheInterviewTeam.xlsx')
  process.exit(1)
}

const excelPath = path.resolve(args[0])

importFromExcel(excelPath)
  .catch(error => {
    console.error('❌ Import failed:', error)
    process.exit(1)
  })
