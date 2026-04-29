'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import toast from 'react-hot-toast';
import { getErrorMessage } from '@/lib/error-message';
import { PasswordField } from '@/components/auth/PasswordField';
import { AuthRoleTabs } from '@/components/auth/AuthRoleTabs';
import { getPostLoginRedirect } from '@/lib/dashboard-route';
import {
  authErrorClass,
  authInputClass,
  authLabelClass,
  authSubmitButtonClass,
} from '@/lib/auth-form';
import {
  createEmptyAvailability,
  getFilledAvailability,
  LAWYER_AVAILABILITY_DAYS,
  LAWYER_TIME_SLOTS,
  type AvailabilitySelection,
} from '@/lib/lawyer-availability';

interface LawyerRegisterForm {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  specialization: string;
  experienceYears: number;
  city: string;
  consultationFee: number;
  paypalEmail?: string;
  education?: string;
  description?: string;
  availabilitySelection?: string;
}

const DEFAULT_SPECIALIZATIONS = [
  { _id: 'default-criminal', name: 'Criminal Law' },
  { _id: 'default-family', name: 'Family Law' },
  { _id: 'default-property', name: 'Property Law' },
  { _id: 'default-corporate', name: 'Corporate Law' },
  { _id: 'default-immigration', name: 'Immigration Law' },
  { _id: 'default-tax', name: 'Tax Law' },
];

