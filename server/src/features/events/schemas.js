import { Type } from '@sinclair/typebox'

/**
 * Event Status Enum
 * Matches the database CHECK constraint
 */
export const EventStatusEnum = Type.Union([
  Type.Literal('pending'),
  Type.Literal('attended'),
  Type.Literal('ghosted'),
  Type.Literal('cancelled')
])

/**
 * Complete Event Schema
 * Represents an interview event from the database
 */
export const EventSchema = Type.Object({
  id: Type.String(),
  interviewer_email: Type.String({ format: 'email' }),
  start_time: Type.String({ format: 'date-time' }),
  end_time: Type.String({ format: 'date-time' }),
  status: EventStatusEnum,
  candidate_name: Type.String(),
  candidate_email: Type.Optional(Type.String({ format: 'email' })),
  position: Type.String(),
  skills_assessed: Type.Array(Type.String()),
  feedback: Type.Optional(Type.String()),
  rating: Type.Optional(Type.Integer({ minimum: 1, maximum: 5 })),
  created_at: Type.String({ format: 'date-time' }),
  updated_at: Type.String({ format: 'date-time' })
})

/**
 * Create Event Schema
 * For POST /api/events
 */
export const CreateEventSchema = Type.Object({
  interviewer_email: Type.String({ format: 'email' }),
  start_time: Type.String({ format: 'date-time' }),
  end_time: Type.String({ format: 'date-time' }),
  status: Type.Optional(EventStatusEnum),
  candidate_name: Type.String({ minLength: 1, maxLength: 255 }),
  candidate_email: Type.Optional(Type.String({ format: 'email' })),
  position: Type.String({ minLength: 1, maxLength: 255 }),
  skills_assessed: Type.Array(Type.String(), { minItems: 0 }),
  feedback: Type.Optional(Type.String()),
  rating: Type.Optional(Type.Integer({ minimum: 1, maximum: 5 }))
})

/**
 * Update Event Schema
 * For PUT /api/events/:id
 */
export const UpdateEventSchema = Type.Object({
  interviewer_email: Type.Optional(Type.String({ format: 'email' })),
  start_time: Type.Optional(Type.String({ format: 'date-time' })),
  end_time: Type.Optional(Type.String({ format: 'date-time' })),
  status: Type.Optional(EventStatusEnum),
  candidate_name: Type.Optional(Type.String({ minLength: 1, maxLength: 255 })),
  candidate_email: Type.Optional(Type.String({ format: 'email' })),
  position: Type.Optional(Type.String({ minLength: 1, maxLength: 255 })),
  skills_assessed: Type.Optional(Type.Array(Type.String(), { minItems: 0 })),
  feedback: Type.Optional(Type.String()),
  rating: Type.Optional(Type.Integer({ minimum: 1, maximum: 5 }))
})

/**
 * List Events Query Schema
 * Query parameters for GET /api/events
 */
export const ListEventsQuerySchema = Type.Object({
  interviewer_email: Type.Optional(Type.String({ format: 'email' })),
  status: Type.Optional(EventStatusEnum),
  start_date: Type.Optional(Type.String({ format: 'date' })),
  end_date: Type.Optional(Type.String({ format: 'date' })),
  search: Type.Optional(Type.String()),
  limit: Type.Optional(Type.Integer({ minimum: 1, maximum: 100, default: 50 })),
  offset: Type.Optional(Type.Integer({ minimum: 0, default: 0 }))
})

/**
 * Event ID Parameter Schema
 * For routes with :id parameter
 */
export const EventIdParamSchema = Type.Object({
  id: Type.String()
})

/**
 * List Events Response Schema
 * Includes pagination metadata
 */
export const ListEventsResponseSchema = Type.Object({
  data: Type.Array(EventSchema),
  pagination: Type.Object({
    total: Type.Integer(),
    limit: Type.Integer(),
    offset: Type.Integer(),
    hasMore: Type.Boolean()
  })
})
