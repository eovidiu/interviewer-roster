import { describe, test, expect, jest, beforeEach } from '@jest/globals'
import { UserService } from '../service.js'

describe('UserService', () => {
  let service
  let mockRepository
  let mockAuditLogger

  beforeEach(() => {
    jest.clearAllMocks()

    mockRepository = {
      findAll: jest.fn(),
      count: jest.fn(),
      findByEmail: jest.fn(),
      updateRole: jest.fn(),
      delete: jest.fn()
    }

    mockAuditLogger = {
      log: jest.fn(),
      logRoleChange: jest.fn()
    }

    service = new UserService(mockRepository, mockAuditLogger)
  })

  describe('listUsers()', () => {
    test('should return users with pagination metadata', async () => {
      const mockUsers = [
        { id: '1', email: 'user1@example.com', role: 'admin' },
        { id: '2', email: 'user2@example.com', role: 'talent' }
      ]

      mockRepository.findAll.mockReturnValue(mockUsers)
      mockRepository.count.mockReturnValue(10)

      const result = await service.listUsers({ limit: 2, offset: 0 })

      expect(result.users).toEqual(mockUsers)
      expect(result.total).toBe(10)
      expect(result.hasMore).toBe(true)
    })

    test('should calculate hasMore correctly when no more results', async () => {
      const mockUsers = [
        { id: '1', email: 'user1@example.com', role: 'admin' }
      ]

      mockRepository.findAll.mockReturnValue(mockUsers)
      mockRepository.count.mockReturnValue(1)

      const result = await service.listUsers({ limit: 10, offset: 0 })

      expect(result.hasMore).toBe(false)
    })

    test('should handle empty filters', async () => {
      mockRepository.findAll.mockReturnValue([])
      mockRepository.count.mockReturnValue(0)

      const result = await service.listUsers()

      expect(result.users).toEqual([])
      expect(result.total).toBe(0)
      expect(result.hasMore).toBe(false)
    })
  })

  describe('getUserById()', () => {
    test('should return user when found', async () => {
      const mockUsers = [
        { id: 'test-id', email: 'test@example.com', role: 'admin' },
        { id: 'other-id', email: 'other@example.com', role: 'talent' }
      ]

      mockRepository.findAll.mockReturnValue(mockUsers)

      const result = await service.getUserById('test-id')

      expect(result).toEqual(mockUsers[0])
    })

    test('should return null when not found', async () => {
      mockRepository.findAll.mockReturnValue([])

      const result = await service.getUserById('non-existent')

      expect(result).toBeNull()
    })
  })

  describe('updateUserRole()', () => {
    test('should update role and log change', async () => {
      const existingUser = {
        id: 'user-id',
        email: 'user@example.com',
        role: 'talent'
      }

      const updatedUser = {
        ...existingUser,
        role: 'admin'
      }

      mockRepository.findByEmail.mockReturnValue(existingUser)
      mockRepository.updateRole.mockReturnValue(updatedUser)

      const adminUser = {
        email: 'admin@example.com',
        name: 'Admin User'
      }

      const result = await service.updateUserRole('user@example.com', 'admin', adminUser)

      expect(result).toEqual(updatedUser)
      expect(mockRepository.updateRole).toHaveBeenCalledWith('user@example.com', 'admin')
      expect(mockAuditLogger.logRoleChange).toHaveBeenCalledWith({
        userEmail: 'admin@example.com',
        userName: 'Admin User',
        targetEmail: 'user@example.com',
        targetId: 'user-id',
        oldRole: 'talent',
        newRole: 'admin'
      })
    })

    test('should throw error when user not found', async () => {
      mockRepository.findByEmail.mockReturnValue(null)

      const adminUser = { email: 'admin@example.com', name: 'Admin' }

      await expect(
        service.updateUserRole('non-existent@example.com', 'admin', adminUser)
      ).rejects.toThrow('User not found')

      expect(mockRepository.updateRole).not.toHaveBeenCalled()
      expect(mockAuditLogger.logRoleChange).not.toHaveBeenCalled()
    })
  })

  describe('deleteUser()', () => {
    test('should delete user and log deletion', async () => {
      const user = {
        id: 'user-id',
        email: 'user@example.com',
        name: 'Test User',
        role: 'talent'
      }

      mockRepository.findByEmail.mockReturnValue(user)
      mockRepository.delete.mockReturnValue(true)

      const adminUser = {
        email: 'admin@example.com',
        name: 'Admin User'
      }

      const result = await service.deleteUser('user@example.com', adminUser)

      expect(result).toEqual({ success: true, deletedEmail: 'user@example.com' })
      expect(mockRepository.delete).toHaveBeenCalledWith('user@example.com')
      expect(mockAuditLogger.log).toHaveBeenCalledWith({
        action: 'user.deleted',
        userEmail: 'admin@example.com',
        userName: 'Admin User',
        details: {
          deletedUserEmail: 'user@example.com',
          deletedUserId: 'user-id',
          deletedUserName: 'Test User',
          deletedUserRole: 'talent'
        }
      })
    })

    test('should throw error when trying to delete protected user', async () => {
      const adminUser = { email: 'admin@example.com', name: 'Admin' }

      await expect(
        service.deleteUser('eovidiu@gmail.com', adminUser)
      ).rejects.toThrow('Cannot delete protected user account')

      expect(mockRepository.findByEmail).not.toHaveBeenCalled()
      expect(mockRepository.delete).not.toHaveBeenCalled()
    })

    test('should throw error when trying to delete protected user (case insensitive)', async () => {
      const adminUser = { email: 'admin@example.com', name: 'Admin' }

      await expect(
        service.deleteUser('EOVIDIU@GMAIL.COM', adminUser)
      ).rejects.toThrow('Cannot delete protected user account')
    })

    test('should throw error when user not found', async () => {
      mockRepository.findByEmail.mockReturnValue(null)

      const adminUser = { email: 'admin@example.com', name: 'Admin' }

      await expect(
        service.deleteUser('non-existent@example.com', adminUser)
      ).rejects.toThrow('User not found')

      expect(mockRepository.delete).not.toHaveBeenCalled()
    })

    test('should throw error when deletion fails', async () => {
      const user = {
        id: 'user-id',
        email: 'user@example.com',
        name: 'Test User',
        role: 'talent'
      }

      mockRepository.findByEmail.mockReturnValue(user)
      mockRepository.delete.mockReturnValue(false)

      const adminUser = { email: 'admin@example.com', name: 'Admin' }

      await expect(
        service.deleteUser('user@example.com', adminUser)
      ).rejects.toThrow('Failed to delete user')

      expect(mockAuditLogger.log).not.toHaveBeenCalled()
    })
  })
})
