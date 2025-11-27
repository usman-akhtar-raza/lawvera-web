'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Calendar, Clock, User, X } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import { BookingStatus } from '@/types';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

export default function ClientDashboard() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuthStore();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/auth/login?redirect=/dashboard/client');
    }
  }, [isAuthenticated, authLoading, router]);

  const { data: bookings, isLoading, refetch } = useQuery({
    queryKey: ['client-bookings'],
    queryFn: () => api.getClientBookings(),
    enabled: isAuthenticated,
  });

  const handleCancel = async (bookingId: string) => {
    if (!confirm('Are you sure you want to cancel this appointment?')) {
      return;
    }
    try {
      await api.cancelBooking(bookingId);
      toast.success('Appointment cancelled');
      refetch();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to cancel');
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-[#050c26] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#d5b47f]"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const upcoming = bookings?.filter(
    (b) =>
      b.status === BookingStatus.CONFIRMED &&
      new Date(b.slotDate) >= new Date(),
  ) || [];
  const past = bookings?.filter(
    (b) =>
      b.status === BookingStatus.COMPLETED ||
      new Date(b.slotDate) < new Date(),
  ) || [];
  const pending = bookings?.filter(
    (b) => b.status === BookingStatus.PENDING,
  ) || [];

  return (
    <div className="min-h-screen bg-[#050c26] py-8 text-[var(--text-primary)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Welcome, {user?.name}</h1>
          <p className="text-[var(--text-secondary)] mt-2">
            Manage your appointments
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="brand-card p-6">
            <div className="flex items-center">
              <div className="bg-white/5 border border-white/10 p-3 rounded-full">
                <Calendar className="h-6 w-6 text-[#d5b47f]" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-[var(--text-secondary)]">Upcoming</p>
                <p className="text-2xl font-bold">{upcoming.length}</p>
              </div>
            </div>
          </div>
          <div className="brand-card p-6">
            <div className="flex items-center">
              <div className="bg-white/5 border border-white/10 p-3 rounded-full">
                <Clock className="h-6 w-6 text-[#f3c969]" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-[var(--text-secondary)]">Pending</p>
                <p className="text-2xl font-bold">{pending.length}</p>
              </div>
            </div>
          </div>
          <div className="brand-card p-6">
            <div className="flex items-center">
              <div className="bg-white/5 border border-white/10 p-3 rounded-full">
                <User className="h-6 w-6 text-[#46d3a1]" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-[var(--text-secondary)]">Completed</p>
                <p className="text-2xl font-bold">{past.length}</p>
              </div>
            </div>
          </div>
        </div>

        {pending.length > 0 && (
          <div className="brand-card p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4">Pending Appointments</h2>
            <div className="space-y-4">
              {pending.map((booking) => {
                const lawyer = booking.lawyer as any;
                const lawyerUser = lawyer?.user || {};
                return (
                  <div
                    key={booking._id}
                    className="border border-white/10 rounded-lg p-4 bg-white/5"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-lg">
                          {lawyerUser.name || 'Lawyer'}
                        </h3>
                        <p className="text-[var(--text-secondary)]">
                          {lawyer?.specialization}
                        </p>
                        <p className="text-sm text-[var(--text-muted)] mt-1">
                          {format(new Date(booking.slotDate), 'EEEE, MMMM d, yyyy')}{' '}
                          at {booking.slotTime}
                        </p>
                      </div>
                      <button
                        onClick={() => handleCancel(booking._id)}
                        className="px-4 py-2 rounded-lg text-[#ff8c8c] border border-[#ff8c8c]/40 hover:bg-[#3f1d2a] transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="brand-card p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Upcoming Appointments</h2>
          {upcoming.length > 0 ? (
            <div className="space-y-4">
              {upcoming.map((booking) => {
                const lawyer = booking.lawyer as any;
                const lawyerUser = lawyer?.user || {};
                return (
                  <div
                    key={booking._id}
                    className="border border-white/10 rounded-lg p-4 bg-white/5"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-lg">
                          {lawyerUser.name || 'Lawyer'}
                        </h3>
                        <p className="text-[var(--text-secondary)]">
                          {lawyer?.specialization}
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
                        onClick={() => handleCancel(booking._id)}
                        className="px-4 py-2 rounded-lg text-[#ff8c8c] border border-[#ff8c8c]/40 hover:bg-[#3f1d2a] transition-colors"
                      >
                        Cancel
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

        <div className="brand-card p-6">
          <h2 className="text-xl font-semibold mb-4">Past Appointments</h2>
          {past.length > 0 ? (
            <div className="space-y-4">
              {past.map((booking) => {
                const lawyer = booking.lawyer as any;
                const lawyerUser = lawyer?.user || {};
                return (
                  <div
                    key={booking._id}
                    className="border border-white/10 rounded-lg p-4 bg-white/5"
                  >
                    <div>
                      <h3 className="font-semibold text-lg">
                        {lawyerUser.name || 'Lawyer'}
                      </h3>
                      <p className="text-[var(--text-secondary)]">
                        {lawyer?.specialization}
                      </p>
                      <p className="text-sm text-[var(--text-muted)] mt-1">
                        {format(new Date(booking.slotDate), 'EEEE, MMMM d, yyyy')}{' '}
                        at {booking.slotTime}
                      </p>
                      <span
                        className={`inline-block mt-2 px-3 py-1 rounded-full text-sm ${
                          booking.status === BookingStatus.COMPLETED
                            ? 'bg-[#1f3d36] text-[#46d3a1]'
                            : 'bg-white/10 text-[var(--text-secondary)]'
                        }`}
                      >
                        {booking.status}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-[var(--text-muted)]">No past appointments</p>
          )}
        </div>
      </div>
    </div>
  );
}

