# Phase 8: Settings Foundation - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-15
**Phase:** 08-settings-foundation
**Areas discussed:** Sidebar visual style, Mobile section switching, Section structure & grouping, Save pattern per section

---

## Sidebar Visual Style

| Option | Description | Selected |
|--------|-------------|----------|
| Match screenshots exactly | Dark background sidebar, icon + text, active pill highlight — pixel copy | |
| Adapt to Invios design tokens | Glass-panel, HSL brand tokens, surface-warm — consistent with app | ✓ |
| You decide | Claude picks | |

**User's choice:** Adapt to Invios design tokens
**Notes:** User wants consistency with existing app aesthetic, not a direct copy of reference screenshots.

---

### Sidebar Layout

| Option | Description | Selected |
|--------|-------------|----------|
| Fixed sidebar (Recommended) | Always visible on desktop, disappears on mobile | ✓ |
| Collapsible sidebar | Toggle open/closed, more complex state | |

**User's choice:** Fixed sidebar

---

### Sidebar Width

| Option | Description | Selected |
|--------|-------------|----------|
| Narrow (~200-220px) | Compact, maximum content space | |
| Medium (~240-280px) | More breathing room, comfortable touch targets | |
| You decide | Claude picks based on content | ✓ |

**User's choice:** You decide (Claude's discretion)

---

## Mobile Section Switching

| Option | Description | Selected |
|--------|-------------|----------|
| Dropdown select at top | Select/combobox showing current section | |
| Bottom sheet with section list | Vaul drawer, matches existing FAB pattern | |
| Horizontal scroll tabs | Current approach but scrollable | |
| You decide | Claude picks based on existing patterns | ✓ |

**User's choice:** You decide (Claude's discretion)

---

### Mobile Icons

| Option | Description | Selected |
|--------|-------------|----------|
| Icons + text (Recommended) | Same as desktop sidebar | ✓ |
| Text only on mobile | Simpler, saves space | |

**User's choice:** Icons + text

---

## Section Structure & Grouping

| Option | Description | Selected |
|--------|-------------|----------|
| Flat list with separators | All 8 sections at same level, subtle dividers | |
| Grouped with headers | Sections under group labels | |
| You decide | Claude picks | ✓ |

**User's choice:** You decide (Claude's discretion)

---

### Default Section

| Option | Description | Selected |
|--------|-------------|----------|
| Profile (Recommended) | Most personal, matches screenshot order | ✓ |
| General | Current default | |
| Last visited section | Remember previous visit | |

**User's choice:** Profile

---

## Save Pattern Per Section

| Option | Description | Selected |
|--------|-------------|----------|
| Fixed header (like screenshots) | Save button top-right, always visible | |
| End of section content | Save at bottom of form | |
| Sticky bottom bar on mobile | Desktop header, mobile sticky bottom | |
| You decide | Claude picks | ✓ |

**User's choice:** You decide (Claude's discretion)

---

### Save Feedback

| Option | Description | Selected |
|--------|-------------|----------|
| Inline button state change | Save → Saving... → Saved ✓ (current pattern) | ✓ |
| Toast notification | Sonner popup in corner | |
| You decide | Claude picks | |

**User's choice:** Inline button state change

---

## Claude's Discretion

- Sidebar width
- Mobile section picker pattern
- Section grouping strategy
- Save button placement

## Deferred Ideas

None
