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
   * Check if an interview time slot is already taken for an interviewer on a specific date
   * Prevents duplicate time slots per interviewer per day
   * @param {string} interviewerEmail - Interviewer's email
   * @param {string} startTime - ISO datetime string
   * @param {string|null} excludeEventId - Event ID to exclude from check (for updates)
   * @returns {boolean} True if time conflict exists
   */
  checkTimeConflict(interviewerEmail, startTime, excludeEventId = null) {
    // Extract date and time from ISO string
    const date = new Date(startTime)
    const dayStart = new Date(date)
    dayStart.setHours(0, 0, 0, 0)
    const dayEnd = new Date(date)
    dayEnd.setHours(23, 59, 59, 999)

    // Extract HH:MM time for comparison
    const hours = date.getHours().toString().padStart(2, '0')
    const minutes = date.getMinutes().toString().padStart(2, '0')
    const timeString = `${hours}:${minutes}`

    let sql = `
      SELECT id FROM interview_events
      WHERE interviewer_email = ?
      AND start_time >= ?
      AND start_time < ?
      AND strftime('%H:%M', start_time) = ?
    `

    const params = [
      interviewerEmail,
      dayStart.toISOString(),
      dayEnd.toISOString(),
      timeString
    ]

    // Exclude current event when updating
    if (excludeEventId) {
      sql += ' AND id != ?'
      params.push(excludeEventId)
    }

    const result = this.db.prepare(sql).get(...params)
    return !!result
  }

  /**
   * Create new event
   * @param {Object} data - Event data
   * @param {Object} auditContext - Audit context (user info)
   * @returns {Object} Created event
   */
  create(data, auditContext = {}) {
    // Validate no time conflict exists
    if (data.start_time && data.interviewer_email) {
      const hasConflict = this.checkTimeConflict(data.interviewer_email, data.start_time)
      if (hasConflict) {
        throw new Error('This time slot is already booked for this interviewer')
      }
    }

    const stmt = this.db.prepare(`
      INSERT INTO interview_events (
        id, interviewer_email, calendar_event_id, start_time, end_time,
        skills_assessed, candidate_name, position, scheduled_date,
        duration_minutes, status, notes, marked_by, marked_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)

    stmt.run(
      data.id,
      data.interviewer_email,
      data.calendar_event_id || null,
      data.start_time,
      data.end_time,
      JSON.stringify(data.skills_assessed || []),
      data.candidate_name || null,
      data.position || null,
      data.scheduled_date || null,
      data.duration_minutes || null,
      data.status || 'pending',
      data.notes || null,
      data.marked_by || null,
      data.marked_at || null
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
    // Validate time conflict if start_time is being updated
    if (data.start_time !== undefined) {
      const event = this.findById(id)
      if (!event) {
        throw new Error('Event not found')
      }

      // Check conflict with the new time (excluding current event)
      const interviewerEmail = data.interviewer_email || event.interviewer_email
      const hasConflict = this.checkTimeConflict(interviewerEmail, data.start_time, id)
      if (hasConflict) {
        throw new Error('This time slot is already booked for this interviewer')
      }
    }

    const fields = []
    const params = []

    // Build dynamic UPDATE query
    if (data.interviewer_email !== undefined) {
      fields.push('interviewer_email = ?')
      params.push(data.interviewer_email)
    }
    if (data.calendar_event_id !== undefined) {
      fields.push('calendar_event_id = ?')
      params.push(data.calendar_event_id)
    }
    if (data.start_time !== undefined) {
      fields.push('start_time = ?')
      params.push(data.start_time)
    }
    if (data.end_time !== undefined) {
      fields.push('end_time = ?')
      params.push(data.end_time)
    }
    if (data.skills_assessed !== undefined) {
      fields.push('skills_assessed = ?')
      params.push(JSON.stringify(data.skills_assessed))
    }
    if (data.candidate_name !== undefined) {
      fields.push('candidate_name = ?')
      params.push(data.candidate_name)
    }
    if (data.position !== undefined) {
      fields.push('position = ?')
      params.push(data.position)
    }
    if (data.scheduled_date !== undefined) {
      fields.push('scheduled_date = ?')
      params.push(data.scheduled_date)
    }
    if (data.duration_minutes !== undefined) {
      fields.push('duration_minutes = ?')
      params.push(data.duration_minutes)
    }
    if (data.status !== undefined) {
      fields.push('status = ?')
      params.push(data.status)
    }
    if (data.notes !== undefined) {
      fields.push('notes = ?')
      params.push(data.notes)
    }
    if (data.marked_by !== undefined) {
      fields.push('marked_by = ?')
      params.push(data.marked_by)
    }
    if (data.marked_at !== undefined) {
      fields.push('marked_at = ?')
      params.push(data.marked_at)
    }

    if (fields.length === 0) {
      // No fields to update
      return this.findById(id)
    }

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
