/**
 * User Repository
 * Data access layer for users table (Issue #53)
 */
import { randomUUID } from 'node:crypto'

export class UserRepository {
  constructor(db) {
    this.db = db
  }

  /**
   * Find user by email
   * @param {string} email
   * @returns {Object|null}
   */
  findByEmail(email) {
    const user = this.db
      .prepare('SELECT * FROM users WHERE email = ?')
      .get(email)

    return user || null
  }

  /**
   * Create new user
   * @param {Object} userData - { email, name, role?, picture? }
   * @returns {Object} Created user
   */
  create(userData) {
    const id = randomUUID()
    const role = userData.role || 'viewer' // Default to viewer
    const now = new Date().toISOString()

    this.db
      .prepare(`
        INSERT INTO users (id, email, name, role, picture, last_login_at, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `)
      .run(
        id,
        userData.email,
        userData.name,
        role,
        userData.picture || null,
        now, // Set last_login_at on creation
        now,
        now
      )

    return this.findByEmail(userData.email)
  }

  /**
   * Update last login timestamp
   * @param {string} email
   */
  updateLastLogin(email) {
    const now = new Date().toISOString()

    this.db
      .prepare('UPDATE users SET last_login_at = ?, updated_at = ? WHERE email = ?')
      .run(now, now, email)
  }

  /**
   * Update user role
   * @param {string} email
   * @param {string} role - 'viewer' | 'talent' | 'admin'
   * @returns {Object|null} Updated user
   */
  updateRole(email, role) {
    const user = this.findByEmail(email)
    if (!user) {
      return null
    }

    const now = new Date().toISOString()

    this.db
      .prepare('UPDATE users SET role = ?, updated_at = ? WHERE email = ?')
      .run(role, now, email)

    return this.findByEmail(email)
  }

  /**
   * Find all users with optional filters
   * @param {Object} filters - { role?, search?, limit?, offset? }
   * @returns {Array}
   */
  findAll(filters = {}) {
    const { role, search, limit = 50, offset = 0 } = filters

    let sql = 'SELECT * FROM users WHERE 1=1'
    const params = []

    if (role) {
      sql += ' AND role = ?'
      params.push(role)
    }

    if (search) {
      sql += ' AND (name LIKE ? OR email LIKE ?)'
      const searchPattern = `%${search}%`
      params.push(searchPattern, searchPattern)
    }

    sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?'
    params.push(limit, offset)

    return this.db.prepare(sql).all(...params)
  }

  /**
   * Count users with optional filters
   * @param {Object} filters - { role? }
   * @returns {number}
   */
  count(filters = {}) {
    const { role } = filters

    let sql = 'SELECT COUNT(*) as total FROM users WHERE 1=1'
    const params = []

    if (role) {
      sql += ' AND role = ?'
      params.push(role)
    }

    const result = this.db.prepare(sql).get(...params)
    return result.total
  }
}
