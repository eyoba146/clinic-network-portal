import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import {
  List,
  X,
  LockSimple,
  SignOut,
  ArrowsClockwise,
  Buildings,
  ArrowUpRight,
} from '@phosphor-icons/react';
import { usePortal } from '../app/providers';
import { navigation } from '../app/navigation';
import { can, canBranch, landing } from '../domain/permissions';
import { date } from '../lib/formatting';
import { Feedback, Status } from './ui';
export function Shell() {
  const { user, branchId, selectBranch, scopes, scopedUrl, logout, fail, setFail } = usePortal();
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const menu = useRef<HTMLButtonElement>(null);
  const aside = useRef<HTMLElement>(null);
  const main = useRef<HTMLElement>(null);
  useEffect(() => {
    main.current?.focus({ preventScroll: true });
  }, [location.pathname]);
  useEffect(() => {
    if (!open) return;
    aside.current?.querySelector<HTMLButtonElement>('button')?.focus();
    const key = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
        menu.current?.focus();
      }
      if (event.key === 'Tab') {
        const nodes = aside.current?.querySelectorAll<HTMLElement>('a,button');
        if (!nodes?.length) return;
        const first = nodes[0];
        const last = nodes[nodes.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener('keydown', key);
    return () => document.removeEventListener('keydown', key);
  }, [open]);
  if (!user) return null;
  const selected = scopes.find((b) => b.id === branchId);
  const restricted = branchId !== 'all' && !canBranch(user, branchId);
  const stale = scopes.filter(
    (b) =>
      (branchId === 'all' || b.id === branchId) &&
      (b.status !== 'current' || b.syncState !== 'Complete'),
  ).length;
  let group = '';
  return (
    <div className="app-shell">
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      {open && (
        <button
          className="nav-scrim"
          aria-label="Close navigation"
          onClick={() => {
            setOpen(false);
            menu.current?.focus();
          }}
        />
      )}
      <aside
        className={`sidebar ${open ? 'is-open' : ''}`}
        ref={aside}
        aria-label="Primary navigation"
        aria-modal={open ? true : undefined}
        role={open ? 'dialog' : undefined}
      >
        <Link to={scopedUrl(landing(user))} className="brand" onClick={() => setOpen(false)}>
          <span className="brand-mark">
            cn<span>+</span>
          </span>
          <span>
            Clinic Network<small>INFORMATION PORTAL</small>
          </span>
        </Link>
        <button
          className="close-menu icon-button"
          onClick={() => {
            setOpen(false);
            menu.current?.focus();
          }}
          aria-label="Close navigation"
        >
          <X size={22} />
        </button>
        <div className="workspace-label">
          <span className="tiny-dot" /> CENTRAL WORKSPACE
        </div>
        <nav>
          {navigation
            .filter((n) => can(user, n.id))
            .map((n) => {
              const heading = group !== n.group;
              group = n.group;
              return (
                <div key={n.id}>
                  {heading && <p className="nav-group">{n.group}</p>}
                  <NavLink
                    aria-label={n.label}
                    title={n.label}
                    end={n.path === '/app'}
                    to={scopedUrl(n.path)}
                    onClick={() => setOpen(false)}
                    className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                  >
                    <n.icon size={19} />
                    <span>{n.label}</span>
                  </NavLink>
                </div>
              );
            })}
        </nav>
        <div className="sidebar-foot">
          <LockSimple size={17} />
          <span>
            Read-only access<small>Source records stay unchanged</small>
          </span>
        </div>
      </aside>
      <div className="app-body" inert={open ? true : undefined}>
        <header className="utility-bar">
          <button
            ref={menu}
            className="menu-button icon-button"
            aria-label="Open navigation"
            aria-expanded={open}
            onClick={() => setOpen(true)}
          >
            <List size={24} />
          </button>
          <div className="branch-control">
            <Buildings size={19} />
            <label htmlFor="branch-select" className="sr-only">
              Branch scope
            </label>
            <select
              id="branch-select"
              value={branchId}
              onChange={(e) => selectBranch(e.target.value)}
            >
              {user.branchIds === 'all' && <option value="all">All authorized branches</option>}
              {user.branchIds !== 'all' && user.branchIds.length > 1 && (
                <option value="all">All assigned branches</option>
              )}
              {scopes.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.id} · {b.name}
                </option>
              ))}
              {!scopes.some((b) => b.id === branchId) && branchId !== 'all' && (
                <option value={branchId}>{branchId}</option>
              )}
            </select>
          </div>
          <span className="demo-tag">DEMO DATA</span>
          <div className="user-block">
            <span className="avatar">
              {user.name
                .split(' ')
                .map((n) => n[0])
                .join('')}
            </span>
            <span>
              {user.name}
              <small>{user.role}</small>
            </span>
          </div>
          <button
            className="icon-button"
            onClick={logout}
            title="Sign out / switch demo role"
            aria-label="Sign out or switch demo role"
          >
            <SignOut size={21} />
          </button>
        </header>
        <div className="freshness-bar">
          <ArrowsClockwise size={15} />
          <span>
            {selected ? (
              <>
                Last successful sync: <strong>{date(selected.lastSync, true)}</strong>
              </>
            ) : (
              <>
                Fixed demo snapshot: <strong>03 Nov 2026 · 12:00 EAT</strong>
              </>
            )}
          </span>
          <span className="freshness-right">
            {!scopes.length ? (
              <>Coverage unavailable</>
            ) : selected ? (
              <Status value={selected.status} />
            ) : (
              <>{stale > 0 ? `${stale} branches need attention` : 'Current within demo snapshot'}</>
            )}
          </span>
        </div>
        <main id="main" ref={main} tabIndex={-1}>
          {restricted ? (
            <Feedback
              kind="denied"
              title="Branch access denied"
              message="Select one of the branches assigned to this demo role."
            />
          ) : (
            <Outlet />
          )}
        </main>
        <footer className="app-footer">
          <span>Fictional data. Candidate modules awaiting legacy validation.</span>
          <details>
            <summary>Demo controls</summary>
            <div>
              <label className="check-label">
                <input type="checkbox" checked={fail} onChange={(e) => setFail(e.target.checked)} />{' '}
                Simulate read-service failure
              </label>
              <Link to="/login">
                Switch persona <ArrowUpRight size={13} />
              </Link>
            </div>
          </details>
        </footer>
      </div>
    </div>
  );
}
