'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft,
  Clock,
  User as UserIcon,
  Briefcase,
  CheckCircle,
  Play,
  XCircle,
} from 'lucide-react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import { CaseStatus, UserRole } from '@/types';
import type { LawyerProfile } from '@/types';
import { format } from 'date-fns';
import { asUser, asLawyerProfile } from '@/lib/type-guards';
import toast from 'react-hot-toast';
import { getErrorMessage } from '@/lib/error-message';
import { CaseCommunicationPanel } from '@/components/communication/CaseCommunicationPanel';

const STATUS_CONFIG: Record<CaseStatus, { label: string; color: string; bg: string }> = {
  [CaseStatus.OPEN]: { label: 'Open', color: 'text-blue-600', bg: 'bg-blue-100' },
  [CaseStatus.ASSIGNED]: { label: 'Assigned', color: 'text-purple-600', bg: 'bg-purple-100' },
  [CaseStatus.IN_PROGRESS]: { label: 'In Progress', color: 'text-yellow-700', bg: 'bg-yellow-100' },
  [CaseStatus.RESOLVED]: { label: 'Resolved', color: 'text-green-700', bg: 'bg-green-100' },
  [CaseStatus.CLOSED]: { label: 'Closed', color: 'text-gray-600', bg: 'bg-gray-200' },
};

