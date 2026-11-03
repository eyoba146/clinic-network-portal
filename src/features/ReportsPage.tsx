import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { DownloadSimple } from '@phosphor-icons/react';
import { usePortal } from '../app/providers';
import { can } from '../domain/permissions';
import type { ReportRow } from '../domain/types';
import { useQueryState } from '../lib/query-state';
import { csv, downloadCsv, money, number, date } from '../lib/formatting';
import {
  DataTable,
  Empty,
  Loading,
  PageHeader,
  Pagination,
  QueryFeedback,
  ScopeNote,
  Status,
  type Column,
} from '../components/ui';
export function ReportsPage() {
  const { repository, user, branchId, scopedUrl } = usePortal();
  const { options, update } = useQueryState();
  const [exported, setExported] = useState(false);
  const query = useQuery({
    queryKey: ['report', user?.id, branchId, options.from, options.to, repository?.cacheKey],
    queryFn: () =>
      repository!.getReports({
        branchIds: branchId === 'all' ? undefined : [branchId],
        from: options.from,
        to: options.to,
      }),
  });
  const clinical = can(user!, 'patients');
  const finance = can(user!, 'billing');
  const columns: Column<ReportRow>[] = [
    {
      key: 'branchName',
      label: 'Branch',
      render: (r) =>
        can(user!, 'branches') ? (
          <Link className="record-link" to={scopedUrl(`/app/branches/${r.branchId}`, r.branchId)}>
            {r.branchName}
            <small>{r.branchId}</small>
          </Link>
        ) : (
          <span>
            {r.branchName}
            <small className="block mono">{r.branchId}</small>
          </span>
        ),
    },
    ...(clinical
      ? [
          { key: 'patients', label: 'Patients', render: (r: ReportRow) => number(r.patients ?? 0) },
          { key: 'visits', label: 'Visits', render: (r: ReportRow) => number(r.visits ?? 0) },
        ]
      : []),
    ...(finance
      ? [
          {
            key: 'invoices',
            label: 'Invoices',
            render: (r: ReportRow) => (
              <Link to={scopedUrl('/app/billing', r.branchId)}>{r.invoices}</Link>
            ),
          },
          { key: 'invoiced', label: 'Invoiced', render: (r: ReportRow) => money(r.invoiced ?? 0) },
          {
            key: 'collected',
            label: 'Recorded payments',
            render: (r: ReportRow) => money(r.collected ?? 0),
          },
          {
            key: 'outstanding',
            label: 'Outstanding',
            render: (r: ReportRow) => money(r.outstanding ?? 0),
          },
        ]
      : []),
    { key: 'status', label: 'Freshness', render: (r) => <Status value={r.status} /> },
  ];
  const rows = [...(query.data?.rows ?? [])].sort((a, b) => {
    const field = (options.sortBy ?? 'branchName') as keyof ReportRow;
    const av = a[field] ?? '';
    const bv = b[field] ?? '';
    return (
      (options.sortDirection === 'desc' ? -1 : 1) *
      (typeof av === 'number' && typeof bv === 'number'
        ? av - bv
        : String(av).localeCompare(String(bv)))
    );
  });
  const page = Math.min(options.page ?? 1, Math.max(1, Math.ceil(rows.length / 12)));
  const invalid = !!options.from && !!options.to && options.from > options.to;
  const exportReport = () => {
    if (!query.data) return;
    const header = [
      'DEMO DATA',
      'Branch ID',
      'Branch name',
      ...(clinical ? ['Patients', 'Visits'] : []),
      ...(finance ? ['Invoices', 'Invoiced ETB', 'Recorded payments ETB', 'Outstanding ETB'] : []),
      'Freshness',
      'Last successful sync',
      'Snapshot',
      'From',
      'To',
      'Coverage warning',
    ];
    const data = rows.map((r) => [
      'Fictional',
      r.branchId,
      r.branchName,
      ...(clinical ? [r.patients, r.visits] : []),
      ...(finance ? [r.invoices, r.invoiced, r.collected, r.outstanding] : []),
      r.status,
      r.lastSync,
      query.data.asOf,
      query.data.from,
      query.data.to,
      'Cached demo data; incomplete branches may omit source records',
    ]);
    downloadCsv(csv([header, ...data]), `demo-clinic-report-${branchId}.csv`);
    setExported(true);
  };
  return (
    <>
      <PageHeader
        eyebrow="OPERATIONS / REPRODUCIBLE REPORTS"
        title="Network activity report"
        description="Branch-aware totals calculated from the same records available in your workspace."
        action={
          <button
            className="button"
            onClick={exportReport}
            disabled={!query.data || query.isError || invalid}
          >
            <DownloadSimple size={17} />
            Export demo CSV
          </button>
        }
      />
      <ScopeNote />
      <section className="report-definition">
        <div>
          <h2>Report scope</h2>
          <p>
            Dates filter source registrations, encounters, and invoice issue dates. Payments are the
            recorded totals attached to the selected invoices, not a cash-flow report.
          </p>
        </div>
        <div className="report-dates">
          <label>
            From
            <input
              type="date"
              aria-label="Report from date"
              value={options.from}
              onChange={(e) => {
                update({ from: e.target.value });
                setExported(false);
              }}
            />
          </label>
          <label>
            To
            <input
              type="date"
              aria-label="Report to date"
              value={options.to}
              onChange={(e) => {
                update({ to: e.target.value });
                setExported(false);
              }}
            />
          </label>
          <button className="text-button" onClick={() => update({ from: '', to: '' })}>
            All dates
          </button>
        </div>
      </section>
      {exported && (
        <p role="status" className="success-note">
          Authorized fictional report exported. Scope, dates, snapshot, and freshness are included
          in the CSV.
        </p>
      )}
      {invalid ? (
        <p className="notice" role="alert">
          The start date must be on or before the end date.
        </p>
      ) : query.isPending ? (
        <Loading />
      ) : query.isError ? (
        <QueryFeedback error={query.error} retry={() => query.refetch()} />
      ) : (
        <>
          <div className="report-summary">
            <span>
              <strong>{rows.length}</strong> authorized branches
            </span>
            {clinical && (
              <span>
                <strong>{number(rows.reduce((s, r) => s + (r.visits ?? 0), 0))}</strong> encounters
              </span>
            )}
            {finance && (
              <>
                <span>
                  <strong>{money(rows.reduce((s, r) => s + (r.invoiced ?? 0), 0))}</strong> invoiced
                </span>
                <span>
                  <strong>{money(rows.reduce((s, r) => s + (r.outstanding ?? 0), 0))}</strong>{' '}
                  outstanding
                </span>
              </>
            )}
          </div>
          <section className="panel">
            {rows.length ? (
              <>
                <DataTable
                  rows={rows.slice((page - 1) * 12, page * 12)}
                  rowKey={(r) => r.branchId}
                  columns={columns}
                  sort={options}
                  onSort={(sort) =>
                    update({
                      sort,
                      direction:
                        options.sortBy === sort && options.sortDirection === 'asc' ? 'desc' : 'asc',
                    })
                  }
                />
                <Pagination
                  page={page}
                  pageSize={12}
                  total={rows.length}
                  onPage={(p) => update({ page: String(p) })}
                />
              </>
            ) : (
              <Empty />
            )}
          </section>
          <p className="subtle-note">
            Snapshot {date(query.data.asOf, true)} · {query.data.coverage.incomplete} branches with
            incomplete or delayed coverage · Currency: ETB. Hidden clinical fields are excluded from
            this role's exports.
          </p>
        </>
      )}
    </>
  );
}
