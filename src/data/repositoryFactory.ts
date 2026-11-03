import { createMockRepository } from './mockClinicRepository';
import type { DemoUser } from '../domain/types';
import type { ClinicReadRepository } from '../domain/repositories';
export function createRepository(
  user: DemoUser,
  expiresAt: number,
  fail = false,
): ClinicReadRepository {
  return createMockRepository(user, { expiresAt, fail });
}
