export type BranchId = string;
export type CompositeKey = `${BranchId}:${string}`;
export type DataFreshness = 'current' | 'delayed' | 'stale' | 'offline' | 'unknown';
export type Module =
  | 'overview'
  | 'branches'
  | 'patients'
  | 'visits'
  | 'appointments'
  | 'laboratory'
  | 'pharmacy'
  | 'billing'
  | 'reports'
  | 'staff'
  | 'sync-health'
  | 'access'
  | 'audit';
export type RecordModule =
  'patients' | 'visits' | 'appointments' | 'laboratory' | 'pharmacy' | 'billing' | 'staff';
export type RoleId = 'hq' | 'executive' | 'regional' | 'branch' | 'finance' | 'clinical';
export interface SourceRef {
  branchId: BranchId;
  sourceId: string;
  sourceSystem: string;
  syncedAt: string | null;
}
export interface BaseRecord extends SourceRef {
  key: CompositeKey;
  name: string;
  date: string;
  status: string;
  patientKey?: CompositeKey;
}
export interface Patient extends BaseRecord {
  sex: 'Female' | 'Male';
  birthDate: string;
  phone: string | null;
  locality: string;
  restricted: boolean;
}
export interface Visit extends BaseRecord {
  patientKey: CompositeKey;
  staffKey: CompositeKey;
  department: string;
  reason: string;
  notes: string;
}
export interface Appointment extends BaseRecord {
  patientKey: CompositeKey;
  staffKey: CompositeKey;
  department: string;
  time: string;
}
export interface LabResult {
  analyte: string;
  value: number | null;
  unit: string;
  reference: string;
}
export interface LabOrder extends BaseRecord {
  patientKey: CompositeKey;
  visitKey: CompositeKey;
  specimen: string;
  results: LabResult[];
}
export interface Medication {
  name: string;
  strength: string;
  form: string;
}
export interface Dispense extends BaseRecord {
  patientKey: CompositeKey;
  visitKey: CompositeKey;
  medication: Medication;
  quantity: number;
  instruction: string;
}
export interface InvoiceLine {
  description: string;
  quantity: number;
  unitPrice: number;
}
export interface Payment extends SourceRef {
  key: CompositeKey;
  invoiceKey: CompositeKey;
  amount: number;
  date: string;
  method: 'Cash' | 'Bank transfer';
  reference: string;
}
export interface Invoice extends BaseRecord {
  patientKey: CompositeKey;
  visitKey: CompositeKey;
  lines: InvoiceLine[];
  payments: Payment[];
  total: number;
  paid: number;
  balance: number;
  currency: 'ETB';
}
export interface Staff extends BaseRecord {
  title: string;
  department: string;
  email: string;
}
export interface EntityMap {
  patients: Patient;
  visits: Visit;
  appointments: Appointment;
  laboratory: LabOrder;
  pharmacy: Dispense;
  billing: Invoice;
  staff: Staff;
}
export interface Branch {
  id: BranchId;
  name: string;
  region: string;
  timezone: string;
  status: DataFreshness;
  connection: 'Connected' | 'Offline' | 'Unknown';
  syncState: 'Complete' | 'Partial' | 'Failed' | 'Pending';
  lastSync: string | null;
  lagMinutes: number | null;
  version: string;
  lastError: string | null;
}
export interface SyncStatus extends Branch {
  recordsProcessed: number;
}
export interface DemoUser {
  id: RoleId;
  name: string;
  role: string;
  branchIds: BranchId[] | 'all';
  modules: Module[];
  allowRestricted: boolean;
}
export interface AuditEvent {
  id: string;
  actor: string;
  action: string;
  branchId: BranchId;
  date: string;
  category: string;
  outcome: 'Allowed' | 'Denied';
}
export interface QueryOptions {
  branchIds?: BranchId[];
  search?: string;
  status?: string;
  region?: string;
  from?: string;
  to?: string;
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
}
export interface PaginatedResult<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
}
export interface RelatedRecord {
  module: RecordModule;
  key: CompositeKey;
  name: string;
  date: string;
  status: string;
}
export interface RecordDetail<M extends RecordModule> {
  record: EntityMap[M];
  branch: Branch;
  related: RelatedRecord[];
}
export interface ReportRow {
  branchId: BranchId;
  branchName: string;
  status: DataFreshness;
  lastSync: string | null;
  patients: number | null;
  visits: number | null;
  appointments: number | null;
  invoices: number | null;
  invoiced: number | null;
  collected: number | null;
  outstanding: number | null;
}
export interface ReportSummary {
  rows: ReportRow[];
  asOf: string;
  coverage: { total: number; current: number; incomplete: number };
  from: string;
  to: string;
}
