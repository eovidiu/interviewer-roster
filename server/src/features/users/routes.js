/**
 * User Management Routes (Issue #53)
 * Admin-only endpoints for managing user roles
 */
import { UserRepository } from './repository.js'
import { UserService } from './service.js'

export default async function userRoutes(fastify, options) {
  const userRepository = new UserRepository(fastify.db)
  const userService = new UserService(userRepository, fastify.auditLogger)

  /**
   * GET /api/users
   * List all users (admin only)
   */
  fastify.get(
    '/',
    {
      schema: {
        description: 'List all users',
        tags: ['users'],
        query: {
          type: 'object',
          properties: {
            role: { type: 'string', enum: ['viewer', 'talent', 'admin'] },
            search: { type: 'string' },
            limit: { type: 'integer', minimum: 1, maximum: 100, default: 50 },
            offset: { type: 'integer', minimum: 0, default: 0 },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              users: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'string' },
                    email: { type: 'string' },
                    name: { type: 'string' },
                    role: { type: 'string' },
                    picture: { type: 'string', nullable: true },
                    last_login_at: { type: 'string', nullable: true },
                    created_at: { type: 'string' },
                  },
                },
              },
              total: { type: 'integer' },
              hasMore: { type: 'boolean' },
            },
          },
        },
      },
      preHandler: fastify.authenticate,
    },
    async (request, reply) => {
      // Check if user is admin
      if (request.user.role !== 'admin') {
        return reply.code(403).send({ error: 'Admin access required' })
      }

      const result = await userService.listUsers(request.query)
      return result
    }
  )

  /**
   * PATCH /api/users/:email/role
   * Update user role (admin only)
   */
  fastify.patch(
    '/:email/role',
    {
      schema: {
        description: 'Update user role',
        tags: ['users'],
        params: {
          type: 'object',
          required: ['email'],
          properties: {
            email: { type: 'string', format: 'email' },
          },
        },
        body: {
          type: 'object',
          required: ['role'],
          properties: {
            role: { type: 'string', enum: ['viewer', 'talent', 'admin'] },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              email: { type: 'string' },
              name: { type: 'string' },
              role: { type: 'string' },
              updated_at: { type: 'string' },
            },
          },
        },
      },
      preHandler: fastify.authenticate,
    },
    async (request, reply) => {
      // Check if user is admin
      if (request.user.role !== 'admin') {
        return reply.code(403).send({ error: 'Admin access required' })
      }

      try {
        const updatedUser = await userService.updateUserRole(
          request.params.email,
          request.body.role,
          request.user
        )

        return updatedUser
      } catch (error) {
        if (error.message === 'User not found') {
          return reply.code(404).send({ error: error.message })
        }
        throw error
      }
    }
  )
}
