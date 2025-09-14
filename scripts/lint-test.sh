#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Script header
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}   DocWeld Frontend Lint Test Suite    ${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Track overall success
OVERALL_SUCCESS=true

# Function to run a command and check its result
run_check() {
    local name=$1
    local command=$2

    echo -e "${YELLOW}Running: ${name}${NC}"
    echo -e "${BLUE}Command: ${command}${NC}"

    if eval $command; then
        echo -e "${GREEN}✓ ${name} passed${NC}"
        echo ""
    else
        echo -e "${RED}✗ ${name} failed${NC}"
        echo ""
        OVERALL_SUCCESS=false
    fi
}

# Check if we should run quick or full checks
MODE=${1:-full}

if [ "$MODE" = "quick" ]; then
    echo -e "${YELLOW}Running quick lint checks...${NC}"
    echo ""

    # Quick checks (no fix)
    run_check "TypeScript Type Check" "npm run type-check"
    run_check "ESLint Check" "npm run lint"

elif [ "$MODE" = "fix" ]; then
    echo -e "${YELLOW}Running lint checks with auto-fix...${NC}"
    echo ""

    # Auto-fix checks
    run_check "Prettier Format" "npm run format"
    run_check "ESLint Fix" "npm run lint:fix"
    run_check "TypeScript Type Check" "npm run type-check"

elif [ "$MODE" = "strict" ]; then
    echo -e "${YELLOW}Running strict lint checks (no warnings allowed)...${NC}"
    echo ""

    # Strict checks
    run_check "TypeScript Type Check" "npm run type-check"
    run_check "ESLint Strict (no warnings)" "eslint . --max-warnings 0"
    run_check "Prettier Format Check" "npm run format:check"

else
    echo -e "${YELLOW}Running full lint test suite...${NC}"
    echo ""

    # Full checks
    run_check "TypeScript Type Check" "npm run type-check"
    run_check "ESLint Check" "npm run lint"
    run_check "Prettier Format Check" "npm run format:check"

    # Optional: Check for unused dependencies
    if command -v knip &> /dev/null; then
        run_check "Unused Dependencies Check" "npm run knip"
    fi
fi

# Final summary
echo -e "${BLUE}========================================${NC}"
if [ "$OVERALL_SUCCESS" = true ]; then
    echo -e "${GREEN}✓ All lint checks passed!${NC}"
    exit 0
else
    echo -e "${RED}✗ Some lint checks failed!${NC}"
    echo -e "${YELLOW}Run 'npm run lint:test:fix' to auto-fix issues${NC}"
    exit 1
fi