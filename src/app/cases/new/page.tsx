'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { ArrowLeft } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import { CaseCategory } from '@/types';
import toast from 'react-hot-toast';
import { getErrorMessage } from '@/lib/error-message';

interface CreateCaseForm {
  title: string;
  description: string;
  category: CaseCategory;
}

const CATEGORIES: { value: CaseCategory; label: string }[] = [
  { value: CaseCategory.CRIMINAL, label: 'Criminal Law' },
  { value: CaseCategory.FAMILY, label: 'Family Law' },
  { value: CaseCategory.PROPERTY, label: 'Property Law' },
  { value: CaseCategory.CORPORATE, label: 'Corporate Law' },
  { value: CaseCategory.IMMIGRATION, label: 'Immigration Law' },
  { value: CaseCategory.TAX, label: 'Tax Law' },
  { value: CaseCategory.CIVIL, label: 'Civil Law' },
  { value: CaseCategory.LABOUR, label: 'Labour Law' },
  { value: CaseCategory.CONSUMER, label: 'Consumer Law' },
  { value: CaseCategory.OTHER, label: 'Other' },
];

export default function CreateCasePage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuthStore();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateCaseForm>();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/auth/login?redirect=/cases/new');
    }
  }, [isAuthenticated, authLoading, router]);

  const inputClass =
    'mt-1 block w-full px-3 py-2 rounded-lg bg-[var(--surface-elevated)] border border-white/10 placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[#d5b47f] sm:text-sm';
  const labelClass = 'block text-sm font-medium text-[var(--text-secondary)]';

  const onSubmit = async (data: CreateCaseForm) => {
    setIsSubmitting(true);
    try {
      const created = await api.createCase(data);
      toast.success('Case created and live for lawyer requests!');
      router.push(`/cases/${created._id}`);
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, 'Failed to create case'));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[var(--background-muted)] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#d5b47f]"></div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-[var(--background-muted)] py-8 text-[var(--text-primary)]">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link
          href="/cases"
          className="inline-flex items-center gap-2 text-sm text-[var(--text-secondary)] hover:text-[#d5b47f] mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Cases
        </Link>

        <h1 className="text-3xl font-bold mb-2">Create New Case</h1>
        <p className="text-[var(--text-secondary)] mb-8">
          Describe your legal issue. Once submitted, approved lawyers can request
          the case and you can select who to work with.
        </p>

        <div className="brand-card p-5 sm:p-8">
          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            <div>
              <label className={labelClass}>Case Title *</label>
              <input
                {...register('title', {
                  required: 'Title is required',
                  maxLength: { value: 200, message: 'Max 200 characters' },
                })}
                type="text"
                placeholder="Brief title for your case"
                className={inputClass}
              />
              {errors.title && (
                <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
              )}
            </div>

            <div>
              <label className={labelClass}>Category *</label>
              <select
                {...register('category', { required: 'Category is required' })}
                className={inputClass}
              >
                <option value="">Select a category</option>
                {CATEGORIES.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
              {errors.category && (
                <p className="mt-1 text-sm text-red-600">{errors.category.message}</p>
              )}
            </div>

            <div>
              <label className={labelClass}>Description *</label>
              <textarea
                {...register('description', {
                  required: 'Description is required',
                  maxLength: { value: 5000, message: 'Max 5000 characters' },
                })}
                rows={6}
                placeholder="Describe your legal issue in detail. Include relevant dates, parties involved, and what outcome you are seeking."
                className={inputClass}
              />
              {errors.description && (
                <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex justify-center py-3 px-4 rounded-lg text-sm font-semibold bg-gradient-to-r from-[#f3e2c1] to-[#d5b47f] text-[#1b1205] hover:shadow-lg hover:shadow-[#d5b47f]/40 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Creating...' : 'Create Case'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
