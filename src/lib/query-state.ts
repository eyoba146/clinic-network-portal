import { useSearchParams } from 'react-router-dom';
import type { QueryOptions } from '../domain/types';
export function useQueryState() {
  const [params, setParams] = useSearchParams();
  const update = (updates: Record<string, string>) =>
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        for (const [k, v] of Object.entries(updates)) {
          if (v) next.set(k, v);
          else next.delete(k);
        }
        if (!('page' in updates)) next.delete('page');
        return next;
      },
      { replace: true },
    );
  const positive = (v: string | null) => Math.max(1, Number(v) || 1);
  const options: QueryOptions = {
    search: params.get('q') ?? '',
    status: params.get('status') ?? '',
    region: params.get('region') ?? '',
    from: params.get('from') ?? '',
    to: params.get('to') ?? '',
    page: positive(params.get('page')),
    pageSize: 12,
    sortBy: params.get('sort') ?? 'name',
    sortDirection: params.get('direction') === 'desc' ? 'desc' : 'asc',
  };
  return { params, update, options };
}
