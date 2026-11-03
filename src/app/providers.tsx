import { createContext, useContext, useMemo, useState, useEffect, type ReactNode } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query';
import { getPersona, landing } from '../domain/permissions';
import type { Branch, DemoUser, RoleId } from '../domain/types';
import type { ClinicReadRepository } from '../domain/repositories';
import { createRepository } from '../data/repositoryFactory';
interface Session {
  role: RoleId;
  expiresAt: number;
}
function readSession(): Session | null {
  try {
    const s = JSON.parse(sessionStorage.getItem('clinic-demo-session') ?? 'null') as Session | null;
    return s &&
      s.expiresAt > Date.now() &&
      ['hq', 'executive', 'regional', 'branch', 'finance', 'clinical'].includes(s.role)
      ? s
      : null;
  } catch {
    return null;
  }
}
interface AppContext {
  user: DemoUser | null;
  repository: ClinicReadRepository | null;
  login: (role: RoleId) => void;
  logout: () => void;
  branchId: string;
  selectBranch: (id: string) => void;
  scopes: Branch[];
  scopedUrl: (path: string, branch?: string) => string;
  fail: boolean;
  setFail: (v: boolean) => void;
  expired: boolean;
}
const Context = createContext<AppContext | null>(null);
const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false, staleTime: 30000, refetchOnWindowFocus: false } },
});
export const usePortal = () => {
  const context = useContext(Context);
  if (!context) throw new Error('Portal provider missing');
  return context;
};
function PortalProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(readSession);
  const [expired, setExpired] = useState(false);
  const [fail, setFail] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const [params] = useSearchParams();
  const user = session ? getPersona(session.role) : null;
  const repository = useMemo(
    () => (user && session ? createRepository(user, session.expiresAt, fail) : null),
    [user, session, fail],
  );
  const scopesQuery = useQuery({
    queryKey: ['scopes', user?.id, fail],
    queryFn: () => repository!.listScopes(),
    enabled: !!repository,
  });
  const defaultScope = user?.branchIds === 'all' ? 'all' : (user?.branchIds[0] ?? 'all');
  const pathSegments = location.pathname.split('/').filter(Boolean);
  const detailId = pathSegments.length === 3 ? pathSegments[2].replace(/%3A/gi, ':') : undefined;
  const detailBranch =
    detailId &&
    (pathSegments[1] === 'branches'
      ? detailId
      : detailId.includes(':')
        ? detailId.split(':')[0]
        : undefined);
  const requestedScope = detailBranch ?? params.get('branch') ?? defaultScope;
  const branchId =
    requestedScope === 'all' && user?.branchIds !== 'all' && user?.branchIds.length === 1
      ? user.branchIds[0]
      : requestedScope;
  const scopedUrl = (path: string, branch = branchId) =>
    `${path}${path.includes('?') ? '&' : '?'}branch=${encodeURIComponent(branch)}`;
  const selectBranch = (id: string) => {
    const next = new URLSearchParams(location.search);
    next.set('branch', id);
    next.delete('page');
    const segments = location.pathname.split('/').filter(Boolean);
    const path = segments.length > 2 ? `/app/${segments[1]}` : location.pathname;
    navigate(`${path}?${next}`);
  };
  const logout = () => {
    sessionStorage.removeItem('clinic-demo-session');
    setSession(null);
    queryClient.clear();
    setFail(false);
    navigate('/login');
  };
  const login = (role: RoleId) => {
    const s = { role, expiresAt: Date.now() + 2 * 60 * 60 * 1000 };
    sessionStorage.setItem('clinic-demo-session', JSON.stringify(s));
    queryClient.clear();
    setSession(s);
    setExpired(false);
    setFail(false);
    navigate(landing(getPersona(role)));
  };
  useEffect(() => {
    if (!session) return;
    const timer = setTimeout(
      () => {
        sessionStorage.removeItem('clinic-demo-session');
        setSession(null);
        queryClient.clear();
        setExpired(true);
        navigate('/login');
      },
      Math.max(0, session.expiresAt - Date.now()),
    );
    return () => clearTimeout(timer);
  }, [session, navigate]);
  return (
    <Context.Provider
      value={{
        user,
        repository,
        login,
        logout,
        branchId,
        selectBranch,
        scopes: scopesQuery.data ?? [],
        scopedUrl,
        fail,
        setFail,
        expired,
      }}
    >
      {children}
    </Context.Provider>
  );
}
export function Providers({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <PortalProvider>{children}</PortalProvider>
    </QueryClientProvider>
  );
}
