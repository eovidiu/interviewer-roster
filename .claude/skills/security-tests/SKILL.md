---
name: security-tests
description: Run automated security tests for the Railway-deployed application. Use when you need to validate security controls, test for vulnerabilities, or generate security reports. Trigger phrases include "run security tests", "check security", "security scan", or "test for vulnerabilities".
---

# Security Testing Skill

This skill provides automated security testing for the interviewer-roster application deployed on Railway.

## Usage

When the user asks to run security tests, check security, or scan for vulnerabilities, this skill will:

1. Run the appropriate security test suite
2. Generate reports
3. Display results

## Available Commands

### Quick Security Scan (Recommended First)
```bash
cd security-tests && ./scripts/quick-scan.sh
```

Runs a fast 7-point security check in ~10 seconds.

### Full Security Test Suite
```bash
cd security-tests && ./scripts/run-security-tests.sh
```

Runs all 80+ security tests and generates HTML/Markdown reports.

### Specific Test Suites
```bash
cd security-tests

# Authentication & authorization tests
npm run test:auth

# API security tests (SQL injection, XSS, etc.)
npm run test:api

# Infrastructure tests (headers, CORS, SSL)
npm run test:infrastructure

# All tests
npm test
```

## What Gets Tested

### Authentication Security (24 tests)
- JWT token validation
- Role-based access control
- OAuth flow security
- Session management
- User enumeration prevention
- Privilege escalation prevention

### API Security (40+ tests)
- SQL injection
- XSS (Cross-Site Scripting)
- Command injection
- Path traversal
- Input validation
- Request size limits
- NoSQL injection
- Error information disclosure

### Infrastructure Security (25+ tests)
- Security headers (HSTS, CSP, X-Frame-Options)
- CORS configuration
- HTTPS/SSL validation
- Information disclosure (no exposed .env, db files)
- Rate limiting
- HTTP method validation

## Viewing Reports

After running tests:

```bash
# View HTML report in browser
open security-tests/reports/security-report.html

# View markdown summary
cat security-tests/reports/security-summary.md
```

## Workflow

1. **User asks to run security tests**
   ```
   User: "Run security tests"
   or
   User: "Check if the app is secure"
   ```

2. **Start with quick scan**
   - Run `./scripts/quick-scan.sh`
   - Show results to user
   - If all pass, inform user system looks good
   - If some fail, recommend full test suite

3. **Run full tests if requested**
   - Run `./scripts/run-security-tests.sh`
   - Wait for completion
   - Show summary from reports

4. **Explain failures**
   - Read the security-summary.md
   - Explain what failed and why it matters
   - Suggest fixes if needed

## Example Interactions

### Example 1: Quick Check
```
User: "Is the Railway app secure?"