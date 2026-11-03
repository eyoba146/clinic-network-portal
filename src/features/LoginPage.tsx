import { useState } from 'react';
import { ArrowRight, LockSimple, Buildings, ShieldCheck } from '@phosphor-icons/react';
import { usePortal } from '../app/providers';
import { personas } from '../domain/permissions';
import type { RoleId } from '../domain/types';
export function LoginPage() {
  const { login, expired } = usePortal();
  const [role, setRole] = useState<RoleId>('hq');
  const persona = personas.find((p) => p.id === role)!;
  return (
    <div className="login-page">
      <section className="login-story">
        <div className="brand">
          <span className="brand-mark">
            cn<span>+</span>
          </span>
          <span>
            Clinic Network<small>INFORMATION PORTAL</small>
          </span>
        </div>
        <div className="login-copy">
          <p className="eyebrow">ONE NETWORK. A SHARED PICTURE.</p>
          <h1>
            Local care.
            <br />
            Central insight.
          </h1>
          <p>
            A considered workspace for exploring information across 54 independent clinic branches.
          </p>
          <div className="login-facts">
            <span>
              <Buildings size={20} />
              54 branch installations
            </span>
            <span>
              <LockSimple size={20} />
              Read-only source records
            </span>
            <span>
              <ShieldCheck size={20} />
              Role and branch scoped views
            </span>
          </div>
        </div>
        <p className="small-note">Prototype v0.1 · Fictional organization and records</p>
      </section>
      <main className="login-form">
        <span className="demo-tag">DEMO ENVIRONMENT</span>
        <h2>Enter your workspace</h2>
        <p>Choose a demonstration role to explore its permitted branches and information.</p>
        {expired && (
          <p className="notice" role="status">
            Your two-hour demo session expired. Choose a role to start a new session.
          </p>
        )}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            login(role);
          }}
        >
          <fieldset>
            <legend>Demo role</legend>
            {personas.map((p) => (
              <label key={p.id} className={`persona-option ${p.id === role ? 'selected' : ''}`}>
                <input
                  type="radio"
                  name="role"
                  value={p.id}
                  checked={p.id === role}
                  onChange={() => setRole(p.id)}
                />
                <span>
                  <strong>{p.role}</strong>
                  <small>
                    {p.branchIds === 'all'
                      ? 'All 54 branches'
                      : p.branchIds.length === 1
                        ? 'Branch 12 only'
                        : `${p.branchIds.length} assigned branches`}
                    {p.id === 'finance'
                      ? ' · Financial information only'
                      : p.id === 'executive'
                        ? ' · Clinical details restricted'
                        : ''}
                  </small>
                </span>
              </label>
            ))}
          </fieldset>
          <button className="button login-submit" type="submit">
            Continue as {persona.role.split(' / ')[0]}
            <ArrowRight size={18} />
          </button>
        </form>
        <p className="login-disclaimer">
          No password is needed. These personas are fictional; this does not implement production
          authentication or MFA.
        </p>
      </main>
    </div>
  );
}
