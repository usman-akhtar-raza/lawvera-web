'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Moon, Sun, Clock, CheckCircle, XCircle } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { useAuthStore } from '@/store/auth';
import { useTheme } from '@/components/providers/ThemeProvider';
import { getRoleDisplayName } from '@/lib/role-display';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';
import { getErrorMessage } from '@/lib/error-message';
import type { AuthResponse } from '@/types';

const themeOptions = [
  {
    value: 'light' as const,
    title: 'Light mode',
    description: 'Bright, editorial surfaces with champagne highlights.',
    icon: Sun,
  },
  {
    value: 'dark' as const,
    title: 'Dark mode',
    description: 'Deep midnight blues that match the original brand palette.',
    icon: Moon,
  },
];

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const TIME_SLOTS = [
  '9:00 AM', '10:00 AM', '11:00 AM', '12:00 PM',
  '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM',
];
const SPECIALIZATIONS = [
  'Criminal Law', 'Family Law', 'Property Law',
  'Corporate Law', 'Immigration Law', 'Tax Law',
];

interface LawyerApplyForm {
  specialization: string;
  experienceYears: number;
  city: string;
  consultationFee: number;
  education?: string;
  description?: string;
}

export default function ProfileSettingsPage() {
  const { user, lawyerProfile, isAuthenticated, setAuth, setLawyerProfile } = useAuthStore();
  const { theme, setTheme, toggleTheme } = useTheme();

  // true = form is open (only relevant when user is a client)
  const [formOpen, setFormOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isReverting, setIsReverting] = useState(false);
  const [availability, setAvailability] = useState<Array<{ day: string; slots: string[] }>>(
    DAYS.map((day) => ({ day, slots: [] })),
  );

  const { register, handleSubmit, formState: { errors }, reset } = useForm<LawyerApplyForm>();

  const inputClass =
    'mt-1 block w-full px-3 py-2 rounded-lg bg-[var(--surface-elevated)] border border-white/10 text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[#d5b47f] text-sm';
  const labelClass = 'block text-sm font-medium text-[var(--text-secondary)]';

  const isClient  = user?.role === 'client';
  const isLawyer  = user?.role === 'lawyer';

  // Toggle is ON when the user is a lawyer OR when a client has opened the form
  const toggleOn = isLawyer || (isClient && formOpen);

  const handleToggle = () => {
    if (isClient) {
      // client: open / close the apply form
      setFormOpen((v) => !v);
    } else if (isLawyer) {
      // lawyer: revert back to client (no confirmation, as requested)
      void handleRevertToClient();
    }
  };

  const toggleSlot = (day: string, slot: string) => {
    setAvailability((prev) =>
      prev.map((item) =>
        item.day === day
          ? {
              ...item,
              slots: item.slots.includes(slot)
                ? item.slots.filter((s) => s !== slot)
                : [...item.slots, slot],
            }
          : item,
      ),
    );
  };

  const onSubmit = async (data: LawyerApplyForm) => {
    setIsSubmitting(true);
    try {
      const filledAvailability = availability.filter((a) => a.slots.length > 0);
      const response = await api.applyAsLawyer({
        specialization: data.specialization,
        experienceYears: Number(data.experienceYears),
        city: data.city,
        consultationFee: Number(data.consultationFee),
        education: data.education,
        description: data.description,
        availability: filledAvailability,
      });
      const r = response as AuthResponse;
      setAuth(r.user, r.tokens, r.lawyerProfile);
      setLawyerProfile(r.lawyerProfile ?? null);
      toast.success('Application submitted! Pending admin approval.');
      setFormOpen(false);
      reset();
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, 'Failed to submit application.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRevertToClient = async () => {
    setIsReverting(true);
    try {
      const response = await api.revertToClient();
      const r = response as AuthResponse;
      // Keep the lawyerProfile in the store so its data is still accessible,
      // but update user role to client and refresh tokens
      setAuth(r.user, r.tokens, lawyerProfile ?? undefined);
      toast.success('Switched back to client account.');
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, 'Failed to switch role.'));
    } finally {
      setIsReverting(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[var(--background-muted)] flex items-center justify-center px-4 text-[var(--text-primary)]">
        <div className="brand-card max-w-md w-full p-5 sm:p-8 text-center space-y-4">
          <h1 className="text-2xl font-semibold">Sign in to access settings</h1>
          <p className="text-sm text-[var(--text-muted)]">
            Login to customize your account preferences and appearance.
          </p>
          <Link
            href="/auth/login"
            className="inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-[#f3e2c1] to-[#d5b47f] px-6 py-3 text-sm font-semibold text-[#1b1205] transition hover:opacity-90"
          >
            Go to login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--background-muted)] py-10 px-4 text-[var(--text-primary)]">
      <div className="max-w-4xl mx-auto space-y-6">

        {/* Header */}
        <section className="brand-card p-6">
          <h1 className="text-3xl font-bold">Profile Settings</h1>
          <p className="text-[var(--text-secondary)] mt-2">
            Manage your account details and personalize your experience.
          </p>
        </section>

        {/* Appearance */}
        <section className="brand-card p-6 space-y-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold">Appearance</h2>
              <p className="text-sm text-[var(--text-muted)]">
                Toggle between light and dark modes or pick a style below.
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={theme === 'dark'}
              onClick={toggleTheme}
              className={`relative inline-flex h-8 w-16 items-center rounded-full transition ${
                theme === 'dark' ? 'bg-[#1f3d36]' : 'bg-[#d5b47f]'
              }`}
            >
              <span
                className={`inline-flex h-7 w-7 transform items-center justify-center rounded-full bg-white shadow transition ${
                  theme === 'dark' ? 'translate-x-8' : 'translate-x-1'
                }`}
              >
                {theme === 'dark'
                  ? <Moon className="h-4 w-4 text-[#1f3d36]" />
                  : <Sun className="h-4 w-4 text-[#b07a43]" />}
              </span>
            </button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {themeOptions.map((option) => {
              const Icon = option.icon;
              const isActive = theme === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setTheme(option.value)}
                  className={`text-left rounded-2xl border p-4 transition ${
                    isActive
                      ? 'border-[#d5b47f] bg-[var(--brand-accent-soft)] shadow-lg shadow-[#d5b47f]/20'
                      : 'border-white/10 hover:border-[#d5b47f]/40'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="rounded-xl bg-white px-3 py-2 text-[#b07a43] shadow">
                      <Icon className="h-5 w-5" />
                    </span>
                    <div>
                      <p className="font-semibold">{option.title}</p>
                      <p className="text-sm text-[var(--text-muted)]">{option.description}</p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* Account overview */}
        <section className="brand-card p-6 space-y-4">
          <h2 className="text-xl font-semibold">Account overview</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-sm text-[var(--text-muted)]">Name</p>
              <p className="text-lg font-medium mt-1">{user?.name}</p>
            </div>
            <div>
              <p className="text-sm text-[var(--text-muted)]">Email</p>
              <p className="text-lg font-medium mt-1">{user?.email}</p>
            </div>
            <div>
              <p className="text-sm text-[var(--text-muted)]">Role</p>
              <p className="text-lg font-medium mt-1 text-[#b07a43]">
                {getRoleDisplayName(user?.role)}
              </p>
            </div>
            <div>
              <p className="text-sm text-[var(--text-muted)]">Member since</p>
              <p className="text-lg font-medium mt-1">
                {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : '—'}
              </p>
            </div>
          </div>
        </section>

        {/* ── Lawyer toggle section (hidden for admin) ── */}
        {user?.role !== 'admin' && (
          <section className="brand-card p-6 space-y-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-semibold">Lawyer Account</h2>
                <p className="text-sm text-[var(--text-muted)]">
                  {isLawyer
                    ? 'Toggle off to switch back to a client account. Your lawyer profile will be saved.'
                    : 'Toggle on to apply and list your profile as a verified lawyer.'}
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={toggleOn}
                disabled={isReverting || isSubmitting}
                onClick={handleToggle}
                className={`relative inline-flex h-8 w-16 shrink-0 items-center rounded-full transition disabled:opacity-50 disabled:cursor-not-allowed ${
                  toggleOn ? 'bg-[#d5b47f]' : 'bg-white/10'
                }`}
              >
                <span
                  className={`inline-flex h-7 w-7 transform items-center justify-center rounded-full bg-white shadow transition ${
                    toggleOn ? 'translate-x-8' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* CLIENT: apply form */}
            {isClient && formOpen && (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 pt-2 border-t border-white/10">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className={labelClass}>Specialization *</label>
                    <select
                      {...register('specialization', { required: 'Specialization is required' })}
                      className={inputClass}
                    >
                      <option value="">Select specialization</option>
                      {SPECIALIZATIONS.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                    {errors.specialization && (
                      <p className="mt-1 text-sm text-red-500">{errors.specialization.message}</p>
                    )}
                  </div>

                  <div>
                    <label className={labelClass}>Experience (Years) *</label>
                    <input
                      {...register('experienceYears', {
                        required: 'Experience is required',
                        valueAsNumber: true,
                        min: { value: 0, message: 'Must be 0 or more' },
                      })}
                      type="number"
                      className={inputClass}
                    />
                    {errors.experienceYears && (
                      <p className="mt-1 text-sm text-red-500">{errors.experienceYears.message}</p>
                    )}
                  </div>

                  <div>
                    <label className={labelClass}>City *</label>
                    <input
                      {...register('city', { required: 'City is required' })}
                      type="text"
                      className={inputClass}
                    />
                    {errors.city && (
                      <p className="mt-1 text-sm text-red-500">{errors.city.message}</p>
                    )}
                  </div>

                  <div>
                    <label className={labelClass}>Consultation Fee ($) *</label>
                    <input
                      {...register('consultationFee', {
                        required: 'Fee is required',
                        valueAsNumber: true,
                        min: { value: 0, message: 'Must be 0 or more' },
                      })}
                      type="number"
                      className={inputClass}
                    />
                    {errors.consultationFee && (
                      <p className="mt-1 text-sm text-red-500">{errors.consultationFee.message}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label className={labelClass}>Education</label>
                  <textarea
                    {...register('education')}
                    rows={2}
                    className={inputClass}
                    placeholder="e.g., LLB from Harvard Law School"
                  />
                </div>

                <div>
                  <label className={labelClass}>Description / About</label>
                  <textarea
                    {...register('description')}
                    rows={3}
                    className={inputClass}
                    placeholder="Tell clients about your practice and expertise..."
                  />
                </div>

                <div>
                  <p className={`${labelClass} mb-3`}>
                    Availability
                    <span className="ml-1 text-xs text-[var(--text-muted)] font-normal">
                      (select slots on the days you are available)
                    </span>
                  </p>
                  <div className="lawyer-timetable space-y-3">
                    {DAYS.map((day) => {
                      const daySchedule = availability.find((a) => a.day === day);
                      return (
                        <div key={day} className="border border-white/10 rounded-lg p-4 bg-white/5">
                          <h4 className="font-medium mb-2 text-sm">{day}</h4>
                          <div className="grid grid-cols-2 min-[420px]:grid-cols-3 sm:grid-cols-5 gap-2">
                            {TIME_SLOTS.map((slot) => {
                              const isSelected = daySchedule?.slots.includes(slot);
                              return (
                                <button
                                  key={slot}
                                  type="button"
                                  onClick={() => toggleSlot(day, slot)}
                                  className={`px-2 py-1.5 rounded text-xs border transition-colors ${
                                    isSelected
                                      ? 'bg-gradient-to-r from-[#f3e2c1] to-[#d5b47f] text-[#1b1205] border-transparent'
                                      : 'bg-white/5 text-[var(--text-secondary)] border-white/10 hover:border-[#d5b47f]/40'
                                  }`}
                                >
                                  {slot}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 sm:flex-none sm:px-8 py-2.5 rounded-lg text-sm font-semibold bg-gradient-to-r from-[#f3e2c1] to-[#d5b47f] text-[#1b1205] hover:shadow-lg hover:shadow-[#d5b47f]/40 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? 'Submitting…' : 'Submit Application'}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setFormOpen(false); reset(); }}
                    className="px-4 py-2.5 rounded-lg text-sm border border-white/10 text-[var(--text-secondary)] hover:border-white/20"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}

            {/* LAWYER PENDING */}
            {isLawyer && lawyerProfile?.status === 'pending' && (
              <div className="flex items-start gap-4 pt-2 border-t border-white/10">
                <div className="bg-[#f9f0e2] border border-[#d5b47f]/40 p-3 rounded-full shrink-0">
                  <Clock className="h-6 w-6 text-[#b07a43]" />
                </div>
                <div>
                  <p className="font-semibold">Application Pending Review</p>
                  <p className="text-sm text-[var(--text-muted)] mt-0.5">
                    Your application is awaiting admin approval. You will be notified once reviewed.
                  </p>
                  {lawyerProfile && (
                    <div className="mt-3 grid gap-1.5 sm:grid-cols-2 text-sm">
                      <span><span className="text-[var(--text-muted)]">Specialization: </span>{lawyerProfile.specialization}</span>
                      <span><span className="text-[var(--text-muted)]">Experience: </span>{lawyerProfile.experienceYears} yrs</span>
                      <span><span className="text-[var(--text-muted)]">City: </span>{lawyerProfile.city}</span>
                      <span><span className="text-[var(--text-muted)]">Fee: </span>PKR {lawyerProfile.consultationFee.toLocaleString()}</span>
                    </div>
                  )}
                  <span className="inline-flex items-center gap-1.5 mt-3 px-3 py-1 rounded-full text-xs font-semibold bg-[#f9f0e2] text-[#8a5f2c] border border-[#d5b47f]/30">
                    <Clock className="h-3 w-3" /> Pending Review
                  </span>
                </div>
              </div>
            )}

            {/* LAWYER APPROVED */}
            {isLawyer && lawyerProfile?.status === 'approved' && (
              <div className="flex items-start gap-4 pt-2 border-t border-white/10">
                <div className="bg-[#e2f4ed] border border-[#46d3a1]/40 p-3 rounded-full shrink-0">
                  <CheckCircle className="h-6 w-6 text-[#1f3d36]" />
                </div>
                <div>
                  <p className="font-semibold">Lawyer Profile Approved</p>
                  <p className="text-sm text-[var(--text-muted)] mt-0.5">
                    Your profile is live and visible to clients.
                  </p>
                  <span className="inline-flex items-center gap-1.5 mt-3 px-3 py-1 rounded-full text-xs font-semibold bg-[#e2f4ed] text-[#1f3d36] border border-[#46d3a1]/30">
                    <CheckCircle className="h-3 w-3" /> Approved
                  </span>
                </div>
              </div>
            )}

            {/* LAWYER REJECTED */}
            {isLawyer && lawyerProfile?.status === 'rejected' && (
              <div className="flex items-start gap-4 pt-2 border-t border-white/10">
                <div className="bg-[#fde8ed] border border-[#ff8c8c]/40 p-3 rounded-full shrink-0">
                  <XCircle className="h-6 w-6 text-[#a23a4c]" />
                </div>
                <div>
                  <p className="font-semibold">Application Rejected</p>
                  <p className="text-sm text-[var(--text-muted)] mt-0.5">
                    Your application was not approved. Please contact support for more information.
                  </p>
                  <span className="inline-flex items-center gap-1.5 mt-3 px-3 py-1 rounded-full text-xs font-semibold bg-[#fde8ed] text-[#a23a4c] border border-[#ff8c8c]/30">
                    <XCircle className="h-3 w-3" /> Rejected
                  </span>
                </div>
              </div>
            )}

            {/* Reverting spinner */}
            {isReverting && (
              <div className="flex items-center gap-2 text-sm text-[var(--text-muted)] pt-2">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#d5b47f] border-t-transparent" />
                Switching back to client…
              </div>
            )}
          </section>
        )}

      </div>
    </div>
  );
}
