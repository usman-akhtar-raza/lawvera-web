'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import toast from 'react-hot-toast';
import { Briefcase } from 'lucide-react';

interface LawyerRegisterForm {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  specialization: string;
  experienceYears: number;
  city: string;
  consultationFee: number;
  education?: string;
  description?: string;
  profilePhotoUrl?: string;
}

const DAYS = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];

const TIME_SLOTS = [
  '9:00 AM',
  '10:00 AM',
  '11:00 AM',
  '12:00 PM',
  '1:00 PM',
  '2:00 PM',
  '3:00 PM',
  '4:00 PM',
  '5:00 PM',
];

export default function LawyerRegisterPage() {
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [specializations, setSpecializations] = useState<
    Array<{ _id: string; name: string }>
  >([]);
  const [availability, setAvailability] = useState<
    Array<{ day: string; slots: string[] }>
  >(
    DAYS.map((day) => ({
      day,
      slots: [],
    })),
  );

  useEffect(() => {
    // api
    //   .getSpecializations()
    //   .then(setSpecializations)
    //   .catch(() => {
        // If specializations don't exist, use defaults
        setSpecializations([
          { _id: '1', name: 'Criminal Law' },
          { _id: '2', name: 'Family Law' },
          { _id: '3', name: 'Property Law' },
          { _id: '4', name: 'Corporate Law' },
          { _id: '5', name: 'Immigration Law' },
          { _id: '6', name: 'Tax Law' },
        ]);
      // });
  }, []);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<LawyerRegisterForm>();

  const password = watch('password');
  const inputClass =
    'mt-1 block w-full px-3 py-2 rounded-lg bg-[var(--surface-elevated)] border border-white/10 placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[#d5b47f]';
  const labelClass = 'block text-sm font-medium text-[var(--text-secondary)]';

  const toggleSlot = (day: string, slot: string) => {
    setAvailability((prev) =>
      prev.map((item) => {
        if (item.day === day) {
          const slots = item.slots.includes(slot)
            ? item.slots.filter((s) => s !== slot)
            : [...item.slots, slot];
          return { ...item, slots };
        }
        return item;
      }),
    );
  };

  const onSubmit = async (data: LawyerRegisterForm) => {
    if (data.password !== data.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setIsLoading(true);
    try {
      const { confirmPassword, ...registerData } = data;
      const response = await api.registerLawyer({
        ...registerData,
        availability,
      });
      setAuth(response.user, response.tokens, response.lawyerProfile);
      toast.success(
        'Registration successful! Your profile is pending approval.',
      );
      router.push('/dashboard/lawyer');
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || 'Registration failed. Please try again.',
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--background-muted)] py-12 px-4 sm:px-6 lg:px-8 text-[var(--text-primary)]">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          
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

        <div className="brand-card p-8">
          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className={labelClass}>
                  Full Name *
                </label>
                <input
                  {...register('name', { required: 'Name is required' })}
                  type="text"
                  className={inputClass}
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.name.message}
                  </p>
                )}
              </div>

              <div>
                <label className={labelClass}>
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
                  type="email"
                  className={inputClass}
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.email.message}
                  </p>
                )}
              </div>

              <div>
                <label className={labelClass}>
                  Password *
                </label>
                <input
                  {...register('password', {
                    required: 'Password is required',
                    minLength: {
                      value: 6,
                      message: 'Min 6 characters',
                    },
                  })}
                  type="password"
                  className={inputClass}
                />
                {errors.password && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.password.message}
                  </p>
                )}
              </div>

              <div>
                <label className={labelClass}>
                  Confirm Password *
                </label>
                <input
                  {...register('confirmPassword', {
                    required: 'Please confirm password',
                    validate: (value) =>
                      value === password || 'Passwords do not match',
                  })}
                  type="password"
                  className={inputClass}
                />
                {errors.confirmPassword && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.confirmPassword.message}
                  </p>
                )}
              </div>

              <div>
                <label className={labelClass}>
                  Specialization *
                </label>
                <select
                  {...register('specialization', {
                    required: 'Specialization is required',
                  })}
                  className={inputClass}
                >
                  <option value="">Select specialization</option>
                  {specializations.map((spec) => (
                    <option key={spec._id} value={spec.name} >
                      {spec.name}
                    </option>
                  ))}
                </select>
                {errors.specialization && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.specialization.message}
                  </p>
                )}
              </div>

              <div>
                <label className={labelClass}>
                  Experience (Years) *
                </label>
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
                  <p className="mt-1 text-sm text-red-600">
                    {errors.experienceYears.message}
                  </p>
                )}
              </div>

              <div>
                <label className={labelClass}>
                  City *
                </label>
                <input
                  {...register('city', { required: 'City is required' })}
                  type="text"
                  className={inputClass}
                />
                {errors.city && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.city.message}
                  </p>
                )}
              </div>

              <div>
                <label className={labelClass}>
                  Consultation Fee ($) *
                </label>
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
                  <p className="mt-1 text-sm text-red-600">
                    {errors.consultationFee.message}
                  </p>
                )}
              </div>
            </div>

            <div>
              <label className={labelClass}>
                Education
              </label>
              <textarea
                {...register('education')}
                rows={2}
                className={inputClass}
                placeholder="e.g., LLB from Harvard Law School"
              />
            </div>

            <div>
              <label className={labelClass}>
                Description / About
              </label>
              <textarea
                {...register('description')}
                rows={4}
                className={inputClass}
                placeholder="Tell clients about your practice and expertise..."
              />
            </div>

            <div>
              <label className={`${labelClass} mb-4`}>
                Availability *
              </label>
              <div className="space-y-4">
                {DAYS.map((day) => {
                  const daySchedule = availability.find((a) => a.day === day);
                  return (
                    <div key={day} className="border border-white/10 rounded-lg p-4 bg-white/5">
                      <h4 className="font-medium mb-2 text-[var(--text-primary)]">{day}</h4>
                      <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                        {TIME_SLOTS.map((slot) => {
                          const isSelected = daySchedule?.slots.includes(slot);
                          return (
                            <button
                              key={slot}
                              type="button"
                              onClick={() => toggleSlot(day, slot)}
                              className={`px-3 py-2 rounded text-sm border transition-colors ${
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

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-3 px-4 rounded-lg text-sm font-semibold bg-gradient-to-r from-[#f3e2c1] to-[#d5b47f] text-[#1b1205] hover:shadow-lg hover:shadow-[#d5b47f]/40 disabled:opacity-50"
              >
                {isLoading ? 'Registering...' : 'Register as Lawyer'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

