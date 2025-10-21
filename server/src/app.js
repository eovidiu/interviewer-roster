import Fastify from 'fastify'
import cors from '@fastify/cors'
import helmet from '@fastify/helmet'
import rateLimit from '@fastify/rate-limit'
import sensible from '@fastify/sensible'
import config from './config/index.js'
import databasePlugin from './plugins/database.js'
import authPlugin from './plugins/auth.js'
import swaggerPlugin from './plugins/swagger.js'
import interviewersPlugin from './features/interviewers/index.js'
import eventsPlugin from './features/events/index.js'
import auditLogsPlugin from './features/audit-logs/index.js'
import authRoutesPlugin from './features/auth/index.js'
import usersPlugin from './features/users/index.js'
import { AuditLogger } from './utils/audit-logger.js'

/**
 * Create and configure Fastify application
 * @returns {import('fastify').FastifyInstance}
 */
export async function createApp() {
  const fastify = Fastify({
    logger: {
      level: config.server.logLevel,
      transport: config.isDevelopment
        ? {
            target: 'pino-pretty',
            options: {
              translateTime: 'HH:MM:ss Z',
              ignore: 'pid,hostname'
            }
          }
        : undefined
    },
    disableRequestLogging: false,
    requestIdLogLabel: 'reqId',
    requestIdHeader: 'x-request-id'
  })

  // Register security plugins
  await fastify.register(helmet, {
    contentSecurityPolicy: false // Disable for Swagger UI
  })

  await fastify.register(cors, config.cors)

  await fastify.register(rateLimit, {
    max: config.rateLimit.max,
    timeWindow: config.rateLimit.timeWindow
  })

  // Register utility plugins
  await fastify.register(sensible) // Adds useful HTTP helpers

  // Register infrastructure plugins
  await fastify.register(databasePlugin)
  await fastify.register(authPlugin)
  await fastify.register(swaggerPlugin)

  // Decorate with audit logger
  fastify.decorate('auditLogger', new AuditLogger(fastify.db))

  // Health check endpoint
  fastify.get('/api/health', {
    schema: {
      description: 'Health check endpoint',
      tags: ['health'],
      response: {
        200: {
          type: 'object',
          properties: {
            status: { type: 'string' },
            timestamp: { type: 'string' },
            uptime: { type: 'number' }
          }
        }
      }
    }
  }, async (request, reply) => {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    }
  })

  // Register feature plugins under /api
  await fastify.register(async function apiRoutes(fastify) {
    await fastify.register(authRoutesPlugin)
    await fastify.register(usersPlugin)
    await fastify.register(interviewersPlugin)
    await fastify.register(eventsPlugin)
    await fastify.register(auditLogsPlugin)
  }, { prefix: '/api' })

  // 404 handler
  fastify.setNotFoundHandler((request, reply) => {
    reply.code(404).send({
      error: 'Not Found',
      message: `Route ${request.method}:${request.url} not found`,
      statusCode: 404
    })
  })

  // Error handler
  fastify.setErrorHandler((error, request, reply) => {
    fastify.log.error(error)

    // Don't leak error details in production
    const message = config.isProduction
      ? 'Internal server error'
      : error.message

    reply.code(error.statusCode || 500).send({
      error: error.name || 'Error',
      message,
      statusCode: error.statusCode || 500
    })
  })

  return fastify
}
