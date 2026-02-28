'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import {
  Users,
  CheckCircle,
  XCircle,
  Calendar,
  BookOpen,
  Upload,
  Trash2,
} from 'lucide-react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import type { Booking, LawyerProfile } from '@/types';
import toast from 'react-hot-toast';
import { getErrorMessage } from '@/lib/error-message';
import { asLawyerProfile, asUser } from '@/lib/type-guards';

export default function AdminDashboard() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuthStore();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [bookForm, setBookForm] = useState({
    title: '',
    edition: '',
    jurisdiction: '',
    language: '',
  });
  const [isUploading, setIsUploading] = useState(false);

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

  const {
    data: lawSources,
    isLoading: lawSourcesLoading,
    refetch: refetchLawSources,
  } = useQuery({
    queryKey: ['admin-law-sources'],
    queryFn: () => api.listLawSources(),
    enabled: isAuthenticated && user?.role === 'admin',
  });

  const handleApprove = async (lawyerId: string) => {
    try {
      await api.approveLawyer(lawyerId);
      toast.success('Lawyer approved');
      refetchOverview();
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, 'Failed to approve'));
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
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, 'Failed to reject'));
    }
  };

  const handleBookUpload = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedFile) {
      toast.error('Please select a source file');
      return;
    }

    setIsUploading(true);
    try {
      await api.uploadLawSource(selectedFile, {
        title: bookForm.title || undefined,
        edition: bookForm.edition || undefined,
        jurisdiction: bookForm.jurisdiction || undefined,
        language: bookForm.language || undefined,
      });
      setSelectedFile(null);
      setBookForm({ title: '', edition: '', jurisdiction: '', language: '' });
      toast.success('Book uploaded. Ingestion started.');
      refetchLawSources();
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, 'Failed to upload source'));
    } finally {
      setIsUploading(false);
    }
  };

  const handleToggleSource = async (
    sourceId: string,
    status: 'active' | 'disabled',
  ) => {
    try {
      await api.updateLawSourceStatus(sourceId, status);
      refetchLawSources();
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, 'Failed to update source status'));
    }
  };

  const handleDeleteSource = async (sourceId: string) => {
    if (!confirm('Delete this law source?')) {
      return;
    }
    try {
      await api.deleteLawSource(sourceId);
      toast.success('Source deleted');
      refetchLawSources();
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, 'Failed to delete source'));
    }
  };

  if (
    authLoading ||
    overviewLoading ||
    bookingsLoading ||
    analyticsLoading ||
    lawSourcesLoading
  ) {
    return (
      <div className="min-h-screen bg-[var(--background-muted)] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#d5b47f]"></div>
      </div>
    );
  }

  if (!isAuthenticated || user?.role !== 'admin') {
    return null;
  }

  const pending: LawyerProfile[] = overview?.pending || [];
  const metrics = overview?.metrics || { total: 0, approved: 0, pending: 0 };
  const recentBookings: Booking[] = bookings || [];

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
              {pending.map((lawyer) => {
                const lawyerUser = asUser(lawyer.user);
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

        <div className="brand-card p-6 mb-8">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-xl font-semibold">Law Books</h2>
            <span className="rounded-full border border-[#d5b47f]/40 bg-[var(--brand-accent-soft)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-[#b07a43]">
              Admin only
            </span>
          </div>

          <form onSubmit={handleBookUpload} className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="grid gap-3 md:grid-cols-2">
              <input
                type="text"
                value={bookForm.title}
                onChange={(event) =>
                  setBookForm((prev) => ({ ...prev, title: event.target.value }))
                }
                placeholder="Title (optional)"
                className="rounded-lg border border-white/10 bg-[var(--surface-elevated)] px-3 py-2 text-sm"
              />
              <input
                type="text"
                value={bookForm.edition}
                onChange={(event) =>
                  setBookForm((prev) => ({ ...prev, edition: event.target.value }))
                }
                placeholder="Edition (optional)"
                className="rounded-lg border border-white/10 bg-[var(--surface-elevated)] px-3 py-2 text-sm"
              />
              <input
                type="text"
                value={bookForm.jurisdiction}
                onChange={(event) =>
                  setBookForm((prev) => ({
                    ...prev,
                    jurisdiction: event.target.value,
                  }))
                }
                placeholder="Jurisdiction (optional)"
                className="rounded-lg border border-white/10 bg-[var(--surface-elevated)] px-3 py-2 text-sm"
              />
              <input
                type="text"
                value={bookForm.language}
                onChange={(event) =>
                  setBookForm((prev) => ({ ...prev, language: event.target.value }))
                }
                placeholder="Language (optional)"
                className="rounded-lg border border-white/10 bg-[var(--surface-elevated)] px-3 py-2 text-sm"
              />
            </div>
            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-white/10 bg-[var(--surface-elevated)] px-3 py-2 text-sm">
                <BookOpen className="h-4 w-4 text-[#b07a43]" />
                <span>{selectedFile ? selectedFile.name : 'Choose PDF/TXT/MD'}</span>
                <input
                  type="file"
                  accept=".pdf,.txt,.md"
                  className="hidden"
                  onChange={(event) =>
                    setSelectedFile(event.target.files?.[0] || null)
                  }
                />
              </label>
              <button
                type="submit"
                disabled={isUploading || !selectedFile}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-[#f3e2c1] to-[#d5b47f] px-4 py-2 text-sm font-semibold text-[#1b1205] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Upload className="h-4 w-4" />
                {isUploading ? 'Uploading...' : 'Upload and ingest'}
              </button>
            </div>
          </form>

          <div className="mt-4 space-y-3">
            {lawSources && lawSources.length > 0 ? (
              lawSources.map((source) => (
                <div
                  key={source.id}
                  className="rounded-xl border border-white/10 bg-white/5 p-4"
                >
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="font-semibold text-[var(--text-primary)]">
                        {source.title}
                      </p>
                      <p className="text-xs text-[var(--text-muted)]">
                        {source.jurisdiction || 'General'} •{' '}
                        {source.language || 'Unknown language'} •{' '}
                        {new Date(source.createdAt).toLocaleDateString()}
                      </p>
                      <p className="mt-1 text-xs text-[var(--text-secondary)]">
                        Status: {source.status} • Ingestion: {source.ingestionStatus}
                        {source.warningText ? ` • ${source.warningText}` : ''}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() =>
                          handleToggleSource(
                            source.id,
                            source.status === 'active' ? 'disabled' : 'active',
                          )
                        }
                        className="rounded-lg border border-white/20 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.1em] hover:border-[#d5b47f]/50"
                      >
                        {source.status === 'active' ? 'Disable' : 'Enable'}
                      </button>
                      <button
                        onClick={() => handleDeleteSource(source.id)}
                        className="inline-flex items-center gap-1 rounded-lg border border-[#ff8c8c]/40 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.1em] text-[#a23a4c] hover:bg-[#fde8ed]"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-[var(--text-muted)]">
                No law books uploaded yet.
              </p>
            )}
          </div>
        </div>

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
                  {recentBookings.slice(0, 10).map((booking) => {
                    const client = asUser(booking.client);
                    const lawyer = asLawyerProfile(booking.lawyer);
                    const lawyerUser = asUser(lawyer?.user);
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
