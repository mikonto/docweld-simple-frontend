#!/bin/bash

# Fix mockGetDocs in useDocuments.test.ts
sed -i "s/const mockGetDocs =/const _mockGetDocs =/" src/hooks/documents/useDocuments.test.ts

# Fix unused imports in useSectionOperations.ts
sed -i "/import.*DocumentData.*SectionData.*from '@\/types'/d" src/hooks/documents/useSectionOperations.ts

# Fix UseSectionDataReturn
sed -i "s/export interface UseSectionDataReturn/\/\/ @unused\n\/\/ export interface UseSectionDataReturn/" src/hooks/documents/useSectionData.ts

# Fix Mock import in useFileUpload.test.ts
sed -i "/import type { Mock } from 'vitest'/d" src/hooks/documents/useFileUpload.test.ts

# Fix OperationFunction in useSectionOperations.ts
sed -i "/import.*OperationFunction.*from '@\/hooks\/firebase'/d" src/hooks/documents/useSectionOperations.ts

# Fix QueryConstraint in useProjects.test.ts
sed -i "/import.*QueryConstraint.*from 'firebase\/firestore'/d" src/hooks/useProjects.test.ts

# Fix unused imports in useProjects.test.ts
sed -i "/import type { Project, ProjectFormData } from '@\/types'/d" src/hooks/useProjects.test.ts
sed -i "/import type { UserWithName } from '@\/types'/d" src/hooks/useProjects.test.ts
sed -i "/import type { User } from '@\/types'/d" src/hooks/useProjects.test.ts

# Fix DocumentSnapshot and DocumentData in useUsers.test.ts
sed -i "s/import.*DocumentSnapshot.*DocumentData.*from 'firebase\/firestore'/import { Timestamp } from 'firebase\/firestore'/" src/hooks/useUsers.test.ts

# Fix UserRole in useUsers.ts
sed -i "/import.*UserRole.*from '@\/constants'/d" src/hooks/useUsers.ts

echo "Fixes applied. Run 'npm run lint' to check results."