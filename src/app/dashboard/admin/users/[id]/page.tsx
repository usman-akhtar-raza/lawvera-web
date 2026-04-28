'use client';

import Link from 'next/link';
import { Suspense, useEffect } from 'react';
import {
  useParams,
  usePathname,
  useRouter,
  useSearchParams,
} from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft,
  BadgeDollarSign,
  Briefcase,
  Calendar,
  GraduationCap,
  Mail,
  MapPin,
  Phone,
  Shield,
  Star,
} from 'lucide-react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import { getDashboardRouteForRole } from '@/lib/dashboard-route';
import { getRoleDisplayName } from '@/lib/role-display';
import { isAdminRole } from '@/lib/role-utils';
import { UserRole } from '@/types';

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
  const { user, isAuthenticated, isLoading: authLoading } = useAuthStore();
  const hasAdminAccess = isAdminRole(user?.role);
  const userId = Array.isArray(params.id) ? params.id[0] : params.id;

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

  const { data, isLoading } = useQuery({
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
