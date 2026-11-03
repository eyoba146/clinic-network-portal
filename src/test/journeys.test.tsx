import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { App } from '../app/App';
import { Providers } from '../app/providers';
afterEach(() => {
  cleanup();
  sessionStorage.clear();
});
function mount(path: string, role = 'hq') {
  sessionStorage.setItem(
    'clinic-demo-session',
    JSON.stringify({ role, expiresAt: Date.now() + 60000 }),
  );
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Providers>
        <App />
      </Providers>
    </MemoryRouter>,
  );
}
describe('critical portal journeys', () => {
  it('shows loading then a scoped patient directory and navigates to related visits', async () => {
    const user = userEvent.setup();
    mount('/app/patients?branch=BR-012&q=Selam');
    expect(screen.getByRole('status', { name: 'Loading records' })).toBeInTheDocument();
    const patient = await screen.findByRole('link', { name: /Selam/ });
    await user.click(patient);
    expect(await screen.findByRole('heading', { name: 'Patient profile' })).toBeInTheDocument();
    const related = await screen.findByRole('link', {
      name: /Visits & encounters: Outpatient encounter 1001/,
    });
    await user.click(related);
    expect(
      await screen.findByRole('heading', { name: 'Outpatient encounter 1001' }),
    ).toBeInTheDocument();
    expect(await screen.findByRole('link', { name: /Laboratory: Hemoglobin/ })).toBeInTheDocument();
  });
  it('denies a clinical deep link to a finance role', async () => {
    mount('/app/patients/BR-001%3A1001', 'finance');
    expect(await screen.findByRole('heading', { name: 'Access denied' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Patient profile' })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Patients' })).not.toBeInTheDocument();
  });
  it('renders an empty branch and supports search reset', async () => {
    const user = userEvent.setup();
    mount('/app/patients?branch=BR-012&q=not-a-person');
    expect(
      await screen.findByRole('heading', { name: 'No records in this view' }),
    ).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Clear filters' }));
    expect(await screen.findByRole('link', { name: /Selam/ })).toBeInTheDocument();
  });
  it('changes branch scope through the persistent selector', async () => {
    const user = userEvent.setup();
    mount('/app/patients?branch=BR-001');
    await screen.findByRole('link', { name: /Selam/ });
    await user.selectOptions(screen.getByRole('combobox', { name: 'Branch scope' }), 'BR-054');
    expect(
      await screen.findByRole('heading', { name: 'No records in this view' }),
    ).toBeInTheDocument();
  });
  it('simulates a service error and recovers when the demo control is cleared', async () => {
    const user = userEvent.setup();
    mount('/app/patients?branch=BR-012');
    await screen.findByRole('link', { name: /Selam/ });
    await user.click(screen.getByText('Demo controls'));
    await user.click(screen.getByRole('checkbox', { name: 'Simulate read-service failure' }));
    expect(
      await screen.findByRole('heading', { name: 'Data could not be loaded' }),
    ).toBeInTheDocument();
    await user.click(screen.getByRole('checkbox', { name: 'Simulate read-service failure' }));
    expect(await screen.findByRole('link', { name: /Selam/ })).toBeInTheDocument();
  });
  it('uses local persona login without passwords and supports sign out', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={['/login']}>
        <Providers>
          <App />
        </Providers>
      </MemoryRouter>,
    );
    expect(screen.queryByLabelText(/password/i)).not.toBeInTheDocument();
    await user.click(screen.getByRole('radio', { name: /Finance Officer/ }));
    await user.click(screen.getByRole('button', { name: 'Continue as Finance Officer' }));
    expect(await screen.findByRole('heading', { name: 'Billing & payments' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Sign out or switch demo role' }));
    expect(
      await screen.findByRole('heading', { name: 'Enter your workspace' }),
    ).toBeInTheDocument();
  });
  it('preserves list filters when returning from details', async () => {
    const user = userEvent.setup();
    mount('/app/patients?branch=BR-012&q=Selam');
    await user.click(await screen.findByRole('link', { name: /Selam/ }));
    await screen.findByRole('heading', { name: 'Patient profile' });
    const main = screen.getByRole('main');
    await user.click(within(main).getByRole('link', { name: 'Patients' }));
    await waitFor(() =>
      expect(screen.getByRole('searchbox', { name: 'Search records' })).toHaveValue('Selam'),
    );
  });
});

describe('candidate module routes', () => {
  const modules = [
    ['patients', '1001', 'Patient profile'],
    ['visits', 'V1001', 'Record details'],
    ['appointments', 'A1001', 'Record details'],
    ['laboratory', 'L1001', 'Order and results'],
    ['pharmacy', 'D1001', 'Record details'],
    ['billing', 'I1001', 'Invoice breakdown'],
    ['staff', 'S1', 'Record details'],
  ];
  it.each(modules)('renders the %s directory with actual records', async (module) => {
    mount(`/app/${module}?branch=BR-012`);
    const table = await screen.findByRole('table');
    expect(within(table).getAllByRole('row').length).toBeGreaterThan(1);
    expect(
      within(table)
        .getAllByRole('link')
        .some((link) => link.getAttribute('href')?.includes(`/app/${module}/BR-012`)),
    ).toBe(true);
  });
  it.each(modules)('renders source provenance and details for %s', async (module, key, section) => {
    mount(`/app/${module}/BR-012%3A${key}?branch=BR-001`);
    expect(await screen.findByRole('heading', { name: section })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Source & provenance' })).toBeInTheDocument();
    await waitFor(() =>
      expect(screen.getByRole('combobox', { name: 'Branch scope' })).toHaveValue('BR-012'),
    );
  });
  it('shows the restricted record denial without returning a patient profile', async () => {
    mount('/app/patients/BR-012%3A1012', 'regional');
    expect(await screen.findByRole('heading', { name: 'Access denied' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Patient profile' })).not.toBeInTheDocument();
  });
});
