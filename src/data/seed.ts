import type {
  Branch,
  EntityMap,
  BaseRecord,
  CompositeKey,
  AuditEvent,
  Invoice,
  Payment,
} from '../domain/types';
export const SNAPSHOT = '2026-11-03T09:00:00Z';
const areas = ['Addis Ababa', 'Oromia', 'Amhara', 'Sidama', 'Southern Region', 'Dire Dawa'];
const names = [
  'Bole',
  'Arada',
  'Adama',
  'Bahir Dar',
  'Hawassa',
  'Dire Dawa',
  'Lideta',
  'Jimma',
  'Dessie',
  'Yirgalem',
  'Wolaita',
  'Kirkos',
  'Gondar',
  'Bishoftu',
  'Shashemene',
  'Harar',
  'Mekelle',
  'Debre Birhan',
];
const first = [
  'Selam',
  'Dawit',
  'Hana',
  'Abel',
  'Meron',
  'Yonas',
  'Rahel',
  'Samuel',
  'Tigist',
  'Natnael',
  'Bethlehem',
  'Henok',
];
const last = [
  'Bekele',
  'Tesfaye',
  'Alemu',
  'Tadesse',
  'Mekonnen',
  'Getachew',
  'Kebede',
  'Abebe',
  'Girma',
];
const iso = (days: number, hours = 9) =>
  `2026-10-${String(1 + (days % 28)).padStart(2, '0')}T${String(hours).padStart(2, '0')}:00:00Z`;
