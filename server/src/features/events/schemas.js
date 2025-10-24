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
 * Matches actual database schema
 */
export const EventSchema = Type.Object({
  id: Type.String(),
  interviewer_email: Type.String({ format: 'email' }),
  calendar_event_id: Type.Union([Type.String(), Type.Null()]),
  start_time: Type.String({ format: 'date-time' }),
  end_time: Type.String({ format: 'date-time' }),
  skills_assessed: Type.Union([Type.Array(Type.String()), Type.Null()]),
  candidate_name: Type.Union([Type.String(), Type.Null()]),
  position: Type.Union([Type.String(), Type.Null()]),
  scheduled_date: Type.Union([Type.String(), Type.Null()]),
  duration_minutes: Type.Union([Type.Integer(), Type.Null()]),
  status: EventStatusEnum,
  notes: Type.Union([Type.String(), Type.Null()]),
  marked_by: Type.Union([Type.String(), Type.Null()]),
  marked_at: Type.Union([Type.String(), Type.Null()]),
  created_at: Type.String({ format: 'date-time' }),
  updated_at: Type.String({ format: 'date-time' })
})

/**
 * Create Event Schema
 * For POST /api/events
 * Matches actual database schema
 */
export const CreateEventSchema = Type.Object({
  interviewer_email: Type.String({ format: 'email' }),
  calendar_event_id: Type.Optional(Type.String()),
  start_time: Type.String({ format: 'date-time' }),
  end_time: Type.String({ format: 'date-time' }),
  skills_assessed: Type.Optional(Type.Array(Type.String(), { minItems: 0 })),
  candidate_name: Type.Optional(Type.String({ minLength: 1, maxLength: 255 })),
  position: Type.Optional(Type.String({ minLength: 1, maxLength: 255 })),
  scheduled_date: Type.Optional(Type.String()),
  duration_minutes: Type.Optional(Type.Integer({ minimum: 1 })),
  status: Type.Optional(EventStatusEnum),
  notes: Type.Optional(Type.String()),
  marked_by: Type.Optional(Type.String()),
  marked_at: Type.Optional(Type.String())
})

/**
 * Update Event Schema
 * For PUT /api/events/:id
 * Matches actual database schema
 */
export const UpdateEventSchema = Type.Object({
  interviewer_email: Type.Optional(Type.String({ format: 'email' })),
  calendar_event_id: Type.Optional(Type.String()),
  start_time: Type.Optional(Type.String({ format: 'date-time' })),
  end_time: Type.Optional(Type.String({ format: 'date-time' })),
  skills_assessed: Type.Optional(Type.Array(Type.String(), { minItems: 0 })),
  candidate_name: Type.Optional(Type.String({ minLength: 1, maxLength: 255 })),
  position: Type.Optional(Type.String({ minLength: 1, maxLength: 255 })),
  scheduled_date: Type.Optional(Type.String()),
  duration_minutes: Type.Optional(Type.Integer({ minimum: 1 })),
  status: Type.Optional(EventStatusEnum),
  notes: Type.Optional(Type.String()),
  marked_by: Type.Optional(Type.String()),
  marked_at: Type.Optional(Type.String())
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
