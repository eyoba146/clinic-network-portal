import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Navigate, Route, Routes, Link } from 'react-router-dom';
import { usePortal } from './providers';
import { can, landing } from '../domain/permissions';
import type { Module, RecordModule } from '../domain/types';
import { Shell } from '../components/Shell';
import { Feedback } from '../components/ui';
import { LoginPage } from '../features/LoginPage';
import { OverviewPage } from '../features/OverviewPage';
import { BranchesPage, BranchDetailPage } from '../features/BranchesPage';
import { RecordsPage } from '../features/RecordsPage';
import { RecordDetailPage } from '../features/RecordDetailPage';
import { ReportsPage } from '../features/ReportsPage';
import { AccessPage, AuditPage, SyncPage } from '../features/GovernancePages';
function Protected({ module, children }: { module?: Module; children: ReactNode }) {
  const { user } = usePortal();
  if (!user) return <Navigate to="/login" replace />;
  if (module && !can(user, module))
    return (
      <Feedback
        kind="denied"
        title="Access denied"
        message="This module is outside the permissions assigned to your demo role."
        action={
          <Link className="button secondary" to={landing(user)}>
            Return to your workspace
          </Link>
        }
      />
    );
  return children;
}
function Home() {
  const { user } = usePortal();
  return user ? <Navigate to={landing(user)} replace /> : <Navigate to="/login" replace />;
}
function NotFound() {
  const { user } = usePortal();
  return (
    <Feedback
      title="Page not found"
      message="This address does not match a portal page. The record or module may have a different source identity."
      action={
        <Link className="button" to={user ? landing(user) : '/login'}>
          Return to workspace
        </Link>
      }
    />
  );
}
export class AppErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Portal rendering error', error.message, info.componentStack);
  }
  render() {
    return this.state.failed ? (
      <Feedback
        kind="error"
        title="The view could not be displayed"
        message="Reload the portal to recover. No source records have been changed."
        action={
          <button className="button" onClick={() => window.location.reload()}>
            Reload portal
          </button>
        }
      />
    ) : (
      this.props.children
    );
  }
}
const modules: RecordModule[] = [
  'patients',
  'visits',
  'appointments',
  'laboratory',
  'pharmacy',
  'billing',
  'staff',
];
export function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/app"
        element={
          <Protected>
            <Shell />
          </Protected>
        }
      >
        <Route
          index
          element={
            <Protected module="overview">
              <OverviewPage />
            </Protected>
          }
        />
        <Route
          path="branches"
          element={
            <Protected module="branches">
              <BranchesPage />
            </Protected>
          }
        />
        <Route
          path="branches/:branchId"
          element={
            <Protected module="branches">
              <BranchDetailPage />
            </Protected>
          }
        />
        {modules.map((m) => (
          <Route
            key={m}
            path={m}
            element={
              <Protected module={m}>
                <RecordsPage module={m} />
              </Protected>
            }
          />
        ))}
        {modules.map((m) => (
          <Route
            key={`${m}-detail`}
            path={`${m}/:recordKey`}
            element={
              <Protected module={m}>
                <RecordDetailPage module={m} />
              </Protected>
            }
          />
        ))}
        <Route
          path="reports"
          element={
            <Protected module="reports">
              <ReportsPage />
            </Protected>
          }
        />
        <Route
          path="sync-health"
          element={
            <Protected module="sync-health">
              <SyncPage />
            </Protected>
          }
        />
        <Route
          path="access"
          element={
            <Protected module="access">
              <AccessPage />
            </Protected>
          }
        />
        <Route
          path="audit"
          element={
            <Protected module="audit">
              <AuditPage />
            </Protected>
          }
        />
        <Route path="*" element={<NotFound />} />
      </Route>
      <Route
        path="/403"
        element={
          <Feedback
            kind="denied"
            title="Access denied"
            message="Your demo role cannot access this information."
            action={
              <Link to="/login" className="button">
                Choose a different demo role
              </Link>
            }
          />
        }
      />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
