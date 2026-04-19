'use client';

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { CheckCircle, Clock, Search, Send } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { api } from '@/lib/api';
import { getErrorMessage } from '@/lib/error-message';
import { asUser } from '@/lib/type-guards';
import { useAuthStore } from '@/store/auth';
import { CaseCategory, CaseRequestStatus, CaseStatus, UserRole } from '@/types';
import type { LegalCase } from '@/types';

const STATUS_CONFIG: Record<CaseStatus, { label: string; color: string; bg: string }> = {
  [CaseStatus.OPEN]: { label: 'Open', color: 'text-blue-600', bg: 'bg-blue-100' },
  [CaseStatus.ASSIGNED]: { label: 'Assigned', color: 'text-purple-600', bg: 'bg-purple-100' },
  [CaseStatus.IN_PROGRESS]: { label: 'In Progress', color: 'text-yellow-700', bg: 'bg-yellow-100' },
  [CaseStatus.RESOLVED]: { label: 'Resolved', color: 'text-green-700', bg: 'bg-green-100' },
  [CaseStatus.CLOSED]: { label: 'Closed', color: 'text-gray-600', bg: 'bg-gray-200' },
};

const CATEGORIES: { value: CaseCategory; label: string }[] = [
  { value: CaseCategory.CRIMINAL, label: 'Criminal Law' },
  { value: CaseCategory.FAMILY, label: 'Family Law' },
  { value: CaseCategory.PROPERTY, label: 'Property Law' },
  { value: CaseCategory.CORPORATE, label: 'Corporate Law' },
  { value: CaseCategory.IMMIGRATION, label: 'Immigration Law' },
  { value: CaseCategory.TAX, label: 'Tax Law' },
  { value: CaseCategory.CIVIL, label: 'Civil Law' },
  { value: CaseCategory.LABOUR, label: 'Labour Law' },
  { value: CaseCategory.CONSUMER, label: 'Consumer Law' },
  { value: CaseCategory.OTHER, label: 'Other' },
];

function StatusBadge({ status }: { status: CaseStatus }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG[CaseStatus.OPEN];
  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${config.color} ${config.bg}`}>
      {config.label}
    </span>
  );
}

function getRequestLabel(status: CaseRequestStatus) {
  if (status === CaseRequestStatus.ACCEPTED) return 'Accepted';
  if (status === CaseRequestStatus.REJECTED) return 'Not selected';
  return 'Requested';
}

export default function LawyerFeedPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuthStore();
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<CaseCategory | ''>('');
  const [requestingCaseId, setRequestingCaseId] = useState<string | null>(null);
  const isLawyer = user?.role === UserRole.LAWYER;

  useEffect(() => {
    if (authLoading) return;

    if (!isAuthenticated) {
      router.push('/auth/login?redirect=/feed');
      return;
    }

    if (user && user.role !== UserRole.LAWYER) {
      router.push('/cases');
    }
  }, [authLoading, isAuthenticated, router, user]);

  const {
    data: cases,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['lawyer-case-feed', search, category],
    queryFn: () =>
      api.getLawyerCaseFeed({
        search: search || undefined,
        category: category || undefined,
      }),
    enabled: isAuthenticated && isLawyer,
  });

  const handleSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSearch(searchInput.trim());
  };

  const handleRequestCase = async (caseId: string) => {
    setRequestingCaseId(caseId);
    try {
      await api.requestCase(caseId);
      toast.success('Request sent to the client');
      refetch();
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, 'Failed to send request'));
    } finally {
      setRequestingCaseId(null);
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-[var(--background-muted)] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#d5b47f]"></div>
      </div>
    );
  }

  if (!isAuthenticated || !isLawyer) return null;

  return (
    <div className="min-h-screen bg-[var(--background-muted)] py-8 text-[var(--text-primary)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Feed</h1>
          <p className="text-[var(--text-secondary)] mt-1">
            Search live client cases and send requests to work on them.
          </p>
        </div>

        <div className="brand-card p-6 mb-8">
          <form
            onSubmit={handleSearch}
            className="grid gap-3 md:grid-cols-[1fr_220px_auto]"
          >
            <label className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" />
              <input
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder="Search title or description"
                className="w-full rounded-lg border border-white/10 bg-[var(--surface-elevated)] py-2 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#d5b47f]"
              />
            </label>
            <select
              value={category}
              onChange={(event) => setCategory(event.target.value as CaseCategory | '')}
              className="rounded-lg border border-white/10 bg-[var(--surface-elevated)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#d5b47f]"
            >
              <option value="">All categories</option>
              {CATEGORIES.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
            <button
              type="submit"
              className="inline-flex items-center justify-center rounded-lg bg-gradient-to-r from-[#f3e2c1] to-[#d5b47f] px-4 py-2 text-sm font-semibold text-[#1b1205]"
            >
              Search
            </button>
          </form>
        </div>

        <div className="space-y-4">
          {isError ? (
            <div className="brand-card p-6">
              <p className="text-sm text-red-400">
                {getErrorMessage(error, 'Failed to load feed')}
              </p>
            </div>
          ) : (cases || []).length > 0 ? (
            (cases || []).map((legalCase) => (
              <FeedCaseCard
                key={legalCase._id}
                legalCase={legalCase}
                isRequesting={requestingCaseId === legalCase._id}
                onRequestCase={handleRequestCase}
              />
            ))
          ) : (
            <div className="brand-card p-6">
              <p className="text-sm text-[var(--text-muted)]">
                No live cases matched your search.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function FeedCaseCard({
  legalCase,
  isRequesting,
  onRequestCase,
}: {
  legalCase: LegalCase;
  isRequesting: boolean;
  onRequestCase: (caseId: string) => void;
}) {
  const client = asUser(legalCase.client);
  const currentRequest = legalCase.lawyerRequests?.[0];

  return (
    <div className="brand-card p-5">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <Link href={`/cases/${legalCase._id}`} className="block flex-1">
          <div className="flex flex-wrap items-center gap-3 mb-1">
            <h2 className="font-semibold text-lg">{legalCase.title}</h2>
            <StatusBadge status={legalCase.status} />
          </div>
          <p className="text-sm text-[var(--text-secondary)] capitalize mb-2">
            {legalCase.category.replace('_', ' ')}
          </p>
          <p className="text-sm text-[var(--text-muted)] line-clamp-2">
            {legalCase.description}
          </p>
          <div className="mt-3 flex flex-wrap gap-4 text-xs text-[var(--text-muted)]">
            {client?.city && <span>Client city: {client.city}</span>}
            {legalCase.createdAt && (
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {format(new Date(legalCase.createdAt), 'MMM d, yyyy')}
              </span>
            )}
          </div>
        </Link>
        {currentRequest ? (
          <button
            disabled
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-[var(--text-muted)]"
          >
            <CheckCircle className="h-4 w-4" />
            {getRequestLabel(currentRequest.status)}
          </button>
        ) : (
          <button
            onClick={() => onRequestCase(legalCase._id)}
            disabled={isRequesting}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#d5b47f]/30 bg-[#d5b47f]/20 px-4 py-2 text-sm font-medium text-[#d5b47f] hover:bg-[#d5b47f]/30 disabled:opacity-50"
          >
            <Send className="h-4 w-4" />
            {isRequesting ? 'Requesting...' : 'Request Case'}
          </button>
        )}
      </div>
    </div>
  );
}
