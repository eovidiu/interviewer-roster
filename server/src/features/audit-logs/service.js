import { AuditLogRepository } from './repository.js'

/**
 * AuditLogService
 * Business logic layer for audit logs
 *
 * Read-only service - no create/update/delete methods
 * Audit logs are created automatically by the AuditLogger utility
 *
 * Handles:
 * - Data retrieval
 * - Filtering logic
 * - Pagination
 */
export class AuditLogService {
  constructor(db) {
    this.repository = new AuditLogRepository(db)
  }

  /**
   * List audit logs with pagination
   * @param {Object} filters - Filter options
   * @returns {Object} { data, pagination }
   */
  async list(filters = {}) {
    const { limit = 50, offset = 0 } = filters

    const data = this.repository.findAll(filters)
    const total = this.repository.count(filters)

    return {
      data,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total
      }
    }
  }

  /**
   * Get audit log by ID
   * @param {string} id - Audit log ID
   * @returns {Object} Audit log
   * @throws {Error} If not found
   */
  async getById(id) {
    const log = this.repository.findById(id)

    if (!log) {
      throw new Error('Audit log not found')
    }

    return log
  }

  /**
   * Get audit logs for specific entity
   * @param {string} entityType - Entity type
   * @param {string} entityId - Entity ID
   * @returns {Array} Audit logs
   */
  async getByEntity(entityType, entityId) {
    return this.repository.findByEntity(entityType, entityId)
  }

  /**
   * Get audit logs by user
   * @param {string} userEmail - User email
   * @returns {Array} Audit logs
   */
  async getByUser(userEmail) {
    return this.repository.findByUser(userEmail)
  }

  /**
   * Get audit log statistics
   * @returns {Object} Statistics by action
   */
  async getStats() {
    return this.repository.getStatsByAction()
  }

  /**
   * Get recent audit logs
   * @param {number} limit - Number of logs
   * @returns {Array} Recent logs
   */
  async getRecent(limit = 50) {
    return this.repository.findRecent(limit)
  }
}
