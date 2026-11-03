import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowUpRight, ArrowRight, Buildings, LockSimple } from '@phosphor-icons/react';
import { usePortal } from '../app/providers';
import { can } from '../domain/permissions';
import { number, money, date } from '../lib/formatting';
import { DataTable, Loading, PageHeader, QueryFeedback, ScopeNote, Status } from '../components/ui';
export function OverviewPage() {
  const { user, repository, branchId, scopes, scopedUrl } = usePortal();
  const query = useQuery({
    queryKey: ['overview', user?.id, branchId, repository?.cacheKey],
    queryFn: () =>
      repository!.getOverview({ branchIds: branchId === 'all' ? undefined : [branchId] }),
  });
  const selected = scopes.filter((b) => branchId === 'all' || b.id === branchId);
  const totals = query.data?.rows.reduce(
    (s, r) => ({
      patients: s.patients + (r.patients ?? 0),
      visits: s.visits + (r.visits ?? 0),
      collected: s.collected + (r.collected ?? 0),
      appointments: s.appointments + (r.appointments ?? 0),
    }),
    { patients: 0, visits: 0, collected: 0, appointments: 0 },
  );
  return (
    <>
      <PageHeader
        eyebrow="NETWORK INTELLIGENCE / DEMO SNAPSHOT"
        title={
          branchId === 'all'
            ? 'A clear view across your network.'
            : (selected[0]?.name ?? 'Branch overview')
        }
        description="Explore synchronized records, understand coverage, and follow the detail."
        action={
          <Link className="button secondary" to={scopedUrl('/app/branches')}>
            Explore branches <ArrowUpRight size={17} />
          </Link>
        }
      />
      <ScopeNote />
      {query.isPending ? (
        <Loading />
      ) : query.isError ? (
        <QueryFeedback error={query.error} retry={() => query.refetch()} />
      ) : (
        <>
          <div className="overview-intro">
            <div className="overview-stat">
              <span className="eyebrow">AUTHORIZED NETWORK</span>
              <strong>
                {number(query.data.coverage.total)}
                <small> branches</small>
              </strong>
              <p>
                {query.data.coverage.current} current · {query.data.coverage.incomplete} need
                attention
              </p>
            </div>
            <div className="overview-stat">
              <span className="eyebrow">
                {can(user!, 'patients') ? 'PATIENT RECORDS' : 'APPOINTMENTS'}
              </span>
              <strong>
                {number(can(user!, 'patients') ? totals!.patients : totals!.appointments)}
              </strong>
              <p>Within your authorized record scope</p>
            </div>
            <div className="overview-stat">
              <span className="eyebrow">
                {can(user!, 'billing') ? 'PAYMENTS RECORDED' : 'COMPLETED ENCOUNTERS'}
              </span>
              <strong className="amount">
                {can(user!, 'billing') ? number(totals!.collected) : number(totals!.visits)}
                {can(user!, 'billing') && <small> ETB</small>}
              </strong>
              <p>
                {can(user!, 'billing')
                  ? 'Payments attached to synchronized invoices'
                  : 'Source-recorded visits in the demo dataset'}
              </p>
            </div>
          </div>
          <div className="overview-grid">
            <section className="panel">
              <div className="panel-header">
                <div>
                  <p className="eyebrow">WHERE TO LOOK NEXT</p>
                  <h2>Branches requiring attention</h2>
                </div>
                <span className="count-label">{query.data.coverage.incomplete} branches</span>
              </div>
              {selected.filter((b) => b.status !== 'current').length ? (
                <DataTable
                  rows={selected.filter((b) => b.status !== 'current').slice(0, 6)}
                  rowKey={(r) => r.id}
                  columns={[
                    {
                      key: 'name',
                      label: 'Branch',
                      render: (b) => (
                        <Link className="record-link" to={scopedUrl(`/app/branches/${b.id}`, b.id)}>
                          {b.name}
                          <small>
                            {b.id} · {b.region}
                          </small>
                        </Link>
                      ),
                    },
                    {
                      key: 'status',
                      label: 'Freshness',
                      render: (b) => <Status value={b.status} />,
                    },
                    {
                      key: 'syncState',
                      label: 'Sync result',
                      render: (b) => <Status value={b.syncState} />,
                    },
                  ]}
                />
              ) : (
                <div className="panel-content">
                  All branches in this scope are current within the fixed demo snapshot.
                </div>
              )}
              <Link
                className="panel-bottom-link"
                to={scopedUrl(can(user!, 'sync-health') ? '/app/sync-health' : '/app/branches')}
              >
                Inspect synchronization coverage <ArrowRight size={16} />
              </Link>
            </section>
            <section className="coverage-panel">
              <p className="eyebrow">DATA AVAILABILITY</p>
              <h2>Coverage before conclusions.</h2>
              <p>
                Branch connectivity and record freshness are separate signals. Offline branches
                remain available as cached records.
              </p>
              <div className="coverage-number">
                {Math.round(
                  (query.data.coverage.current / Math.max(1, query.data.coverage.total)) * 100,
                )}
                <span>%</span>
                <small>branches current in demo snapshot</small>
              </div>
              <div className="coverage-track" aria-hidden="true">
                <i
                  style={{
                    width: `${(query.data.coverage.current / Math.max(1, query.data.coverage.total)) * 100}%`,
                  }}
                />
              </div>
              <div className="coverage-legend">
                <span>
                  <i />
                  {query.data.coverage.current} current
                </span>
                <span>{query.data.coverage.incomplete} incomplete / delayed</span>
              </div>
              <p className="small-note">
                Snapshot: {date(query.data.asOf, true)}. No live connections.
              </p>
            </section>
          </div>
          <section className="panel mt-6">
            <div className="panel-header">
              <div>
                <p className="eyebrow">SOURCE-TRACEABLE TOTALS</p>
                <h2>Branch comparison</h2>
              </div>
              {can(user!, 'reports') && (
                <Link className="text-link" to={scopedUrl('/app/reports')}>
                  Full report <ArrowUpRight size={16} />
                </Link>
              )}
            </div>
            <DataTable
              rows={query.data.rows.slice(0, 5)}
              rowKey={(r) => r.branchId}
              columns={[
                {
                  key: 'branchName',
                  label: 'Branch',
                  render: (r) => (
                    <Link
                      className="record-link"
                      to={scopedUrl(`/app/branches/${r.branchId}`, r.branchId)}
                    >
                      {r.branchName}
                      <small>{r.branchId}</small>
                    </Link>
                  ),
                },
                ...(can(user!, 'patients')
                  ? [
                      {
                        key: 'patients',
                        label: 'Patients',
                        render: (r: (typeof query.data.rows)[number]) => number(r.patients ?? 0),
                      },
                    ]
                  : []),
                ...(can(user!, 'visits')
                  ? [
                      {
                        key: 'visits',
                        label: 'Visits',
                        render: (r: (typeof query.data.rows)[number]) => number(r.visits ?? 0),
                      },
                    ]
                  : []),
                ...(can(user!, 'billing')
                  ? [
                      {
                        key: 'invoiced',
                        label: 'Invoiced',
                        render: (r: (typeof query.data.rows)[number]) => money(r.invoiced ?? 0),
                      },
                    ]
                  : []),
                { key: 'status', label: 'Freshness', render: (r) => <Status value={r.status} /> },
              ]}
            />
          </section>
          <div className="journey-links">
            {can(user!, 'patients') && (
              <Link to={scopedUrl('/app/patients')}>
                <Buildings size={21} />
                <div>
                  <strong>Follow a patient journey</strong>
                  <span>Patient profile, encounters, and related records</span>
                </div>
                <ArrowUpRight size={20} />
              </Link>
            )}
            <div>
              <LockSimple size={21} />
              <div>
                <strong>Read-only by design</strong>
                <span>All source record changes remain in the branch application.</span>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
