'use client';

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
  phonePattern,
} from '@/lib/auth-form';

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
  const { setAuth } = useAuthStore();
  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<RegisterForm>();

  const onSubmit = async (data: RegisterForm) => {
    try {
      const { confirmPassword: _confirmPassword, ...formValues } = data;
      const registerData = {
        name: formValues.name.trim(),
        email: formValues.email.trim(),
        password: data.password,
        city: formValues.city?.trim() || undefined,
        phone: formValues.phone?.trim() || undefined,
      };
      const response = await api.registerClient(registerData);

      if ('requiresVerification' in response && response.requiresVerification) {
        toast.success('Registration successful! Please verify your email.');
        router.push(`/auth/verify-otp?email=${encodeURIComponent(response.email)}`);
        return;
      }

      if ('tokens' in response) {
        setAuth(response.user, response.tokens, response.lawyerProfile);
        toast.success('Registration successful!');
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
    <div className="min-h-screen bg-[var(--background-muted)] flex flex-col justify-center px-4 py-10 sm:px-6 sm:py-12 lg:px-8 text-[var(--text-primary)]">
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
        <div className="brand-card p-5 sm:p-8">
          <AuthRoleTabs activeRole="client" />

          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)} noValidate>
            <div>
              <label
                htmlFor="name"
                className={authLabelClass}
              >
                Full Name
              </label>
              <div className="mt-1">
                <input
                  {...register('name', { required: 'Name is required' })}
                  id="name"
                  type="text"
                  autoComplete="name"
                  aria-invalid={Boolean(errors.name)}
                  aria-describedby={errors.name ? 'name-error' : undefined}
                  className={authInputClass}
                />
                {errors.name && (
                  <p id="name-error" className={authErrorClass}>
                    {errors.name.message}
                  </p>
                )}
              </div>
            </div>

            <div>
              <label
                htmlFor="email"
                className={authLabelClass}
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
                  id="email"
                  type="email"
                  autoComplete="email"
                  aria-invalid={Boolean(errors.email)}
                  aria-describedby={errors.email ? 'email-error' : undefined}
                  className={authInputClass}
                />
                {errors.email && (
                  <p id="email-error" className={authErrorClass}>
                    {errors.email.message}
                  </p>
                )}
              </div>
            </div>

            <div>
              <label
                htmlFor="password"
                className={authLabelClass}
              >
                Password
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
                  id="password"
                  autoComplete="new-password"
                  aria-invalid={Boolean(errors.password)}
                  aria-describedby={
                    errors.password ? 'password-error' : undefined
                  }
                  inputClassName={authInputClass}
                />
                {errors.password && (
                  <p id="password-error" className={authErrorClass}>
                    {errors.password.message}
                  </p>
                )}
              </div>
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                className={authLabelClass}
              >
                Confirm Password
              </label>
              <div className="mt-1">
                <PasswordField
                  {...register('confirmPassword', {
                    required: 'Please confirm your password',
                    validate: (value) =>
                      value === getValues('password') ||
                      'Passwords do not match',
                  })}
                  id="confirmPassword"
                  autoComplete="new-password"
                  aria-invalid={Boolean(errors.confirmPassword)}
                  aria-describedby={
                    errors.confirmPassword ? 'confirm-password-error' : undefined
                  }
                  inputClassName={authInputClass}
                />
                {errors.confirmPassword && (
                  <p id="confirm-password-error" className={authErrorClass}>
                    {errors.confirmPassword.message}
                  </p>
                )}
              </div>
            </div>

            <div>
              <label
                htmlFor="city"
                className={authLabelClass}
              >
                City (Optional)
              </label>
              <div className="mt-1">
                <input
                  {...register('city')}
                  id="city"
                  type="text"
                  autoComplete="address-level2"
                  className={authInputClass}
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="phone"
                className={authLabelClass}
              >
                Phone (Optional)
              </label>
              <div className="mt-1">
                <input
                  {...register('phone', {
                    pattern: {
                      value: phonePattern,
                      message: 'Enter a valid phone number',
                    },
                  })}
                  id="phone"
                  type="tel"
                  autoComplete="tel"
                  aria-invalid={Boolean(errors.phone)}
                  aria-describedby={errors.phone ? 'phone-error' : undefined}
                  className={authInputClass}
                />
                {errors.phone && (
                  <p id="phone-error" className={authErrorClass}>
                    {errors.phone.message}
                  </p>
                )}
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isSubmitting}
                aria-busy={isSubmitting}
                className={authSubmitButtonClass}
              >
                {isSubmitting ? 'Creating account...' : 'Create account'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
