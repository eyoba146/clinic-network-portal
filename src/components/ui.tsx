import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  MagnifyingGlass,
  WarningCircle,
  LockSimple,
  FolderOpen,
  ArrowsClockwise,
} from '@phosphor-icons/react';
import { RepositoryError } from '../domain/repositories';
import { usePortal } from '../app/providers';
import type { QueryOptions } from '../domain/types';
export function Status({ value }: { value: string }) {
  const tone =
    /current|complete|paid$|active|final|allowed|connected|dispensed/i.test(value) &&
    !/^unpaid|part-paid|partial/i.test(value)
      ? 'good'
      : /offline|failed|denied|canceled|stale/i.test(value)
        ? 'bad'
        : /unknown|pending|partial|delayed|unpaid|part-paid|scheduled/i.test(value)
          ? 'warn'
          : 'neutral';
  return (
    <span className={`status ${tone}`}>
      <i />
      {value}
    </span>
  );
}
export function PageHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="page-header">
      <div>
        <p className="eyebrow">{eyebrow ?? 'READ-ONLY WORKSPACE'}</p>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {action && <div className="page-actions">{action}</div>}
    </div>
  );
}
export function Feedback({
  kind = 'empty',
  title,
  message,
  action,
}: {
  kind?: 'empty' | 'error' | 'denied';
  title: string;
  message: string;
  action?: ReactNode;
}) {
  const Icon = kind === 'denied' ? LockSimple : kind === 'error' ? WarningCircle : FolderOpen;
  return (
    <section className="feedback" role={kind === 'error' ? 'alert' : 'status'}>
      <Icon size={34} />
      <h2>{title}</h2>
      <p>{message}</p>
      {action}
    </section>
  );
}
export function QueryFeedback({ error, retry }: { error: Error | null; retry: () => void }) {
  const status = error instanceof RepositoryError ? error.status : 503;
  return (
    <Feedback
      kind={status === 403 ? 'denied' : 'error'}
      title={
        status === 401
          ? 'Demo session expired'
          : status === 403
            ? 'Access denied'
            : 'Data could not be loaded'
      }
      message={error?.message ?? 'Please retry this read request.'}
      action={
        status === 401 ? (
          <Link className="button" to="/login">
            Choose a demo role
          </Link>
        ) : status !== 403 ? (
          <button className="button secondary" onClick={retry}>
            <ArrowsClockwise size={17} />
            Retry request
          </button>
        ) : (
          <Link className="button secondary" to="/login">
            Switch demo role
          </Link>
        )
      }
    />
  );
}
export function Loading() {
  return (
    <div className="loading" role="status" aria-label="Loading records">
      <p>Loading authorized demo records…</p>
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="skeleton" />
      ))}
    </div>
  );
}
export function Empty({ reset }: { reset?: () => void }) {
  return (
    <Feedback
      title="No records in this view"
      message="There may be no synchronized records for this branch, or your filters exclude the available records."
      action={
        reset && (
          <button className="button secondary" onClick={reset}>
            Clear filters
          </button>
        )
      }
    />
  );
}
export interface Column<T> {
  key: string;
  label: string;
  render: (row: T) => ReactNode;
  className?: string;
}
export function DataTable<T>({
  rows,
  columns,
  rowKey,
  sort,
  onSort,
}: {
  rows: T[];
  columns: Column<T>[];
  rowKey: (r: T) => string;
  sort?: QueryOptions;
  onSort?: (key: string) => void;
}) {
  return (
    <>
      <div className="mobile-sort">
        {onSort && (
          <>
            <label>
              Sort records
              <select
                aria-label="Sort records"
                value={sort?.sortBy ?? columns[0].key}
                onChange={(e) => onSort(e.target.value)}
              >
                {columns.map((c) => (
                  <option key={c.key} value={c.key}>
                    {c.label}
                  </option>
                ))}
              </select>
            </label>
            <button
              className="button secondary"
              onClick={() => onSort(sort?.sortBy ?? columns[0].key)}
            >
              {sort?.sortDirection === 'desc' ? 'Descending' : 'Ascending'}
            </button>
          </>
        )}
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              {columns.map((c) => (
                <th
                  key={c.key}
                  scope="col"
                  aria-sort={
                    sort?.sortBy === c.key
                      ? sort.sortDirection === 'desc'
                        ? 'descending'
                        : 'ascending'
                      : undefined
                  }
                >
                  {onSort ? (
                    <button onClick={() => onSort(c.key)}>
                      {c.label}
                      {sort?.sortBy === c.key ? (
                        <span aria-hidden="true"> {sort.sortDirection === 'desc' ? '↓' : '↑'}</span>
                      ) : null}
                    </button>
                  ) : (
                    c.label
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={rowKey(row)}>
                {columns.map((c) => (
                  <td key={c.key} data-label={c.label} className={c.className}>
                    {c.render(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
export function Pagination({
  page,
  pageSize,
  total,
  onPage,
}: {
  page: number;
  pageSize: number;
  total: number;
  onPage: (p: number) => void;
}) {
  return (
    <div className="pagination">
      <span>
        {total
          ? `${(page - 1) * pageSize + 1}–${Math.min(page * pageSize, total)} of ${total} records`
          : '0 records'}
      </span>
      <div>
        <button
          className="icon-button"
          aria-label="Previous page"
          disabled={page <= 1}
          onClick={() => onPage(page - 1)}
        >
          <ArrowLeft size={17} />
        </button>
        <span>
          Page {page} / {Math.max(1, Math.ceil(total / pageSize))}
        </span>
        <button
          className="icon-button"
          aria-label="Next page"
          disabled={page * pageSize >= total}
          onClick={() => onPage(page + 1)}
        >
          <ArrowRight size={17} />
        </button>
      </div>
    </div>
  );
}
export function Filters({
  options,
  update,
  statuses = [],
  regions,
  dates = false,
}: {
  options: QueryOptions;
  update: (q: Record<string, string>) => void;
  statuses?: string[];
  regions?: string[];
  dates?: boolean;
}) {
  return (
    <div className="filters">
      <label className="search-field">
        <MagnifyingGlass size={18} />
        <span className="sr-only">Search records</span>
        <input
          type="search"
          placeholder="Search names or source IDs…"
          value={options.search}
          onChange={(e) => update({ q: e.target.value })}
        />
      </label>
      {statuses.length > 0 && (
        <label>
          <span className="sr-only">Status filter</span>
          <select
            aria-label="Status filter"
            value={options.status}
            onChange={(e) => update({ status: e.target.value })}
          >
            <option value="">All statuses</option>
            {statuses.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </label>
      )}
      {regions && (
        <label>
          <span className="sr-only">Region filter</span>
          <select
            aria-label="Region filter"
            value={options.region}
            onChange={(e) => update({ region: e.target.value })}
          >
            <option value="">All regions</option>
            {regions.map((r) => (
              <option key={r}>{r}</option>
            ))}
          </select>
        </label>
      )}
      {dates && (
        <>
          <label className="date-filter">
            From
            <input
              aria-label="From date"
              type="date"
              value={options.from}
              onChange={(e) => update({ from: e.target.value })}
            />
          </label>
          <label className="date-filter">
            To
            <input
              aria-label="To date"
              type="date"
              value={options.to}
              onChange={(e) => update({ to: e.target.value })}
            />
          </label>
        </>
      )}
      <button
        className="text-button"
        onClick={() =>
          update({ q: '', status: '', region: '', from: '', to: '', sort: '', direction: '' })
        }
      >
        Reset
      </button>
    </div>
  );
}
export function ScopeNote() {
  const { branchId, scopes } = usePortal();
  const selected = scopes.filter((b) => branchId === 'all' || b.id === branchId);
  const attention = selected.filter((b) => b.status !== 'current' || b.syncState !== 'Complete');
  return attention.length ? (
    <div className="notice">
      <WarningCircle size={19} />
      <span>
        <strong>Coverage is incomplete.</strong> {attention.length}{' '}
        {attention.length === 1 ? 'branch has' : 'branches have'} delayed, partial, unavailable, or
        offline synchronization. These are cached demo records.
      </span>
    </div>
  ) : (
    <div className="subtle-note">
      Cached demo records · Freshness is measured against the fixed demo snapshot.
    </div>
  );
}
export function Fields({ items }: { items: [string, ReactNode][] }) {
  return (
    <dl className="fields">
      {items.map(([label, value]) => (
        <div key={label}>
          <dt>{label}</dt>
          <dd>{value ?? 'Not recorded'}</dd>
        </div>
      ))}
    </dl>
  );
}
