/**
 * Authentication Routes
 * Google OAuth 2.0 integration (Issue #55)
 */
import { randomUUID } from 'node:crypto'
import { OAuth2Client } from 'google-auth-library'
import { UserRepository } from '../users/repository.js'

export default async function authRoutes(fastify, options) {
  const userRepository = new UserRepository(fastify.db)

  // Initialize Google OAuth client
  const oauth2Client = new OAuth2Client(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  )

  /**
   * GET /api/auth/google
   * Initiate Google OAuth flow
   */
  fastify.get(
    '/google',
    {
      schema: {
        description: 'Initiate Google OAuth login',
        tags: ['auth'],
        querystring: {
          type: 'object',
          properties: {
            returnUrl: { type: 'string' },
          },
        },
      },
    },
    async (request, reply) => {
      // Generate authorization URL
      const authorizeUrl = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: [
          'openid',
          'https://www.googleapis.com/auth/userinfo.profile',
          'https://www.googleapis.com/auth/userinfo.email',
        ],
        // Include state parameter for CSRF protection
        state: JSON.stringify({
          returnUrl: request.query.returnUrl || '/',
          timestamp: Date.now(),
        }),
      })

      return reply.redirect(authorizeUrl)
    }
  )

  /**
   * GET /api/auth/google/callback
   * Handle Google OAuth callback
   */
  fastify.get(
    '/google/callback',
    {
      schema: {
        description: 'Google OAuth callback',
        tags: ['auth'],
        querystring: {
          type: 'object',
          properties: {
            code: { type: 'string' },
            state: { type: 'string' },
            error: { type: 'string' },
          },
        },
      },
    },
    async (request, reply) => {
      const { code, state, error } = request.query

      // Handle OAuth errors
      if (error) {
        fastify.log.error('OAuth error:', error)
        return reply.redirect(`${process.env.CORS_ORIGIN}/login?error=${encodeURIComponent(error)}`)
      }

      if (!code) {
        return reply.redirect(`${process.env.CORS_ORIGIN}/login?error=no_code`)
      }

      try {
        // Exchange authorization code for tokens
        const { tokens } = await oauth2Client.getToken(code)
        oauth2Client.setCredentials(tokens)

        // Verify ID token and get user info
        const ticket = await oauth2Client.verifyIdToken({
          idToken: tokens.id_token,
          audience: process.env.GOOGLE_CLIENT_ID,
        })

        const payload = ticket.getPayload()
        const email = payload.email
        const name = payload.name || email.split('@')[0]
        const picture = payload.picture

        if (!email) {
          throw new Error('Email not provided by Google')
        }

        // Find or create user in database
        let user = userRepository.findByEmail(email)

        if (!user) {
          // Create new user with default role (viewer)
          // Special case: eovidiu@gmail.com gets admin role
          const role = email === 'eovidiu@gmail.com' ? 'admin' : 'viewer'

          user = userRepository.create({
            email,
            name,
            role,
            picture,
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
              JSON.stringify({ role: user.role, oauth_provider: 'google' })
            )

          fastify.log.info(`New user created via OAuth: ${email} (${role})`)
        } else {
          // Update last login timestamp and picture
          userRepository.updateLastLogin(email)

          // Update picture if changed
          if (picture && picture !== user.picture) {
            fastify.db
              .prepare('UPDATE users SET picture = ?, updated_at = datetime(\'now\') WHERE email = ?')
              .run(picture, email)

            // Re-fetch user to get updated picture
            user = userRepository.findByEmail(email)
          }

          fastify.log.info(`User logged in via OAuth: ${email}`)
        }

        // Generate JWT token with user data from database
        const jwtToken = fastify.jwt.sign(
          {
            email: user.email,
            name: user.name,
            role: user.role,
            picture: user.picture,
          },
          {
            expiresIn: '7d',
          }
        )

        // Parse state to get return URL
        let returnUrl = '/'
        try {
          const stateData = JSON.parse(state || '{}')
          returnUrl = stateData.returnUrl || '/'
        } catch (err) {
          fastify.log.warn('Failed to parse state parameter:', err)
        }

        // Redirect to frontend with token
        const redirectUrl = `${process.env.CORS_ORIGIN}/auth/callback?token=${jwtToken}&returnUrl=${encodeURIComponent(returnUrl)}`
        return reply.redirect(redirectUrl)
      } catch (err) {
        console.error('Full OAuth error object:', err)
        fastify.log.error('OAuth callback error:', err.message)
        fastify.log.error('Error stack:', err.stack)
        fastify.log.error('Error details:', JSON.stringify(err, null, 2))
        return reply.redirect(`${process.env.CORS_ORIGIN}/login?error=auth_failed`)
      }
    }
  )

  /**
   * POST /api/auth/login
   * Legacy mock login endpoint (kept for backward compatibility and testing)
   *
   * In development, accepts any email and returns JWT
   * Use Google OAuth (/api/auth/google) in production
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
          picture: user.picture,
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
          picture: user.picture,
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
