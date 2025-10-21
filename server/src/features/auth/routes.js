/**
 * Authentication Routes
 * Database-driven authentication (Issue #53)
 *
 * In production, this would integrate with Google OAuth
 */
import { randomUUID } from 'node:crypto'
import { UserRepository } from '../users/repository.js'

export default async function authRoutes(fastify, options) {
  const userRepository = new UserRepository(fastify.db)
  /**
   * POST /api/auth/login
   * Mock login endpoint for development
   *
   * In development, accepts any email and returns JWT
   * In production, this would verify Google OAuth token
   */
  fastify.post(
    '/login',
    {
      schema: {
        description: 'Login (mock for development)',
        tags: ['auth'],
        body: {
          type: 'object',
          required: ['email'],
          properties: {
            email: { type: 'string', format: 'email' },
            name: { type: 'string' },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              token: { type: 'string' },
              user: {
                type: 'object',
                properties: {
                  email: { type: 'string' },
                  name: { type: 'string' },
                  role: { type: 'string' },
                },
              },
            },
          },
        },
      },
    },
    async (request, reply) => {
      const { email, name } = request.body

      // Find or create user in database (Issue #53)
      let user = userRepository.findByEmail(email)

      if (!user) {
        // Create new user with default role (viewer)
        // Special case: eovidiu@gmail.com gets admin role
        const role = email === 'eovidiu@gmail.com' ? 'admin' : 'viewer'

        user = userRepository.create({
          email,
          name: name || email.split('@')[0],
          role,
        })

        // Log user creation in audit log
        await fastify.db
          .prepare(
            `INSERT INTO audit_logs (id, user_email, user_name, action, entity_type, entity_id, changes, timestamp)
             VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))`
          )
          .run(
            randomUUID(),
            email,
            user.name,
            'CREATE_USER',
            'user',
            user.id,
            JSON.stringify({ role: user.role })
          )
      } else {
        // Update last login timestamp
        userRepository.updateLastLogin(email)
      }

      // Generate JWT token with user data from database
      const token = fastify.jwt.sign(
        {
          email: user.email,
          name: user.name,
          role: user.role,
        },
        {
          expiresIn: '7d',
        }
      )

      return {
        token,
        user: {
          email: user.email,
          name: user.name,
          role: user.role,
        },
      }
    }
  )

  /**
   * GET /api/auth/me
   * Get current user from JWT
   */
  fastify.get(
    '/me',
    {
      schema: {
        description: 'Get current user',
        tags: ['auth'],
        response: {
          200: {
            type: 'object',
            properties: {
              email: { type: 'string' },
              name: { type: 'string' },
              role: { type: 'string' },
            },
          },
        },
      },
      preHandler: fastify.authenticate,
    },
    async (request, reply) => {
      return request.user
    }
  )
}
