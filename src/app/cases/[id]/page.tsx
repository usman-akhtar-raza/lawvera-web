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
  Wallet,
  ShieldAlert,
} from 'lucide-react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import {
  CaseEscrowDisputeStatus,
  CaseEscrowStatus,
  CaseRequestStatus,
  CaseStatus,
  UserRole,
} from '@/types';
import type { CaseLawyerRequest, LawyerProfile } from '@/types';
import { format } from 'date-fns';
import { asUser, asLawyerProfile } from '@/lib/type-guards';
import toast from 'react-hot-toast';
import { getErrorMessage } from '@/lib/error-message';
import { CaseCommunicationPanel } from '@/components/communication/CaseCommunicationPanel';
import { isAdminRole } from '@/lib/role-utils';
import { PayPalCardEscrowForm } from '@/components/payments/PayPalCardEscrowForm';

const STATUS_CONFIG: Record<CaseStatus, { label: string; color: string; bg: string }> = {
  [CaseStatus.OPEN]: { label: 'Open', color: 'text-blue-600', bg: 'bg-blue-100' },
  [CaseStatus.ASSIGNED]: { label: 'Assigned', color: 'text-purple-600', bg: 'bg-purple-100' },
  [CaseStatus.IN_PROGRESS]: { label: 'In Progress', color: 'text-yellow-700', bg: 'bg-yellow-100' },
  [CaseStatus.RESOLVED]: { label: 'Resolved', color: 'text-green-700', bg: 'bg-green-100' },
  [CaseStatus.CLOSED]: { label: 'Closed', color: 'text-gray-600', bg: 'bg-gray-200' },
};

const ESCROW_STATUS_CONFIG: Record<
  CaseEscrowStatus,
  { label: string; color: string; bg: string }
> = {
  [CaseEscrowStatus.NOT_STARTED]: {
    label: 'Not funded',
    color: 'text-gray-300',
    bg: 'bg-white/10',
  },
  [CaseEscrowStatus.PENDING_APPROVAL]: {
    label: 'Awaiting payment completion',
    color: 'text-amber-300',
    bg: 'bg-amber-500/10',
  },
  [CaseEscrowStatus.HELD]: {
    label: 'Held in escrow',
    color: 'text-[#d5b47f]',
    bg: 'bg-[#d5b47f]/15',
  },
  [CaseEscrowStatus.RELEASE_PENDING]: {
    label: 'Payout processing',
    color: 'text-sky-300',
    bg: 'bg-sky-500/10',
  },
  [CaseEscrowStatus.RELEASED]: {
    label: 'Released to lawyer',
    color: 'text-emerald-300',
    bg: 'bg-emerald-500/10',
  },
  [CaseEscrowStatus.REFUND_PENDING]: {
    label: 'Refund processing',
    color: 'text-orange-300',
    bg: 'bg-orange-500/10',
  },
  [CaseEscrowStatus.REFUNDED]: {
    label: 'Refunded to client',
    color: 'text-blue-300',
    bg: 'bg-blue-500/10',
  },
  [CaseEscrowStatus.CANCELLED]: {
    label: 'Checkout cancelled',
    color: 'text-gray-300',
    bg: 'bg-white/10',
  },
  [CaseEscrowStatus.FAILED]: {
    label: 'Payment issue',
    color: 'text-red-300',
    bg: 'bg-red-500/10',
  },
};

function StatusBadge({ status }: { status: CaseStatus }) {
  const config = STATUS_CONFIG[status];
  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${config.color} ${config.bg}`}>
      {config.label}
    </span>
  );
}

function EscrowStatusBadge({ status }: { status: CaseEscrowStatus }) {
  const config = ESCROW_STATUS_CONFIG[status];
  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${config.color} ${config.bg}`}
    >
      {config.label}
    </span>
  );
}

function getLawyerId(lawyer: CaseLawyerRequest['lawyer']) {
  return typeof lawyer === 'string' ? lawyer : lawyer._id;
}

function getRequestLabel(status: CaseRequestStatus) {
  if (status === CaseRequestStatus.ACCEPTED) return 'Accepted';
  if (status === CaseRequestStatus.REJECTED) return 'Not selected';
  return 'Pending';
}

