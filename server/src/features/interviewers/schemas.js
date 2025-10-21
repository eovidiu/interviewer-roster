import { Type } from '@sinclair/typebox'

// Role enum
export const RoleEnum = Type.Union([
  Type.Literal('viewer'),
  Type.Literal('talent'),
  Type.Literal('admin')
])

// Base interviewer schema
export const InterviewerSchema = Type.Object({
  id: Type.String(),
  name: Type.String({ minLength: 1 }),
  email: Type.String({ format: 'email' }),
  role: RoleEnum,
  skills: Type.Array(Type.String()),
  is_active: Type.Boolean(),
  calendar_sync_enabled: Type.Boolean(),
  timezone: Type.Optional(Type.String()),
  calendar_sync_consent_at: Type.Union([Type.String({ format: 'date-time' }), Type.Null()]),
  last_synced_at: Type.Union([Type.String({ format: 'date-time' }), Type.Null()]),
  created_by: Type.Optional(Type.String()),
  modified_at: Type.Optional(Type.String({ format: 'date-time' })),
  modified_by: Type.Optional(Type.String()),
  created_at: Type.String({ format: 'date-time' }),
  updated_at: Type.String({ format: 'date-time' })
})

// Create interviewer request
export const CreateInterviewerSchema = Type.Object({
  name: Type.String({ minLength: 1, maxLength: 255 }),
  email: Type.String({ format: 'email' }),
  role: RoleEnum,
  skills: Type.Array(Type.String(), { minItems: 0 }),
  is_active: Type.Optional(Type.Boolean({ default: true })),
  calendar_sync_enabled: Type.Optional(Type.Boolean({ default: false })),
  timezone: Type.Optional(Type.String())
})

// Update interviewer request
export const UpdateInterviewerSchema = Type.Partial(CreateInterviewerSchema)

// Query parameters for list
export const ListInterviewersQuerySchema = Type.Object({
  role: Type.Optional(RoleEnum),
  is_active: Type.Optional(Type.Boolean()),
  search: Type.Optional(Type.String()),
  limit: Type.Optional(Type.Integer({ minimum: 1, maximum: 100, default: 50 })),
  offset: Type.Optional(Type.Integer({ minimum: 0, default: 0 }))
})

// ID parameter
export const InterviewerIdParamSchema = Type.Object({
  id: Type.String()
})

// Error response
export const ErrorSchema = Type.Object({
  error: Type.String(),
  message: Type.String(),
  statusCode: Type.Optional(Type.Integer())
})
