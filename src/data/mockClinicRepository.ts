import type { ClinicReadRepository } from '../domain/repositories';
import { RepositoryError } from '../domain/repositories';
import { can, canBranch, personas } from '../domain/permissions';
import type {
  BaseRecord,
  Branch,
  CompositeKey,
  DemoUser,
  EntityMap,
  Module,
  PaginatedResult,
  QueryOptions,
  RecordDetail,
  RecordModule,
  RelatedRecord,
  ReportSummary,
} from '../domain/types';
import { audit, branches, seed, SNAPSHOT } from './seed';
export interface MockOptions {
  latency?: number;
  fail?: boolean;
  expiresAt?: number;
}
const clone = <T>(value: T): T => structuredClone(value);
function paginate<T>(rows: T[], q: QueryOptions): PaginatedResult<T> {
  const size = Math.min(50, Math.max(1, Math.trunc(q.pageSize || 12)));
  const page = Math.min(
    Math.max(1, Math.trunc(q.page || 1)),
    Math.max(1, Math.ceil(rows.length / size)),
  );
  return {
    items: clone(rows.slice((page - 1) * size, page * size)),
    page,
    pageSize: size,
    total: rows.length,
  };
}
function searchable(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'object') return Object.values(value).map(searchable).join(' ');
  return String(value);
}
function filterSort<T extends object>(rows: T[], q: QueryOptions): T[] {
  const search = q.search?.trim().toLowerCase() ?? '';
  const filtered = rows.filter((row) => {
    const r = row as Record<string, unknown>;
    return (
      (!search || searchable(r).toLowerCase().includes(search)) &&
      (!q.status || r.status === q.status || r.outcome === q.status) &&
      (!q.region || r.region === q.region) &&
      (!q.from || String(r.date ?? '') >= q.from) &&
      (!q.to || String(r.date ?? '').slice(0, 10) <= q.to)
    );
  });
  const field = q.sortBy ?? 'name';
  const direction = q.sortDirection === 'desc' ? -1 : 1;
  return filtered.sort((a, b) => {
    const av = (a as Record<string, unknown>)[field] ?? '';
    const bv = (b as Record<string, unknown>)[field] ?? '';
    return (
      direction *
      (typeof av === 'number' && typeof bv === 'number'
        ? av - bv
        : searchable(av).localeCompare(searchable(bv), undefined, { numeric: true }))
    );
  });
}
export function createMockRepository(
  user: DemoUser,
  config: MockOptions = {},
): ClinicReadRepository {
  async function ready(module?: Module) {
    await new Promise((resolve) => setTimeout(resolve, config.latency ?? 180));
    if (config.expiresAt !== undefined && Date.now() > config.expiresAt)
      throw new RepositoryError(
        401,
        'Your demo session has expired. Select a persona to continue.',
      );
    if (module && !can(user, module))
      throw new RepositoryError(
        403,
        'This demo role does not have permission to view this module.',
      );
    if (config.fail)
      throw new RepositoryError(
        503,
        'Simulated read service unavailable. No source data has changed.',
      );
  }
  function scope(q: QueryOptions = {}): Branch[] {
    if (q.branchIds?.some((id) => !canBranch(user, id)))
      throw new RepositoryError(403, 'This branch is outside your assigned scope.');
    return branches.filter(
      (b) => canBranch(user, b.id) && (!q.branchIds?.length || q.branchIds.includes(b.id)),
    );
  }
  function visible(record: BaseRecord, module: RecordModule) {
    if (!canBranch(user, record.branchId)) return false;
    const patient =
      module === 'patients'
        ? seed.patients.find((p) => p.key === record.key)
        : seed.patients.find((p) => p.key === record.patientKey);
    return !patient?.restricted || user.allowRestricted;
  }
  function records<M extends RecordModule>(module: M, q: QueryOptions = {}): EntityMap[M][] {
    const ids = scope(q).map((b) => b.id);
    return seed[module].filter((r) => ids.includes(r.branchId) && visible(r, module));
  }
  function report(q: QueryOptions): ReportSummary {
    const inDate = (date: string) =>
      (!q.from || date >= q.from) && (!q.to || date.slice(0, 10) <= q.to);
    const selected = scope(q);
    return {
      asOf: SNAPSHOT,
      from: q.from ?? '2026-10-01',
      to: q.to ?? '2026-11-03',
      coverage: {
        total: selected.length,
        current: selected.filter((b) => b.status === 'current').length,
        incomplete: selected.filter((b) => b.status !== 'current' || b.syncState !== 'Complete')
          .length,
      },
      rows: selected.map((b) => {
        const qb = { branchIds: [b.id] };
        const invoices = records('billing', qb).filter((r) => inDate(r.date));
        const hasFinance = can(user, 'billing');
        return {
          branchId: b.id,
          branchName: b.name,
          status: b.status,
          lastSync: b.lastSync,
          patients: can(user, 'patients')
            ? records('patients', qb).filter((r) => inDate(r.date)).length
            : null,
          visits: can(user, 'visits')
            ? records('visits', qb).filter((r) => inDate(r.date)).length
            : null,
          appointments: can(user, 'appointments')
            ? records('appointments', qb).filter((r) => inDate(r.date)).length
            : null,
          invoices: hasFinance ? invoices.length : null,
          invoiced: hasFinance ? invoices.reduce((s, r) => s + r.total, 0) : null,
          collected: hasFinance ? invoices.reduce((s, r) => s + r.paid, 0) : null,
          outstanding: hasFinance ? invoices.reduce((s, r) => s + r.balance, 0) : null,
        };
      }),
    };
  }
  return {
    cacheKey: `${user.id}:${config.fail}:${config.expiresAt}`,
    async listScopes() {
      await ready();
      return clone(scope());
    },
    async listBranches(q = {}) {
      await ready('branches');
      return paginate(filterSort(scope(q), q), q);
    },
    async getBranch(id) {
      await ready('branches');
      if (!canBranch(user, id))
        throw new RepositoryError(403, 'This branch is outside your assigned scope.');
      return clone(branches.find((b) => b.id === id) ?? null);
    },
    async list<M extends RecordModule>(module: M, q: QueryOptions = {}) {
      await ready(module);
      return paginate(filterSort(records(module, q), q), q);
    },
    async get<M extends RecordModule>(
      module: M,
      key: CompositeKey,
    ): Promise<RecordDetail<M> | null> {
      await ready(module);
      const branchId = key.split(':')[0];
      if (!canBranch(user, branchId))
        throw new RepositoryError(
          403,
          'This record belongs to a branch outside your assigned scope.',
        );
      const record = seed[module].find((r) => r.key === key);
      if (!record) return null;
      if (!visible(record, module))
        throw new RepositoryError(
          403,
          'This synthetic record has an additional visibility restriction.',
        );
      const related: RelatedRecord[] = [];
      const patientKey = module === 'patients' ? key : record.patientKey;
      for (const m of Object.keys(seed) as RecordModule[]) {
        if (!can(user, m)) continue;
        for (const r of seed[m]) {
          if (r.branchId !== branchId || !visible(r, m) || (m === module && r.key === key))
            continue;
          const linked =
            module === 'patients'
              ? r.patientKey === key
              : module === 'staff'
                ? 'staffKey' in r && r.staffKey === key
                : (m === 'patients' && r.key === patientKey) ||
                  ('visitKey' in record && m === 'visits' && r.key === record.visitKey) ||
                  (module === 'visits' && 'visitKey' in r && r.visitKey === key) ||
                  ('staffKey' in record && m === 'staff' && r.key === record.staffKey);
          if (linked)
            related.push({ module: m, key: r.key, name: r.name, date: r.date, status: r.status });
        }
      }
      return clone({ record, branch: branches.find((b) => b.id === branchId)!, related });
    },
    async getReports(q = {}) {
      await ready('reports');
      return clone(report(q));
    },
    async getOverview(q = {}) {
      await ready('overview');
      return clone(report(q));
    },
    async getSyncHealth(q = {}) {
      await ready('sync-health');
      const rows = scope(q).map((b) => ({
        ...b,
        recordsProcessed: (Object.keys(seed) as RecordModule[]).reduce(
          (s, m) => s + records(m, { branchIds: [b.id] }).length,
          0,
        ),
      }));
      return paginate(filterSort(rows, q), q);
    },
    async getAudit(q = {}) {
      await ready('audit');
      const ids = scope(q).map((b) => b.id);
      return paginate(
        filterSort(
          audit.filter((e) => ids.includes(e.branchId)),
          q,
        ),
        q,
      );
    },
    async getAccess() {
      await ready('access');
      return clone(personas);
    },
  };
}
