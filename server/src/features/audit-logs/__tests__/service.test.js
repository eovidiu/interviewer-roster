import { describe, test, expect, jest, beforeEach } from '@jest/globals'
import { AuditLogService } from '../service.js'

describe('AuditLogService', () => {
  let service
  let mockRepository

  beforeEach(() => {
    jest.clearAllMocks()

    mockRepository = {
      findAll: jest.fn(),
      count: jest.fn(),
      findById: jest.fn(),
      findByEntity: jest.fn(),
      findByUser: jest.fn(),
      getStatsByAction: jest.fn(),
      findRecent: jest.fn()
    }

    service = new AuditLogService(null)
    service.repository = mockRepository
  })

  describe('list()', () => {
    test('should return audit logs with pagination', async () => {
      const mockLogs = [
        { id: '1', action: 'CREATE_INTERVIEWER', userEmail: 'admin@example.com' },
        { id: '2', action: 'UPDATE_EVENT', userEmail: 'admin@example.com' }
      ]

      mockRepository.findAll.mockReturnValue(mockLogs)
      mockRepository.count.mockReturnValue(10)

      const result = await service.list({ limit: 2, offset: 0 })

      expect(result.data).toEqual(mockLogs)
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
    })

    test('should calculate hasMore correctly', async () => {
      mockRepository.findAll.mockReturnValue([])
      mockRepository.count.mockReturnValue(5)

      const result = await service.list({ limit: 10, offset: 0 })

      expect(result.pagination.hasMore).toBe(false)
    })
  })

  describe('getById()', () => {
    test('should return audit log when found', async () => {
      const mockLog = {
        id: 'test-id',
        action: 'CREATE_INTERVIEWER',
        userEmail: 'admin@example.com'
      }

      mockRepository.findById.mockReturnValue(mockLog)

      const result = await service.getById('test-id')

      expect(result).toEqual(mockLog)
      expect(mockRepository.findById).toHaveBeenCalledWith('test-id')
    })

    test('should throw error when not found', async () => {
      mockRepository.findById.mockReturnValue(null)

      await expect(service.getById('non-existent')).rejects.toThrow('Audit log not found')
    })
  })

  describe('getByEntity()', () => {
    test('should return audit logs for specific entity', async () => {
      const mockLogs = [
        { id: '1', entityType: 'interviewer', entityId: 'int-1', action: 'CREATE_INTERVIEWER' },
        { id: '2', entityType: 'interviewer', entityId: 'int-1', action: 'UPDATE_INTERVIEWER' }
      ]

      mockRepository.findByEntity.mockReturnValue(mockLogs)

      const result = await service.getByEntity('interviewer', 'int-1')

      expect(result).toEqual(mockLogs)
      expect(mockRepository.findByEntity).toHaveBeenCalledWith('interviewer', 'int-1')
    })

    test('should return empty array when no logs found', async () => {
      mockRepository.findByEntity.mockReturnValue([])

      const result = await service.getByEntity('interviewer', 'non-existent')

      expect(result).toEqual([])
    })
  })

  describe('getByUser()', () => {
    test('should return audit logs for specific user', async () => {
      const mockLogs = [
        { id: '1', userEmail: 'admin@example.com', action: 'CREATE_INTERVIEWER' },
        { id: '2', userEmail: 'admin@example.com', action: 'DELETE_EVENT' }
      ]

      mockRepository.findByUser.mockReturnValue(mockLogs)

      const result = await service.getByUser('admin@example.com')

      expect(result).toEqual(mockLogs)
      expect(mockRepository.findByUser).toHaveBeenCalledWith('admin@example.com')
    })

    test('should return empty array when no logs found for user', async () => {
      mockRepository.findByUser.mockReturnValue([])

      const result = await service.getByUser('non-existent@example.com')

      expect(result).toEqual([])
    })
  })

  describe('getStats()', () => {
    test('should return statistics by action', async () => {
      const mockStats = {
        CREATE_INTERVIEWER: 5,
        UPDATE_INTERVIEWER: 10,
        DELETE_INTERVIEWER: 2,
        CREATE_EVENT: 15,
        UPDATE_EVENT: 8,
        DELETE_EVENT: 3
      }

      mockRepository.getStatsByAction.mockReturnValue(mockStats)

      const result = await service.getStats()

      expect(result).toEqual(mockStats)
      expect(mockRepository.getStatsByAction).toHaveBeenCalled()
    })

    test('should handle empty stats', async () => {
      mockRepository.getStatsByAction.mockReturnValue({})

      const result = await service.getStats()

      expect(result).toEqual({})
    })
  })

  describe('getRecent()', () => {
    test('should return recent audit logs with default limit', async () => {
      const mockLogs = [
        { id: '1', action: 'CREATE_INTERVIEWER', timestamp: '2024-01-15T10:00:00Z' },
        { id: '2', action: 'UPDATE_EVENT', timestamp: '2024-01-15T09:00:00Z' }
      ]

      mockRepository.findRecent.mockReturnValue(mockLogs)

      const result = await service.getRecent()

      expect(result).toEqual(mockLogs)
      expect(mockRepository.findRecent).toHaveBeenCalledWith(50)
    })

    test('should return recent audit logs with custom limit', async () => {
      const mockLogs = [
        { id: '1', action: 'CREATE_INTERVIEWER', timestamp: '2024-01-15T10:00:00Z' }
      ]

      mockRepository.findRecent.mockReturnValue(mockLogs)

      const result = await service.getRecent(10)

      expect(result).toEqual(mockLogs)
      expect(mockRepository.findRecent).toHaveBeenCalledWith(10)
    })

    test('should handle empty recent logs', async () => {
      mockRepository.findRecent.mockReturnValue([])

      const result = await service.getRecent(5)

      expect(result).toEqual([])
    })
  })
})
