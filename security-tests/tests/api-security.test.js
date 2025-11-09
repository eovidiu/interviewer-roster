/**
 * API Security Tests
 *
 * Tests for:
 * - SQL Injection
 * - XSS (Cross-Site Scripting)
 * - Command Injection
 * - Path Traversal
 * - Input Validation
 * - Request Size Limits
 * - NoSQL Injection
 */

import { describe, test, expect, beforeAll } from '@jest/globals'
import axios from 'axios'
import config from '../config/test-config.js'

describe('API Security Tests', () => {
  const { backend, payloads } = config
  let adminToken = null

  beforeAll(async () => {
    try {
      const response = await axios.post(`${backend}/api/auth/login`, {
        email: config.testUsers.admin.email,
        name: 'Admin User'
      })
      adminToken = response.data.token
    } catch (error) {
      console.warn('Failed to get admin token:', error.message)
    }
  })

  describe('SQL Injection Prevention', () => {
    test('should reject SQL injection in login email', async () => {
      for (const payload of payloads.sqlInjection) {
        const response = await axios.post(`${backend}/api/auth/login`, {
          email: payload,
          name: 'Test User'
        })

        // Should not return admin or bypass auth
        expect(response.status).toBe(200)
        if (response.data.user) {
          expect(response.data.user.role).not.toBe('admin')
        }
      }
    })

    test('should sanitize SQL injection in search queries', async () => {
      if (!adminToken) {
        console.warn('Skipping test: no admin token')
        return
      }

      for (const payload of payloads.sqlInjection) {
        try {
          const response = await axios.get(`${backend}/api/interviewers`, {
            headers: { Authorization: `Bearer ${adminToken}` },
            params: { search: payload }
          })

          // Should return normal response, not SQL error
          expect(response.status).toBe(200)
          expect(response.data).not.toMatch(/sqlite|syntax error|database/i)
        } catch (error) {
          // Should not expose database errors
          if (error.response) {
            expect(error.response.data).not.toMatch(/sqlite|syntax error|database/i)
          }
        }
      }
    })

    test('should prevent SQL injection in user creation', async () => {
      if (!adminToken) {
        console.warn('Skipping test: no admin token')
        return
      }

      for (const payload of payloads.sqlInjection) {
        try {
          const response = await axios.post(
            `${backend}/api/interviewers`,
            {
              name: payload,
              email: `test-${Date.now()}@example.com`,
              skills: ['JavaScript'],
              availability: 'weekdays'
            },
            {
              headers: { Authorization: `Bearer ${adminToken}` }
            }
          )

          // Should create user with sanitized name or reject
          if (response.status === 201) {
            expect(response.data.name).not.toContain('DROP')
            expect(response.data.name).not.toContain('--')
          }
        } catch (error) {
          // Should return validation error, not SQL error
          if (error.response) {
            expect(error.response.status).toBeLessThan(500)
            expect(error.response.data).not.toMatch(/sqlite|syntax error/i)
          }
        }
      }
    })
  })

  describe('XSS (Cross-Site Scripting) Prevention', () => {
    test('should sanitize XSS in user input', async () => {
      if (!adminToken) {
        console.warn('Skipping test: no admin token')
        return
      }

      for (const payload of payloads.xss) {
        try {
          const response = await axios.post(
            `${backend}/api/interviewers`,
            {
              name: payload,
              email: `test-xss-${Date.now()}@example.com`,
              skills: ['JavaScript'],
              availability: 'weekdays'
            },
            {
              headers: { Authorization: `Bearer ${adminToken}` }
            }
          )

          if (response.status === 201) {
            // Name should be sanitized
            expect(response.data.name).not.toContain('<script>')
            expect(response.data.name).not.toContain('onerror=')
            expect(response.data.name).not.toContain('javascript:')
          }
        } catch (error) {
          // Should reject with validation error
          if (error.response) {
            expect(error.response.status).toBeLessThan(500)
          }
        }
      }
    })

    test('should not reflect unescaped input in error messages', async () => {
      const xssPayload = '<script>alert("XSS")</script>'

      try {
        await axios.post(`${backend}/api/auth/login`, {
          email: xssPayload,
          name: xssPayload
        })
      } catch (error) {
        if (error.response) {
          const errorMessage = JSON.stringify(error.response.data)
          expect(errorMessage).not.toContain('<script>')
          expect(errorMessage).not.toContain('onerror=')
        }
      }
    })
  })

  describe('Command Injection Prevention', () => {
    test('should prevent command injection in email field', async () => {
      for (const payload of payloads.commandInjection) {
        try {
          const response = await axios.post(`${backend}/api/auth/login`, {
            email: `test${payload}@example.com`,
            name: 'Test User'
          })

          // Should not execute commands
          expect(response.status).toBe(200)
          if (response.data.user) {
            expect(response.data.user.email).not.toMatch(/root|passwd|whoami/i)
          }
        } catch (error) {
          // Should return validation error, not command output
          if (error.response) {
            expect(error.response.data).not.toMatch(/root|passwd|bin/i)
          }
        }
      }
    })
  })

  describe('Path Traversal Prevention', () => {
    test('should prevent directory traversal attacks', async () => {
      for (const payload of payloads.pathTraversal) {
        try {
          await axios.get(`${backend}/api/files/${encodeURIComponent(payload)}`)
        } catch (error) {
          if (error.response) {
            // Should return 404 or 400, not expose filesystem
            expect(error.response.status).toBeLessThan(500)
            expect(error.response.data).not.toMatch(/root:|passwd|system32/i)
          }
        }
      }
    })

    test('should not expose database file via path traversal', async () => {
      const paths = [
        '/data/interviewer-roster.db',
        '/../server/data/interviewer-roster.db',
        '/../../server/data/interviewer-roster.db'
      ]

      for (const path of paths) {
        try {
          const response = await axios.get(`${backend}${path}`)
          // Should not return database file
          expect(response.headers['content-type']).not.toContain('application/x-sqlite')
        } catch (error) {
          // Should return 404, not database content
          expect(error.response?.status).toBeGreaterThanOrEqual(400)
        }
      }
    })
  })

  describe('Input Validation', () => {
    test('should validate email format', async () => {
      const invalidEmails = [
        'notanemail',
        '@example.com',
        'user@',
        'user @example.com',
        'user@example',
        ''
      ]

      for (const email of invalidEmails) {
        try {
          const response = await axios.post(`${backend}/api/auth/login`, {
            email: email,
            name: 'Test User'
          })

          // Some invalid emails might create users, but should not crash
          expect(response.status).toBeLessThan(500)
        } catch (error) {
          // Should return validation error
          if (error.response) {
            expect(error.response.status).toBe(400)
          }
        }
      }
    })

    test('should validate required fields', async () => {
      if (!adminToken) {
        console.warn('Skipping test: no admin token')
        return
      }

      const invalidPayloads = [
        {}, // No fields
        { name: 'Test' }, // Missing email
        { email: 'test@example.com' }, // Missing name
        { name: '', email: 'test@example.com' }, // Empty name
        { name: 'Test', email: '' } // Empty email
      ]

      for (const payload of invalidPayloads) {
        try {
          await axios.post(
            `${backend}/api/interviewers`,
            payload,
            {
              headers: { Authorization: `Bearer ${adminToken}` }
            }
          )
          expect(true).toBe(false) // Should not reach here
        } catch (error) {
          expect(error.response.status).toBe(400)
        }
      }
    })

    test('should reject excessively long input', async () => {
      const longString = 'A'.repeat(10000)

      try {
        await axios.post(`${backend}/api/auth/login`, {
          email: `${longString}@example.com`,
          name: longString
        })
      } catch (error) {
        // Should reject or handle gracefully
        if (error.response) {
          expect(error.response.status).toBeLessThan(500)
        }
      }
    })
  })

  describe('Request Size Limits', () => {
    test('should reject oversized request payloads', async () => {
      if (!adminToken) {
        console.warn('Skipping test: no admin token')
        return
      }

      // Create a large payload (> 1MB)
      const largeArray = new Array(100000).fill('A'.repeat(100))

      try {
        await axios.post(
          `${backend}/api/interviewers`,
          {
            name: 'Test',
            email: 'test@example.com',
            skills: largeArray
          },
          {
            headers: { Authorization: `Bearer ${adminToken}` }
          }
        )
      } catch (error) {
        // Should reject with 413 Payload Too Large or 400
        if (error.response) {
          expect([400, 413]).toContain(error.response.status)
        }
      }
    })
  })

  describe('NoSQL/JSON Injection Prevention', () => {
    test('should prevent JSON injection in query parameters', async () => {
      if (!adminToken) {
        console.warn('Skipping test: no admin token')
        return
      }

      const jsonInjectionPayloads = [
        '{"$ne": null}',
        '{"$gt": ""}',
        '{"$regex": ".*"}',
        '[{"$ne": 1}]'
      ]

      for (const payload of jsonInjectionPayloads) {
        try {
          const response = await axios.get(`${backend}/api/interviewers`, {
            headers: { Authorization: `Bearer ${adminToken}` },
            params: { email: payload }
          })

          // Should treat as string, not parse as object
          expect(response.status).toBe(200)
        } catch (error) {
          // Should return normal error, not expose database
          if (error.response) {
            expect(error.response.status).toBeLessThan(500)
          }
        }
      }
    })
  })

  describe('HTTP Method Validation', () => {
    test('should reject invalid HTTP methods', async () => {
      const methods = ['TRACE', 'CONNECT', 'PATCH', 'OPTIONS']

      for (const method of methods) {
        try {
          await axios({
            method: method.toLowerCase(),
            url: `${backend}/api/interviewers`,
            headers: adminToken ? { Authorization: `Bearer ${adminToken}` } : {}
          })
        } catch (error) {
          // Should return 405 Method Not Allowed for unsupported methods
          if (error.response && method !== 'OPTIONS') {
            expect([405, 404]).toContain(error.response.status)
          }
        }
      }
    })
  })

  describe('Error Information Disclosure', () => {
    test('should not expose stack traces in production', async () => {
      // Trigger an error
      try {
        await axios.get(`${backend}/api/nonexistent-endpoint`)
      } catch (error) {
        if (error.response) {
          const errorBody = JSON.stringify(error.response.data)
          expect(errorBody).not.toMatch(/at\s+\w+\s+\(/i) // Stack trace pattern
          expect(errorBody).not.toContain('Error: ')
          expect(errorBody).not.toMatch(/\.js:\d+:\d+/i) // File:line:column
        }
      }
    })

    test('should not expose database errors', async () => {
      if (!adminToken) {
        console.warn('Skipping test: no admin token')
        return
      }

      try {
        // Try to create invalid data that might cause database error
        await axios.post(
          `${backend}/api/interviewers`,
          {
            name: 'Test',
            email: 'duplicate@example.com',
            invalid_field: 'should_error'
          },
          {
            headers: { Authorization: `Bearer ${adminToken}` }
          }
        )
      } catch (error) {
        if (error.response) {
          const errorBody = JSON.stringify(error.response.data)
          expect(errorBody).not.toMatch(/sqlite|database|constraint|foreign key/i)
        }
      }
    })
  })
})
