#!/bin/bash

echo "Fixing remaining lint errors..."

# Fix test-utils.ts - comment out unused types
echo "Fixing test-utils.ts..."
sed -i 's/^interface MockUseAppReturn/\/\/ @unused\n\/\/ interface MockUseAppReturn/' src/test/utils/testUtils.tsx
sed -i 's/^interface MockParamsReturn/\/\/ @unused\n\/\/ interface MockParamsReturn/' src/test/utils/testUtils.tsx
sed -i 's/^interface OperationResult/\/\/ @unused\n\/\/ interface OperationResult/' src/test/utils/testUtils.tsx
sed -i 's/^interface ComponentProps/\/\/ @unused\n\/\/ interface ComponentProps/' src/test/utils/testUtils.tsx
sed -i 's/^interface MockEvent/\/\/ @unused\n\/\/ interface MockEvent/' src/test/utils/testUtils.tsx
sed -i 's/^interface TestDataFactory/\/\/ @unused\n\/\/ interface TestDataFactory/' src/test/utils/testUtils.tsx

# Fix imports in test files
echo "Fixing test file imports..."

# Fix weld-log-overview/index.test.tsx
sed -i "/import type { User, Project, WeldLog } from '@\/types'/d" src/pages/weld-log-overview/index.test.tsx

# Remove unused any files
rm -f fix-unused.sh

echo "Done! Check with npm run lint"