'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { KeyRound } from 'lucide-react';
import { PasswordField } from '@/components/auth/PasswordField';
import { api } from '@/lib/api';
import { getErrorMessage } from '@/lib/error-message';

interface ForgotPasswordForm {
  email: string;
  otp: string;
  password: string;
  confirmPassword: string;
}

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [isCodeSent, setIsCodeSent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ForgotPasswordForm>();

  const email = watch('email');
  const password = watch('password');
  const inputClass =
    'appearance-none block w-full px-3 py-2 rounded-lg bg-[var(--surface-elevated)] border border-white/10 text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[#d5b47f] sm:text-sm';

  const requestResetCode = async () => {
    if (!email) {
      toast.error('Enter your email first');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await api.requestPasswordReset(email);
      setIsCodeSent(true);
      toast.success(response.message);
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, 'Failed to send reset code'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const onSubmit = async (data: ForgotPasswordForm) => {
    if (!isCodeSent) {
      await requestResetCode();
      return;
    }

    if (data.password !== data.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await api.resetPassword({
        email: data.email,
        otp: data.otp,
        password: data.password,
      });
      toast.success(response.message);
      router.push('/auth/login');
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, 'Failed to reset password'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col justify-center bg-[var(--background-muted)] py-12 text-[var(--text-primary)] sm:px-6 lg:px-8">
      <div className="text-center sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <KeyRound className="h-12 w-12 text-[#d5b47f]" />
        </div>
        <h1 className="mt-6 text-3xl font-extrabold">Reset your password</h1>
        <p className="mt-2 text-sm text-[var(--text-secondary)]">
          Enter your account email and use the code we send to set a new password.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="brand-card p-8">
          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-[var(--text-secondary)]"
              >
                Email address
              </label>
              <div className="mt-1">
                <input
                  {...register('email', {
                    required: 'Email is required',
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: 'Invalid email address',
                    },
                  })}
                  type="email"
                  autoComplete="email"
                  className={inputClass}
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.email.message}
                  </p>
                )}
              </div>
            </div>

            {isCodeSent && (
              <>
                <div>
                  <label
                    htmlFor="otp"
                    className="block text-sm font-medium text-[var(--text-secondary)]"
                  >
                    Reset code
                  </label>
                  <div className="mt-1">
                    <input
                      {...register('otp', {
                        required: 'Reset code is required',
                        minLength: {
                          value: 6,
                          message: 'Code must be 6 digits',
                        },
                        maxLength: {
                          value: 6,
                          message: 'Code must be 6 digits',
                        },
                      })}
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      className={inputClass}
                    />
                    {errors.otp && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.otp.message}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="password"
                    className="block text-sm font-medium text-[var(--text-secondary)]"
                  >
                    New password
                  </label>
                  <div className="mt-1">
                    <PasswordField
                      {...register('password', {
                        required: 'Password is required',
                        minLength: {
                          value: 6,
                          message: 'Password must be at least 6 characters',
                        },
                      })}
                      autoComplete="new-password"
                      inputClassName={inputClass}
                    />
                    {errors.password && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.password.message}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="confirmPassword"
                    className="block text-sm font-medium text-[var(--text-secondary)]"
                  >
                    Confirm new password
                  </label>
                  <div className="mt-1">
                    <PasswordField
                      {...register('confirmPassword', {
                        required: 'Please confirm your password',
                        validate: (value) =>
                          value === password || 'Passwords do not match',
                      })}
                      autoComplete="new-password"
                      inputClassName={inputClass}
                    />
                    {errors.confirmPassword && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.confirmPassword.message}
                      </p>
                    )}
                  </div>
                </div>
              </>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="flex w-full justify-center rounded-lg bg-gradient-to-r from-[#f3e2c1] to-[#d5b47f] px-4 py-2 text-sm font-semibold text-[#1b1205] hover:shadow-lg hover:shadow-[#d5b47f]/40 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting
                ? 'Please wait...'
                : isCodeSent
                  ? 'Reset password'
                  : 'Send reset code'}
            </button>
          </form>

          <div className="mt-6 flex items-center justify-between text-sm">
            <button
              type="button"
              onClick={requestResetCode}
              disabled={isSubmitting || !email}
              className="font-medium text-[#b07a43] hover:text-[#d5b47f] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isCodeSent ? 'Resend code' : 'Send code'}
            </button>
            <Link
              href="/auth/login"
              className="font-medium text-[var(--text-secondary)] hover:text-[#d5b47f]"
            >
              Back to sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
