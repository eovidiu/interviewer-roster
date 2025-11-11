import { describe, test, expect, jest, beforeEach } from '@jest/globals'
import { InterviewerService } from '../service.js'

describe('InterviewerService', () => {
  let service
  let mockRepository
  let mockAuditLogger

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks()

    // Create mock repository
    mockRepository = {
      findAll: jest.fn(),
      count: jest.fn(),
      findById: jest.fn(),
      findByEmail: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn()
    }

    // Create mock audit logger
    mockAuditLogger = {
      log: jest.fn()
    }

    // Create service with mocked dependencies
    service = new InterviewerService(null, mockAuditLogger)
    service.repository = mockRepository
  })

  describe('list()', () => {
    test('should return interviewers with pagination', async () => {
      const mockInterviewers = [
        { id: '1', name: 'Alice', email: 'alice@example.com' },
        { id: '2', name: 'Bob', email: 'bob@example.com' }
      ]

      mockRepository.findAll.mockReturnValue(mockInterviewers)
      mockRepository.count.mockReturnValue(10)

      const result = await service.list({ limit: 2, offset: 0 })

      expect(result.data).toEqual(mockInterviewers)
      expect(result.pagination).toEqual({
        total: 10,
        limit: 2,
        offset: 0,
        hasMore: true
      })
    })

    test('should use default limit and offset', async () => {
      mockRepository.findAll.mockReturnValue([])
      mockRepository.count.mockReturnValue(0)

      await service.list({})

      expect(mockRepository.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          limit: 50,
          offset: 0
        })
      )
    })

    test('should pass all filters to repository', async () => {
      mockRepository.findAll.mockReturnValue([])
      mockRepository.count.mockReturnValue(0)

      const query = {
        role: 'talent',
        is_active: true,
        search: 'test',
        org: 'TeamA',
        manager: 'Alice',
        profile_backend: true,
        profile_frontend: false,
        min_level: 30,
        max_level: 60,
        onboarding_completed: true,
        is_remote: false,
        limit: 10,
        offset: 5
      }

      await service.list(query)

      expect(mockRepository.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          role: 'talent',
          is_active: true,
          search: 'test',
          org: 'TeamA',
          manager: 'Alice',
          profile_backend: true,
          profile_frontend: false,
          min_level: 30,
          max_level: 60,
          onboarding_completed: true,
          is_remote: false,
          limit: 10,
          offset: 5
        })
      )
    })

    test('should calculate hasMore correctly when no more results', async () => {
      mockRepository.findAll.mockReturnValue([
        { id: '1', name: 'Alice' }
      ])
      mockRepository.count.mockReturnValue(5)

      const result = await service.list({ limit: 10, offset: 0 })

      expect(result.pagination.hasMore).toBe(false)
    })

    test('should calculate hasMore correctly when more results exist', async () => {
      mockRepository.findAll.mockReturnValue([
        { id: '1', name: 'Alice' }
      ])
      mockRepository.count.mockReturnValue(100)

      const result = await service.list({ limit: 10, offset: 0 })

      expect(result.pagination.hasMore).toBe(true)
    })
  })

  describe('getById()', () => {
    test('should return interviewer when found', async () => {
      const mockInterviewer = { id: 'test-id', name: 'Alice', email: 'alice@example.com' }
      mockRepository.findById.mockReturnValue(mockInterviewer)

      const result = await service.getById('test-id')

      expect(result).toEqual(mockInterviewer)
      expect(mockRepository.findById).toHaveBeenCalledWith('test-id')
    })

    test('should return null when not found', async () => {
      mockRepository.findById.mockReturnValue(null)

      const result = await service.getById('non-existent')

      expect(result).toBeNull()
    })
  })

  describe('create()', () => {
    test('should create interviewer with generated ID', async () => {
      const inputData = {
        name: 'New User',
        email: 'new@example.com',
        role: 'talent',
        skills: ['JavaScript']
      }

      mockRepository.findByEmail.mockReturnValue(null)
      mockRepository.create.mockImplementation((data) => data)

      const result = await service.create(inputData, { userEmail: 'admin@example.com' })

      expect(result.id).toBeDefined()
      expect(typeof result.id).toBe('string')
      expect(result.name).toBe('New User')
      expect(result.email).toBe('new@example.com')
      expect(result.is_active).toBe(true)
      expect(result.calendar_sync_enabled).toBe(false)

      expect(mockRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          id: expect.any(String),
          name: 'New User',
          email: 'new@example.com',
          role: 'talent',
          skills: ['JavaScript'],
          is_active: true,
          calendar_sync_enabled: false
        }),
        { userEmail: 'admin@example.com' }
      )
    })

    test('should throw error if email already exists', async () => {
      const inputData = {
        name: 'New User',
        email: 'existing@example.com',
        role: 'talent',
        skills: []
      }

      mockRepository.findByEmail.mockReturnValue({ id: 'existing-id' })

      await expect(service.create(inputData, {})).rejects.toThrow('Email already exists')
      expect(mockRepository.create).not.toHaveBeenCalled()
    })

    test('should log audit event after creation', async () => {
      const inputData = {
        name: 'New User',
        email: 'new@example.com',
        role: 'talent',
        skills: []
      }

      const createdData = { id: 'mock-id-123', ...inputData, is_active: true, calendar_sync_enabled: false }

      mockRepository.findByEmail.mockReturnValue(null)
      mockRepository.create.mockReturnValue(createdData)

      await service.create(inputData, {
        userEmail: 'admin@example.com',
        userName: 'Admin User'
      })

      expect(mockAuditLogger.log).toHaveBeenCalledWith({
        action: 'CREATE_INTERVIEWER',
        entityType: 'interviewer',
        entityId: 'mock-id-123',
        changes: { created: true },
        userEmail: 'admin@example.com',
        userName: 'Admin User'
      })
    })

    test('should set default values for is_active and calendar_sync_enabled', async () => {
      const inputData = {
        name: 'New User',
        email: 'new@example.com',
        role: 'talent',
        skills: []
      }

      mockRepository.findByEmail.mockReturnValue(null)
      mockRepository.create.mockImplementation((data) => data)

      await service.create(inputData, {})

      expect(mockRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          is_active: true,
          calendar_sync_enabled: false
        }),
        {}
      )
    })

    test('should preserve explicit is_active and calendar_sync_enabled values', async () => {
      const inputData = {
        name: 'New User',
        email: 'new@example.com',
        role: 'talent',
        skills: [],
        is_active: false,
        calendar_sync_enabled: true
      }

      mockRepository.findByEmail.mockReturnValue(null)
      mockRepository.create.mockImplementation((data) => data)

      await service.create(inputData, {})

      expect(mockRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          is_active: false,
          calendar_sync_enabled: true
        }),
        {}
      )
    })
  })

  describe('update()', () => {
    test('should return null if interviewer not found', async () => {
      mockRepository.findById.mockReturnValue(null)

      const result = await service.update('non-existent', { name: 'New Name' }, {})

      expect(result).toBeNull()
      expect(mockRepository.update).not.toHaveBeenCalled()
    })

    test('should update interviewer when found', async () => {
      const existing = { id: 'test-id', name: 'Old Name', email: 'test@example.com' }
      const updates = { name: 'New Name' }
      const updated = { id: 'test-id', name: 'New Name', email: 'test@example.com' }

      mockRepository.findById.mockReturnValue(existing)
      mockRepository.update.mockReturnValue(updated)

      const result = await service.update('test-id', updates, { userEmail: 'admin@example.com' })

      expect(mockRepository.update).toHaveBeenCalledWith('test-id', updates, { userEmail: 'admin@example.com' })
      expect(result).toEqual(updated)
    })

    test('should throw error if email being changed to existing email', async () => {
      const existing = { id: 'test-id', name: 'User', email: 'old@example.com' }
      const updates = { email: 'existing@example.com' }

      mockRepository.findById.mockReturnValue(existing)
      mockRepository.findByEmail.mockReturnValue({ id: 'other-id', email: 'existing@example.com' })

      await expect(service.update('test-id', updates, {})).rejects.toThrow('Email already exists')
      expect(mockRepository.update).not.toHaveBeenCalled()
    })

    test('should allow email update if email unchanged', async () => {
      const existing = { id: 'test-id', name: 'User', email: 'same@example.com' }
      const updates = { email: 'same@example.com', name: 'New Name' }
      const updated = { ...existing, name: 'New Name' }

      mockRepository.findById.mockReturnValue(existing)
      mockRepository.update.mockReturnValue(updated)

      const result = await service.update('test-id', updates, {})

      expect(mockRepository.findByEmail).not.toHaveBeenCalled()
      expect(mockRepository.update).toHaveBeenCalled()
      expect(result).toEqual(updated)
    })

    test('should log audit event with changes', async () => {
      const existing = { id: 'test-id', name: 'Old Name', email: 'test@example.com', role: 'talent' }
      const updates = { name: 'New Name', role: 'admin' }
      const updated = { id: 'test-id', name: 'New Name', email: 'test@example.com', role: 'admin' }

      mockRepository.findById.mockReturnValue(existing)
      mockRepository.update.mockReturnValue(updated)

      await service.update('test-id', updates, {
        userEmail: 'admin@example.com',
        userName: 'Admin User'
      })

      expect(mockAuditLogger.log).toHaveBeenCalledWith({
        action: 'UPDATE_INTERVIEWER',
        entityType: 'interviewer',
        entityId: 'test-id',
        changes: {
          name: { from: 'Old Name', to: 'New Name' },
          role: { from: 'talent', to: 'admin' }
        },
        userEmail: 'admin@example.com',
        userName: 'Admin User'
      })
    })

    test('should not log audit event if no changes', async () => {
      const existing = { id: 'test-id', name: 'Same Name', email: 'test@example.com' }
      const updates = { name: 'Same Name' }
      const updated = existing

      mockRepository.findById.mockReturnValue(existing)
      mockRepository.update.mockReturnValue(updated)

      await service.update('test-id', updates, { userEmail: 'admin@example.com' })

      expect(mockAuditLogger.log).not.toHaveBeenCalled()
    })

    test('should ignore undefined values in changes', async () => {
      const existing = { id: 'test-id', name: 'Name', email: 'test@example.com' }
      const updates = { name: 'New Name', role: undefined }
      const updated = { id: 'test-id', name: 'New Name', email: 'test@example.com' }

      mockRepository.findById.mockReturnValue(existing)
      mockRepository.update.mockReturnValue(updated)

      await service.update('test-id', updates, { userEmail: 'admin@example.com' })

      expect(mockAuditLogger.log).toHaveBeenCalledWith(
        expect.objectContaining({
          changes: {
            name: { from: 'Name', to: 'New Name' }
          }
        })
      )
    })
  })

  describe('delete()', () => {
    test('should return false if interviewer not found', async () => {
      mockRepository.findById.mockReturnValue(null)

      const result = await service.delete('non-existent', {})

      expect(result).toBe(false)
      expect(mockRepository.delete).not.toHaveBeenCalled()
    })

    test('should delete interviewer and return true when found', async () => {
      const existing = { id: 'test-id', name: 'User', email: 'test@example.com' }

      mockRepository.findById.mockReturnValue(existing)
      mockRepository.delete.mockReturnValue(true)

      const result = await service.delete('test-id', { userEmail: 'admin@example.com' })

      expect(mockRepository.delete).toHaveBeenCalledWith('test-id')
      expect(result).toBe(true)
    })

    test('should log audit event after deletion', async () => {
      const existing = { id: 'test-id', name: 'User', email: 'test@example.com' }

      mockRepository.findById.mockReturnValue(existing)
      mockRepository.delete.mockReturnValue(true)

      await service.delete('test-id', {
        userEmail: 'admin@example.com',
        userName: 'Admin User'
      })

      expect(mockAuditLogger.log).toHaveBeenCalledWith({
        action: 'DELETE_INTERVIEWER',
        entityType: 'interviewer',
        entityId: 'test-id',
        changes: { email: 'test@example.com', name: 'User' },
        userEmail: 'admin@example.com',
        userName: 'Admin User'
      })
    })

    test('should not log audit event if deletion fails', async () => {
      const existing = { id: 'test-id', name: 'User', email: 'test@example.com' }

      mockRepository.findById.mockReturnValue(existing)
      mockRepository.delete.mockReturnValue(false)

      await service.delete('test-id', { userEmail: 'admin@example.com' })

      expect(mockAuditLogger.log).not.toHaveBeenCalled()
    })
  })

  describe('_buildChanges()', () => {
    test('should build changes object correctly', () => {
      const original = {
        name: 'Old Name',
        email: 'old@example.com',
        role: 'talent',
        is_active: true
      }

      const updates = {
        name: 'New Name',
        email: 'old@example.com',  // unchanged
        role: 'admin',
        is_active: false
      }

      const changes = service._buildChanges(original, updates)

      expect(changes).toEqual({
        name: { from: 'Old Name', to: 'New Name' },
        role: { from: 'talent', to: 'admin' },
        is_active: { from: true, to: false }
      })
    })

    test('should ignore undefined values', () => {
      const original = {
        name: 'Name',
        email: 'test@example.com'
      }

      const updates = {
        name: 'New Name',
        role: undefined
      }

      const changes = service._buildChanges(original, updates)

      expect(changes).toEqual({
        name: { from: 'Name', to: 'New Name' }
      })
    })

    test('should return empty object when no changes', () => {
      const original = {
        name: 'Same Name',
        email: 'same@example.com'
      }

      const updates = {
        name: 'Same Name',
        email: 'same@example.com'
      }

      const changes = service._buildChanges(original, updates)

      expect(changes).toEqual({})
    })

    test('should handle Migration 003 field changes', () => {
      const original = {
        org: 'TeamA',
        profile_backend: false,
        max_level: 30,
        onboarding_completed: false
      }

      const updates = {
        org: 'TeamB',
        profile_backend: true,
        max_level: 50,
        onboarding_completed: true
      }

      const changes = service._buildChanges(original, updates)

      expect(changes).toEqual({
        org: { from: 'TeamA', to: 'TeamB' },
        profile_backend: { from: false, to: true },
        max_level: { from: 30, to: 50 },
        onboarding_completed: { from: false, to: true }
      })
    })
  })

  describe('Audit logging edge cases', () => {
    test('should handle missing audit logger gracefully in create', async () => {
      const serviceWithoutLogger = new InterviewerService(null, null)
      serviceWithoutLogger.repository = mockRepository

      const inputData = {
        name: 'New User',
        email: 'new@example.com',
        role: 'talent',
        skills: []
      }

      const createdData = { id: 'mock-id-123', ...inputData }

      mockRepository.findByEmail.mockReturnValue(null)
      mockRepository.create.mockReturnValue(createdData)

      // Should not throw error
      await expect(serviceWithoutLogger.create(inputData, {})).resolves.toEqual(createdData)
    })

    test('should handle missing audit logger gracefully in update', async () => {
      const serviceWithoutLogger = new InterviewerService(null, null)
      serviceWithoutLogger.repository = mockRepository

      const existing = { id: 'test-id', name: 'Old Name', email: 'test@example.com' }
      const updates = { name: 'New Name' }
      const updated = { id: 'test-id', name: 'New Name', email: 'test@example.com' }

      mockRepository.findById.mockReturnValue(existing)
      mockRepository.update.mockReturnValue(updated)

      // Should not throw error
      await expect(serviceWithoutLogger.update('test-id', updates, {})).resolves.toEqual(updated)
    })

    test('should handle missing audit logger gracefully in delete', async () => {
      const serviceWithoutLogger = new InterviewerService(null, null)
      serviceWithoutLogger.repository = mockRepository

      const existing = { id: 'test-id', name: 'User', email: 'test@example.com' }

      mockRepository.findById.mockReturnValue(existing)
      mockRepository.delete.mockReturnValue(true)

      // Should not throw error
      await expect(serviceWithoutLogger.delete('test-id', {})).resolves.toBe(true)
    })
  })
})
