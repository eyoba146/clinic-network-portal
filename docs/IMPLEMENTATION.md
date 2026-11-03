# Implementation notes

## Local development

Use Node.js 22.13+ (or a compatible newer LTS) and npm. No environment variables or credentials are required.

```sh
npm install
npm run dev
npm test
npm run lint
npm run build
npm run preview
```

On Windows PowerShell, use `npm.cmd` if script execution policy blocks `npm.ps1`.
The development server binds to loopback. Vite prints the local URL. The production output is `dist/`; a future static host must rewrite unknown routes to `index.html` for React Router deep links. No hosting was configured or performed.

## Delivered architecture

- `src/domain/`: typed source identities, records, permissions, read repository contract, and status-bearing errors.
- `src/data/seed.ts`: deterministic fictional data. Only the mock repository and invariant tests import it.
- `src/data/mockClinicRepository.ts`: asynchronous reads, pagination, query filtering, detached result objects, module/branch/record policy, related-record projection, and derived reports.
- `src/data/repositoryFactory.ts`: the single replacement point for a future authenticated HTTP adapter. No HTTP adapter, backend, or connector is implemented.
- `src/app/`: session/repository providers, branch context, centralized navigation and route composition, guards, and rendering error boundary.
- `src/features/`: functional overview, directories, details, reports, synchronization, access preview, audit, and persona login.
- `src/components/`: shared shell, filters, responsive tables, source fields, status badges, loading/empty/error/denial states.
- `src/design/styles.css`: Tailwind import, tokens and purpose-built responsive styling. Uses system fonts and Phosphor icons; no third-party images or font requests.
- `src/test/`: repository invariants and user-facing component journeys.

The generic `list<M>()` / `get<M>()` methods preserve module-specific result types through `EntityMap`. A future HTTP implementation should implement `ClinicReadRepository`, including authorized projections and status-bearing errors. Replace the factory; page components do not need access to source arrays.

## Demo data and scope

The fixed snapshot is 3 November 2026 at 12:00 EAT. All timestamps are explicitly presented in `Africa/Addis_Ababa`, irrespective of the viewer's computer time zone. This is a fictional organization. Branch names, people, email addresses, phone strings, clinical reference fields, prices, and connector diagnostics are synthetic. Every module remains a candidate pending legacy-system validation.

| Record              | Seed count |
| ------------------- | ---------: |
| Branches            |         54 |
| Patients            |        636 |
| Encounters          |      1,272 |
| Appointments        |        371 |
| Laboratory orders   |        424 |
| Dispensing records  |        318 |
| Invoices            |        636 |
| Payment receipts    |        424 |
| Staff               |        106 |
| Sample audit events |        108 |

BR-054 deliberately has no source records and has not been onboarded. BR-013 is offline, BR-011 has partial synchronization, and BR-017 has a failed stream. Records remain available with explicit cached-data warnings. Data and health counts are derived from the same seed. Source ID 1001 repeats safely across branches; records are identified by module plus branch-qualified key.

## Demonstration policy

- HQ: all modules and branches, including explicitly restricted fictional records.
- Executive: operational and financial views across all branches; no patient, visit, lab, or pharmacy access.
- Regional: BR-001 through BR-012; approved clinical, operational, financial and reporting views.
- Branch manager: BR-012 only.
- Finance: BR-001 through BR-012; billing and reports only. Clinical totals and related patient records are not returned.
- Clinical supervisor: BR-001 through BR-012; overview, branches, patients, visits, lab and pharmacy.

The last fictional patient in each populated branch and its related records are restricted to HQ. Restrictions apply in lists, details, relationships, and reports. Branch-scoped selection metadata is returned to all personas, including finance, to support their authorized filters.

Mock sessions last two hours and live in session storage. They are deliberately user-selectable and are not security credentials. All synthetic data is shipped to the browser. Production security must be enforced independently by the authenticated backend; frontend restrictions are only a demonstration.

## Interaction and reporting decisions

- Search, status, dates, region, sorting, pagination, and branch context use query parameters. Related links carry module and composite identity. Returning directly from a detail preserves its originating list filters.
- Direct detail identities determine the displayed branch context even if a conflicting branch query is supplied.
- Appointments use a list; an additional calendar is not justified by this prototype's data or required by the specification.
- Reports filter patient registration, encounter, and invoice issue dates. Payment columns summarize receipts attached to selected invoices, not payments received during that date interval. There is no claim that this is a source-validated accounting report.
- CSV exports include only permitted synthetic summary fields, branch provenance, date range, snapshot time, and freshness warnings. Formula-like values are escaped. Exporting does not write source records.
- Audit events are seeded examples, clearly labeled. They do not claim to persist actual access logs.
- Open `Demo controls` in the footer to simulate a read-service failure; clear it to recover. Loading, missing record, empty branch, stale, offline, partial, denied, and expired-session states are represented.
- Mobile uses labeled record cards and explicit sort controls; tablet uses compact navigation and bounded table scrolling; desktop uses expanded navigation. Navigation supports Escape, a focus trap while open, inert background, and focus return.

## Validation and remaining gate

`npm test` verifies role/branch/record restrictions, synthetic data counts and relationships, invoice and report reconciliation, repeated source IDs, pagination and filtering, offline availability, service/session errors, export escaping, and core component journeys. `npm run lint` and `npm run build` validate the source and production bundle.

Browser preview access was declined by the browser origin permission gate during implementation. No browser workaround was used. Visual review, actual viewport overflow measurements at 360, 390, 768, 1024, 1280, 1440 and 1920 pixels, and real-browser keyboard checks remain a review gate. Responsive CSS and DOM-level tests are not a substitute for that evidence.

Manual review sequence: select HQ, choose BR-012, search Selam, open the patient, follow the first encounter, open the laboratory order, return to the list; inspect BR-013 offline and BR-054 empty; switch to finance and try a clinical URL; export a scoped report; use keyboard-only navigation on desktop and mobile.

## Requirement traceability

FR-01/02: branch directory, persistent URL scope, composite source identity.
FR-03/04/05/06: candidate module lists/details, filters/sorting/pagination, permission-filtered links, no source write methods.
FR-07: mock policy in guards and repository; actual API enforcement remains deferred.
FR-08/11/12/14: provenance, connector/record status separation, scoped reports, distinct exceptional states.
FR-13: labeled audit preview; persistent security auditing remains production work.
FR-15/16: deterministic synthetic repository and typed replacement boundary.
FR-17: responsive/accessibility implementation; real-browser visual validation pending.
FR-09/10/18 and AT-10/11/12: production connector, reconciliation and source-document integration are intentionally outside this milestone.

## Validation record - 3 November 2026

- Production build: passed (strict TypeScript and Vite).
- ESLint: passed, no warnings or errors.
- Automated tests: 39 passed across repository invariants and component journeys, including all seven source-record directory/detail pairs.
- Dependency installation/audit: zero reported vulnerabilities after upgrading the lint/test toolchain and overriding the lint-only minimatch dependency to its patched 11.x release.
- Development server: Vite started successfully on loopback.
- Browser rendering / screenshots / viewport measurements: not verified because the browser origin permission gate denied local preview access.

The remaining visual review gate is stated explicitly above. No live systems, connectors, source writes, or production authentication were introduced.
