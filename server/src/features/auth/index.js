import routes from './routes.js'

/**
 * Auth Feature Plugin
 * Registers authentication routes
 */
export default async function authRoutesPlugin(fastify, _options) {
  // Register routes with service injected
  await fastify.register(routes, {
    prefix: '/auth',
  })

  fastify.log.info('Auth routes registered')
}