export default function LawyerRegisterPage() {
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const [isSpecializationsLoading, setIsSpecializationsLoading] =
    useState(true);
  const [specializations, setSpecializations] = useState<
    Array<{ _id: string; name: string }>
  >([]);
  const [availability, setAvailability] =
    useState<AvailabilitySelection[]>(createEmptyAvailability());

  useEffect(() => {
    let isMounted = true;

    void api
      .getSpecializations()
      .then((results) => {
        if (!isMounted) {
          return;
        }

        setSpecializations(
          results.length > 0 ? results : DEFAULT_SPECIALIZATIONS,
        );
      })
      .catch(() => {
        if (isMounted) {
          setSpecializations(DEFAULT_SPECIALIZATIONS);
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsSpecializationsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const {
    register,
    handleSubmit,
    getValues,
    setError,
    clearErrors,
    formState: { errors, isSubmitting },
  } = useForm<LawyerRegisterForm>();

  const toggleSlot = (day: string, slot: string) => {
    setAvailability((prev) => {
      const nextAvailability = prev.map((item) => {
        if (item.day !== day) {
          return item;
        }

        const slots = item.slots.includes(slot)
          ? item.slots.filter((currentSlot) => currentSlot !== slot)
          : [...item.slots, slot];

        return { ...item, slots };
      });

      if (getFilledAvailability(nextAvailability).length > 0) {
        clearErrors('availabilitySelection');
      }

      return nextAvailability;
    });
  };

  const onSubmit = async (data: LawyerRegisterForm) => {
    const selectedAvailability = getFilledAvailability(availability);
    if (selectedAvailability.length === 0) {
      setError('availabilitySelection', {
        type: 'manual',
        message: 'Select at least one availability slot in the week',
      });
      return;
    }

    clearErrors('availabilitySelection');

    try {
      const {
        confirmPassword: _confirmPassword,
        availabilitySelection: _availabilitySelection,
        ...formValues
      } = data;
      const response = await api.registerLawyer({
        name: formValues.name.trim(),
        email: formValues.email.trim(),
        password: formValues.password,
        specialization: formValues.specialization,
        experienceYears: Number(formValues.experienceYears),
        city: formValues.city.trim(),
        consultationFee: Number(formValues.consultationFee),
        paypalEmail: formValues.paypalEmail?.trim() || undefined,
        education: formValues.education?.trim() || undefined,
        description: formValues.description?.trim() || undefined,
        availability: selectedAvailability,
      });

      if ('requiresVerification' in response && response.requiresVerification) {
        toast.success('Registration successful! Please verify your email.');
        router.push(
          `/auth/verify-otp?email=${encodeURIComponent(response.email)}`,
        );
        return;
      }

      if ('tokens' in response) {
        setAuth(response.user, response.tokens, response.lawyerProfile);
        toast.success(
          'Registration successful! Your profile is pending approval.',
        );
        const requestedRedirect =
          typeof window !== 'undefined'
            ? new URLSearchParams(window.location.search).get('redirect')
            : null;
        router.push(
          getPostLoginRedirect(response.user.role, requestedRedirect),
        );
      }
    } catch (error: unknown) {
      toast.error(
        getErrorMessage(error, 'Registration failed. Please try again.'),
      );
    }
  };

  return (
    <div className="min-h-screen bg-[var(--background-muted)] px-4 py-10 text-[var(--text-primary)] sm:px-6 sm:py-12 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8 text-center">
          <h2 className="text-3xl font-extrabold">Register as a Lawyer</h2>
          <p className="mt-2 text-sm text-[var(--text-secondary)]">
            Already have an account?{' '}
            <Link
              href="/auth/login"
              className="font-medium text-[#d5b47f] hover:text-[#f3e2c1]"
            >
              Sign in
            </Link>
          </p>
        </div>

        <div className="brand-card p-5 sm:p-8">
          <AuthRoleTabs activeRole="lawyer" />

          <form
            className="space-y-6"
            onSubmit={handleSubmit(onSubmit)}
            noValidate
          >
            <p className="text-sm text-[var(--text-muted)]">
              Fields marked with * are required.
            </p>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div>
                <label htmlFor="name" className={authLabelClass}>
                  Full Name *
                </label>
                <input
                  {...register('name', { required: 'Name is required' })}
                  id="name"
                  type="text"
                  autoComplete="name"
                  aria-invalid={Boolean(errors.name)}
                  aria-describedby={errors.name ? 'lawyer-name-error' : undefined}
                  className={`mt-1 ${authInputClass}`}
                />
                {errors.name && (
                  <p id="lawyer-name-error" className={authErrorClass}>
                    {errors.name.message}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="email" className={authLabelClass}>
                  Email *
                </label>
                <input
                  {...register('email', {
                    required: 'Email is required',
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: 'Invalid email',
                    },
                  })}
                  id="email"
                  type="email"
                  autoComplete="email"
                  aria-invalid={Boolean(errors.email)}
                  aria-describedby={
                    errors.email ? 'lawyer-email-error' : undefined
                  }
                  className={`mt-1 ${authInputClass}`}
                />
                {errors.email && (
                  <p id="lawyer-email-error" className={authErrorClass}>
                    {errors.email.message}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="paypalEmail" className={authLabelClass}>
                  PayPal Payout Email
                </label>
                <input
                  {...register('paypalEmail', {
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: 'Invalid PayPal email',
                    },
                  })}
                  id="paypalEmail"
                  type="email"
                  autoComplete="email"
                  aria-invalid={Boolean(errors.paypalEmail)}
                  aria-describedby={
                    errors.paypalEmail ? 'lawyer-paypal-email-error' : undefined
                  }
                  className={`mt-1 ${authInputClass}`}
                />
                {errors.paypalEmail && (
                  <p id="lawyer-paypal-email-error" className={authErrorClass}>
                    {errors.paypalEmail.message}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="password" className={authLabelClass}>
                  Password *
                </label>
                <PasswordField
                  {...register('password', {
                    required: 'Password is required',
                    minLength: {
                      value: 6,
                      message: 'Min 6 characters',
                    },
                  })}
                  id="password"
                  autoComplete="new-password"
                  aria-invalid={Boolean(errors.password)}
                  aria-describedby={
                    errors.password ? 'lawyer-password-error' : undefined
                  }
                  inputClassName={`mt-1 ${authInputClass}`}
                />
                {errors.password && (
                  <p id="lawyer-password-error" className={authErrorClass}>
                    {errors.password.message}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="confirmPassword" className={authLabelClass}>
                  Confirm Password *
                </label>
                <PasswordField
                  {...register('confirmPassword', {
                    required: 'Please confirm password',
                    validate: (value) =>
                      value === getValues('password') ||
                      'Passwords do not match',
                  })}
                  id="confirmPassword"
                  autoComplete="new-password"
                  aria-invalid={Boolean(errors.confirmPassword)}
                  aria-describedby={
                    errors.confirmPassword
                      ? 'lawyer-confirm-password-error'
                      : undefined
                  }
                  inputClassName={`mt-1 ${authInputClass}`}
                />
                {errors.confirmPassword && (
                  <p
                    id="lawyer-confirm-password-error"
                    className={authErrorClass}
                  >
                    {errors.confirmPassword.message}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="specialization" className={authLabelClass}>
                  Specialization *
                </label>
                <select
                  {...register('specialization', {
                    required: 'Specialization is required',
                  })}
                  id="specialization"
                  disabled={
                    isSpecializationsLoading && specializations.length === 0
                  }
                  aria-invalid={Boolean(errors.specialization)}
                  aria-describedby={
                    errors.specialization
                      ? 'lawyer-specialization-error'
                      : undefined
                  }
                  className={`mt-1 ${authInputClass}`}
                >
                  <option value="">
                    {isSpecializationsLoading
                      ? 'Loading specializations...'
                      : 'Select specialization'}
                  </option>
                  {specializations.map((spec) => (
                    <option key={spec._id} value={spec.name}>
                      {spec.name}
                    </option>
                  ))}
                </select>
                {errors.specialization && (
                  <p
                    id="lawyer-specialization-error"
                    className={authErrorClass}
                  >
                    {errors.specialization.message}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="experienceYears" className={authLabelClass}>
                  Experience (Years) *
                </label>
                <input
                  {...register('experienceYears', {
                    required: 'Experience is required',
                    valueAsNumber: true,
                    min: { value: 0, message: 'Must be 0 or more' },
                    max: { value: 80, message: 'Use a realistic value' },
                    validate: (value) =>
                      Number.isInteger(value) || 'Enter whole years only',
                  })}
                  id="experienceYears"
                  type="number"
                  step="1"
                  inputMode="numeric"
                  aria-invalid={Boolean(errors.experienceYears)}
                  aria-describedby={
                    errors.experienceYears
                      ? 'lawyer-experience-error'
                      : undefined
                  }
                  className={`mt-1 ${authInputClass}`}
                />
                {errors.experienceYears && (
                  <p id="lawyer-experience-error" className={authErrorClass}>
                    {errors.experienceYears.message}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="city" className={authLabelClass}>
                  City *
                </label>
                <input
                  {...register('city', { required: 'City is required' })}
                  id="city"
                  type="text"
                  autoComplete="address-level2"
                  aria-invalid={Boolean(errors.city)}
                  aria-describedby={errors.city ? 'lawyer-city-error' : undefined}
                  className={`mt-1 ${authInputClass}`}
                />
                {errors.city && (
                  <p id="lawyer-city-error" className={authErrorClass}>
                    {errors.city.message}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="consultationFee" className={authLabelClass}>
                  Consultation Fee (PKR) *
                </label>
                <input
                  {...register('consultationFee', {
                    required: 'Fee is required',
                    valueAsNumber: true,
                    min: { value: 0, message: 'Must be 0 or more' },
                    max: {
                      value: 1_000_000,
                      message: 'Fee is above the allowed limit',
                    },
                  })}
                  id="consultationFee"
                  type="number"
                  step="0.01"
                  inputMode="decimal"
                  aria-invalid={Boolean(errors.consultationFee)}
                  aria-describedby={
                    errors.consultationFee
                      ? 'lawyer-consultation-fee-error'
                      : undefined
                  }
                  className={`mt-1 ${authInputClass}`}
                />
                {errors.consultationFee && (
                  <p
                    id="lawyer-consultation-fee-error"
                    className={authErrorClass}
                  >
                    {errors.consultationFee.message}
                  </p>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="education" className={authLabelClass}>
                Education
              </label>
              <textarea
                {...register('education')}
                id="education"
                rows={2}
                className={`mt-1 ${authInputClass}`}
                placeholder="e.g., LLB from Harvard Law School"
              />
            </div>

            <div>
              <label htmlFor="description" className={authLabelClass}>
                Description / About
              </label>
              <textarea
                {...register('description')}
                id="description"
                rows={4}
                className={`mt-1 ${authInputClass}`}
                placeholder="Tell clients about your practice and expertise..."
              />
            </div>

            <div>
              <label
                htmlFor="availability-selection"
                className={`${authLabelClass} mb-4`}
              >
                Availability *
              </label>
              <p className="mb-4 text-sm text-[var(--text-muted)]">
                Select at least one slot in the week. You do not need to pick a
                slot for every day.
              </p>
              <input id="availability-selection" type="hidden" />
              <div className="lawyer-timetable space-y-4">
                {LAWYER_AVAILABILITY_DAYS.map((day) => {
                  const daySchedule = availability.find((item) => item.day === day);

                  return (
                    <div
                      key={day}
                      className="rounded-lg border border-white/10 bg-white/5 p-4"
                    >
                      <h4 className="mb-2 font-medium text-[var(--text-primary)]">
                        {day}
                      </h4>
                      <div className="grid grid-cols-2 gap-2 min-[420px]:grid-cols-3 sm:grid-cols-5">
                        {LAWYER_TIME_SLOTS.map((slot) => {
                          const isSelected = daySchedule?.slots.includes(slot);

                          return (
                            <button
                              key={slot}
                              type="button"
                              onClick={() => toggleSlot(day, slot)}
                              aria-pressed={Boolean(isSelected)}
                              aria-label={`${day} ${slot}`}
                              className={`rounded border px-3 py-2 text-sm transition-colors ${
                                isSelected
                                  ? 'bg-gradient-to-r from-[#f3e2c1] to-[#d5b47f] text-[#1b1205] border-transparent'
                                  : 'bg-[var(--surface-elevated)] text-[var(--text-secondary)] border-white/10 hover:border-[#d5b47f]/40'
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
              {errors.availabilitySelection && (
                <p id="availability-selection-error" className={authErrorClass}>
                  {errors.availabilitySelection.message}
                </p>
              )}
            </div>

            <div>
              <button
                type="submit"
                disabled={isSubmitting}
                aria-busy={isSubmitting}
                className={`${authSubmitButtonClass} py-3`}
              >
                {isSubmitting ? 'Registering...' : 'Register as Lawyer'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
