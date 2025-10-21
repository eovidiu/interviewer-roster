#!/usr/bin/env node

/**
 * Generate JWT token for testing API endpoints
 * Usage: node scripts/generate-token.js [role]
 */

import jwt from '@fastify/jwt'

const role = process.argv[2] || 'admin'
const secret = 'super-secret-change-in-production-12345'

const payload = {
  email: `${role}@example.com`,
  name: `${role.charAt(0).toUpperCase() + role.slice(1)} User`,
  role: role
}

// Create a minimal JWT instance
const jwtInstance = jwt()

// Sign the token
const token = jwtInstance.sign(payload, { secret, expiresIn: '7d' })

console.log(`\nJWT Token for role: ${role}\n`)
console.log(token)
console.log(`\n\nUse with curl:`)
console.log(`curl -H "Authorization: Bearer ${token}" http://localhost:3000/api/interviewers\n`)
