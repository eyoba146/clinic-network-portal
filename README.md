# Clinic Network Portal

**Repository name:** `clinic-network-portal`  
**Local working folder:** `clinic-connector` (the folder can retain its current name)  
**Project status:** Prototype specification, version 1.0, 3 November 2026  
**Primary reference:** `CLINIC_NETWORK_PORTAL_SRS.pdf`

## 1. Purpose and mandate

Build a professional, fully responsive **centralized, read-only clinic information portal** for headquarters and authorized staff to browse detailed information originating from **54 independent branch installations** of an existing clinic application. Each branch has its **own local database**; database schemas are reported to be the same. The original applications must remain unchanged. The new portal is a **complete read-access interface**, **not just a dashboard**: every *verified and approved* module of the current clinic application should ultimately have a useful read-only counterpart.

**This milestone is a frontend prototype only.** Use React, TypeScript, and realistic but entirely fictional mock data. Do not connect to live branch databases, deploy connectors, introduce real patient data, or build the production backend in the prototype milestone. Structure the frontend so its data access layer can later switch from mock adapters to an authenticated API with minimal UI refactoring.

### Confirmed requirements

- 54 branches, each operating an independent local database with reportedly identical schema.
- Existing clinic application code and operational workflows cannot be changed.
- Headquarters accesses the new portal through the internet.
- Access to source clinic information is **read-only**; no write-back to branch databases.
- Authorized roles need detailed pages and records across the available modules, not just charts.
- The prototype must be responsive, credible in an actual healthcare organization, and designed to avoid repetitive template-style admin UI.
- Current phase: produce a demo-ready frontend with mock data and a clear path to later integration.

### Assumptions requiring validation, not facts

- Exact original clinic modules, screens, fields, terminology, workflows, database engine, and source data relationships are **unknown**.
- Windows branch servers and C#/.NET connector are **proposed**, not confirmed.
- Sync latency, data size, file/image storage, branch hardware, connectivity, hosting, and regulatory hosting constraints are **not yet verified**.
- Example pages below are a **candidate information architecture**, not evidence that these modules exist in the legacy system.

**Product rule:** Never represent speculative clinical information or invented operational workflows as verified legacy functionality. Mark illustrative prototype data `DEMO DATA` and make all record names/IDs fictional.

## 2. Product outcomes and boundaries

### User outcomes

1. An authorized organization-level user can see 54 branches and their data freshness status, select a branch, and traverse detailed read-only pages.
2. An authorized regional/branch user sees only permitted branches, modules, and records.
3. A user can search, filter, sort, paginate, open details, follow related records, and export authorized demo reports.
4. A user sees when data was last synchronized and when it may be stale; the application never mislabels cached data as live.
5. The UI supports desktop, tablet, and mobile without clipped headers, unreadable tables, or off-screen controls.

### Explicitly out of scope for the prototype

- Writing to, editing, deleting, or approving source clinic records; patient registration or appointment booking submissions.
- Production database connectors, CDC pipelines, real credentials, actual authentication server, payment processing, notifications to patients, live data exports, hosting, and regulatory compliance certification.
- Reverse engineering the old application from guesses; the discovered legacy feature inventory will control the future final scope.
- Generic “Add patient”, “Save invoice”, “Issue prescription”, or “Approve” actions presented as working features.

**Allowed portal-local administrative concepts for future production:** managing access permissions, sessions, connector settings, and audit logs in the *central platform* (never branch clinical data). In this prototype these can be read-only previews; avoid active administration forms until approved.

## 3. UX and visual direction

This must look like a **purpose-built healthcare operations product**, not a generic AI-generated dashboard.

### Design principles

