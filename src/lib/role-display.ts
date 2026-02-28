import { UserRole } from '@/types';

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

  if (role === UserRole.ADMIN || role === 'admin') {
    return 'Admin';
  }

  return role.charAt(0).toUpperCase() + role.slice(1);
};
