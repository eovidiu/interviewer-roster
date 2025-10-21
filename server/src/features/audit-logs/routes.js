import {
  AuditLogSchema,
  ListAuditLogsQuerySchema,
  AuditLogIdParamSchema,
  ListAuditLogsResponseSchema
} from './schemas.js'

/**
 * Audit Log Routes
 * HTTP endpoints for audit logs (read-only)
 *
 * All routes require authentication
 * Admin users can see all logs
 * Regular users can only see their own logs
 */
export default async function auditLogRoutes(fastify, options) {
  const service = options.service

  /**
   * GET /api/audit-logs
   * List all audit logs with optional filtering and pagination
   *
   * Query params:
   * - user_email: Filter by user
   * - action: Filter by action
   * - entity_type: Filter by entity type (interviewer|event|user)
   * - entity_id: Filter by entity ID
   * - start_date: Filter by start date (YYYY-MM-DD)
   * - end_date: Filter by end date (YYYY-MM-DD)
   * - limit: Results per page (default: 50, max: 100)
   * - offset: Pagination offset (default: 0)
   */
  fastify.get(
    '/',
    {
      schema: {
        description: 'List all audit logs with optional filtering',
        tags: ['audit-logs'],
        querystring: ListAuditLogsQuerySchema,
        response: {
          200: ListAuditLogsResponseSchema
        }
      },
      preHandler: fastify.authenticate
    },
    async (request, reply) => {
      const filters = { ...request.query }

      // Non-admin users can only see their own logs
      if (request.user.role !== 'admin') {
        filters.user_email = request.user.email
      }

      const result = await service.list(filters)
      return result
    }
  )

  /**
   * GET /api/audit-logs/stats
   * Get audit log statistics by action type
   *
   * Admin only
   */
  fastify.get(
    '/stats',
    {
      schema: {
        description: 'Get audit log statistics by action',
        tags: ['audit-logs'],
        response: {
          200: {
            type: 'object',
            additionalProperties: { type: 'number' }
          }
        }
      },
      preHandler: fastify.authorize(['admin'])
    },
    async (request, reply) => {
      const stats = await service.getStats()
      return stats
    }
  )

  /**
   * GET /api/audit-logs/recent
   * Get recent audit logs (last 50 by default)
   *
   * Admin only
   */
  fastify.get(
    '/recent',
    {
      schema: {
        description: 'Get recent audit logs',
        tags: ['audit-logs'],
        querystring: {
          type: 'object',
          properties: {
            limit: {
              type: 'integer',
              minimum: 1,
              maximum: 100,
              default: 50
            }
          }
        },
        response: {
          200: {
            type: 'array',
            items: AuditLogSchema
          }
        }
      },
      preHandler: fastify.authorize(['admin'])
    },
    async (request, reply) => {
      const limit = request.query.limit || 50
      const logs = await service.getRecent(limit)
      return logs
    }
  )

  /**
   * GET /api/audit-logs/:id
   * Get single audit log by ID
   */
  fastify.get(
    '/:id',
    {
      schema: {
        description: 'Get audit log by ID',
        tags: ['audit-logs'],
        params: AuditLogIdParamSchema,
        response: {
          200: AuditLogSchema,
          404: {
            type: 'object',
            properties: {
              error: { type: 'string' },
              message: { type: 'string' }
            }
          }
        }
      },
      preHandler: fastify.authenticate
    },
    async (request, reply) => {
      try {
        const log = await service.getById(request.params.id)

        // Non-admin users can only see their own logs
        if (request.user.role !== 'admin' && log.user_email !== request.user.email) {
          reply.code(403)
          return {
            error: 'Forbidden',
            message: 'You can only view your own audit logs'
          }
        }

        return log
      } catch (error) {
        if (error.message === 'Audit log not found') {
          reply.code(404)
          return {
            error: 'Not Found',
            message: error.message
          }
        }
        throw error
      }
    }
  )
}
