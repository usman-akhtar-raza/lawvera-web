'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import {
  Calendar,
  Clock,
  CheckCircle,
  ExternalLink,
  Link2,
  Settings,
  XCircle,
} from 'lucide-react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import { BookingStatus, LawyerStatus } from '@/types';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { getErrorMessage } from '@/lib/error-message';
import { asUser } from '@/lib/type-guards';
import { getDashboardRouteForRole } from '@/lib/dashboard-route';
import { UserRole } from '@/types';

export default function LawyerDashboard() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuthStore();
  const isLawyer = user?.role === UserRole.LAWYER;

  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (!isAuthenticated) {
      router.replace('/auth/login?redirect=/dashboard/lawyer');
      return;
    }

    if (user && !isLawyer) {
      router.replace(getDashboardRouteForRole(user.role));
    }
  }, [authLoading, isAuthenticated, isLawyer, router, user]);

  const { data: dashboard, isLoading, refetch } = useQuery({
    queryKey: ['lawyer-dashboard'],
    queryFn: () => api.getLawyerDashboard(),
    enabled: isAuthenticated && isLawyer,
  });
  const [savingMeetingLinkId, setSavingMeetingLinkId] = useState<string | null>(
    null,
  );

  const handleStatusUpdate = async (bookingId: string, status: BookingStatus) => {
    try {
      await api.updateBookingStatus(bookingId, { status });
      toast.success(`Appointment ${status}`);
      refetch();
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, 'Failed to update status'));
    }
  };

  const handleMeetingLinkSave = async (
    event: React.FormEvent<HTMLFormElement>,
    bookingId: string,
  ) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const rawMeetingLink = formData.get('meetingLink');
    const meetingLink =
      typeof rawMeetingLink === 'string' ? rawMeetingLink.trim() : '';

    if (!meetingLink) {
      toast.error('Please enter a valid meeting link');
      return;
    }

    setSavingMeetingLinkId(bookingId);
    try {
      await api.updateBookingMeetingLink(bookingId, meetingLink);
      toast.success('Meeting link saved and emailed to the client');
      refetch();
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, 'Failed to save meeting link'));
    } finally {
      setSavingMeetingLinkId(null);
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-[var(--background-muted)] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#d5b47f]"></div>
      </div>
    );
  }

  if (!isAuthenticated || !isLawyer) {
    return null;
  }

  const profile = dashboard?.profile;
  const stats = dashboard?.stats || { pending: 0, upcoming: 0, completed: 0 };
  const pending = dashboard?.pending || [];
  const upcoming = dashboard?.upcoming || [];

  return (
    <div className="min-h-screen bg-[var(--background-muted)] py-8 text-[var(--text-primary)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Lawyer Dashboard</h1>
            <p className="text-[var(--text-secondary)] mt-2">
              Manage your appointments
            </p>
          </div>
          <button
            onClick={() => router.push('/profile')}
            className="px-4 py-2 rounded-lg bg-gradient-to-r from-[#f3e2c1] to-[#d5b47f] text-[#1b1205] font-semibold hover:shadow-lg hover:shadow-[#d5b47f]/30 flex items-center"
          >
            <Settings className="h-5 w-5 mr-2" />
            Settings
          </button>
        </div>

        {profile?.status === LawyerStatus.PENDING && (
          <div className="rounded-lg border border-[#f3c969]/30 bg-[#f9f0e2] p-4 mb-6">
            <p className="text-[#8a5f2c]">
              Your profile is pending approval. You&apos;ll be able to receive
              bookings once approved.
            </p>
          </div>
        )}

        {profile?.status === LawyerStatus.REJECTED && (
          <div className="rounded-lg border border-[#ff8c8c]/30 bg-[#fde8ed] p-4 mb-6">
            <p className="text-[#8f3345]">
              Your lawyer profile is currently rejected. You can update your time
              slots from settings, but your profile will stay hidden from clients
              until admin approval.
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="brand-card p-6">
            <div className="flex items-center">
              <div className="bg-white/5 border border-white/10 p-3 rounded-full">
                <Clock className="h-6 w-6 text-[#f3c969]" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-[var(--text-secondary)]">Pending</p>
                <p className="text-2xl font-bold">{stats.pending}</p>
              </div>
            </div>
          </div>
          <div className="brand-card p-6">
            <div className="flex items-center">
              <div className="bg-white/5 border border-white/10 p-3 rounded-full">
                <Calendar className="h-6 w-6 text-[#d5b47f]" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-[var(--text-secondary)]">Upcoming</p>
                <p className="text-2xl font-bold">{stats.upcoming}</p>
              </div>
            </div>
          </div>
          <div className="brand-card p-6">
            <div className="flex items-center">
              <div className="bg-white/5 border border-white/10 p-3 rounded-full">
                <CheckCircle className="h-6 w-6 text-[#46d3a1]" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-[var(--text-secondary)]">Completed</p>
                <p className="text-2xl font-bold">{stats.completed}</p>
              </div>
            </div>
          </div>
        </div>

        {pending.length > 0 && (
          <div className="brand-card p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4">Pending Approvals</h2>
            <div className="space-y-4">
              {pending.map((booking) => {
                const client = asUser(booking.client);
                return (
                  <div
                    key={booking._id}
                    className="border border-white/10 rounded-lg p-4 bg-white/5"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-lg">
                          {client?.name || 'Client'}
                        </h3>
                        <p className="text-[var(--text-secondary)]">
                          {client?.email}
                        </p>
                        <p className="text-sm text-[var(--text-muted)] mt-1">
                          {format(new Date(booking.slotDate), 'EEEE, MMMM d, yyyy')}{' '}
                          at {booking.slotTime}
                        </p>
                        {booking.reason && (
                          <p className="text-sm text-[var(--text-secondary)] mt-2">
                            Reason: {booking.reason}
                          </p>
                        )}
                        <form
                          onSubmit={(event) =>
                            handleMeetingLinkSave(event, booking._id)
                          }
                          className="mt-4 flex flex-col gap-3 sm:flex-row"
                        >
                          <input
                            name="meetingLink"
                            type="url"
                            defaultValue={booking.meetingLink || ''}
                            placeholder="https://meet.google.com/abc-defg-hij"
                            className="flex-1 rounded-lg border border-white/10 bg-[var(--surface-elevated)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[#d5b47f]"
                          />
                          <button
                            type="submit"
                            disabled={savingMeetingLinkId === booking._id}
                            className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#d5b47f]/40 bg-[var(--brand-accent-soft)] px-4 py-2 text-sm font-semibold text-[#b07a43] transition hover:border-[#d5b47f] disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <Link2 className="h-4 w-4" />
                            {savingMeetingLinkId === booking._id
                              ? 'Sending...'
                              : booking.meetingLink
                                ? 'Update Link'
                                : 'Send Link'}
                          </button>
                        </form>
                        <p className="mt-2 text-xs text-[var(--text-muted)]">
                          Saving a meeting link emails it directly to the client.
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() =>
                            handleStatusUpdate(booking._id, BookingStatus.CONFIRMED)
                          }
                          className="px-4 py-2 rounded-lg bg-[#e2f4ed] text-[#1f3d36] border border-[#46d3a1]/40 hover:bg-[#d4ede3] flex items-center transition-colors"
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Approve
                        </button>
                        <button
                          onClick={() =>
                            handleStatusUpdate(booking._id, BookingStatus.CANCELLED)
                          }
                          className="px-4 py-2 rounded-lg bg-[#fde8ed] text-[#a23a4c] border border-[#ff8c8c]/40 hover:bg-[#fad6df] flex items-center transition-colors"
                        >
                          <XCircle className="h-4 w-4 mr-2" />
                          Reject
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="brand-card p-6">
          <h2 className="text-xl font-semibold mb-4">Upcoming Appointments</h2>
          {upcoming.length > 0 ? (
            <div className="space-y-4">
              {upcoming.map((booking) => {
                const client = asUser(booking.client);
                return (
                  <div
                    key={booking._id}
                    className="border border-white/10 rounded-lg p-4 bg-white/5"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-lg">
                          {client?.name || 'Client'}
                        </h3>
                        <p className="text-[var(--text-secondary)]">
                          {client?.email}
                        </p>
                        <p className="text-sm text-[var(--text-muted)] mt-1">
                          {format(new Date(booking.slotDate), 'EEEE, MMMM d, yyyy')}{' '}
                          at {booking.slotTime}
                        </p>
                        {booking.reason && (
                          <p className="text-sm text-[var(--text-secondary)] mt-2">
                            Reason: {booking.reason}
                          </p>
                        )}
                        <form
                          onSubmit={(event) =>
                            handleMeetingLinkSave(event, booking._id)
                          }
                          className="mt-4 flex flex-col gap-3 sm:flex-row"
                        >
                          <input
                            name="meetingLink"
                            type="url"
                            defaultValue={booking.meetingLink || ''}
                            placeholder="https://meet.google.com/abc-defg-hij"
                            className="flex-1 rounded-lg border border-white/10 bg-[var(--surface-elevated)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[#d5b47f]"
                          />
                          <button
                            type="submit"
                            disabled={savingMeetingLinkId === booking._id}
                            className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#d5b47f]/40 bg-[var(--brand-accent-soft)] px-4 py-2 text-sm font-semibold text-[#b07a43] transition hover:border-[#d5b47f] disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <Link2 className="h-4 w-4" />
                            {savingMeetingLinkId === booking._id
                              ? 'Sending...'
                              : booking.meetingLink
                                ? 'Update Link'
                                : 'Send Link'}
                          </button>
                        </form>
                        {booking.meetingLink && (
                          <a
                            href={booking.meetingLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-3 inline-flex items-center gap-2 text-sm font-medium text-[#d5b47f] hover:text-[#f3e2c1]"
                          >
                            <ExternalLink className="h-4 w-4" />
                            Open current meeting link
                          </a>
                        )}
                      </div>
                      <button
                        onClick={() =>
                          handleStatusUpdate(booking._id, BookingStatus.COMPLETED)
                        }
                        className="px-4 py-2 rounded-lg bg-gradient-to-r from-[#f3e2c1] to-[#d5b47f] text-[#1b1205] font-semibold hover:shadow-lg hover:shadow-[#d5b47f]/30"
                      >
                        Mark Complete
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-[var(--text-muted)]">No upcoming appointments</p>
          )}
        </div>
      </div>
    </div>
  );
}
