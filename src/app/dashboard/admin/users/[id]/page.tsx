'use client';

import Link from 'next/link';
import { Suspense, useEffect, useState } from 'react';
import {
  useParams,
  usePathname,
  useRouter,
  useSearchParams,
} from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  Ban,
  BadgeDollarSign,
  Briefcase,
  Calendar,
  GraduationCap,
  Mail,
  MapPin,
  Phone,
  Save,
  Shield,
  Star,
  Trash2,
} from 'lucide-react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import { getDashboardRouteForRole } from '@/lib/dashboard-route';
import { getErrorMessage } from '@/lib/error-message';
import { getRoleDisplayName } from '@/lib/role-display';
import { isAdminRole } from '@/lib/role-utils';
import { UserRole } from '@/types';
import toast from 'react-hot-toast';

const formatDate = (value?: string) => {
  if (!value) {
    return 'N/A';
  }

  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
};

const formatCurrency = (value?: number) => {
  if (value === undefined) {
    return 'N/A';
  }

  return new Intl.NumberFormat('en-PK', {
    style: 'currency',
    currency: 'PKR',
    maximumFractionDigits: 0,
  }).format(value);
};

const getRoleBadgeClass = (role?: UserRole) => {
  if (role === UserRole.SUPER_ADMIN) {
    return 'border-rose-500/20 bg-rose-500/10 text-rose-300';
  }

  if (role === UserRole.ADMIN) {
    return 'border-sky-500/20 bg-sky-500/10 text-sky-300';
  }

  if (role === UserRole.LAWYER) {
    return 'border-emerald-500/20 bg-emerald-500/10 text-emerald-300';
  }

  return 'border-[#d5b47f]/30 bg-[var(--brand-accent-soft)] text-[#b07a43]';
};

export default function AdminUserDetailPage() {
  return (
    <Suspense fallback={<AdminUserDetailPageFallback />}>
      <AdminUserDetailPageContent />
    </Suspense>
  );
}

