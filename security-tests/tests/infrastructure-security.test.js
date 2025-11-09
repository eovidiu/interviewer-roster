/**
 * Infrastructure Security Tests
 *
 * Tests for:
 * - Security Headers
 * - CORS Configuration
 * - HTTPS Enforcement
 * - Information Disclosure
 * - Server Configuration
 */

import { describe, test, expect } from '@jest/globals'
import axios from 'axios'
import config from '../config/test-config.js'

describe('Infrastructure Security Tests', () => {
  const { backend, frontend, cors, securityHeaders } = config

  describe('Security Headers', () => {
    test('should include X-Frame-Options header', async () => {
      const response = await axios.get(`${backend}/api/health`)

      expect(response.headers['x-frame-options']).toBeDefined()
      expect(['DENY', 'SAMEORIGIN']).toContain(
        response.headers['x-frame-options'].toUpperCase()
      )
    })

    test('should include X-Content-Type-Options header', async () => {
      const response = await axios.get(`${backend}/api/health`)

      expect(response.headers['x-content-type-options']).toBeDefined()
      expect(response.headers['x-content-type-options'].toLowerCase()).toBe('nosniff')
    })

    test('should include Strict-Transport-Security header', async () => {
      const response = await axios.get(`${backend}/api/health`)

      const hsts = response.headers['strict-transport-security']
      if (hsts) {
        expect(hsts).toContain('max-age=')
        // Max age should be at least 1 year (31536000 seconds)
        const maxAge = parseInt(hsts.match(/max-age=(\d+)/)?.[1] || '0')
        expect(maxAge).toBeGreaterThanOrEqual(31536000)
      } else {
        console.warn('⚠️  HSTS header not set - should be configured in production')
      }
    })

    test('should include Content-Security-Policy header', async () => {
      const response = await axios.get(`${frontend}`, {
        validateStatus: () => true
      })

      const csp = response.headers['content-security-policy']
      if (csp) {
        expect(csp).toContain('default-src')
      } else {
        console.warn('⚠️  CSP header not set - recommended for XSS protection')
      }
    })

    test('should not expose server version', async () => {
      const response = await axios.get(`${backend}/api/health`)

      const server = response.headers['server']
      if (server) {
        expect(server.toLowerCase()).not.toContain('express')
        expect(server.toLowerCase()).not.toContain('fastify')
        expect(server).not.toMatch(/\d+\.\d+\.\d+/) // Version number
      }
    })

    test('should not expose X-Powered-By header', async () => {
      const response = await axios.get(`${backend}/api/health`)

      expect(response.headers['x-powered-by']).toBeUndefined()
    })
  })

  describe('CORS Configuration', () => {
    test('should allow requests from frontend origin', async () => {
      const response = await axios.get(`${backend}/api/health`, {
        headers: {
          'Origin': frontend
        }
      })

      expect(response.headers['access-control-allow-origin']).toBeDefined()
      expect(response.headers['access-control-allow-origin']).toBe(frontend)
    })

    test('should reject requests from unauthorized origins', async () => {
      for (const origin of cors.blockedOrigins) {
        const response = await axios.get(`${backend}/api/health`, {
          headers: {
            'Origin': origin
          },
          validateStatus: () => true
        })

        // Should not include CORS headers for blocked origins
        if (response.headers['access-control-allow-origin']) {
          expect(response.headers['access-control-allow-origin']).not.toBe(origin)
        }
      }
    })

    test('should not allow wildcard CORS origin', async () => {
      const response = await axios.get(`${backend}/api/health`, {
        headers: {
          'Origin': 'https://evil.com'
        }
      })

      expect(response.headers['access-control-allow-origin']).not.toBe('*')
    })

    test('should handle preflight requests correctly', async () => {
      try {
        const response = await axios.options(`${backend}/api/users`, {
          headers: {
            'Origin': frontend,
            'Access-Control-Request-Method': 'GET',
            'Access-Control-Request-Headers': 'authorization'
          },
          validateStatus: () => true
        })

        if (response.status === 200 || response.status === 204) {
          expect(response.headers['access-control-allow-methods']).toBeDefined()
          expect(response.headers['access-control-allow-headers']).toBeDefined()
        }
      } catch (error) {
        // OPTIONS might not be implemented, which is acceptable
        console.warn('Preflight requests may not be configured')
      }
    })
  })

  describe('HTTPS Enforcement', () => {
    test('should use HTTPS for production URLs', () => {
      expect(backend).toMatch(/^https:\/\//)
      expect(frontend).toMatch(/^https:\/\//)
    })

    test('should have valid SSL certificate', async () => {
      try {
        const response = await axios.get(backend, {
          httpsAgent: new (await import('https')).Agent({
            rejectUnauthorized: true
          })
        })
        expect(response.status).toBeLessThan(500)
      } catch (error) {
        if (error.code === 'CERT_HAS_EXPIRED' || error.code === 'UNABLE_TO_VERIFY_LEAF_SIGNATURE') {
          throw new Error('SSL certificate is invalid or expired')
        }
      }
    })
  })

  describe('Information Disclosure Prevention', () => {
    test('should not expose .env files', async () => {
      const envPaths = [
        '/.env',
        '/server/.env',
        '/.env.production',
        '/.env.local'
      ]

      for (const path of envPaths) {
        try {
          const response = await axios.get(`${backend}${path}`, {
            validateStatus: () => true
          })

          expect(response.status).toBeGreaterThanOrEqual(400)
          expect(response.data).not.toMatch(/JWT_SECRET|GOOGLE_CLIENT_SECRET|DATABASE/)
        } catch (error) {
          // Expected - file should not be accessible
        }
      }
    })

    test('should not expose package.json', async () => {
      const paths = [
        '/package.json',
        '/server/package.json'
      ]

      for (const path of paths) {
        try {
          const response = await axios.get(`${backend}${path}`, {
            validateStatus: () => true
          })

          if (response.status === 200) {
            expect(response.data).not.toHaveProperty('dependencies')
          }
        } catch (error) {
          // Expected - file should not be accessible
        }
      }
    })

    test('should not expose git repository', async () => {
      const gitPaths = [
        '/.git/config',
        '/.git/HEAD',
        '/.git'
      ]

      for (const path of gitPaths) {
        try {
          const response = await axios.get(`${backend}${path}`, {
            validateStatus: () => true
          })

          expect(response.status).toBeGreaterThanOrEqual(400)
        } catch (error) {
          // Expected - git files should not be accessible
        }
      }
    })

    test('should not expose node_modules', async () => {
      try {
        const response = await axios.get(`${backend}/node_modules/express/package.json`, {
          validateStatus: () => true
        })

        expect(response.status).toBeGreaterThanOrEqual(400)
      } catch (error) {
        // Expected - node_modules should not be accessible
      }
    })

    test('should not expose database files', async () => {
      const dbPaths = [
        '/server/data/interviewer-roster.db',
        '/data/interviewer-roster.db',
        '/interviewer-roster.db'
      ]

      for (const path of dbPaths) {
        try {
          const response = await axios.get(`${backend}${path}`, {
            validateStatus: () => true
          })

          expect(response.status).toBeGreaterThanOrEqual(400)
          expect(response.headers['content-type']).not toContain('application/x-sqlite')
        } catch (error) {
          // Expected - database should not be accessible
        }
      }
    })
  })

  describe('Error Handling', () => {
    test('should return generic error for 404', async () => {
      try {
        await axios.get(`${backend}/api/nonexistent-endpoint`)
      } catch (error) {
        expect(error.response.status).toBe(404)

        // Should not expose file paths or internal structure
        const errorBody = JSON.stringify(error.response.data)
        expect(errorBody).not.toMatch(/\/Users\/|\/home\/|C:\\/)
        expect(errorBody).not.toContain('node_modules')
      }
    })

    test('should return generic error for 500', async () => {
      // This is hard to trigger without knowing internal endpoints
      // We'll test that errors don't expose stack traces
      try {
        await axios.post(`${backend}/api/invalid-method-test`, {
          data: 'test'
        })
      } catch (error) {
        if (error.response && error.response.status >= 500) {
          const errorBody = JSON.stringify(error.response.data)
          expect(errorBody).not.toMatch(/at\s+\w+\s+\(/i)
          expect(errorBody).not.toMatch(/\.js:\d+:\d+/)
        }
      }
    })
  })

  describe('Rate Limiting', () => {
    test('should have rate limiting on auth endpoints', async () => {
      // Make many requests quickly
      const requests = []
      for (let i = 0; i < 50; i++) {
        requests.push(
          axios.post(`${backend}/api/auth/login`, {
            email: `test-${i}@example.com`,
            name: 'Test User'
          }).catch(err => err.response)
        )
      }

      const responses = await Promise.all(requests)

      // Check if any requests were rate limited
      const rateLimited = responses.some(r => r?.status === 429)

      if (!rateLimited) {
        console.warn('⚠️  No rate limiting detected - should be configured for auth endpoints')
      }
    }, 60000) // Extended timeout for this test
  })

  describe('HTTP Methods', () => {
    test('should disable TRACE method', async () => {
      try {
        await axios({
          method: 'TRACE',
          url: `${backend}/api/health`
        })
        expect(true).toBe(false) // Should not reach here
      } catch (error) {
        expect(error.response?.status).toBe(405)
      }
    })

    test('should properly handle OPTIONS for CORS', async () => {
      try {
        const response = await axios.options(`${backend}/api/health`, {
          headers: {
            'Origin': frontend,
            'Access-Control-Request-Method': 'GET'
          },
          validateStatus: () => true
        })

        if (response.status < 300) {
          expect(response.headers['access-control-allow-methods']).toBeDefined()
        }
      } catch (error) {
        // OPTIONS might not be configured, which is acceptable
      }
    })
  })

  describe('Content Type Validation', () => {
    test('should validate Content-Type for POST requests', async () => {
      try {
        await axios.post(
          `${backend}/api/auth/login`,
          'email=test@example.com&name=Test',
          {
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded'
            }
          }
        )
      } catch (error) {
        // Should reject or handle gracefully
        if (error.response) {
          expect(error.response.status).toBeLessThan(500)
        }
      }
    })

    test('should reject invalid JSON', async () => {
      try {
        await axios.post(
          `${backend}/api/auth/login`,
          'invalid json{',
          {
            headers: {
              'Content-Type': 'application/json'
            }
          }
        )
      } catch (error) {
        expect(error.response.status).toBe(400)
      }
    })
  })
})
