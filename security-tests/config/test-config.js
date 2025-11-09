/**
 * Security Test Configuration
 *
 * Configure URLs and test parameters for security testing
 */

export const config = {
  // Application URLs
  frontend: process.env.FRONTEND_URL || 'https://interviewers.up.railway.app',
  backend: process.env.BACKEND_URL || 'https://backend-production-269a.up.railway.app',

  // Test timeouts
  timeout: 30000, // 30 seconds

  // Test users (for authentication tests)
  testUsers: {
    admin: {
      email: 'eovidiu@gmail.com',
      expectedRole: 'admin'
    },
    viewer: {
      email: 'test-viewer@example.com',
      expectedRole: 'viewer'
    },
    talent: {
      email: 'test-talent@example.com',
      expectedRole: 'talent'
    }
  },

  // Security test payloads
  payloads: {
    sqlInjection: [
      "' OR '1'='1",
      "admin'--",
      "' OR 1=1--",
      "1' AND '1'='1",
      "'; DROP TABLE users--"
    ],
    xss: [
      "<script>alert('XSS')</script>",
      "<img src=x onerror=alert('XSS')>",
      "javascript:alert('XSS')",
      "<svg/onload=alert('XSS')>",
      "'\"><script>alert(String.fromCharCode(88,83,83))</script>"
    ],
    commandInjection: [
      "; ls -la",
      "| cat /etc/passwd",
      "& whoami",
      "`id`",
      "$(whoami)"
    ],
    pathTraversal: [
      "../../../etc/passwd",
      "..\\..\\..\\windows\\system32\\config\\sam",
      "....//....//....//etc/passwd",
      "%2e%2e%2f%2e%2e%2f%2e%2e%2fetc%2fpasswd"
    ]
  },

  // Expected security headers
  securityHeaders: {
    required: [
      'x-frame-options',
      'x-content-type-options',
      'strict-transport-security'
    ],
    recommended: [
      'content-security-policy',
      'x-xss-protection',
      'referrer-policy',
      'permissions-policy'
    ]
  },

  // CORS settings
  cors: {
    allowedOrigin: 'https://interviewers.up.railway.app',
    blockedOrigins: [
      'https://evil.com',
      'http://localhost:3000',
      'https://attacker.com'
    ]
  },

  // Rate limiting thresholds
  rateLimit: {
    maxRequests: 100,
    timeWindow: 1000, // ms
    expectedStatusCode: 429
  },

  // SSL/TLS settings
  ssl: {
    minTlsVersion: 'TLSv1.2',
    weakCiphers: [
      'TLS_RSA_WITH_RC4_128_MD5',
      'TLS_RSA_WITH_RC4_128_SHA',
      'TLS_RSA_WITH_3DES_EDE_CBC_SHA'
    ]
  },

  // Test results severity levels
  severity: {
    CRITICAL: 'CRITICAL',
    HIGH: 'HIGH',
    MEDIUM: 'MEDIUM',
    LOW: 'LOW',
    INFO: 'INFO'
  }
}

export default config
