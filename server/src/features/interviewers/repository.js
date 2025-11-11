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
    const {
      role,
      is_active,
      search,
      limit = 50,
      offset = 0,
      // Migration 003 filters
      org,
      manager,
      profile_backend,
      profile_big_data,
      profile_frontend,
      profile_fullstack,
      profile_sre,
      profile_cse,
      profile_ml,
      profile_em,
      min_level,
      max_level,
      onboarding_completed,
      is_remote
    } = filters

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

    // Migration 003 filters
    if (org) {
      sql += ' AND org = ?'
      params.push(org)
    }

    if (manager) {
      sql += ' AND manager = ?'
      params.push(manager)
    }

    if (typeof profile_backend === 'boolean') {
      sql += ' AND profile_backend = ?'
      params.push(profile_backend ? 1 : 0)
    }

    if (typeof profile_big_data === 'boolean') {
      sql += ' AND profile_big_data = ?'
      params.push(profile_big_data ? 1 : 0)
    }

    if (typeof profile_frontend === 'boolean') {
      sql += ' AND profile_frontend = ?'
      params.push(profile_frontend ? 1 : 0)
    }

    if (typeof profile_fullstack === 'boolean') {
      sql += ' AND profile_fullstack = ?'
      params.push(profile_fullstack ? 1 : 0)
    }

    if (typeof profile_sre === 'boolean') {
      sql += ' AND profile_sre = ?'
      params.push(profile_sre ? 1 : 0)
    }

    if (typeof profile_cse === 'boolean') {
      sql += ' AND profile_cse = ?'
      params.push(profile_cse ? 1 : 0)
    }

    if (typeof profile_ml === 'boolean') {
      sql += ' AND profile_ml = ?'
      params.push(profile_ml ? 1 : 0)
    }

    if (typeof profile_em === 'boolean') {
      sql += ' AND profile_em = ?'
      params.push(profile_em ? 1 : 0)
    }

    if (typeof min_level === 'number') {
      sql += ' AND max_level >= ?'
      params.push(min_level)
    }

    if (typeof max_level === 'number') {
      sql += ' AND max_level <= ?'
      params.push(max_level)
    }

    if (typeof onboarding_completed === 'boolean') {
      sql += ' AND onboarding_completed = ?'
      params.push(onboarding_completed ? 1 : 0)
    }

    if (typeof is_remote === 'boolean') {
      sql += ' AND is_remote = ?'
      params.push(is_remote ? 1 : 0)
    }

    sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?'
    params.push(limit, offset)

    const rows = this.db.prepare(sql).all(...params)

    return rows.map(row => this._mapRowToInterviewer(row))
  }

  /**
   * Find interviewer by ID
   * @param {string} id
   * @returns {Object|null}
   */
  findById(id) {
    const row = this.db.prepare('SELECT * FROM interviewers WHERE id = ?').get(id)

    if (!row) return null

    return this._mapRowToInterviewer(row)
  }

  /**
   * Find interviewer by email
   * @param {string} email
   * @returns {Object|null}
   */
  findByEmail(email) {
    const row = this.db.prepare('SELECT * FROM interviewers WHERE email = ?').get(email)

    if (!row) return null

    return this._mapRowToInterviewer(row)
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
        calendar_sync_enabled, timezone, created_by,
        date_in, manager, check_manager, org,
        profile_backend, profile_big_data, profile_frontend, profile_fullstack,
        profile_sre, profile_cse, profile_ml, profile_em,
        max_level, check_level, pause_until,
        is_shadowing, onboarding_completed, is_remote
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)

    stmt.run(
      data.id,
      data.name,
      data.email,
      data.role,
      JSON.stringify(data.skills),
      data.is_active ? 1 : 0,
      data.calendar_sync_enabled ? 1 : 0,
      data.timezone || null,
      auditContext?.userEmail || null,
      // Migration 003 fields
      data.date_in || null,
      data.manager || null,
      data.check_manager ? 1 : 0,
      data.org || null,
      data.profile_backend ? 1 : 0,
      data.profile_big_data ? 1 : 0,
      data.profile_frontend ? 1 : 0,
      data.profile_fullstack ? 1 : 0,
      data.profile_sre ? 1 : 0,
      data.profile_cse ? 1 : 0,
      data.profile_ml ? 1 : 0,
      data.profile_em ? 1 : 0,
      data.max_level || null,
      data.check_level || null,
      data.pause_until || null,
      data.is_shadowing ? 1 : 0,
      data.onboarding_completed ? 1 : 0,
      data.is_remote ? 1 : 0
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

    // Build dynamic UPDATE query - base fields + migration 003 fields
    const allowedFields = [
      'name',
      'email',
      'role',
      'skills',
      'is_active',
      'calendar_sync_enabled',
      'timezone',
      // Migration 003 fields
      'date_in',
      'manager',
      'check_manager',
      'org',
      'profile_backend',
      'profile_big_data',
      'profile_frontend',
      'profile_fullstack',
      'profile_sre',
      'profile_cse',
      'profile_ml',
      'profile_em',
      'max_level',
      'check_level',
      'pause_until',
      'is_shadowing',
      'onboarding_completed',
      'is_remote'
    ]

    const booleanFields = [
      'is_active',
      'calendar_sync_enabled',
      'check_manager',
      'profile_backend',
      'profile_big_data',
      'profile_frontend',
      'profile_fullstack',
      'profile_sre',
      'profile_cse',
      'profile_ml',
      'profile_em',
      'is_shadowing',
      'onboarding_completed',
      'is_remote'
    ]

    allowedFields.forEach(field => {
      if (data[field] !== undefined) {
        fields.push(`${field} = ?`)

        if (field === 'skills') {
          values.push(JSON.stringify(data[field]))
        } else if (booleanFields.includes(field)) {
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
    const {
      role,
      is_active,
      search,
      // Migration 003 filters
      org,
      manager,
      profile_backend,
      profile_big_data,
      profile_frontend,
      profile_fullstack,
      profile_sre,
      profile_cse,
      profile_ml,
      profile_em,
      min_level,
      max_level,
      onboarding_completed,
      is_remote
    } = filters

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

    // Migration 003 filters (same as findAll)
    if (org) {
      sql += ' AND org = ?'
      params.push(org)
    }

    if (manager) {
      sql += ' AND manager = ?'
      params.push(manager)
    }

    if (typeof profile_backend === 'boolean') {
      sql += ' AND profile_backend = ?'
      params.push(profile_backend ? 1 : 0)
    }

    if (typeof profile_big_data === 'boolean') {
      sql += ' AND profile_big_data = ?'
      params.push(profile_big_data ? 1 : 0)
    }

    if (typeof profile_frontend === 'boolean') {
      sql += ' AND profile_frontend = ?'
      params.push(profile_frontend ? 1 : 0)
    }

    if (typeof profile_fullstack === 'boolean') {
      sql += ' AND profile_fullstack = ?'
      params.push(profile_fullstack ? 1 : 0)
    }

    if (typeof profile_sre === 'boolean') {
      sql += ' AND profile_sre = ?'
      params.push(profile_sre ? 1 : 0)
    }

    if (typeof profile_cse === 'boolean') {
      sql += ' AND profile_cse = ?'
      params.push(profile_cse ? 1 : 0)
    }

    if (typeof profile_ml === 'boolean') {
      sql += ' AND profile_ml = ?'
      params.push(profile_ml ? 1 : 0)
    }

    if (typeof profile_em === 'boolean') {
      sql += ' AND profile_em = ?'
      params.push(profile_em ? 1 : 0)
    }

    if (typeof min_level === 'number') {
      sql += ' AND max_level >= ?'
      params.push(min_level)
    }

    if (typeof max_level === 'number') {
      sql += ' AND max_level <= ?'
      params.push(max_level)
    }

    if (typeof onboarding_completed === 'boolean') {
      sql += ' AND onboarding_completed = ?'
      params.push(onboarding_completed ? 1 : 0)
    }

    if (typeof is_remote === 'boolean') {
      sql += ' AND is_remote = ?'
      params.push(is_remote ? 1 : 0)
    }

    const result = this.db.prepare(sql).get(...params)
    return result.count
  }

  /**
   * Map database row to interviewer object
   * Converts SQLite integer booleans to JS booleans and parses JSON fields
   * @param {Object} row
   * @returns {Object}
   * @private
   */
  _mapRowToInterviewer(row) {
    return {
      ...row,
      skills: JSON.parse(row.skills || '[]'),
      // Base boolean fields
      is_active: Boolean(row.is_active),
      calendar_sync_enabled: Boolean(row.calendar_sync_enabled),
      // Migration 003 boolean fields
      check_manager: Boolean(row.check_manager),
      profile_backend: Boolean(row.profile_backend),
      profile_big_data: Boolean(row.profile_big_data),
      profile_frontend: Boolean(row.profile_frontend),
      profile_fullstack: Boolean(row.profile_fullstack),
      profile_sre: Boolean(row.profile_sre),
      profile_cse: Boolean(row.profile_cse),
      profile_ml: Boolean(row.profile_ml),
      profile_em: Boolean(row.profile_em),
      is_shadowing: Boolean(row.is_shadowing),
      onboarding_completed: Boolean(row.onboarding_completed),
      is_remote: Boolean(row.is_remote)
    }
  }
}