- **Information-first and clinical-grade:** hierarchy is established through typography, spacing, alignment, grouping, and purposeful use of color, not gradients or decorative cards.
- **A recognizable visual identity:** restrained deep ink/navy foundation, warm off-white surfaces, nuanced slate, and one carefully chosen clinical teal/blue accent. Define design tokens and adjust based on visual review; no purple gradients, neon glassmorphism, giant rounded floating panels, decorative blobs, or stock “healthcare” illustrations.
- **Distinctive structural composition:** compact, well-designed utility rail/sidebar; strong page titles and contextual breadcrumbs; a persistent branch selector and sync freshness indicator; dense but readable data grids; structured detail views with secondary navigation. Avoid making every page a grid of four KPI cards.
- **Real-world interaction patterns:** persistent filters in page layout, inline drawers only where genuinely useful, no popup/modal for routine navigation or record viewing. Use confirmation dialogs only for genuinely consequential local actions (none expected in initial read-only build).
- **No emoji in the application, source comments, or documentation.** Use an established professional SVG icon set, **not Lucide React**. Prefer Phosphor Icons (`@phosphor-icons/react`) with consistent stroke/weight, or another coherent open-source icon family approved in advance.
- **Accessibility:** keyboard navigation, visible focus, labels, high contrast, semantic landmarks, meaningful empty/error/loading states, reduced-motion preference, no color-only statuses.
- **Honest UI:** visibly mark mock data, simulated sync timestamps, and offline states. Never imply production connectivity or real patient records.
- **Responsive rules:** preserve information architecture across viewport sizes instead of merely shrinking font and padding.

### Layout rules by viewport

| Viewport | Navigation | Data presentation |
|---|---|---|
| >= 1280px desktop | Stable expanded sidebar, top utility bar | Full tables, contextual side panel or split detail view |
| 768-1279px tablet | Compact/collapsible navigation | Responsive grids, scroll-safe tables, stacked detail sections |
| 360-767px mobile | Accessible drawer or bottom/compact nav | Priority columns or labeled record cards; filters in an accessible inline disclosure; never horizontal page overflow |

Use fluid typography and spacing, test at **360, 390, 768, 1024, 1280, 1440, and 1920 px**. Tables may scroll inside their bounded container when needed; the **entire page must not overflow horizontally**. Keep tap targets usable, and do not put critical controls behind hover-only affordances.

### Design quality bar

- Avoid interchangeable SaaS dashboard visuals, same-size cards everywhere, overly airy spacing for clinical workflows, ungrounded charts, and endless centered modals.
- Favor carefully designed desktop data density, neutral bordered sections, excellent tabular number treatment, strong label/value alignment, and purposeful hierarchy.
- Build responsive layouts and actual user journeys, not a collection of disconnected polished screenshots.

## 4. Information architecture and routes (provisional)

Every module should have a functioning list/index and representative detail page in the **prototype** where indicated. Keep route definitions centralized; create pages only for approved candidate modules below, and mark them as illustrative until validated with the original application.

| Area | Proposed routes | Minimum prototype interactions |
|---|---|---|
| Entry and workspace | `/login`, `/app`, `/app/branches` | Demo role selection/login, organization summary, searchable branch directory |
| Branch context | `/app/branches/:branchId` | Branch profile, connectivity/sync status, linked modules |
| Patients | `/app/patients`, `/app/patients/:patientKey` | Search, filter, patient detail, related visits and lab links |
| Visits/encounters | `/app/visits`, `/app/visits/:visitKey` | Chronological list, encounter detail, source branch |
| Appointments | `/app/appointments`, `/app/appointments/:appointmentKey` | Calendar/list toggle if justified, status filters, detail view |
| Laboratory | `/app/laboratory`, `/app/laboratory/:orderKey` | Lab orders/results list, detail and reference information |
| Pharmacy | `/app/pharmacy`, `/app/pharmacy/:dispenseKey` | Dispensing records, medication details; inventory only if supported later |
| Billing and payments | `/app/billing`, `/app/billing/:invoiceKey` | Invoices, line items, payments, totals and status |
| Reports | `/app/reports` | Branch and date filters, reproducible summary tables, export mock CSV |
| Staff | `/app/staff`, `/app/staff/:staffKey` | Directory, staff detail, assigned branch |
| System health | `/app/sync-health` | 54 connectors, last sync, lag, errors, offline/stale indicators |
| Access and audit preview | `/app/access`, `/app/audit` | Read-only permission matrix, sample audit activity |
| System pages | `/403`, `/404`, internal route error view | Clear and accessible exception states |

