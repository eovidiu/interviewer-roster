import { InterviewerService } from './service.js'
import routes from './routes.js'

/**
 * Interviewers feature plugin
 * @param {import('fastify').FastifyInstance} fastify
 * @param {Object} options
 */
export default async function interviewersPlugin(fastify, _options) {
  // Create service instance
  const service = new InterviewerService(fastify.db, fastify.auditLogger)

  // Register routes with service
  await fastify.register(routes, { prefix: '/interviewers', service })

  fastify.log.info('Interviewers feature registered')
}
