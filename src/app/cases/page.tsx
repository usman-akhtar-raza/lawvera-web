'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Briefcase, Plus, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import { CaseStatus, UserRole } from '@/types';
import type { LegalCase } from '@/types';
import { format } from 'date-fns';
import { asUser, asLawyerProfile } from '@/lib/type-guards';

const STATUS_CONFIG: Record<CaseStatus, { label: string; color: string; bg: string }> = {
  [CaseStatus.OPEN]: { label: 'Open', color: 'text-blue-600', bg: 'bg-blue-100' },
  [CaseStatus.ASSIGNED]: { label: 'Assigned', color: 'text-purple-600', bg: 'bg-purple-100' },
  [CaseStatus.IN_PROGRESS]: { label: 'In Progress', color: 'text-yellow-700', bg: 'bg-yellow-100' },
  [CaseStatus.RESOLVED]: { label: 'Resolved', color: 'text-green-700', bg: 'bg-green-100' },
  [CaseStatus.CLOSED]: { label: 'Closed', color: 'text-gray-600', bg: 'bg-gray-200' },
};

function StatusBadge({ status }: { status: CaseStatus }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG[CaseStatus.OPEN];
  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${config.color} ${config.bg}`}>
      {config.label}
    </span>
  );
}

export default function CasesPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuthStore();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/auth/login?redirect=/cases');
    }
  }, [isAuthenticated, authLoading, router]);

  const isLawyer = user?.role === UserRole.LAWYER;
  const isAdmin = user?.role === UserRole.ADMIN;
  const isClient = user?.role === UserRole.CLIENT;

  const { data: cases, isLoading } = useQuery({
    queryKey: ['my-cases', user?.role],
    queryFn: () => {
      if (isLawyer) return api.getLawyerCases();
      if (isAdmin) return api.getAllCases();
      return api.getClientCases();
    },
    enabled: isAuthenticated,
  });

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-[var(--background-muted)] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#d5b47f]"></div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  const active = cases?.filter((c: LegalCase) =>
    [CaseStatus.OPEN, CaseStatus.ASSIGNED, CaseStatus.IN_PROGRESS].includes(c.status),
  ) || [];
  const resolved = cases?.filter((c: LegalCase) =>
    [CaseStatus.RESOLVED, CaseStatus.CLOSED].includes(c.status),
  ) || [];

  return (
    <div className="min-h-screen bg-[var(--background-muted)] py-8 text-[var(--text-primary)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">My Cases</h1>
            <p className="text-[var(--text-secondary)] mt-1">
              {isAdmin
                ? 'All platform cases'
                : isLawyer
                  ? 'Manage your assigned cases'
                  : 'Track and manage your legal cases'}
            </p>
          </div>
          {isClient && (
            <Link
              href="/cases/new"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold bg-gradient-to-r from-[#f3e2c1] to-[#d5b47f] text-[#1b1205] hover:shadow-lg hover:shadow-[#d5b47f]/40"
            >
              <Plus className="h-4 w-4" />
              Create Case
            </Link>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="brand-card p-6">
            <div className="flex items-center">
              <div className="bg-white/5 border border-white/10 p-3 rounded-full">
                <AlertCircle className="h-6 w-6 text-[#d5b47f]" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-[var(--text-secondary)]">Active</p>
                <p className="text-2xl font-bold">{active.length}</p>
              </div>
            </div>
          </div>
          <div className="brand-card p-6">
            <div className="flex items-center">
              <div className="bg-white/5 border border-white/10 p-3 rounded-full">
                <CheckCircle className="h-6 w-6 text-[#46d3a1]" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-[var(--text-secondary)]">Resolved</p>
                <p className="text-2xl font-bold">{resolved.length}</p>
              </div>
            </div>
          </div>
          <div className="brand-card p-6">
            <div className="flex items-center">
              <div className="bg-white/5 border border-white/10 p-3 rounded-full">
                <Briefcase className="h-6 w-6 text-[#9d85ff]" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-[var(--text-secondary)]">Total</p>
                <p className="text-2xl font-bold">{cases?.length || 0}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Active Cases */}
        <div className="brand-card p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">
            {isLawyer ? 'My Assigned Cases' : 'Active Cases'}
          </h2>
          {active.length > 0 ? (
            <div className="space-y-4">
              {active.map((c: LegalCase) => (
                <CaseCard
                  key={c._id}
                  legalCase={c}
                  userRole={user?.role}
                />
              ))}
            </div>
          ) : (
            <p className="text-[var(--text-muted)]">No active cases</p>
          )}
        </div>

        {/* Resolved / Closed */}
        {resolved.length > 0 && (
          <div className="brand-card p-6">
            <h2 className="text-xl font-semibold mb-4">Resolved & Closed</h2>
            <div className="space-y-4">
              {resolved.map((c: LegalCase) => (
                <CaseCard
                  key={c._id}
                  legalCase={c}
                  userRole={user?.role}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function CaseCard({
  legalCase,
  userRole,
}: {
  legalCase: LegalCase;
  userRole?: UserRole;
}) {
  const lawyer = asLawyerProfile(legalCase.lawyer);
  const lawyerUser = asUser(lawyer?.user);
  const client = asUser(legalCase.client);
  const isLawyer = userRole === UserRole.LAWYER;
  const isAdmin = userRole === UserRole.ADMIN;
  const isLiveOpenCase = isLawyer && legalCase.status === CaseStatus.OPEN && !lawyer;

  return (
    <Link
      href={`/cases/${legalCase._id}`}
      className="block border border-white/10 rounded-lg p-4 bg-white/5 hover:border-[#d5b47f]/40 transition-colors"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-1">
            <h3 className="font-semibold text-lg">{legalCase.title}</h3>
            <StatusBadge status={legalCase.status} />
          </div>
          <p className="text-sm text-[var(--text-secondary)] capitalize mb-2">
            {legalCase.category.replace('_', ' ')}
          </p>
          <p className="text-sm text-[var(--text-muted)] line-clamp-2">
            {legalCase.description}
          </p>
          <div className="flex items-center gap-4 mt-3 text-xs text-[var(--text-muted)]">
            {isLawyer && client && (
              <span>Client: {client.name}</span>
            )}
            {isLiveOpenCase && (
              <span>Live case: accepting lawyer requests</span>
            )}
            {!isLawyer && lawyerUser && (
              <span>Lawyer: {lawyerUser.name}</span>
            )}
            {isAdmin && client && (
              <span>Client: {client.name}</span>
            )}
            {legalCase.createdAt && (
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {format(new Date(legalCase.createdAt), 'MMM d, yyyy')}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
