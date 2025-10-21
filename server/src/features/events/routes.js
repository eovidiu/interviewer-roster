import {
  EventSchema,
  CreateEventSchema,
  UpdateEventSchema,
  ListEventsQuerySchema,
  EventIdParamSchema,
  ListEventsResponseSchema
} from './schemas.js'

/**
 * Event Routes
 * HTTP endpoints for interview events management
 *
 * All routes require authentication
 * Create/Update/Delete require admin or talent role
 */
export default async function eventRoutes(fastify, options) {
  const service = options.service

  /**
   * GET /api/events
   * List all events with optional filtering and pagination
   *
   * Query params:
   * - interviewer_email: Filter by interviewer
   * - status: Filter by status (pending|attended|ghosted|cancelled)
   * - start_date: Filter by start date (YYYY-MM-DD)
   * - end_date: Filter by end date (YYYY-MM-DD)
   * - search: Search in candidate name, position, skills
   * - limit: Results per page (default: 50, max: 100)
   * - offset: Pagination offset (default: 0)
   */
  fastify.get(
    '/',
    {
      schema: {
        description: 'List all interview events with optional filtering',
        tags: ['events'],
        querystring: ListEventsQuerySchema,
        response: {
          200: ListEventsResponseSchema
        }
      },
      preHandler: fastify.authenticate
    },
    async (request, reply) => {
      const result = await service.list(request.query)
      return result
    }
  )

  /**
   * GET /api/events/stats
   * Get event statistics by status
   *
   * Returns count of events by status
   */
  fastify.get(
    '/stats',
    {
      schema: {
        description: 'Get event statistics by status',
        tags: ['events'],
        response: {
          200: {
            type: 'object',
            additionalProperties: { type: 'number' }
          }
        }
      },
      preHandler: fastify.authenticate
    },
    async (request, reply) => {
      const stats = await service.getStats()
      return stats
    }
  )

  /**
   * GET /api/events/:id
   * Get single event by ID
   */
  fastify.get(
    '/:id',
    {
      schema: {
        description: 'Get event by ID',
        tags: ['events'],
        params: EventIdParamSchema,
        response: {
          200: EventSchema,
          404: {
            type: 'object',
            properties: {
              error: { type: 'string' },
              message: { type: 'string' }
            }
          }
        }
      },
      preHandler: fastify.authenticate
    },
    async (request, reply) => {
      try {
        const event = await service.getById(request.params.id)
        return event
      } catch (error) {
        if (error.message === 'Event not found') {
          reply.code(404)
          return {
            error: 'Not Found',
            message: error.message
          }
        }
        throw error
      }
    }
  )

  /**
   * POST /api/events
   * Create new event
   *
   * Requires admin or talent role
   */
  fastify.post(
    '/',
    {
      schema: {
        description: 'Create new interview event',
        tags: ['events'],
        body: CreateEventSchema,
        response: {
          201: EventSchema,
          400: {
            type: 'object',
            properties: {
              error: { type: 'string' },
              message: { type: 'string' }
            }
          }
        }
      },
      preHandler: fastify.authorize(['admin', 'talent'])
    },
    async (request, reply) => {
      try {
        const auditContext = {
          userEmail: request.user.email,
          userName: request.user.name
        }

        const event = await service.create(request.body, auditContext)
        reply.code(201)
        return event
      } catch (error) {
        if (
          error.message.includes('time') ||
          error.message.includes('Rating')
        ) {
          reply.code(400)
          return {
            error: 'Bad Request',
            message: error.message
          }
        }
        throw error
      }
    }
  )

  /**
   * PUT /api/events/:id
   * Update existing event
   *
   * Requires admin or talent role
   */
  fastify.put(
    '/:id',
    {
      schema: {
        description: 'Update existing event',
        tags: ['events'],
        params: EventIdParamSchema,
        body: UpdateEventSchema,
        response: {
          200: EventSchema,
          400: {
            type: 'object',
            properties: {
              error: { type: 'string' },
              message: { type: 'string' }
            }
          },
          404: {
            type: 'object',
            properties: {
              error: { type: 'string' },
              message: { type: 'string' }
            }
          }
        }
      },
      preHandler: fastify.authorize(['admin', 'talent'])
    },
    async (request, reply) => {
      try {
        const auditContext = {
          userEmail: request.user.email,
          userName: request.user.name
        }

        const event = await service.update(
          request.params.id,
          request.body,
          auditContext
        )
        return event
      } catch (error) {
        if (error.message === 'Event not found') {
          reply.code(404)
          return {
            error: 'Not Found',
            message: error.message
          }
        }
        if (
          error.message.includes('time') ||
          error.message.includes('Rating')
        ) {
          reply.code(400)
          return {
            error: 'Bad Request',
            message: error.message
          }
        }
        throw error
      }
    }
  )

  /**
   * DELETE /api/events/:id
   * Delete event
   *
   * Requires admin role only
   */
  fastify.delete(
    '/:id',
    {
      schema: {
        description: 'Delete event',
        tags: ['events'],
        params: EventIdParamSchema,
        response: {
          204: {
            type: 'null',
            description: 'Event deleted successfully'
          },
          404: {
            type: 'object',
            properties: {
              error: { type: 'string' },
              message: { type: 'string' }
            }
          }
        }
      },
      preHandler: fastify.authorize(['admin'])
    },
    async (request, reply) => {
      try {
        const auditContext = {
          userEmail: request.user.email,
          userName: request.user.name
        }

        await service.delete(request.params.id, auditContext)
        reply.code(204)
        return null
      } catch (error) {
        if (error.message === 'Event not found') {
          reply.code(404)
          return {
            error: 'Not Found',
            message: error.message
          }
        }
        throw error
      }
    }
  )
}
