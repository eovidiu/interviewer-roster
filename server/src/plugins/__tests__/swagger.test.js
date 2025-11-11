import { describe, test, expect, beforeEach, afterEach } from '@jest/globals'
import Fastify from 'fastify'
import swaggerPlugin from '../swagger.js'

describe('Swagger Plugin', () => {
  let app

  beforeEach(async () => {
    app = Fastify({ logger: false })

    // Set environment variables for testing
    process.env.SWAGGER_ENABLED = 'true'
    process.env.PORT = '3000'
  })

  afterEach(async () => {
    if (app) {
      await app.close()
    }
  })

  test('should register swagger plugin when enabled', async () => {
    process.env.SWAGGER_ENABLED = 'true'

    await app.register(swaggerPlugin)
    await app.ready()

    // Check if swagger routes are registered
    const routes = app.printRoutes({ commonPrefix: false })
    expect(routes).toContain('/docs')
  })

  test('should handle being disabled gracefully', async () => {
    process.env.SWAGGER_ENABLED = 'false'

    // Should not throw when registering with swagger disabled
    await expect(app.register(swaggerPlugin)).resolves.not.toThrow()
    await expect(app.ready()).resolves.not.toThrow()
  })

  test('should serve Swagger UI at /docs', async () => {
    process.env.SWAGGER_ENABLED = 'true'

    await app.register(swaggerPlugin)
    await app.ready()

    const response = await app.inject({
      method: 'GET',
      url: '/docs/'
    })

    expect(response.statusCode).toBe(200)
    expect(response.headers['content-type']).toContain('text/html')
  })

  test('should serve OpenAPI specification at /docs/json', async () => {
    process.env.SWAGGER_ENABLED = 'true'

    await app.register(swaggerPlugin)

    // Add a test route
    app.get('/test', {
      schema: {
        description: 'Test endpoint',
        tags: ['test'],
        response: {
          200: {
            type: 'object',
            properties: {
              message: { type: 'string' }
            }
          }
        }
      }
    }, async () => {
      return { message: 'test' }
    })

    await app.ready()

    const response = await app.inject({
      method: 'GET',
      url: '/docs/json'
    })

    expect(response.statusCode).toBe(200)
    const spec = JSON.parse(response.body)
    expect(spec.openapi).toBeDefined()
    expect(spec.info.title).toBe('Interviewer Roster API')
  })

  test('should include API metadata in OpenAPI spec', async () => {
    process.env.SWAGGER_ENABLED = 'true'

    await app.register(swaggerPlugin)
    await app.ready()

    const response = await app.inject({
      method: 'GET',
      url: '/docs/json'
    })

    const spec = JSON.parse(response.body)
    expect(spec.info.title).toBe('Interviewer Roster API')
    expect(spec.info.version).toBe('1.0.0')
    expect(spec.info.description).toContain('REST API')
  })

  test('should include security schemes in OpenAPI spec', async () => {
    process.env.SWAGGER_ENABLED = 'true'

    await app.register(swaggerPlugin)
    await app.ready()

    const response = await app.inject({
      method: 'GET',
      url: '/docs/json'
    })

    const spec = JSON.parse(response.body)
    expect(spec.components.securitySchemes.bearerAuth).toBeDefined()
    expect(spec.components.securitySchemes.bearerAuth.type).toBe('http')
    expect(spec.components.securitySchemes.bearerAuth.scheme).toBe('bearer')
  })

  test('should include tags in OpenAPI spec', async () => {
    process.env.SWAGGER_ENABLED = 'true'

    await app.register(swaggerPlugin)
    await app.ready()

    const response = await app.inject({
      method: 'GET',
      url: '/docs/json'
    })

    const spec = JSON.parse(response.body)
    expect(spec.tags).toBeDefined()
    const tagNames = spec.tags.map(t => t.name)
    expect(tagNames).toContain('auth')
    expect(tagNames).toContain('interviewers')
    expect(tagNames).toContain('events')
    expect(tagNames).toContain('audit-logs')
  })

  test('should include server URL in OpenAPI spec', async () => {
    process.env.SWAGGER_ENABLED = 'true'
    process.env.PORT = '3000'

    await app.register(swaggerPlugin)
    await app.ready()

    const response = await app.inject({
      method: 'GET',
      url: '/docs/json'
    })

    const spec = JSON.parse(response.body)
    expect(spec.servers).toBeDefined()
    expect(spec.servers[0].url).toBe('http://localhost:3000')
  })

  test('should document registered routes in OpenAPI spec', async () => {
    process.env.SWAGGER_ENABLED = 'true'

    await app.register(swaggerPlugin)

    // Register a test route with schema
    app.get('/api/test/:id', {
      schema: {
        description: 'Get test item by ID',
        tags: ['test'],
        params: {
          type: 'object',
          properties: {
            id: { type: 'string' }
          }
        },
        response: {
          200: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' }
            }
          }
        }
      }
    }, async (request) => {
      return { id: request.params.id, name: 'test' }
    })

    await app.ready()

    const response = await app.inject({
      method: 'GET',
      url: '/docs/json'
    })

    const spec = JSON.parse(response.body)
    expect(spec.paths['/api/test/{id}']).toBeDefined()
    expect(spec.paths['/api/test/{id}'].get).toBeDefined()
  })
})
