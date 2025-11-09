#!/bin/bash

##
# Security Test Runner for Claude Code Web UI
#
# This script runs all security tests and generates reports
##

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

echo -e "${BLUE}🔒 Security Test Suite${NC}"
echo -e "${BLUE}=====================${NC}\n"

# Change to security-tests directory
cd "$ROOT_DIR"

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}📦 Installing dependencies...${NC}"
    npm install
    echo ""
fi

# Create reports directory
mkdir -p reports

# Run tests
echo -e "${BLUE}🧪 Running security tests...${NC}\n"

# Run all tests with coverage and JSON output
npm run test:ci

# Check test exit code
TEST_EXIT_CODE=$?

# Generate reports
echo -e "\n${BLUE}📊 Generating reports...${NC}\n"
npm run report

# Report results
if [ $TEST_EXIT_CODE -eq 0 ]; then
    echo -e "\n${GREEN}✅ All security tests passed!${NC}"
    echo -e "${GREEN}View the HTML report at: reports/security-report.html${NC}\n"
    exit 0
else
    echo -e "\n${RED}❌ Some security tests failed${NC}"
    echo -e "${RED}View the HTML report at: reports/security-report.html${NC}\n"
    exit 1
fi
