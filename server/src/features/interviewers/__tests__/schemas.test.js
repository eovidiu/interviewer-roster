import {
  InterviewerSchema,
  CreateInterviewerSchema,
  UpdateInterviewerSchema,
  ListInterviewersQuerySchema
} from '../schemas.js'

describe('Interviewer Schemas - Migration 003 Fields', () => {
  describe('InterviewerSchema - New Fields Structure', () => {
    test('should include date_in field in schema', () => {
      expect(InterviewerSchema.properties).toHaveProperty('date_in')
      expect(InterviewerSchema.properties.date_in).toBeDefined()
    })

    test('should include manager field in schema', () => {
      expect(InterviewerSchema.properties).toHaveProperty('manager')
      expect(InterviewerSchema.properties.manager).toBeDefined()
    })

    test('should include check_manager boolean field in schema', () => {
      expect(InterviewerSchema.properties).toHaveProperty('check_manager')
      expect(InterviewerSchema.properties.check_manager.type).toBe('boolean')
    })

    test('should include org field in schema', () => {
      expect(InterviewerSchema.properties).toHaveProperty('org')
      expect(InterviewerSchema.properties.org).toBeDefined()
    })

    test('should include all 8 profile fields in schema', () => {
      const profileFields = [
        'profile_backend',
        'profile_big_data',
        'profile_frontend',
        'profile_fullstack',
        'profile_sre',
        'profile_cse',
        'profile_ml',
        'profile_em'
      ]

      profileFields.forEach(field => {
        expect(InterviewerSchema.properties).toHaveProperty(field)
        expect(InterviewerSchema.properties[field].type).toBe('boolean')
      })
    })

    test('should include max_level integer field in schema', () => {
      expect(InterviewerSchema.properties).toHaveProperty('max_level')
      const maxLevelSchema = InterviewerSchema.properties.max_level
      // Check it's either an integer or a union containing integer
      const isIntegerOrUnion = maxLevelSchema.type === 'integer' ||
                               (maxLevelSchema.anyOf && maxLevelSchema.anyOf.some(s => s.type === 'integer'))
      expect(isIntegerOrUnion).toBe(true)
    })

    test('should validate max_level has minimum constraint', () => {
      const maxLevelSchema = InterviewerSchema.properties.max_level
      // Find the integer type in the union
      const integerType = maxLevelSchema.anyOf?.find(s => s.type === 'integer') || maxLevelSchema
      expect(integerType.minimum).toBe(0)
    })

    test('should include check_level string field in schema', () => {
      expect(InterviewerSchema.properties).toHaveProperty('check_level')
      expect(InterviewerSchema.properties.check_level).toBeDefined()
    })

    test('should include pause_until field in schema', () => {
      expect(InterviewerSchema.properties).toHaveProperty('pause_until')
      expect(InterviewerSchema.properties.pause_until).toBeDefined()
    })

    test('should include is_shadowing boolean field in schema', () => {
      expect(InterviewerSchema.properties).toHaveProperty('is_shadowing')
      expect(InterviewerSchema.properties.is_shadowing.type).toBe('boolean')
    })

    test('should include onboarding_completed boolean field in schema', () => {
      expect(InterviewerSchema.properties).toHaveProperty('onboarding_completed')
      expect(InterviewerSchema.properties.onboarding_completed.type).toBe('boolean')
    })

    test('should include is_remote boolean field in schema', () => {
      expect(InterviewerSchema.properties).toHaveProperty('is_remote')
      expect(InterviewerSchema.properties.is_remote.type).toBe('boolean')
    })

    test('should have all 16 new fields from migration 003', () => {
      const newFields = [
        'date_in', 'manager', 'check_manager', 'org',
        'profile_backend', 'profile_big_data', 'profile_frontend', 'profile_fullstack',
        'profile_sre', 'profile_cse', 'profile_ml', 'profile_em',
        'max_level', 'check_level', 'pause_until',
        'is_shadowing', 'onboarding_completed', 'is_remote'
      ]

      newFields.forEach(field => {
        expect(InterviewerSchema.properties).toHaveProperty(field)
      })
    })
  })

  describe('CreateInterviewerSchema - New Fields Structure', () => {
    test('should include date_in as optional field', () => {
      expect(CreateInterviewerSchema.properties).toHaveProperty('date_in')
    })

    test('should include manager as optional field', () => {
      expect(CreateInterviewerSchema.properties).toHaveProperty('manager')
    })

    test('should include org as optional field', () => {
      expect(CreateInterviewerSchema.properties).toHaveProperty('org')
    })

    test('should include all profile fields as optional booleans', () => {
      const profileFields = [
        'profile_backend',
        'profile_big_data',
        'profile_frontend',
        'profile_fullstack',
        'profile_sre',
        'profile_cse',
        'profile_ml',
        'profile_em'
      ]

      profileFields.forEach(field => {
        expect(CreateInterviewerSchema.properties).toHaveProperty(field)
        expect(CreateInterviewerSchema.properties[field].type).toBe('boolean')
      })
    })

    test('should include max_level with minimum constraint', () => {
      expect(CreateInterviewerSchema.properties).toHaveProperty('max_level')
      const maxLevelSchema = CreateInterviewerSchema.properties.max_level
      expect(maxLevelSchema.type).toBe('integer')
      expect(maxLevelSchema.minimum).toBe(0)
    })

    test('should include check_level as optional field', () => {
      expect(CreateInterviewerSchema.properties).toHaveProperty('check_level')
      expect(CreateInterviewerSchema.properties.check_level.type).toBe('string')
    })

    test('should include pause_until as optional field', () => {
      expect(CreateInterviewerSchema.properties).toHaveProperty('pause_until')
    })

    test('should include status booleans as optional', () => {
      expect(CreateInterviewerSchema.properties).toHaveProperty('is_shadowing')
      expect(CreateInterviewerSchema.properties).toHaveProperty('onboarding_completed')
      expect(CreateInterviewerSchema.properties).toHaveProperty('is_remote')
      expect(CreateInterviewerSchema.properties.is_shadowing.type).toBe('boolean')
      expect(CreateInterviewerSchema.properties.onboarding_completed.type).toBe('boolean')
      expect(CreateInterviewerSchema.properties.is_remote.type).toBe('boolean')
    })

    test('should not require any new fields (all optional)', () => {
      // CreateInterviewerSchema should have required fields only for basic info
      const requiredFields = CreateInterviewerSchema.required || []

      const newFields = [
        'date_in', 'manager', 'check_manager', 'org',
        'profile_backend', 'profile_big_data', 'profile_frontend', 'profile_fullstack',
        'profile_sre', 'profile_cse', 'profile_ml', 'profile_em',
        'max_level', 'check_level', 'pause_until',
        'is_shadowing', 'onboarding_completed', 'is_remote'
      ]

      newFields.forEach(field => {
        expect(requiredFields).not.toContain(field)
      })
    })
  })

  describe('UpdateInterviewerSchema - New Fields Structure', () => {
    test('should be partial and include all new fields', () => {
      // UpdateInterviewerSchema is Type.Partial(CreateInterviewerSchema)
      // so it should have all fields as optional
      const newFields = [
        'date_in', 'manager', 'org',
        'profile_backend', 'profile_ml',
        'max_level', 'check_level',
        'pause_until', 'is_shadowing', 'onboarding_completed', 'is_remote'
      ]

      newFields.forEach(field => {
        expect(UpdateInterviewerSchema.properties).toHaveProperty(field)
      })
    })

    test('should have no required fields (partial schema)', () => {
      expect(UpdateInterviewerSchema.required || []).toEqual([])
    })
  })

  describe('ListInterviewersQuerySchema - New Filter Fields', () => {
    test('should include org filter', () => {
      expect(ListInterviewersQuerySchema.properties).toHaveProperty('org')
      expect(ListInterviewersQuerySchema.properties.org.type).toBe('string')
    })

    test('should include manager filter', () => {
      expect(ListInterviewersQuerySchema.properties).toHaveProperty('manager')
      expect(ListInterviewersQuerySchema.properties.manager.type).toBe('string')
    })

    test('should include profile filters', () => {
      const profileFields = [
        'profile_backend',
        'profile_big_data',
        'profile_frontend',
        'profile_fullstack',
        'profile_sre',
        'profile_cse',
        'profile_ml',
        'profile_em'
      ]

      profileFields.forEach(field => {
        expect(ListInterviewersQuerySchema.properties).toHaveProperty(field)
        expect(ListInterviewersQuerySchema.properties[field].type).toBe('boolean')
      })
    })

    test('should include level range filters', () => {
      expect(ListInterviewersQuerySchema.properties).toHaveProperty('min_level')
      expect(ListInterviewersQuerySchema.properties).toHaveProperty('max_level')
      expect(ListInterviewersQuerySchema.properties.min_level.type).toBe('integer')
      expect(ListInterviewersQuerySchema.properties.max_level.type).toBe('integer')
      expect(ListInterviewersQuerySchema.properties.min_level.minimum).toBe(0)
      expect(ListInterviewersQuerySchema.properties.max_level.minimum).toBe(0)
    })

    test('should include onboarding_completed filter', () => {
      expect(ListInterviewersQuerySchema.properties).toHaveProperty('onboarding_completed')
      expect(ListInterviewersQuerySchema.properties.onboarding_completed.type).toBe('boolean')
    })

    test('should include is_remote filter', () => {
      expect(ListInterviewersQuerySchema.properties).toHaveProperty('is_remote')
      expect(ListInterviewersQuerySchema.properties.is_remote.type).toBe('boolean')
    })

    test('should have all new filter fields optional', () => {
      const requiredFields = ListInterviewersQuerySchema.required || []
      const newFields = [
        'org', 'manager', 'profile_backend', 'profile_frontend',
        'min_level', 'max_level', 'onboarding_completed', 'is_remote'
      ]

      newFields.forEach(field => {
        expect(requiredFields).not.toContain(field)
      })
    })
  })

  describe('Schema Integrity', () => {
    test('all schemas should be valid TypeBox schemas', () => {
      expect(InterviewerSchema.type).toBe('object')
      expect(CreateInterviewerSchema.type).toBe('object')
      expect(UpdateInterviewerSchema.type).toBe('object')
      expect(ListInterviewersQuerySchema.type).toBe('object')
    })

    test('InterviewerSchema should have more fields than before migration', () => {
      const fieldCount = Object.keys(InterviewerSchema.properties).length
      // Before migration: 15 fields, after migration: 15 + 16 = 31 fields
      expect(fieldCount).toBeGreaterThanOrEqual(31)
    })
  })
})
