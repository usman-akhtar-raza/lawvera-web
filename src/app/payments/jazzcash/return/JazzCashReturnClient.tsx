'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, CheckCircle2, Clock3, ShieldCheck } from 'lucide-react';
import { format } from 'date-fns';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import { BookingStatus, PaymentStatus } from '@/types';
import { asLawyerProfile, asUser } from '@/lib/type-guards';

const CALLBACK_FAILURE_STATES = new Set([
  'failed',
  'expired',
  'invalid_callback',
  'invalid_checkout',
  'unknown_booking',
  'unknown_transaction',
  'validation_failed',
  'verification_failed',
]);

type JazzCashReturnClientProps = {
  bookingId?: string;
  callbackStatus?: string;
};

export function JazzCashReturnClient({
  bookingId,
  callbackStatus = '',
}: JazzCashReturnClientProps) {
  const { isAuthenticated, isLoading: authLoading } = useAuthStore();

  const { data: booking, isLoading } = useQuery({
    queryKey: ['booking-payment-status', bookingId],
    queryFn: () => api.getBookingPaymentStatus(bookingId!),
    enabled: Boolean(bookingId && isAuthenticated),
    retry: 1,
  });

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[var(--background-muted)] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#d5b47f]"></div>
      </div>
    );
  }

  const loginRedirect = `/auth/login?redirect=${encodeURIComponent(
    `/payments/jazzcash/return${bookingId ? `?bookingId=${bookingId}${callbackStatus ? `&status=${callbackStatus}` : ''}` : ''}`,
  )}`;

  if (!bookingId) {
    return (
      <div className="min-h-screen bg-[var(--background-muted)] py-12 text-[var(--text-primary)]">
        <div className="max-w-3xl mx-auto px-4">
          <div className="brand-card p-8 text-center">
            <AlertTriangle className="mx-auto h-12 w-12 text-[#b07a43]" />
            <h1 className="mt-4 text-3xl font-bold">Payment status unavailable</h1>
            <p className="mt-3 text-[var(--text-secondary)]">
              The JazzCash return did not include a booking reference. Check your dashboard for the latest booking status.
            </p>
            <div className="mt-6 flex justify-center gap-3">
              <Link
                href={isAuthenticated ? '/dashboard/client' : loginRedirect}
                className="px-5 py-3 rounded-xl bg-gradient-to-r from-[#f3e2c1] to-[#d5b47f] text-[#1b1205] font-semibold"
              >
                {isAuthenticated ? 'Open Dashboard' : 'Sign In'}
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[var(--background-muted)] py-12 text-[var(--text-primary)]">
        <div className="max-w-3xl mx-auto px-4">
          <div className="brand-card p-8 text-center">
            <ShieldCheck className="mx-auto h-12 w-12 text-[#d5b47f]" />
            <h1 className="mt-4 text-3xl font-bold">Sign in to confirm the payment result</h1>
            <p className="mt-3 text-[var(--text-secondary)]">
              JazzCash redirected back successfully. Sign in to fetch the verified booking status from Lawvera.
            </p>
            <div className="mt-6 flex justify-center gap-3">
              <Link
                href={loginRedirect}
                className="px-5 py-3 rounded-xl bg-gradient-to-r from-[#f3e2c1] to-[#d5b47f] text-[#1b1205] font-semibold"
              >
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading || !booking) {
    return (
      <div className="min-h-screen bg-[var(--background-muted)] flex items-center justify-center">
        <div className="text-center text-[var(--text-secondary)]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#d5b47f] mx-auto"></div>
          <p className="mt-4">Checking your payment status...</p>
        </div>
      </div>
    );
  }

  const lawyer = asLawyerProfile(booking.lawyer);
  const lawyerUser = asUser(lawyer?.user);
  const payment = booking.payment;
  const formattedAmount = new Intl.NumberFormat('en-PK', {
    maximumFractionDigits: 2,
  }).format((payment?.amountMinor || 0) / 100);

  const isSuccess =
    payment?.status === PaymentStatus.SUCCEEDED &&
    booking.status !== BookingStatus.CANCELLED;
  const isPending =
    payment?.status === PaymentStatus.PENDING || callbackStatus === 'pending';
  const isFailure =
    CALLBACK_FAILURE_STATES.has(callbackStatus) ||
    payment?.status === PaymentStatus.FAILED ||
    payment?.status === PaymentStatus.CANCELLED ||
    payment?.status === PaymentStatus.EXPIRED ||
    booking.status === BookingStatus.CANCELLED;

  const title = isSuccess
    ? 'Payment received'
    : isPending
      ? 'Payment is still processing'
      : 'Payment was not completed';

  const description = isSuccess
    ? 'Your appointment request is now pending lawyer approval.'
    : isPending
      ? 'JazzCash has not finalized the transaction yet. Refresh later or check your dashboard.'
      : 'The appointment was not promoted to an active request. You can start checkout again from the lawyer profile.';

  return (
    <div className="min-h-screen bg-[var(--background-muted)] py-12 text-[var(--text-primary)]">
      <div className="max-w-3xl mx-auto px-4">
        <div className="brand-card p-8">
          <div className="flex items-start gap-4">
            <div
              className={`rounded-full p-3 ${
                isSuccess
                  ? 'bg-[#e2f4ed] text-[#1f3d36]'
                  : isPending
                    ? 'bg-[#f9f0e2] text-[#8a5f2c]'
                    : 'bg-[#fde8ed] text-[#a23a4c]'
              }`}
            >
              {isSuccess ? (
                <CheckCircle2 className="h-8 w-8" />
              ) : isPending ? (
                <Clock3 className="h-8 w-8" />
              ) : (
                <AlertTriangle className="h-8 w-8" />
              )}
            </div>
            <div className="flex-1">
              <h1 className="text-3xl font-bold">{title}</h1>
              <p className="mt-2 text-[var(--text-secondary)]">{description}</p>
            </div>
          </div>

          <div className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-5">
            <div className="grid gap-3 sm:grid-cols-2">
              <p>
                <span className="text-[var(--text-muted)]">Lawyer: </span>
                {lawyerUser?.name || 'Lawyer'}
              </p>
              <p>
                <span className="text-[var(--text-muted)]">Fee: </span>
                PKR {formattedAmount}
              </p>
              <p>
                <span className="text-[var(--text-muted)]">Appointment: </span>
                {format(new Date(booking.slotDate), 'EEEE, MMM d, yyyy')} at {booking.slotTime}
              </p>
              <p>
                <span className="text-[var(--text-muted)]">Payment status: </span>
                {payment.status}
              </p>
              {payment.txnRefNo && (
                <p className="sm:col-span-2">
                  <span className="text-[var(--text-muted)]">Reference: </span>
                  {payment.txnRefNo}
                </p>
              )}
              {payment.responseMessage && (
                <p className="sm:col-span-2">
                  <span className="text-[var(--text-muted)]">Provider message: </span>
                  {payment.responseMessage}
                </p>
              )}
            </div>
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/dashboard/client"
              className="px-5 py-3 rounded-xl bg-gradient-to-r from-[#f3e2c1] to-[#d5b47f] text-[#1b1205] font-semibold"
            >
              Open Dashboard
            </Link>
            {lawyer?._id && isFailure && (
              <Link
                href={`/lawyers/${lawyer._id}`}
                className="px-5 py-3 rounded-xl border border-white/10 text-[var(--text-primary)] hover:bg-white/5"
              >
                Try Again
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
