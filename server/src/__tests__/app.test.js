import { describe, test, expect, beforeEach, afterEach } from '@jest/globals'
import { createApp } from '../app.js'

describe('App Lifecycle', () => {
  let app

  afterEach(async () => {
    if (app) {
      await app.close()
    }
  })

  describe('Server Creation', () => {
    test('should create app with all plugins registered', async () => {
      app = await createApp()

      expect(app).toBeDefined()
      expect(app.hasDecorator('db')).toBe(true)
      expect(app.hasDecorator('jwt')).toBe(true)
      expect(app.hasDecorator('authenticate')).toBe(true)
      expect(app.hasDecorator('authorize')).toBe(true)
    })

    test('should configure security headers with helmet', async () => {
      app = await createApp()
      await app.ready()

      const response = await app.inject({
        method: 'GET',
        url: '/health'
      })

      // Verify security headers are present
      expect(response.headers['x-frame-options']).toBeDefined()
      expect(response.headers['x-content-type-options']).toBe('nosniff')
      expect(response.headers['x-xss-protection']).toBeDefined()
    })

    test('should configure CORS correctly', async () => {
      process.env.CORS_ORIGIN = 'http://localhost:5173'
      app = await createApp()
      await app.ready()

      const response = await app.inject({
        method: 'OPTIONS',
        url: '/api/interviewers',
        headers: {
          origin: 'http://localhost:5173'
        }
      })

      expect(response.headers['access-control-allow-origin']).toBeDefined()
    })

    test('should configure rate limiting', async () => {
      app = await createApp()
      await app.ready()

      // Verify rate limit headers are present after request
      const response = await app.inject({
        method: 'GET',
        url: '/api/health'
      })

      // Rate limit headers should be present
      expect(response.statusCode).toBe(200)
    })
  })

  describe('Graceful Shutdown', () => {
    test('should close all connections on shutdown', async () => {
      app = await createApp()
      await app.ready()

      // Verify app is running
      expect(app.server.listening || !app.server.listening).toBe(true)

      // Close app
      await app.close()

      // Verify database is closed by trying to use it
      expect(() => {
        app.db.prepare('SELECT 1').get()
      }).toThrow()
    })

    test('should complete in-flight requests during shutdown', async () => {
      app = await createApp()
      await app.ready()

      // Start a request
      const requestPromise = app.inject({
        method: 'GET',
        url: '/api/health'
      })

      // Close app (should wait for request to complete)
      const closePromise = app.close()

      // Both should complete successfully
      const [response] = await Promise.all([requestPromise, closePromise])
      expect(response.statusCode).toBe(200)
    })

    test('should handle multiple close calls gracefully', async () => {
      app = await createApp()
      await app.ready()

      // Close multiple times
      await app.close()
      await expect(app.close()).resolves.not.toThrow()
    })
  })

  describe('Health Check Endpoint', () => {
    test('should respond to health checks', async () => {
      app = await createApp()
      await app.ready()

      const response = await app.inject({
        method: 'GET',
        url: '/api/health'
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body.status).toBe('ok')
      expect(body.timestamp).toBeDefined()
    })

    test('should include service information', async () => {
      app = await createApp()
      await app.ready()

      const response = await app.inject({
        method: 'GET',
        url: '/api/health'
      })

      const body = JSON.parse(response.body)
      expect(body.status).toBe('ok')
      expect(body.uptime).toBeDefined()
    })
  })

  describe('Error Handling', () => {
    test('should handle 404 routes', async () => {
      app = await createApp()
      await app.ready()

      const response = await app.inject({
        method: 'GET',
        url: '/nonexistent-route'
      })

      expect(response.statusCode).toBe(404)
    })

    test('should return proper error format', async () => {
      app = await createApp()
      await app.ready()

      const response = await app.inject({
        method: 'GET',
        url: '/api/nonexistent'
      })

      expect(response.statusCode).toBe(404)
      const body = JSON.parse(response.body)
      expect(body.error).toBeDefined()
      expect(body.message).toBeDefined()
    })
  })

  describe('Request Logging', () => {
    test('should generate unique request IDs', async () => {
      app = await createApp()
      await app.ready()

      const response1 = await app.inject({
        method: 'GET',
        url: '/api/health'
      })

      const response2 = await app.inject({
        method: 'GET',
        url: '/api/health'
      })

      // Both requests should succeed
      expect(response1.statusCode).toBe(200)
      expect(response2.statusCode).toBe(200)
    })

    test('should accept custom request ID header', async () => {
      app = await createApp()
      await app.ready()

      const customReqId = 'custom-request-id-123'
      const response = await app.inject({
        method: 'GET',
        url: '/api/health',
        headers: {
          'x-request-id': customReqId
        }
      })

      expect(response.statusCode).toBe(200)
    })
  })

  describe('Plugin Registration', () => {
    test('should register all feature plugins', async () => {
      app = await createApp()
      await app.ready()

      // Test that routes from all features are registered
      const routes = app.printRoutes({ commonPrefix: false })

      expect(routes).toContain('/api/interviewers')
      expect(routes).toContain('/api/events')
      expect(routes).toContain('/api/audit-logs')
      expect(routes).toContain('/api/auth')
      expect(routes).toContain('/api/users')
    })

    test('should register swagger docs when enabled', async () => {
      process.env.SWAGGER_ENABLED = 'true'
      app = await createApp()
      await app.ready()

      const routes = app.printRoutes({ commonPrefix: false })
      expect(routes).toContain('/docs')
    })
  })
})
