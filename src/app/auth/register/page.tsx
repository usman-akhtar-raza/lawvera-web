'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import toast from 'react-hot-toast';
import { Briefcase } from 'lucide-react';

interface RegisterForm {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  city?: string;
  phone?: string;
}

export default function RegisterPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const type = searchParams.get('type') || 'client';
  const { setAuth } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterForm>();

  const password = watch('password');

  const onSubmit = async (data: RegisterForm) => {
    if (data.password !== data.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setIsLoading(true);
    try {
      if (type === 'lawyer') {
        // For lawyer registration, redirect to lawyer-specific form
        router.push('/auth/register/lawyer');
        return;
      }

      const { confirmPassword, ...registerData } = data;
      const response = await api.registerClient(registerData);
      setAuth(response.user, response.tokens);
      toast.success('Registration successful!');
      router.push('/dashboard/client');
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || 'Registration failed. Please try again.',
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050c26] flex flex-col justify-center py-12 sm:px-6 lg:px-8 text-[var(--text-primary)]">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        
        <h2 className="mt-6 text-3xl font-extrabold">Create your account</h2>
        <p className="mt-2 text-sm text-[var(--text-secondary)]">
          Or{' '}
          <Link
            href="/auth/login"
            className="font-medium text-[#d5b47f] hover:text-[#f3e2c1]"
          >
            sign in to your existing account
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="brand-card p-8">
          <div className="mb-6 flex gap-2">
            <Link
              href="/auth/register"
              className={`flex-1 text-center py-2 rounded-lg border ${type !== 'lawyer'
                  ? 'bg-gradient-to-r from-[#f3e2c1] to-[#d5b47f] text-[#050c26] border-transparent'
                  : 'bg-white/5 text-[var(--text-secondary)] border-white/10'
                }`}
            >
              Client
            </Link>
            <Link
              href="/auth/register?type=lawyer"
              className={`flex-1 text-center py-2 rounded-lg border ${type === 'lawyer'
                  ? 'bg-gradient-to-r from-[#f3e2c1] to-[#d5b47f] text-[#1b1205] border-transparent'
                  : 'bg-white/5 text-[var(--text-secondary)] border-white/10'
                }`}
            >
              Lawyer
            </Link>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-[var(--text-secondary)]"
              >
                Full Name
              </label>
              <div className="mt-1">
                <input
                  {...register('name', { required: 'Name is required' })}
                  type="text"
                  className="appearance-none block w-full px-3 py-2 rounded-lg bg-[#0d1735] border border-white/10 placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[#d5b47f] sm:text-sm"
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.name.message}
                  </p>
                )}
              </div>
            </div>

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
                  className="appearance-none block w-full px-3 py-2 rounded-lg bg-[#0d1735] border border-white/10 placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[#d5b47f] sm:text-sm"
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
                  autoComplete="new-password"
                  className="appearance-none block w-full px-3 py-2 rounded-lg bg-[#0d1735] border border-white/10 placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[#d5b47f] sm:text-sm"
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
                Confirm Password
              </label>
              <div className="mt-1">
                <input
                  {...register('confirmPassword', {
                    required: 'Please confirm your password',
                    validate: (value) =>
                      value === password || 'Passwords do not match',
                  })}
                  type="password"
                  autoComplete="new-password"
                  className="appearance-none block w-full px-3 py-2 rounded-lg bg-[#0d1735] border border-white/10 placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[#d5b47f] sm:text-sm"
                />
                {errors.confirmPassword && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.confirmPassword.message}
                  </p>
                )}
              </div>
            </div>

            <div>
              <label
                htmlFor="city"
                className="block text-sm font-medium text-[var(--text-secondary)]"
              >
                City (Optional)
              </label>
              <div className="mt-1">
                <input
                  {...register('city')}
                  type="text"
                  className="appearance-none block w-full px-3 py-2 rounded-lg bg-[#0d1735] border border-white/10 placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[#d5b47f] sm:text-sm"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="phone"
                className="block text-sm font-medium text-[var(--text-secondary)]"
              >
                Phone (Optional)
              </label>
              <div className="mt-1">
                <input
                  {...register('phone')}
                  type="tel"
                  className="appearance-none block w-full px-3 py-2 rounded-lg bg-[#0d1735] border border-white/10 placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[#d5b47f] sm:text-sm"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-2 px-4 rounded-lg text-sm font-semibold bg-gradient-to-r from-[#f3e2c1] to-[#d5b47f] text-[#1b1205] hover:shadow-lg hover:shadow-[#d5b47f]/40 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Creating account...' : 'Create account'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

