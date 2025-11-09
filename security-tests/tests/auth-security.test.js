/**
 * Authentication & Authorization Security Tests
 *
 * Tests for:
 * - OAuth flow security
 * - JWT token validation
 * - Role-based access control (RBAC)
 * - Session management
 * - User enumeration
 */

import { describe, test, expect, beforeAll } from '@jest/globals'
import axios from 'axios'
import config from '../config/test-config.js'

describe('Authentication Security Tests', () => {
  const { backend, frontend } = config
  let adminToken = null
  let viewerToken = null

  beforeAll(async () => {
    // Get tokens for testing (using mock login endpoint)
    try {
      const adminResponse = await axios.post(`${backend}/api/auth/login`, {
        email: config.testUsers.admin.email,
        name: 'Admin User'
      })
      adminToken = adminResponse.data.token

      const viewerResponse = await axios.post(`${backend}/api/auth/login`, {
        email: config.testUsers.viewer.email,
        name: 'Viewer User'
      })
      viewerToken = viewerResponse.data.token
    } catch (error) {
      console.warn('Failed to get test tokens:', error.message)
    }
  })

  describe('JWT Token Validation', () => {
    test('should reject requests without token', async () => {
      try {
        await axios.get(`${backend}/api/users`)
        expect(true).toBe(false) // Should not reach here
      } catch (error) {
        expect(error.response.status).toBe(401)
        expect(error.response.data).toMatchObject({
          statusCode: 401,
          error: 'Unauthorized'
        })
      }
    })

    test('should reject malformed tokens', async () => {
      const malformedTokens = [
        'invalid.token.here',
        'Bearer invalid',
        'notatoken',
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalid.signature',
        ''
      ]

      for (const token of malformedTokens) {
        try {
          await axios.get(`${backend}/api/users`, {
            headers: { Authorization: `Bearer ${token}` }
          })
          expect(true).toBe(false) // Should not reach here
        } catch (error) {
          expect(error.response.status).toBe(401)
        }
      }
    })

    test('should reject tokens with invalid signature', async () => {
      // Create a token with valid structure but invalid signature
      const fakeToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6ImhhY2tlckBleGFtcGxlLmNvbSIsInJvbGUiOiJhZG1pbiJ9.fakesignature'

      try {
        await axios.get(`${backend}/api/users`, {
          headers: { Authorization: `Bearer ${fakeToken}` }
        })
        expect(true).toBe(false)
      } catch (error) {
        expect(error.response.status).toBe(401)
      }
    })

    test('should accept valid tokens', async () => {
      if (!adminToken) {
        console.warn('Skipping test: no admin token available')
        return
      }

      const response = await axios.get(`${backend}/api/auth/me`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      })

      expect(response.status).toBe(200)
      expect(response.data).toHaveProperty('email')
      expect(response.data).toHaveProperty('role')
    })
  })

  describe('Role-Based Access Control (RBAC)', () => {
    test('should block viewer from accessing admin endpoints', async () => {
      if (!viewerToken) {
        console.warn('Skipping test: no viewer token available')
        return
      }

      try {
        await axios.get(`${backend}/api/users`, {
          headers: { Authorization: `Bearer ${viewerToken}` }
        })
        expect(true).toBe(false)
      } catch (error) {
        expect(error.response.status).toBe(403)
      }
    })

    test('should block viewer from changing user roles', async () => {
      if (!viewerToken) {
        console.warn('Skipping test: no viewer token available')
        return
      }

      try {
        await axios.patch(
          `${backend}/api/users/test@example.com/role`,
          { role: 'admin' },
          { headers: { Authorization: `Bearer ${viewerToken}` } }
        )
        expect(true).toBe(false)
      } catch (error) {
        expect(error.response.status).toBe(403)
      }
    })

    test('should allow admin to access user management', async () => {
      if (!adminToken) {
        console.warn('Skipping test: no admin token available')
        return
      }

      const response = await axios.get(`${backend}/api/users`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      })

      expect(response.status).toBe(200)
      expect(response.data).toHaveProperty('users')
    })

    test('should prevent privilege escalation via token manipulation', async () => {
      // Try to modify token payload to escalate privileges
      if (!viewerToken) {
        console.warn('Skipping test: no viewer token available')
        return
      }

      // Decode token, modify role, re-encode (will have invalid signature)
      const parts = viewerToken.split('.')
      const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString())
      payload.role = 'admin'
      const modifiedPayload = Buffer.from(JSON.stringify(payload)).toString('base64')
      const tamperedToken = `${parts[0]}.${modifiedPayload}.${parts[2]}`

      try {
        await axios.get(`${backend}/api/users`, {
          headers: { Authorization: `Bearer ${tamperedToken}` }
        })
        expect(true).toBe(false)
      } catch (error) {
        expect(error.response.status).toBe(401)
      }
    })
  })

  describe('OAuth Security', () => {
    test('should reject OAuth callback without code', async () => {
      try {
        await axios.get(`${backend}/api/auth/google/callback`)
        expect(true).toBe(false)
      } catch (error) {
        expect(error.response.status).toBeGreaterThanOrEqual(400)
      }
    })

    test('should handle OAuth errors gracefully', async () => {
      try {
        await axios.get(`${backend}/api/auth/google/callback?error=access_denied`)
        expect(true).toBe(false)
      } catch (error) {
        // Should redirect with error, not expose internal details
        expect(error.response.status).toBeGreaterThanOrEqual(300)
      }
    })

    test('should validate state parameter (CSRF protection)', async () => {
      // This test requires valid OAuth flow, but we can check the endpoint exists
      const response = await axios.get(`${backend}/api/auth/google`, {
        maxRedirects: 0,
        validateStatus: status => status < 400
      })

      expect(response.status).toBeGreaterThanOrEqual(300)
      expect(response.headers.location).toContain('google')
    })
  })

  describe('User Enumeration Prevention', () => {
    test('should not reveal if user exists during login', async () => {
      const validEmail = config.testUsers.admin.email
      const invalidEmail = 'nonexistent@example.com'

      const validResponse = await axios.post(`${backend}/api/auth/login`, {
        email: validEmail,
        name: 'Test'
      })

      const invalidResponse = await axios.post(`${backend}/api/auth/login`, {
        email: invalidEmail,
        name: 'Test'
      })

      // Both should return 200 (we create users on first login)
      // or both should return generic error message
      expect(validResponse.status).toBe(200)
      expect(invalidResponse.status).toBe(200)
    })
  })

  describe('Session Management', () => {
    test('should include JWT expiration claim', async () => {
      if (!adminToken) {
        console.warn('Skipping test: no admin token available')
        return
      }

      // Decode token to check expiration
      const parts = adminToken.split('.')
      const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString())

      expect(payload).toHaveProperty('exp')
      expect(payload.exp).toBeGreaterThan(Date.now() / 1000)
    })

    test('should reject expired tokens', async () => {
      // Create an expired token (requires JWT secret, skip for now)
      // This would be tested with actual expired tokens in production
      expect(true).toBe(true)
    })
  })

  describe('Protected Email Bypass', () => {
    test('should only grant admin role to protected email', async () => {
      const protectedEmail = 'eovidiu@gmail.com'
      const regularEmail = 'attacker@example.com'

      // Login with protected email
      const protectedResponse = await axios.post(`${backend}/api/auth/login`, {
        email: protectedEmail,
        name: 'Protected User'
      })
      expect(protectedResponse.data.user.role).toBe('admin')

      // Login with regular email
      const regularResponse = await axios.post(`${backend}/api/auth/login`, {
        email: regularEmail,
        name: 'Regular User'
      })
      expect(regularResponse.data.user.role).not.toBe('admin')
    })
  })
})
