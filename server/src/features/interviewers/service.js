import { nanoid } from 'nanoid'
import { InterviewerRepository } from './repository.js'

/**
 * Interviewer Service
 * Business logic layer
 */
export class InterviewerService {
  constructor(db, auditLogger) {
    this.repository = new InterviewerRepository(db)
    this.auditLogger = auditLogger
  }

  /**
   * List interviewers with pagination
   * @param {Object} query
   * @returns {Object}
   */
  async list(query) {
    const filters = {
      role: query.role,
      is_active: query.is_active,
      search: query.search,
      limit: query.limit || 50,
      offset: query.offset || 0
    }

    const interviewers = this.repository.findAll(filters)
    const total = this.repository.count(filters)

    return {
      data: interviewers,
      pagination: {
        total,
        limit: filters.limit,
        offset: filters.offset,
        hasMore: filters.offset + filters.limit < total
      }
    }
  }

  /**
   * Get interviewer by ID
   * @param {string} id
   * @returns {Object|null}
   */
  async getById(id) {
    return this.repository.findById(id)
  }

  /**
   * Create new interviewer
   * @param {Object} data
   * @param {Object} auditContext
   * @returns {Object}
   */
  async create(data, auditContext) {
    // Check if email already exists
    const existing = this.repository.findByEmail(data.email)
    if (existing) {
      throw new Error('Email already exists')
    }

    const interviewer = {
      id: nanoid(),
      ...data,
      is_active: data.is_active ?? true,
      calendar_sync_enabled: data.calendar_sync_enabled ?? false
    }

    const created = this.repository.create(interviewer, auditContext)

    // Log audit event
    this.auditLogger?.log({
      action: 'CREATE_INTERVIEWER',
      entityType: 'interviewer',
      entityId: created.id,
      changes: { created: true },
      userEmail: auditContext?.userEmail,
      userName: auditContext?.userName
    })

    return created
  }

  /**
   * Update interviewer
   * @param {string} id
   * @param {Object} data
   * @param {Object} auditContext
   * @returns {Object|null}
   */
  async update(id, data, auditContext) {
    const existing = this.repository.findById(id)
    if (!existing) {
      return null
    }

    // If email is being changed, check for conflicts
    if (data.email && data.email !== existing.email) {
      const emailExists = this.repository.findByEmail(data.email)
      if (emailExists) {
        throw new Error('Email already exists')
      }
    }

    const updated = this.repository.update(id, data, auditContext)

    // Log audit event
    const changes = this._buildChanges(existing, data)
    if (Object.keys(changes).length > 0) {
      this.auditLogger?.log({
        action: 'UPDATE_INTERVIEWER',
        entityType: 'interviewer',
        entityId: id,
        changes,
        userEmail: auditContext?.userEmail,
        userName: auditContext?.userName
      })
    }

    return updated
  }

  /**
   * Delete interviewer
   * @param {string} id
   * @param {Object} auditContext
   * @returns {boolean}
   */
  async delete(id, auditContext) {
    const existing = this.repository.findById(id)
    if (!existing) {
      return false
    }

    const deleted = this.repository.delete(id)

    if (deleted) {
      // Log audit event
      this.auditLogger?.log({
        action: 'DELETE_INTERVIEWER',
        entityType: 'interviewer',
        entityId: id,
        changes: { email: existing.email, name: existing.name },
        userEmail: auditContext?.userEmail,
        userName: auditContext?.userName
      })
    }

    return deleted
  }

  /**
   * Build change set for audit log
   * @param {Object} original
   * @param {Object} updates
   * @returns {Object}
   */
  _buildChanges(original, updates) {
    const changes = {}

    Object.keys(updates).forEach(key => {
      if (updates[key] !== undefined && original[key] !== updates[key]) {
        changes[key] = {
          from: original[key],
          to: updates[key]
        }
      }
    })

    return changes
  }
}
