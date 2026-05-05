# Phase 6: CSV Client Import - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-14
**Phase:** 06-csv-client-import
**Areas discussed:** Wizard flow, Column mapping, Duplicate handling, Error display

---

## Wizard Flow

### Presentation

| Option | Description | Selected |
|--------|-------------|----------|
| MobileSheet overlay | Opens as Vaul drawer (mobile) / Dialog (desktop) from the clients page | ✓ |
| Full page /clients/import | Dedicated route with its own page layout | |
| You decide | Claude picks whichever approach fits the codebase best | |

**User's choice:** MobileSheet overlay — matches existing app patterns, user stays on clients page.

### Steps

| Option | Description | Selected |
|--------|-------------|----------|
| 3 steps: Upload → Preview → Result | Column mapping happens automatically with header detection | |
| 4 steps: Upload → Map → Preview → Result | Explicit column mapping step between upload and preview | ✓ |
| You decide | Claude picks based on complexity trade-offs | |

**User's choice:** 4 steps — explicit mapping step gives users full control over messy CSVs.

---

## Column Mapping

### Mapping UX

| Option | Description | Selected |
|--------|-------------|----------|
| Auto-map + override | Auto-detect common headers by fuzzy matching, dropdowns for override | ✓ |
| Always manual dropdowns | All fields start empty, user picks each mapping | |
| You decide | Claude picks the approach | |

**User's choice:** Auto-map with full user control — "User can pick which CSV column maps to each, he has full control."
**Notes:** User emphasized that auto-map is for convenience but user must always have dropdown control to override.

### Template

| Option | Description | Selected |
|--------|-------------|----------|
| Yes — download link on upload step | Small link below file input with correct headers | ✓ |
| No template needed | Mapping step handles any format | |
| You decide | Claude decides based on cost | |

**User's choice:** Yes — download link on upload step.

---

## Duplicate Handling

| Option | Description | Selected |
|--------|-------------|----------|
| Flag in preview, user decides | ⚠️ badge on duplicates, user unchecks to skip | ✓ |
| Skip all duplicates silently | Auto-skip, show count in result | |
| Update existing on match | Overwrite existing client fields with CSV values | |
| You decide | Claude picks the safest approach | |

**User's choice:** Flag in preview, user decides — duplicates visible but user controls the outcome.

---

## Error Display

| Option | Description | Selected |
|--------|-------------|----------|
| Inline per row | Red highlight + error text beneath invalid rows, green check on valid | ✓ |
| Separate error panel | Preview shows valid only, errors in collapsible panel | |
| You decide | Claude picks based on preview table complexity | |

**User's choice:** Inline per row — errors visible in context, user unchecks bad rows before importing.

---

## Claude's Discretion

- Fuzzy matching algorithm for header auto-detection
- CSV parsing configuration details
- Result summary layout
- "Import CSV" button placement and icon

## Deferred Ideas

None
