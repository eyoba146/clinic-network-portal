import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { usePortal } from '../app/providers';
import { allModules } from '../domain/permissions';
import { moduleLabel } from '../app/navigation';
import { useQueryState } from '../lib/query-state';
import { date, lag, number } from '../lib/formatting';
import {
  DataTable,
  Empty,
  Filters,
  Loading,
  PageHeader,
  Pagination,
  QueryFeedback,
  ScopeNote,
  Status,
} from '../components/ui';
export function SyncPage() {
  const { repository, user, branchId, scopedUrl } = usePortal();
  const { options, update } = useQueryState();
  const query = useQuery({
    queryKey: ['sync', user?.id, branchId, options, repository?.cacheKey],
    queryFn: () =>
      repository!.getSyncHealth({
        ...options,
        branchIds: branchId === 'all' ? undefined : [branchId],
      }),
  });
  return (
    <>
      <PageHeader
        eyebrow="GOVERNANCE / SIMULATED CONNECTOR MONITORING"
        title="Synchronization health"
        description="Distinguish connector availability from the freshness and completeness of synchronized records."
      />
      <ScopeNote />
      <section className="panel">
        <Filters
          options={options}
          update={update}
          statuses={['current', 'delayed', 'stale', 'offline', 'unknown']}
        />
        {query.isPending ? (
          <Loading />
        ) : query.isError ? (
          <QueryFeedback error={query.error} retry={() => query.refetch()} />
        ) : !query.data.total ? (
          <Empty reset={() => update({ q: '', status: '' })} />
        ) : (
          <>
            <DataTable
              rows={query.data.items}
              rowKey={(r) => r.id}
              sort={options}
              onSort={(sort) =>
                update({
                  sort,
                  direction:
                    options.sortBy === sort && options.sortDirection === 'asc' ? 'desc' : 'asc',
                })
              }
              columns={[
                {
                  key: 'name',
                  label: 'Branch / connector',
                  render: (r) => (
                    <Link className="record-link" to={scopedUrl(`/app/branches/${r.id}`, r.id)}>
                      {r.name}
                      <small>
                        {r.id} · {r.version}
                      </small>
                    </Link>
                  ),
                },
                {
                  key: 'connection',
                  label: 'Connection',
                  render: (r) => <Status value={r.connection} />,
                },
                {
                  key: 'status',
                  label: 'Data freshness',
                  render: (r) => <Status value={r.status} />,
                },
                {
                  key: 'lastSync',
                  label: 'Last success / lag',
                  render: (r) => (
                    <span className="small-text">
                      {date(r.lastSync, true)}
                      <small className="block muted">Lag: {lag(r.lagMinutes)}</small>
                    </span>
                  ),
                },
                {
                  key: 'recordsProcessed',
                  label: 'Records in snapshot',
                  render: (r) => number(r.recordsProcessed),
                },
                {
                  key: 'syncState',
                  label: 'Sync result / error',
                  render: (r) => (
                    <>
                      <Status value={r.syncState} />
                      <small className="block error-detail">
                        {r.lastError ?? 'No recorded error'}
                      </small>
                    </>
                  ),
                },
              ]}
            />
            <Pagination {...query.data} onPage={(p) => update({ page: String(p) })} />
          </>
        )}
      </section>
      <p className="subtle-note">
        Connector versions, states, and errors are fictional. Counts represent seed records in the
        cached snapshot, not a live ingestion batch.
      </p>
    </>
  );
}
export function AccessPage() {
  const { repository, user } = usePortal();
  const query = useQuery({
    queryKey: ['access', user?.id, repository?.cacheKey],
    queryFn: () => repository!.getAccess(),
  });
  return (
    <>
      <PageHeader
        eyebrow="GOVERNANCE / READ-ONLY POLICY PREVIEW"
        title="Access & permissions"
        description="Illustrative permissions are the intersection of role, module, assigned branch, and record policy."
      />
      <div className="notice">
        Production authorization must be enforced by the backend. This is a local frontend
        demonstration; clinical fields are denied to executive and finance roles.
      </div>
      {query.isPending ? (
        <Loading />
      ) : query.isError ? (
        <QueryFeedback error={query.error} retry={() => query.refetch()} />
      ) : (
        <>
          <div className="permission-grid">
            {query.data.map((p) => (
              <section className="panel" key={p.id}>
                <div className="panel-header">
                  <h2>{p.role}</h2>
                </div>
                <div className="panel-content">
                  <p className="eyebrow">BRANCH SCOPE</p>
                  <p>
                    {p.branchIds === 'all'
                      ? 'All 54 branches'
                      : p.branchIds.length === 1
                        ? p.branchIds[0]
                        : `${p.branchIds[0]} through ${p.branchIds.at(-1)}`}
                  </p>
                  <p className="eyebrow mt-4">PERMITTED MODULES</p>
                  <p>{p.modules.map(moduleLabel).join(' · ')}</p>
                  <p className="small-note">
                    Restricted synthetic records:{' '}
                    {p.allowRestricted ? 'allowed for HQ demo' : 'denied'}
                  </p>
                </div>
              </section>
            ))}
          </div>
          <section className="panel mt-6">
            <div className="panel-header">
              <h2>Permission matrix</h2>
              <span>Read access only</span>
            </div>
            <div className="matrix-wrap">
              <table className="matrix">
                <thead>
                  <tr>
                    <th>Module</th>
                    {query.data.map((p) => (
                      <th key={p.id}>{p.role}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {allModules.map((m) => (
                    <tr key={m}>
                      <th>{moduleLabel(m)}</th>
                      {query.data.map((p) => (
                        <td key={p.id}>{p.modules.includes(m) ? 'Allowed' : 'Denied'}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </>
  );
}
export function AuditPage() {
  const { repository, user, branchId } = usePortal();
  const { options, update } = useQueryState();
  const query = useQuery({
    queryKey: ['audit', user?.id, branchId, options, repository?.cacheKey],
    queryFn: () =>
      repository!.getAudit({
        ...options,
        sortBy: options.sortBy === 'name' ? 'date' : options.sortBy,
        branchIds: branchId === 'all' ? undefined : [branchId],
      }),
  });
  return (
    <>
      <PageHeader
        eyebrow="GOVERNANCE / FICTIONAL AUDIT SAMPLE"
        title="Audit activity"
        description="Seeded examples of access decisions and report exports. This preview is not a persistent security audit trail."
      />
      <section className="panel">
        <Filters options={options} update={update} statuses={['Allowed', 'Denied']} dates />
        {query.isPending ? (
          <Loading />
        ) : query.isError ? (
          <QueryFeedback error={query.error} retry={() => query.refetch()} />
        ) : !query.data.total ? (
          <Empty reset={() => update({ q: '', status: '', from: '', to: '' })} />
        ) : (
          <>
            <DataTable
              rows={query.data.items}
              rowKey={(r) => r.id}
              sort={options}
              onSort={(sort) =>
                update({ sort, direction: options.sortDirection === 'asc' ? 'desc' : 'asc' })
              }
              columns={[
                { key: 'date', label: 'Timestamp', render: (r) => date(r.date, true) },
                { key: 'actor', label: 'Demo actor', render: (r) => r.actor },
                {
                  key: 'action',
                  label: 'Activity',
                  render: (r) => (
                    <>
                      {r.action}
                      <small className="block mono">{r.id}</small>
                    </>
                  ),
                },
                { key: 'branchId', label: 'Branch', render: (r) => r.branchId },
                { key: 'category', label: 'Category', render: (r) => r.category },
                { key: 'outcome', label: 'Decision', render: (r) => <Status value={r.outcome} /> },
              ]}
            />
            <Pagination {...query.data} onPage={(p) => update({ page: String(p) })} />
          </>
        )}
      </section>
    </>
  );
}
