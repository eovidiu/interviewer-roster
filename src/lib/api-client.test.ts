import { describe, it, expect, beforeEach, vi } from 'vitest'
import { ApiClient } from './api-client'

describe('ApiClient', () => {
  let apiClient: ApiClient
  const mockToken = 'mock-jwt-token-12345'
  const baseURL = 'http://localhost:3000/api'

  beforeEach(() => {
    apiClient = new ApiClient(baseURL)
    // Clear any mocks
    vi.clearAllMocks()
    // Reset fetch mock
    global.fetch = vi.fn()
  })

  describe('setToken', () => {
    it('should store JWT token in memory', () => {
      apiClient.setToken(mockToken)
      expect(apiClient.getToken()).toBe(mockToken)
    })

    it('should clear token when set to null', () => {
      apiClient.setToken(mockToken)
      apiClient.setToken(null)
      expect(apiClient.getToken()).toBe(null)
    })
  })

  describe('GET requests', () => {
    it('should make GET request with auth header', async () => {
      apiClient.setToken(mockToken)

      const mockResponse = { data: [{ id: '1', name: 'Test' }] }
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      })

      const result = await apiClient.get('/interviewers')

      expect(global.fetch).toHaveBeenCalledWith(
        `${baseURL}/interviewers`,
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            Authorization: `Bearer ${mockToken}`,
            'Content-Type': 'application/json',
          }),
        })
      )
      expect(result).toEqual(mockResponse)
    })

    it('should make GET request without auth header when no token', async () => {
      const mockResponse = { status: 'ok' }
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      })

      await apiClient.get('/health')

      expect(global.fetch).toHaveBeenCalledWith(
        `${baseURL}/health`,
        expect.objectContaining({
          method: 'GET',
          headers: expect.not.objectContaining({
            Authorization: expect.anything(),
          }),
        })
      )
    })
  })

  describe('POST requests', () => {
    it('should make POST request with body and auth header', async () => {
      apiClient.setToken(mockToken)

      const requestBody = { name: 'New Interviewer', email: 'test@example.com' }
      const mockResponse = { id: '1', ...requestBody }

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 201,
        json: async () => mockResponse,
      })

      const result = await apiClient.post('/interviewers', requestBody)

      expect(global.fetch).toHaveBeenCalledWith(
        `${baseURL}/interviewers`,
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            Authorization: `Bearer ${mockToken}`,
            'Content-Type': 'application/json',
          }),
          body: JSON.stringify(requestBody),
        })
      )
      expect(result).toEqual(mockResponse)
    })
  })

  describe('PUT requests', () => {
    it('should make PUT request with body and auth header', async () => {
      apiClient.setToken(mockToken)

      const requestBody = { name: 'Updated Name' }
      const mockResponse = { id: '1', name: 'Updated Name' }

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      })

      const result = await apiClient.put('/interviewers/1', requestBody)

      expect(global.fetch).toHaveBeenCalledWith(
        `${baseURL}/interviewers/1`,
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify(requestBody),
        })
      )
      expect(result).toEqual(mockResponse)
    })
  })

  describe('DELETE requests', () => {
    it('should make DELETE request with auth header', async () => {
      apiClient.setToken(mockToken)

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 204,
        json: async () => null,
      })

      await apiClient.delete('/interviewers/1')

      expect(global.fetch).toHaveBeenCalledWith(
        `${baseURL}/interviewers/1`,
        expect.objectContaining({
          method: 'DELETE',
          headers: expect.objectContaining({
            Authorization: `Bearer ${mockToken}`,
          }),
        })
      )
    })
  })

  describe('Error handling', () => {
    it('should throw error for 401 Unauthorized', async () => {
      apiClient.setToken(mockToken)

      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        json: async () => ({ error: 'Unauthorized', message: 'Invalid token' }),
      })

      await expect(apiClient.get('/interviewers')).rejects.toThrow('401')
    })

    it('should throw error for 403 Forbidden', async () => {
      apiClient.setToken(mockToken)

      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 403,
        statusText: 'Forbidden',
        json: async () => ({ error: 'Forbidden', message: 'Insufficient permissions' }),
      })

      await expect(apiClient.get('/audit-logs')).rejects.toThrow('403')
    })

    it('should throw error for 404 Not Found', async () => {
      apiClient.setToken(mockToken)

      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: async () => ({ error: 'Not Found', message: 'Resource not found' }),
      })

      await expect(apiClient.get('/interviewers/999')).rejects.toThrow('404')
    })

    it('should throw error for 500 Internal Server Error', async () => {
      apiClient.setToken(mockToken)

      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: async () => ({ error: 'Internal Server Error' }),
      })

      await expect(apiClient.get('/interviewers')).rejects.toThrow('500')
    })

    it('should throw error for network failure', async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error('Network error'))

      await expect(apiClient.get('/health')).rejects.toThrow('Network error')
    })
  })

  describe('Response handling', () => {
    it('should handle 204 No Content responses', async () => {
      apiClient.setToken(mockToken)

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 204,
        json: async () => {
          throw new Error('No content')
        },
      })

      const result = await apiClient.delete('/interviewers/1')
      expect(result).toBe(undefined)
    })
  })
})
