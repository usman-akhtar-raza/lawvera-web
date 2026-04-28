import { UserRole } from '@/types';

export const isAdminRole = (role?: UserRole | string | null): boolean =>
  role === UserRole.ADMIN ||
  role === UserRole.SUPER_ADMIN ||
  role === 'admin' ||
  role === 'super_admin';
