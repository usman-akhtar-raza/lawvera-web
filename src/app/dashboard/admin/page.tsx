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
import { UserRole, type Booking, type LawyerProfile, type User } from '@/types';
import toast from 'react-hot-toast';
import { getErrorMessage } from '@/lib/error-message';
import { asLawyerProfile, asUser } from '@/lib/type-guards';
import { getDashboardRouteForRole } from '@/lib/dashboard-route';
import { isAdminRole } from '@/lib/role-utils';

type ManagedUserFormState = {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  city: string;
  phone: string;
  specialization: string;
  experienceYears: string;
  consultationFee: string;
  education: string;
  description: string;
};

const DEFAULT_SPECIALIZATIONS = [
  'Criminal Law',
  'Family Law',
  'Property Law',
  'Corporate Law',
  'Immigration Law',
  'Tax Law',
].map((name, index) => ({
  _id: `default-specialization-${index + 1}`,
  name,
}));

const EMPTY_MANAGED_USER_FORM: ManagedUserFormState = {
  name: '',
  email: '',
  password: '',
  role: UserRole.CLIENT,
  city: '',
  phone: '',
  specialization: '',
  experienceYears: '',
  consultationFee: '',
  education: '',
  description: '',
};

export default function AdminDashboard() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuthStore();
  const hasAdminAccess = isAdminRole(user?.role);
  const isSuperAdmin = user?.role === UserRole.SUPER_ADMIN;
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [bookForm, setBookForm] = useState({
    title: '',
    edition: '',
    jurisdiction: '',
    language: '',
  });
  const [isUploading, setIsUploading] = useState(false);
  const [managedUserForm, setManagedUserForm] =
    useState<ManagedUserFormState>(EMPTY_MANAGED_USER_FORM);
  const [isCreatingUser, setIsCreatingUser] = useState(false);

  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (!isAuthenticated) {
      router.push('/auth/login?redirect=/dashboard/admin');
      return;
    }

    if (user && !hasAdminAccess) {
      router.push(getDashboardRouteForRole(user.role));
    }
  }, [authLoading, hasAdminAccess, isAuthenticated, router, user]);

  const { data: overview, isLoading: overviewLoading, refetch: refetchOverview } = useQuery({
    queryKey: ['admin-overview'],
    queryFn: () => api.getAdminOverview(),
    enabled: isAuthenticated && hasAdminAccess,
  });

  const { data: bookings, isLoading: bookingsLoading } = useQuery({
    queryKey: ['admin-bookings'],
    queryFn: () => api.getAllBookings(),
    enabled: isAuthenticated && hasAdminAccess,
  });

  const { data: analytics, isLoading: analyticsLoading } = useQuery({
    queryKey: ['admin-analytics'],
    queryFn: () => api.getAnalytics(),
    enabled: isAuthenticated && hasAdminAccess,
  });

  const {
    data: lawSources,
    isLoading: lawSourcesLoading,
    refetch: refetchLawSources,
  } = useQuery({
    queryKey: ['admin-law-sources'],
    queryFn: () => api.listLawSources(),
    enabled: isAuthenticated && hasAdminAccess,
  });

  const {
    data: adminUsers,
    isLoading: adminUsersLoading,
    refetch: refetchAdminUsers,
  } = useQuery({
    queryKey: ['super-admin-users'],
    queryFn: () => api.getAdminUsers(),
    enabled: isAuthenticated && isSuperAdmin,
  });

  const { data: specializationOptions = DEFAULT_SPECIALIZATIONS } = useQuery({
    queryKey: ['lawyer-specializations'],
    queryFn: async () => {
      try {
        const specializations = await api.getSpecializations();
        return specializations.length > 0
          ? specializations
          : DEFAULT_SPECIALIZATIONS;
      } catch {
        return DEFAULT_SPECIALIZATIONS;
      }
    },
    enabled: isAuthenticated && isSuperAdmin,
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

  const handleManagedUserCreate = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();
    setIsCreatingUser(true);

    try {
      await api.createManagedUser({
        name: managedUserForm.name,
        email: managedUserForm.email,
        password: managedUserForm.password,
        role: managedUserForm.role,
        city: managedUserForm.city || undefined,
        phone: managedUserForm.phone || undefined,
        specialization: managedUserForm.specialization || undefined,
        experienceYears: managedUserForm.experienceYears
          ? Number(managedUserForm.experienceYears)
          : undefined,
        consultationFee: managedUserForm.consultationFee
          ? Number(managedUserForm.consultationFee)
          : undefined,
        education: managedUserForm.education || undefined,
        description: managedUserForm.description || undefined,
      });
      toast.success(`${managedUserForm.role.replace('_', ' ')} account created`);
      setManagedUserForm(EMPTY_MANAGED_USER_FORM);
      refetchAdminUsers();
      refetchOverview();
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, 'Failed to create managed user'));
    } finally {
      setIsCreatingUser(false);
    }
  };

  if (
    authLoading ||
    overviewLoading ||
    bookingsLoading ||
    analyticsLoading ||
    lawSourcesLoading ||
    (isSuperAdmin && adminUsersLoading)
  ) {
    return (
      <div className="min-h-screen bg-[var(--background-muted)] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#d5b47f]"></div>
      </div>
    );
  }

  if (!isAuthenticated || !hasAdminAccess) {
    return null;
  }

  const pending: LawyerProfile[] = overview?.pending || [];
  const metrics = overview?.metrics || { total: 0, approved: 0, pending: 0 };
  const recentBookings: Booking[] = bookings || [];

  return (
    <div className="min-h-screen bg-[var(--background-muted)] py-8 text-[var(--text-primary)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">
            {isSuperAdmin ? 'Super Admin Dashboard' : 'Admin Dashboard'}
          </h1>
          <p className="text-[var(--text-secondary)] mt-2">
            {isSuperAdmin
              ? 'Manage admins, create platform users, and access all admin tools'
              : 'Manage lawyers and bookings'}
          </p>
        </div>

        {isSuperAdmin && (
          <div className="grid gap-8 mb-8 xl:grid-cols-[1.2fr_0.8fr]">
            <div className="brand-card p-6">
              <div className="mb-5 flex items-center justify-between">
                <h2 className="text-xl font-semibold">Create Managed User</h2>
                <span className="rounded-full border border-[#d5b47f]/40 bg-[var(--brand-accent-soft)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-[#b07a43]">
                  Super admin only
                </span>
              </div>

              <form onSubmit={handleManagedUserCreate} className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <input
                    type="text"
                    value={managedUserForm.name}
                    onChange={(event) =>
                      setManagedUserForm((prev) => ({
                        ...prev,
                        name: event.target.value,
                      }))
                    }
                    placeholder="Full name"
                    className="rounded-lg border border-white/10 bg-[var(--surface-elevated)] px-3 py-2 text-sm"
                    required
                  />
                  <input
                    type="email"
                    value={managedUserForm.email}
                    onChange={(event) =>
                      setManagedUserForm((prev) => ({
                        ...prev,
                        email: event.target.value,
                      }))
                    }
                    placeholder="Email"
                    className="rounded-lg border border-white/10 bg-[var(--surface-elevated)] px-3 py-2 text-sm"
                    required
                  />
                  <input
                    type="password"
                    value={managedUserForm.password}
                    onChange={(event) =>
                      setManagedUserForm((prev) => ({
                        ...prev,
                        password: event.target.value,
                      }))
                    }
                    placeholder="Temporary password"
                    className="rounded-lg border border-white/10 bg-[var(--surface-elevated)] px-3 py-2 text-sm"
                    required
                  />
                  <select
                    value={managedUserForm.role}
                    onChange={(event) =>
                      setManagedUserForm((prev) => ({
                        ...prev,
                        role: event.target.value as UserRole,
                      }))
                    }
                    className="rounded-lg border border-white/10 bg-[var(--surface-elevated)] px-3 py-2 text-sm"
                  >
                    <option value={UserRole.CLIENT}>User</option>
                    <option value={UserRole.LAWYER}>Lawyer</option>
                    <option value={UserRole.ADMIN}>Admin</option>
                  </select>
                  <input
                    type="text"
                    value={managedUserForm.city}
                    onChange={(event) =>
                      setManagedUserForm((prev) => ({
                        ...prev,
                        city: event.target.value,
                      }))
                    }
                    placeholder="City"
                    className="rounded-lg border border-white/10 bg-[var(--surface-elevated)] px-3 py-2 text-sm"
                    required={managedUserForm.role === UserRole.LAWYER}
                  />
                  <input
                    type="text"
                    value={managedUserForm.phone}
                    onChange={(event) =>
                      setManagedUserForm((prev) => ({
                        ...prev,
                        phone: event.target.value,
                      }))
                    }
                    placeholder="Phone"
                    className="rounded-lg border border-white/10 bg-[var(--surface-elevated)] px-3 py-2 text-sm"
                  />
                </div>

                {managedUserForm.role === UserRole.LAWYER && (
                  <div className="grid gap-4 md:grid-cols-2">
                    <select
                      value={managedUserForm.specialization}
                      onChange={(event) =>
                        setManagedUserForm((prev) => ({
                          ...prev,
                          specialization: event.target.value,
                        }))
                      }
                      className="rounded-lg border border-white/10 bg-[var(--surface-elevated)] px-3 py-2 text-sm"
                      required
                    >
                      <option value="">Select specialization</option>
                      {specializationOptions.map((specialization) => (
                        <option
                          key={specialization._id}
                          value={specialization.name}
                        >
                          {specialization.name}
                        </option>
                      ))}
                    </select>
                    <input
                      type="number"
                      min="0"
                      value={managedUserForm.experienceYears}
                      onChange={(event) =>
                        setManagedUserForm((prev) => ({
                          ...prev,
                          experienceYears: event.target.value,
                        }))
                      }
                      placeholder="Experience years"
                      className="rounded-lg border border-white/10 bg-[var(--surface-elevated)] px-3 py-2 text-sm"
                      required
                    />
                    <input
                      type="number"
                      min="0"
                      value={managedUserForm.consultationFee}
                      onChange={(event) =>
                        setManagedUserForm((prev) => ({
                          ...prev,
                          consultationFee: event.target.value,
                        }))
                      }
                      placeholder="Consultation fee"
                      className="rounded-lg border border-white/10 bg-[var(--surface-elevated)] px-3 py-2 text-sm"
                      required
                    />
                    <input
                      type="text"
                      value={managedUserForm.education}
                      onChange={(event) =>
                        setManagedUserForm((prev) => ({
                          ...prev,
                          education: event.target.value,
                        }))
                      }
                      placeholder="Education"
                      className="rounded-lg border border-white/10 bg-[var(--surface-elevated)] px-3 py-2 text-sm"
                    />
                    <textarea
                      value={managedUserForm.description}
                      onChange={(event) =>
                        setManagedUserForm((prev) => ({
                          ...prev,
                          description: event.target.value,
                        }))
                      }
                      placeholder="Lawyer profile description"
                      className="md:col-span-2 min-h-28 rounded-lg border border-white/10 bg-[var(--surface-elevated)] px-3 py-2 text-sm"
                    />
                  </div>
                )}

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={isCreatingUser}
                    className="inline-flex items-center justify-center rounded-lg bg-gradient-to-r from-[#f3e2c1] to-[#d5b47f] px-4 py-2 text-sm font-semibold text-[#1b1205] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isCreatingUser ? 'Creating...' : 'Create User'}
                  </button>
                </div>
              </form>
            </div>

            <div className="brand-card p-6">
              <h2 className="text-xl font-semibold mb-5">Admin Accounts</h2>
              <div className="space-y-3">
                {(adminUsers || []).length > 0 ? (
                  (adminUsers || []).map((adminUser: User) => (
                    <div
                      key={adminUser._id}
                      className="rounded-xl border border-white/10 bg-white/5 p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold">{adminUser.name}</p>
                          <p className="text-sm text-[var(--text-secondary)]">
                            {adminUser.email}
                          </p>
                          <p className="mt-2 text-xs text-[var(--text-muted)]">
                            Created{' '}
                            {adminUser.createdAt
                              ? new Date(adminUser.createdAt).toLocaleDateString()
                              : 'recently'}
                          </p>
                        </div>
                        <span className="rounded-full border border-[#d5b47f]/30 bg-[var(--brand-accent-soft)] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#b07a43]">
                          {adminUser.role === UserRole.SUPER_ADMIN
                            ? 'Super Admin'
                            : 'Admin'}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-[var(--text-muted)]">
                    No admin accounts found.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

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
                                : booking.status === 'awaiting_payment'
                                  ? 'bg-[#f9f0e2] text-[#8a5f2c]'
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