**Do not fabricate missing clinical modules as confirmed.** Once current software screenshots/database inventory are provided, update the route matrix and field specifications to match them. No active form that could suggest saving data into the clinic system.

### Navigational contract

- Branch context is prominent, persistent, and reflected in URL/query state when feasible.
- Organization-wide and single-branch views are clearly distinct. If permissions forbid all-branch views, hide/disable that scope and enforce it in mock repository/service logic.
- Cross-links carry composite record identity and branch context. Assume numeric patient `1001` may exist in multiple branches.
- Breadcrumbs and page labels are consistent; deep links work after refresh.
- Filters, sort order, selected branch, and pagination can be restored from query parameters for shareable views.

## 5. Demo roles and permissions

Implement configurable **mock permissions** at the data-access boundary and in route guards, not visual hiding alone. These are demonstration roles only; final clinic role policy must be signed off.

| Role | Branch scope | Candidate allowed modules |
|---|---|---|
| HQ Administrator | All 54 | All approved data views plus sync health/access preview |
| Executive / General Manager | All 54 | Organization and branch overviews, approved operational/financial detail |
| Regional Manager | Assigned branch subset | Authorized clinical/operational/financial views |
| Branch Manager | Single assigned branch | Authorized branch-level views and records |
| Finance Officer | Assigned branch subset | Finance and approved reports only |
| Clinical Supervisor | Assigned branch subset | Patients, visits, lab, pharmacy where authorized |

**Sensitive healthcare information is denied by default**, including for executives unless the clinic explicitly approves access. For the demo, use synthetic fields only, and implement a permissions table allowing module-by-module access. Include at least one access-denied scenario, one branch-restricted scenario, and one role switch for demonstration. Actual production authorization must be enforced by the backend.

## 6. Fictional mock data and types

All data must be deterministic, locally generated/seeded, and reproducible. No external fake-person API. Use culturally plausible but entirely fictitious names; no real patient or employee information. Include useful variety, realistic empty states, and long strings to validate responsive behavior.

### Baseline seed size

- 54 uniquely identified branches (`BR-001` through `BR-054`), each with region, display name, status, timezone, last successful sync, sync lag, and data count metrics.
- At least 600 fictional patients distributed across branches, 1,000 encounters, 300 appointments, 300 lab orders, 250 pharmacy records, 500 invoices and associated payments, and 100 staff records. A smaller *initial implementation* is acceptable if data contracts, pagination, representative detail navigation and the 54 branch directory work end-to-end.
- Include cases: duplicate local patient IDs across two branches, same-name patients, partial records, unpaid/part-paid invoice, canceled appointment, delayed sync, offline branch, empty branch data, and restricted record visibility.
- Make all displayed metrics **derived from the same seed records** rather than disconnected invented totals.

### Core domain interfaces

Use shared TypeScript types (actual definitions in `src/domain/`) for:

```ts
type BranchId = string;
type SourceRecordId = string;
type CompositeKey = `${BranchId}:${SourceRecordId}`;
type DataFreshness = 'current' | 'delayed' | 'stale' | 'offline' | 'unknown';
interface SourceRef {
  branchId: BranchId;
  sourceId: SourceRecordId;
  sourceSystem?: string;
  syncedAt: string | null; // ISO 8601
}
interface PaginatedResult<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
}
interface QueryOptions {
  branchIds?: BranchId[];
  search?: string;
  from?: string;
  to?: string;
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
}
```

Define typed models for Branch, Patient, Encounter/Visit, Appointment, LabOrder/Result, Medication/Dispense, Invoice, Payment, Staff, DemoUser, SyncStatus and AuditEvent. All records include `SourceRef` where relevant. Avoid relying on a single global numeric ID. Treat cross-branch patient identity matching as **unresolved**, not automatic.

### Mock repository boundaries

Create **interfaces**, and implement them with local asynchronous mock adapters. Components must never import seed arrays directly.

