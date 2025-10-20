/**
 * Authentication Routes
 * Mock authentication for development
 *
 * In production, this would integrate with Google OAuth
 */

export default async function authRoutes(fastify, options) {
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

      // Mock: Determine role based on email
      // In production, this would come from a database or OAuth provider
      let role = 'viewer'
      if (email === 'eovidiu@gmail.com') {
        role = 'admin'
      } else if (email.includes('admin')) {
        role = 'admin'
      } else if (email.includes('talent')) {
        role = 'talent'
      }

      // Generate JWT token
      const token = fastify.jwt.sign(
        {
          email,
          name: name || email.split('@')[0],
          role,
        },
        {
          expiresIn: '7d',
        }
      )

      return {
        token,
        user: {
          email,
          name: name || email.split('@')[0],
          role,
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
