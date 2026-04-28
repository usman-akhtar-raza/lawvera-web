import { UserRole } from '@/types';
import { isAdminRole } from '@/lib/role-utils';

export const getRoleDisplayName = (role?: UserRole | string | null): string => {
  if (!role) {
    return 'User';
  }

  if (role === UserRole.CLIENT || role === 'client') {
    return 'User';
  }

  if (role === UserRole.LAWYER || role === 'lawyer') {
    return 'Lawyer';
  }

  if (role === UserRole.SUPER_ADMIN || role === 'super_admin') {
    return 'Super Admin';
  }

  if (isAdminRole(role)) {
    return 'Admin';
  }

  return role.charAt(0).toUpperCase() + role.slice(1);
};
