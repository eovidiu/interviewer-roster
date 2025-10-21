import { EventService } from './service.js'
import routes from './routes.js'

/**
 * Events Feature Plugin
 * Registers event management routes and services
 *
 * This is a standard Fastify plugin (not wrapped with fastify-plugin)
 * so it creates an encapsulated context for the feature.
 *
 * Dependencies:
 * - fastify.db (database plugin)
 * - fastify.auditLogger (audit logging)
 * - fastify.authenticate (JWT auth)
 * - fastify.authorize (role-based auth)
 */
export default async function eventsPlugin(fastify, options) {
  // Create service instance with dependencies
  const service = new EventService(fastify.db, fastify.auditLogger)

  // Register routes with service injected
  await fastify.register(routes, {
    prefix: '/events',
    service
  })

  fastify.log.info('Events feature registered')
}
