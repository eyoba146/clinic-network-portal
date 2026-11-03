import { describe, expect, it } from 'vitest';
import { createMockRepository } from '../data/mockClinicRepository';
import { getPersona } from '../domain/permissions';
import { branches, seed } from '../data/seed';
import { csv, csvCell, date } from '../lib/formatting';
const repo = (role: Parameters<typeof getPersona>[0] = 'hq') =>
  createMockRepository(getPersona(role), { latency: 0 });
describe('authorization at the data boundary', () => {
  it('gives HQ 54 scopes and limits regional and branch roles', async () => {
    expect(await repo().listScopes()).toHaveLength(54);
    expect(await repo('regional').listScopes()).toHaveLength(12);
    expect((await repo('branch').listScopes()).map((b) => b.id)).toEqual(['BR-012']);
  });
  it('denies unauthorized modules, direct records, and forged branch filters', async () => {
    await expect(repo('finance').list('patients')).rejects.toMatchObject({ status: 403 });
    await expect(repo('executive').get('laboratory', 'BR-001:L1001')).rejects.toMatchObject({
      status: 403,
    });
    await expect(repo('regional').get('patients', 'BR-013:1001')).rejects.toMatchObject({
      status: 403,
    });
    await expect(repo('branch').list('billing', { branchIds: ['BR-001'] })).rejects.toMatchObject({
      status: 403,
    });
    await expect(repo('finance').getReports({ branchIds: ['BR-054'] })).rejects.toMatchObject({
      status: 403,
    });
    await expect(repo('regional').getSyncHealth()).rejects.toMatchObject({ status: 403 });
  });
  it('applies record-level restrictions to lists, details and related records', async () => {
    const regional = repo('regional');
    const list = await regional.list('patients', { branchIds: ['BR-001'] });
    expect(list.total).toBe(11);
    await expect(regional.get('patients', 'BR-001:1012')).rejects.toMatchObject({ status: 403 });
    await expect(regional.get('visits', 'BR-001:V1023')).rejects.toMatchObject({ status: 403 });
    expect((await repo().get('patients', 'BR-001:1012'))?.record.restricted).toBe(true);
    const staff = await regional.get('staff', 'BR-001:S1');
    expect(staff?.related.some((r) => r.key === 'BR-001:V1023')).toBe(false);
  });
  it('does not leak clinical totals or linked patient details to finance', async () => {
    const reports = await repo('finance').getReports();
    expect(reports.rows).toHaveLength(12);
    expect(
      reports.rows.every(
        (r) => r.patients === null && r.visits === null && r.appointments === null,
      ),
    ).toBe(true);
    const invoice = await repo('finance').get('billing', 'BR-001:I1001');
    expect(invoice?.related).toEqual([]);
    expect(
      (await repo('finance').list('billing')).items.every((r) => !r.name.includes('Selam')),
    ).toBe(true);
  });
  it('returns only assigned scope for implicit organization-wide queries', async () => {
    const records = await repo('branch').list('patients');
    expect(records.items.every((r) => r.branchId === 'BR-012')).toBe(true);
  });
});
describe('relational seed and source identity', () => {
  it('meets the full baseline sizes, including an intentionally empty branch', () => {
    expect(branches).toHaveLength(54);
    for (const [module, min] of Object.entries({
      patients: 600,
      visits: 1000,
      appointments: 300,
      laboratory: 300,
      pharmacy: 250,
      billing: 500,
      staff: 100,
    })) {
      expect(seed[module as keyof typeof seed].length).toBeGreaterThanOrEqual(min);
    }
    expect(
      Object.values(seed)
        .flat()
        .some((r) => r.branchId === 'BR-054'),
    ).toBe(false);
  });
  it('resolves repeated local IDs without collision', async () => {
    const a = await repo().get('patients', 'BR-001:1001');
    const b = await repo().get('patients', 'BR-002:1001');
    expect(a?.record.sourceId).toBe(b?.record.sourceId);
    expect(a?.record.key).not.toBe(b?.record.key);
    expect(a?.record.name).not.toBe(b?.record.name);
  });
  it('preserves branch-local relationships and chronology', () => {
    const patients = new Map(seed.patients.map((p) => [p.key, p]));
    const visits = new Map(seed.visits.map((v) => [v.key, v]));
    for (const module of Object.values(seed)) {
      expect(new Set(module.map((r) => r.key)).size).toBe(module.length);
      for (const r of module) {
        if (r.patientKey) {
          expect(patients.get(r.patientKey)?.branchId).toBe(r.branchId);
        }
        if ('visitKey' in r) {
          const visit = visits.get(r.visitKey);
          expect(visit?.branchId).toBe(r.branchId);
          expect(visit?.patientKey).toBe(r.patientKey);
          expect(r.date >= visit!.date).toBe(true);
        }
        expect(r.syncedAt && r.date <= r.syncedAt).toBeTruthy();
      }
    }
  });
  it('keeps invoice amounts, receipts and derived reports in agreement', async () => {
    for (const invoice of seed.billing) {
      expect(invoice.total).toBe(invoice.lines.reduce((s, l) => s + l.quantity * l.unitPrice, 0));
      expect(invoice.paid).toBe(invoice.payments.reduce((s, p) => s + p.amount, 0));
      expect(invoice.balance).toBe(invoice.total - invoice.paid);
      invoice.payments.forEach((p) => {
        expect(p.invoiceKey).toBe(invoice.key);
        expect(p.branchId).toBe(invoice.branchId);
        expect(p.date >= invoice.date).toBe(true);
      });
    }
    const report = await repo().getReports();
    expect(report.rows.reduce((s, r) => s + (r.patients ?? 0), 0)).toBe(seed.patients.length);
    expect(report.rows.reduce((s, r) => s + (r.invoiced ?? 0), 0)).toBe(
      seed.billing.reduce((s, r) => s + r.total, 0),
    );
    expect(report.rows.reduce((s, r) => s + (r.collected ?? 0), 0)).toBe(
      seed.billing.reduce((s, r) => s + r.paid, 0),
    );
  });
  it('follows patient to encounter to laboratory using consistent composite identities', async () => {
    const patient = await repo().get('patients', 'BR-012:1001');
    const visitLink = patient?.related.find((r) => r.module === 'visits');
    expect(visitLink).toBeDefined();
    const visit = await repo().get('visits', visitLink!.key);
    const labLink = visit?.related.find((r) => r.module === 'laboratory');
    expect(labLink).toBeDefined();
    const lab = await repo().get('laboratory', labLink!.key);
    expect(lab?.record.patientKey).toBe(patient?.record.key);
  });
});
describe('query contracts and exceptional states', () => {
  it('filters, sorts and paginates consistently without overlap', async () => {
    const first = await repo().list('patients', {
      branchIds: ['BR-012'],
      pageSize: 5,
      sortBy: 'sourceId',
    });
    const next = await repo().list('patients', {
      branchIds: ['BR-012'],
      pageSize: 5,
      page: 2,
      sortBy: 'sourceId',
    });
    expect(first.total).toBe(12);
    expect(first.items).toHaveLength(5);
    expect(first.items.some((r) => next.items.some((n) => n.key === r.key))).toBe(false);
    const search = await repo().list('patients', { branchIds: ['BR-012'], search: 'Selam' });
    expect(search.total).toBe(1);
    expect((await repo().list('patients', { branchIds: ['BR-054'] })).total).toBe(0);
    expect(
      (await repo().list('billing', { status: 'Unpaid' })).items.every(
        (r) => r.balance === r.total,
      ),
    ).toBe(true);
  });
  it('retains readable offline data and identifies partial and failed sync', async () => {
    const b = await repo().getBranch('BR-013');
    expect(b?.connection).toBe('Offline');
    expect(b?.lastSync).toBeTruthy();
    expect((await repo().list('patients', { branchIds: ['BR-013'] })).total).toBe(12);
    expect((await repo().getBranch('BR-011'))?.syncState).toBe('Partial');
    expect((await repo().getBranch('BR-017'))?.syncState).toBe('Failed');
  });
  it('exposes service failures, session expiration, and missing records', async () => {
    await expect(
      createMockRepository(getPersona('hq'), { latency: 0, fail: true }).list('patients'),
    ).rejects.toMatchObject({ status: 503 });
    await expect(
      createMockRepository(getPersona('hq'), { latency: 0, expiresAt: 0 }).listBranches(),
    ).rejects.toMatchObject({ status: 401 });
    expect(await repo().get('patients', 'BR-001:missing')).toBeNull();
  });
  it('filters report dates and returns detached records', async () => {
    const r = await repo().getReports({ from: '2027-01-01', to: '2027-01-02' });
    expect(r.rows.every((row) => row.invoiced === 0 && row.patients === 0)).toBe(true);
    const detail = await repo().get('patients', 'BR-001:1001');
    const original = detail!.record.name;
    detail!.record.name = 'Local copy';
    expect((await repo().get('patients', 'BR-001:1001'))?.record.name).toBe(original);
  });
});
describe('display and export utilities', () => {
  it('uses explicit branch time and missing date handling', () => {
    expect(date('2026-11-03T09:00:00Z', true)).toContain('12:00 EAT');
    expect(date(null)).toBe('Not synchronized');
    expect(date('invalid')).toBe('Unavailable');
  });
  it('escapes CSV cells and protects formula-like values', () => {
    expect(csvCell('=SUM(A1)')).toBe('"\'=SUM(A1)"');
    expect(csvCell('a"b')).toBe('"a""b"');
    expect(
      csv([
        ['x', 'y'],
        ['a,b', 2],
      ]),
    ).toBe('"x","y"\r\n"a,b","2"');
  });
});

describe('nested record search', () => {
  it('finds medication names and sorts dispensing records by medication', async () => {
    const result = await repo().list('pharmacy', { branchIds: ['BR-012'], search: 'Paracetamol' });
    expect(result.total).toBe(3);
    expect(result.items.every((r) => r.medication.name === 'Paracetamol')).toBe(true);
    const ordered = await repo().list('pharmacy', { branchIds: ['BR-012'], sortBy: 'medication' });
    expect(ordered.items[0].medication.name).toBe('Oral rehydration salts');
  });
});