```ts
interface ClinicReadRepository {
  listBranches(options?: QueryOptions): Promise<PaginatedResult<Branch>>;
  getBranch(branchId: BranchId): Promise<Branch | null>;
  listPatients(options?: QueryOptions): Promise<PaginatedResult<Patient>>;
  getPatient(key: CompositeKey): Promise<PatientDetail | null>;
  listVisits(options?: QueryOptions): Promise<PaginatedResult<Visit>>;
  getVisit(key: CompositeKey): Promise<VisitDetail | null>;
  // Repeat the list/detail pattern for the approved remaining modules.
  getSyncHealth(): Promise<SyncStatus[]>;
  getReports(options?: QueryOptions): Promise<ReportSummary>;
}
```

Use a single repository provider/factory. A future `HttpClinicReadRepository` should implement the same interfaces and be selected using environment configuration; **do not build the real adapter or API server in this milestone**. Model `loading`, `error`, `empty`, `permission-denied`, and `stale` states intentionally. Simulate short latency in a predictable way only where it helps validate loading UI.

## 7. Component and project architecture

Preferred frontend stack: **React + TypeScript + Vite + React Router + Tailwind CSS**. Use TanStack Query for async/cache boundaries and TanStack Table for complex data grids if needed; use Phosphor icons. Choose a small, compatible accessible component primitive library when necessary, but don't accept its stock theme without design adaptation.

Suggested filesystem layout:

```text
clinic-connector/                    # current local directory; git repo: clinic-network-portal
  README.md
  CLINIC_NETWORK_PORTAL_SRS.pdf
  package.json
  index.html
  src/
    app/
      App.tsx
      router.tsx
      providers.tsx
      navigation.ts
    design/
      tokens.css
      typography.css
    domain/
      types.ts
      permissions.ts
      repositories.ts
    data/
      seeds/
      mockClinicRepository.ts
      mockSession.ts
    features/
      overview/
      branches/
      patients/
      visits/
      appointments/
      laboratory/
      pharmacy/
      billing/
      reports/
      staff/
      sync-health/
      access/
      audit/
    components/
      layout/
      data-grid/
      detail/
      status/
      feedback/
    lib/
      formatting.ts
      query-state.ts
      csv.ts
    test/
  public/
```

This is a target organization, not a requirement to create empty folders. Prefer coherent feature modules, reusable patterns, and clear boundaries. Use strict TypeScript, linting, formatting, and meaningful component tests; avoid `any` for API/domain types.

## 8. Page templates and behavior

### Lists and directories

Every detailed module must have: clear title and context, scoped branch filter, search, useful domain filters, sortable columns where appropriate, pagination, row-to-detail navigation, loading skeleton, empty state with actionable explanation, error state, and last-sync/source provenance where applicable. Search should never imply results from unreachable branches are current.

### Detail pages

Use a compact identity header, source branch and source record ID, timestamp/freshness, key fields, logical sections, and links to related records. Do not use a modal as the primary detail experience. A read-only page may use tabs for subsections, but routes should remain deep-linkable.

### Organization overview

Prefer meaningful operational rollups and trend tables; surface data coverage and stale branch warnings alongside numbers. Provide branch comparison and drill-down links. No unverified clinical effectiveness claims.

### Synchronization health

A first-class status page with `branch`, `connector version` (fictional for demo), `last successful sync`, `lag`, `records processed`, `last error`, and `state`. Include clear distinction between **connector offline** and **source data current**. Do not show imaginary real-time connectivity.

### Demo login

Use a prominent `DEMO ENVIRONMENT` label. A local persona switch may simulate login; no collection of real passwords. Keep the architecture ready for an external identity provider later. Do not falsely advertise MFA as implemented in the prototype.

## 9. Responsiveness, accessibility, and performance acceptance criteria

- All specified routes work as a navigable application; no dead sidebar items. Routes for not-yet-implemented modules must explicitly say `Prototype section pending`, not display fabricated operational screens.
- At 360px width: no page-level horizontal overflow; mobile navigation can open/close by touch and keyboard; labels do not collide; tables use responsive priority views or contained scrolling.
- At 768px and 1024px: no clipped charts, dates, navigation, or actions.
- At 1440px: readable density, consistent row heights, well-aligned detail fields.
- Keyboard: tab order, `Escape` to close navigation drawer, visible focus, labeled controls, correct semantic table headers.
- Mock permissions are applied within repositories and guards. Users cannot retrieve other-branch records merely by typing a detail URL in the prototype.
- All pages include authentic `loading`, `empty`, `error`, `unauthorized`, and `stale` handling as relevant.
- Record listings paginate and do not render enormous datasets at once.
- Avoid unnecessary animation; honor `prefers-reduced-motion`.
- No visible create/edit/delete/source-write controls. CSV export, if included, exports only the user's permitted synthetic records.