function AdminUserDetailPageContent() {
  const params = useParams<{ id: string }>();
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const { user, isAuthenticated, isLoading: authLoading } = useAuthStore();
  const hasAdminAccess = isAdminRole(user?.role);
  const userId = Array.isArray(params.id) ? params.id[0] : params.id;
  const [roleDraft, setRoleDraft] = useState<{
    userId: string;
    role: UserRole;
  } | null>(null);
  const [isSavingRole, setIsSavingRole] = useState(false);
  const [isSavingStatus, setIsSavingStatus] = useState(false);
  const [isDeletingUser, setIsDeletingUser] = useState(false);

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

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['admin-user-detail', userId],
    queryFn: () => api.getUserById(userId),
    enabled: Boolean(userId) && isAuthenticated && hasAdminAccess,
  });

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-[var(--background-muted)] flex items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-[#d5b47f]" />
      </div>
    );
  }

  if (!isAuthenticated || !hasAdminAccess || !data) {
    return null;
  }

  const backParams = new URLSearchParams();
  const pageParam = searchParams.get('page');
  const searchParam = searchParams.get('search');

  if (pageParam) {
    backParams.set('page', pageParam);
  }

  if (searchParam) {
    backParams.set('search', searchParam);
  }

  const backHref = backParams.toString()
    ? `/dashboard/admin/users?${backParams.toString()}`
    : '/dashboard/admin/users';
  const account = data.user;
  const lawyerProfile = data.lawyerProfile;
  const isAccountActive = account.isActive !== false;
  const displayedRole =
    roleDraft?.userId === account._id ? roleDraft.role : account.role;
  const isSuperAdminViewer = user?.role === UserRole.SUPER_ADMIN;
  const isAdminTarget = account.role === UserRole.ADMIN;
  const isSuperAdminTarget = account.role === UserRole.SUPER_ADMIN;
  const isStandardTarget =
    account.role === UserRole.CLIENT || account.role === UserRole.LAWYER;
  const canManageAdminTarget = isSuperAdminViewer && isAdminTarget;
  const canManageStatus = isStandardTarget || canManageAdminTarget;
  const canDeleteUser = isStandardTarget || canManageAdminTarget;
  const canManageRole = isStandardTarget;
  const canRestoreLawyerRole =
    account.role === UserRole.LAWYER || Boolean(lawyerProfile);
  const isRoleUnchanged = displayedRole === account.role;

  const syncUserQueries = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['admin-users'] }),
      queryClient.invalidateQueries({ queryKey: ['admin-user-detail', userId] }),
      refetch(),
    ]);
  };

  const handleRoleSave = async () => {
    if (isRoleUnchanged) {
      return;
    }

    setIsSavingRole(true);
    try {
      await api.updateManagedUserRole(account._id, displayedRole);
      toast.success(
        displayedRole === UserRole.LAWYER
          ? 'User switched to lawyer'
          : 'Lawyer switched to user',
      );
      await syncUserQueries();
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, 'Failed to update user role'));
    } finally {
      setIsSavingRole(false);
    }
  };

  const handleStatusToggle = async () => {
    const nextStatus = !isAccountActive;
    const confirmationMessage = nextStatus
      ? 'Enable this account again?'
      : 'Disable this account and block access?';

    if (!window.confirm(confirmationMessage)) {
      return;
    }

    setIsSavingStatus(true);
    try {
      await api.updateManagedUserStatus(account._id, nextStatus);
      toast.success(nextStatus ? 'Account enabled' : 'Account disabled');
      await syncUserQueries();
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, 'Failed to update account status'));
    } finally {
      setIsSavingStatus(false);
    }
  };

  const handleDeleteUser = async () => {
    if (
      !window.confirm(
        `Delete ${account.name}? This only works when the account has no linked platform records.`,
      )
    ) {
      return;
    }

    setIsDeletingUser(true);
    try {
      await api.deleteManagedUser(account._id);
      await queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success('User deleted');
      router.push(backHref);
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, 'Failed to delete user'));
    } finally {
      setIsDeletingUser(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--background-muted)] py-8 text-[var(--text-primary)]">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Link
            href={backHref}
            className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-[var(--text-secondary)] transition hover:text-[#d5b47f]"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to users
          </Link>
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="text-3xl font-bold">{account.name}</h1>
              <p className="mt-2 text-[var(--text-secondary)]">
                Review account information and role-specific details.
              </p>
            </div>
            <span
              className={`inline-flex rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] ${getRoleBadgeClass(account.role)}`}
            >
              {getRoleDisplayName(account.role)}
            </span>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="space-y-6">
            <section className="brand-card p-6">
              <div className="mb-5 flex items-center gap-3">
                <Shield className="h-5 w-5 text-[#d5b47f]" />
                <h2 className="text-xl font-semibold">Account Overview</h2>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-white/10 bg-[var(--surface-elevated)] p-4">
                  <p className="text-xs uppercase tracking-[0.12em] text-[var(--text-muted)]">
                    Email
                  </p>
                  <p className="mt-2 flex items-center gap-2 text-sm text-[var(--text-primary)]">
                    <Mail className="h-4 w-4 text-[#d5b47f]" />
                    {account.email}
                  </p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-[var(--surface-elevated)] p-4">
                  <p className="text-xs uppercase tracking-[0.12em] text-[var(--text-muted)]">
                    Phone
                  </p>
                  <p className="mt-2 flex items-center gap-2 text-sm text-[var(--text-primary)]">
                    <Phone className="h-4 w-4 text-[#d5b47f]" />
                    {account.phone || 'N/A'}
                  </p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-[var(--surface-elevated)] p-4">
                  <p className="text-xs uppercase tracking-[0.12em] text-[var(--text-muted)]">
                    City
                  </p>
                  <p className="mt-2 flex items-center gap-2 text-sm text-[var(--text-primary)]">
                    <MapPin className="h-4 w-4 text-[#d5b47f]" />
                    {account.city || 'N/A'}
                  </p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-[var(--surface-elevated)] p-4">
                  <p className="text-xs uppercase tracking-[0.12em] text-[var(--text-muted)]">
                    Joined
                  </p>
                  <p className="mt-2 flex items-center gap-2 text-sm text-[var(--text-primary)]">
                    <Calendar className="h-4 w-4 text-[#d5b47f]" />
                    {formatDate(account.createdAt)}
                  </p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-[var(--surface-elevated)] p-4">
                  <p className="text-xs uppercase tracking-[0.12em] text-[var(--text-muted)]">
                    Account Status
                  </p>
                  <p className="mt-2 text-sm text-[var(--text-primary)]">
                    {isAccountActive ? 'Active' : 'Disabled'}
                  </p>
                </div>
              </div>
            </section>

            {lawyerProfile ? (
              <section className="brand-card p-6">
                <div className="mb-5 flex items-center gap-3">
                  <Briefcase className="h-5 w-5 text-[#d5b47f]" />
                  <h2 className="text-xl font-semibold">Lawyer Profile</h2>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-2xl border border-white/10 bg-[var(--surface-elevated)] p-4">
                    <p className="text-xs uppercase tracking-[0.12em] text-[var(--text-muted)]">
                      Specialization
                    </p>
                    <p className="mt-2 text-sm text-[var(--text-primary)]">
                      {lawyerProfile.specialization}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-[var(--surface-elevated)] p-4">
                    <p className="text-xs uppercase tracking-[0.12em] text-[var(--text-muted)]">
                      Experience
                    </p>
                    <p className="mt-2 text-sm text-[var(--text-primary)]">
                      {lawyerProfile.experienceYears} years
                    </p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-[var(--surface-elevated)] p-4">
                    <p className="text-xs uppercase tracking-[0.12em] text-[var(--text-muted)]">
                      Consultation Fee
                    </p>
                    <p className="mt-2 flex items-center gap-2 text-sm text-[var(--text-primary)]">
                      <BadgeDollarSign className="h-4 w-4 text-[#d5b47f]" />
                      {formatCurrency(lawyerProfile.consultationFee)}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-[var(--surface-elevated)] p-4">
                    <p className="text-xs uppercase tracking-[0.12em] text-[var(--text-muted)]">
                      Rating
                    </p>
                    <p className="mt-2 flex items-center gap-2 text-sm text-[var(--text-primary)]">
                      <Star className="h-4 w-4 text-[#d5b47f]" />
                      {lawyerProfile.ratingAverage.toFixed(1)} from{' '}
                      {lawyerProfile.ratingCount} reviews
                    </p>
                  </div>
                </div>

                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <div className="rounded-2xl border border-white/10 bg-[var(--surface-elevated)] p-4">
                    <p className="text-xs uppercase tracking-[0.12em] text-[var(--text-muted)]">
                      Education
                    </p>
                    <p className="mt-2 flex items-start gap-2 text-sm text-[var(--text-primary)]">
                      <GraduationCap className="mt-0.5 h-4 w-4 text-[#d5b47f]" />
                      <span>{lawyerProfile.education || 'N/A'}</span>
                    </p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-[var(--surface-elevated)] p-4">
                    <p className="text-xs uppercase tracking-[0.12em] text-[var(--text-muted)]">
                      Profile Status
                    </p>
                    <p className="mt-2 text-sm text-[var(--text-primary)]">
                      {lawyerProfile.status.replace('_', ' ')}
                    </p>
                  </div>
                </div>

                <div className="mt-4 rounded-2xl border border-white/10 bg-[var(--surface-elevated)] p-4">
                  <p className="text-xs uppercase tracking-[0.12em] text-[var(--text-muted)]">
                    Description
                  </p>
                  <p className="mt-2 text-sm leading-6 text-[var(--text-primary)]">
                    {lawyerProfile.description || 'No lawyer description provided.'}
                  </p>
                </div>
              </section>
            ) : account.role === UserRole.LAWYER ? (
              <section className="brand-card p-6">
                <h2 className="text-xl font-semibold">Lawyer Profile</h2>
                <p className="mt-2 text-sm text-[var(--text-secondary)]">
                  This account is marked as a lawyer, but no lawyer profile record is
                  currently attached.
                </p>
              </section>
            ) : null}
          </div>

          <div className="space-y-6">
            <section className="brand-card p-6">
              <div className="mb-5 flex items-center gap-3">
                <Shield className="h-5 w-5 text-[#d5b47f]" />
                <h2 className="text-xl font-semibold">User Management</h2>
              </div>

              {canManageRole ? (
                <div className="rounded-2xl border border-white/10 bg-[var(--surface-elevated)] p-4">
                  <p className="text-xs uppercase tracking-[0.12em] text-[var(--text-muted)]">
                    Role
                  </p>
                  <div className="mt-3 flex flex-col gap-3">
                    <select
                      value={displayedRole}
                      onChange={(event) =>
                        setRoleDraft({
                          userId: account._id,
                          role: event.target.value as UserRole,
                        })
                      }
                      className="rounded-xl border border-white/10 bg-black/10 px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[#d5b47f]"
                    >
                      <option value={UserRole.CLIENT}>User</option>
                      <option
                        value={UserRole.LAWYER}
                        disabled={!canRestoreLawyerRole}
                      >
                        Lawyer
                      </option>
                    </select>
                    <button
                      type="button"
                      onClick={handleRoleSave}
                      disabled={isRoleUnchanged || isSavingRole}
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#f3e2c1] to-[#d5b47f] px-4 py-2 text-sm font-semibold text-[#1b1205] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <Save className="h-4 w-4" />
                      {isSavingRole ? 'Saving Role...' : 'Save Role'}
                    </button>
                  </div>
                  {!canRestoreLawyerRole && (
                    <p className="mt-3 text-sm text-[var(--text-secondary)]">
                      Lawyer access can only be restored when this account already
                      has a saved lawyer profile.
                    </p>
                  )}
                </div>
              ) : (
                <div className="rounded-2xl border border-white/10 bg-[var(--surface-elevated)] p-4 text-sm text-[var(--text-secondary)]">
                  {isAdminTarget
                    ? isSuperAdminViewer
                      ? 'Admin accounts can be disabled or deleted by a super admin, but their role cannot be changed here.'
                      : 'Only a super admin can manage another admin account.'
                    : isSuperAdminTarget
                      ? 'Super admin accounts cannot be managed from this tool.'
                      : 'Role management is only available for user and lawyer accounts.'}
                </div>
              )}

              <div className="mt-4 grid gap-4">
                {canManageStatus && (
                  <button
                    type="button"
                    onClick={handleStatusToggle}
                    disabled={isSavingStatus}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm font-semibold text-amber-200 transition hover:bg-amber-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Ban className="h-4 w-4" />
                    {isSavingStatus
                      ? isAccountActive
                        ? 'Disabling...'
                        : 'Enabling...'
                      : isAccountActive
                        ? 'Disable Account'
                        : 'Enable Account'}
                  </button>
                )}

                {canDeleteUser && (
                  <button
                    type="button"
                    onClick={handleDeleteUser}
                    disabled={isDeletingUser}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-200 transition hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Trash2 className="h-4 w-4" />
                    {isDeletingUser ? 'Deleting...' : 'Delete Account'}
                  </button>
                )}
              </div>

              <p className="mt-4 text-sm text-[var(--text-secondary)]">
                Delete only works for accounts without linked bookings, cases,
                messages, or saved legal activity. Use disable for moderation when
                records must be preserved.
              </p>
            </section>

            <section className="brand-card p-6">
              <h2 className="text-xl font-semibold">Audit Details</h2>
              <div className="mt-4 space-y-4">
                <div className="rounded-2xl border border-white/10 bg-[var(--surface-elevated)] p-4">
                  <p className="text-xs uppercase tracking-[0.12em] text-[var(--text-muted)]">
                    Account ID
                  </p>
                  <p className="mt-2 break-all text-sm text-[var(--text-primary)]">
                    {account._id}
                  </p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-[var(--surface-elevated)] p-4">
                  <p className="text-xs uppercase tracking-[0.12em] text-[var(--text-muted)]">
                    Last Updated
                  </p>
                  <p className="mt-2 text-sm text-[var(--text-primary)]">
                    {formatDate(account.updatedAt)}
                  </p>
                </div>
                {lawyerProfile && (
                  <div className="rounded-2xl border border-white/10 bg-[var(--surface-elevated)] p-4">
                    <p className="text-xs uppercase tracking-[0.12em] text-[var(--text-muted)]">
                      Availability
                    </p>
                    {lawyerProfile.availability.length > 0 ? (
                      <div className="mt-3 space-y-2">
                        {lawyerProfile.availability.map((slot) => (
                          <div
                            key={slot.day}
                            className="rounded-xl border border-white/10 px-3 py-2 text-sm text-[var(--text-primary)]"
                          >
                            <span className="font-semibold">{slot.day}:</span>{' '}
                            {slot.slots.join(', ')}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="mt-2 text-sm text-[var(--text-secondary)]">
                        No availability configured.
                      </p>
                    )}
                  </div>
                )}
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

function AdminUserDetailPageFallback() {
  return (
    <div className="min-h-screen bg-[var(--background-muted)] flex items-center justify-center">
      <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-[#d5b47f]" />
    </div>
  );
}
