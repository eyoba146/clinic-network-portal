import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowUpRight, ArrowLeft } from '@phosphor-icons/react';
import { usePortal } from '../app/providers';
import { navigation } from '../app/navigation';
import { can } from '../domain/permissions';
import { useQueryState } from '../lib/query-state';
import { date, lag } from '../lib/formatting';
import {
  DataTable,
  Empty,
  Feedback,
  Fields,
  Filters,
  Loading,
  PageHeader,
  Pagination,
  QueryFeedback,
  ScopeNote,
  Status,
} from '../components/ui';
export function BranchesPage() {
  const { repository, user, branchId, scopedUrl } = usePortal();
  const { options, update } = useQueryState();
  const query = useQuery({
    queryKey: ['branches', user?.id, branchId, options, repository?.cacheKey],
    queryFn: () =>
      repository!.listBranches({
        ...options,
        branchIds: branchId === 'all' ? undefined : [branchId],
      }),
  });
  return (
    <>
      <PageHeader
        eyebrow="WORKSPACE / BRANCH DIRECTORY"
        title="One network. Every branch."
        description="Browse authorized locations and inspect the provenance of their cached records."
      />
      <ScopeNote />
      <section className="panel">
        <Filters
          options={options}
          update={update}
          statuses={['current', 'delayed', 'stale', 'offline', 'unknown']}
          regions={['Addis Ababa', 'Oromia', 'Amhara', 'Sidama', 'Southern Region', 'Dire Dawa']}
        />
        {query.isPending ? (
          <Loading />
        ) : query.isError ? (
          <QueryFeedback error={query.error} retry={() => query.refetch()} />
        ) : !query.data.total ? (
          <Empty reset={() => update({ q: '', status: '', region: '' })} />
        ) : (
          <>
            <DataTable
              rows={query.data.items}
              rowKey={(b) => b.id}
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
                  label: 'Branch',
                  render: (b) => (
                    <Link className="record-link" to={scopedUrl(`/app/branches/${b.id}`, b.id)}>
                      {b.name}
                      <small>{b.id}</small>
                    </Link>
                  ),
                },
                { key: 'region', label: 'Region', render: (b) => b.region },
                {
                  key: 'connection',
                  label: 'Connector',
                  render: (b) => <Status value={b.connection} />,
                },
                {
                  key: 'status',
                  label: 'Data freshness',
                  render: (b) => <Status value={b.status} />,
                },
                {
                  key: 'lastSync',
                  label: 'Last successful sync',
                  render: (b) => <span className="small-text">{date(b.lastSync, true)}</span>,
                },
              ]}
            />
            <Pagination {...query.data} onPage={(page) => update({ page: String(page) })} />
          </>
        )}
      </section>
    </>
  );
}
export function BranchDetailPage() {
  const { branchId: id = '' } = useParams();
  const { repository, user, scopedUrl, selectBranch } = usePortal();
  const query = useQuery({
    queryKey: ['branch', user?.id, id, repository?.cacheKey],
    queryFn: () => repository!.getBranch(id),
  });
  if (query.isPending) return <Loading />;
  if (query.isError) return <QueryFeedback error={query.error} retry={() => query.refetch()} />;
  const b = query.data;
  if (!b)
    return (
      <Feedback
        title="Branch not found"
        message="This branch identifier does not exist in the fictional network."
      />
    );
  return (
    <>
      <Link className="back-link" to={scopedUrl('/app/branches', 'all')}>
        <ArrowLeft size={16} />
        Branch directory
      </Link>
      <PageHeader
        eyebrow={`${b.id} / ${b.region}`}
        title={b.name}
        description="Branch profile and source-data coverage. All connection signals are simulated."
        action={
          <button className="button" onClick={() => selectBranch(b.id)}>
            Browse this branch <ArrowUpRight size={16} />
          </button>
        }
      />
      {(b.status !== 'current' || b.syncState !== 'Complete') && (
        <div className="notice">
          <strong>
            {b.status === 'offline' ? 'Connector offline.' : 'Incomplete or delayed coverage.'}
          </strong>{' '}
          Cached records remain available; they may not reflect later source changes.
        </div>
      )}
      <div className="detail-grid">
        <section className="panel">
          <div className="panel-header">
            <h2>Branch information</h2>
            <Status value={b.status} />
          </div>
          <Fields
            items={[
              ['Source branch', b.id],
              ['Region', b.region],
              ['Time zone', b.timezone],
              ['Scope', 'Fictional branch installation'],
              ['Last successful synchronization', date(b.lastSync, true)],
              ['Lag at demo snapshot', lag(b.lagMinutes)],
            ]}
          />
        </section>
        <section className="panel">
          <div className="panel-header">
            <h2>Connector snapshot</h2>
            <Status value={b.connection} />
          </div>
          <Fields
            items={[
              ['Connector version', b.version],
              ['Last sync result', <Status value={b.syncState} />],
              ['Last error', b.lastError ?? 'No simulated error'],
              ['Monitoring', 'Illustrative snapshot; no actual connector'],
            ]}
          />
        </section>
      </div>
      <section className="panel mt-6">
        <div className="panel-header">
          <h2>Explore branch records</h2>
          <span className="count-label">Read-only</span>
        </div>
        <div className="module-links">
          {navigation
            .filter(
              (n) =>
                [
                  'patients',
                  'visits',
                  'appointments',
                  'laboratory',
                  'pharmacy',
                  'billing',
                  'staff',
                  'reports',
                ].includes(n.id) && can(user!, n.id),
            )
            .map((n) => (
              <Link key={n.id} to={scopedUrl(n.path, b.id)}>
                <n.icon size={22} />
                <span>{n.label}</span>
                <ArrowUpRight size={17} />
              </Link>
            ))}
        </div>
      </section>
    </>
  );
}
