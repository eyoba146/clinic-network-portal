import type {
  Branch,
  CompositeKey,
  EntityMap,
  PaginatedResult,
  QueryOptions,
  RecordDetail,
  RecordModule,
  ReportSummary,
  SyncStatus,
  AuditEvent,
  DemoUser,
} from './types';
export interface ClinicReadRepository {
  readonly cacheKey: string;
  listScopes(): Promise<Branch[]>;
  listBranches(options?: QueryOptions): Promise<PaginatedResult<Branch>>;
  getBranch(id: string): Promise<Branch | null>;
  list<M extends RecordModule>(
    module: M,
    options?: QueryOptions,
  ): Promise<PaginatedResult<EntityMap[M]>>;
  get<M extends RecordModule>(module: M, key: CompositeKey): Promise<RecordDetail<M> | null>;
  getReports(options?: QueryOptions): Promise<ReportSummary>;
  getOverview(options?: QueryOptions): Promise<ReportSummary>;
  getSyncHealth(options?: QueryOptions): Promise<PaginatedResult<SyncStatus>>;
  getAudit(options?: QueryOptions): Promise<PaginatedResult<AuditEvent>>;
  getAccess(): Promise<DemoUser[]>;
}
export class RepositoryError extends Error {
  constructor(
    public status: 401 | 403 | 404 | 503,
    message: string,
  ) {
    super(message);
    this.name = 'RepositoryError';
  }
}
