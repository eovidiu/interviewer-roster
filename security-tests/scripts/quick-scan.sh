#!/bin/bash

##
# Quick Security Scan
#
# Runs a subset of fast security checks for rapid feedback
##

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

BACKEND_URL="${BACKEND_URL:-https://backend-production-269a.up.railway.app}"
FRONTEND_URL="${FRONTEND_URL:-https://interviewers.up.railway.app}"

echo -e "${BLUE}⚡ Quick Security Scan${NC}"
echo -e "${BLUE}=====================${NC}\n"

echo -e "Backend:  ${BACKEND_URL}"
echo -e "Frontend: ${FRONTEND_URL}\n"

# Test 1: HTTPS Enforcement
echo -n "🔒 HTTPS Enforcement... "
if [[ $BACKEND_URL == https://* ]] && [[ $FRONTEND_URL == https://* ]]; then
    echo -e "${GREEN}✓ PASS${NC}"
else
    echo -e "${RED}✗ FAIL${NC}"
fi

# Test 2: Security Headers
echo -n "🛡️  Security Headers... "
HEADERS=$(curl -sI "$BACKEND_URL/api/health" 2>/dev/null || echo "")
if echo "$HEADERS" | grep -qi "x-frame-options" && echo "$HEADERS" | grep -qi "x-content-type-options"; then
    echo -e "${GREEN}✓ PASS${NC}"
else
    echo -e "${YELLOW}⚠ WARN${NC} (some headers missing)"
fi

# Test 3: Auth Protection
echo -n "🔐 Auth Protection... "
STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BACKEND_URL/api/users" 2>/dev/null || echo "000")
if [ "$STATUS" = "401" ]; then
    echo -e "${GREEN}✓ PASS${NC}"
else
    echo -e "${RED}✗ FAIL${NC} (got $STATUS, expected 401)"
fi

# Test 4: No .env Exposure
echo -n "🚫 No .env Exposure... "
STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BACKEND_URL/.env" 2>/dev/null || echo "000")
if [ "$STATUS" -ge "400" ]; then
    echo -e "${GREEN}✓ PASS${NC}"
else
    echo -e "${RED}✗ FAIL${NC} (.env accessible)"
fi

# Test 5: No Database Exposure
echo -n "🗄️  No DB Exposure... "
STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BACKEND_URL/server/data/interviewer-roster.db" 2>/dev/null || echo "000")
if [ "$STATUS" -ge "400" ]; then
    echo -e "${GREEN}✓ PASS${NC}"
else
    echo -e "${RED}✗ FAIL${NC} (database accessible)"
fi

# Test 6: CORS Configuration
echo -n "🌐 CORS Configuration... "
CORS=$(curl -sI "$BACKEND_URL/api/health" -H "Origin: $FRONTEND_URL" 2>/dev/null | grep -i "access-control-allow-origin" || echo "")
if [ -n "$CORS" ]; then
    echo -e "${GREEN}✓ PASS${NC}"
else
    echo -e "${YELLOW}⚠ WARN${NC} (CORS headers not found)"
fi

# Test 7: Server Version Hidden
echo -n "🔍 Server Info Hidden... "
SERVER=$(curl -sI "$BACKEND_URL/api/health" 2>/dev/null | grep -i "^server:" | grep -iE "fastify|express|version" || echo "")
if [ -z "$SERVER" ]; then
    echo -e "${GREEN}✓ PASS${NC}"
else
    echo -e "${YELLOW}⚠ WARN${NC} (server info exposed)"
fi

echo -e "\n${BLUE}=====================${NC}"
echo -e "${GREEN}Quick scan complete!${NC}"
echo -e "\nRun 'npm test' for comprehensive security testing.\n"
