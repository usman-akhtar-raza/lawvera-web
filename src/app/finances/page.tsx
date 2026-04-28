'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { ArrowDownLeft, ArrowUpRight, CalendarDays, ReceiptText } from 'lucide-react';
import { api } from '@/lib/api';
import { getErrorMessage } from '@/lib/error-message';
import { useAuthStore } from '@/store/auth';
import { UserRole, type FinanceTransaction } from '@/types';
import { getDashboardRouteForRole } from '@/lib/dashboard-route';

const formatMoney = (amountMinor: number, currency: string) =>
  new Intl.NumberFormat('en-PK', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amountMinor / 100);

const formatDate = (value: string | null) => {
  if (!value) return 'Not available';
  return format(new Date(value), 'MMM d, yyyy h:mm a');
};

const getStatusClass = (status: string) => {
  if (status === 'succeeded') {
    return 'border-[#46d3a1]/40 bg-[#e2f4ed] text-[#1f3d36]';
  }

  return 'border-white/10 bg-white/10 text-[var(--text-secondary)]';
};

function FinanceRow({
  transaction,
  isLawyer,
}: {
  transaction: FinanceTransaction;
  isLawyer: boolean;
}) {
  const Icon = isLawyer ? ArrowDownLeft : ArrowUpRight;
  const label = isLawyer ? 'Received from' : 'Paid to';

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-[#d5b47f]/30 bg-[var(--brand-accent-soft)]">
            <Icon className="h-5 w-5 text-[#b07a43]" />
          </div>
          <div>
            <p className="text-sm uppercase tracking-[0.14em] text-[var(--text-muted)]">
              {label}
            </p>
            <h2 className="mt-1 text-xl font-semibold">
              {transaction.counterparty.name}
            </h2>
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-[var(--text-secondary)]">
              {transaction.counterparty.email && (
                <span>{transaction.counterparty.email}</span>
              )}
              {transaction.counterparty.phone && (
                <span>{transaction.counterparty.phone}</span>
              )}
              {transaction.counterparty.city && (
                <span>{transaction.counterparty.city}</span>
              )}
            </div>
            {transaction.lawyerSpecialization && (
              <p className="mt-2 text-sm text-[var(--text-muted)]">
                {transaction.lawyerSpecialization}
              </p>
            )}
          </div>
        </div>

        <div className="text-left lg:text-right">
          <p className="text-2xl font-bold text-[#b07a43]">
            {formatMoney(transaction.amountMinor, transaction.currency)}
          </p>
          <span
            className={`mt-2 inline-flex rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] ${getStatusClass(
              transaction.paymentStatus,
            )}`}
          >
            {transaction.paymentStatus}
          </span>
        </div>
      </div>

      <div className="mt-5 grid gap-3 border-t border-white/10 pt-4 text-sm text-[var(--text-secondary)] md:grid-cols-3">
        <div className="flex items-center gap-2">
          <ReceiptText className="h-4 w-4 text-[#d5b47f]" />
          <span>Txn: {transaction.txnRefNo}</span>
        </div>
        <div className="flex items-center gap-2">
          <CalendarDays className="h-4 w-4 text-[#d5b47f]" />
          <span>Paid: {formatDate(transaction.paidAt)}</span>
        </div>
        <div className="flex items-center gap-2">
          <CalendarDays className="h-4 w-4 text-[#d5b47f]" />
          <span>
            Appointment: {format(new Date(transaction.appointmentDate), 'MMM d, yyyy')}{' '}
            at {transaction.slotTime}
          </span>
        </div>
      </div>
    </div>
  );
}

export default function FinancesPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuthStore();
  const isAllowedRole =
    user?.role === UserRole.CLIENT || user?.role === UserRole.LAWYER;

  useEffect(() => {
    if (authLoading) return;

    if (!isAuthenticated) {
      router.push('/auth/login?redirect=/finances');
      return;
    }

    if (!isAllowedRole) {
      router.push(getDashboardRouteForRole(user?.role));
    }
  }, [authLoading, isAuthenticated, isAllowedRole, router, user?.role]);

  const {
    data: finances,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['my-finances'],
    queryFn: () => api.getMyFinances(),
    enabled: isAuthenticated && isAllowedRole,
  });

  if (authLoading || isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--background-muted)]">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-[#d5b47f]" />
      </div>
    );
  }

  if (!isAuthenticated || !isAllowedRole) {
    return null;
  }

  const isLawyer = user?.role === UserRole.LAWYER;
  const title = isLawyer ? 'Finances' : 'Payment History';
  const subtitle = isLawyer
    ? 'See clients who have paid you for consultations.'
    : 'See lawyers you have paid for consultations.';
  const totalLabel = isLawyer ? 'Total Received' : 'Total Paid';
  const transactions = finances?.transactions || [];

  return (
    <div className="min-h-screen bg-[var(--background-muted)] py-8 text-[var(--text-primary)]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#b07a43]">
            JazzCash
          </p>
          <h1 className="mt-2 text-3xl font-bold">{title}</h1>
          <p className="mt-2 text-[var(--text-secondary)]">{subtitle}</p>
        </div>

        {isError ? (
          <div className="brand-card p-6">
            <p className="text-[#a23a4c]">
              {getErrorMessage(error, 'Failed to load finances')}
            </p>
          </div>
        ) : (
          <>
            <div className="mb-8 grid gap-6 md:grid-cols-2">
              <div className="brand-card p-6">
                <p className="text-sm text-[var(--text-secondary)]">{totalLabel}</p>
                <p className="mt-2 text-3xl font-bold text-[#b07a43]">
                  {formatMoney(
                    finances?.summary.totalAmountMinor || 0,
                    finances?.summary.currency || 'PKR',
                  )}
                </p>
              </div>
              <div className="brand-card p-6">
                <p className="text-sm text-[var(--text-secondary)]">
                  Paid Transactions
                </p>
                <p className="mt-2 text-3xl font-bold">
                  {finances?.summary.totalTransactions || 0}
                </p>
              </div>
            </div>

            <div className="brand-card p-6">
              <div className="mb-5 flex items-center justify-between">
                <h2 className="text-xl font-semibold">Transactions</h2>
                <span className="rounded-full border border-[#d5b47f]/30 bg-[var(--brand-accent-soft)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-[#b07a43]">
                  Successful payments only
                </span>
              </div>

              {transactions.length > 0 ? (
                <div className="space-y-4">
                  {transactions.map((transaction) => (
                    <FinanceRow
                      key={transaction.id}
                      transaction={transaction}
                      isLawyer={isLawyer}
                    />
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-white/15 bg-white/5 p-8 text-center">
                  <ReceiptText className="mx-auto h-10 w-10 text-[#d5b47f]" />
                  <h2 className="mt-4 text-lg font-semibold">
                    No paid transactions yet
                  </h2>
                  <p className="mt-2 text-[var(--text-secondary)]">
                    Successful JazzCash payments will appear here after the
                    gateway confirms them.
                  </p>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
