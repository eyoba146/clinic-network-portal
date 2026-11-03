import { Link, useLocation, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, ArrowUpRight } from '@phosphor-icons/react';
import { usePortal } from '../app/providers';
import { moduleLabel } from '../app/navigation';
import type { CompositeKey, EntityMap, RecordModule } from '../domain/types';
import { date, money } from '../lib/formatting';
import {
  DataTable,
  Feedback,
  Fields,
  Loading,
  PageHeader,
  QueryFeedback,
  Status,
} from '../components/ui';
function ClinicalFields({ record: r }: { record: EntityMap[RecordModule] }) {
  if ('birthDate' in r)
    return (
      <Fields
        items={[
          ['Date of birth', date(r.birthDate)],
          ['Sex (source)', r.sex],
          ['Phone', r.phone ?? 'Not recorded'],
          ['Locality', r.locality],
          ['Record completeness', r.status],
          [
            'Record visibility',
            r.restricted ? 'Additional restriction · HQ demo only' : 'Standard demo policy',
          ],
        ]}
      />
    );
  if ('reason' in r)
    return (
      <>
        <Fields
          items={[
            ['Encounter date', date(r.date, true)],
            ['Department', r.department],
            ['Reason recorded', r.reason],
            ['Practitioner source ID', r.staffKey],
          ]}
        />
        <div className="detail-note">
          <h3>Source note</h3>
          <p>{r.notes}</p>
        </div>
      </>
    );
  if ('time' in r)
    return (
      <Fields
        items={[
          ['Appointment date', date(r.date)],
          ['Appointment time', `${r.time} EAT`],
          ['Department', r.department],
          ['Practitioner source ID', r.staffKey],
          ['Recorded status', r.status],
        ]}
      />
    );
  if ('results' in r)
    return (
      <>
        <Fields
          items={[
            ['Order', r.name],
            ['Specimen', r.specimen],
            ['Result status', r.status],
            ['Source encounter', r.visitKey],
          ]}
        />
        <DataTable
          rows={r.results}
          rowKey={(x) => x.analyte}
          columns={[
            { key: 'analyte', label: 'Analyte', render: (x) => x.analyte },
            {
              key: 'value',
              label: 'Recorded result',
              render: (x) => (x.value === null ? 'Awaiting source result' : `${x.value} ${x.unit}`),
            },
            { key: 'reference', label: 'Reference', render: (x) => x.reference },
          ]}
        />
        <p className="detail-note small-text">
          Synthetic reference values are for interface demonstration only. No clinical
          interpretation is provided.
        </p>
      </>
    );
  if ('medication' in r)
    return (
      <>
        <Fields
          items={[
            ['Medication', r.medication.name],
            ['Strength', r.medication.strength],
            ['Form', r.medication.form],
            ['Quantity recorded', r.quantity],
            ['Dispensed date', date(r.date)],
            ['Source encounter', r.visitKey],
          ]}
        />
        <p className="detail-note">{r.instruction}</p>
      </>
    );
  if ('lines' in r)
    return (
      <>
        <DataTable
          rows={r.lines}
          rowKey={(x) => x.description}
          columns={[
            { key: 'description', label: 'Line item', render: (x) => x.description },
            { key: 'quantity', label: 'Quantity', render: (x) => x.quantity },
            { key: 'unitPrice', label: 'Unit price', render: (x) => money(x.unitPrice) },
            { key: 'subtotal', label: 'Subtotal', render: (x) => money(x.quantity * x.unitPrice) },
          ]}
        />
        <div className="invoice-totals">
          <span>
            Total invoiced <strong>{money(r.total)}</strong>
          </span>
          <span>
            Payments recorded <strong>{money(r.paid)}</strong>
          </span>
          <span>
            Outstanding balance <strong>{money(r.balance)}</strong>
          </span>
        </div>
        <div className="panel-header">
          <h2>Recorded payments</h2>
          <span>{r.payments.length} receipts</span>
        </div>
        {r.payments.length ? (
          <DataTable
            rows={r.payments}
            rowKey={(x) => x.key}
            columns={[
              { key: 'reference', label: 'Receipt reference', render: (x) => x.reference },
              { key: 'date', label: 'Payment date', render: (x) => date(x.date) },
              { key: 'method', label: 'Method', render: (x) => x.method },
              { key: 'amount', label: 'Amount', render: (x) => money(x.amount) },
            ]}
          />
        ) : (
          <p className="detail-note">No payments are recorded against this invoice.</p>
        )}
      </>
    );
  if ('title' in r)
    return (
      <Fields
        items={[
          ['Role', r.title],
          ['Department', r.department],
          ['Demo email', r.email],
          ['Assigned branch', r.branchId],
          ['Status', r.status],
        ]}
      />
    );
  return null;
}
export function RecordDetailPage({ module }: { module: RecordModule }) {
  const { recordKey = '' } = useParams();
  const { repository, user, scopedUrl } = usePortal();
  const location = useLocation();
  const query = useQuery({
    queryKey: ['detail', module, user?.id, recordKey, repository?.cacheKey],
    queryFn: () => repository!.get(module, recordKey as CompositeKey),
  });
  if (query.isPending) return <Loading />;
  if (query.isError) return <QueryFeedback error={query.error} retry={() => query.refetch()} />;
  if (!query.data)
    return (
      <Feedback
        title="Record not found"
        message="This composite source identity does not exist in the authorized demo dataset."
        action={
          <Link className="button secondary" to={scopedUrl(`/app/${module}`)}>
            Return to directory
          </Link>
        }
      />
    );
  const { record: r, branch, related } = query.data;
  const previous = (location.state as { returnTo?: string } | null)?.returnTo;
  const returnTo = previous?.startsWith(`/app/${module}?`)
    ? previous
    : scopedUrl(`/app/${module}`, r.branchId);
  return (
    <>
      <Link className="back-link" to={returnTo}>
        <ArrowLeft size={16} />
        {moduleLabel(module)}
      </Link>
      <PageHeader
        eyebrow={`${moduleLabel(module).toUpperCase()} / ${r.key}`}
        title={r.name}
        description={`${branch.name} · ${r.sourceSystem} · Illustrative record`}
        action={<Status value={r.status} />}
      />
      {branch.status !== 'current' && (
        <div className="notice">
          <strong>Cached record · {branch.status} branch.</strong> Last successful sync{' '}
          {date(r.syncedAt, true)}. Later source changes may be missing.
        </div>
      )}
      <div className="detail-grid">
        <section className="panel">
          <div className="panel-header">
            <h2>
              {module === 'billing'
                ? 'Invoice breakdown'
                : module === 'patients'
                  ? 'Patient profile'
                  : module === 'laboratory'
                    ? 'Order and results'
                    : 'Record details'}
            </h2>
            <span className="count-label">Read-only</span>
          </div>
          <ClinicalFields record={r} />
        </section>
        <aside className="panel provenance">
          <div className="panel-header">
            <h2>Source & provenance</h2>
          </div>
          <Fields
            items={[
              [
                'Source branch',
                <span>
                  {branch.name}
                  <small className="block mono">{branch.id}</small>
                </span>,
              ],
              ['Local record ID', r.sourceId],
              ['Composite identity', <span className="mono">{r.key}</span>],
              ['Record date', date(r.date)],
              ['Last successful sync', date(r.syncedAt, true)],
              ['Data freshness', <Status value={branch.status} />],
              ['Last sync result', <Status value={branch.syncState} />],
            ]}
          />
          <p className="detail-note small-text">
            Local identifiers may repeat in other branches. Patient identity is never automatically
            merged.
          </p>
        </aside>
      </div>
      <section className="panel mt-6">
        <div className="panel-header">
          <div>
            <p className="eyebrow">FOLLOW THE SOURCE RELATIONSHIPS</p>
            <h2>Related records</h2>
          </div>
          <span className="count-label">{related.length} permitted records</span>
        </div>
        {related.length ? (
          <div className="related-list">
            {related.map((item) => (
              <Link
                aria-label={`${moduleLabel(item.module)}: ${item.name} (${item.key})`}
                key={`${item.module}:${item.key}`}
                to={scopedUrl(`/app/${item.module}/${encodeURIComponent(item.key)}`, r.branchId)}
              >
                <span className="related-type">{moduleLabel(item.module)}</span>
                <span>
                  <strong>{item.name}</strong>
                  <small>
                    {item.key} · {date(item.date)}
                  </small>
                </span>
                <Status value={item.status} />
                <ArrowUpRight size={17} />
              </Link>
            ))}
          </div>
        ) : (
          <p className="detail-note">
            No related records are available under this demo role. Missing relationships are not
            inferred.
          </p>
        )}
      </section>
    </>
  );
}
