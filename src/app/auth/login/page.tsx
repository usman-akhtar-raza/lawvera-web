'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import toast from 'react-hot-toast';
import { Briefcase } from 'lucide-react';
import { getErrorMessage } from '@/lib/error-message';
import { PasswordField } from '@/components/auth/PasswordField';
import { getPostLoginRedirect } from '@/lib/dashboard-route';

interface LoginForm {
  email: string;
  password: string;
}

export default function LoginPage() {
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>();

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true);
    try {
      const response = await api.login(data.email, data.password);

      if ('requiresVerification' in response && response.requiresVerification) {
        toast('Please verify your email first.', { icon: '📧' });
        router.push(`/auth/verify-otp?email=${encodeURIComponent(response.email)}`);
        return;
      }

      if ('tokens' in response) {
        setAuth(response.user, response.tokens, response.lawyerProfile);
        toast.success('Login successful!');
        const requestedRedirect =
          typeof window !== 'undefined'
            ? new URLSearchParams(window.location.search).get('redirect')
            : null;
        const redirect = getPostLoginRedirect(
          response.user.role,
          requestedRedirect,
        );
        router.push(redirect);
      }
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, 'Invalid email or password'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--background-muted)] flex flex-col justify-center px-4 py-10 sm:px-6 sm:py-12 lg:px-8 text-[var(--text-primary)]">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="flex justify-center">
          <Briefcase className="h-12 w-12 text-[#d5b47f]" />
        </div>
        <h2 className="mt-6 text-3xl font-extrabold">Sign in to Lawvera</h2>
        <p className="mt-2 text-sm text-[var(--text-secondary)]">
          Or{' '}
          <Link
            href="/auth/register"
            className="font-medium text-[#d5b47f] hover:text-[#f3e2c1]"
          >
            create a new account
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="brand-card p-5 sm:p-8">
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
                  className="appearance-none block w-full px-3 py-2 rounded-lg bg-[var(--surface-elevated)] border border-white/10 placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[#d5b47f] sm:text-sm"
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.email.message}
                  </p>
                )}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-[var(--text-secondary)]"
                >
                  Password
                </label>
                <Link
                  href="/auth/forgot-password"
                  className="text-sm font-medium text-[#b07a43] hover:text-[#d5b47f]"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="mt-1">
                <PasswordField
                  {...register('password', {
                    required: 'Password is required',
                    minLength: {
                      value: 6,
                      message: 'Password must be at least 6 characters',
                    },
                  })}
                  autoComplete="current-password"
                  inputClassName="appearance-none block w-full px-3 py-2 rounded-lg bg-[var(--surface-elevated)] border border-white/10 placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[#d5b47f] sm:text-sm"
                />
                {errors.password && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.password.message}
                  </p>
                )}
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-2 px-4 rounded-lg text-sm font-semibold bg-gradient-to-r from-[#f3e2c1] to-[#d5b47f] text-[#1b1205] hover:shadow-lg hover:shadow-[#d5b47f]/40 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Signing in...' : 'Sign in'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
