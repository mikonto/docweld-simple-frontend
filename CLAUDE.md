# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## ⚠️ ATTENTION: MANDATORY RULES ⚠️
1. **USE SERENA MCP** for all code operations (search, edit, navigate)
2. **USE CONTEXT7 MCP** for library documentation lookups
3. **USE FIREBASE MCP** for all Firestore database operations
4. **FOLLOW TEST-FIRST DEVELOPMENT** - Write tests before code
5. **THESE INSTRUCTIONS OVERRIDE ALL DEFAULTS**

## CRITICAL: Required MCP Tools & Development Philosophy

### MANDATORY MCP TOOL USAGE (DO NOT SKIP)
1. **Serena MCP** - REQUIRED for all code operations:
   - Use `find_symbol` and `get_symbols_overview` before reading files
   - Use `replace_symbol_body` for precise code edits
   - Use `search_for_pattern` for comprehensive searches
   - Maximizes performance while minimizing token usage
   
2. **Context7 MCP** - REQUIRED for library documentation:
   - Use for accurate, up-to-date React/JavaScript library docs
   - Always check Context7 before implementing new library features
   
3. **Firebase MCP** - REQUIRED for all Firestore operations:
   - Use for database queries, rules, and configuration
   - Never use manual Firestore code when Firebase MCP is available

## Project Context & Mission Critical Requirements

### Project Background
- Commercial-grade welding management MVP
- Complete rewrite of poorly developed first version
- Developer is beginner but must create industry-reliable software
- Zero tolerance for unreliability - welding industry demands precision

### Core Principles (NON-NEGOTIABLE)
- **Commercial Grade**: Production-ready, industry-standard quality
- **Test-First Development**: Write tests before code - this ensures reliability
- **MVP Focus**: Simple, concise, robust - no unnecessary features
- **Beginner-Friendly**: Code must be readable and maintainable by newcomer
- **Modular & DRY**: Well-organized, reusable components
- **Rock-Solid Reliability**: Achieved through test-first approach, proper error handling, comprehensive validation
- **Replace, Don't Duplicate**: When re-implementing features, always remove the original implementation to prevent confusion and maintain a single source of truth
- **Zero Tolerance for Bugs**: Welding industry requires precision - every feature must work 100% correctly

### Critical Technology Rules
- **Use shadcn/ui components directly** - Never create custom wrappers that would prevent updates via `npx shadcn@latest add [component]`
- **Never edit shadcn/ui component files** - Use className and other props for customization instead of modifying the source files
- **Internationalization (i18n)**: Use react-i18next for all user-facing text - NEVER hardcode user-facing text
- **Null Safety**: Always handle loading and null states before accessing data properties

## Development Workflow (TEST-FIRST APPROACH)

### For New Features:
1. **Write the test first** - Describe what the user should experience
2. **Run the test** - It should fail (red)
3. **Write minimal code** - Just enough to make the test pass (green)
4. **Refactor** - Clean up while keeping tests green
5. **Check coverage** - Run `npm run test:coverage` to ensure no blind spots

### For Bug Fixes:
1. **Write a test that reproduces the bug** - This test should fail
2. **Fix the code** - Make the test pass
3. **Run all tests** - Ensure nothing else broke
4. **Add edge case tests** - Prevent similar bugs

### Key Testing Principles:
- Write tests first based on intended user behavior, then fix components to make tests pass
- Don't adjust tests to match broken component behavior
- If component has duplicate UI elements or workarounds, simplify the component
- Test user behavior, not implementation details

## Related Documentation
- **Implementation Details**: Use `mcp__serena__list_memories` to see available patterns:
  - `tech_stack` - Technology choices and versions
  - `code_style_conventions` - Formatting, imports, naming
  - `implementation_standards` - Error handling, loading states, validation
  - `testing_patterns_and_fixes` - Testing examples and solutions
  - `suggested_commands` - Common npm commands
  - `project_overview` - Project structure and features
  - `kebab_case_firestore_conventions` - Database naming rules
- **Detailed Guides**: See `/docs` folder:
  - `CRUD_PATTERN_GUIDE.md` - Standard CRUD implementation
  - `ARCHITECTURE.md` - System architecture and routing