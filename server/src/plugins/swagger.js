import fp from 'fastify-plugin'
import swagger from '@fastify/swagger'
import swaggerUi from '@fastify/swagger-ui'
import config from '../config/index.js'

/**
 * Swagger/OpenAPI documentation plugin
 *
 * @param {import('fastify').FastifyInstance} fastify
 * @param {Object} options
 */
async function swaggerPlugin(fastify, _options) {
  if (!config.swagger.enabled) {
    fastify.log.info('Swagger documentation disabled')
    return
  }

  await fastify.register(swagger, {
    openapi: {
      info: {
        title: 'Interviewer Roster API',
        description: 'REST API for managing interviewer availability, events, and audit logs',
        version: '1.0.0'
      },
      servers: [
        {
          url: `http://localhost:${config.server.port}`,
          description: 'Development server'
        }
      ],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT'
          }
        }
      },
      security: [{ bearerAuth: [] }],
      tags: [
        { name: 'auth', description: 'Authentication endpoints' },
        { name: 'interviewers', description: 'Interviewer management' },
        { name: 'events', description: 'Interview events' },
        { name: 'audit-logs', description: 'Audit logs' },
        { name: 'health', description: 'Health checks' }
      ]
    }
  })

  await fastify.register(swaggerUi, {
    routePrefix: '/docs',
    uiConfig: {
      docExpansion: 'list',
      deepLinking: true,
      displayRequestDuration: true
    },
    staticCSP: true,
    transformStaticCSP: (header) => header
  })

  fastify.log.info({ route: '/docs' }, 'Swagger UI enabled')
}

export default fp(swaggerPlugin, {
  name: 'swagger'
})
