'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Users, CheckCircle, XCircle, Calendar } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import { LawyerStatus } from '@/types';
import toast from 'react-hot-toast';

export default function AdminDashboard() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuthStore();

  useEffect(() => {
    if (!authLoading && (!isAuthenticated || user?.role !== 'admin')) {
      router.push('/auth/login?redirect=/dashboard/admin');
    }
  }, [isAuthenticated, authLoading, user, router]);

  const { data: overview, isLoading: overviewLoading, refetch: refetchOverview } = useQuery({
    queryKey: ['admin-overview'],
    queryFn: () => api.getAdminOverview(),
    enabled: isAuthenticated && user?.role === 'admin',
  });

  const { data: bookings, isLoading: bookingsLoading } = useQuery({
    queryKey: ['admin-bookings'],
    queryFn: () => api.getAllBookings(),
    enabled: isAuthenticated && user?.role === 'admin',
  });

  const { data: analytics, isLoading: analyticsLoading } = useQuery({
    queryKey: ['admin-analytics'],
    queryFn: () => api.getAnalytics(),
    enabled: isAuthenticated && user?.role === 'admin',
  });

  const handleApprove = async (lawyerId: string) => {
    try {
      await api.approveLawyer(lawyerId);
      toast.success('Lawyer approved');
      refetchOverview();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to approve');
    }
  };

  const handleReject = async (lawyerId: string) => {
    if (!confirm('Are you sure you want to reject this lawyer?')) {
      return;
    }
    try {
      await api.rejectLawyer(lawyerId);
      toast.success('Lawyer rejected');
      refetchOverview();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to reject');
    }
  };

  if (authLoading || overviewLoading || bookingsLoading || analyticsLoading) {
    return (
      <div className="min-h-screen bg-[var(--background-muted)] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#d5b47f]"></div>
      </div>
    );
  }

  if (!isAuthenticated || user?.role !== 'admin') {
    return null;
  }

  const pending = overview?.pending || [];
  const metrics = overview?.metrics || { total: 0, approved: 0, pending: 0 };

  return (
    <div className="min-h-screen bg-[var(--background-muted)] py-8 text-[var(--text-primary)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-[var(--text-secondary)] mt-2">
            Manage lawyers and bookings
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="brand-card p-6">
            <div className="flex items-center">
              <div className="bg-white/5 border border-white/10 p-3 rounded-full">
                <Users className="h-6 w-6 text-[#d5b47f]" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-[var(--text-secondary)]">
                  Total Lawyers
                </p>
                <p className="text-2xl font-bold">{metrics.total}</p>
              </div>
            </div>
          </div>
          <div className="brand-card p-6">
            <div className="flex items-center">
              <div className="bg-white/5 border border-white/10 p-3 rounded-full">
                <CheckCircle className="h-6 w-6 text-[#46d3a1]" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-[var(--text-secondary)]">Approved</p>
                <p className="text-2xl font-bold">{metrics.approved}</p>
              </div>
            </div>
          </div>
          <div className="brand-card p-6">
            <div className="flex items-center">
              <div className="bg-white/5 border border-white/10 p-3 rounded-full">
                <Users className="h-6 w-6 text-[#f3c969]" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-[var(--text-secondary)]">Pending</p>
                <p className="text-2xl font-bold">{metrics.pending}</p>
              </div>
            </div>
          </div>
          <div className="brand-card p-6">
            <div className="flex items-center">
              <div className="bg-white/5 border border-white/10 p-3 rounded-full">
                <Calendar className="h-6 w-6 text-[#9d85ff]" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-[var(--text-secondary)]">
                  Total Bookings
                </p>
                <p className="text-2xl font-bold">{analytics?.total || 0}</p>
              </div>
            </div>
          </div>
        </div>

        {pending.length > 0 && (
          <div className="brand-card p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4">
              Pending Lawyer Approvals
            </h2>
            <div className="space-y-4">
              {pending.map((lawyer: any) => {
                const lawyerUser = lawyer.user as any;
                return (
                  <div
                    key={lawyer._id}
                    className="border border-white/10 rounded-lg p-4 bg-white/5"
                  >
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                      <div>
                        <h3 className="font-semibold text-lg">
                          {lawyerUser?.name || 'Lawyer'}
                        </h3>
                        <p className="text-[var(--text-secondary)]">
                          {lawyerUser?.email}
                        </p>
                        <p className="text-sm text-[var(--text-muted)] mt-1">
                          {lawyer.specialization} • {lawyer.city} •{' '}
                          {lawyer.experienceYears} years
                        </p>
                        {lawyer.description && (
                          <p className="text-sm text-[var(--text-secondary)] mt-2">
                            {lawyer.description.substring(0, 150)}...
                          </p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleApprove(lawyer._id)}
                          className="px-4 py-2 rounded-lg bg-[#e2f4ed] text-[#1f3d36] border border-[#46d3a1]/40 hover:bg-[#d4ede3] flex items-center transition-colors"
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Approve
                        </button>
                        <button
                          onClick={() => handleReject(lawyer._id)}
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
          <h2 className="text-xl font-semibold mb-4">Recent Bookings</h2>
          {bookings && bookings.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-white/10">
                <thead className="bg-white/5">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">
                      Client
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">
                      Lawyer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">
                      Date &amp; Time
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {bookings.slice(0, 10).map((booking: any) => {
                    const client = booking.client as any;
                    const lawyer = booking.lawyer as any;
                    const lawyerUser = lawyer?.user || {};
                    return (
                      <tr key={booking._id} className="hover:bg-white/5">
                        <td className="px-6 py-4 whitespace-nowrap">
                          {client?.name || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {lawyerUser?.name || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-[var(--text-secondary)]">
                          {new Date(booking.slotDate).toLocaleDateString()} at{' '}
                          {booking.slotTime}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-semibold ${
                              booking.status === 'confirmed'
                                ? 'bg-[#e2f4ed] text-[#1f3d36]'
                                : booking.status === 'pending'
                                  ? 'bg-[#f9f0e2] text-[#8a5f2c]'
                                  : booking.status === 'completed'
                                    ? 'bg-[var(--brand-accent-soft)] text-[#8a5f2c]'
                                    : 'bg-[#fde8ed] text-[#a23a4c]'
                            }`}
                          >
                            {booking.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-[var(--text-muted)]">No bookings found</p>
          )}
        </div>
      </div>
    </div>
  );
}

