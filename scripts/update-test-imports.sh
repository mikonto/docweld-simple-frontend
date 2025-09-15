#!/bin/bash

echo "Updating test file imports..."

# Update all test files with @/types/app imports
find src -name "*.test.ts" -o -name "*.test.tsx" | while read file; do
  if grep -q "@/types/app" "$file"; then
    echo "Updating: $file"

    # Replace specific type imports
    sed -i.bak \
      -e "s|import type { Weld\(.*\) } from '@/types/app'|import type { Weld } from '@/types/models/welding'|g" \
      -e "s|import type { WeldLog\(.*\) } from '@/types/app'|import type { WeldLog } from '@/types/models/welding'|g" \
      -e "s|import type { User\(.*\) } from '@/types/app'|import type { User } from '@/types/models/user'|g" \
      -e "s|import type { Project\(.*\) } from '@/types/app'|import type { Project } from '@/types/models/project'|g" \
      -e "s|import type { Material\(.*\) } from '@/types/app'|import type { Material } from '@/types/models/company'|g" \
      -e "s|import type { WeldFormData\(.*\) } from '@/types/app'|import type { WeldFormData } from '@/types/forms'|g" \
      -e "s|import type { WeldLogFormData\(.*\) } from '@/types/app'|import type { WeldLogFormData } from '@/types/forms'|g" \
      "$file"

    # Clean up backup files
    rm -f "$file.bak"
  fi
done

# Update all test files with @/types/database imports
find src -name "*.test.ts" -o -name "*.test.tsx" | while read file; do
  if grep -q "@/types/database" "$file"; then
    echo "Updating: $file"
    sed -i "s|from '@/types/database'|from '@/types/api/firestore'|g" "$file"
  fi
done

# Update bare @/types imports
find src -name "*.test.ts" -o -name "*.test.tsx" | while read file; do
  if grep -q "from '@/types'" "$file"; then
    # Skip if it's already a specific import
    if ! grep -q "from '@/types/\(models\|api\|forms\|ui\|utils\)" "$file"; then
      echo "Found bare import in: $file"
    fi
  fi
done

echo "Test file imports updated!"