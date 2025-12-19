---
name: meta-analysis
description: Run a comprehensive, objective analysis of the styled-static library. Triggers when user asks for a "meta analysis". Outputs factual assessment of size, rendering, security, test coverage, and TypeScript strictness.
---

# Meta Analysis Skill

When the user asks for a **meta analysis**, perform a comprehensive review of the styled-static library and write the results to `./analysis/claude-analysis-YYYY-MMM-DD-NN.md`.

## Trigger

Activate when the user's message contains "meta analysis" (case-insensitive).

## Output File

- Path: `./analysis/claude-analysis-YYYY-MMM-DD-NN.md`
- Date format: `2024-Dec-19` (4-digit year, 3-letter month, 2-digit day)
- Counter: 2-digit, starting at `01` (e.g., `01`, `02`, ... `99`)
- If file exists with same date, increment counter

## Analysis Steps

### 1. Gather Metrics

Run these commands and read these files:

```bash
# Build the library first to ensure dist is current
bun run build

# Get runtime size
cat dist/runtime.js 2>/dev/null || cat dist/index.js | grep -A1 "export const m"

# Get minified + brotli sizes (use the sizes script if available)
bun run scripts/sizes.ts 2>/dev/null || echo "Run manual size check"

# Run tests with coverage
bun test --coverage 2>/dev/null || bun test
```

Read these files:
- `src/runtime/index.ts` - Check runtime size
- `src/vite.ts` - Check security patterns
- `tsconfig.json` - Check TypeScript strictness settings
- `package.json` - Check dependencies

### 2. Check Previous Analysis

- Look for most recent file in `./analysis/claude-analysis-*.md`
- Extract metrics from previous analysis for comparison
- If no previous exists, note "First analysis"

### 3. Analyze Each Area

#### Size Analysis
- Runtime size (minified, brotli)
- Per-component overhead (measure generated code)
- Compare with previous

#### React Rendering
- Check component generation pattern in `src/vite.ts`
- Verify no context usage (grep for useContext, createContext)
- Verify props spreading pattern
- Check for any new rerender triggers

#### Security
- Check `isValidIdentifier` function exists
- Check `safeStringLiteral` function exists
- Verify no dynamic class name construction in variant generation
- Check debug mode is opt-in only

#### Test Coverage
- Run tests and capture coverage percentage
- Note any uncovered files or functions

#### TypeScript Strictness
Check `tsconfig.json` for:
- `strict: true`
- `noUncheckedIndexedAccess`
- `exactOptionalPropertyTypes`
- Other strictness flags

### 4. Write Report

Use this exact format:

```markdown
# Meta Analysis: styled-static

**Date**: YYYY-MMM-DD-NN
**Previous**: YYYY-MMM-DD-NN (or "None - first analysis")

## Verdict

One sentence. No adjectives. Just the functional state.

## Metrics

| Metric | Current | Previous | Delta |
|--------|---------|----------|-------|
| Runtime (minified) | XX B | XX B | +/-X B |
| Runtime (brotli) | XX B | XX B | +/-X B |
| Per-component | ~XXX B | ~XXX B | +/-X B |
| Test coverage | XX% | XX% | +/-X% |
| TypeScript strict | Yes/No | Yes/No | - |
| Dependencies (runtime) | X | X | - |

## Size

Facts about bundle size. No opinions.

## Rendering

Facts about React rendering behavior. No opinions.

## Security

- Identifier validation: Present/Missing
- String escaping: Present/Missing
- Dynamic class construction: None/Found (issue if found)
- Debug opt-in only: Yes/No

## Test Coverage

Coverage percentage and any notable gaps.

## TypeScript

List of enabled strictness flags.

## Changes Since Previous

Bullet list of what changed. Or "N/A - first analysis".

## Issues

Bullet list of problems found. Or "None".
```

## Tone Guidelines

- **No emotional language**: Don't say "excellent", "great", "impressive"
- **No hedging**: Don't say "might", "could potentially", "seems like"
- **No encouragement**: Don't say "great job", "well done"
- **Just facts**: State what is, not what you think about it
- **Be concise**: One fact per sentence. No filler words.

## Example Output

```markdown
# Meta Analysis: styled-static

**Date**: 2024-Dec-19-01
**Previous**: 2024-Dec-15-02

## Verdict

Library maintains minimal runtime with no regressions.

## Metrics

| Metric | Current | Previous | Delta |
|--------|---------|----------|-------|
| Runtime (minified) | 45 B | 45 B | - |
| Runtime (brotli) | 50 B | 50 B | - |
| Per-component | ~120 B | ~120 B | - |
| Test coverage | 94% | 92% | +2% |
| TypeScript strict | Yes | Yes | - |
| Dependencies (runtime) | 0 | 0 | - |

## Size

Runtime is 45 bytes minified. Per-component overhead is ~120 bytes. No runtime dependencies.

## Rendering

Components are plain functions with props spread. No context consumption. No memoization overhead. Rerender behavior matches native elements.

## Security

- Identifier validation: Present (`isValidIdentifier` in vite.ts:171)
- String escaping: Present (`safeStringLiteral` in vite.ts:179)
- Dynamic class construction: None
- Debug opt-in only: Yes

## Test Coverage

94% line coverage. Uncovered: error paths in `theme.ts` localStorage handling.

## TypeScript

Enabled: `strict`, `noUncheckedIndexedAccess`, `noEmit`, `skipLibCheck`.

## Changes Since Previous

- Added 3 new tests for variant edge cases
- No changes to runtime or plugin core

## Issues

None.
```
