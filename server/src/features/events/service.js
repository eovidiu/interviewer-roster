import { nanoid } from 'nanoid'
import { EventRepository } from './repository.js'

/**
 * EventService
 * Business logic layer for interview events
 *
 * Handles:
 * - Validation rules
 * - Business constraints
 * - Audit logging
 * - Data transformation
 */
export class EventService {
  constructor(db, auditLogger) {
    this.repository = new EventRepository(db)
    this.auditLogger = auditLogger
  }

  /**
   * List events with pagination
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
   * Get event by ID
   * @param {string} id - Event ID
   * @returns {Object} Event
   * @throws {Error} If not found
   */
  async getById(id) {
    const event = this.repository.findById(id)

    if (!event) {
      throw new Error('Event not found')
    }

    return event
  }

  /**
   * Get events for specific interviewer
   * @param {string} email - Interviewer email
   * @returns {Array} Events
   */
  async getByInterviewer(email) {
    return this.repository.findByInterviewer(email)
  }

  /**
   * Create new event
   * @param {Object} data - Event data
   * @param {Object} auditContext - User info for audit
   * @returns {Object} Created event
   * @throws {Error} If validation fails
   */
  async create(data, auditContext = {}) {
    // Validate time range
    const startTime = new Date(data.start_time)
    const endTime = new Date(data.end_time)

    if (startTime >= endTime) {
      throw new Error('End time must be after start time')
    }

    // Validate future dates (optional - can comment out for past events)
    // const now = new Date()
    // if (startTime < now) {
    //   throw new Error('Cannot create events in the past')
    // }

    // Validate rating if provided
    if (data.rating !== undefined && data.rating !== null) {
      if (data.rating < 1 || data.rating > 5) {
        throw new Error('Rating must be between 1 and 5')
      }
    }

    const event = {
      id: nanoid(),
      ...data,
      status: data.status || 'pending'
    }

    const created = this.repository.create(event, auditContext)

    // Log audit event
    this.auditLogger?.log({
      action: 'CREATE_EVENT',
      entityType: 'event',
      entityId: created.id,
      changes: { created: true },
      userEmail: auditContext.userEmail,
      userName: auditContext.userName
    })

    return created
  }

  /**
   * Update existing event
   * @param {string} id - Event ID
   * @param {Object} data - Updated fields
   * @param {Object} auditContext - User info for audit
   * @returns {Object} Updated event
   * @throws {Error} If not found or validation fails
   */
  async update(id, data, auditContext = {}) {
    // Check if event exists
    const existing = this.repository.findById(id)
    if (!existing) {
      throw new Error('Event not found')
    }

    // Validate time range if both times provided
    if (data.start_time && data.end_time) {
      const startTime = new Date(data.start_time)
      const endTime = new Date(data.end_time)

      if (startTime >= endTime) {
        throw new Error('End time must be after start time')
      }
    }

    // Validate time range if only one time is updated
    if (data.start_time && !data.end_time) {
      const startTime = new Date(data.start_time)
      const endTime = new Date(existing.end_time)

      if (startTime >= endTime) {
        throw new Error('Start time must be before existing end time')
      }
    }

    if (data.end_time && !data.start_time) {
      const startTime = new Date(existing.start_time)
      const endTime = new Date(data.end_time)

      if (startTime >= endTime) {
        throw new Error('End time must be after existing start time')
      }
    }

    // Validate rating if provided
    if (data.rating !== undefined && data.rating !== null) {
      if (data.rating < 1 || data.rating > 5) {
        throw new Error('Rating must be between 1 and 5')
      }
    }

    const updated = this.repository.update(id, data, auditContext)

    // Log audit event
    this.auditLogger?.log({
      action: 'UPDATE_EVENT',
      entityType: 'event',
      entityId: id,
      changes: data,
      userEmail: auditContext.userEmail,
      userName: auditContext.userName
    })

    return updated
  }

  /**
   * Delete event
   * @param {string} id - Event ID
   * @param {Object} auditContext - User info for audit
   * @returns {boolean} True if deleted
   * @throws {Error} If not found
   */
  async delete(id, auditContext = {}) {
    // Check if event exists
    const existing = this.repository.findById(id)
    if (!existing) {
      throw new Error('Event not found')
    }

    const deleted = this.repository.delete(id)

    // Log audit event
    this.auditLogger?.log({
      action: 'DELETE_EVENT',
      entityType: 'event',
      entityId: id,
      changes: { deleted: true },
      userEmail: auditContext.userEmail,
      userName: auditContext.userName
    })

    return deleted
  }

  /**
   * Get event statistics
   * @returns {Object} Statistics by status
   */
  async getStats() {
    return this.repository.getStatsByStatus()
  }
}