## 10. Prototype implementation sequence for Codex

1. Read this README and the accompanying SRS. Identify confirmed requirements versus unknown legacy details; do not expand speculative scope.
2. Initialize frontend project in the existing folder, preserving this README and SRS. Configure TypeScript, Vite, routing, styling, icon system, linting, and testing.
3. Establish design tokens, desktop/tablet/mobile app shells, responsive navigation, demo session personas, branch context, and access rules.
4. Define domain types, deterministic synthetic seed generator, and `ClinicReadRepository` interface + mock implementation.
5. Implement 54-branch directory, branch detail, overview, and sync-health experience first; validate role and branch scoping.
6. Implement patient and visit list/detail journeys with linked records and shared data-grid/detail components.
7. Extend the same architecture to laboratory, appointments, pharmacy, billing, staff, and reports. Every implemented module must have meaningful content and functioning drill-down.
8. Add error/empty/stale/permission states, realistic filters, URL-backed query state, CSV demo export, and responsive polish.
9. Add tests for scoping, composite keys, navigation, formatting, repository behavior, and critical UI states.
10. Run the build and test suite; inspect at specified viewport widths; correct broken layouts. Document remaining assumptions in the README under `Open decisions` without pretending they are resolved.

**Execution discipline:** Build in vertical slices and keep the app runnable. No fake connection to an API, no production credentials, no rewriting the legacy application, and no separate backend in prototype phase.

## 11. Production architecture target (not to implement yet)

```text
54 independent branch applications + local databases
     | read-only DB access
     v
54 installations of one configurable branch connector
     | outbound HTTPS 443, authenticated and encrypted
     v
Central ingestion API -> validated/idempotent sync pipeline
     |                         |
     |                         +-> sync monitoring/audit
     v
Central branch-aware read store (PostgreSQL)
     |
     v
Authenticated REST read API with RBAC + branch-based authorization
     |
     v
React web portal (responsive, detailed read-only modules)
```

- Proposed connector: **custom C# + .NET Worker Service**, published as a Windows `.exe`/service, **only if Windows and compatible source database access are confirmed**. Node.js-based service remains a valid alternative.
- Each connector has a unique branch-bound machine identity and least-privilege local DB account. No public branch DB ports, no incoming branch router forwarding. Central ingestion endpoint must be reachable over outbound HTTPS.
- Initial backfill runs in bounded batches; incremental changes use a verified technique (native CDC/change tracking, trustworthy timestamps and keyset paging, or reconciliation). Handle source updates and deletes. Do **not** assume that `updated_at` exists or that polling timestamps alone are sufficient.
- Use durable acknowledgment and checkpoints, idempotent upserts based on `(branch_id, entity_type, source_id)`, version/order handling, and retry/backoff after disconnects.
- Preserve source identity and lineage; avoid merging patients across branches based only on names or IDs.
- Central user authorization and **separate connector authorization** are both required. Patient-level data access must be legally approved and minimized.
- Branch offline means central read data may be stale. Show `last_successful_sync` and warning states in UI.
- Validate hosting, data residency, privacy controls, retention, encryption, MFA, audit, recovery, and applicable Ethiopian healthcare/data-protection obligations with qualified stakeholders before production.

## 12. Delivery gates and evidence

| Gate | Deliverable | Required evidence |
|---|---|---|
| P0 - discovery | Legacy module inventory and sample schema, sanitized | Signoff on what will be reproduced |
| P1 - prototype | React demo with 54 branches and detailed routes | Responsive walkthrough, mock-data and role tests |
| P2 - single branch PoC | Read-only connector and central ingestion | Verified source-to-central parity and offline recovery |
| P3 - production-ready | Hardened access, monitoring, reconciliation, backups | Security, load, DR, and acceptance tests |
| P4 - rollout | Controlled branch onboarding | Per-branch health, data parity, support handoff |

