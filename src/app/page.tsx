'use client';

import Link from 'next/link';
import { Search, Shield, Clock, Star, ArrowRight } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import type { LawyerProfile } from '@/types';
import { LawyerCard } from '@/components/lawyer/LawyerCard';

export default function Home() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [featuredLawyers, setFeaturedLawyers] = useState<LawyerProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadFeatured = async () => {
      try {
        const result = await api.searchLawyers({ limit: 6, minRating: 4 });
        setFeaturedLawyers(result.data);
      } catch (error) {
        console.error('Failed to load featured lawyers:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadFeatured();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/lawyers?search=${encodeURIComponent(searchQuery)}`);
    } else {
      router.push('/lawyers');
    }
  };

  return (
    <div className="bg-transparent text-[var(--text-primary)]">
      {/* Hero Section */}
      <section className="brand-gradient">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center space-y-6">
            <p className="inline-flex items-center gap-2 text-sm tracking-[0.3em] uppercase text-[#b98958]">
              Trusted Legal Network
            </p>
            <h1 className="text-4xl md:text-6xl font-semibold leading-tight text-[var(--text-primary)]">
              Find your legal expert with{" "}
              <span className="text-[#d5b47f]">confidence</span>
            </h1>
            <p className="text-xl md:text-2xl text-[var(--text-secondary)]">
              Connect with qualified lawyers and book appointments effortlessly
            </p>
            <form onSubmit={handleSearch} className="max-w-2xl mx-auto">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-[var(--text-muted)]" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by specialization, city, or lawyer name..."
                    className="w-full pl-12 pr-4 py-4 rounded-2xl bg-white border border-white/60 text-[var(--text-primary)] placeholder:text-[var(--text-muted)] shadow-lg shadow-black/5 focus:outline-none focus:ring-2 focus:ring-[#d5b47f]"
                  />
                </div>
                <button
                  type="submit"
                  className="px-8 py-4 rounded-2xl font-semibold bg-gradient-to-r from-[#f3e2c1] via-[#e6c891] to-[#d5b47f] text-[#1b1205] hover:shadow-lg hover:shadow-[#d5b47f]/30 transition-all flex items-center justify-center"
                >
                  Search
                  <ArrowRight className="ml-2 h-5 w-5" />
                </button>
              </div>
            </form>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-[var(--background-muted)] border-y border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12">
            Why Choose Lawvera?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="brand-card p-8 text-center">
              <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 bg-white/5 border border-white/10">
                <Search className="h-8 w-8 text-[#d5b47f]" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Easy Search</h3>
              <p className="text-[var(--text-secondary)]">
                Find lawyers by specialization, location, experience, and ratings
              </p>
            </div>
            <div className="brand-card p-8 text-center">
              <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 bg-white/5 border border-white/10">
                <Clock className="h-8 w-8 text-[#46d3a1]" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Instant Booking</h3>
              <p className="text-[var(--text-secondary)]">
                Book appointments online with real-time availability
              </p>
            </div>
            <div className="brand-card p-8 text-center">
              <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 bg-white/5 border border-white/10">
                <Shield className="h-8 w-8 text-[#f3c969]" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Verified Lawyers</h3>
              <p className="text-[var(--text-secondary)]">
                All lawyers are verified and reviewed by clients
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Lawyers */}
      <section className="py-16 bg-[var(--surface-muted)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold">Featured Lawyers</h2>
            <Link
              href="/lawyers"
              className="text-[#d5b47f] font-medium flex items-center hover:text-[#f3e2c1]"
            >
              View All
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </div>
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="bg-white/5 animate-pulse rounded-lg h-48 border border-white/10"
                />
              ))}
            </div>
          ) : featuredLawyers.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredLawyers.map((lawyer) => (
                <LawyerCard key={lawyer._id} lawyer={lawyer} />
              ))}
            </div>
          ) : (
            <p className="text-center text-[var(--text-muted)] py-8">
              No featured lawyers available at the moment
            </p>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-[#d5b47f] via-[#c4945e] to-[#a56d3f] text-[#1b1205]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4">
          <h2 className="text-3xl font-bold">Are you a lawyer?</h2>
          <p className="text-xl text-[#2d1604]/80">
            Join Lawvera and grow your practice
          </p>
          <Link
            href="/auth/register?type=lawyer"
            className="inline-block px-8 py-4 rounded-2xl font-semibold bg-[var(--text-primary)] text-[#f7e4c5] border border-[#d5b47f]/40 transition-all hover:bg-[#3a240e]"
          >
            Register as Lawyer
          </Link>
        </div>
      </section>
    </div>
  );
}
