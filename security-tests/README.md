# 🔒 Security Test Suite

Automated security testing for the Interviewer Roster application.

## What This Tests

This comprehensive security test suite validates:

### 🔐 Authentication & Authorization
- JWT token security and validation
- Role-based access control (RBAC)
- OAuth 2.0 flow security
- Session management
- Privilege escalation prevention
- User enumeration protection

### 🛡️ API Security
- SQL injection prevention
- XSS (Cross-Site Scripting) prevention
- Command injection prevention
- Path traversal attacks
- Input validation and sanitization
- Request size limits
- NoSQL injection prevention
- HTTP method validation
- Error message security

### 🌐 Infrastructure Security
- HTTP security headers (HSTS, CSP, X-Frame-Options, etc.)
- CORS configuration
- HTTPS/SSL certificate validation
- Information disclosure prevention
- Rate limiting
- Server configuration hardening

## Quick Start

See [RUN_TESTS.md](./RUN_TESTS.md) for detailed usage instructions.

### Run All Tests
```bash
cd security-tests && ./scripts/run-security-tests.sh
```

### Quick Scan (10 seconds)
```bash
cd security-tests && ./scripts/quick-scan.sh
```

## Project Structure

```
security-tests/
├── config/
│   └── test-config.js          # Test configuration and payloads
├── tests/
│   ├── auth-security.test.js   # Authentication tests
│   ├── api-security.test.js    # API security tests
│   └── infrastructure-security.test.js  # Infrastructure tests
├── scripts/
│   ├── run-security-tests.sh   # Main test runner
│   ├── quick-scan.sh           # Fast security scan
│   └── generate-report.js      # Report generator
├── reports/
│   ├── security-report.html    # HTML test report
│   ├── security-summary.md     # Markdown summary
│   └── test-results.json       # Raw test results
├── package.json                # Dependencies
├── jest.config.js              # Jest configuration
├── README.md                   # This file
└── RUN_TESTS.md                # Quick start guide
```

## Test Categories

### Authentication Security Tests (24 tests)
- `JWT Token Validation` - Tests for malformed, invalid, and expired tokens
- `RBAC` - Verifies role-based access controls work correctly
- `OAuth Security` - Validates OAuth flow and CSRF protection
- `Session Management` - Checks JWT expiration and session handling
- `User Enumeration` - Ensures login doesn't leak user existence
- `Protected Email` - Verifies admin role is only granted to authorized users

### API Security Tests (40+ tests)
- `SQL Injection` - Tests all input points for SQL injection vulnerabilities
- `XSS Prevention` - Validates input sanitization for script injection
- `Command Injection` - Tests for OS command execution vulnerabilities
- `Path Traversal` - Checks for directory traversal exploits
- `Input Validation` - Verifies email format, required fields, length limits
- `Request Size Limits` - Tests for DoS via large payloads
- `NoSQL Injection` - Validates JSON/object injection prevention
- `Error Disclosure` - Ensures errors don't expose internal details

### Infrastructure Security Tests (25+ tests)
- `Security Headers` - Validates presence of HSTS, CSP, X-Frame-Options, etc.
- `CORS` - Tests cross-origin resource sharing configuration
- `HTTPS` - Verifies SSL certificate and TLS version
- `Information Disclosure` - Checks for exposed .env, database, git files
- `Rate Limiting` - Tests for brute force protection
- `HTTP Methods` - Validates disabled dangerous methods (TRACE)

## Security Best Practices Tested

### OWASP Top 10 Coverage

| OWASP Risk | Test Coverage |
|------------|---------------|
| A01:2021 - Broken Access Control | ✅ RBAC tests, privilege escalation tests |
| A02:2021 - Cryptographic Failures | ✅ HTTPS/TLS tests, JWT signature validation |
| A03:2021 - Injection | ✅ SQL, XSS, Command, NoSQL injection tests |
| A04:2021 - Insecure Design | ✅ OAuth flow, session management tests |
| A05:2021 - Security Misconfiguration | ✅ Headers, CORS, error disclosure tests |
| A06:2021 - Vulnerable Components | ⚠️ (Manual npm audit recommended) |
| A07:2021 - Identification/Auth Failures | ✅ JWT, OAuth, user enumeration tests |
| A08:2021 - Software/Data Integrity | ✅ JWT signature, input validation tests |
| A09:2021 - Logging/Monitoring Failures | ⚠️ (Manual review recommended) |
| A10:2021 - SSRF | ⚠️ (Limited coverage) |

## Expected Results

### Production (Railway)
- **Pass Rate:** Should be > 90%
- **Critical Failures:** 0
- **High Failures:** < 2

### Common Warnings (Acceptable)
- ⚠️ HSTS header (Railway handles this)
- ⚠️ CSP header (can be added to frontend)
- ⚠️ Rate limiting (can be added to Fastify)

### Must Fix
- ❌ Auth bypass vulnerabilities
- ❌ SQL/XSS injection vulnerabilities
- ❌ Exposed secrets or database files
- ❌ CORS allowing unauthorized origins

## Adding New Tests

1. Create test file in `tests/` directory
2. Follow existing patterns:
```javascript
import { describe, test, expect } from '@jest/globals'
import axios from 'axios'
import config from '../config/test-config.js'

describe('My Security Tests', () => {
  test('should prevent X vulnerability', async () => {
    // Test code here
  })
})
```

3. Add to test suite in `package.json`:
```json
"test:mysuite": "jest tests/my-security.test.js"
```

## Continuous Integration

### GitHub Actions Example
```yaml
name: Security Tests

on: [push, pull_request]

jobs:
  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - name: Install dependencies
        run: cd security-tests && npm install
      - name: Run security tests
        run: cd security-tests && npm run test:ci
      - name: Generate report
        if: always()
        run: cd security-tests && npm run report
      - name: Upload report
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: security-report
          path: security-tests/reports/
```

## Dependencies

- **axios** - HTTP client for making test requests
- **jest** - Test framework
- **chalk** - Terminal colors for better output

## License

MIT

## Contributing

1. Add tests for new security controls
2. Update config for new payloads/scenarios
3. Keep reports readable and actionable
4. Document new test categories

## Resources

- [OWASP Top 10](https://owasp.org/Top10/)
- [OWASP Testing Guide](https://owasp.org/www-project-web-security-testing-guide/)
- [JWT Security Best Practices](https://tools.ietf.org/html/rfc8725)
- [Security Headers](https://securityheaders.com/)
- [Content Security Policy](https://content-security-policy.com/)
