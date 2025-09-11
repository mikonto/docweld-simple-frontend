#!/bin/bash

echo "=== ESLint Analysis Report ==="
echo ""

# Run lint and capture output
npm run lint 2>&1 > lint-full-report.txt

echo "## Summary"
tail -5 lint-full-report.txt
echo ""

echo "## Error Breakdown"
echo "### Unused variables/types:"
grep "is defined but never used" lint-full-report.txt | wc -l
echo ""

echo "### Files with unused exports:"
grep "is defined but never used" lint-full-report.txt | sed 's|/home/mikael/repo/docweld-simple-frontend/||' | awk -F: '{print $1}' | sort -u
echo ""

echo "## Warning Breakdown"
echo "### Total 'any' warnings:"
grep "Unexpected any" lint-full-report.txt | wc -l
echo ""

echo "### Files with most 'any' usage:"
grep "Unexpected any" lint-full-report.txt | sed 's|/home/mikael/repo/docweld-simple-frontend/||' | awk -F: '{print $1}' | sort | uniq -c | sort -rn | head -10
echo ""

echo "## Top 20 Files by Issue Count"
grep -E "error|warning" lint-full-report.txt | sed 's|/home/mikael/repo/docweld-simple-frontend/||' | awk -F: '{print $1}' | sort | uniq -c | sort -rn | head -20