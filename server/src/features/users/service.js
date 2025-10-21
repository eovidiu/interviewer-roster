/**
 * User Service
 * Business logic for user management (Issue #53)
 */
export class UserService {
  constructor(repository, auditLogger) {
    this.repository = repository
    this.auditLogger = auditLogger
  }

  /**
   * Get all users with pagination
   * @param {Object} filters
   * @returns {Object} { users, total, hasMore }
   */
  async listUsers(filters = {}) {
    const users = this.repository.findAll(filters)
    const total = this.repository.count(filters)
    const hasMore = (filters.offset || 0) + users.length < total

    return {
      users,
      total,
      hasMore,
    }
  }

  /**
   * Get user by ID
   * @param {string} id
   * @returns {Object|null}
   */
  async getUserById(id) {
    // Find user by ID (need to add findById to repository)
    // For now, we can search through all users
    const users = this.repository.findAll()
    return users.find(u => u.id === id) || null
  }

  /**
   * Update user role
   * @param {string} email
   * @param {string} newRole
   * @param {Object} adminUser - User making the change
   * @returns {Object} Updated user
   */
  async updateUserRole(email, newRole, adminUser) {
    const user = this.repository.findByEmail(email)

    if (!user) {
      throw new Error('User not found')
    }

    const oldRole = user.role

    // Update role
    const updatedUser = this.repository.updateRole(email, newRole)

    // Log role change in audit log
    await this.auditLogger.logRoleChange({
      userEmail: adminUser.email,
      userName: adminUser.name,
      targetEmail: email,
      targetId: user.id,
      oldRole,
      newRole,
    })

    return updatedUser
  }
}
