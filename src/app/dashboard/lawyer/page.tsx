'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Calendar, Clock, CheckCircle, XCircle, Settings } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import { BookingStatus } from '@/types';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

export default function LawyerDashboard() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuthStore();
  const [selectedBooking, setSelectedBooking] = useState<string | null>(null);
  const [statusAction, setStatusAction] = useState<BookingStatus | null>(null);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/auth/login?redirect=/dashboard/lawyer');
    }
  }, [isAuthenticated, authLoading, router]);

  const { data: dashboard, isLoading, refetch } = useQuery({
    queryKey: ['lawyer-dashboard'],
    queryFn: () => api.getLawyerDashboard(),
    enabled: isAuthenticated,
  });

  const handleStatusUpdate = async (bookingId: string, status: BookingStatus) => {
    try {
      await api.updateBookingStatus(bookingId, { status });
      toast.success(`Appointment ${status}`);
      refetch();
      setSelectedBooking(null);
      setStatusAction(null);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update status');
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-[var(--background-muted)] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#d5b47f]"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
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

        {profile?.status === 'pending' && (
          <div className="rounded-lg border border-[#f3c969]/30 bg-[#f9f0e2] p-4 mb-6">
            <p className="text-[#8a5f2c]">
              Your profile is pending approval. You'll be able to receive
              bookings once approved.
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
              {pending.map((booking: any) => {
                const client = booking.client as any;
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
              {upcoming.map((booking: any) => {
                const client = booking.client as any;
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

