'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import toast from 'react-hot-toast';
import { Briefcase } from 'lucide-react';

interface LoginForm {
  email: string;
  password: string;
}

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
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
      setAuth(response.user, response.tokens, response.lawyerProfile);
      toast.success('Login successful!');
      const redirect = searchParams.get('redirect') || '/dashboard/client';
      router.push(redirect);
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || 'Invalid email or password',
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--background-muted)] flex flex-col justify-center py-12 sm:px-6 lg:px-8 text-[var(--text-primary)]">
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
              <label
                htmlFor="password"
                className="block text-sm font-medium text-[var(--text-secondary)]"
              >
                Password
              </label>
              <div className="mt-1">
                <input
                  {...register('password', {
                    required: 'Password is required',
                    minLength: {
                      value: 6,
                      message: 'Password must be at least 6 characters',
                    },
                  })}
                  type="password"
                  autoComplete="current-password"
                  className="appearance-none block w-full px-3 py-2 rounded-lg bg-[var(--surface-elevated)] border border-white/10 placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[#d5b47f] sm:text-sm"
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

