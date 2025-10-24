import routes from './routes.js'

/**
 * Users Feature Plugin (Issue #53)
 * Registers user management routes
 */
export default async function usersPlugin(fastify, _options) {
  // Register routes
  await fastify.register(routes, {
    prefix: '/users',
  })

  fastify.log.info('User management routes registered')
}
