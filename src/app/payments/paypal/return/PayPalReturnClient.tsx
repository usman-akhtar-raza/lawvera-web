'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { AlertTriangle, CheckCircle2, Clock3, ShieldCheck } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import { getErrorMessage } from '@/lib/error-message';
import {
  CaseEscrowDisputeStatus,
  CaseEscrowStatus,
  type LegalCase,
} from '@/types';

type PayPalReturnClientProps = {
  cancelled: boolean;
  caseId?: string;
  orderId?: string;
};

type ProcessingState = 'idle' | 'working' | 'success' | 'error';

export function PayPalReturnClient({
  cancelled,
  caseId,
  orderId,
}: PayPalReturnClientProps) {
  const { isAuthenticated, isLoading: authLoading } = useAuthStore();
  const [processingState, setProcessingState] = useState<ProcessingState>('idle');
  const [legalCase, setLegalCase] = useState<LegalCase | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const redirectTarget = useMemo(() => {
    const params = new URLSearchParams();
    if (caseId) params.set('caseId', caseId);
    if (orderId) params.set('token', orderId);
    if (cancelled) params.set('cancelled', '1');
    const suffix = params.toString();
    return `/payments/paypal/return${suffix ? `?${suffix}` : ''}`;
  }, [cancelled, caseId, orderId]);

  useEffect(() => {
    if (authLoading || !isAuthenticated || !caseId) {
      return;
    }

    let isMounted = true;
    setProcessingState('working');

    const run = async () => {
      try {
        const updatedCase = cancelled
          ? await api.cancelCaseEscrowOrder(
              caseId,
              'Buyer cancelled PayPal approval',
            )
          : orderId
            ? await api.captureCaseEscrowOrder(caseId, orderId)
            : null;

        if (!isMounted) {
          return;
        }

        if (!updatedCase) {
          setProcessingState('error');
          setErrorMessage('PayPal did not return a valid order reference.');
          return;
        }

        setLegalCase(updatedCase);
        setProcessingState('success');
      } catch (error: unknown) {
        if (!isMounted) {
          return;
        }

        setProcessingState('error');
        setErrorMessage(
          getErrorMessage(error, 'Unable to finalize the PayPal payment flow.'),
        );
      }
    };

    void run();

    return () => {
      isMounted = false;
    };
  }, [authLoading, cancelled, caseId, isAuthenticated, orderId]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[var(--background-muted)] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#d5b47f]"></div>
      </div>
    );
  }

  if (!caseId) {
    return (
      <ReturnShell
        icon={<AlertTriangle className="h-8 w-8" />}
        title="PayPal return is incomplete"
        description="The return from PayPal did not include a case reference."
      >
        <LinkButton href={isAuthenticated ? '/cases' : `/auth/login?redirect=${encodeURIComponent(redirectTarget)}`}>
          {isAuthenticated ? 'Open Cases' : 'Sign In'}
        </LinkButton>
      </ReturnShell>
    );
  }

  if (!isAuthenticated) {
    return (
      <ReturnShell
        icon={<ShieldCheck className="h-8 w-8" />}
        title="Sign in to confirm the payment result"
        description="PayPal redirected back successfully. Sign in so Lawvera can verify and store the escrow result."
      >
        <LinkButton href={`/auth/login?redirect=${encodeURIComponent(redirectTarget)}`}>
          Sign In
        </LinkButton>
      </ReturnShell>
    );
  }

  if (processingState === 'working' || processingState === 'idle') {
    return (
      <ReturnShell
        icon={<Clock3 className="h-8 w-8" />}
        title={cancelled ? 'Cancelling checkout' : 'Finalizing escrow payment'}
        description={
          cancelled
            ? 'Updating the case after your PayPal checkout cancellation.'
            : 'Confirming your PayPal payment and placing it in escrow.'
        }
      />
    );
  }

  if (processingState === 'error') {
    return (
      <ReturnShell
        icon={<AlertTriangle className="h-8 w-8" />}
        title="PayPal payment could not be finalized"
        description={errorMessage || 'A payment error occurred.'}
      >
        <LinkButton href={`/cases/${caseId}`}>Return to Case</LinkButton>
      </ReturnShell>
    );
  }

  const escrow = legalCase?.escrow;
  const escrowCurrency = escrow?.currency || 'USD';
  const total = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: escrowCurrency,
  }).format((escrow?.amountMinor || 0) / 100);
  const payout = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: escrowCurrency,
  }).format((escrow?.lawyerAmountMinor || 0) / 100);

  const title = cancelled ? 'Checkout cancelled' : 'Escrow payment confirmed';
  const description = cancelled
    ? 'The PayPal checkout was cancelled before funds were captured.'
    : escrow?.status === CaseEscrowStatus.HELD
      ? 'Your payment is now being held in escrow until the case is resolved.'
      : 'Your payment result has been recorded on the case.';

  return (
    <ReturnShell
      icon={<CheckCircle2 className="h-8 w-8" />}
      title={title}
      description={description}
    >
      {legalCase && (
        <div className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-5 text-sm text-[var(--text-primary)]">
          <div className="grid gap-3 sm:grid-cols-2">
            <p>
              <span className="text-[var(--text-muted)]">Case: </span>
              {legalCase.title}
            </p>
            <p>
              <span className="text-[var(--text-muted)]">Escrow status: </span>
              {escrow?.status || CaseEscrowStatus.NOT_STARTED}
            </p>
            <p>
              <span className="text-[var(--text-muted)]">Client payment: </span>
              {total}
            </p>
            <p>
              <span className="text-[var(--text-muted)]">Lawyer payout: </span>
              {payout}
            </p>
            {escrow?.paypalOrderId && (
              <p className="sm:col-span-2">
                <span className="text-[var(--text-muted)]">PayPal order: </span>
                {escrow.paypalOrderId}
              </p>
            )}
            {escrow?.paypalCaptureId && (
              <p className="sm:col-span-2">
                <span className="text-[var(--text-muted)]">Capture ID: </span>
                {escrow.paypalCaptureId}
              </p>
            )}
            {escrow?.disputeStatus === CaseEscrowDisputeStatus.OPEN && (
              <p className="sm:col-span-2 text-red-300">
                A dispute is open on this escrow. Admin action is required before release.
              </p>
            )}
          </div>
        </div>
      )}

      <div className="mt-8 flex flex-wrap gap-3">
        <LinkButton href={`/cases/${caseId}`}>Return to Case</LinkButton>
        <Link
          href="/cases"
          className="rounded-xl border border-white/10 px-5 py-3 font-semibold text-[var(--text-primary)] hover:bg-white/5"
        >
          Open Cases
        </Link>
      </div>
    </ReturnShell>
  );
}

function ReturnShell({
  children,
  description,
  icon,
  title,
}: {
  children?: ReactNode;
  description: string;
  icon: ReactNode;
  title: string;
}) {
  return (
    <div className="min-h-screen bg-[var(--background-muted)] py-12 text-[var(--text-primary)]">
      <div className="max-w-3xl mx-auto px-4">
        <div className="brand-card p-8">
          <div className="flex items-start gap-4">
            <div className="rounded-full bg-[#d5b47f]/15 p-3 text-[#d5b47f]">
              {icon}
            </div>
            <div className="flex-1">
              <h1 className="text-3xl font-bold">{title}</h1>
              <p className="mt-2 text-[var(--text-secondary)]">{description}</p>
            </div>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}

function LinkButton({
  children,
  href,
}: {
  children: ReactNode;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="rounded-xl bg-gradient-to-r from-[#f3e2c1] to-[#d5b47f] px-5 py-3 font-semibold text-[#1b1205]"
    >
      {children}
    </Link>
  );
}