Prototype completion is **not** proof that the actual database is compatible. The production plan can change when the database engine and application workflows are inspected.

## 13. Open decisions and required discovery artifacts

Before any production integration, obtain: legacy app module/menu inventory; redacted screenshots; database engine/version; logical/physical schema; a sanitized data sample; user permission mapping; whether documents are stored in the DB or on disk; supported DB change tracking; branch operating systems/hosting; network egress requirements; data volumes, retention and expected latency; legal basis and authorized fields; expected concurrency; and support/rollout ownership.

Specifically ask the legacy vendor/DB administrator whether a **dedicated read-only account** and **safe, low-impact change extraction** are supported, and whether any existing API/export/replication feature exists. An already-supported vendor integration may be preferable to a custom connector.

## 14. Suggested review scenarios

1. HQ demo user sees 54 branches, picks `BR-012`, views a fictional patient, follows an encounter, opens a lab result, then returns with filters intact.
2. Regional manager sees only allocated branches, cannot open an unauthorized branch via typed URL.
3. Finance officer can open invoices and payments but not sensitive patient clinical details.
4. A branch is offline; its detail page remains usable with explicit stale-data warnings and a last-successful-sync time.
5. Duplicate source ID `1001` exists in two branches and resolves to different records without collision.
6. On a 390px phone, branch switcher, record list, filters, and patient detail are all usable without page overflow.
7. A module with no records presents a proper empty state rather than invented chart data.
8. All metrics shown in overviews are computed from the same fictional records backing detail pages.

## 15. Conventions for downstream implementation

- Repository name: **`clinic-network-portal`**. Do not use `clinic-connector` as the GitHub repository name because it describes only one later integration component; the project is a complete portal and integration platform.
- Preserve this README as a living requirements contract. Amend it for approved decisions, not speculative features.
- No real patient data, secrets, connector tokens, production URLs, or `.env` values committed to Git.
- Maintain an `.env.example` with *non-secret* placeholder flags only if needed for the frontend.
- Prefer meaningful UI text, consistent clinical terminology, auditability, and restrained visual design.
- Explicitly mark demo-only features and future integration points.
- When requirements are missing, implement the smallest reasonable demo behavior and document the assumption rather than inventing backend semantics.

---

**Companion document:** `CLINIC_NETWORK_PORTAL_SRS.pdf` contains the complete system-level SRS, architecture, data synchronization workflows, risks, non-functional requirements, deployment and integration phases, and acceptance criteria. This README is the **frontend prototype implementation contract** for Codex; the SRS governs the broader system design. Where either document makes an assumption, treat it as unverified until stakeholder signoff.

## 16. Running the implemented prototype

The original frontend and system requirements above remain the scope contract. The local React prototype now lives in `src/`.

```sh
npm install
npm run dev
npm test
npm run lint
npm run build
```

Use `npm.cmd` in PowerShell if execution policy blocks npm's script shim. See [Implementation notes](docs/IMPLEMENTATION.md) for architecture, seed counts, demo roles, walkthroughs, reporting semantics, and validation limits.

### Open decisions recorded during implementation

- The 54 branch names, clinical fields, lab reference values, ETB prices and role assignments are illustrative, not verified legacy behavior.
- The demo uses a fixed 3 November 2026 12:00 EAT snapshot and branch-local composite identity; no patient matching is attempted.
- Appointment list view is sufficient for this milestone; no booking or calendar mutation is modeled.
- Invoice-cohort reports include attached recorded payments; cash-flow, taxes, insurance and clinical effectiveness reporting are not inferred.
- Audit is a labeled seeded preview, and demo sessions are local, two-hour persona sessions. Production authentication, audit persistence, and backend authorization remain deferred.
- Browser preview permission was declined during implementation. Real-browser visual and keyboard verification at the seven specified widths remains pending; do not treat the responsive implementation alone as completed visual acceptance evidence.
