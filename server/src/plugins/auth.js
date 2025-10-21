import fp from 'fastify-plugin'
import jwt from '@fastify/jwt'
import config from '../config/index.js'

/**
 * Authentication plugin using JWT
 * Provides JWT signing/verification and authentication decorator
 *
 * @param {import('fastify').FastifyInstance} fastify
 * @param {Object} options
 */
async function authPlugin(fastify, options) {
  // Register JWT
  await fastify.register(jwt, {
    secret: config.jwt.secret,
    sign: {
      expiresIn: config.jwt.expiresIn
    }
  })

  // Decorator: authenticate requests
  fastify.decorate('authenticate', async function (request, reply) {
    try {
      await request.jwtVerify()
    } catch (err) {
      reply.send(err)
    }
  })

  // Decorator: check role authorization
  fastify.decorate('authorize', (allowedRoles) => {
    return async function (request, reply) {
      await fastify.authenticate(request, reply)

      const userRole = request.user.role

      if (!allowedRoles.includes(userRole)) {
        reply.code(403).send({
          error: 'Forbidden',
          message: `Role '${userRole}' is not allowed to access this resource`
        })
      }
    }
  })

  fastify.log.info('JWT authentication plugin registered')
}

export default fp(authPlugin, {
  name: 'auth',
  dependencies: []
})
