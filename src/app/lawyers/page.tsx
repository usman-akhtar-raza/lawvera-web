'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Search, Filter, X } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { LawyerProfile, SearchLawyersParams } from '@/types';
import { LawyerCard } from '@/components/lawyer/LawyerCard';

export default function LawyersPage() {
  const searchParams = useSearchParams();
  const [filters, setFilters] = useState<SearchLawyersParams>({
    page: 1,
    limit: 12,
    specialization: searchParams.get('specialization') || undefined,
    city: searchParams.get('city') || undefined,
    search: searchParams.get('search') || undefined,
  });
  const [showFilters, setShowFilters] = useState(false);
  const [specializations, setSpecializations] = useState<
    Array<{ _id: string; name: string }>
  >([]);

  useEffect(() => {
    api.getSpecializations().then(setSpecializations).catch(console.error);
  }, []);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['lawyers', filters],
    queryFn: () => {
      const { search, ...apiFilters } = filters;
      return api.searchLawyers(apiFilters);
    },
  });

  const filteredData = data?.data.filter((lawyer) => {
    if (!filters.search) return true;
    const searchLower = filters.search.toLowerCase();
    const user = lawyer.user as any;
    return (
      user?.name?.toLowerCase().includes(searchLower) ||
      lawyer.specialization?.toLowerCase().includes(searchLower) ||
      lawyer.city?.toLowerCase().includes(searchLower)
    );
  });

  const handleFilterChange = (key: keyof SearchLawyersParams, value: any) => {
    setFilters((prev) => ({ ...prev, [key]: value, page: 1 }));
  };

  const clearFilters = () => {
    setFilters({ page: 1, limit: 12 });
  };

  const hasActiveFilters = Object.keys(filters).some(
    (key) =>
      key !== 'page' &&
      key !== 'limit' &&
      filters[key as keyof SearchLawyersParams],
  );

  return (
    <div className="min-h-screen bg-[#050c26] py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-[var(--text-primary)]">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-4">Find a Lawyer</h1>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-white/40" />
              <input
                type="text"
                placeholder="Search by specialization, city, or name..."
                value={filters.search || ''}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="w-full pl-12 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-[#d5b47f]"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="px-6 py-3 rounded-xl border border-white/10 bg-white/5 hover:border-[#d5b47f]/40 flex items-center justify-center transition-colors"
            >
              <Filter className="h-5 w-5 mr-2" />
              Filters
            </button>
          </div>
        </div>

        {showFilters && (
          <div className="brand-card p-6 mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Filters</h2>
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="text-sm text-[#d5b47f] hover:text-[#f3e2c1] flex items-center"
                >
                  <X className="h-4 w-4 mr-1" />
                  Clear All
                </button>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                  Specialization
                </label>
                <select
                  value={filters.specialization || ''}
                  onChange={(e) =>
                    handleFilterChange('specialization', e.target.value || undefined)
                  }
                  className="w-full px-3 py-2 rounded-lg bg-[#0d1735] border border-white/10 focus:outline-none focus:ring-2 focus:ring-[#d5b47f]"
                >
                  <option value="">All</option>
                  {specializations.map((spec) => (
                    <option key={spec._id} value={spec.name}>
                      {spec.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                  City
                </label>
                <input
                  type="text"
                  value={filters.city || ''}
                  onChange={(e) =>
                    handleFilterChange('city', e.target.value || undefined)
                  }
                  placeholder="Enter city"
                  className="w-full px-3 py-2 rounded-lg bg-[#0d1735] border border-white/10 focus:outline-none focus:ring-2 focus:ring-[#d5b47f]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                  Min Fee
                </label>
                <input
                  type="number"
                  value={filters.minFee || ''}
                  onChange={(e) =>
                    handleFilterChange(
                      'minFee',
                      e.target.value ? Number(e.target.value) : undefined,
                    )
                  }
                  placeholder="Min"
                  className="w-full px-3 py-2 rounded-lg bg-[#0d1735] border border-white/10 focus:outline-none focus:ring-2 focus:ring-[#d5b47f]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                  Max Fee
                </label>
                <input
                  type="number"
                  value={filters.maxFee || ''}
                  onChange={(e) =>
                    handleFilterChange(
                      'maxFee',
                      e.target.value ? Number(e.target.value) : undefined,
                    )
                  }
                  placeholder="Max"
                  className="w-full px-3 py-2 rounded-lg bg-[#0d1735] border border-white/10 focus:outline-none focus:ring-2 focus:ring-[#d5b47f]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                  Min Experience
                </label>
                <input
                  type="number"
                  value={filters.minExperience || ''}
                  onChange={(e) =>
                    handleFilterChange(
                      'minExperience',
                      e.target.value ? Number(e.target.value) : undefined,
                    )
                  }
                  placeholder="Years"
                  className="w-full px-3 py-2 rounded-lg bg-[#0d1735] border border-white/10 focus:outline-none focus:ring-2 focus:ring-[#d5b47f]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                  Min Rating
                </label>
                <input
                  type="number"
                  min="1"
                  max="5"
                  step="0.1"
                  value={filters.minRating || ''}
                  onChange={(e) =>
                    handleFilterChange(
                      'minRating',
                      e.target.value ? Number(e.target.value) : undefined,
                    )
                  }
                  placeholder="Rating"
                  className="w-full px-3 py-2 rounded-lg bg-[#0d1735] border border-white/10 focus:outline-none focus:ring-2 focus:ring-[#d5b47f]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                  Availability
                </label>
                <select
                  value={filters.availability || ''}
                  onChange={(e) =>
                    handleFilterChange(
                      'availability',
                      e.target.value || undefined,
                    )
                  }
                  className="w-full px-3 py-2 rounded-lg bg-[#0d1735] border border-white/10 focus:outline-none focus:ring-2 focus:ring-[#d5b47f]"
                >
                  <option value="">Any</option>
                  <option value="today">Today</option>
                  <option value="tomorrow">Tomorrow</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="bg-white/5 border border-white/10 animate-pulse rounded-lg h-48"
              />
            ))}
          </div>
        ) : filteredData && filteredData.length > 0 ? (
          <>
            <div className="mb-4 text-sm text-[var(--text-secondary)]">
              Found {filteredData.length} lawyers
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredData.map((lawyer) => (
                <LawyerCard key={lawyer._id} lawyer={lawyer} />
              ))}
            </div>
            {data.meta.total > data.meta.limit && (
              <div className="mt-8 flex justify-center gap-4 text-sm">
                <button
                  onClick={() =>
                    setFilters((prev) => ({
                      ...prev,
                      page: Math.max(1, (prev.page || 1) - 1),
                    }))
                  }
                  disabled={filters.page === 1}
                  className="px-4 py-2 border border-white/10 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:border-[#d5b47f]/40"
                >
                  Previous
                </button>
                <span className="px-4 py-2 text-[var(--text-secondary)]">
                  Page {filters.page} of{' '}
                  {Math.ceil(data.meta.total / data.meta.limit)}
                </span>
                <button
                  onClick={() =>
                    setFilters((prev) => ({
                      ...prev,
                      page: (prev.page || 1) + 1,
                    }))
                  }
                  disabled={
                    filters.page! >= Math.ceil(data.meta.total / data.meta.limit)
                  }
                  className="px-4 py-2 border border-white/10 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:border-[#d5b47f]/40"
                >
                  Next
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-12">
            <p className="text-[var(--text-muted)] text-lg">No lawyers found</p>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="mt-4 text-[#d5b47f] hover:text-[#f3e2c1]"
              >
                Clear filters to see all lawyers
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

