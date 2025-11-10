import { describe, test, expect, jest, beforeEach } from '@jest/globals'
import { EventService } from '../service.js'

describe('EventService', () => {
  let service
  let mockRepository
  let mockAuditLogger

  beforeEach(() => {
    jest.clearAllMocks()

    mockRepository = {
      findAll: jest.fn(),
      count: jest.fn(),
      findById: jest.fn(),
      findByInterviewer: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      getStatsByStatus: jest.fn()
    }

    mockAuditLogger = {
      log: jest.fn()
    }

    service = new EventService(null, mockAuditLogger)
    service.repository = mockRepository
  })

  describe('list()', () => {
    test('should return events with pagination', async () => {
      const mockEvents = [
        { id: '1', candidate_name: 'Alice', status: 'pending' },
        { id: '2', candidate_name: 'Bob', status: 'attended' }
      ]

      mockRepository.findAll.mockReturnValue(mockEvents)
      mockRepository.count.mockReturnValue(10)

      const result = await service.list({ limit: 2, offset: 0 })

      expect(result.data).toEqual(mockEvents)
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

      const result = await service.list({})

      expect(result.pagination.limit).toBe(50)
      expect(result.pagination.offset).toBe(0)
      expect(mockRepository.findAll).toHaveBeenCalled()
    })

    test('should calculate hasMore correctly', async () => {
      mockRepository.findAll.mockReturnValue([])
      mockRepository.count.mockReturnValue(5)

      const result = await service.list({ limit: 10, offset: 0 })

      expect(result.pagination.hasMore).toBe(false)
    })
  })

  describe('getById()', () => {
    test('should return event when found', async () => {
      const mockEvent = { id: 'test-id', candidate_name: 'Alice' }
      mockRepository.findById.mockReturnValue(mockEvent)

      const result = await service.getById('test-id')

      expect(result).toEqual(mockEvent)
      expect(mockRepository.findById).toHaveBeenCalledWith('test-id')
    })

    test('should throw error when not found', async () => {
      mockRepository.findById.mockReturnValue(null)

      await expect(service.getById('non-existent')).rejects.toThrow('Event not found')
    })
  })

  describe('getByInterviewer()', () => {
    test('should return events for interviewer', async () => {
      const mockEvents = [
        { id: '1', interviewer_email: 'test@example.com' },
        { id: '2', interviewer_email: 'test@example.com' }
      ]

      mockRepository.findByInterviewer.mockReturnValue(mockEvents)

      const result = await service.getByInterviewer('test@example.com')

      expect(result).toEqual(mockEvents)
      expect(mockRepository.findByInterviewer).toHaveBeenCalledWith('test@example.com')
    })
  })

  describe('create()', () => {
    test('should create event with valid data', async () => {
      const inputData = {
        interviewer_email: 'int@example.com',
        candidate_name: 'Alice',
        start_time: '2024-01-15T10:00:00Z',
        end_time: '2024-01-15T11:00:00Z',
        status: 'pending'
      }

      mockRepository.create.mockImplementation((data) => data)

      const result = await service.create(inputData, { userEmail: 'admin@example.com' })

      expect(result.id).toBeDefined()
      expect(result.candidate_name).toBe('Alice')
      expect(result.status).toBe('pending')
      expect(mockRepository.create).toHaveBeenCalled()
    })

    test('should set default status to pending', async () => {
      const inputData = {
        interviewer_email: 'int@example.com',
        start_time: '2024-01-15T10:00:00Z',
        end_time: '2024-01-15T11:00:00Z'
      }

      mockRepository.create.mockImplementation((data) => data)

      const result = await service.create(inputData, {})

      expect(result.status).toBe('pending')
    })

    test('should throw error if end time is before start time', async () => {
      const inputData = {
        interviewer_email: 'int@example.com',
        start_time: '2024-01-15T11:00:00Z',
        end_time: '2024-01-15T10:00:00Z'
      }

      await expect(service.create(inputData, {})).rejects.toThrow('End time must be after start time')
      expect(mockRepository.create).not.toHaveBeenCalled()
    })

    test('should throw error if rating is out of range', async () => {
      const inputData = {
        interviewer_email: 'int@example.com',
        start_time: '2024-01-15T10:00:00Z',
        end_time: '2024-01-15T11:00:00Z',
        rating: 6
      }

      await expect(service.create(inputData, {})).rejects.toThrow('Rating must be between 1 and 5')
    })

    test('should log audit event after creation', async () => {
      const inputData = {
        interviewer_email: 'int@example.com',
        start_time: '2024-01-15T10:00:00Z',
        end_time: '2024-01-15T11:00:00Z'
      }

      const createdEvent = { id: 'new-id', ...inputData, status: 'pending' }
      mockRepository.create.mockReturnValue(createdEvent)

      await service.create(inputData, {
        userEmail: 'admin@example.com',
        userName: 'Admin User'
      })

      expect(mockAuditLogger.log).toHaveBeenCalledWith({
        action: 'CREATE_EVENT',
        entityType: 'event',
        entityId: 'new-id',
        changes: { created: true },
        userEmail: 'admin@example.com',
        userName: 'Admin User'
      })
    })
  })

  describe('update()', () => {
    test('should update event when found', async () => {
      const existing = {
        id: 'test-id',
        candidate_name: 'Old Name',
        start_time: '2024-01-15T10:00:00Z',
        end_time: '2024-01-15T11:00:00Z'
      }

      const updates = {
        candidate_name: 'New Name',
        status: 'attended'
      }

      const updated = { ...existing, ...updates }

      mockRepository.findById.mockReturnValue(existing)
      mockRepository.update.mockReturnValue(updated)

      const result = await service.update('test-id', updates, { userEmail: 'admin@example.com' })

      expect(result.candidate_name).toBe('New Name')
      expect(result.status).toBe('attended')
      expect(mockRepository.update).toHaveBeenCalledWith('test-id', updates, { userEmail: 'admin@example.com' })
    })

    test('should throw error when event not found', async () => {
      mockRepository.findById.mockReturnValue(null)

      await expect(service.update('non-existent', {}, {})).rejects.toThrow('Event not found')
      expect(mockRepository.update).not.toHaveBeenCalled()
    })

    test('should validate time range when both times updated', async () => {
      const existing = {
        id: 'test-id',
        start_time: '2024-01-15T10:00:00Z',
        end_time: '2024-01-15T11:00:00Z'
      }

      mockRepository.findById.mockReturnValue(existing)

      const updates = {
        start_time: '2024-01-15T12:00:00Z',
        end_time: '2024-01-15T11:30:00Z'
      }

      await expect(service.update('test-id', updates, {})).rejects.toThrow('End time must be after start time')
    })

    test('should validate start time against existing end time', async () => {
      const existing = {
        id: 'test-id',
        start_time: '2024-01-15T10:00:00Z',
        end_time: '2024-01-15T11:00:00Z'
      }

      mockRepository.findById.mockReturnValue(existing)

      const updates = {
        start_time: '2024-01-15T12:00:00Z'
      }

      await expect(service.update('test-id', updates, {})).rejects.toThrow('Start time must be before existing end time')
    })

    test('should validate end time against existing start time', async () => {
      const existing = {
        id: 'test-id',
        start_time: '2024-01-15T10:00:00Z',
        end_time: '2024-01-15T11:00:00Z'
      }

      mockRepository.findById.mockReturnValue(existing)

      const updates = {
        end_time: '2024-01-15T09:00:00Z'
      }

      await expect(service.update('test-id', updates, {})).rejects.toThrow('End time must be after existing start time')
    })

    test('should validate rating if provided', async () => {
      const existing = { id: 'test-id', start_time: '2024-01-15T10:00:00Z', end_time: '2024-01-15T11:00:00Z' }

      mockRepository.findById.mockReturnValue(existing)

      const updates = { rating: 0 }

      await expect(service.update('test-id', updates, {})).rejects.toThrow('Rating must be between 1 and 5')
    })

    test('should log audit event after update', async () => {
      const existing = { id: 'test-id', candidate_name: 'Old' }
      const updates = { candidate_name: 'New' }
      const updated = { id: 'test-id', candidate_name: 'New' }

      mockRepository.findById.mockReturnValue(existing)
      mockRepository.update.mockReturnValue(updated)

      await service.update('test-id', updates, {
        userEmail: 'admin@example.com',
        userName: 'Admin'
      })

      expect(mockAuditLogger.log).toHaveBeenCalledWith({
        action: 'UPDATE_EVENT',
        entityType: 'event',
        entityId: 'test-id',
        changes: updates,
        userEmail: 'admin@example.com',
        userName: 'Admin'
      })
    })
  })

  describe('delete()', () => {
    test('should delete event when found', async () => {
      const existing = { id: 'test-id', candidate_name: 'Alice' }

      mockRepository.findById.mockReturnValue(existing)
      mockRepository.delete.mockReturnValue(true)

      const result = await service.delete('test-id', { userEmail: 'admin@example.com' })

      expect(result).toBe(true)
      expect(mockRepository.delete).toHaveBeenCalledWith('test-id')
    })

    test('should throw error when event not found', async () => {
      mockRepository.findById.mockReturnValue(null)

      await expect(service.delete('non-existent', {})).rejects.toThrow('Event not found')
      expect(mockRepository.delete).not.toHaveBeenCalled()
    })

    test('should log audit event after deletion', async () => {
      const existing = { id: 'test-id', candidate_name: 'Alice' }

      mockRepository.findById.mockReturnValue(existing)
      mockRepository.delete.mockReturnValue(true)

      await service.delete('test-id', {
        userEmail: 'admin@example.com',
        userName: 'Admin'
      })

      expect(mockAuditLogger.log).toHaveBeenCalledWith({
        action: 'DELETE_EVENT',
        entityType: 'event',
        entityId: 'test-id',
        changes: { deleted: true },
        userEmail: 'admin@example.com',
        userName: 'Admin'
      })
    })
  })

  describe('getStats()', () => {
    test('should return statistics by status', async () => {
      const mockStats = {
        pending: 5,
        attended: 10,
        ghosted: 2,
        cancelled: 1
      }

      mockRepository.getStatsByStatus.mockReturnValue(mockStats)

      const result = await service.getStats()

      expect(result).toEqual(mockStats)
      expect(mockRepository.getStatsByStatus).toHaveBeenCalled()
    })
  })

  describe('Audit logging edge cases', () => {
    test('should handle missing audit logger in create', async () => {
      const serviceWithoutLogger = new EventService(null, null)
      serviceWithoutLogger.repository = mockRepository

      const inputData = {
        interviewer_email: 'int@example.com',
        start_time: '2024-01-15T10:00:00Z',
        end_time: '2024-01-15T11:00:00Z'
      }

      mockRepository.create.mockImplementation((data) => data)

      await expect(serviceWithoutLogger.create(inputData, {})).resolves.toBeDefined()
    })

    test('should handle missing audit logger in update', async () => {
      const serviceWithoutLogger = new EventService(null, null)
      serviceWithoutLogger.repository = mockRepository

      const existing = { id: 'test-id', start_time: '2024-01-15T10:00:00Z', end_time: '2024-01-15T11:00:00Z' }
      mockRepository.findById.mockReturnValue(existing)
      mockRepository.update.mockReturnValue(existing)

      await expect(serviceWithoutLogger.update('test-id', {}, {})).resolves.toBeDefined()
    })

    test('should handle missing audit logger in delete', async () => {
      const serviceWithoutLogger = new EventService(null, null)
      serviceWithoutLogger.repository = mockRepository

      const existing = { id: 'test-id' }
      mockRepository.findById.mockReturnValue(existing)
      mockRepository.delete.mockReturnValue(true)

      await expect(serviceWithoutLogger.delete('test-id', {})).resolves.toBe(true)
    })
  })
})
