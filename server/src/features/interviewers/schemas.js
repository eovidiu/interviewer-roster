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
  updated_at: Type.String({ format: 'date-time' }),
  // Migration 003 fields - onboarding & dates
  date_in: Type.Optional(Type.Union([Type.String(), Type.Null()])),
  // Migration 003 fields - management & organization
  manager: Type.Optional(Type.Union([Type.String(), Type.Null()])),
  check_manager: Type.Optional(Type.Boolean()),
  org: Type.Optional(Type.Union([Type.String(), Type.Null()])),
  // Migration 003 fields - interview profiles
  profile_backend: Type.Optional(Type.Boolean()),
  profile_big_data: Type.Optional(Type.Boolean()),
  profile_frontend: Type.Optional(Type.Boolean()),
  profile_fullstack: Type.Optional(Type.Boolean()),
  profile_sre: Type.Optional(Type.Boolean()),
  profile_cse: Type.Optional(Type.Boolean()),
  profile_ml: Type.Optional(Type.Boolean()),
  profile_em: Type.Optional(Type.Boolean()),
  // Migration 003 fields - level & experience
  max_level: Type.Optional(Type.Union([Type.Integer({ minimum: 0 }), Type.Null()])),
  check_level: Type.Optional(Type.Union([Type.String(), Type.Null()])),
  // Migration 003 fields - availability & status
  pause_until: Type.Optional(Type.Union([Type.String(), Type.Null()])),
  is_shadowing: Type.Optional(Type.Boolean()),
  onboarding_completed: Type.Optional(Type.Boolean()),
  // Migration 003 fields - work mode
  is_remote: Type.Optional(Type.Boolean())
})

// Create interviewer request
export const CreateInterviewerSchema = Type.Object({
  name: Type.String({ minLength: 1, maxLength: 255 }),
  email: Type.String({ format: 'email' }),
  role: RoleEnum,
  skills: Type.Array(Type.String(), { minItems: 0 }),
  is_active: Type.Optional(Type.Boolean({ default: true })),
  calendar_sync_enabled: Type.Optional(Type.Boolean({ default: false })),
  timezone: Type.Optional(Type.String()),
  // Migration 003 fields - all optional for create
  date_in: Type.Optional(Type.String()),
  manager: Type.Optional(Type.String()),
  check_manager: Type.Optional(Type.Boolean()),
  org: Type.Optional(Type.String()),
  profile_backend: Type.Optional(Type.Boolean()),
  profile_big_data: Type.Optional(Type.Boolean()),
  profile_frontend: Type.Optional(Type.Boolean()),
  profile_fullstack: Type.Optional(Type.Boolean()),
  profile_sre: Type.Optional(Type.Boolean()),
  profile_cse: Type.Optional(Type.Boolean()),
  profile_ml: Type.Optional(Type.Boolean()),
  profile_em: Type.Optional(Type.Boolean()),
  max_level: Type.Optional(Type.Integer({ minimum: 0 })),
  check_level: Type.Optional(Type.String()),
  pause_until: Type.Optional(Type.String()),
  is_shadowing: Type.Optional(Type.Boolean()),
  onboarding_completed: Type.Optional(Type.Boolean()),
  is_remote: Type.Optional(Type.Boolean())
})

// Update interviewer request
export const UpdateInterviewerSchema = Type.Partial(CreateInterviewerSchema)

// Query parameters for list
export const ListInterviewersQuerySchema = Type.Object({
  role: Type.Optional(RoleEnum),
  is_active: Type.Optional(Type.Boolean()),
  search: Type.Optional(Type.String()),
  limit: Type.Optional(Type.Integer({ minimum: 1, maximum: 100, default: 50 })),
  offset: Type.Optional(Type.Integer({ minimum: 0, default: 0 })),
  // Migration 003 query filters
  org: Type.Optional(Type.String()),
  manager: Type.Optional(Type.String()),
  profile_backend: Type.Optional(Type.Boolean()),
  profile_big_data: Type.Optional(Type.Boolean()),
  profile_frontend: Type.Optional(Type.Boolean()),
  profile_fullstack: Type.Optional(Type.Boolean()),
  profile_sre: Type.Optional(Type.Boolean()),
  profile_cse: Type.Optional(Type.Boolean()),
  profile_ml: Type.Optional(Type.Boolean()),
  profile_em: Type.Optional(Type.Boolean()),
  min_level: Type.Optional(Type.Integer({ minimum: 0 })),
  max_level: Type.Optional(Type.Integer({ minimum: 0 })),
  onboarding_completed: Type.Optional(Type.Boolean()),
  is_remote: Type.Optional(Type.Boolean())
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
