import { AuditLogService } from './service.js'
import routes from './routes.js'

/**
 * Audit Logs Feature Plugin
 * Registers audit log routes and services (read-only)
 *
 * This is a standard Fastify plugin (not wrapped with fastify-plugin)
 * so it creates an encapsulated context for the feature.
 *
 * Dependencies:
 * - fastify.db (database plugin)
 * - fastify.authenticate (JWT auth)
 * - fastify.authorize (role-based auth)
 */
export default async function auditLogsPlugin(fastify, options) {
  // Create service instance with dependencies
  const service = new AuditLogService(fastify.db)

  // Register routes with service injected
  await fastify.register(routes, {
    prefix: '/audit-logs',
    service
  })

  fastify.log.info('Audit logs feature registered')
}
