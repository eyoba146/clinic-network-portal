import { Link, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { usePortal } from '../app/providers';
import { moduleLabel } from '../app/navigation';
import type { EntityMap, RecordModule } from '../domain/types';
import { useQueryState } from '../lib/query-state';
import { date, money } from '../lib/formatting';
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
  type Column,
} from '../components/ui';
export const statuses: Record<RecordModule, string[]> = {
  patients: ['Active', 'Partial record'],
  visits: ['Completed'],
  appointments: ['Scheduled', 'Completed', 'Canceled', 'Did not attend'],
  laboratory: ['Final', 'Pending'],
  pharmacy: ['Dispensed'],
  billing: ['Paid', 'Part-paid', 'Unpaid'],
  staff: ['Active'],
};
const descriptions: Record<RecordModule, string> = {
  patients: 'Branch-qualified patient identities. No cross-branch matching or merging is implied.',
  visits: 'Source-recorded encounters with practitioner context and related clinical records.',
  appointments:
    'A read-only schedule of recorded appointments, including cancellations and missed visits.',
  laboratory:
    'Source-linked requests and results. Reference information is illustrative and not clinical guidance.',
  pharmacy:
    'Recorded dispensing activity. This portal cannot prescribe, approve, or dispense medication.',
  billing: 'Traceable invoices, line items, and recorded payments. No payment processing.',
  staff: 'Fictional staff directory and source branch assignments.',
};
export function RecordsPage({ module }: { module: RecordModule }) {
  const { repository, user, branchId, scopedUrl } = usePortal();
  const location = useLocation();
  const { options, update } = useQueryState();
  const query = useQuery({
    queryKey: ['records', module, user?.id, branchId, options, repository?.cacheKey],
    queryFn: () =>
      repository!.list(module, {
        ...options,
        branchIds: branchId === 'all' ? undefined : [branchId],
      }),
  });
  const columns: Column<EntityMap[RecordModule]>[] = [
    {
      key: 'name',
      label: module === 'patients' ? 'Patient' : module === 'staff' ? 'Staff member' : 'Record',
      render: (r) => (
        <Link
          className="record-link"
          state={{ returnTo: location.pathname + location.search }}
          to={scopedUrl(`/app/${module}/${encodeURIComponent(r.key)}`, r.branchId)}
        >
          {r.name}
          <small>
            {r.sourceId}
            {module === 'patients' && 'sex' in r ? ` · ${r.sex}` : ''}
          </small>
        </Link>
      ),
    },
    {
      key: 'branchId',
      label: 'Source branch',
      render: (r) => <span className="mono">{r.branchId}</span>,
    },
  ];
  if (module === 'patients')
    columns.push({
      key: 'birthDate',
      label: 'Date of birth',
      render: (r) => ('birthDate' in r ? date(r.birthDate) : ''),
    });
  else if (module === 'staff')
    columns.push({
      key: 'title',
      label: 'Role / department',
      render: (r) =>
        'title' in r ? (
          <>
            {r.title}
            <small className="block muted">{r.department}</small>
          </>
        ) : (
          ''
        ),
    });
  else
    columns.push({
      key: 'date',
      label: module === 'appointments' ? 'Appointment date' : 'Record date',
      render: (r) => date(r.date, module === 'visits'),
    });
  if (module === 'billing')
    columns.push(
      { key: 'total', label: 'Invoice total', render: (r) => ('total' in r ? money(r.total) : '') },
      { key: 'balance', label: 'Balance', render: (r) => ('balance' in r ? money(r.balance) : '') },
    );
  if (module === 'pharmacy')
    columns.push({
      key: 'medication',
      label: 'Medication',
      render: (r) => ('medication' in r ? `${r.medication.name} · ${r.medication.strength}` : ''),
    });
  columns.push(
    { key: 'status', label: 'Status', render: (r) => <Status value={r.status} /> },
    {
      key: 'syncedAt',
      label: 'Last sync',
      render: (r) => <span className="small-text">{date(r.syncedAt, true)}</span>,
    },
  );
  return (
    <>
      <PageHeader
        eyebrow={`RECORD EXPLORER / ${branchId === 'all' ? 'AUTHORIZED BRANCHES' : branchId}`}
        title={moduleLabel(module)}
        description={descriptions[module]}
      />
      <ScopeNote />
      <section className="panel">
        <Filters
          options={options}
          update={update}
          statuses={statuses[module]}
          dates={module !== 'staff' && module !== 'patients'}
        />
        {options.from && options.to && options.from > options.to ? (
          <p className="notice" role="alert">
            The start date must be on or before the end date.
          </p>
        ) : query.isPending ? (
          <Loading />
        ) : query.isError ? (
          <QueryFeedback error={query.error} retry={() => query.refetch()} />
        ) : !query.data.total ? (
          <Empty reset={() => update({ q: '', status: '', from: '', to: '' })} />
        ) : (
          <>
            <DataTable
              rows={query.data.items}
              columns={columns}
              rowKey={(r) => r.key}
              sort={options}
              onSort={(sort) =>
                update({
                  sort,
                  direction:
                    options.sortBy === sort && options.sortDirection === 'asc' ? 'desc' : 'asc',
                })
              }
            />
            <Pagination {...query.data} onPage={(page) => update({ page: String(page) })} />
          </>
        )}
      </section>
    </>
  );
}
