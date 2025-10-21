import { Type } from '@sinclair/typebox'

/**
 * Audit Log Schema
 * Represents an audit log entry from the database
 */
export const AuditLogSchema = Type.Object({
  id: Type.String(),
  user_email: Type.String({ format: 'email' }),
  user_name: Type.Optional(Type.String()),
  action: Type.String(),
  entity_type: Type.String(),
  entity_id: Type.String(),
  changes: Type.Object({}, { additionalProperties: true }), // JSON object
  timestamp: Type.String({ format: 'date-time' })
})

/**
 * List Audit Logs Query Schema
 * Query parameters for GET /api/audit-logs
 */
export const ListAuditLogsQuerySchema = Type.Object({
  user_email: Type.Optional(Type.String({ format: 'email' })),
  action: Type.Optional(Type.String()),
  entity_type: Type.Optional(
    Type.Union([
      Type.Literal('interviewer'),
      Type.Literal('event'),
      Type.Literal('user')
    ])
  ),
  entity_id: Type.Optional(Type.String()),
  start_date: Type.Optional(Type.String({ format: 'date' })),
  end_date: Type.Optional(Type.String({ format: 'date' })),
  limit: Type.Optional(Type.Integer({ minimum: 1, maximum: 100, default: 50 })),
  offset: Type.Optional(Type.Integer({ minimum: 0, default: 0 }))
})

/**
 * Audit Log ID Parameter Schema
 * For routes with :id parameter
 */
export const AuditLogIdParamSchema = Type.Object({
  id: Type.String()
})

/**
 * List Audit Logs Response Schema
 * Includes pagination metadata
 */
export const ListAuditLogsResponseSchema = Type.Object({
  data: Type.Array(AuditLogSchema),
  pagination: Type.Object({
    total: Type.Integer(),
    limit: Type.Integer(),
    offset: Type.Integer(),
    hasMore: Type.Boolean()
  })
})
