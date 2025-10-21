import { nanoid } from 'nanoid'

/**
 * Audit Logger Utility
 * Logs all database changes to audit_logs table
 */
export class AuditLogger {
  constructor(db) {
    this.db = db
  }

  /**
   * Log an audit event
   * @param {Object} event
   */
  log(event) {
    const { action, entityType, entityId, changes, userEmail, userName } = event

    const stmt = this.db.prepare(`
      INSERT INTO audit_logs (id, user_email, user_name, action, entity_type, entity_id, changes)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `)

    stmt.run(
      nanoid(),
      userEmail || 'system',
      userName || 'System',
      action,
      entityType,
      entityId,
      JSON.stringify(changes)
    )
  }

  /**
   * Log role change (Issue #53)
   * @param {Object} params
   */
  logRoleChange({ userEmail, userName, targetEmail, targetId, oldRole, newRole }) {
    this.log({
      action: 'UPDATE_USER_ROLE',
      entityType: 'user',
      entityId: targetId,
      userEmail,
      userName,
      changes: {
        email: targetEmail,
        role: {
          from: oldRole,
          to: newRole,
        },
      },
    })
  }
}
