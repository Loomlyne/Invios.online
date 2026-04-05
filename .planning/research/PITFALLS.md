# PITFALLS

## Pitfall 1: Building an "everything app" before the first tight workflow works

- **Warning signs**: too many screens, too many tabs, lots of schema with no end-to-end flow working
- **Prevention**: keep the roadmap centered on quote/invoice -> send/share -> collect/track
- **Phase impact**: roadmap design, especially phases 1-2

## Pitfall 2: Letting preview, PDF, and public document rendering drift apart

- **Warning signs**: invoice builder preview looks different from exported PDF or public share page
- **Prevention**: one canonical document renderer / template system
- **Phase impact**: document builder phase

## Pitfall 3: Treating payment status as manual text instead of derived financial state

- **Warning signs**: status fields edited manually, mismatch between payments and invoice state
- **Prevention**: derive `partial_paid`, `paid`, and `overdue` from totals + due dates + payment records
- **Phase impact**: payment tracking phase

## Pitfall 4: Bolting on UAE tax support after schema decisions are already made

- **Warning signs**: invoice model missing TRN, tax invoice semantics, AED output assumptions, bilingual rendering support
- **Prevention**: model tax invoice shape early, even if full compliance depth comes later
- **Phase impact**: schema and document engine phase

## Pitfall 5: Overbuilding PWA/offline behavior before core usability exists

- **Warning signs**: time spent on service workers and caches before core builders and dashboard are stable
- **Prevention**: installability first, offline later
- **Phase impact**: foundation phase

## Pitfall 6: Shadcn dashboard sameness

- **Warning signs**: generic cards everywhere, no visual hierarchy, product looks like every admin starter
- **Prevention**: enforce design direction early, especially onboarding, dashboard, and public documents
- **Phase impact**: UI planning and frontend implementation

## Pitfall 7: Reminder automation without idempotency

- **Warning signs**: duplicate reminders, hard-to-trace sends, no per-invoice reminder history
- **Prevention**: explicit reminder logs, unique reminder execution rules, safe retries
- **Phase impact**: automation phase

## Pitfall 8: Version restore that mutates financial truth incorrectly

- **Warning signs**: restoring old invoice snapshots corrupts later payments or expenses
- **Prevention**: clearly define snapshot scope and guard restore flows when operational records already exist
- **Phase impact**: version-history phase

## Sources

- HoneyBook reminders docs: https://help.honeybook.com/en/articles/2209077/
- UAE tax invoice checklist: https://tax.gov.ae/DataFolder/Files/Pdf/Infographic/TAX%20invoice%20Eng.pdf
- UAE tax invoice explainer: https://tax.gov.ae/Datafolder/Files/Pdf/2023/Knowledge%20Center%20Page/VAT11%20-%20Tax%20invoices%20En.pdf
- MDN installable PWAs: https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Making_PWAs_installable
