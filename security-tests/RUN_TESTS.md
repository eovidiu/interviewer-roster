# 🔒 Security Test Suite - Quick Start

This directory contains automated security tests for the Interviewer Roster application deployed on Railway.

## Quick Commands (Claude Code Web UI)

### Option 1: Run All Tests (Recommended)
```bash
cd security-tests && ./scripts/run-security-tests.sh
```

This will:
- Install dependencies if needed
- Run all security tests
- Generate HTML and Markdown reports
- Display results in terminal

### Option 2: Quick Security Scan (Fast)
```bash
cd security-tests && ./scripts/quick-scan.sh
```

This runs a fast 7-point security check (takes ~10 seconds):
- ✅ HTTPS Enforcement
- ✅ Security Headers
- ✅ Auth Protection
- ✅ No .env Exposure
- ✅ No Database Exposure
- ✅ CORS Configuration
- ✅ Server Info Hidden

### Option 3: Run Specific Test Suites
```bash
cd security-tests

# Install dependencies first (only needed once)
npm install

# Run specific test suite
npm run test:auth              # Authentication tests only
npm run test:api               # API security tests only
npm run test:infrastructure    # Infrastructure tests only

# Run all tests
npm test
```

## View Reports

After running tests, view the reports:

```bash
# Open HTML report in browser
open security-tests/reports/security-report.html

# View Markdown summary
cat security-tests/reports/security-summary.md
```

## Test Coverage

### Authentication & Authorization Tests (24 tests)
- ✅ JWT token validation
- ✅ Role-based access control (RBAC)
- ✅ OAuth flow security
- ✅ Session management
- ✅ User enumeration prevention
- ✅ Privilege escalation prevention

### API Security Tests (40+ tests)
- ✅ SQL injection prevention
- ✅ XSS (Cross-Site Scripting) prevention
- ✅ Command injection prevention
- ✅ Path traversal prevention
- ✅ Input validation
- ✅ Request size limits
- ✅ NoSQL injection prevention
- ✅ Error information disclosure

### Infrastructure Security Tests (25+ tests)
- ✅ Security headers (HSTS, CSP, X-Frame-Options, etc.)
- ✅ CORS configuration
- ✅ HTTPS enforcement
- ✅ SSL/TLS validation
- ✅ Information disclosure prevention
- ✅ Rate limiting
- ✅ HTTP method validation

## Configuration

Edit `security-tests/config/test-config.js` to customize:

```javascript
export const config = {
  // Application URLs
  frontend: 'https://interviewers.up.railway.app',
  backend: 'https://backend-production-269a.up.railway.app',

  // Test timeouts, payloads, etc.
  // ...
}
```

## Environment Variables

You can override URLs using environment variables:

```bash
BACKEND_URL=https://your-backend.com \
FRONTEND_URL=https://your-frontend.com \
./scripts/run-security-tests.sh
```

## Troubleshooting

### Tests failing due to rate limiting
Wait a few minutes between test runs, or adjust rate limit tests in config.

### "Cannot find module" errors
```bash
cd security-tests
rm -rf node_modules package-lock.json
npm install
```

### Permission denied errors
```bash
chmod +x scripts/*.sh
```

## CI/CD Integration

Add to your GitHub Actions workflow:

```yaml
- name: Run Security Tests
  run: |
    cd security-tests
    npm install
    npm run test:ci
    npm run report
```

## Understanding Results

### Test Status
- ✅ **PASS** - Security control is working correctly
- ❌ **FAIL** - Security vulnerability detected
- ⚠️ **WARN** - Recommended security control missing

### Severity Levels
- 🔴 **CRITICAL** - Immediate action required
- 🟠 **HIGH** - Should be fixed soon
- 🟡 **MEDIUM** - Should be addressed
- 🔵 **LOW** - Nice to have
- ⚪ **INFO** - For informational purposes

## Next Steps

If tests fail:

1. Review the HTML report for details
2. Check the security test code to understand what's being tested
3. Fix the identified vulnerabilities in your application
4. Re-run tests to verify fixes

## Support

For questions about security tests:
- Check test files in `tests/` directory
- Review test configuration in `config/test-config.js`
- See OWASP Top 10: https://owasp.org/Top10/
