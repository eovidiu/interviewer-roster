/**
 * EventRepository
 * Data access layer for interview_events table
 *
 * Handles:
 * - SQLite queries
 * - JSON field parsing (skills_assessed)
 * - Data transformation (SQLite → JavaScript)
 */
export class EventRepository {
  constructor(db) {
    this.db = db
  }

  /**
   * Find all events with optional filtering and pagination
   * @param {Object} filters - Filter options
   * @returns {Array} Events with parsed JSON fields
   */
  findAll(filters = {}) {
    const {
      interviewer_email,
      status,
      start_date,
      end_date,
      search,
      limit = 50,
      offset = 0
    } = filters

    let sql = 'SELECT * FROM interview_events WHERE 1=1'
    const params = []

    // Filter by interviewer
    if (interviewer_email) {
      sql += ' AND interviewer_email = ?'
      params.push(interviewer_email)
    }

    // Filter by status
    if (status) {
      sql += ' AND status = ?'
      params.push(status)
    }

    // Filter by date range
    if (start_date) {
      sql += ' AND date(start_time) >= date(?)'
      params.push(start_date)
    }

    if (end_date) {
      sql += ' AND date(end_time) <= date(?)'
      params.push(end_date)
    }

    // Search in candidate name, position, or skills
    if (search) {
      sql += ' AND (candidate_name LIKE ? OR position LIKE ? OR skills_assessed LIKE ?)'
      const searchPattern = `%${search}%`
      params.push(searchPattern, searchPattern, searchPattern)
    }

    // Order by start time (most recent first)
    sql += ' ORDER BY start_time DESC LIMIT ? OFFSET ?'
    params.push(limit, offset)

    const rows = this.db.prepare(sql).all(...params)

    // Parse JSON fields
    return rows.map(row => this._parseRow(row))
  }

  /**
   * Count total events matching filters
   * Used for pagination metadata
   */
  count(filters = {}) {
    const { interviewer_email, status, start_date, end_date, search } = filters

    let sql = 'SELECT COUNT(*) as total FROM interview_events WHERE 1=1'
    const params = []

    if (interviewer_email) {
      sql += ' AND interviewer_email = ?'
      params.push(interviewer_email)
    }

    if (status) {
      sql += ' AND status = ?'
      params.push(status)
    }

    if (start_date) {
      sql += ' AND date(start_time) >= date(?)'
      params.push(start_date)
    }

    if (end_date) {
      sql += ' AND date(end_time) <= date(?)'
      params.push(end_date)
    }

    if (search) {
      sql += ' AND (candidate_name LIKE ? OR position LIKE ? OR skills_assessed LIKE ?)'
      const searchPattern = `%${search}%`
      params.push(searchPattern, searchPattern, searchPattern)
    }

    const result = this.db.prepare(sql).get(...params)
    return result.total
  }

  /**
   * Find event by ID
   * @param {string} id - Event ID
   * @returns {Object|null} Event or null if not found
   */
  findById(id) {
    const sql = 'SELECT * FROM interview_events WHERE id = ?'
    const row = this.db.prepare(sql).get(id)

    return row ? this._parseRow(row) : null
  }

  /**
   * Find events by interviewer email
   * @param {string} email - Interviewer email
   * @returns {Array} Events for this interviewer
   */
  findByInterviewer(email) {
    const sql = `
      SELECT * FROM interview_events
      WHERE interviewer_email = ?
      ORDER BY start_time DESC
    `
    const rows = this.db.prepare(sql).all(email)

    return rows.map(row => this._parseRow(row))
  }

  /**
   * Create new event
   * @param {Object} data - Event data
   * @param {Object} auditContext - Audit context (user info)
   * @returns {Object} Created event
   */
  create(data, auditContext = {}) {
    const stmt = this.db.prepare(`
      INSERT INTO interview_events (
        id, interviewer_email, start_time, end_time, status,
        candidate_name, candidate_email, position, skills_assessed,
        feedback, rating, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)

    stmt.run(
      data.id,
      data.interviewer_email,
      data.start_time,
      data.end_time,
      data.status || 'pending',
      data.candidate_name,
      data.candidate_email || null,
      data.position,
      JSON.stringify(data.skills_assessed || []),
      data.feedback || null,
      data.rating || null,
      auditContext.userEmail || null
    )

    return this.findById(data.id)
  }

  /**
   * Update existing event
   * @param {string} id - Event ID
   * @param {Object} data - Updated fields
   * @param {Object} auditContext - Audit context
   * @returns {Object} Updated event
   */
  update(id, data, auditContext = {}) {
    const fields = []
    const params = []

    // Build dynamic UPDATE query
    if (data.interviewer_email !== undefined) {
      fields.push('interviewer_email = ?')
      params.push(data.interviewer_email)
    }
    if (data.start_time !== undefined) {
      fields.push('start_time = ?')
      params.push(data.start_time)
    }
    if (data.end_time !== undefined) {
      fields.push('end_time = ?')
      params.push(data.end_time)
    }
    if (data.status !== undefined) {
      fields.push('status = ?')
      params.push(data.status)
    }
    if (data.candidate_name !== undefined) {
      fields.push('candidate_name = ?')
      params.push(data.candidate_name)
    }
    if (data.candidate_email !== undefined) {
      fields.push('candidate_email = ?')
      params.push(data.candidate_email)
    }
    if (data.position !== undefined) {
      fields.push('position = ?')
      params.push(data.position)
    }
    if (data.skills_assessed !== undefined) {
      fields.push('skills_assessed = ?')
      params.push(JSON.stringify(data.skills_assessed))
    }
    if (data.feedback !== undefined) {
      fields.push('feedback = ?')
      params.push(data.feedback)
    }
    if (data.rating !== undefined) {
      fields.push('rating = ?')
      params.push(data.rating)
    }

    if (fields.length === 0) {
      // No fields to update
      return this.findById(id)
    }

    // Add updated_by
    fields.push('updated_by = ?')
    params.push(auditContext.userEmail || null)

    // Add ID to params
    params.push(id)

    const sql = `
      UPDATE interview_events
      SET ${fields.join(', ')}
      WHERE id = ?
    `

    this.db.prepare(sql).run(...params)

    return this.findById(id)
  }

  /**
   * Delete event
   * @param {string} id - Event ID
   * @returns {boolean} True if deleted
   */
  delete(id) {
    const stmt = this.db.prepare('DELETE FROM interview_events WHERE id = ?')
    const result = stmt.run(id)
    return result.changes > 0
  }

  /**
   * Get event statistics by status
   * @returns {Object} Count by status
   */
  getStatsByStatus() {
    const sql = `
      SELECT status, COUNT(*) as count
      FROM interview_events
      GROUP BY status
    `
    const rows = this.db.prepare(sql).all()

    return rows.reduce((acc, row) => {
      acc[row.status] = row.count
      return acc
    }, {})
  }

  /**
   * Parse database row to JavaScript object
   * Handles JSON parsing and type conversions
   * @private
   */
  _parseRow(row) {
    return {
      ...row,
      skills_assessed: JSON.parse(row.skills_assessed || '[]'),
      rating: row.rating !== null ? Number(row.rating) : null
    }
  }
}
