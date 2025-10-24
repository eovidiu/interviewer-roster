import {
  InterviewerSchema,
  CreateInterviewerSchema,
  UpdateInterviewerSchema,
  ListInterviewersQuerySchema,
  InterviewerIdParamSchema,
  ErrorSchema
} from './schemas.js'

/**
 * Interviewer routes
 * @param {import('fastify').FastifyInstance} fastify
 * @param {Object} options
 */
export default async function interviewerRoutes(fastify, _options) {
  const service = options.service

  // GET /api/interviewers - List all interviewers
  fastify.get('/', {
    schema: {
      description: 'List all interviewers with optional filtering',
      tags: ['interviewers'],
      querystring: ListInterviewersQuerySchema,
      response: {
        200: {
          type: 'object',
          properties: {
            data: { type: 'array', items: InterviewerSchema },
            pagination: {
              type: 'object',
              properties: {
                total: { type: 'integer' },
                limit: { type: 'integer' },
                offset: { type: 'integer' },
                hasMore: { type: 'boolean' }
              }
            }
          }
        }
      }
    },
    preHandler: fastify.authenticate
  }, async (request, _reply) => {
    const result = await service.list(request.query)
    return result
  })

  // GET /api/interviewers/:id - Get interviewer by ID
  fastify.get('/:id', {
    schema: {
      description: 'Get interviewer by ID',
      tags: ['interviewers'],
      params: InterviewerIdParamSchema,
      response: {
        200: InterviewerSchema,
        404: ErrorSchema
      }
    },
    preHandler: fastify.authenticate
  }, async (request, reply) => {
    const interviewer = await service.getById(request.params.id)

    if (!interviewer) {
      return reply.notFound('Interviewer not found')
    }

    return interviewer
  })

  // POST /api/interviewers - Create new interviewer
  fastify.post('/', {
    schema: {
      description: 'Create a new interviewer',
      tags: ['interviewers'],
      body: CreateInterviewerSchema,
      response: {
        201: InterviewerSchema,
        400: ErrorSchema,
        403: ErrorSchema
      }
    },
    preHandler: fastify.authorize(['admin', 'talent'])
  }, async (request, reply) => {
    try {
      const auditContext = {
        userEmail: request.user.email,
        userName: request.user.name
      }

      const interviewer = await service.create(request.body, auditContext)

      reply.code(201)
      return interviewer
    } catch (error) {
      if (error.message === 'Email already exists') {
        return reply.conflict(error.message)
      }
      throw error
    }
  })

  // PUT /api/interviewers/:id - Update interviewer
  fastify.put('/:id', {
    schema: {
      description: 'Update an existing interviewer',
      tags: ['interviewers'],
      params: InterviewerIdParamSchema,
      body: UpdateInterviewerSchema,
      response: {
        200: InterviewerSchema,
        404: ErrorSchema,
        403: ErrorSchema
      }
    },
    preHandler: fastify.authorize(['admin', 'talent'])
  }, async (request, reply) => {
    try {
      const auditContext = {
        userEmail: request.user.email,
        userName: request.user.name
      }

      const interviewer = await service.update(
        request.params.id,
        request.body,
        auditContext
      )

      if (!interviewer) {
        return reply.notFound('Interviewer not found')
      }

      return interviewer
    } catch (error) {
      if (error.message === 'Email already exists') {
        return reply.conflict(error.message)
      }
      throw error
    }
  })

  // DELETE /api/interviewers/:id - Delete interviewer
  fastify.delete('/:id', {
    schema: {
      description: 'Delete an interviewer',
      tags: ['interviewers'],
      params: InterviewerIdParamSchema,
      response: {
        204: { type: 'null', description: 'No content' },
        404: ErrorSchema,
        403: ErrorSchema
      }
    },
    preHandler: fastify.authorize(['admin'])
  }, async (request, reply) => {
    const auditContext = {
      userEmail: request.user.email,
      userName: request.user.name
    }

    const deleted = await service.delete(request.params.id, auditContext)

    if (!deleted) {
      return reply.notFound('Interviewer not found')
    }

    reply.code(204)
  })
}
