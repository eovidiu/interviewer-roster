import { describe, test, expect, beforeEach, afterEach } from '@jest/globals'
import Fastify from 'fastify'
import authPlugin from '../auth.js'

describe('Auth Plugin', () => {
  let app

  beforeEach(async () => {
    app = Fastify({ logger: false })

    // Set JWT secret for testing
    process.env.JWT_SECRET = 'test-secret-key-for-testing'
    process.env.JWT_EXPIRES_IN = '1h'
  })

  afterEach(async () => {
    if (app) {
      await app.close()
    }
  })

  test('should register auth plugin', async () => {
    await app.register(authPlugin)
    await app.ready()

    expect(app.hasDecorator('authenticate')).toBe(true)
    expect(app.hasDecorator('authorize')).toBe(true)
  })

  test('should register JWT plugin', async () => {
    await app.register(authPlugin)
    await app.ready()

    expect(app.hasDecorator('jwt')).toBe(true)
    expect(typeof app.jwt.sign).toBe('function')
    expect(typeof app.jwt.verify).toBe('function')
  })

  test('should sign and verify JWT tokens', async () => {
    await app.register(authPlugin)
    await app.ready()

    const payload = { userId: '123', email: 'test@example.com', role: 'admin' }
    const token = app.jwt.sign(payload)

    expect(token).toBeDefined()
    expect(typeof token).toBe('string')

    const decoded = app.jwt.verify(token)
    expect(decoded.userId).toBe('123')
    expect(decoded.email).toBe('test@example.com')
    expect(decoded.role).toBe('admin')
  })

  test('authenticate decorator should verify valid JWT', async () => {
    await app.register(authPlugin)

    app.get('/protected', {
      preHandler: app.authenticate
    }, async (request) => {
      return { user: request.user }
    })

    await app.ready()

    const token = app.jwt.sign({ userId: '123', role: 'admin' })

    const response = await app.inject({
      method: 'GET',
      url: '/protected',
      headers: {
        authorization: `Bearer ${token}`
      }
    })

    expect(response.statusCode).toBe(200)
    const body = JSON.parse(response.body)
    expect(body.user.userId).toBe('123')
  })

  test('authenticate decorator should reject invalid JWT', async () => {
    await app.register(authPlugin)

    app.get('/protected', {
      preHandler: app.authenticate
    }, async () => {
      return { success: true }
    })

    await app.ready()

    const response = await app.inject({
      method: 'GET',
      url: '/protected',
      headers: {
        authorization: 'Bearer invalid-token'
      }
    })

    expect(response.statusCode).toBe(401)
  })

  test('authenticate decorator should reject missing JWT', async () => {
    await app.register(authPlugin)

    app.get('/protected', {
      preHandler: app.authenticate
    }, async () => {
      return { success: true }
    })

    await app.ready()

    const response = await app.inject({
      method: 'GET',
      url: '/protected'
    })

    expect(response.statusCode).toBe(401)
  })

  test('authorize decorator should allow authorized roles', async () => {
    await app.register(authPlugin)

    app.get('/admin-only', {
      preHandler: app.authorize(['admin'])
    }, async () => {
      return { success: true }
    })

    await app.ready()

    const token = app.jwt.sign({ userId: '123', role: 'admin' })

    const response = await app.inject({
      method: 'GET',
      url: '/admin-only',
      headers: {
        authorization: `Bearer ${token}`
      }
    })

    expect(response.statusCode).toBe(200)
  })

  test('authorize decorator should reject unauthorized roles', async () => {
    await app.register(authPlugin)

    app.get('/admin-only', {
      preHandler: app.authorize(['admin'])
    }, async () => {
      return { success: true }
    })

    await app.ready()

    const token = app.jwt.sign({ userId: '123', role: 'viewer' })

    const response = await app.inject({
      method: 'GET',
      url: '/admin-only',
      headers: {
        authorization: `Bearer ${token}`
      }
    })

    expect(response.statusCode).toBe(403)
    const body = JSON.parse(response.body)
    expect(body.error).toBe('Forbidden')
    expect(body.message).toContain('viewer')
  })

  test('authorize decorator should allow multiple roles', async () => {
    await app.register(authPlugin)

    app.get('/staff-only', {
      preHandler: app.authorize(['admin', 'talent'])
    }, async () => {
      return { success: true }
    })

    await app.ready()

    // Test with admin role
    const adminToken = app.jwt.sign({ userId: '123', role: 'admin' })
    const adminResponse = await app.inject({
      method: 'GET',
      url: '/staff-only',
      headers: {
        authorization: `Bearer ${adminToken}`
      }
    })
    expect(adminResponse.statusCode).toBe(200)

    // Test with talent role
    const talentToken = app.jwt.sign({ userId: '456', role: 'talent' })
    const talentResponse = await app.inject({
      method: 'GET',
      url: '/staff-only',
      headers: {
        authorization: `Bearer ${talentToken}`
      }
    })
    expect(talentResponse.statusCode).toBe(200)

    // Test with viewer role (should be rejected)
    const viewerToken = app.jwt.sign({ userId: '789', role: 'viewer' })
    const viewerResponse = await app.inject({
      method: 'GET',
      url: '/staff-only',
      headers: {
        authorization: `Bearer ${viewerToken}`
      }
    })
    expect(viewerResponse.statusCode).toBe(403)
  })

  test('JWT should expire after configured time', async () => {
    // Set short expiration for testing
    process.env.JWT_EXPIRES_IN = '1s'

    const tempApp = Fastify({ logger: false })
    await tempApp.register(authPlugin)
    await tempApp.ready()

    const token = tempApp.jwt.sign({ userId: '123', role: 'admin' })

    // Wait for token to expire
    await new Promise(resolve => setTimeout(resolve, 1100))

    // Verify should throw for expired token
    try {
      tempApp.jwt.verify(token)
      expect(true).toBe(false) // Should not reach here
    } catch (error) {
      expect(error.message).toContain('exp')
    }

    await tempApp.close()
  })
})