export default function CaseDetailPage() {
  const router = useRouter();
  const params = useParams();
  const caseId = params.id as string;
  const { user, lawyerProfile, isAuthenticated, isLoading: authLoading } = useAuthStore();
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [resolutionNote, setResolutionNote] = useState('');
  const [requestMessage, setRequestMessage] = useState('');
  const [escrowAmount, setEscrowAmount] = useState('');

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

  const handleRequestCase = async () => {
    setActionLoading('request');
    try {
      await api.requestCase(caseId, {
        message: requestMessage.trim() || undefined,
      });
      toast.success('Request sent to the client');
      setShowRequestModal(false);
      setRequestMessage('');
      refetch();
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, 'Failed to send request'));
    } finally {
      setActionLoading(null);
    }
  };

  const handleAcceptRequest = async (request: CaseLawyerRequest) => {
    const requestLawyer = asLawyerProfile(request.lawyer);
    const lawyerId = getLawyerId(request.lawyer);
    const lawyerUser = asUser(requestLawyer?.user);

    setActionLoading(`accept-${lawyerId}`);
    try {
      await api.acceptCaseRequest(caseId, lawyerId);
      toast.success(`${lawyerUser?.name || 'Lawyer'} selected for this case`);
      refetch();
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, 'Failed to select lawyer'));
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancelEscrowOrder = async () => {
    setActionLoading('escrow-cancel');
    try {
      await api.cancelCaseEscrowOrder(caseId, 'Client cancelled PayPal checkout');
      toast.success('Escrow checkout cancelled');
      refetch();
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, 'Failed to cancel escrow checkout'));
    } finally {
      setActionLoading(null);
    }
  };

  const handleOpenEscrowDispute = async () => {
    const note = window.prompt(
      'Add a short dispute note for the admin (optional):',
      '',
    );
    if (note === null) {
      return;
    }

    setActionLoading('escrow-dispute');
    try {
      await api.openCaseEscrowDispute(caseId, note || undefined);
      toast.success('Dispute opened. Escrow release is now blocked.');
      refetch();
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, 'Failed to open dispute'));
    } finally {
      setActionLoading(null);
    }
  };

  const handleAdminReleaseEscrow = async () => {
    setActionLoading('escrow-release');
    try {
      await api.releaseCaseEscrowPayment(caseId, 'Manual release by admin');
      toast.success('Escrow payout initiated for the assigned lawyer');
      refetch();
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, 'Failed to release escrow'));
    } finally {
      setActionLoading(null);
    }
  };

  const handleAdminRefundEscrow = async () => {
    const confirmed = window.confirm(
      'Refund the full escrow amount back to the client?',
    );
    if (!confirmed) {
      return;
    }

    setActionLoading('escrow-refund');
    try {
      await api.refundCaseEscrowPayment(caseId, 'Manual refund by admin');
      toast.success('Escrow refund has been started');
      refetch();
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, 'Failed to refund escrow'));
    } finally {
      setActionLoading(null);
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
  const isAdmin = isAdminRole(user?.role);
  const lawyer = asLawyerProfile(legalCase.lawyer);
  const hasAssignedLawyer = Boolean(legalCase.lawyer);
  const lawyerPaypalEmail =
    lawyer?.paypalEmail ||
    (legalCase.lawyer &&
    typeof legalCase.lawyer === 'object' &&
    'paypalEmail' in legalCase.lawyer &&
    typeof legalCase.lawyer.paypalEmail === 'string'
      ? legalCase.lawyer.paypalEmail
      : undefined);
  const lawyerUser = asUser(lawyer?.user);
  const client = asUser(legalCase.client);
  const lawyerRequests = legalCase.lawyerRequests || [];
  const canAccessCommunication = isClient || isLawyer;
  const currentLawyerRequest = lawyerRequests.find((request) => {
    const requestLawyer = asLawyerProfile(request.lawyer);
    const requestLawyerUser = asUser(requestLawyer?.user);

    if (lawyerProfile && getLawyerId(request.lawyer) === lawyerProfile._id) {
      return true;
    }

    return Boolean(user?._id && requestLawyerUser?._id === user._id);
  });
  const isOpenForRequests = legalCase.status === CaseStatus.OPEN && !lawyer;
  const escrow = legalCase.escrow || {
    status: CaseEscrowStatus.NOT_STARTED,
    disputeStatus: CaseEscrowDisputeStatus.NONE,
    provider: 'paypal',
  };
  const escrowAmountMinor = escrow.amountMinor || 0;
  const escrowCurrency = escrow.currency || 'PHP';
  const escrowMoney = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: escrowCurrency,
  }).format(escrowAmountMinor / 100);
  const commissionMoney = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: escrowCurrency,
  }).format((escrow.platformCommissionMinor || 0) / 100);
  const lawyerMoney = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: escrowCurrency,
  }).format((escrow.lawyerAmountMinor || 0) / 100);
  const canCreateEscrow =
    isClient &&
    hasAssignedLawyer &&
    [CaseStatus.ASSIGNED, CaseStatus.IN_PROGRESS, CaseStatus.RESOLVED].includes(legalCase.status) &&
    [
      CaseEscrowStatus.NOT_STARTED,
      CaseEscrowStatus.CANCELLED,
      CaseEscrowStatus.FAILED,
      CaseEscrowStatus.REFUNDED,
    ].includes(escrow.status);
  const escrowActionHint = !hasAssignedLawyer
    ? 'Select a lawyer first to activate escrow.'
    : !isClient
      ? 'Only the client who owns this case can fund escrow.'
      : [CaseEscrowStatus.HELD, CaseEscrowStatus.RELEASE_PENDING, CaseEscrowStatus.RELEASED].includes(
              escrow.status,
            )
          ? 'This case already has an active escrow or completed payout record.'
          : escrow.status === CaseEscrowStatus.PENDING_APPROVAL
            ? 'A payment session is already waiting for completion or cancellation.'
            : legalCase.status === CaseStatus.CLOSED
              ? 'Closed cases cannot be funded.'
              : ![CaseStatus.ASSIGNED, CaseStatus.IN_PROGRESS, CaseStatus.RESOLVED].includes(
                    legalCase.status,
                  )
                ? 'Payment becomes available after a lawyer is selected.'
                : null;
  const canOpenDispute =
    isClient &&
    [CaseEscrowStatus.HELD, CaseEscrowStatus.RELEASE_PENDING, CaseEscrowStatus.RELEASED].includes(
      escrow.status,
    ) &&
    escrow.disputeStatus !== CaseEscrowDisputeStatus.OPEN;

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
                {isClient && legalCase.status === CaseStatus.OPEN && (
                  <p className="text-xs text-[var(--text-muted)]">
                    This case is live. Lawyers can send requests for you to review.
                  </p>
                )}
                {isLawyer && isOpenForRequests && (
                  <p className="text-xs text-[var(--text-muted)]">
                    This case is open for lawyer requests.
                  </p>
                )}
                {isAdmin && legalCase.status === CaseStatus.OPEN && (
                  <button
                    onClick={() => setShowAssignModal(true)}
                    className="text-sm font-medium text-[#d5b47f] hover:text-[#f3e2c1]"
                  >
                    Assign directly
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {hasAssignedLawyer && (
          <div className="brand-card p-6 mb-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-sm font-medium text-[var(--text-secondary)] flex items-center gap-2">
                    <Wallet className="h-4 w-4" />
                    Case Escrow
                  </h3>
                  <EscrowStatusBadge status={escrow.status} />
                  {escrow.disputeStatus === CaseEscrowDisputeStatus.OPEN && (
                    <span className="inline-flex items-center rounded-full bg-red-500/10 px-3 py-1 text-sm font-medium text-red-300">
                      Disputed
                    </span>
                  )}
                </div>
                <p className="text-sm text-[var(--text-secondary)]">
                  Clients pay Lawvera by credit or debit card through PayPal-hosted fields, and the escrow is released to the lawyer after completion with a 15% Lawvera commission.
                </p>
              </div>
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-3">
              <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.12em] text-[var(--text-muted)]">
                  Client payment
                </p>
                <p className="mt-2 text-xl font-semibold">{escrowAmountMinor ? escrowMoney : 'Not set'}</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.12em] text-[var(--text-muted)]">
                  Lawvera commission
                </p>
                <p className="mt-2 text-xl font-semibold">{commissionMoney}</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.12em] text-[var(--text-muted)]">
                  Lawyer payout
                </p>
                <p className="mt-2 text-xl font-semibold">{lawyerMoney}</p>
              </div>
            </div>

            {escrow.lastError && (
              <div className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
                {escrow.lastError}
              </div>
            )}

            <div className="mt-4 flex flex-wrap gap-4 text-xs text-[var(--text-muted)]">
              {escrow.paypalOrderId && <span>Order: {escrow.paypalOrderId}</span>}
              {escrow.paypalCaptureId && <span>Capture: {escrow.paypalCaptureId}</span>}
              {escrow.paypalPayoutBatchId && <span>Payout batch: {escrow.paypalPayoutBatchId}</span>}
              {escrow.paypalRefundId && <span>Refund: {escrow.paypalRefundId}</span>}
            </div>

            <div className="mt-5 flex flex-wrap gap-3">
              {canCreateEscrow && (
                <>
                  <input
                    value={escrowAmount}
                    onChange={(event) => setEscrowAmount(event.target.value)}
                    type="number"
                    min="1"
                    step="0.01"
                    placeholder="Agreed fee"
                    className="w-full max-w-[12rem] rounded-lg border border-white/10 bg-[var(--surface-elevated)] px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[#d5b47f]"
                  />
                  <div className="w-full">
                    <PayPalCardEscrowForm
                      caseId={caseId}
                      amount={escrowAmount}
                      currency={escrowCurrency}
                      disabled={actionLoading !== null}
                      onSuccess={() => {
                        setEscrowAmount('');
                        refetch();
                      }}
                    />
                  </div>
                </>
              )}

              {!canCreateEscrow && escrowActionHint && (
                <p className="text-sm text-[var(--text-muted)]">
                  {escrowActionHint}
                </p>
              )}

              {canCreateEscrow && !lawyerPaypalEmail && (
                <p className="text-sm text-amber-200">
                  The assigned lawyer can add their payout method later. Escrow can
                  be funded now, but release will wait until a payout account is
                  configured.
                </p>
              )}

              {isClient && escrow.status === CaseEscrowStatus.PENDING_APPROVAL && (
                <button
                  onClick={handleCancelEscrowOrder}
                  disabled={actionLoading !== null}
                  className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-4 py-2 text-sm font-medium text-[var(--text-secondary)] disabled:opacity-50"
                >
                  {actionLoading === 'escrow-cancel' ? 'Cancelling...' : 'Cancel Checkout'}
                </button>
              )}

              {canOpenDispute && (
                <button
                  onClick={handleOpenEscrowDispute}
                  disabled={actionLoading !== null}
                  className="inline-flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm font-medium text-red-300 disabled:opacity-50"
                >
                  <ShieldAlert className="h-4 w-4" />
                  {actionLoading === 'escrow-dispute' ? 'Opening...' : 'Open Dispute'}
                </button>
              )}

              {isAdmin && escrow.status === CaseEscrowStatus.HELD && (
                <>
                  <button
                    onClick={handleAdminReleaseEscrow}
                    disabled={actionLoading !== null}
                    className="inline-flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-sm font-medium text-emerald-300 disabled:opacity-50"
                  >
                    {actionLoading === 'escrow-release' ? 'Releasing...' : 'Admin Release'}
                  </button>
                  <button
                    onClick={handleAdminRefundEscrow}
                    disabled={actionLoading !== null}
                    className="inline-flex items-center gap-2 rounded-lg border border-orange-500/30 bg-orange-500/10 px-4 py-2 text-sm font-medium text-orange-300 disabled:opacity-50"
                  >
                    {actionLoading === 'escrow-refund' ? 'Refunding...' : 'Admin Refund'}
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        {/* Actions */}
        {legalCase.status !== CaseStatus.CLOSED && (
          <div className="brand-card p-6 mb-6">
            <h3 className="text-sm font-medium text-[var(--text-secondary)] mb-4">Actions</h3>
            <div className="flex flex-wrap gap-3">
              {/* Lawyer: request live open case */}
              {isLawyer && isOpenForRequests && (
                currentLawyerRequest ? (
                  <button
                    disabled
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-white/5 text-[var(--text-muted)] border border-white/10"
                  >
                    <Briefcase className="h-4 w-4" />
                    {getRequestLabel(currentLawyerRequest.status)}
                  </button>
                ) : (
                  <button
                    onClick={() => setShowRequestModal(true)}
                    disabled={actionLoading !== null}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-[#d5b47f]/20 text-[#d5b47f] border border-[#d5b47f]/30 hover:bg-[#d5b47f]/30 disabled:opacity-50"
                  >
                    <Briefcase className="h-4 w-4" />
                    Request This Case
                  </button>
                )
              )}

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
              {isAdmin &&
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

        {(isClient || isAdmin) && !lawyer && legalCase.status === CaseStatus.OPEN && (
          <div className="brand-card p-6 mb-6">
            <h3 className="text-sm font-medium text-[var(--text-secondary)] mb-4">
              Lawyer Requests
            </h3>
            {lawyerRequests.length > 0 ? (
              <div className="space-y-3">
                {lawyerRequests.map((request) => {
                  const requestLawyer = asLawyerProfile(request.lawyer);
                  const requestLawyerUser = asUser(requestLawyer?.user);
                  const lawyerId = getLawyerId(request.lawyer);
                  const isPending = request.status === CaseRequestStatus.PENDING;

                  return (
                    <div
                      key={lawyerId}
                      className="border border-white/10 rounded-lg p-4 bg-white/5"
                    >
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-semibold">
                              {requestLawyerUser?.name || 'Lawyer'}
                            </p>
                            <span className="rounded-full border border-white/10 px-2 py-0.5 text-xs text-[var(--text-muted)]">
                              {getRequestLabel(request.status)}
                            </span>
                          </div>
                          {requestLawyer && (
                            <p className="text-sm text-[var(--text-muted)] mt-1">
                              {requestLawyer.specialization} | {requestLawyer.city} |{' '}
                              {requestLawyer.experienceYears}y exp
                            </p>
                          )}
                          {request.message && (
                            <p className="text-sm text-[var(--text-secondary)] mt-3">
                              {request.message}
                            </p>
                          )}
                          <p className="text-xs text-[var(--text-muted)] mt-2">
                            Requested {format(new Date(request.createdAt), 'MMM d, yyyy h:mm a')}
                          </p>
                        </div>
                        {isPending && (
                          <button
                            onClick={() => handleAcceptRequest(request)}
                            disabled={actionLoading !== null}
                            className="px-4 py-2 rounded-lg text-sm font-semibold bg-gradient-to-r from-[#f3e2c1] to-[#d5b47f] text-[#1b1205] disabled:opacity-50"
                          >
                            {actionLoading === `accept-${lawyerId}`
                              ? 'Selecting...'
                              : 'Select Lawyer'}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-[var(--text-muted)]">
                No lawyer requests yet. This case is live and visible to approved lawyers.
              </p>
            )}
          </div>
        )}

        {canAccessCommunication && (
          <CaseCommunicationPanel
            caseId={caseId}
            isEnabled={Boolean(lawyerUser)}
          />
        )}

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

        {/* Lawyer Request Modal */}
        {showRequestModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
            <div className="brand-card p-6 w-full max-w-md mx-4">
              <h3 className="text-lg font-semibold mb-4">Request This Case</h3>
              <textarea
                value={requestMessage}
                onChange={(e) => setRequestMessage(e.target.value)}
                rows={4}
                maxLength={1000}
                placeholder="Add a short note for the client..."
                className="w-full px-3 py-2 rounded-lg bg-[var(--surface-elevated)] border border-white/10 focus:outline-none focus:ring-2 focus:ring-[#d5b47f] text-sm mb-4"
              />
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setShowRequestModal(false)}
                  className="px-4 py-2 rounded-lg text-sm border border-white/10 hover:bg-white/5"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRequestCase}
                  disabled={actionLoading !== null}
                  className="px-4 py-2 rounded-lg text-sm font-medium bg-gradient-to-r from-[#f3e2c1] to-[#d5b47f] text-[#1b1205] disabled:opacity-50"
                >
                  {actionLoading === 'request' ? 'Sending...' : 'Send Request'}
                </button>
              </div>
            </div>
          </div>
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
