/**
 * Interviewer Repository
 * Data access layer for interviewers table
 */
export class InterviewerRepository {
  constructor(db) {
    this.db = db
  }

  /**
   * Find all interviewers with optional filters
   * @param {Object} filters
   * @returns {Array}
   */
  findAll(filters = {}) {
    const { role, is_active, search, limit = 50, offset = 0 } = filters

    let sql = 'SELECT * FROM interviewers WHERE 1=1'
    const params = []

    if (role) {
      sql += ' AND role = ?'
      params.push(role)
    }

    if (typeof is_active === 'boolean') {
      sql += ' AND is_active = ?'
      params.push(is_active ? 1 : 0)
    }

    if (search) {
      sql += ' AND (name LIKE ? OR email LIKE ? OR skills LIKE ?)'
      const searchPattern = `%${search}%`
      params.push(searchPattern, searchPattern, searchPattern)
    }

    sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?'
    params.push(limit, offset)

    const rows = this.db.prepare(sql).all(...params)

    // Parse JSON fields
    return rows.map(row => ({
      ...row,
      skills: JSON.parse(row.skills || '[]'),
      is_active: Boolean(row.is_active),
      calendar_sync_enabled: Boolean(row.calendar_sync_enabled)
    }))
  }

  /**
   * Find interviewer by ID
   * @param {string} id
   * @returns {Object|null}
   */
  findById(id) {
    const row = this.db.prepare('SELECT * FROM interviewers WHERE id = ?').get(id)

    if (!row) return null

    return {
      ...row,
      skills: JSON.parse(row.skills || '[]'),
      is_active: Boolean(row.is_active),
      calendar_sync_enabled: Boolean(row.calendar_sync_enabled)
    }
  }

  /**
   * Find interviewer by email
   * @param {string} email
   * @returns {Object|null}
   */
  findByEmail(email) {
    const row = this.db.prepare('SELECT * FROM interviewers WHERE email = ?').get(email)

    if (!row) return null

    return {
      ...row,
      skills: JSON.parse(row.skills || '[]'),
      is_active: Boolean(row.is_active),
      calendar_sync_enabled: Boolean(row.calendar_sync_enabled)
    }
  }

  /**
   * Create new interviewer
   * @param {Object} data
   * @param {Object} auditContext
   * @returns {Object}
   */
  create(data, auditContext) {
    const stmt = this.db.prepare(`
      INSERT INTO interviewers (
        id, name, email, role, skills, is_active,
        calendar_sync_enabled, timezone, created_by
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)

    const result = stmt.run(
      data.id,
      data.name,
      data.email,
      data.role,
      JSON.stringify(data.skills),
      data.is_active ? 1 : 0,
      data.calendar_sync_enabled ? 1 : 0,
      data.timezone || null,
      auditContext?.userEmail || null
    )

    return this.findById(data.id)
  }

  /**
   * Update interviewer
   * @param {string} id
   * @param {Object} data
   * @param {Object} auditContext
   * @returns {Object|null}
   */
  update(id, data, auditContext) {
    const fields = []
    const values = []

    // Build dynamic UPDATE query
    const allowedFields = ['name', 'email', 'role', 'skills', 'is_active', 'calendar_sync_enabled', 'timezone']

    allowedFields.forEach(field => {
      if (data[field] !== undefined) {
        fields.push(`${field} = ?`)

        if (field === 'skills') {
          values.push(JSON.stringify(data[field]))
        } else if (field === 'is_active' || field === 'calendar_sync_enabled') {
          values.push(data[field] ? 1 : 0)
        } else {
          values.push(data[field])
        }
      }
    })

    if (fields.length === 0) {
      return this.findById(id)
    }

    // Add audit fields
    fields.push('modified_by = ?', 'modified_at = datetime(\'now\')')
    values.push(auditContext?.userEmail || null)

    values.push(id)

    const sql = `UPDATE interviewers SET ${fields.join(', ')} WHERE id = ?`
    const stmt = this.db.prepare(sql)
    stmt.run(...values)

    return this.findById(id)
  }

  /**
   * Delete interviewer
   * @param {string} id
   * @returns {boolean}
   */
  delete(id) {
    const stmt = this.db.prepare('DELETE FROM interviewers WHERE id = ?')
    const result = stmt.run(id)
    return result.changes > 0
  }

  /**
   * Count total interviewers
   * @param {Object} filters
   * @returns {number}
   */
  count(filters = {}) {
    const { role, is_active, search } = filters

    let sql = 'SELECT COUNT(*) as count FROM interviewers WHERE 1=1'
    const params = []

    if (role) {
      sql += ' AND role = ?'
      params.push(role)
    }

    if (typeof is_active === 'boolean') {
      sql += ' AND is_active = ?'
      params.push(is_active ? 1 : 0)
    }

    if (search) {
      sql += ' AND (name LIKE ? OR email LIKE ? OR skills LIKE ?)'
      const searchPattern = `%${search}%`
      params.push(searchPattern, searchPattern, searchPattern)
    }

    const result = this.db.prepare(sql).get(...params)
    return result.count
  }
}
