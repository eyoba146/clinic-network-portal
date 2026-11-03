import type { DemoUser, Module, RoleId } from './types';
export const allModules: Module[] = [
  'overview',
  'branches',
  'patients',
  'visits',
  'appointments',
  'laboratory',
  'pharmacy',
  'billing',
  'reports',
  'staff',
  'sync-health',
  'access',
  'audit',
];
const assigned = Array.from({ length: 12 }, (_, i) => `BR-${String(i + 1).padStart(3, '0')}`);
export const personas: DemoUser[] = [
  {
    id: 'hq',
    name: 'Selam Tesfaye',
    role: 'HQ Administrator',
    branchIds: 'all',
    modules: allModules,
    allowRestricted: true,
  },
  {
    id: 'executive',
    name: 'Dawit Mekonnen',
    role: 'Executive / General Manager',
    branchIds: 'all',
    modules: ['overview', 'branches', 'appointments', 'billing', 'reports', 'staff'],
    allowRestricted: false,
  },
  {
    id: 'regional',
    name: 'Hana Bekele',
    role: 'Regional Manager',
    branchIds: assigned,
    modules: [
      'overview',
      'branches',
      'patients',
      'visits',
      'appointments',
      'laboratory',
      'pharmacy',
      'billing',
      'reports',
      'staff',
    ],
    allowRestricted: false,
  },
  {
    id: 'branch',
    name: 'Yonas Tadesse',
    role: 'Branch Manager',
    branchIds: ['BR-012'],
    modules: [
      'overview',
      'branches',
      'patients',
      'visits',
      'appointments',
      'laboratory',
      'pharmacy',
      'billing',
      'reports',
      'staff',
    ],
    allowRestricted: false,
  },
  {
    id: 'finance',
    name: 'Meron Alemu',
    role: 'Finance Officer',
    branchIds: assigned,
    modules: ['billing', 'reports'],
    allowRestricted: false,
  },
  {
    id: 'clinical',
    name: 'Abel Getachew',
    role: 'Clinical Supervisor',
    branchIds: assigned,
    modules: ['overview', 'branches', 'patients', 'visits', 'laboratory', 'pharmacy'],
    allowRestricted: false,
  },
];
export const can = (user: DemoUser, module: Module) => user.modules.includes(module);
export const canBranch = (user: DemoUser, id: string) =>
  user.branchIds === 'all' || user.branchIds.includes(id);
export const getPersona = (id: RoleId) => personas.find((p) => p.id === id) ?? personas[0];
export const landing = (user: DemoUser) => (can(user, 'overview') ? '/app' : '/app/billing');
