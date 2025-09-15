#!/usr/bin/env node

/**
 * Migration script to update type imports from old structure to new structure
 * Run with: node scripts/migrate-type-imports.js
 */

const fs = require('fs');
const path = require('path');

// Type mappings from old imports to new imports
const TYPE_MAPPINGS = {
  // From app.ts to models
  User: '@/types/models/user',
  UserRole: '@/types/models/user',
  LoggedInUser: '@/types/models/user',
  AppUser: '@/types/models/user',

  Project: '@/types/models/project',
  ProjectParticipant: '@/types/models/project',
  ProjectRole: '@/types/models/project',
  ProjectPermission: '@/types/models/project',
  ProjectStatus: '@/types/models/project',

  WeldLog: '@/types/models/welding',
  Weld: '@/types/models/welding',
  WeldStatus: '@/types/models/welding',
  WeldType: '@/types/models/welding',
  WeldProcess: '@/types/models/welding',
  WeldLogStatus: '@/types/models/welding',

  Company: '@/types/models/company',
  Material: '@/types/models/company',

  // From app.ts to forms
  ProjectFormData: '@/types/forms',
  MaterialFormData: '@/types/forms',
  UserFormData: '@/types/forms',
  WeldLogFormData: '@/types/forms',
  WeldFormData: '@/types/forms',
  CompanyFormData: '@/types/forms',
  ProjectParticipantFormData: '@/types/forms',

  // From database.ts to api/firestore
  FirestoreDocument: '@/types/api/firestore',
  Document: '@/types/api/firestore',
  FirestoreSection: '@/types/api/firestore',
  Section: '@/types/api/firestore',
  DocumentLibrary: '@/types/api/firestore',
  DocumentLibraryFormData: '@/types/api/firestore',
  CompanyInformation: '@/types/api/firestore',
  UploadingFile: '@/types/api/firestore',
  ImportedDocumentData: '@/types/api/firestore',
  ImportedSectionData: '@/types/api/firestore',
};

// Recursively get all TypeScript files
function getAllTsFiles(dir, files = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      // Skip node_modules and the types folder itself
      if (
        entry.name !== 'node_modules' &&
        fullPath !== path.join('src', 'types')
      ) {
        getAllTsFiles(fullPath, files);
      }
    } else if (
      entry.isFile() &&
      (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx'))
    ) {
      files.push(fullPath);
    }
  }

  return files;
}

// Group types by their new import path
function groupTypesByPath(types) {
  const grouped = {};
  for (const [type, importPath] of Object.entries(TYPE_MAPPINGS)) {
    if (types.includes(type)) {
      if (!grouped[importPath]) {
        grouped[importPath] = [];
      }
      grouped[importPath].push(type);
    }
  }
  return grouped;
}

// Parse import statement and extract types
function parseImport(importLine) {
  // Match: import { Type1, Type2 } from '@/types/app';
  // or: import type { Type1, Type2 } from '@/types/database';
  const match = importLine.match(
    /import\s+(?:type\s+)?{\s*([^}]+)\s*}\s+from\s+['"](@\/types\/(app|database))['"];?/
  );
  if (!match) return null;

  const types = match[1].split(',').map((t) => t.trim());
  const fromPath = match[2];

  return { types, fromPath };
}

// Generate new import statements
function generateNewImports(types) {
  const grouped = groupTypesByPath(types);
  const imports = [];

  for (const [importPath, typeList] of Object.entries(grouped)) {
    imports.push(
      `import type { ${typeList.join(', ')} } from '${importPath}';`
    );
  }

  return imports;
}

// Process a single file
function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  let modified = false;
  const newLines = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const parsed = parseImport(line);

    if (parsed) {
      // Skip types that aren't in our mapping (they might be fine as-is)
      const mappedTypes = parsed.types.filter((t) => TYPE_MAPPINGS[t]);

      if (mappedTypes.length > 0) {
        const newImports = generateNewImports(mappedTypes);

        // Keep any unmapped types with the original import
        const unmappedTypes = parsed.types.filter((t) => !TYPE_MAPPINGS[t]);
        if (unmappedTypes.length > 0) {
          newLines.push(
            `import type { ${unmappedTypes.join(', ')} } from '${parsed.fromPath}';`
          );
        }

        // Add new imports
        newLines.push(...newImports);
        modified = true;
      } else {
        newLines.push(line);
      }
    } else {
      newLines.push(line);
    }
  }

  if (modified) {
    fs.writeFileSync(filePath, newLines.join('\n'));
    return true;
  }

  return false;
}

// Main function
function main() {
  console.log('🔄 Starting type import migration...\n');

  // Find all TypeScript files
  const files = getAllTsFiles('src');

  console.log(`Found ${files.length} files to check\n`);

  let updatedCount = 0;

  for (const file of files) {
    if (processFile(file)) {
      console.log(`✅ Updated: ${file}`);
      updatedCount++;
    }
  }

  console.log(`\n✨ Migration complete!`);
  console.log(`📊 Updated ${updatedCount} files`);
  console.log(`\n⚠️  Note: This script handles most cases, but you should:`);
  console.log(`   1. Run 'npm run type-check' to verify`);
  console.log(`   2. Run 'npm test' to ensure tests pass`);
  console.log(`   3. Review any complex imports manually`);
}

// Run the migration
main();
