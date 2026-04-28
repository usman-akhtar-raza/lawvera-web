'use client';

import Link from 'next/link';
import { Suspense, useEffect } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight, Eye, Search, Users, X } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import { getDashboardRouteForRole } from '@/lib/dashboard-route';
import { getRoleDisplayName } from '@/lib/role-display';
import { isAdminRole } from '@/lib/role-utils';
import { type User, type UserRole } from '@/types';

const PAGE_SIZE = 50;

const formatDate = (value?: string) => {
  if (!value) {
    return 'N/A';
  }

  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
  }).format(new Date(value));
};

const getRoleBadgeClass = (role: UserRole) => {
  if (role === 'super_admin') {
    return 'border-rose-500/20 bg-rose-500/10 text-rose-300';
  }

  if (role === 'admin') {
    return 'border-sky-500/20 bg-sky-500/10 text-sky-300';
  }

  if (role === 'lawyer') {
    return 'border-emerald-500/20 bg-emerald-500/10 text-emerald-300';
  }

  return 'border-[#d5b47f]/30 bg-[var(--brand-accent-soft)] text-[#b07a43]';
};

const parsePage = (value: string | null) => {
  const parsedValue = Number(value);
  if (!Number.isFinite(parsedValue) || parsedValue < 1) {
    return 1;
  }

  return Math.floor(parsedValue);
};

export default function AdminUsersPage() {
  return (
    <Suspense fallback={<AdminUsersPageFallback />}>
      <AdminUsersPageContent />
    </Suspense>
  );
}

function AdminUsersPageContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user, isAuthenticated, isLoading: authLoading } = useAuthStore();
  const hasAdminAccess = isAdminRole(user?.role);
  const currentPage = parsePage(searchParams.get('page'));
  const currentSearch = searchParams.get('search')?.trim() || undefined;

  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (!isAuthenticated) {
      const redirectTarget = `${pathname}${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
      router.push(`/auth/login?redirect=${encodeURIComponent(redirectTarget)}`);
      return;
    }

    if (user && !hasAdminAccess) {
      router.push(getDashboardRouteForRole(user.role));
    }
  }, [
    authLoading,
    hasAdminAccess,
    isAuthenticated,
    pathname,
    router,
    searchParams,
    user,
  ]);

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['admin-users', currentPage, currentSearch],
    queryFn: () =>
      api.searchUsers({
        page: currentPage,
        limit: PAGE_SIZE,
        search: currentSearch,
      }),
    enabled: isAuthenticated && hasAdminAccess,
  });

  const navigateToUsers = (page: number, search?: string) => {
    const params = new URLSearchParams();

    if (page > 1) {
      params.set('page', String(page));
    }

    if (search) {
      params.set('search', search);
    }

    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname);
  };

  const handleSearchSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const searchValue = formData.get('search');
    const search =
      typeof searchValue === 'string' ? searchValue.trim() || undefined : undefined;
    navigateToUsers(1, search);
  };

  const buildUserHref = (account: User) => {
    const params = new URLSearchParams();

    if (currentPage > 1) {
      params.set('page', String(currentPage));
    }

    if (currentSearch) {
      params.set('search', currentSearch);
    }

    const query = params.toString();
    return query
      ? `/dashboard/admin/users/${account._id}?${query}`
      : `/dashboard/admin/users/${account._id}`;
  };

  if (authLoading || (isLoading && !data)) {
    return (
      <div className="min-h-screen bg-[var(--background-muted)] flex items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-[#d5b47f]" />
      </div>
    );
  }

  if (!isAuthenticated || !hasAdminAccess) {
    return null;
  }

  const accounts = data?.data || [];
  const pagination = data?.meta;
  const totalPages = pagination
    ? Math.max(1, Math.ceil(pagination.total / pagination.limit))
    : 1;
  const visibleFrom =
    pagination && pagination.total > 0
      ? (pagination.page - 1) * pagination.limit + 1
      : 0;
  const visibleTo = pagination
    ? Math.min(pagination.page * pagination.limit, pagination.total)
    : 0;

  return (
    <div className="min-h-screen bg-[var(--background-muted)] py-8 text-[var(--text-primary)]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#d5b47f]/30 bg-[var(--brand-accent-soft)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-[#b07a43]">
              <Users className="h-3.5 w-3.5" />
              Admin Tools
            </div>
            <h1 className="text-3xl font-bold">Users</h1>
            <p className="mt-2 text-[var(--text-secondary)]">
              Search platform accounts and review each user profile in detail.
            </p>
          </div>
          {pagination && (
            <div className="text-sm text-[var(--text-secondary)]">
              Showing {visibleFrom}-{visibleTo} of {pagination.total} users
            </div>
          )}
        </div>

        <div className="brand-card mb-6 p-6">
          <form
            onSubmit={handleSearchSubmit}
            className="flex flex-col gap-3 lg:flex-row lg:items-center"
          >
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[var(--text-muted)]" />
              <input
                key={currentSearch || 'all-users'}
                name="search"
                type="text"
                defaultValue={currentSearch || ''}
                placeholder="Search by name, email, city, phone, or role..."
                className="w-full rounded-xl border border-white/10 bg-[var(--surface-elevated)] py-3 pl-12 pr-4 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[#d5b47f]"
              />
            </div>
            <div className="flex gap-3">
              <button
                type="submit"
                className="rounded-xl bg-gradient-to-r from-[#f3e2c1] via-[#e6c891] to-[#d5b47f] px-5 py-3 text-sm font-semibold text-[#2f2413] shadow-lg shadow-[#d5b47f]/20 transition hover:shadow-[#d5b47f]/40"
              >
                Search
              </button>
              {currentSearch && (
                <button
                  type="button"
                  onClick={() => navigateToUsers(1)}
                  className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-3 text-sm font-medium text-[var(--text-secondary)] transition hover:border-[#d5b47f]/40 hover:text-[#d5b47f]"
                >
                  <X className="h-4 w-4" />
                  Clear
                </button>
              )}
            </div>
          </form>
        </div>

        <div className="brand-card overflow-hidden">
          <div className="flex flex-col gap-2 border-b border-white/10 px-6 py-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-lg font-semibold">User Directory</h2>
              <p className="text-sm text-[var(--text-secondary)]">
                50 users per page with server-side search.
              </p>
            </div>
            {isFetching && (
              <span className="text-sm text-[var(--text-secondary)]">
                Updating results...
              </span>
            )}
          </div>

          {accounts.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <p className="text-lg font-semibold text-[var(--text-primary)]">
                No users found
              </p>
              <p className="mt-2 text-sm text-[var(--text-secondary)]">
                Try a different search term or clear the current filter.
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-white/10 text-sm">
                  <thead className="bg-black/10 text-left text-xs uppercase tracking-[0.14em] text-[var(--text-muted)]">
                    <tr>
                      <th className="px-6 py-4 font-semibold">Name</th>
                      <th className="px-6 py-4 font-semibold">Email</th>
                      <th className="px-6 py-4 font-semibold">Role</th>
                      <th className="px-6 py-4 font-semibold">Status</th>
                      <th className="px-6 py-4 font-semibold">City</th>
                      <th className="px-6 py-4 font-semibold">Joined</th>
                      <th className="px-6 py-4 text-right font-semibold">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {accounts.map((account) => {
                      const isAccountActive = account.isActive !== false;

                      return (
                        <tr
                          key={account._id}
                          className="transition-colors hover:bg-white/5"
                        >
                        <td className="px-6 py-4">
                          <div className="font-semibold text-[var(--text-primary)]">
                            <Link
                              href={buildUserHref(account)}
                              className="transition hover:text-[#d5b47f]"
                            >
                              {account.name}
                            </Link>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-[var(--text-secondary)]">
                          {account.email}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] ${getRoleBadgeClass(account.role)}`}
                          >
                            {getRoleDisplayName(account.role)}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] ${
                              isAccountActive
                                ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-300'
                                : 'border-amber-500/20 bg-amber-500/10 text-amber-300'
                            }`}
                          >
                            {isAccountActive ? 'Active' : 'Disabled'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-[var(--text-secondary)]">
                          {account.city || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-[var(--text-secondary)]">
                          {formatDate(account.createdAt)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex justify-end">
                            <Link
                              href={buildUserHref(account)}
                              className="inline-flex min-w-[6.5rem] shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-lg border border-white/10 px-3 py-2 text-sm font-medium text-[var(--text-secondary)] transition hover:border-[#d5b47f]/40 hover:text-[#d5b47f]"
                            >
                              <Eye className="h-4 w-4 shrink-0" />
                              View
                            </Link>
                          </div>
                        </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {pagination && pagination.total > pagination.limit && (
                <div className="flex flex-col gap-4 border-t border-white/10 px-6 py-4 md:flex-row md:items-center md:justify-between">
                  <div className="text-sm text-[var(--text-secondary)]">
                    Page {pagination.page} of {totalPages}
                  </div>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() =>
                        navigateToUsers(
                          Math.max(1, pagination.page - 1),
                          currentSearch,
                        )
                      }
                      disabled={pagination.page === 1}
                      className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-4 py-2 text-sm font-medium text-[var(--text-secondary)] transition hover:border-[#d5b47f]/40 hover:text-[#d5b47f] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        navigateToUsers(
                          Math.min(totalPages, pagination.page + 1),
                          currentSearch,
                        )
                      }
                      disabled={pagination.page >= totalPages}
                      className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-4 py-2 text-sm font-medium text-[var(--text-secondary)] transition hover:border-[#d5b47f]/40 hover:text-[#d5b47f] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function AdminUsersPageFallback() {
  return (
    <div className="min-h-screen bg-[var(--background-muted)] flex items-center justify-center">
      <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-[#d5b47f]" />
    </div>
  );
}
