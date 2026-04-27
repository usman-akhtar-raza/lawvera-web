'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Loader2, MessageSquare, ChevronRight } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import {
  CaseStatus,
  UserRole,
  type CaseCommunicationThreadSummary,
} from '@/types';

const STATUS_LABEL: Record<CaseStatus, string> = {
  [CaseStatus.OPEN]: 'Open',
  [CaseStatus.ASSIGNED]: 'Assigned',
  [CaseStatus.IN_PROGRESS]: 'In Progress',
  [CaseStatus.RESOLVED]: 'Resolved',
  [CaseStatus.CLOSED]: 'Closed',
};

const formatTimestamp = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  return date.toLocaleString([], {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export default function CommunicationPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuthStore();
  const hasCommunicationAccess =
    user?.role === UserRole.CLIENT || user?.role === UserRole.LAWYER;

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/auth/login?redirect=/communication');
    }
    if (!authLoading && isAuthenticated && !hasCommunicationAccess) {
      router.push('/dashboard/admin');
    }
  }, [authLoading, hasCommunicationAccess, isAuthenticated, router]);

  const { data, isLoading } = useQuery({
    queryKey: ['communication-threads'],
    queryFn: () => api.getCommunicationThreads(),
    enabled: isAuthenticated && hasCommunicationAccess,
    refetchInterval: 10000,
  });

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-[var(--background-muted)] flex items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-[#d5b47f]" />
      </div>
    );
  }

  if (!isAuthenticated || !hasCommunicationAccess) {
    return null;
  }

  const threads = data ?? [];

  return (
    <div className="min-h-screen bg-[var(--background-muted)] py-8 text-[var(--text-primary)]">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Communication</h1>
          <p className="mt-2 text-sm text-[var(--text-secondary)]">
            Case chat threads between clients and lawyers.
          </p>
        </div>

        <div className="brand-card p-6">
          {!threads.length ? (
            <div className="py-12 text-center">
              <MessageSquare className="mx-auto h-8 w-8 text-[var(--text-muted)]" />
              <p className="mt-3 text-sm text-[var(--text-muted)]">
                No chat threads yet.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {threads.map((thread) => (
                <ThreadRow key={thread.threadId} thread={thread} userId={user?._id} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ThreadRow({
  thread,
  userId,
}: {
  thread: CaseCommunicationThreadSummary;
  userId?: string;
}) {
  const participantNames = thread.participants
    .filter((participant) => participant._id !== userId)
    .map((participant) => participant.name)
    .join(' • ');

  return (
    <Link
      href={`/cases/${thread.caseId}#communication`}
      className="flex items-start gap-4 rounded-2xl border border-white/10 bg-white/5 p-4 transition hover:border-[#d5b47f]/45 hover:bg-white/10"
    >
      <div className="mt-1 rounded-xl bg-[var(--brand-accent-soft)] p-2 text-[#b07a43]">
        <MessageSquare className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="truncate text-sm font-semibold">{thread.caseTitle}</h2>
          <span className="rounded-full border border-white/15 px-2 py-0.5 text-[10px] uppercase tracking-[0.12em] text-[var(--text-muted)]">
            {STATUS_LABEL[thread.caseStatus] ?? thread.caseStatus}
          </span>
          {thread.unreadCount > 0 && (
            <span className="rounded-full bg-[#d5b47f] px-2 py-0.5 text-[10px] font-semibold text-[#1b1205]">
              {thread.unreadCount} new
            </span>
          )}
        </div>
        <p className="mt-1 text-xs text-[var(--text-muted)]">
          {participantNames || 'Case participants'}
        </p>
        <p className="mt-2 line-clamp-2 text-sm text-[var(--text-secondary)]">
          {thread.lastMessagePreview || 'Open to view messages'}
        </p>
        <p className="mt-2 text-xs text-[var(--text-muted)]">
          Updated {formatTimestamp(thread.lastMessageAt)}
        </p>
      </div>
      <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-[var(--text-muted)]" />
    </Link>
  );
}