export const branches: Branch[] = Array.from({ length: 54 }, (_, n) => {
  const i = n + 1;
  const offline = i % 13 === 0;
  const failed = i % 17 === 0;
  const partial = i % 11 === 0;
  const delayed = i % 7 === 0;
  const unknown = i === 54;
  const lag = unknown
    ? null
    : offline
      ? 2880
      : failed
        ? 1440
        : partial
          ? 240
          : delayed
            ? 90
            : 5 + (i % 12);
  return {
    id: `BR-${String(i).padStart(3, '0')}`,
    name: `${names[n % 18]} ${['Central', 'East', 'North'][Math.floor(n / 18)]}`,
    region: areas[n % 6],
    timezone: 'Africa/Addis_Ababa',
    status: unknown
      ? 'unknown'
      : offline
        ? 'offline'
        : failed
          ? 'stale'
          : partial || delayed
            ? 'delayed'
            : 'current',
    connection: unknown ? 'Unknown' : offline ? 'Offline' : 'Connected',
    syncState: unknown ? 'Pending' : failed ? 'Failed' : partial ? 'Partial' : 'Complete',
    lastSync: lag === null ? null : new Date(Date.parse(SNAPSHOT) - lag * 60000).toISOString(),
    lagMinutes: lag,
    version: unknown ? 'Not onboarded' : 'demo-1.4.2',
    lastError: failed
      ? 'DEMO_SCHEMA_MISMATCH: one source stream could not be read.'
      : offline
        ? 'DEMO_HEARTBEAT_TIMEOUT: connector unreachable.'
        : partial
          ? 'DEMO_PARTIAL_BATCH: laboratory stream incomplete.'
          : null,
  };
});
export const seed: { [M in keyof EntityMap]: EntityMap[M][] } = {
  patients: [],
  visits: [],
  appointments: [],
  laboratory: [],
  pharmacy: [],
  billing: [],
  staff: [],
};
const key = (branch: Branch, id: string): CompositeKey => `${branch.id}:${id}`;
function base(branch: Branch, id: string, name: string, date: string, status: string): BaseRecord {
  return {
    key: key(branch, id),
    branchId: branch.id,
    sourceId: id,
    sourceSystem: 'Fictional clinic source',
    syncedAt: branch.lastSync,
    name,
    date,
    status,
  };
}
branches.slice(0, 53).forEach((branch, b) => {
  for (let s = 0; s < 2; s++)
    seed.staff.push({
      ...base(branch, `S${s + 1}`, `${first[(b + s) % 12]} ${last[(b + s) % 9]}`, iso(0), 'Active'),
      title: s ? 'Laboratory technologist' : 'Clinical officer',
      department: s ? 'Laboratory' : 'Outpatient',
      email: `staff.${b + 1}.${s + 1}@example.invalid`,
    });
  for (let p = 0; p < 12; p++) {
    const patient = {
      ...base(
        branch,
        String(1001 + p),
        `${first[p]} ${last[(b + p) % 9]}`,
        iso(p + (b % 14)),
        p === 10 ? 'Partial record' : 'Active',
      ),
      sex: p % 2 ? ('Male' as const) : ('Female' as const),
      birthDate: `${1960 + ((p * 4 + b) % 48)}-05-${String(p + 1).padStart(2, '0')}`,
      phone:
        p === 10
          ? null
          : `DEMO +251 000 ${String(b).padStart(3, '0')} ${String(p).padStart(3, '0')}`,
      locality: branch.name,
      restricted: p === 11,
    };
    seed.patients.push(patient);
    for (let v = 0; v < 2; v++)
      seed.visits.push({
        ...base(
          branch,
          `V${1001 + p * 2 + v}`,
          `Outpatient encounter ${1001 + p * 2 + v}`,
          iso(p + (b % 14) + v, 10 + v),
          'Completed',
        ),
        patientKey: patient.key,
        staffKey: key(branch, 'S1'),
        department: 'Outpatient',
        reason: ['Routine follow-up', 'General consultation', 'Review of recorded results'][p % 3],
        notes:
          p === 10
            ? 'Source note unavailable in this fictional record.'
            : 'Illustrative source note: consultation completed; follow-up recorded by the source clinic. No clinical recommendation is provided.',
      });
    const visitKey = key(branch, `V${1001 + p * 2}`);
    if (p < 7)
      seed.appointments.push({
        ...base(
          branch,
          `A${1001 + p}`,
          'Outpatient appointment',
          iso(p + (b % 14) + 2),
          ['Scheduled', 'Completed', 'Canceled', 'Did not attend'][p % 4],
        ),
        patientKey: patient.key,
        staffKey: key(branch, 'S1'),
        department: 'Outpatient',
        time: `${9 + p}:30`,
      });
    if (p < 8)
      seed.laboratory.push({
        ...base(
          branch,
          `L${1001 + p}`,
          p % 2 ? 'Fasting glucose' : 'Hemoglobin',
          iso(p + (b % 14) + 1, 12),
          p % 3 === 0 ? 'Pending' : 'Final',
        ),
        patientKey: patient.key,
        visitKey,
        specimen: 'Venous blood',
        results: [
          p % 2
            ? {
                analyte: 'Glucose',
                value: p % 3 === 0 ? null : 82 + p * 3,
                unit: 'mg/dL',
                reference: '70-99 (illustrative only)',
              }
            : {
                analyte: 'Hemoglobin',
                value: p % 3 === 0 ? null : 12.5 + p / 10,
                unit: 'g/dL',
                reference: '12.0-16.0 (illustrative only)',
              },
        ],
      });
    if (p < 6)
      seed.pharmacy.push({
        ...base(
          branch,
          `D${1001 + p}`,
          'Recorded medication dispense',
          iso(p + (b % 14) + 1, 14),
          'Dispensed',
        ),
        patientKey: patient.key,
        visitKey,
        medication: {
          name: p % 2 ? 'Paracetamol' : 'Oral rehydration salts',
          strength: p % 2 ? '500 mg' : 'Standard sachet',
          form: p % 2 ? 'Tablet' : 'Powder',
        },
        quantity: p % 2 ? 10 : 3,
        instruction: 'Fictional dispensing record. Administration directions are not modeled.',
      });
    const lines = [
      { description: 'Outpatient consultation', quantity: 1, unitPrice: 350 },
      ...(p < 8
        ? [{ description: p % 2 ? 'Glucose test' : 'Hemoglobin test', quantity: 1, unitPrice: 180 }]
        : []),
    ];
    const total = lines.reduce((s, l) => s + l.quantity * l.unitPrice, 0);
    const paid = p % 3 === 0 ? 0 : p % 3 === 1 ? 200 : total;
    const invoiceKey = key(branch, `I${1001 + p}`);
    const payments: Payment[] = paid
      ? [
          {
            branchId: branch.id,
            sourceId: `P${1001 + p}`,
            sourceSystem: 'Fictional clinic source',
            syncedAt: branch.lastSync,
            key: key(branch, `P${1001 + p}`),
            invoiceKey,
            amount: paid,
            date: iso(p + (b % 14) + 2, 15),
            method: p % 2 ? 'Cash' : 'Bank transfer',
            reference: `DEMO-RCPT-${b + 1}-${p + 1}`,
          },
        ]
      : [];
    const invoice: Invoice = {
      ...base(
        branch,
        `I${1001 + p}`,
        `Invoice I${1001 + p}`,
        iso(p + (b % 14) + 1, 14),
        paid === 0 ? 'Unpaid' : paid === total ? 'Paid' : 'Part-paid',
      ),
      patientKey: patient.key,
      visitKey,
      lines,
      payments,
      total,
      paid,
      balance: total - paid,
      currency: 'ETB',
    };
    seed.billing.push(invoice);
  }
});
export const audit: AuditEvent[] = Array.from({ length: 108 }, (_, i) => ({
  id: `DEMO-EVT-${i + 1}`,
  actor: ['HQ demo', 'Regional demo', 'Finance demo'][i % 3],
  action:
    i % 5 === 0
      ? 'Clinical record access denied'
      : i % 4 === 0
        ? 'Demo report exported'
        : 'Directory viewed',
  branchId: branches[i % 54].id,
  date: new Date(Date.parse(SNAPSHOT) - i * 180000).toISOString(),
  category: i % 5 === 0 ? 'Patients' : i % 4 === 0 ? 'Reports' : 'Branches',
  outcome: i % 5 === 0 ? 'Denied' : 'Allowed',
}));
