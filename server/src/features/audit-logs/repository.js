/**
 * AuditLogRepository
 * Data access layer for audit_logs table
 *
 * Read-only repository - no create/update/delete methods
 * Audit logs are created automatically by the audit logger utility
 *
 * Handles:
 * - SQLite queries
 * - JSON field parsing (changes)
 * - Data transformation
 */
export class AuditLogRepository {
  constructor(db) {
    this.db = db
  }

  /**
   * Find all audit logs with optional filtering and pagination
   * @param {Object} filters - Filter options
   * @returns {Array} Audit logs with parsed JSON fields
   */
  findAll(filters = {}) {
    const {
      user_email,
      action,
      entity_type,
      entity_id,
      start_date,
      end_date,
      limit = 50,
      offset = 0
    } = filters

    let sql = 'SELECT * FROM audit_logs WHERE 1=1'
    const params = []

    // Filter by user
    if (user_email) {
      sql += ' AND user_email = ?'
      params.push(user_email)
    }

    // Filter by action
    if (action) {
      sql += ' AND action = ?'
      params.push(action)
    }

    // Filter by entity type
    if (entity_type) {
      sql += ' AND entity_type = ?'
      params.push(entity_type)
    }

    // Filter by entity ID
    if (entity_id) {
      sql += ' AND entity_id = ?'
      params.push(entity_id)
    }

    // Filter by date range
    if (start_date) {
      sql += ' AND date(timestamp) >= date(?)'
      params.push(start_date)
    }

    if (end_date) {
      sql += ' AND date(timestamp) <= date(?)'
      params.push(end_date)
    }

    // Order by timestamp (most recent first)
    sql += ' ORDER BY timestamp DESC LIMIT ? OFFSET ?'
    params.push(limit, offset)

    const rows = this.db.prepare(sql).all(...params)

    // Parse JSON fields
    return rows.map(row => this._parseRow(row))
  }

  /**
   * Count total audit logs matching filters
   * Used for pagination metadata
   */
  count(filters = {}) {
    const { user_email, action, entity_type, entity_id, start_date, end_date } =
      filters

    let sql = 'SELECT COUNT(*) as total FROM audit_logs WHERE 1=1'
    const params = []

    if (user_email) {
      sql += ' AND user_email = ?'
      params.push(user_email)
    }

    if (action) {
      sql += ' AND action = ?'
      params.push(action)
    }

    if (entity_type) {
      sql += ' AND entity_type = ?'
      params.push(entity_type)
    }

    if (entity_id) {
      sql += ' AND entity_id = ?'
      params.push(entity_id)
    }

    if (start_date) {
      sql += ' AND date(timestamp) >= date(?)'
      params.push(start_date)
    }

    if (end_date) {
      sql += ' AND date(timestamp) <= date(?)'
      params.push(end_date)
    }

    const result = this.db.prepare(sql).get(...params)
    return result.total
  }

  /**
   * Find audit log by ID
   * @param {string} id - Audit log ID
   * @returns {Object|null} Audit log or null if not found
   */
  findById(id) {
    const sql = 'SELECT * FROM audit_logs WHERE id = ?'
    const row = this.db.prepare(sql).get(id)

    return row ? this._parseRow(row) : null
  }

  /**
   * Find audit logs for specific entity
   * @param {string} entityType - Entity type (interviewer, event, user)
   * @param {string} entityId - Entity ID
   * @returns {Array} Audit logs for this entity
   */
  findByEntity(entityType, entityId) {
    const sql = `
      SELECT * FROM audit_logs
      WHERE entity_type = ? AND entity_id = ?
      ORDER BY timestamp DESC
    `
    const rows = this.db.prepare(sql).all(entityType, entityId)

    return rows.map(row => this._parseRow(row))
  }

  /**
   * Find audit logs by user
   * @param {string} userEmail - User email
   * @returns {Array} Audit logs for this user
   */
  findByUser(userEmail) {
    const sql = `
      SELECT * FROM audit_logs
      WHERE user_email = ?
      ORDER BY timestamp DESC
    `
    const rows = this.db.prepare(sql).all(userEmail)

    return rows.map(row => this._parseRow(row))
  }

  /**
   * Get audit log statistics by action type
   * @returns {Object} Count by action
   */
  getStatsByAction() {
    const sql = `
      SELECT action, COUNT(*) as count
      FROM audit_logs
      GROUP BY action
    `
    const rows = this.db.prepare(sql).all()

    return rows.reduce((acc, row) => {
      acc[row.action] = row.count
      return acc
    }, {})
  }

  /**
   * Get recent audit logs (last N entries)
   * @param {number} limit - Number of logs to return
   * @returns {Array} Recent audit logs
   */
  findRecent(limit = 50) {
    const sql = `
      SELECT * FROM audit_logs
      ORDER BY timestamp DESC
      LIMIT ?
    `
    const rows = this.db.prepare(sql).all(limit)

    return rows.map(row => this._parseRow(row))
  }

  /**
   * Parse database row to JavaScript object
   * Handles JSON parsing
   * @private
   */
  _parseRow(row) {
    return {
      ...row,
      changes: JSON.parse(row.changes || '{}')
    }
  }
}
