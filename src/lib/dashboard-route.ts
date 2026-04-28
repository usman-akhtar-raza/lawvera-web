import { UserRole } from '@/types';

type AppRole = UserRole | 'client' | 'lawyer' | 'admin' | null | undefined;

export const getDashboardRouteForRole = (role: AppRole): string => {
  if (role === UserRole.ADMIN || role === 'admin') {
    return '/dashboard/admin';
  }

  if (role === UserRole.LAWYER || role === 'lawyer') {
    return '/dashboard/lawyer';
  }

  return '/dashboard/client';
};

export const getPostLoginRedirect = (
  role: AppRole,
  requestedRedirect?: string | null,
): string => {
  const defaultDashboardRoute = getDashboardRouteForRole(role);

  if (!requestedRedirect || !requestedRedirect.startsWith('/')) {
    return defaultDashboardRoute;
  }

  if (requestedRedirect.startsWith('//')) {
    return defaultDashboardRoute;
  }

  if (requestedRedirect.startsWith('/dashboard/')) {
    return requestedRedirect === defaultDashboardRoute
      ? requestedRedirect
      : defaultDashboardRoute;
  }

  return requestedRedirect;
};