function StatusBadge({ status }: { status: CaseStatus }) {
  const config = STATUS_CONFIG[status];
  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${config.color} ${config.bg}`}>
      {config.label}
    </span>
  );
}

export default function CaseDetailPage() {
  const router = useRouter();
  const params = useParams();
  const caseId = params.id as string;
  const { user, isAuthenticated, isLoading: authLoading } = useAuthStore();
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [resolutionNote, setResolutionNote] = useState('');

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push(`/auth/login?redirect=/cases/${caseId}`);
    }
  }, [isAuthenticated, authLoading, router, caseId]);

  const {
    data: legalCase,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['case', caseId],
    queryFn: () => api.getCaseById(caseId),
    enabled: isAuthenticated && !!caseId,
  });

  const handleStatusUpdate = async (status: CaseStatus, note?: string) => {
    setActionLoading(status);
    try {
      await api.updateCaseStatus(caseId, { status, note });
      toast.success(`Case status updated to ${STATUS_CONFIG[status].label}`);
      refetch();
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, 'Failed to update case status'));
    } finally {
      setActionLoading(null);
      setShowResolveModal(false);
      setResolutionNote('');
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-[var(--background-muted)] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#d5b47f]"></div>
      </div>
    );
  }

  if (!isAuthenticated || !legalCase) return null;

  const isClient = user?.role === UserRole.CLIENT;
  const isLawyer = user?.role === UserRole.LAWYER;
  const isAdmin = user?.role === UserRole.ADMIN;
  const lawyer = asLawyerProfile(legalCase.lawyer);
  const lawyerUser = asUser(lawyer?.user);
  const client = asUser(legalCase.client);

  return (
    <div className="min-h-screen bg-[var(--background-muted)] py-8 text-[var(--text-primary)]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link
          href="/cases"
          className="inline-flex items-center gap-2 text-sm text-[var(--text-secondary)] hover:text-[#d5b47f] mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Cases
        </Link>

        {/* Header */}
        <div className="brand-card p-6 mb-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl font-bold">{legalCase.title}</h1>
                <StatusBadge status={legalCase.status} />
              </div>
              <p className="text-sm text-[var(--text-secondary)] capitalize">
                Category: {legalCase.category.replace('_', ' ')}
              </p>
            </div>
          </div>

          <div className="border-t border-white/10 pt-4 mt-4">
            <h3 className="text-sm font-medium text-[var(--text-secondary)] mb-2">Description</h3>
            <p className="text-[var(--text-primary)] whitespace-pre-wrap">{legalCase.description}</p>
          </div>

          {legalCase.resolutionSummary && (
            <div className="border-t border-white/10 pt-4 mt-4">
              <h3 className="text-sm font-medium text-green-600 mb-2">Resolution Summary</h3>
              <p className="text-[var(--text-primary)]">{legalCase.resolutionSummary}</p>
            </div>
          )}
        </div>

        {/* Parties */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="brand-card p-5">
            <h3 className="text-sm font-medium text-[var(--text-secondary)] mb-3 flex items-center gap-2">
              <UserIcon className="h-4 w-4" /> Client
            </h3>
            {client ? (
              <div>
                <p className="font-semibold">{client.name}</p>
                <p className="text-sm text-[var(--text-muted)]">{client.email}</p>
                {client.city && (
                  <p className="text-sm text-[var(--text-muted)]">{client.city}</p>
                )}
              </div>
            ) : (
              <p className="text-[var(--text-muted)]">-</p>
            )}
          </div>

          <div className="brand-card p-5">
            <h3 className="text-sm font-medium text-[var(--text-secondary)] mb-3 flex items-center gap-2">
              <Briefcase className="h-4 w-4" /> Assigned Lawyer
            </h3>
            {lawyerUser ? (
              <div>
                <p className="font-semibold">{lawyerUser.name}</p>
                <p className="text-sm text-[var(--text-muted)]">{lawyer?.specialization}</p>
                <p className="text-sm text-[var(--text-muted)]">{lawyerUser.city}</p>
              </div>
            ) : (
              <div>
                <p className="text-[var(--text-muted)] mb-2">No lawyer assigned yet</p>
                {(isClient || isAdmin) && legalCase.status === CaseStatus.OPEN && (
                  <button
                    onClick={() => setShowAssignModal(true)}
                    className="text-sm font-medium text-[#d5b47f] hover:text-[#f3e2c1]"
                  >
                    Assign a Lawyer
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        {legalCase.status !== CaseStatus.CLOSED && (
          <div className="brand-card p-6 mb-6">
            <h3 className="text-sm font-medium text-[var(--text-secondary)] mb-4">Actions</h3>
            <div className="flex flex-wrap gap-3">
              {/* Lawyer: Start working */}
              {isLawyer && legalCase.status === CaseStatus.ASSIGNED && (
                <button
                  onClick={() => handleStatusUpdate(CaseStatus.IN_PROGRESS)}
                  disabled={actionLoading !== null}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-[#d5b47f]/20 text-[#d5b47f] border border-[#d5b47f]/30 hover:bg-[#d5b47f]/30 disabled:opacity-50"
                >
                  <Play className="h-4 w-4" />
                  {actionLoading === CaseStatus.IN_PROGRESS ? 'Starting...' : 'Start Working'}
                </button>
              )}

              {/* Lawyer: Mark resolved */}
              {isLawyer && legalCase.status === CaseStatus.IN_PROGRESS && (
                <button
                  onClick={() => setShowResolveModal(true)}
                  disabled={actionLoading !== null}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-green-500/20 text-green-400 border border-green-500/30 hover:bg-green-500/30 disabled:opacity-50"
                >
                  <CheckCircle className="h-4 w-4" />
                  Mark Resolved
                </button>
              )}

              {/* Client: Close case (when resolved) */}
              {isClient && legalCase.status === CaseStatus.RESOLVED && (
                <button
                  onClick={() => handleStatusUpdate(CaseStatus.CLOSED, 'Client confirmed resolution')}
                  disabled={actionLoading !== null}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-gray-500/20 text-gray-300 border border-gray-500/30 hover:bg-gray-500/30 disabled:opacity-50"
                >
                  <XCircle className="h-4 w-4" />
                  {actionLoading === CaseStatus.CLOSED ? 'Closing...' : 'Close Case'}
                </button>
              )}

              {/* Client/Admin: Close open/assigned cases */}
              {(isClient || isAdmin) &&
                [CaseStatus.OPEN, CaseStatus.ASSIGNED].includes(legalCase.status) && (
                  <button
                    onClick={() => handleStatusUpdate(CaseStatus.CLOSED, 'Case withdrawn')}
                    disabled={actionLoading !== null}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-red-400 border border-red-500/30 hover:bg-red-500/10 disabled:opacity-50"
                  >
                    <XCircle className="h-4 w-4" />
                    Withdraw Case
                  </button>
                )}

              {/* Client/Admin: Assign lawyer (open or re-assign) */}
              {(isClient || isAdmin) &&
                [CaseStatus.OPEN, CaseStatus.ASSIGNED].includes(legalCase.status) && (
                  <button
                    onClick={() => setShowAssignModal(true)}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-purple-500/20 text-purple-400 border border-purple-500/30 hover:bg-purple-500/30"
                  >
                    <Briefcase className="h-4 w-4" />
                    {lawyer ? 'Reassign Lawyer' : 'Assign Lawyer'}
                  </button>
                )}
            </div>
          </div>
        )}

        <CaseCommunicationPanel
          caseId={caseId}
          isEnabled={Boolean(lawyerUser)}
        />

        {/* Activity Log */}
        <div className="brand-card p-6">
          <h3 className="text-sm font-medium text-[var(--text-secondary)] mb-4 flex items-center gap-2">
            <Clock className="h-4 w-4" /> Activity Log
          </h3>
          {legalCase.activityLog && legalCase.activityLog.length > 0 ? (
            <div className="space-y-3">
              {[...legalCase.activityLog].reverse().map((log, i) => {
                const actor = asUser(log.actor);
                return (
                  <div key={i} className="flex gap-3 text-sm">
                    <div className="w-2 h-2 mt-1.5 rounded-full bg-[#d5b47f] flex-shrink-0" />
                    <div>
                      <p className="text-[var(--text-primary)]">
                        <span className="font-medium">{actor?.name || 'System'}</span>
                        {' - '}
                        {log.action}
                      </p>
                      {log.note && (
                        <p className="text-[var(--text-muted)] mt-0.5">{log.note}</p>
                      )}
                      <p className="text-xs text-[var(--text-muted)] mt-0.5">
                        {format(new Date(log.createdAt), 'MMM d, yyyy h:mm a')}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-[var(--text-muted)]">No activity yet</p>
          )}
        </div>

        {/* Dates */}
        <div className="mt-6 flex flex-wrap gap-6 text-xs text-[var(--text-muted)]">
          {legalCase.createdAt && (
            <span>Created: {format(new Date(legalCase.createdAt), 'MMM d, yyyy')}</span>
          )}
          {legalCase.resolvedAt && (
            <span>Resolved: {format(new Date(legalCase.resolvedAt), 'MMM d, yyyy')}</span>
          )}
          {legalCase.closedAt && (
            <span>Closed: {format(new Date(legalCase.closedAt), 'MMM d, yyyy')}</span>
          )}
        </div>

        {/* Assign Lawyer Modal */}
        {showAssignModal && (
          <AssignLawyerModal
            caseId={caseId}
            onClose={() => setShowAssignModal(false)}
            onAssigned={() => {
              setShowAssignModal(false);
              refetch();
            }}
          />
        )}

        {/* Resolve Modal */}
        {showResolveModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
            <div className="brand-card p-6 w-full max-w-md mx-4">
              <h3 className="text-lg font-semibold mb-4">Resolve Case</h3>
              <textarea
                value={resolutionNote}
                onChange={(e) => setResolutionNote(e.target.value)}
                rows={4}
                placeholder="Enter resolution summary..."
                className="w-full px-3 py-2 rounded-lg bg-[var(--surface-elevated)] border border-white/10 focus:outline-none focus:ring-2 focus:ring-[#d5b47f] text-sm mb-4"
              />
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setShowResolveModal(false)}
                  className="px-4 py-2 rounded-lg text-sm border border-white/10 hover:bg-white/5"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleStatusUpdate(CaseStatus.RESOLVED, resolutionNote)}
                  disabled={actionLoading !== null}
                  className="px-4 py-2 rounded-lg text-sm font-medium bg-gradient-to-r from-[#f3e2c1] to-[#d5b47f] text-[#1b1205] disabled:opacity-50"
                >
                  {actionLoading ? 'Resolving...' : 'Confirm Resolution'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function AssignLawyerModal({
  caseId,
  onClose,
  onAssigned,
}: {
  caseId: string;
  onClose: () => void;
  onAssigned: () => void;
}) {
  const [search, setSearch] = useState('');
  const [assigning, setAssigning] = useState<string | null>(null);

  const { data: result } = useQuery({
    queryKey: ['lawyers-for-assign', search],
    queryFn: () =>
      api.searchLawyers({
        specialization: search || undefined,
        limit: 10,
      }),
  });

  const lawyers = result?.data || [];

  const handleAssign = async (lawyerProfile: LawyerProfile) => {
    setAssigning(lawyerProfile._id);
    try {
      await api.assignLawyerToCase(caseId, lawyerProfile._id);
      const lawyerUser = asUser(lawyerProfile.user);
      toast.success(`Lawyer ${lawyerUser?.name || ''} assigned to case`);
      onAssigned();
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, 'Failed to assign lawyer'));
    } finally {
      setAssigning(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="brand-card p-6 w-full max-w-lg mx-4 max-h-[80vh] overflow-y-auto">
        <h3 className="text-lg font-semibold mb-4">Assign Lawyer</h3>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by specialization..."
          className="w-full px-3 py-2 rounded-lg bg-[var(--surface-elevated)] border border-white/10 focus:outline-none focus:ring-2 focus:ring-[#d5b47f] text-sm mb-4"
        />

        <div className="space-y-3">
          {lawyers.map((l: LawyerProfile) => {
            const lu = asUser(l.user);
            return (
              <div
                key={l._id}
                className="flex items-center justify-between border border-white/10 rounded-lg p-3 bg-white/5"
              >
                <div>
                  <p className="font-medium">{lu?.name || 'Lawyer'}</p>
                  <p className="text-xs text-[var(--text-muted)]">
                    {l.specialization} | {l.city} | {l.experienceYears}y exp
                  </p>
                </div>
                <button
                  onClick={() => handleAssign(l)}
                  disabled={assigning !== null}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium bg-gradient-to-r from-[#f3e2c1] to-[#d5b47f] text-[#1b1205] disabled:opacity-50"
                >
                  {assigning === l._id ? 'Assigning...' : 'Assign'}
                </button>
              </div>
            );
          })}
          {lawyers.length === 0 && (
            <p className="text-[var(--text-muted)] text-sm text-center py-4">
              No lawyers found
            </p>
          )}
        </div>

        <button
          onClick={onClose}
          className="mt-4 w-full px-4 py-2 rounded-lg text-sm border border-white/10 hover:bg-white/5"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
